// src/server/records.ts
// Single Airtable access module. All reads and writes go through here.
// This is the only file that changes when the store moves to Postgres.

const ORDERS_TABLE = "tblQt2grL7iJ2ysNh";
const SUBMISSIONS_TABLE = "tbl3ScW6QPW7Mnl4b";
const RECOVERY_TABLE = "tblryjyqduMkiT0l5";
const SURVEY_TABLE = "tbl6cWi6HfGWSFLl2";

// ─── Config ──────────────────────────────────────────────────────────────────

interface AirtableConfig {
  apiKey: string;
  baseId: string;
}

function getConfig(): AirtableConfig {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!apiKey || !baseId)
    throw new Error("AIRTABLE_API_KEY and AIRTABLE_BASE_ID required");
  return { apiKey, baseId };
}

function configOrNull(): AirtableConfig | null {
  try {
    return getConfig();
  } catch {
    return null;
  }
}

async function airtableFetch(
  config: AirtableConfig,
  table: string,
  path: string = "",
  init?: RequestInit,
): Promise<Response> {
  const base = `https://api.airtable.com/v0/${encodeURIComponent(config.baseId)}/${encodeURIComponent(table)}`;
  return fetch(`${base}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
}

// Retry wrapper: retries once on 5xx after 2.5s
async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.warn(`${label} attempt 1 failed, retrying: ${err instanceof Error ? err.message : String(err)}`);
    await new Promise((r) => setTimeout(r, 2500));
    return fn();
  }
}

// ─── Verdict logic (locked) ──────────────────────────────────────────────────

export interface VerdictInput {
  gclid: string;
  msclkid: string;
  fbclid: string;
  ftRef: string;
  ftUtm: string;
  ftLp: string;
}

export function deriveVerdict(input: VerdictInput): string {
  if (input.gclid) return "google-paid";
  if (input.msclkid) return "microsoft-paid";

  // Meta paid: fbclid present, or UTM signals paid Meta traffic
  if (input.fbclid) return "meta-paid";
  {
    let utmSource = "";
    let utmMedium = "";
    try {
      const parsed = JSON.parse(input.ftUtm || "{}");
      utmSource = (parsed.utm_source || "").toLowerCase();
      utmMedium = (parsed.utm_medium || "").toLowerCase();
    } catch { /* not valid JSON */ }
    const metaSources = new Set(["fb", "ig", "meta", "facebook", "instagram"]);
    const paidMediums = new Set(["paid", "cpc", "paid_social"]);
    if (metaSources.has(utmSource) && paidMediums.has(utmMedium)) return "meta-paid";
  }

  // Meta organic: referrer from Facebook/Instagram without click ID or paid UTM
  const refLower = (input.ftRef || "").toLowerCase();
  if (refLower.includes("facebook") || refLower.includes("instagram"))
    return "meta-organic";

  // AI sources
  const utmLower = (input.ftUtm || "").toLowerCase();
  const refOrUtm = refLower + " " + utmLower;

  if (refOrUtm.includes("chatgpt")) return "chatgpt";
  if (refOrUtm.includes("perplexity")) return "perplexity";
  if (refOrUtm.includes("claude")) return "claude";
  if (refOrUtm.includes("gemini") || refOrUtm.includes("bard")) return "gemini";
  if (refOrUtm.includes("copilot") || refOrUtm.includes("bing")) return "bing";

  if (refLower.includes("myapartmentwaterquality")) return "myapt";
  if (refLower.includes("google.")) return "google-organic";

  const lpLower = (input.ftLp || "").toLowerCase();
  if (lpLower.includes("srsltid")) return "google-merchant";

  return "direct";
}

export function deriveToolTouch(ftRef: string, ftLp: string): boolean {
  const ref = (ftRef || "").toLowerCase();
  const lp = (ftLp || "").toLowerCase();
  return ref.includes("myapartmentwaterquality") || lp.includes("xd=myapt");
}

function daysBetween(isoA: string, isoB: string): number | null {
  try {
    const a = new Date(isoA).getTime();
    const b = new Date(isoB).getTime();
    if (isNaN(a) || isNaN(b)) return null;
    return Math.round(Math.abs(b - a) / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}

function promiseDate(orderTs: string, shippingMethod?: string): string {
  const d = new Date(orderTs);
  d.setDate(d.getDate() + (shippingMethod === "express" ? 10 : 18));
  return d.toISOString().split("T")[0];
}

// ─── Submissions lookup ──────────────────────────────────────────────────────

async function checkToolTouchSubmissions(
  config: AirtableConfig,
  email: string,
): Promise<boolean> {
  const safeEmail = email.replace(/'/g, "\\'");
  const formula = encodeURIComponent(`{Email Address}='${safeEmail}'`);
  try {
    const res = await airtableFetch(
      config,
      SUBMISSIONS_TABLE,
      `?filterByFormula=${formula}&maxRecords=1`,
    );
    if (!res.ok) return false;
    const data = (await res.json()) as { records: unknown[] };
    return data.records.length > 0;
  } catch {
    return false;
  }
}

// ─── Order number generation ─────────────────────────────────────────────────

const ORDER_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

function generateOrderNumber(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += ORDER_ALPHABET[Math.floor(Math.random() * ORDER_ALPHABET.length)];
  }
  return `AG-${code}`;
}

async function isOrderNumberUnique(
  config: AirtableConfig,
  orderNumber: string,
): Promise<boolean> {
  const formula = encodeURIComponent(`{OrderNumber}='${orderNumber}'`);
  const res = await airtableFetch(
    config,
    ORDERS_TABLE,
    `?filterByFormula=${formula}&maxRecords=1`,
  );
  if (!res.ok) return false;
  const data = (await res.json()) as { records: unknown[] };
  return data.records.length === 0;
}

async function generateUniqueOrderNumber(
  config: AirtableConfig,
): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const num = generateOrderNumber();
    if (await isOrderNumberUnique(config, num)) return num;
  }
  throw new Error("Failed to generate unique order number after 5 attempts");
}

// ─── Orders: types ───────────────────────────────────────────────────────────

export interface UpsertOrderInput {
  stripeSessionId: string;
  paymentIntentId: string;
  email: string;
  name: string;
  orderTs: string;
  amount: number;
  unitQty: number;
  bumpTaken: boolean;
  shipName: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  ftSrc: string;
  ftRef: string;
  ftLp: string;
  ftMlp: string;
  ftTs: string;
  ftUtm: string;
  gclid: string;
  msclkid: string;
  fbclid: string;
  itemType: string;
  repeatCustomer: boolean;
  shippingMethod: string;
}

export interface UpsertResult {
  ok: boolean;
  id?: string;
  error?: string;
  created?: boolean;
  orderNumber?: string;
}

// Fields that should never be overwritten if already set
const PRESERVE_ON_UPDATE = new Set([
  "OrderNumber",
  "Tracking",
  "Carrier",
  "ShippedTS",
  "Delivered",
  "CheckInTS",
  "ConfirmationSentTS",
  "SentToSupplierTS",
  "Notify",
  "OTOAccepted",
  "OTOAmount",
  "Refunded",
  "RefundTS",
  "Status",
]);

// ─── Orders: CRUD helpers ────────────────────────────────────────────────────

interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
}

async function findOrderBySessionId(
  config: AirtableConfig,
  sessionId: string,
): Promise<AirtableRecord | null> {
  const formula = encodeURIComponent(`{StripeSessionId}='${sessionId}'`);
  const res = await airtableFetch(
    config,
    ORDERS_TABLE,
    `?filterByFormula=${formula}&maxRecords=1`,
  );
  if (!res.ok) return null;
  const data = (await res.json()) as { records: AirtableRecord[] };
  return data.records[0] || null;
}

async function createRecord(
  config: AirtableConfig,
  table: string,
  fields: Record<string, unknown>,
): Promise<UpsertResult> {
  const res = await airtableFetch(config, table, "", {
    method: "POST",
    body: JSON.stringify({ records: [{ fields }] }),
  });
  if (!res.ok) {
    const detail = await res.text();
    return { ok: false, error: `airtable_${res.status}: ${detail.slice(0, 300)}` };
  }
  const data = (await res.json()) as { records: AirtableRecord[] };
  return { ok: true, id: data.records?.[0]?.id, created: true };
}

async function patchRecord(
  config: AirtableConfig,
  table: string,
  recordId: string,
  fields: Record<string, unknown>,
): Promise<UpsertResult> {
  const res = await airtableFetch(config, table, `/${recordId}`, {
    method: "PATCH",
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    const detail = await res.text();
    return { ok: false, error: `airtable_${res.status}: ${detail.slice(0, 300)}` };
  }
  const data = (await res.json()) as AirtableRecord;
  return { ok: true, id: data.id, created: false };
}

// ─── Orders: upsert ─────────────────────────────────────────────────────────

export async function upsertOrder(
  input: UpsertOrderInput,
): Promise<UpsertResult> {
  const config = configOrNull();
  if (!config) return { ok: false, error: "airtable_not_configured" };

  const toolTouchSubmissions = input.email
    ? await checkToolTouchSubmissions(config, input.email.trim().toLowerCase())
    : false;

  const toolTouch =
    deriveToolTouch(input.ftRef, input.ftLp) || toolTouchSubmissions;

  const verdict = deriveVerdict({
    gclid: input.gclid,
    msclkid: input.msclkid,
    fbclid: input.fbclid,
    ftRef: input.ftRef,
    ftUtm: input.ftUtm,
    ftLp: input.ftLp,
  });

  const dtp = input.ftTs
    ? daysBetween(input.ftTs, input.orderTs)
    : null;

  const fields: Record<string, unknown> = {
    StripeSessionId: input.stripeSessionId,
    PaymentIntentId: input.paymentIntentId,
    Email: input.email || "",
    Name: input.name || "",
    OrderTS: input.orderTs,
    Amount: input.amount,
    UnitQty: input.unitQty,
    BumpTaken: input.bumpTaken,
    ItemType: input.itemType,
    RepeatCustomer: input.repeatCustomer,
    ShippingMethod: input.shippingMethod || "standard",
    OTOAccepted: false,
    OTOAmount: 0,
    Refunded: false,
    ShipName: input.shipName,
    Address1: input.address1,
    Address2: input.address2,
    City: input.city,
    State: input.state,
    Zip: input.zip,
    Phone: input.phone,
    FT_Source: input.ftSrc || "",
    FT_Referrer: input.ftRef || "",
    FT_LandingPage: input.ftLp || "",
    FT_MyaptPage: input.ftMlp || "",
    FT_Timestamp: input.ftTs || "",
    FT_UTM: input.ftUtm || "",
    FT_Gclid: input.gclid || "",
    FT_Msclkid: input.msclkid || "",
    FT_Fbclid: input.fbclid || "",
    Verdict: verdict,
    DaysToPurchase: dtp,
    ToolTouch: toolTouch,
    PromisedBy: promiseDate(input.orderTs, input.shippingMethod),
    Status: "paid",
  };

  const existing = await findOrderBySessionId(config, input.stripeSessionId);

  if (existing) {
    // OrderTS and Amount always take Stripe values (source of truth)
    const STRIPE_SOURCE_OF_TRUTH = new Set(["OrderTS", "Amount"]);
    const updateFields: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(fields)) {
      if (STRIPE_SOURCE_OF_TRUTH.has(k)) {
        updateFields[k] = v;
        continue;
      }
      const old = existing.fields[k];
      const oldPresent = old != null && old !== "" && old !== false;
      // Never overwrite fulfillment fields that are already set
      if (PRESERVE_ON_UPDATE.has(k) && oldPresent) continue;
      // Never overwrite any non-empty existing value with an empty new value
      const newEmpty = v == null || v === "" || v === false || v === 0;
      if (oldPresent && newEmpty) continue;
      updateFields[k] = v;
    }

    // Re-derive verdict from merged values (existing wins when new is empty)
    const mergedRef = (updateFields.FT_Referrer as string) ?? (existing.fields.FT_Referrer as string) ?? "";
    const mergedUtm = (updateFields.FT_UTM as string) ?? (existing.fields.FT_UTM as string) ?? "";
    const mergedLp = (updateFields.FT_LandingPage as string) ?? (existing.fields.FT_LandingPage as string) ?? "";
    const mergedGclid = (updateFields.FT_Gclid as string) ?? (existing.fields.FT_Gclid as string) ?? "";
    const mergedMsclkid = (updateFields.FT_Msclkid as string) ?? (existing.fields.FT_Msclkid as string) ?? "";
    const mergedFbclid = (updateFields.FT_Fbclid as string) ?? (existing.fields.FT_Fbclid as string) ?? "";
    const mergedVerdict = deriveVerdict({
      gclid: mergedGclid,
      msclkid: mergedMsclkid,
      fbclid: mergedFbclid,
      ftRef: mergedRef,
      ftUtm: mergedUtm,
      ftLp: mergedLp,
    });
    updateFields.Verdict = mergedVerdict;
    updateFields.ToolTouch = deriveToolTouch(mergedRef, mergedLp) || toolTouchSubmissions;

    const result = await withRetry(
      () => patchRecord(config, ORDERS_TABLE, existing.id, updateFields),
      "upsert_order_update",
    );
    return { ...result, orderNumber: (existing.fields.OrderNumber as string) || "" };
  }

  // Create path: generate unique AG- order number
  const orderNumber = await generateUniqueOrderNumber(config);
  fields.OrderNumber = orderNumber;

  const result = await withRetry(
    () => createRecord(config, ORDERS_TABLE, fields),
    "upsert_order_create",
  );
  return { ...result, orderNumber };
}

// ─── Orders: refund ──────────────────────────────────────────────────────────

export async function markRefunded(
  stripeSessionId: string,
  refundTs: string,
): Promise<UpsertResult> {
  const config = getConfig();
  const existing = await findOrderBySessionId(config, stripeSessionId);
  if (!existing) return { ok: false, error: "order_not_found" };

  return patchRecord(config, ORDERS_TABLE, existing.id, {
    Refunded: true,
    RefundTS: refundTs,
    Status: "cancelled",
  });
}

// ─── Orders: OTO update ─────────────────────────────────────────────────────

export async function updateOto(
  stripeSessionId: string,
  amount: number,
): Promise<UpsertResult> {
  const config = getConfig();
  const existing = await findOrderBySessionId(config, stripeSessionId);
  if (!existing) return { ok: false, error: "order_not_found" };

  return patchRecord(config, ORDERS_TABLE, existing.id, {
    OTOAccepted: true,
    OTOAmount: amount,
    ItemType: "unit+kit",
  });
}

// ─── Tracking validation ─────────────────────────────────────────────────────

interface TrackingValidation {
  valid: boolean;
  carrier?: string;
  error?: string;
}

export function validateTracking(tracking: string): TrackingValidation {
  const cleaned = tracking.replace(/\s/g, "");

  // DHL: 10 pure digits, or JD + 18 digits (11-char JD-prefixed form is JD + 9 digits)
  const jdMatch = cleaned.match(/^JD(\d{9,18})$/i);
  if (jdMatch) return { valid: true, carrier: "DHL" };
  if (/^\d{10}$/.test(cleaned)) return { valid: true, carrier: "DHL" };

  // Yun Express: YT followed by 16 digits, case-insensitive
  if (/^YT\d{16}$/i.test(cleaned)) return { valid: true, carrier: "Yun Express" };

  // UPS: 1Z followed by 16 alphanumeric characters (18 total, case-insensitive)
  if (/^1Z[A-Z0-9]{16}$/i.test(cleaned)) return { valid: true, carrier: "UPS" };

  if (!/^\d+$/.test(cleaned)) return { valid: false, error: "non-numeric" };

  // USPS: 20-22 digits starting with 9 (check before FedEx to avoid overlap)
  if (cleaned.length >= 20 && cleaned.length <= 22 && cleaned.startsWith("9")) {
    return { valid: true, carrier: "USPS" };
  }

  // FedEx: 12, 15, 20, or 22 digits
  if ([12, 15, 20, 22].includes(cleaned.length)) {
    return { valid: true, carrier: "FedEx" };
  }

  return { valid: false, error: `invalid format: ${cleaned.length} digits` };
}

// ─── Supplier intake ─────────────────────────────────────────────────────────

export function buildIntakeBlock(fields: Record<string, unknown>): string {
  const orderNumber = (fields.OrderNumber as string) || (fields.StripeSessionId as string || "").slice(-8);
  const orderTs = fields.OrderTS as string || "";
  const date = orderTs ? new Date(orderTs).toISOString().slice(0, 10) : "";
  const qty = fields.UnitQty as number || 1;
  const bump = fields.BumpTaken as boolean;
  const oto = fields.OTOAccepted as boolean;

  let productLine = `${qty} x AG Water Softener`;
  if (oto) productLine += " + Spares Kit (OTO)";
  else if (bump) productLine += " + Spare Cartridge (bump)";

  const method = (fields.ShippingMethod as string || "standard").toUpperCase();
  let shippingLine = `Shipping: ${method}`;
  if (method === "EXPRESS" && bump) shippingLine = "Shipping: EXPRESS (with spare filter)";

  const lines = [
    `Order ${orderNumber} · ${date}`,
    productLine,
    shippingLine,
    fields.ShipName || fields.Name || "",
    fields.Address1 || "",
    fields.Address2 || "",
    `${fields.City || ""}, ${fields.State || ""} ${fields.Zip || ""}`.trim(),
    fields.Phone || "",
  ];

  return lines.filter((l) => l && (l as string).trim()).join("\n");
}

export async function generateIntake(
  recordId: string,
  fields: Record<string, unknown>,
  sendFn?: (params: { to: string; subject: string; text: string }) => Promise<void>,
): Promise<UpsertResult> {
  const config = getConfig();
  const intake = buildIntakeBlock(fields);

  // Always land on intake-ready. The batch step advances to sent-to-supplier.
  // SUPPLIER_EMAIL path kept for manual/legacy use.
  const supplierEmail = process.env.SUPPLIER_EMAIL;
  if (supplierEmail && sendFn) {
    await sendFn({
      to: supplierEmail,
      subject: `New order ${(fields.OrderNumber as string) || (fields.StripeSessionId as string || "").slice(-8)}`,
      text: intake,
    });
    return patchRecord(config, ORDERS_TABLE, recordId, {
      IntakeBlock: intake,
      SentToSupplier: true,
      SentToSupplierTS: true,
      Status: "sent-to-supplier",
    });
  }

  return patchRecord(config, ORDERS_TABLE, recordId, {
    IntakeBlock: intake,
    Status: "intake-ready",
  });
}

export async function markSentToSupplier(
  recordId: string,
): Promise<UpsertResult> {
  const config = getConfig();
  return patchRecord(config, ORDERS_TABLE, recordId, {
    SentToSupplier: true,
    SentToSupplierTS: true,
    Status: "sent-to-supplier",
  });
}

// ─── Fulfillment: setTracking ────────────────────────────────────────────────

export async function setTracking(
  recordId: string,
  tracking: string,
): Promise<UpsertResult & { carrier?: string; validationError?: string }> {
  const validation = validateTracking(tracking);
  if (!validation.valid) {
    return { ok: false, error: "invalid_tracking", validationError: validation.error };
  }

  const config = getConfig();
  return {
    ...(await patchRecord(config, ORDERS_TABLE, recordId, {
      Tracking: tracking.replace(/\s/g, ""),
      Carrier: validation.carrier,
      Status: "ready-to-notify",
    })),
    carrier: validation.carrier,
  };
}

// ─── Fulfillment: markNotified (shipping confirmation) ───────────────────────

export async function markNotified(
  recordId: string,
  fields: Record<string, unknown>,
  sendFn: (params: { to: string; subject: string; text: string }) => Promise<void>,
  buildFn: (params: { firstName: string; carrier: string; tracking: string; promisedBy: string }) => { subject: string; text: string },
): Promise<UpsertResult & { emailPreview?: { subject: string; text: string } }> {
  // Idempotency: if already sent, do nothing
  if (fields.ConfirmationSentTS) {
    return { ok: true, id: recordId, error: "already_sent" };
  }

  const email = fields.Email as string;
  if (!email) return { ok: false, error: "no_email" };

  const firstName = extractName(fields.Name as string);
  const carrier = (fields.Carrier as string) || "FedEx";
  const tracking = (fields.Tracking as string) || "";
  const promisedBy = (fields.PromisedBy as string) || "";

  const emailContent = buildFn({ firstName, carrier, tracking, promisedBy });

  await sendFn({ to: email, ...emailContent });

  const config = getConfig();
  const now = new Date().toISOString();
  return {
    ...(await patchRecord(config, ORDERS_TABLE, recordId, {
      ConfirmationSentTS: now,
      ShippedTS: now,
      Status: "shipped",
    })),
    emailPreview: emailContent,
  };
}

// ─── Fulfillment: markCheckIn (delivered check-in) ───────────────────────────

export async function markCheckIn(
  recordId: string,
  fields: Record<string, unknown>,
  sendFn: (params: { to: string; subject: string; text: string }) => Promise<void>,
  buildFn: (params: { firstName: string; carrier: string; deliveredDate: string }) => { subject: string; text: string },
): Promise<UpsertResult & { emailPreview?: { subject: string; text: string } }> {
  // Idempotency: if already sent, do nothing
  if (fields.CheckInTS) {
    return { ok: true, id: recordId, error: "already_sent" };
  }

  const email = fields.Email as string;
  if (!email) return { ok: false, error: "no_email" };

  const deliveredDate = fields.DeliveredDate as string;
  if (!deliveredDate) {
    return { ok: false, error: "missing_delivered_date" };
  }

  const firstName = extractName(fields.Name as string);
  const carrier = (fields.Carrier as string) || "FedEx";

  const emailContent = buildFn({ firstName, carrier, deliveredDate });

  await sendFn({ to: email, ...emailContent });

  const config = getConfig();
  return {
    ...(await patchRecord(config, ORDERS_TABLE, recordId, {
      CheckInTS: new Date().toISOString(),
    })),
    emailPreview: emailContent,
  };
}

function extractName(name: string | null | undefined): string {
  if (!name) return "";
  return name.trim().split(/\s+/)[0] || "";
}

// ─── Fulfillment: process pending ────────────────────────────────────────────

export interface FulfillmentAction {
  recordId: string;
  email: string;
  action: string;
  result?: string;
  preview?: { subject: string; text: string };
  error?: string;
}

export async function processFulfillment(
  sendFn: (params: { to: string; subject: string; text: string }) => Promise<void>,
  buildShipping: (params: { firstName: string; carrier: string; tracking: string; promisedBy: string }) => { subject: string; text: string },
  buildCheckIn: (params: { firstName: string; carrier: string; deliveredDate: string }) => { subject: string; text: string },
  dryRun: boolean = false,
): Promise<FulfillmentAction[]> {
  const config = getConfig();
  const allOrders = await listAllOrders();
  const actions: FulfillmentAction[] = [];

  for (const row of allOrders) {
    const f = row.fields;
    const email = (f.Email as string) || "";

    // 1. Tracking entered but not yet validated
    const tracking = (f.Tracking as string) || "";
    const status = (f.Status as string) || "";
    if (tracking && (status === "paid" || status === "intake-ready" || status === "sent-to-supplier")) {
      const validation = validateTracking(tracking);
      if (validation.valid) {
        if (!dryRun) {
          await patchRecord(config, ORDERS_TABLE, row.id, {
            Carrier: validation.carrier,
            Status: "ready-to-notify",
          });
        }
        actions.push({ recordId: row.id, email, action: "tracking_validated", result: `${validation.carrier}: ${tracking}` });
      } else {
        actions.push({ recordId: row.id, email, action: "tracking_invalid", error: validation.error });
      }
    }

    // 1b. SentToSupplier ticked but SentToSupplierTS not ticked (both checkboxes)
    if (f.SentToSupplier && !f.SentToSupplierTS) {
      if (!dryRun) {
        await patchRecord(config, ORDERS_TABLE, row.id, {
          SentToSupplierTS: true,
          Status: "sent-to-supplier",
        });
      }
      actions.push({ recordId: row.id, email, action: "sent_to_supplier" });
    }

    // 2. Notify ticked, shipping confirmation not yet sent
    if (f.Notify && !f.ConfirmationSentTS) {
      const firstName = extractName(f.Name as string);
      const carrier = (f.Carrier as string) || "FedEx";
      const promisedBy = (f.PromisedBy as string) || "";
      const preview = buildShipping({ firstName, carrier, tracking, promisedBy });

      if (!dryRun) {
        try {
          await sendFn({ to: email, ...preview });
          const now = new Date().toISOString();
          await patchRecord(config, ORDERS_TABLE, row.id, {
            ConfirmationSentTS: now,
            ShippedTS: now,
            Status: "shipped",
          });
          actions.push({ recordId: row.id, email, action: "shipping_sent", preview });
        } catch (err) {
          actions.push({ recordId: row.id, email, action: "shipping_failed", error: err instanceof Error ? err.message : String(err) });
        }
      } else {
        actions.push({ recordId: row.id, email, action: "shipping_pending", preview });
      }
    }

    // 3. NotifyCheckIn ticked, delivered, check-in not yet sent
    if (f.NotifyCheckIn && f.Delivered && !f.CheckInTS) {
      const deliveredDate = f.DeliveredDate as string;
      if (!deliveredDate) {
        actions.push({ recordId: row.id, email, action: "checkin_blocked", error: "DeliveredDate is empty" });
        continue;
      }
      const firstName = extractName(f.Name as string);
      const carrier = (f.Carrier as string) || "FedEx";
      const preview = buildCheckIn({ firstName, carrier, deliveredDate });

      if (!dryRun) {
        try {
          await sendFn({ to: email, ...preview });
          await patchRecord(config, ORDERS_TABLE, row.id, {
            CheckInTS: new Date().toISOString(),
          });
          actions.push({ recordId: row.id, email, action: "checkin_sent", preview });
        } catch (err) {
          actions.push({ recordId: row.id, email, action: "checkin_failed", error: err instanceof Error ? err.message : String(err) });
        }
      } else {
        actions.push({ recordId: row.id, email, action: "checkin_pending", preview });
      }
    }
  }

  return actions;
}

// ─── Phase 3 stubs ───────────────────────────────────────────────────────────

export async function writeSpend(
  _rows: Array<Record<string, unknown>>,
): Promise<void> {
  throw new Error("Phase 3: not yet implemented");
}

// ─── Daily digest metrics ───────────────────────────────────────────────────

// ET offset: -4 during DST (Mar–Nov), -5 during EST
function etOffsetHours(): number {
  // US Eastern: DST is second Sunday of March to first Sunday of November
  const now = new Date();
  const year = now.getUTCFullYear();
  // Second Sunday of March
  const mar1 = new Date(Date.UTC(year, 2, 1));
  const marSun2 = new Date(Date.UTC(year, 2, 14 - mar1.getUTCDay()));
  const dstStart = new Date(marSun2.getTime() + 7 * 3600_000); // 2 AM ET = 7 AM UTC
  // First Sunday of November
  const nov1 = new Date(Date.UTC(year, 10, 1));
  const novSun1 = new Date(Date.UTC(year, 10, 1 + (7 - nov1.getUTCDay()) % 7));
  const dstEnd = new Date(novSun1.getTime() + 6 * 3600_000); // 2 AM ET (still DST) = 6 AM UTC
  return now >= dstStart && now < dstEnd ? -4 : -5;
}

/** Convert a UTC ISO timestamp to its ET date key (YYYY-MM-DD) */
export function utcToEtDateKey(isoTs: string): string {
  const ms = new Date(isoTs).getTime();
  if (isNaN(ms)) return "";
  const etMs = ms + etOffsetHours() * 3600_000;
  return new Date(etMs).toISOString().slice(0, 10);
}

/** ET midnight today as a UTC Date */
function etToday(): Date {
  const offset = etOffsetHours();
  const now = new Date();
  const etMs = now.getTime() + offset * 3600_000;
  const etDate = new Date(etMs);
  const midnight = new Date(Date.UTC(etDate.getUTCFullYear(), etDate.getUTCMonth(), etDate.getUTCDate()));
  return new Date(midnight.getTime() - offset * 3600_000); // back to UTC
}

/** Yesterday's ET day as { start, end } in UTC ISO strings */
export function etYesterdayBounds(): { start: string; end: string } {
  const todayUtc = etToday();
  const end = todayUtc.toISOString();
  const start = new Date(todayUtc.getTime() - 86400_000).toISOString();
  return { start, end };
}

interface DayMetrics {
  orders: number;
  gross: number;
  refunds: number;
  bumps: number;
  otos: number;
  express: number;
  repeats: number;
}

function emptyDay(): DayMetrics {
  return { orders: 0, gross: 0, refunds: 0, bumps: 0, otos: 0, express: 0, repeats: 0 };
}


export interface DigestData {
  yesterday: DayMetrics;
  trailing7: DayMetrics;
  mtdOrders: number;
  mtdGross: number;
  verdicts: Record<string, number>;
  selfReports: Record<string, { verdict: string; source: string }>;
  fulfillment: {
    intakeStale: number;
    supplierNoTracking: number;
    batchedAwaitingTracking: Array<{ orderNumber: string; days: number }>;
    pastPromised: Array<{ orderNumber: string; daysLate: number }>;
    readyNoNotify: number;
    deliveredNoCheckIn: number;
  };
  dataHealth: {
    verdictMismatches: number;
    orphanOtos: number;
    missingRows: string[];
    revenueMatch: boolean;
    airtableRevenue: number;
    stripeRevenue: number;
  };
}

export async function getDailyMetrics(
  stripeSessions?: Array<{ id: string; amount_total: number; payment_status: string; created: number }>,
  orphanOtoCount?: number,
): Promise<DigestData> {
  const allOrders = await listAllOrders();
  const todayUtc = etToday();
  const todayEtKey = utcToEtDateKey(todayUtc.toISOString());
  const nowMs = Date.now();

  // Build per-day ET buckets for trailing 8 days (yesterday + 7 prior)
  const dayBuckets = new Map<string, DayMetrics>();
  for (let i = 1; i <= 8; i++) {
    const d = new Date(todayUtc.getTime() - i * 86400_000);
    dayBuckets.set(utcToEtDateKey(d.toISOString()), emptyDay());
  }

  const yesterdayKey = utcToEtDateKey(new Date(todayUtc.getTime() - 86400_000).toISOString());

  const monthStart = todayEtKey.slice(0, 7); // YYYY-MM
  let mtdOrders = 0;
  let mtdGross = 0;

  const verdicts: Record<string, number> = {};
  const selfReports: Record<string, { verdict: string; source: string }> = {};
  const fulfillment = {
    intakeStale: 0,
    supplierNoTracking: 0,
    batchedAwaitingTracking: [] as Array<{ orderNumber: string; days: number }>,
    pastPromised: [] as Array<{ orderNumber: string; daysLate: number }>,
    readyNoNotify: 0,
    deliveredNoCheckIn: 0,
  };
  const dataHealth = {
    verdictMismatches: 0,
    orphanOtos: 0,
    missingRows: [] as string[],
    revenueMatch: true,
    airtableRevenue: 0,
    stripeRevenue: 0,
  };

  for (const row of allOrders) {
    const f = row.fields;
    const orderTs = f.OrderTS as string || "";
    const status = (f.Status as string) || "";
    const amount = (f.Amount as number) || 0;
    const refunded = f.Refunded as boolean || false;
    const dayKey = utcToEtDateKey(orderTs);

    // Per-day metrics
    const bucket = dayBuckets.get(dayKey);
    if (bucket) {
      bucket.orders++;
      bucket.gross += amount;
      if (refunded) bucket.refunds++;
      if (f.BumpTaken) bucket.bumps++;
      if (f.OTOAccepted) bucket.otos++;
      if ((f.ShippingMethod as string) === "express") bucket.express++;
      if (f.RepeatCustomer) bucket.repeats++;
    }

    // MTD
    if (dayKey >= monthStart + "-01" && dayKey <= todayEtKey) {
      mtdOrders++;
      mtdGross += amount;
    }

    // Yesterday verdicts + self-reports
    if (dayKey === yesterdayKey) {
      const v = (f.Verdict as string) || "unknown";
      verdicts[v] = (verdicts[v] || 0) + 1;
      const selfSource = (f.SelfReportSource as string) || "";
      if (selfSource) {
        const orderNum = (f.OrderNumber as string) || row.id.slice(-6);
        selfReports[orderNum] = { verdict: v, source: selfSource };
      }
    }

    // Yesterday Airtable revenue for cross-check
    if (dayKey === yesterdayKey) {
      dataHealth.airtableRevenue += amount;
    }

    // Fulfillment health (current state)
    if (status === "intake-ready") {
      const age = (nowMs - new Date(orderTs).getTime()) / 3600_000;
      if (age > 24) fulfillment.intakeStale++;
    }
    if (status === "sent-to-supplier" && !(f.Tracking as string)) {
      const sentTs = f.SentToSupplierTS as string;
      if (sentTs) {
        const age = (nowMs - new Date(sentTs).getTime()) / (86400_000);
        if (age > 10) fulfillment.supplierNoTracking++;
      }
    }
    // Batched orders awaiting supplier tracking
    const batchDate = f.BatchDate as string;
    if (batchDate && !(f.Tracking as string) && status !== "cancelled") {
      const batchMs = new Date(batchDate).getTime();
      if (!isNaN(batchMs)) {
        const days = Math.floor((nowMs - batchMs) / 86400_000);
        fulfillment.batchedAwaitingTracking.push({
          orderNumber: (f.OrderNumber as string) || row.id.slice(-6),
          days,
        });
      }
    }
    if (f.PromisedBy && !f.Delivered && !refunded && status !== "cancelled") {
      const promised = new Date(f.PromisedBy as string).getTime();
      if (nowMs > promised) {
        const daysLate = Math.ceil((nowMs - promised) / 86400_000);
        fulfillment.pastPromised.push({
          orderNumber: (f.OrderNumber as string) || row.id.slice(-6),
          daysLate,
        });
      }
    }
    if (status === "ready-to-notify" && !f.Notify) {
      fulfillment.readyNoNotify++;
    }
    if (f.Delivered && !f.NotifyCheckIn && !f.CheckInTS) {
      fulfillment.deliveredNoCheckIn++;
    }

    // Data health: verdict direct with referrer/UTM
    if ((f.Verdict as string) === "direct") {
      const ref = (f.FT_Referrer as string) || "";
      const utm = (f.FT_UTM as string) || "";
      if (ref || (utm && utm !== "{}")) dataHealth.verdictMismatches++;
    }
  }

  // Stripe sessions watchdog
  if (stripeSessions) {
    const airtableSids = new Set(allOrders.map((r) => r.fields.StripeSessionId as string));
    for (const s of stripeSessions) {
      if (s.payment_status === "paid" && !airtableSids.has(s.id)) {
        dataHealth.missingRows.push(s.id);
      }
      if (s.payment_status === "paid") {
        dataHealth.stripeRevenue += (s.amount_total || 0) / 100;
      }
    }
    dataHealth.revenueMatch =
      Math.abs(dataHealth.airtableRevenue - dataHealth.stripeRevenue) < 1;

    // OTO orphans: subtract orders that have OTOAccepted from the Stripe count
    if (orphanOtoCount !== undefined) {
      const yesterdayOtoAccepted = allOrders.filter(r => {
        const dk = utcToEtDateKey(r.fields.OrderTS as string || "");
        return dk === yesterdayKey && r.fields.OTOAccepted;
      }).length;
      dataHealth.orphanOtos = Math.max(0, orphanOtoCount - yesterdayOtoAccepted);
    }
  }

  // Compute trailing 7-day average (days -2 through -8, i.e. the 7 days before yesterday)
  const trailing: DayMetrics = emptyDay();
  let trailingDays = 0;
  for (let i = 2; i <= 8; i++) {
    const d = new Date(todayUtc.getTime() - i * 86400_000);
    const key = utcToEtDateKey(d.toISOString());
    const b = dayBuckets.get(key);
    if (b && b.orders > 0) trailingDays++;
    if (b) {
      trailing.orders += b.orders;
      trailing.gross += b.gross;
      trailing.refunds += b.refunds;
      trailing.bumps += b.bumps;
      trailing.otos += b.otos;
      trailing.express += b.express;
      trailing.repeats += b.repeats;
    }
  }

  const avg = (v: number): number | null => trailingDays > 0 ? v / 7 : null;

  return {
    yesterday: dayBuckets.get(yesterdayKey) || emptyDay(),
    trailing7: {
      orders: avg(trailing.orders) ?? 0,
      gross: avg(trailing.gross) ?? 0,
      refunds: avg(trailing.refunds) ?? 0,
      bumps: avg(trailing.bumps) ?? 0,
      otos: avg(trailing.otos) ?? 0,
      express: avg(trailing.express) ?? 0,
      repeats: avg(trailing.repeats) ?? 0,
    },
    mtdOrders,
    mtdGross,
    verdicts,
    selfReports,
    fulfillment,
    dataHealth,
  };
}


// ─── Recovery ────────────────────────────────────────────────────────────────

export async function hasRecentRecovery(
  email: string,
  withinDays: number = 30,
): Promise<boolean> {
  const config = configOrNull();
  if (!config) {
    console.warn("Airtable not configured; recovery dedup disabled");
    return false;
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - withinDays);
  const cutoffIso = cutoff.toISOString();
  const safeEmail = email.replace(/'/g, "\\'");
  const formula = encodeURIComponent(
    `AND({Email}='${safeEmail}',IS_AFTER({Sent_At},'${cutoffIso}'))`,
  );

  try {
    const res = await airtableFetch(
      config,
      RECOVERY_TABLE,
      `?filterByFormula=${formula}&maxRecords=1`,
    );
    if (!res.ok) {
      console.error("Airtable recovery check failed", res.status);
      return false;
    }
    const data = (await res.json()) as { records: unknown[] };
    return data.records.length > 0;
  } catch (err) {
    console.error("Airtable recovery check error", err);
    return false;
  }
}

export async function logRecoverySend(record: {
  email: string;
  session_id: string;
  sent_at: string;
  first_name: string;
  link_sent: string;
}): Promise<void> {
  const config = configOrNull();
  if (!config) {
    console.warn("Airtable not configured; recovery log skipped");
    return;
  }

  try {
    const res = await airtableFetch(config, RECOVERY_TABLE, "", {
      method: "POST",
      body: JSON.stringify({
        records: [
          {
            fields: {
              Email: record.email,
              Session_ID: record.session_id,
              Sent_At: record.sent_at,
              First_Name: record.first_name,
              Link_Sent: record.link_sent,
            },
          },
        ],
      }),
    });
    if (!res.ok) {
      const detail = await res.text();
      console.error("Airtable recovery log failed", res.status, detail.slice(0, 300));
    }
  } catch (err) {
    console.error("Airtable recovery log error", err);
  }
}

// ─── Survey ─────────────────────────────────────────────────────────────────

export interface SurveyInput {
  stripeSessionId: string;
  orderNumber: string;
  email: string;
  source: string;
  recency?: string;
}

export interface SurveyResult {
  ok: boolean;
  id?: string;
  error?: string;
  created?: boolean;
}

async function findSurveyBySessionId(
  config: AirtableConfig,
  sessionId: string,
): Promise<AirtableRecord | null> {
  const formula = encodeURIComponent(`{StripeSessionId}='${sessionId}'`);
  const res = await airtableFetch(
    config,
    SURVEY_TABLE,
    `?filterByFormula=${formula}&maxRecords=1`,
  );
  if (!res.ok) return null;
  const data = (await res.json()) as { records: AirtableRecord[] };
  return data.records[0] || null;
}

export async function upsertSurvey(input: SurveyInput): Promise<SurveyResult> {
  const config = configOrNull();
  if (!config) return { ok: false, error: "airtable_not_configured" };

  // Look up the AG- order number from the Orders row
  const orderRow = await findOrderBySessionId(config, input.stripeSessionId);
  const resolvedOrderNumber = (orderRow?.fields?.OrderNumber as string) || input.orderNumber;

  const now = new Date().toISOString();
  const fields: Record<string, unknown> = {
    StripeSessionId: input.stripeSessionId,
    OrderNumber: resolvedOrderNumber,
    Email: input.email,
    Source: input.source,
    Recency: input.recency || "",
    AnsweredAt: now,
  };

  const existing = await findSurveyBySessionId(config, input.stripeSessionId);

  // Also write self-report fields onto the Orders row
  if (orderRow) {
    await patchRecord(config, ORDERS_TABLE, orderRow.id, {
      SelfReportSource: input.source,
      SelfReportRecency: input.recency || "",
    });
  }

  if (existing) {
    return patchRecord(config, SURVEY_TABLE, existing.id, fields);
  }

  return createRecord(config, SURVEY_TABLE, fields);
}

// ─── Backfill helpers ────────────────────────────────────────────────────────

export async function listAllOrders(): Promise<AirtableRecord[]> {
  const config = getConfig();
  const records: AirtableRecord[] = [];
  let offset: string | undefined;

  do {
    const query = offset ? `?offset=${encodeURIComponent(offset)}` : "";
    const res = await airtableFetch(config, ORDERS_TABLE, query);
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`listAllOrders failed: ${res.status} ${body.slice(0, 200)}`);
    }
    const data = (await res.json()) as {
      records: AirtableRecord[];
      offset?: string;
    };
    records.push(...data.records);
    offset = data.offset;
  } while (offset);

  return records;
}

export async function updateOrderFields(
  recordId: string,
  fields: Record<string, unknown>,
): Promise<UpsertResult> {
  const config = getConfig();
  return patchRecord(config, ORDERS_TABLE, recordId, fields);
}

export { deriveVerdict as _deriveVerdict, promiseDate as _promiseDate, daysBetween as _daysBetween, generateOrderNumber as _generateOrderNumber };
