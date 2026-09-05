const KEY = process.env.AIRTABLE_API_KEY!;
const BASE = process.env.AIRTABLE_BASE_ID!;

async function main() {
  const res = await fetch(`https://api.airtable.com/v0/meta/bases/${BASE}/tables`, {
    headers: { Authorization: `Bearer ${KEY}` },
  });
  const data = (await res.json()) as { tables: Array<{ id: string; fields: Array<{ name: string; type: string }> }> };
  const table = data.tables.find((t) => t.id === "tblQt2grL7iJ2ysNh");
  if (!table) { console.error("Table not found"); return; }
  for (const f of table.fields) {
    console.log(`${f.name.padEnd(30)} ${f.type}`);
  }
  console.log(`\nTotal: ${table.fields.length} fields`);
}

main();
