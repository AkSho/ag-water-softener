#!/usr/bin/env npx tsx
// Create new Airtable fields programmatically via the Metadata API.
// If the token lacks schema.bases:write scope, reports the error.
//
// Usage:
//   npx tsx --env-file=.env.backfill scripts/create-airtable-fields.ts
//
// Requires: AIRTABLE_API_KEY, AIRTABLE_BASE_ID

const BASE_ID = process.env.AIRTABLE_BASE_ID!;
const API_KEY = process.env.AIRTABLE_API_KEY!;

if (!BASE_ID || !API_KEY) {
  console.error("AIRTABLE_API_KEY and AIRTABLE_BASE_ID required");
  process.exit(1);
}

// Orders table ID from memory
const ORDERS_TABLE_ID = "tblQt2grL7iJ2ysNh";

interface FieldDef {
  name: string;
  type: string;
  options?: Record<string, unknown>;
}

// Fields to create (not already existing).
// Existing: StripeSessionId, Email, Name, Amount, OrderTS, FT_Source, FT_Referrer,
// FT_LandingPage, FT_MyaptPage, FT_Timestamp, FT_Gclid, FT_Msclkid,
// DaysToPurchase, ToolTouch, Verdict, Status, PromisedBy, Tracking, Delivered,
// EventId, SelfReport, QuotedShip, ActualShip, UnitCost, ShippingCost
const NEW_FIELDS: FieldDef[] = [
  { name: "PaymentIntentId", type: "singleLineText" },
  { name: "OrderNumber", type: "singleLineText" },
  { name: "UnitQty", type: "number", options: { precision: 0 } },
  { name: "BumpTaken", type: "checkbox", options: { icon: "check", color: "greenBright" } },
  { name: "OTOAccepted", type: "checkbox", options: { icon: "check", color: "greenBright" } },
  { name: "OTOAmount", type: "currency", options: { precision: 2, symbol: "$" } },
  { name: "Refunded", type: "checkbox", options: { icon: "check", color: "redBright" } },
  { name: "RefundTS", type: "singleLineText" },
  { name: "FT_UTM", type: "singleLineText" },
  { name: "VerdictLegacy", type: "singleLineText" },
  { name: "ShipName", type: "singleLineText" },
  { name: "Address1", type: "singleLineText" },
  { name: "Address2", type: "singleLineText" },
  { name: "City", type: "singleLineText" },
  { name: "State", type: "singleLineText" },
  { name: "Zip", type: "singleLineText" },
  { name: "Phone", type: "singleLineText" },
  { name: "SentToSupplierTS", type: "singleLineText" },
  { name: "Carrier", type: "singleLineText" },
  { name: "ShippedTS", type: "singleLineText" },
  { name: "ConfirmationSentTS", type: "singleLineText" },
  { name: "CheckInTS", type: "singleLineText" },
  { name: "Notify", type: "checkbox", options: { icon: "check", color: "blueBright" } },
];

// Status field already exists but may need new options
const STATUS_OPTIONS = [
  { name: "paid", color: "greenLight2" },
  { name: "sent-to-supplier", color: "yellowLight2" },
  { name: "ready-to-notify", color: "orangeLight2" },
  { name: "shipped", color: "blueLight2" },
  { name: "delivered", color: "greenDark1" },
  { name: "cancelled", color: "redLight2" },
];

async function createField(field: FieldDef): Promise<{ ok: boolean; error?: string }> {
  const url = `https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables/${ORDERS_TABLE_ID}/fields`;
  const body: Record<string, unknown> = {
    name: field.name,
    type: field.type,
  };
  if (field.options) body.options = field.options;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text();
    return { ok: false, error: `${res.status}: ${detail.slice(0, 300)}` };
  }
  return { ok: true };
}

async function updateStatusField(): Promise<{ ok: boolean; error?: string }> {
  // First, list fields to find Status field ID
  const listUrl = `https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables`;
  const listRes = await fetch(listUrl, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });

  if (!listRes.ok) {
    const detail = await listRes.text();
    return { ok: false, error: `List tables ${listRes.status}: ${detail.slice(0, 300)}` };
  }

  const tables = (await listRes.json()) as {
    tables: Array<{
      id: string;
      fields: Array<{ id: string; name: string; type: string; options?: { choices?: Array<{ name: string }> } }>;
    }>;
  };

  const ordersTable = tables.tables.find((t) => t.id === ORDERS_TABLE_ID);
  if (!ordersTable) return { ok: false, error: "Orders table not found" };

  const statusField = ordersTable.fields.find((f) => f.name === "Status");
  if (!statusField) return { ok: false, error: "Status field not found" };

  const existingChoices = statusField.options?.choices?.map((c) => c.name) || [];
  const missingChoices = STATUS_OPTIONS.filter((o) => !existingChoices.includes(o.name));

  if (missingChoices.length === 0) {
    console.log("  Status field already has all options");
    return { ok: true };
  }

  console.log(`  Adding ${missingChoices.length} missing Status options: ${missingChoices.map((c) => c.name).join(", ")}`);

  // Merge existing + new choices
  const allChoices = [
    ...(statusField.options?.choices || []),
    ...missingChoices,
  ];

  const updateUrl = `https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables/${ORDERS_TABLE_ID}/fields/${statusField.id}`;
  const res = await fetch(updateUrl, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      options: { choices: allChoices },
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    return { ok: false, error: `Update Status ${res.status}: ${detail.slice(0, 300)}` };
  }

  return { ok: true };
}

async function main() {
  console.log("Creating new Airtable fields on Orders table...\n");

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const field of NEW_FIELDS) {
    const result = await createField(field);
    if (result.ok) {
      console.log(`  + ${field.name} (${field.type})`);
      created++;
    } else if (result.error?.includes("DUPLICATE_FIELD_NAME") || result.error?.includes("already exists")) {
      console.log(`  = ${field.name} (already exists, skipped)`);
      skipped++;
    } else if (result.error?.includes("INSUFFICIENT_PERMISSIONS") || result.error?.includes("schema.bases:write")) {
      console.error(`\nToken lacks schema.bases:write scope.`);
      console.error(`The owner must create these fields manually in the Airtable UI:\n`);
      for (const f of NEW_FIELDS) {
        console.error(`  ${f.name} (${f.type})`);
      }
      console.error(`\nAnd extend Status options to include: ${STATUS_OPTIONS.map((o) => o.name).join(", ")}`);
      process.exit(1);
    } else {
      console.error(`  ! ${field.name}: ${result.error}`);
      failed++;
    }
    // Rate limit
    await new Promise((r) => setTimeout(r, 250));
  }

  console.log("\nUpdating Status field options...");
  const statusResult = await updateStatusField();
  if (!statusResult.ok) {
    console.error(`  Status update failed: ${statusResult.error}`);
    failed++;
  }

  console.log(`\nDone: ${created} created, ${skipped} already existed, ${failed} failed`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
