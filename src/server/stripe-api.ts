import Stripe from "stripe";
import { createHash } from "crypto";

let stripeClient: Stripe | undefined;
const processedSessions = new Set<string>();

type CheckoutBody = {
  unitQty?: unknown;
  includeSpare?: unknown;
  fbp?: unknown;
  fbc?: unknown;
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

function isOptionalItemTaxBehaviorError(error: unknown) {
  return (
    error instanceof Stripe.errors.StripeInvalidRequestError &&
    error.param === "optional_items[0][price]" &&
    typeof error.message === "string" &&
    error.message.includes("automatic tax")
  );
}

async function syncToEsp(payload: EspPurchasePayload) {
  console.info("ESP sync placeholder", {
    tag: "purchased",
    removeFromWaterReportNurture: true,
    ...payload,
  });
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function resolveOrigin(request: Request) {
  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    "www.agsoftener.com";
  return `https://${host}`;
}

async function sendMetaCapiPurchase({
  session,
  request,
}: {
  session: Stripe.Checkout.Session;
  request: Request;
}) {
  const pixelId = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;
  if (!pixelId || !accessToken) return;

  const email = session.customer_details?.email?.trim().toLowerCase();
  const zip = session.customer_details?.address?.postal_code?.trim();
  const fbp = session.metadata?.fbp || "";
  const fbc = session.metadata?.fbc || "";

  const userData: Record<string, unknown> = {
    client_ip_address:
      request.headers.get("x-forwarded-for") || "",
    client_user_agent: request.headers.get("user-agent") || "",
  };
  if (email) userData.em = [sha256(email)];
  if (zip) userData.zp = [sha256(zip)];
  if (fbp) userData.fbp = fbp;
  if (fbc) userData.fbc = fbc;

  const event = {
    event_name: "Purchase",
    event_time: Math.floor(Date.now() / 1000),
    event_id: session.id,
    action_source: "website",
    event_source_url: `${resolveOrigin(request)}/thanks?session_id=${encodeURIComponent(session.id)}`,
    user_data: userData,
    custom_data: {
      value:
        typeof session.amount_total === "number"
          ? session.amount_total / 100
          : 0,
      currency: "usd",
    },
  };

  const payload: Record<string, unknown> = { data: [event] };
  const testCode = process.env.META_TEST_EVENT_CODE;
  if (testCode) payload.test_event_code = testCode;

  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${encodeURIComponent(pixelId)}/events?access_token=${encodeURIComponent(accessToken)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    if (!response.ok) {
      const detail = await response.text();
      console.error(
        JSON.stringify({
          event: "meta_capi_error",
          status: response.status,
          detail: detail.slice(0, 500),
        }),
      );
    }
  } catch (err) {
    console.error(
      JSON.stringify({
        event: "meta_capi_exception",
        message: err instanceof Error ? err.message : String(err),
      }),
    );
  }
}

async function createCheckoutSession(request: Request) {
  const body = (await request.json().catch(() => ({}))) as CheckoutBody;
  const unitQty = body.unitQty;
  const includeSpare = body.includeSpare === true;
  const fbp = typeof body.fbp === "string" ? body.fbp : "";
  const fbc = typeof body.fbc === "string" ? body.fbc : "";

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
      fbp,
      fbc,
    },
  };

  if (!includeSpare) {
    params.optional_items = [{ price: sparePrice, quantity: 1 }];
  }

  let session: Stripe.Checkout.Session;

  try {
    session = await stripe.checkout.sessions.create(params);
  } catch (error) {
    if (!params.optional_items || !isOptionalItemTaxBehaviorError(error)) {
      throw error;
    }

    console.warn(
      "Stripe optional spare cross-sell skipped because the spare Price needs tax behavior configured.",
      error,
    );
    const { optional_items: _optionalItems, ...fallbackParams } = params;
    session = await stripe.checkout.sessions.create(fallbackParams);
  }

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

  const isRetry = processedSessions.has(session.id);
  if (isRetry) {
    console.warn("Webhook retry: session already processed in this runtime", { sessionId: session.id });
  }
  processedSessions.add(session.id);

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
  sendMetaCapiPurchase({ session, request }).catch(() => {});

  console.info("Stripe checkout completed", {
    eventId: stripeEvent.id,
    sessionId: session.id,
    paymentStatus: session.payment_status,
    amountTotal: session.amount_total,
    currency: session.currency,
    customerEmail: payload.email,
    sparePurchased,
    isRetry,
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
