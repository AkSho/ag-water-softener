import Stripe from "stripe";
import { createHash } from "crypto";
import {
  sendEmail,
  buildConfirmationEmail,
  buildRecoveryEmail,
  formatPromiseDate,
  extractFirstName,
} from "./email";
import { hasRecentRecovery, logRecoverySend } from "./recovery-log";
import { writeOrderRow } from "./orders-log";

let stripeClient: Stripe | undefined;
const processedSessions = new Set<string>();

type CheckoutBody = {
  unitQty?: unknown;
  includeSpare?: unknown;
  fbp?: unknown;
  fbc?: unknown;
  ft_src?: unknown;
  ft_ref?: unknown;
  ft_lp?: unknown;
  ft_ts?: unknown;
  ft_mlp?: unknown;
  ft_utm?: unknown;
  ft_gclid?: unknown;
  ft_msclkid?: unknown;
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

function ftString(value: unknown): string {
  return typeof value === "string" ? value.slice(0, 200) : "";
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

function resolveOrigin(_request: Request) {
  return "https://agsoftener.com";
}

// ─── Part B: Meta CAPI Purchase (enriched) ─────────────────────────────────────

async function sendMetaCapiPurchase({
  session,
  request,
  lineItems,
}: {
  session: Stripe.Checkout.Session;
  request: Request;
  lineItems?: Stripe.ApiList<Stripe.LineItem>;
}) {
  const pixelId = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;
  if (!pixelId || !accessToken) return;

  const email = session.customer_details?.email?.trim().toLowerCase();
  const name = session.customer_details?.name?.trim();
  const zip = session.customer_details?.address?.postal_code?.trim();
  const phone = session.customer_details?.phone?.trim();
  const fbp = session.metadata?.fbp || "";
  const fbc = session.metadata?.fbc || "";

  const userData: Record<string, unknown> = {
    client_ip_address: request.headers.get("x-forwarded-for") || "",
    client_user_agent: request.headers.get("user-agent") || "",
  };
  if (email) userData.em = [sha256(email)];
  if (zip) userData.zp = [sha256(zip)];
  if (phone) userData.ph = [sha256(phone.replace(/\D/g, ""))];
  if (fbp) userData.fbp = fbp;
  if (fbc) userData.fbc = fbc;

  // Hash first and last name separately
  if (name) {
    const parts = name.split(/\s+/);
    if (parts[0]) userData.fn = [sha256(parts[0].toLowerCase())];
    if (parts.length > 1) userData.ln = [sha256(parts[parts.length - 1].toLowerCase())];
  }

  // Compute quantity from line items
  let totalQuantity = 1;
  if (lineItems?.data) {
    totalQuantity = lineItems.data.reduce((sum, item) => sum + (item.quantity ?? 1), 0);
  }

  const event = {
    event_name: "Purchase",
    event_time: Math.floor(Date.now() / 1000),
    event_id: session.id,
    action_source: "website" as const,
    event_source_url: `${resolveOrigin(request)}/thanks?session_id=${encodeURIComponent(session.id)}`,
    user_data: userData,
    custom_data: {
      value:
        typeof session.amount_total === "number"
          ? session.amount_total / 100
          : 0,
      currency: "usd",
      num_items: totalQuantity,
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

// ─── Part A: Confirmation email ─────────────────────────────────────────────────

async function sendConfirmationEmail(session: Stripe.Checkout.Session) {
  const email = session.customer_details?.email;
  if (!email) {
    console.warn("No email on checkout session; skipping confirmation", { sessionId: session.id });
    return;
  }

  // Idempotency: check Stripe metadata
  if (session.metadata?.confirmation_sent === "true") {
    console.info("Confirmation already sent (metadata flag)", { sessionId: session.id });
    return;
  }

  const firstName = extractFirstName(session.customer_details?.name);
  const promiseDate = formatPromiseDate(new Date());
  const { subject, text } = buildConfirmationEmail({ firstName, promiseDate });

  try {
    await sendEmail({ to: email, subject, text });
    console.info("Confirmation email sent", { sessionId: session.id, email });

    // Mark as sent in Stripe metadata for durable idempotency
    const stripe = getStripe();
    await stripe.checkout.sessions.update(session.id, {
      metadata: { ...session.metadata, confirmation_sent: "true" },
    }).catch((err) => {
      console.warn("Could not update session metadata", { sessionId: session.id, error: err instanceof Error ? err.message : String(err) });
    });
  } catch (err) {
    console.error("Confirmation email failed", {
      sessionId: session.id,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

// ─── Part C: Abandoned checkout recovery ────────────────────────────────────────

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  const email = session.customer_details?.email?.trim().toLowerCase();
  if (!email) {
    console.info("Expired session has no email; skipping recovery", { sessionId: session.id });
    return;
  }

  // Check for completed order: if they completed checkout for this email, skip
  // (In-memory processedSessions only covers this runtime; Stripe metadata check is more reliable)

  // Dedup: one recovery per email per 30 days via Airtable
  const recentlySent = await hasRecentRecovery(email);
  if (recentlySent) {
    console.info("Recovery email already sent to this email in last 30 days", { email, sessionId: session.id });
    return;
  }

  const firstName = extractFirstName(session.customer_details?.name);

  // Stripe recovery URL if available, else PDP
  let checkoutOrPdpLink = "https://agsoftener.com/";
  if (session.url) {
    checkoutOrPdpLink = session.url;
  } else if (session.after_expiration?.recovery?.url) {
    checkoutOrPdpLink = session.after_expiration.recovery.url;
  }

  const { subject, text } = buildRecoveryEmail({ firstName, checkoutOrPdpLink });

  try {
    await sendEmail({ to: email, subject, text });
    console.info("Recovery email sent", { sessionId: session.id, email });

    await logRecoverySend({
      email,
      session_id: session.id,
      sent_at: new Date().toISOString(),
      first_name: firstName,
      link_sent: checkoutOrPdpLink,
    });
  } catch (err) {
    console.error("Recovery email failed", {
      sessionId: session.id,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

// ─── Checkout creation ──────────────────────────────────────────────────────────

async function createCheckoutSession(request: Request) {
  const body = (await request.json().catch(() => ({}))) as CheckoutBody;
  const unitQty = body.unitQty;
  const includeSpare = body.includeSpare === true;
  const fbp = typeof body.fbp === "string" ? body.fbp : "";
  const fbc = typeof body.fbc === "string" ? body.fbc : "";

  if (!isPositiveInteger(unitQty)) {
    return json({ error: "Invalid unit quantity" }, { status: 400 });
  }

  if (unitQty > 25) {
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
    customer_creation: "always",
    shipping_address_collection: { allowed_countries: ["US"] },
    shipping_options: [
      { shipping_rate: "shr_1U44sIAzOIlBktzoppQFhxkl" },
    ],
    phone_number_collection: { enabled: true },
    payment_intent_data: {
      statement_descriptor_suffix: "AGSOFTENER",
      setup_future_usage: "off_session",
    },
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
      ft_src: ftString(body.ft_src),
      ft_ref: ftString(body.ft_ref),
      ft_lp: ftString(body.ft_lp),
      ft_ts: ftString(body.ft_ts),
      ft_mlp: ftString(body.ft_mlp),
      ft_utm: ftString(body.ft_utm),
      ft_gclid: ftString(body.ft_gclid),
      ft_msclkid: ftString(body.ft_msclkid),
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

// ─── Checkout session retrieval ─────────────────────────────────────────────────

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

    // GCR estimated delivery: session creation + 15 days, YYYY-MM-DD
    let estimatedDeliveryDate: string | undefined;
    if (typeof session.created === "number") {
      const d = new Date(session.created * 1000);
      d.setDate(d.getDate() + 15);
      estimatedDeliveryDate = d.toISOString().slice(0, 10);
    }

    return json({
      verified: session.payment_status === "paid",
      id: session.id,
      paymentStatus: session.payment_status,
      amountTotal: session.amount_total,
      formattedTotal: formatMoney(session.amount_total, session.currency),
      currency: session.currency,
      customerEmail: session.customer_details?.email ?? undefined,
      shippingCountry: session.collected_information?.shipping_details?.address?.country ?? undefined,
      estimatedDeliveryDate,
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

// ─── Webhook handler ────────────────────────────────────────────────────────────

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

  // ─── checkout.session.completed ───
  if (stripeEvent.type === "checkout.session.completed") {
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

    // Part A + B + D: await all before returning so the runtime stays alive
    const orderTs = new Date().toISOString();
    const [emailResult, capiResult, ordersResult] = await Promise.allSettled([
      sendConfirmationEmail(session),
      sendMetaCapiPurchase({ session, request, lineItems }),
      writeOrderRow({
        email: session.customer_details?.email || "",
        name: session.customer_details?.name || "",
        amount: typeof session.amount_total === "number" ? session.amount_total / 100 : 0,
        stripeSessionId: session.id,
        eventId: stripeEvent.id,
        orderTs,
        ftSrc: session.metadata?.ft_src || "",
        ftRef: session.metadata?.ft_ref || "",
        ftLp: session.metadata?.ft_lp || "",
        ftMlp: session.metadata?.ft_mlp || "",
        ftTs: session.metadata?.ft_ts || "",
        ftUtm: session.metadata?.ft_utm || "",
        ftGclid: session.metadata?.ft_gclid || "",
        ftMsclkid: session.metadata?.ft_msclkid || "",
      }),
    ]);

    console.info("Webhook post-tasks settled", {
      sessionId: session.id,
      email: emailResult.status === "fulfilled" ? "sent" : `failed: ${(emailResult as PromiseRejectedResult).reason}`,
      capi: capiResult.status === "fulfilled" ? "sent" : `failed: ${(capiResult as PromiseRejectedResult).reason}`,
      orders_row: ordersResult.status === "fulfilled"
        ? (ordersResult.value as { ok: boolean; id?: string; error?: string; attempt?: number }).ok
          ? `written: ${(ordersResult.value as { id?: string }).id} (attempt ${(ordersResult.value as { attempt?: number }).attempt})`
          : `failed: ${(ordersResult.value as { error?: string }).error} (attempt ${(ordersResult.value as { attempt?: number }).attempt})`
        : `exception: ${(ordersResult as PromiseRejectedResult).reason}`,
    });

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

  // ─── checkout.session.expired (Part C) ───
  if (stripeEvent.type === "checkout.session.expired") {
    const session = stripeEvent.data.object as Stripe.Checkout.Session;

    console.info("Stripe checkout expired", {
      sessionId: session.id,
      customerEmail: session.customer_details?.email,
    });

    handleCheckoutExpired(session).catch((err) => {
      console.error("Recovery email handler error", err);
    });

    return json({ received: true });
  }

  return json({ received: true });
}

// ─── OTO: one-click Spares Kit offer ─────────────────────────────────────────────

const KIT_PAYMENT_LINK = "https://buy.stripe.com/9B600iep88vr4le4fO1sQ0H";

async function handleOtoAccept(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { session_id?: unknown };
    const sessionId = typeof body.session_id === "string" ? body.session_id : "";

    if (!sessionId) {
      return json({ ok: false, fallback: true, url: KIT_PAYMENT_LINK }, { status: 200 });
    }

    const stripe = getStripe();

    // 1. Retrieve session, verify paid
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    });

    if (session.payment_status !== "paid") {
      return json({ ok: false, fallback: true, url: KIT_PAYMENT_LINK });
    }

    // 2. Idempotency: check for prior OTO charge on this session
    const priorCharges = await stripe.paymentIntents.search({
      query: `metadata["parent_session"]:"${sessionId}" metadata["source"]:"ag_oto_kit"`,
      limit: 1,
    });

    if (priorCharges.data.length > 0) {
      const prior = priorCharges.data[0];
      if (prior.status === "succeeded") {
        return json({ ok: true, already: true });
      }
    }

    // 3. Get customer + payment method from session's PaymentIntent
    const pi = session.payment_intent;
    if (!pi || typeof pi === "string") {
      return json({ ok: false, fallback: true, url: KIT_PAYMENT_LINK });
    }

    const customerId = typeof pi.customer === "string" ? pi.customer : pi.customer?.id;
    const paymentMethodId = typeof pi.payment_method === "string" ? pi.payment_method : pi.payment_method?.id;

    if (!customerId || !paymentMethodId) {
      return json({ ok: false, fallback: true, url: KIT_PAYMENT_LINK });
    }

    // 4. Create + confirm PaymentIntent for $39
    const otoPi = await stripe.paymentIntents.create({
      amount: 3900,
      currency: "usd",
      customer: customerId,
      payment_method: paymentMethodId,
      off_session: true,
      confirm: true,
      statement_descriptor_suffix: "AGSOFTENER",
      metadata: {
        source: "ag_oto_kit",
        parent_session: sessionId,
      },
    });

    if (otoPi.status === "succeeded") {
      return json({ ok: true });
    }

    // requires_action or requires_confirmation — send fallback
    return json({ ok: false, fallback: true, url: KIT_PAYMENT_LINK });
  } catch (err: unknown) {
    // Card declined (authentication_required, card_declined, etc.)
    if (
      err instanceof Stripe.errors.StripeCardError ||
      (err instanceof Stripe.errors.StripeInvalidRequestError &&
        typeof err.message === "string" &&
        err.message.includes("authentication"))
    ) {
      return json({ ok: false, fallback: true, url: KIT_PAYMENT_LINK });
    }

    console.error("OTO accept error", {
      error: err instanceof Error ? err.message : String(err),
    });
    return json({ ok: false, fallback: true, url: KIT_PAYMENT_LINK });
  }
}

// ─── Router ─────────────────────────────────────────────────────────────────────

export async function handleStripeApi(request: Request) {
  const url = new URL(request.url);

  if (url.pathname === "/api/checkout" && request.method === "POST") {
    return createCheckoutSession(request);
  }

  if (url.pathname === "/api/checkout-session" && request.method === "GET") {
    return getCheckoutSession(request);
  }

  if (url.pathname === "/api/oto-accept" && request.method === "POST") {
    return handleOtoAccept(request);
  }

  if (url.pathname === "/api/stripe/webhook" && request.method === "POST") {
    return handleStripeWebhook(request);
  }

  return undefined;
}
