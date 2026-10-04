#!/usr/bin/env npx tsx
// Read-only: print the last N rows of the Google Ads offline conversion sheet
// ("conversions" tab, written by src/server/gads-export.ts).
//
// Usage:
//   npm run gads:tail          # last 10 rows
//   npm run gads:tail -- 25    # last 25 rows
//
// Requires: GADS_SHEET_ID, GOOGLE_SA_KEY (same as the export)

import { getServiceAccountKey, getAccessToken, readRange } from "../src/server/sheets";

async function main() {
  const arg = process.argv[2];
  const n = arg === undefined ? 10 : Number(arg);
  if (!Number.isInteger(n) || n < 1) {
    console.error(`Invalid row count: ${arg}`);
    process.exit(1);
  }

  const sheetId = process.env.GADS_SHEET_ID;
  if (!sheetId) throw new Error("Missing GADS_SHEET_ID");

  const token = await getAccessToken(getServiceAccountKey());
  const rows = await readRange(token, sheetId, "conversions!A1:E");
  const [header, ...data] = rows;
  const tail = data.slice(-n);

  console.log(`Header: ${JSON.stringify(header ?? [])}`);
  console.log(`Data rows: ${data.length} (showing last ${tail.length})\n`);
  console.log("| # | Google Click ID | Conversion Time | Value | Currency |");
  console.log("|---|---|---|---|---|");
  tail.forEach((r, i) => {
    const [gclid = "", , time = "", value = "", currency = ""] = r.map(String);
    const shortGclid = gclid.length > 16 ? `${gclid.slice(0, 12)}…${gclid.slice(-4)}` : gclid;
    console.log(`| ${data.length - tail.length + i + 2} | ${shortGclid} | ${time} | ${value} | ${currency} |`);
  });
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
