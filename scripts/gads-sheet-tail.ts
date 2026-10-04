#!/usr/bin/env npx tsx
// Read-only: print the last N rows of the Google Ads offline conversion sheet
// ("conversions" tab, written by src/server/gads-export.ts).
//
// Usage:
//   npm run gads:tail          # last 10 rows
//   npm run gads:tail -- 25    # last 25 rows
//
// Requires: GADS_SHEET_ID, GOOGLE_SA_KEY (same as the export). Read from
// .env.local directly, not via --env-file: Node's parser truncates a
// double-quoted JSON value at its first inner quote. A variable already set
// in the process environment wins.

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getServiceAccountKey, getAccessToken, readRange } from "../src/server/sheets";

function loadEnvLocal(keys: string[]) {
  const file = resolve(process.cwd(), ".env.local");
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    if (!keys.includes(key) || process.env[key]) continue;
    let value = line.slice(eq + 1).trim();
    // Strip one pair of wrapping quotes; inner quotes stay
    const q = value[0];
    if ((q === '"' || q === "'") && value.length >= 2 && value.endsWith(q)) {
      value = value.slice(1, -1);
    }
    // Trim trailing whitespace and one trailing literal \n (a stored trailing
    // newline in the pulled value); inner \n sequences in the key stay
    value = value.trimEnd();
    if (value.endsWith("\\n")) value = value.slice(0, -2);
    process.env[key] = value;
  }
}

async function main() {
  loadEnvLocal(["GADS_SHEET_ID", "GOOGLE_SA_KEY"]);


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
