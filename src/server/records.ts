// src/server/records.ts
// Single Airtable access module. All reads and writes go through here.
// This is the only file that changes when the store moves to Postgres.

const ORDERS_TABLE = "tblQt2grL7iJ2ysNh";
const SUBMISSIONS_TABLE = "tbl3ScW6QPW7Mnl4b";
const RECOVERY_TABLE = "tblryjyqduMkiT0l5";

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
  ftRef: string;
  ftUtm: string;
  ftLp: string;
}

export function deriveVerdict(input: VerdictInput): string {
  if (input.gclid) return "google-paid";
  if (input.msclkid) return "microsoft-paid";

  const refLower = (input.ftRef || "").toLowerCase();
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

  if (refLower.includes("facebook") || refLower.includes("instagram"))
    return "meta";

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
  d.setDate(d.getDate() + (shippingMethod === "express" ? 7 : 18));
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
  orderNumber: string;
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
  itemType: string;
  repeatCustomer: boolean;
  shippingMethod: string;
}

export interface UpsertResult {
  ok: boolean;
  id?: string;
  error?: string;
  created?: boolean;
}

// Fields that should never be overwritten if already set
const PRESERVE_ON_UPDATE = new Set([
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
    OrderNumber: input.orderNumber,
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
    const mergedVerdict = deriveVerdict({
      gclid: mergedGclid,
      msclkid: mergedMsclkid,
      ftRef: mergedRef,
      ftUtm: mergedUtm,
      ftLp: mergedLp,
    });
    updateFields.Verdict = mergedVerdict;
    updateFields.ToolTouch = deriveToolTouch(mergedRef, mergedLp) || toolTouchSubmissions;

    return withRetry(
      () => patchRecord(config, ORDERS_TABLE, existing.id, updateFields),
      "upsert_order_update",
    );
  }

  return withRetry(
    () => createRecord(config, ORDERS_TABLE, fields),
    "upsert_order_create",
  );
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
  const sid = (fields.StripeSessionId as string) || "";
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
    `Order ${sid.slice(-8)} · ${date}`,
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

  const supplierEmail = process.env.SUPPLIER_EMAIL;
  if (supplierEmail && sendFn) {
    await sendFn({
      to: supplierEmail,
      subject: `New order ${(fields.StripeSessionId as string || "").slice(-8)}`,
      text: intake,
    });
    return patchRecord(config, ORDERS_TABLE, recordId, {
      IntakeBlock: intake,
      SentToSupplier: true,
      SentToSupplierTS: new Date().toISOString(),
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
    SentToSupplierTS: new Date().toISOString(),
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

    // 1b. SentToSupplier ticked but not yet timestamped
    if (f.SentToSupplier && !f.SentToSupplierTS) {
      if (!dryRun) {
        await patchRecord(config, ORDERS_TABLE, row.id, {
          SentToSupplierTS: new Date().toISOString(),
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

export async function getDailyMetrics(): Promise<Record<string, unknown>> {
  throw new Error("Phase 3: not yet implemented");
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

export { deriveVerdict as _deriveVerdict, promiseDate as _promiseDate, daysBetween as _daysBetween };
