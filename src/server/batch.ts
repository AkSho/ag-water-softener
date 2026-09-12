// src/server/batch.ts
// Supplier batch sheet: generates batch tabs, reads tracking back.

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

// ─── Batch header (exact order per brief) ────────────────────────────────────

const HEADER = [
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

const FULL_PARTS_LIST =
  "(softener unit, brine tank, regeneration attachment with pump, hoses, mount adapter, wrench, teflon tape, English manual)";

// ─── Build order rows ────────────────────────────────────────────────────────

interface OrderRow {
  fields: Record<string, unknown>;
  id: string;
}

function buildOrderRow(
  order: OrderRow,
  rowNum: number,
  isFirstRow: boolean,
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
  } else {
    const prefix = unitQty > 1 ? `${unitQty}x ` : "";
    item = `${prefix}H1-230KM complete set`;
    if (isFirstRow) item += ` ${FULL_PARTS_LIST}`;

    if (otoAccepted) {
      spareCartridge = "Yes";
      notes.push("+ Spares Kit");
    } else if (bumpTaken) {
      spareCartridge = "Yes";
    } else {
      spareCartridge = "No";
    }
  }

  const shipping = shippingMethod === "express" ? "Express" : "Standard";

  return [
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

// ─── Summary line ────────────────────────────────────────────────────────────

function buildSummaryLine(batchDate: string, orders: OrderRow[]): string {
  let totalUnits = 0;
  let totalSpare = 0;
  let totalExpress = 0;
  let totalStandard = 0;

  for (const o of orders) {
    const f = o.fields;
    const itemType = (f.ItemType as string) || "";
    const unitQty = (f.UnitQty as number) || 1;
    const shippingMethod = ((f.ShippingMethod as string) || "standard").toLowerCase();

    if (itemType === "kit") {
      // Kit-only orders don't count as units
    } else {
      totalUnits += unitQty;
    }

    if (f.BumpTaken || f.OTOAccepted) totalSpare++;

    if (shippingMethod === "express") totalExpress++;
    else totalStandard++;
  }

  return (
    `Batch date: ${batchDate} | ${orders.length} orders | ${totalUnits} units | ` +
    `${totalSpare} spare cartridges | ${totalExpress} express | ${totalStandard} standard\n` +
    `All units ship under our brand, AG Water Softener. Please add the tracking number in the last column.`
  );
}

// ─── Batch generation (Task 2) ───────────────────────────────────────────────

export async function runBatch(
  dryRun: boolean = false,
): Promise<BatchResult> {
  const sa = getServiceAccountKey();
  const sheetId = getSupplierSheetId();
  const token = await getAccessToken(sa);
  const allOrders = await listAllOrders();

  const actions: BatchAction[] = [];

  // Today's date in ET
  const batchDate = utcToEtDateKey(new Date().toISOString());

  // Gather orders: Status = intake-ready AND no BatchDate
  const eligible = allOrders.filter((o) => {
    const status = (o.fields.Status as string) || "";
    const hasBatchDate = !!(o.fields.BatchDate as string);
    return status === "intake-ready" && !hasBatchDate;
  });

  let ordersWritten = 0;
  let tabPreview: unknown[][] | undefined;

  if (eligible.length > 0) {
    // Check if today's tab already exists
    const tabs = await listTabs(token, sheetId);
    const tabExists = tabs.some((t) => t.properties.title === batchDate);

    let startRowNum = 1;

    if (tabExists) {
      // Read existing rows to determine next row number
      const existing = await readRange(token, sheetId, `'${batchDate}'!A:A`);
      // Find the highest # value (skip summary line and header)
      for (const row of existing) {
        const val = Number(row[0]);
        if (!isNaN(val) && val >= startRowNum) startRowNum = val + 1;
      }
    }

    const isFirstTab = !tabExists;
    const isFirstRowOfTab = startRowNum === 1;

    // Build rows
    const dataRows: unknown[][] = [];
    for (let i = 0; i < eligible.length; i++) {
      dataRows.push(
        buildOrderRow(eligible[i], startRowNum + i, isFirstRowOfTab && i === 0),
      );
    }

    // Build summary
    const summaryText = buildSummaryLine(batchDate, eligible);

    if (dryRun) {
      tabPreview = [
        [summaryText],
        [],
        HEADER,
        ...dataRows,
      ];

      for (const order of eligible) {
        actions.push({
          action: "would_batch",
          orderNumber: (order.fields.OrderNumber as string) || "",
          detail: `Status: intake-ready, would write to tab ${batchDate}`,
        });
      }
    } else {
      if (!tabExists) {
        await addTab(token, sheetId, batchDate);
        // Write summary + header + data
        const allRows: unknown[][] = [
          [summaryText],
          [], // blank row
          HEADER,
          ...dataRows,
        ];
        await clearAndWrite(token, sheetId, `'${batchDate}'!A1`, allRows);
      } else {
        // Append data rows to existing tab
        await appendRows(token, sheetId, `'${batchDate}'!A1`, dataRows);
      }

      // Update Airtable: set BatchDate, Status, SentToSupplierTS + SentToSupplierAt
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
          detail: `Written to tab ${batchDate}, Status → sent-to-supplier`,
        });
      }

      ordersWritten = eligible.length;
      tabPreview = [
        [summaryText],
        [],
        HEADER,
        ...dataRows,
      ];
    }
  } else {
    actions.push({ action: "no_eligible_orders", detail: "No orders with Status=intake-ready and no BatchDate" });
  }

  // ─── Tracking read-back (Task 3) ─────────────────────────────────────────

  const trackingRead = await readBackTracking(token, sheetId, allOrders, dryRun, actions);

  return {
    batchDate,
    ordersWritten,
    trackingRead,
    actions,
    tabPreview,
  };
}

