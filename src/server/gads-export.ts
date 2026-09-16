// src/server/gads-export.ts
// Google Ads offline conversion export: Airtable orders → Google Sheet.
// Runs as a failure-isolated step inside handleFulfill().

import {
  getServiceAccountKey,
  getAccessToken,
  appendRows,
  readRange,
} from "./sheets";
import { listAllOrders, updateOrderFields } from "./records";

// ─── Config ──────────────────────────────────────────────────────────────────

const CONVERSION_NAME = "Purchase (offline)";

function getSheetId(): string {
  const id = process.env.GADS_SHEET_ID;
  if (!id) throw new Error("Missing GADS_SHEET_ID");
  return id;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GadsExportResult {
  exported: number;
  skipped: number;
  alreadyExported: number;
  errors: string[];
}

// ─── ET offset (DST-aware) ──────────────────────────────────────────────────

function etOffsetForTimestamp(isoTs: string): number {
  const d = new Date(isoTs);
  const year = d.getUTCFullYear();
  // Second Sunday of March at 2 AM ET = 7 AM UTC
  const mar1 = new Date(Date.UTC(year, 2, 1));
  const marSun2 = new Date(Date.UTC(year, 2, 14 - mar1.getUTCDay()));
  const dstStart = new Date(marSun2.getTime() + 7 * 3600_000);
  // First Sunday of November at 2 AM ET (still DST) = 6 AM UTC
  const nov1 = new Date(Date.UTC(year, 10, 1));
  const novSun1 = new Date(Date.UTC(year, 10, 1 + (7 - nov1.getUTCDay()) % 7));
  const dstEnd = new Date(novSun1.getTime() + 6 * 3600_000);
  return d >= dstStart && d < dstEnd ? -4 : -5;
}

function formatConversionTime(isoTs: string): string {
  const d = new Date(isoTs);
  const offset = etOffsetForTimestamp(isoTs);
  const etMs = d.getTime() + offset * 3600_000;
  const et = new Date(etMs);
  const pad = (n: number) => String(n).padStart(2, "0");
  const sign = offset <= 0 ? "-" : "+";
  const absOffset = Math.abs(offset);
  return `${et.getUTCFullYear()}-${pad(et.getUTCMonth() + 1)}-${pad(et.getUTCDate())} ${pad(et.getUTCHours())}:${pad(et.getUTCMinutes())}:${pad(et.getUTCSeconds())}${sign}${pad(absOffset)}:00`;
}

// ─── Header ──────────────────────────────────────────────────────────────────

const HEADER = [
  "Google Click ID",
  "Conversion Name",
  "Conversion Time",
  "Conversion Value",
  "Conversion Currency",
];

// ─── Export logic ────────────────────────────────────────────────────────────

export async function runGadsExport(dryRun: boolean = false): Promise<GadsExportResult> {
  const sheetId = getSheetId();
  const sa = getServiceAccountKey();
  const token = await getAccessToken(sa);

  // Ensure header row exists
  const existing = await readRange(token, sheetId, "conversions!A1:E1");
  if (!existing.length || existing[0][0] !== HEADER[0]) {
    await appendRows(token, sheetId, "conversions!A1", [HEADER]);
  }

  // Fetch all orders and filter qualifying ones
  const allOrders = await listAllOrders();
  const qualifying = allOrders.filter((row) => {
    const f = row.fields;
    const verdict = (f.Verdict as string) || "";
    const gclid = (f.FT_Gclid as string) || "";
    const status = (f.Status as string) || "";
    const refunded = f.Refunded as boolean || false;
    const exported = f.GadsExported as boolean || false;
    return (
      verdict === "google-paid" &&
      gclid.length > 0 &&
      status !== "cancelled" &&
      !refunded &&
      !exported
    );
  });

  const result: GadsExportResult = {
    exported: 0,
    skipped: 0,
    alreadyExported: allOrders.filter((r) => r.fields.GadsExported as boolean).length,
    errors: [],
  };

  if (qualifying.length === 0) {
    return result;
  }

  if (dryRun) {
    result.exported = qualifying.length;
    return result;
  }

  // Build rows
  const rows: unknown[][] = qualifying.map((row) => {
    const f = row.fields;
    const gclid = (f.FT_Gclid as string) || "";
    const orderTs = (f.OrderTS as string) || new Date().toISOString();
    const amount = (f.Amount as number) || 0;
    return [
      gclid,
      CONVERSION_NAME,
      formatConversionTime(orderTs),
      amount,
      "USD",
    ];
  });

  // Append all rows to sheet first
  await appendRows(token, sheetId, "conversions!A1", rows);

  // Mark each order as exported in Airtable.
  // Failure mode: if sheet append succeeded but Airtable mark fails,
  // the order stays unmarked → next run will attempt to re-append.
  // We prefer this (risk of duplicate row) over the alternative
  // (marking exported without writing the row). Google deduplicates
  // by gclid + conversion name + conversion time, so a duplicate row
  // is harmless. But we still mark one-by-one and track failures.
  const exportTs = new Date().toISOString();
  for (const row of qualifying) {
    try {
      const patch = await updateOrderFields(row.id, {
        GadsExported: true,
        GadsExportedTS: exportTs,
      });
      if (!patch.ok) {
        result.errors.push(`${(row.fields.OrderNumber as string) || row.id}: ${patch.error}`);
        result.skipped++;
        continue;
      }
      result.exported++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push(`${(row.fields.OrderNumber as string) || row.id}: ${msg}`);
      result.skipped++;
    }
  }

  return result;
}
