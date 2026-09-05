const KEY = process.env.AIRTABLE_API_KEY!;
const BASE = process.env.AIRTABLE_BASE_ID!;
const TABLE = "tblQt2grL7iJ2ysNh";

async function createField(name: string, type: string, options?: Record<string, unknown>) {
  const body: Record<string, unknown> = { name, type };
  if (options) body.options = options;
  const res = await fetch(`https://api.airtable.com/v0/meta/bases/${BASE}/tables/${TABLE}/fields`, {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    const err = (data as { error?: { type?: string } }).error;
    if (err?.type === "DUPLICATE_OR_EMPTY_FIELD_NAME") {
      console.log(`= ${name} (already exists)`);
    } else {
      console.error(`! ${name}: ${JSON.stringify(err)}`);
    }
  } else {
    console.log(`+ ${name} (${type})`);
  }
}

async function main() {
  await createField("ShippingMethod", "singleSelect", {
    choices: [
      { name: "standard", color: "blueLight2" },
      { name: "express", color: "orangeLight2" },
    ],
  });
}

main();