// ─── Tracking read-back ──────────────────────────────────────────────────────

async function readBackTracking(
  token: string,
  sheetId: string,
  allOrders: Array<{ id: string; fields: Record<string, unknown> }>,
  dryRun: boolean,
  actions: BatchAction[],
): Promise<number> {
  const tabs = await listTabs(token, sheetId);

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

  // Only read tabs from the last 30 days
  const now = new Date();
  const cutoff = new Date(now.getTime() - 30 * 86400_000);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  let trackingRead = 0;

  for (const tab of tabs) {
    const title = tab.properties.title;
    // Only process date-named tabs (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(title)) continue;
    if (title < cutoffStr) continue;

    const rows = await readRange(token, sheetId, `'${title}'!A:O`);

    for (const row of rows) {
      // Find the Order no. column (index 1 in data rows, but we need to skip summary/header)
      const orderNo = String(row[1] || "").trim();
      if (!orderNo || !orderNo.startsWith("AG-")) continue;

      const sheetTracking = String(row[13] || "").trim(); // Column N = index 13
      if (!sheetTracking) continue;

      const existing = orderMap.get(orderNo);
      if (!existing) continue;

      // Never overwrite a non-empty Airtable Tracking
      if (existing.tracking) continue;

      if (dryRun) {
        actions.push({
          action: "would_read_tracking",
          orderNumber: orderNo,
          detail: `Tab ${title}: tracking "${sheetTracking}" → Airtable`,
        });
      } else {
        await updateOrderFields(existing.id, {
          Tracking: sheetTracking.replace(/\s/g, ""),
        });
        actions.push({
          action: "tracking_read",
          orderNumber: orderNo,
          detail: `Tab ${title}: tracking "${sheetTracking}" written to Airtable`,
        });
      }
      trackingRead++;
    }
  }

  return trackingRead;
}

// ─── README tab (Task 5) ─────────────────────────────────────────────────────

const README_TEXT = [
  ["AG Supplier Orders"],
  [""],
  ["This sheet is the batch order list for AG Water Softener."],
  [""],
  ["Each tab is one day's batch, named by date (YYYY-MM-DD)."],
  [""],
  ["The supplier fills only the Tracking (supplier) column with the tracking number for each order."],
  [""],
  ["Cutoff: 3:00 PM Beijing time. Orders placed after the cutoff go into the next day's batch."],
];

export async function ensureReadmeTab(
  token: string,
  sheetId: string,
): Promise<boolean> {
  const tabs = await listTabs(token, sheetId);
  const hasReadme = tabs.some((t) => t.properties.title === "README");
  if (!hasReadme) {
    await addTab(token, sheetId, "README");
    await clearAndWrite(token, sheetId, "'README'!A1", README_TEXT);
    return true;
  }
  return false;
}

export async function setupReadmeTab(): Promise<{ created: boolean }> {
  const sa = getServiceAccountKey();
  const sheetId = getSupplierSheetId();
  const token = await getAccessToken(sa);
  const created = await ensureReadmeTab(token, sheetId);
  return { created };
}
