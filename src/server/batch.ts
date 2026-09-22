// src/server/batch.ts
// Supplier batch sheet: single Orders tab, appends new rows, reads tracking back.

import {
  getServiceAccountKey,
  getAccessToken,
  listTabs,
  addTab,
  clearAndWrite,
  appendRows,
  readRange,
} from "./sheets";
import { listAllOrders, updateOrderFields } from "./records";
import { utcToEtDateKey } from "./records";

// ─── Config ──────────────────────────────────────────────────────────────────

function getSupplierSheetId(): string {
  const id = process.env.SUPPLIER_SHEET_ID;
  if (!id) throw new Error("Missing SUPPLIER_SHEET_ID");
  return id;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BatchAction {
  action: string;
  orderNumber?: string;
  detail?: string;
  error?: string;
}

export interface BatchResult {
  batchDate: string;
  ordersWritten: number;
  trackingRead: number;
  actions: BatchAction[];
  tabPreview?: unknown[][];
}

// ─── Header (exact column order per brief) ────────────────────────────────────

const HEADER = [
  "Batched (ET)",
  "#",
  "Order no.",
  "Customer name",
  "Address line 1",
  "Address line 2",
  "City",
  "State",
  "Zip",
  "Phone",
  "Email",
  "Item",
  "Spare cartridge",
  "Shipping",
  "Tracking (supplier)",
  "Notes",
];

// Column indices (0-based) in the Orders tab
const COL_BATCHED = 0;
const COL_NUM = 1;
const COL_ORDER_NO = 2;
const COL_TRACKING = 14;

// ─── ET timestamp ────────────────────────────────────────────────────────────

function etTimestamp(): string {
  // US Eastern: -4 during DST (Mar–Nov), -5 during EST
  const now = new Date();
  const year = now.getUTCFullYear();
  const mar1 = new Date(Date.UTC(year, 2, 1));
  const marSun2 = new Date(Date.UTC(year, 2, 14 - mar1.getUTCDay()));
  const dstStart = new Date(marSun2.getTime() + 7 * 3600_000);
  const nov1 = new Date(Date.UTC(year, 10, 1));
  const novSun1 = new Date(Date.UTC(year, 10, 1 + (7 - nov1.getUTCDay()) % 7));
  const dstEnd = new Date(novSun1.getTime() + 6 * 3600_000);
  const offset = now >= dstStart && now < dstEnd ? -4 : -5;

  const etMs = now.getTime() + offset * 3600_000;
  const et = new Date(etMs);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${et.getUTCFullYear()}-${pad(et.getUTCMonth() + 1)}-${pad(et.getUTCDate())} ${pad(et.getUTCHours())}:${pad(et.getUTCMinutes())}`;
}

// ─── Build order rows ────────────────────────────────────────────────────────

interface OrderRow {
  fields: Record<string, unknown>;
  id: string;
}

function buildOrderRow(
  order: OrderRow,
  rowNum: number,
  batchedET: string,
): unknown[] {
  const f = order.fields;
  const unitQty = (f.UnitQty as number) || 1;
  const itemType = (f.ItemType as string) || "";
  const bumpTaken = f.BumpTaken as boolean;
  const otoAccepted = f.OTOAccepted as boolean;
  const shippingMethod = ((f.ShippingMethod as string) || "standard").toLowerCase();

  let item: string;
  let spareCartridge: string;
  const notes: string[] = [];

  if (itemType === "kit") {
    item = "Spares Kit";
    spareCartridge = "No";
  } else if (itemType === "cartridge") {
    item = "Spare cartridge";
    spareCartridge = "No";
  } else {
    const prefix = unitQty > 1 ? `${unitQty}x ` : "";
    item = `${prefix}H1-230KM complete set`;

    if (otoAccepted) {
      spareCartridge = "Yes";
      notes.push("+ Spares Kit");
    } else if (bumpTaken) {
      spareCartridge = "Yes";
    } else {
      spareCartridge = "No";
    }
  }

  const shipping = (shippingMethod === "express" || itemType === "cartridge") ? "Express" : "Standard";

  return [
    batchedET,
    rowNum,
    (f.OrderNumber as string) || "",
    (f.ShipName as string) || (f.Name as string) || "",
    (f.Address1 as string) || "",
    (f.Address2 as string) || "",
    (f.City as string) || "",
    (f.State as string) || "",
    "'" + ((f.Zip as string) || ""),
    "'" + ((f.Phone as string) || ""),
    (f.Email as string) || "",
    item,
    spareCartridge,
    shipping,
    "", // Tracking (supplier) — blank
    notes.join("; "),
  ];
}

// ─── Batch generation ─────────────────────────────────────────────────────────

export async function runBatch(
  dryRun: boolean = false,
): Promise<BatchResult> {
  const sa = getServiceAccountKey();
  const sheetId = getSupplierSheetId();
  const token = await getAccessToken(sa);
  const allOrders = await listAllOrders();

  const actions: BatchAction[] = [];
  const batchDate = utcToEtDateKey(new Date().toISOString());
  const batchedET = etTimestamp();

  // Ensure Orders tab exists with frozen header
  await ensureOrdersTab(token, sheetId);

  // Gather eligible orders: Status = intake-ready AND no BatchDate
  const eligible = allOrders.filter((o) => {
    const status = (o.fields.Status as string) || "";
    const hasBatchDate = !!(o.fields.BatchDate as string);
    return status === "intake-ready" && !hasBatchDate;
  });

  let ordersWritten = 0;
  let tabPreview: unknown[][] | undefined;

  if (eligible.length > 0) {
    // Read existing rows to find next # value
    const existing = await readRange(token, sheetId, "'Orders'!B:B");
    let maxNum = 0;
    for (const row of existing) {
      const val = Number(row[0]);
      if (!isNaN(val) && val > maxNum) maxNum = val;
    }

    // Build rows
    const dataRows: unknown[][] = [];
    for (let i = 0; i < eligible.length; i++) {
      dataRows.push(
        buildOrderRow(eligible[i], maxNum + 1 + i, batchedET),
      );
    }

    if (dryRun) {
      tabPreview = [HEADER, ...dataRows];
      for (const order of eligible) {
        actions.push({
          action: "would_batch",
          orderNumber: (order.fields.OrderNumber as string) || "",
          detail: `Status: intake-ready, would append to Orders tab as #${maxNum + 1 + eligible.indexOf(order)}`,
        });
      }
    } else {
      await appendRows(token, sheetId, "'Orders'!A1", dataRows);

      const now = new Date().toISOString();
      for (const order of eligible) {
        await updateOrderFields(order.id, {
          BatchDate: batchDate,
          Status: "sent-to-supplier",
          SentToSupplierTS: true,
          SentToSupplierAt: now,
        });
        actions.push({
          action: "batched",
          orderNumber: (order.fields.OrderNumber as string) || "",
          detail: `Appended to Orders tab, Status → sent-to-supplier`,
        });
      }

      ordersWritten = eligible.length;
      tabPreview = [HEADER, ...dataRows];
    }
  } else {
    actions.push({ action: "no_eligible_orders", detail: "No orders with Status=intake-ready and no BatchDate" });
  }

  // ─── Tracking read-back ─────────────────────────────────────────────────────

  const trackingRead = await readBackTracking(token, sheetId, allOrders, dryRun, actions);

  return {
    batchDate,
    ordersWritten,
    trackingRead,
    actions,
    tabPreview,
  };
}

