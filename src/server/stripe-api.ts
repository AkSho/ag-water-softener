import Stripe from "stripe";

let stripeClient: Stripe | undefined;

type CheckoutBody = {
  unitQty?: unknown;
  includeSpare?: unknown;
};

type EspPurchasePayload = {
  email?: string | null;
  name?: string | null;
  phone?: string | null;
  shippingAddress?: Stripe.Address | null;
  sparePurchased: boolean;
  sessionId: string;
  eventId: string;
};

function json(payload: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(payload), {
    ...init,
    headers: {
      "content-type": "application/json",
      ...init?.headers,
    },
  });
}

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("Missing STRIPE_SECRET_KEY");

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey);
  }

  return stripeClient;
}

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1;
}

function getPdpCancelUrl(baseUrl: string, referrer?: string | null) {
  if (!referrer) return `${baseUrl}/`;

  try {
    const referrerUrl = new URL(referrer);
    const band = referrerUrl.searchParams.get("band");
    if (band === "hard" || band === "veryhard") {
      return `${baseUrl}/?band=${band}`;
    }
  } catch {
    return `${baseUrl}/`;
  }

  return `${baseUrl}/`;
}

function formatMoney(amount: number | null | undefined, currency?: string | null) {
  const value = typeof amount === "number" ? amount / 100 : 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency?.toUpperCase() || "USD",
  }).format(value);
}

function isSpareLineItem(item: Stripe.LineItem, sparePriceId: string) {
  return item.price?.id === sparePriceId;
}

async function syncToEsp(payload: EspPurchasePayload) {
  console.info("ESP sync placeholder", {
    tag: "purchased",
    removeFromWaterReportNurture: true,
    ...payload,
  });
}

async function createCheckoutSession(request: Request) {
  const body = (await request.json().catch(() => ({}))) as CheckoutBody;
  const unitQty = body.unitQty;
  const includeSpare = body.includeSpare === true;

  if (!isPositiveInteger(unitQty)) {
    return json({ error: "Invalid unit quantity" }, { status: 400 });
  }

  if (includeSpare && unitQty < 1) {
    return json({ error: "Spare requires a softener unit" }, { status: 400 });
  }

  const unitPrice = requiredEnv("STRIPE_PRICE_UNIT");
  const sparePrice = requiredEnv("STRIPE_PRICE_SPARE");
  const stripe = getStripe();
  const baseUrl = new URL(request.url).origin;
  const cancelUrl = getPdpCancelUrl(baseUrl, request.headers.get("referer"));
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    { price: unitPrice, quantity: unitQty },
  ];

  if (includeSpare) {
    lineItems.push({ price: sparePrice, quantity: 1 });
  }

  const params: Stripe.Checkout.SessionCreateParams & {
    optional_items?: Array<{ price: string; quantity: number }>;
  } = {
    mode: "payment",
    line_items: lineItems,
    automatic_tax: { enabled: true },
    shipping_address_collection: { allowed_countries: ["US"] },
    shipping_options: [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: { amount: 0, currency: "usd" },
          display_name: "Free shipping",
          delivery_estimate: {
            minimum: { unit: "business_day", value: 3 },
            maximum: { unit: "business_day", value: 7 },
          },
        },
      },
    ],
    phone_number_collection: { enabled: true },
    payment_intent_data: { statement_descriptor_suffix: "AGSOFTENER" },
    custom_text: {
      after_submit: {
        message:
          "Your statement will show GRNLABS* AGSOFTENER. 60-day money-back guarantee from the day it arrives.",
      },
    },
    allow_promotion_codes: false,
    success_url: `${baseUrl}/thanks?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
    metadata: {
      requested_unit_qty: String(unitQty),
      requested_include_spare: String(includeSpare),
      source: "ag_pdp",
    },
  };

  if (!includeSpare) {
    params.optional_items = [{ price: sparePrice, quantity: 1 }];
  }

  const session = await stripe.checkout.sessions.create(params);
  return json({ url: session.url });
}

async function getCheckoutSession(request: Request) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session_id");

  if (!sessionId) {
    return json({ verified: false, error: "Missing session_id" }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    const sparePrice = requiredEnv("STRIPE_PRICE_SPARE");
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    });
    const lineItems = await stripe.checkout.sessions.listLineItems(sessionId, {
      limit: 20,
      expand: ["data.price.product"],
    });
    const items = lineItems.data.map((item) => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity ?? 1,
      amountSubtotal: item.amount_subtotal,
      amountTotal: item.amount_total,
      formattedAmount: formatMoney(item.amount_total, item.currency),
      priceId: item.price?.id,
    }));
    const sparePurchased = lineItems.data.some((item) => isSpareLineItem(item, sparePrice));
    const requestedIncludeSpare = session.metadata?.requested_include_spare === "true";
    const bumpSource = sparePurchased
      ? requestedIncludeSpare
        ? "drawer"
        : "stripe_crosssell"
      : null;

    return json({
      verified: session.payment_status === "paid",
      id: session.id,
      paymentStatus: session.payment_status,
      amountTotal: session.amount_total,
      formattedTotal: formatMoney(session.amount_total, session.currency),
      currency: session.currency,
      items,
      sparePurchased,
      bumpSource,
      metadata: {
        requestedUnitQty: session.metadata?.requested_unit_qty,
        requestedIncludeSpare,
        source: session.metadata?.source,
      },
    });
  } catch (error) {
    console.error(error);
    return json({ verified: false, error: "Unable to verify session" }, { status: 404 });
  }
}

async function handleStripeWebhook(request: Request) {
  const stripe = getStripe();
  const webhookSecret = requiredEnv("STRIPE_WEBHOOK_SECRET");
  const signature = request.headers.get("stripe-signature");
  const rawBody = await request.text();

  if (!signature || !rawBody) {
    return json({ error: "Missing Stripe signature or body" }, { status: 400 });
  }

  let stripeEvent: Stripe.Event;

  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook verification failed", error);
    return json({ error: "Webhook verification failed" }, { status: 400 });
  }

  if (stripeEvent.type !== "checkout.session.completed") {
    return json({ received: true });
  }

  const session = stripeEvent.data.object as Stripe.Checkout.Session;
  const sparePrice = requiredEnv("STRIPE_PRICE_SPARE");
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    limit: 20,
    expand: ["data.price.product"],
  });
  const sparePurchased = lineItems.data.some((item) => isSpareLineItem(item, sparePrice));
  const payload: EspPurchasePayload = {
    email: session.customer_details?.email,
    name: session.customer_details?.name,
    phone: session.customer_details?.phone,
    shippingAddress: session.customer_details?.address,
    sparePurchased,
    sessionId: session.id,
    eventId: stripeEvent.id,
  };

  await syncToEsp(payload);

  console.info("Stripe checkout completed", {
    eventId: stripeEvent.id,
    sessionId: session.id,
    paymentStatus: session.payment_status,
    amountTotal: session.amount_total,
    currency: session.currency,
    customerEmail: payload.email,
    sparePurchased,
    lineItems: lineItems.data.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      priceId: item.price?.id,
      amountTotal: item.amount_total,
    })),
  });

  return json({ received: true });
}

export async function handleStripeApi(request: Request) {
  const url = new URL(request.url);

  if (url.pathname === "/api/checkout" && request.method === "POST") {
    return createCheckoutSession(request);
  }

  if (url.pathname === "/api/checkout-session" && request.method === "GET") {
    return getCheckoutSession(request);
  }

  if (url.pathname === "/api/stripe/webhook" && request.method === "POST") {
    return handleStripeWebhook(request);
  }

  return undefined;
}