// ─── Ensure Orders tab exists ─────────────────────────────────────────────────

async function ensureOrdersTab(
  token: string,
  sheetId: string,
): Promise<void> {
  const tabs = await listTabs(token, sheetId);
  if (tabs.some((t) => t.properties.title === "Orders")) return;

  await addTab(token, sheetId, "Orders");
  await clearAndWrite(token, sheetId, "'Orders'!A1", [HEADER]);

  // Freeze row 1
  const updatedTabs = await listTabs(token, sheetId);
  const ordersTab = updatedTabs.find((t) => t.properties.title === "Orders");
  if (ordersTab) {
    const SHEETS_BASE = "https://sheets.googleapis.com/v4/spreadsheets";
    await fetch(`${SHEETS_BASE}/${sheetId}:batchUpdate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: [{
          updateSheetProperties: {
            properties: {
              sheetId: ordersTab.properties.sheetId,
              gridProperties: { frozenRowCount: 1 },
            },
            fields: "gridProperties.frozenRowCount",
          },
        }],
      }),
    });
  }
}

// ─── Tracking read-back ──────────────────────────────────────────────────────

async function readBackTracking(
  token: string,
  sheetId: string,
  allOrders: Array<{ id: string; fields: Record<string, unknown> }>,
  dryRun: boolean,
  actions: BatchAction[],
): Promise<number> {
  // Build a map of OrderNumber → { id, tracking } for quick lookup
  const orderMap = new Map<string, { id: string; tracking: string }>();
  for (const o of allOrders) {
    const orderNum = (o.fields.OrderNumber as string) || "";
    if (orderNum) {
      orderMap.set(orderNum, {
        id: o.id,
        tracking: (o.fields.Tracking as string) || "",
      });
    }
  }

  // 30-day cutoff by Batched (ET) column
  const now = new Date();
  const cutoff = new Date(now.getTime() - 30 * 86400_000);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const rows = await readRange(token, sheetId, "'Orders'!A:P");
  let trackingRead = 0;

  for (const row of rows) {
    // Skip header
    const orderNo = String(row[COL_ORDER_NO] || "").trim();
    if (!orderNo || !orderNo.startsWith("AG-")) continue;

    // 30-day window: compare Batched (ET) date portion against cutoff
    const batchedStr = String(row[COL_BATCHED] || "").trim();
    const batchedDate = batchedStr.slice(0, 10); // YYYY-MM-DD portion
    if (batchedDate < cutoffStr) continue;

    const sheetTracking = String(row[COL_TRACKING] || "").trim();
    if (!sheetTracking) continue;

    const existing = orderMap.get(orderNo);
    if (!existing) continue;

    // Never overwrite a non-empty Airtable Tracking
    if (existing.tracking) continue;

    if (dryRun) {
      actions.push({
        action: "would_read_tracking",
        orderNumber: orderNo,
        detail: `Orders tab: tracking "${sheetTracking}" → Airtable`,
      });
    } else {
      await updateOrderFields(existing.id, {
        Tracking: sheetTracking.replace(/\s/g, ""),
      });
      actions.push({
        action: "tracking_read",
        orderNumber: orderNo,
        detail: `Orders tab: tracking "${sheetTracking}" written to Airtable`,
      });
    }
    trackingRead++;
  }

  return trackingRead;
}

// ─── README tab ───────────────────────────────────────────────────────────────

const README_ROWS: unknown[][] = [
  ["AG Supplier Orders"],
  [""],
  ["One tab: Orders. New orders appear at the bottom with a timestamp."],
  [""],
  ["Fill only the Tracking (supplier) column with the tracking number for each order."],
  [""],
  ["Cutoff: 3:00 PM Beijing time. Orders placed after the cutoff go into the next batch."],
  [""],
  ["Parts list: softener unit, brine tank, regeneration attachment with pump, hoses, mount adapter, wrench, teflon tape, English manual."],
  [""],
  ["Live counts:"],
  ["Total orders", "=COUNTA(Orders!C:C)-1"],
  ["Awaiting tracking", '=COUNTBLANK(OFFSET(Orders!O2,0,0,COUNTA(Orders!C:C)-1,1))'],
];

export async function ensureReadmeTab(
  token: string,
  sheetId: string,
): Promise<boolean> {
  const tabs = await listTabs(token, sheetId);
  const hasReadme = tabs.some((t) => t.properties.title === "README");
  if (!hasReadme) {
    await addTab(token, sheetId, "README");
  }
  await clearAndWrite(token, sheetId, "'README'!A1", README_ROWS);
  return !hasReadme;
}

export async function setupReadmeTab(): Promise<{ created: boolean }> {
  const sa = getServiceAccountKey();
  const sheetId = getSupplierSheetId();
  const token = await getAccessToken(sa);
  const created = await ensureReadmeTab(token, sheetId);
  return { created };
}

// ─── Express upgrade: update Shipping cell on supplier sheet ─────────────────

export async function updateSheetShipping(
  orderNumber: string,
): Promise<{ updated: boolean; error?: string }> {
  try {
    const sa = getServiceAccountKey();
    const sheetId = getSupplierSheetId();
    const token = await getAccessToken(sa);

    // Read Order no. column (C) to find the row
    const rows = await readRange(token, sheetId, "'Orders'!C:C");
    let rowIndex = -1;
    for (let i = 0; i < rows.length; i++) {
      if (String(rows[i][0] || "").trim() === orderNumber) {
        rowIndex = i;
        break;
      }
    }

    if (rowIndex < 0) {
      return { updated: false, error: "order_not_on_sheet" };
    }

    // Row index is 0-based from readRange; sheet rows are 1-indexed
    const sheetRow = rowIndex + 1;
    const range = `'Orders'!N${sheetRow}`;
    const SHEETS_BASE = "https://sheets.googleapis.com/v4/spreadsheets";

    const res = await fetch(
      `${SHEETS_BASE}/${sheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ range, values: [["Express"]] }),
      },
    );

    if (!res.ok) {
      const detail = await res.text();
      return { updated: false, error: `sheets_put_failed: ${res.status} ${detail.slice(0, 200)}` };
    }

    return { updated: true };
  } catch (err) {
    return { updated: false, error: err instanceof Error ? err.message : String(err) };
  }
}
