// src/server/pnl.ts
// Monthly P&L Sheet writer. Reads Stripe balance transactions and Airtable orders,
// writes formula-driven month tabs into a Google Sheet.

import Stripe from "stripe";
import { createSign } from "crypto";
import { listAllOrders } from "./records";

// ─── Google Sheets auth (lightweight JWT, no googleapis) ─────────────────────

interface ServiceAccountKey {
  client_email: string;
  private_key: string;
  token_uri: string;
}

function getServiceAccountKey(): ServiceAccountKey {
  const raw = process.env.GOOGLE_SA_KEY;
  if (!raw) throw new Error("Missing GOOGLE_SA_KEY");
  const parsed = JSON.parse(raw) as ServiceAccountKey;
  // Ensure PEM newlines are real newlines regardless of how the env var was stored.
  // Some deployment methods double-escape \n into \\n in the JSON string.
  parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
  return parsed;
}

function getSheetId(): string {
  const id = process.env.PNL_SHEET_ID;
  if (!id) throw new Error("Missing PNL_SHEET_ID");
  return id;
}

async function getAccessToken(sa: ServiceAccountKey): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      aud: sa.token_uri,
      iat: now,
      exp: now + 3600,
    }),
  ).toString("base64url");

  const sign = createSign("RSA-SHA256");
  sign.update(`${header}.${payload}`);
  const signature = sign.sign(sa.private_key, "base64url");

  const jwt = `${header}.${payload}.${signature}`;
  const res = await fetch(sa.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Google token exchange failed: ${res.status} ${detail.slice(0, 300)}`);
  }

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

// ─── Sheets REST helpers ────────────────────────────────────────────────────

const SHEETS_BASE = "https://sheets.googleapis.com/v4/spreadsheets";

async function sheetsGet(
  token: string,
  spreadsheetId: string,
  path: string,
): Promise<unknown> {
  const res = await fetch(`${SHEETS_BASE}/${spreadsheetId}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Sheets GET ${path} failed: ${res.status} ${detail.slice(0, 300)}`);
  }
  return res.json();
}

async function sheetsPost(
  token: string,
  spreadsheetId: string,
  path: string,
  body: unknown,
): Promise<unknown> {
  const res = await fetch(`${SHEETS_BASE}/${spreadsheetId}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Sheets POST ${path} failed: ${res.status} ${detail.slice(0, 300)}`);
  }
  return res.json();
}

interface SheetTab {
  properties: { sheetId: number; title: string };
}

async function listTabs(
  token: string,
  spreadsheetId: string,
): Promise<SheetTab[]> {
  const data = (await sheetsGet(token, spreadsheetId, "")) as {
    sheets: SheetTab[];
  };
  return data.sheets || [];
}

async function addTab(
  token: string,
  spreadsheetId: string,
  title: string,
): Promise<void> {
  await sheetsPost(token, spreadsheetId, ":batchUpdate", {
    requests: [{ addSheet: { properties: { title } } }],
  });
}

async function clearAndWrite(
  token: string,
  spreadsheetId: string,
  range: string,
  values: unknown[][],
): Promise<void> {
  // Clear existing content first
  await sheetsPost(
    token,
    spreadsheetId,
    `/values/${encodeURIComponent(range)}:clear`,
    {},
  );
  // Write new content
  await fetch(
    `${SHEETS_BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ range, values }),
    },
  );
}

async function readRange(
  token: string,
  spreadsheetId: string,
  range: string,
): Promise<unknown[][]> {
  const data = (await sheetsGet(
    token,
    spreadsheetId,
    `/values/${encodeURIComponent(range)}`,
  )) as { values?: unknown[][] };
  return data.values || [];
}

// ─── Stripe balance transaction reader ──────────────────────────────────────

interface BalanceTxnDetail {
  id: string;
  type: string;
  amount: number; // dollars
  fee: number; // dollars
  created: string; // ISO
  description: string;
}

interface MonthStripeData {
  charges: number; // gross charge amount in dollars
  refunds: number; // refund amount in dollars (positive)
  fees: number; // Stripe fees in dollars (positive)
  shippingRevenue: number; // express shipping charges in dollars
  payouts: number; // payout amount in dollars (positive)
  chargeCount: number;
  refundDetails: BalanceTxnDetail[];
  allTxnTypes: Record<string, number>;
}

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Missing STRIPE_SECRET_KEY");
  return new Stripe(key);
}

export async function getStripeMonthData(month: string): Promise<MonthStripeData> {
  const stripe = getStripe();
  const [year, mon] = month.split("-").map(Number);

  // Month boundaries in UTC
  const startDate = new Date(Date.UTC(year, mon - 1, 1));
  const endDate = new Date(Date.UTC(year, mon, 1)); // first of next month

  const gte = Math.floor(startDate.getTime() / 1000);
  const lt = Math.floor(endDate.getTime() / 1000);

  let charges = 0;
  let refunds = 0;
  let fees = 0;
  const chargeSources = new Set<string>();
  const refundDetails: BalanceTxnDetail[] = [];
  const allTxnTypes: Record<string, number> = {};

  // Balance transactions for charges, refunds, fees
  let hasMore = true;
  let startingAfter: string | undefined;
  while (hasMore) {
    const params: Stripe.BalanceTransactionListParams = {
      created: { gte, lt },
      limit: 100,
    };
    if (startingAfter) params.starting_after = startingAfter;
    const page = await stripe.balanceTransactions.list(params);

    for (const txn of page.data) {
      allTxnTypes[txn.type] = (allTxnTypes[txn.type] || 0) + 1;

      if (txn.type === "charge" || txn.type === "payment") {
        charges += txn.amount; // in cents
        fees += txn.fee; // in cents
        const src = typeof txn.source === "string" ? txn.source : txn.source?.id;
        if (src) chargeSources.add(src);
      } else if (txn.type === "refund" || txn.type === "payment_refund") {
        refunds += Math.abs(txn.amount); // refunds are negative
        fees += txn.fee; // fee adjustment (usually negative, reducing fees)
        refundDetails.push({
          id: txn.id,
          type: txn.type,
          amount: Math.abs(txn.amount) / 100,
          fee: txn.fee / 100,
          created: new Date(txn.created * 1000).toISOString(),
          description: txn.description || "",
        });
      } else if (txn.type === "adjustment" || txn.type === "stripe_fee") {
        fees += txn.fee;
      }
    }

    hasMore = page.has_more;
    if (page.data.length > 0) startingAfter = page.data[page.data.length - 1].id;
  }

  // Shipping revenue: read from checkout sessions for this month
  // We get this from Airtable orders + session data, but for now compute
  // from the sessions via shipping_cost
  let shippingRevenue = 0;
  hasMore = true;
  startingAfter = undefined;
  while (hasMore) {
    const params: Stripe.Checkout.SessionListParams = {
      created: { gte, lt },
      limit: 100,
    };
    if (startingAfter) params.starting_after = startingAfter;
    const page = await stripe.checkout.sessions.list(params);

    for (const s of page.data) {
      if (s.payment_status !== "paid") continue;
      const shipCost = s.shipping_cost?.amount_total;
      if (shipCost && shipCost > 0) {
        shippingRevenue += shipCost; // in cents
      }
    }

    hasMore = page.has_more;
    if (page.data.length > 0) startingAfter = page.data[page.data.length - 1].id;
  }

  // Payouts by arrival_date within the month
  let payouts = 0;
  hasMore = true;
  startingAfter = undefined;
  while (hasMore) {
    const params: Stripe.PayoutListParams = {
      arrival_date: { gte, lt },
      limit: 100,
    };
    if (startingAfter) params.starting_after = startingAfter;
    const page = await stripe.payouts.list(params);

    for (const p of page.data) {
      if (p.status === "paid" || p.status === "in_transit") {
        payouts += p.amount; // in cents
      }
    }

    hasMore = page.has_more;
    if (page.data.length > 0) startingAfter = page.data[page.data.length - 1].id;
  }

  return {
    charges: charges / 100,
    refunds: refunds / 100,
    fees: Math.abs(fees) / 100,
    shippingRevenue: shippingRevenue / 100,
    payouts: payouts / 100,
    chargeCount: chargeSources.size,
    refundDetails,
    allTxnTypes,
  };
}

// ─── Airtable order aggregation ─────────────────────────────────────────────

interface MonthOrderData {
  unitsSold: number;
  unitsShippedStandard: number;
  unitsShippedExpress: number;
  bumpCount: number;
  otoCount: number;
  kitStandaloneCount: number;
  expressOrderCount: number;
  orderCount: number;
  unitRevenue: number; // from Amount field, unit orders only
  bumpRevenue: number;
  otoRevenue: number;
  kitStandaloneRevenue: number;
}

function aggregateMonthOrders(
  month: string,
  allOrders: Array<{ fields: Record<string, unknown> }>,
): MonthOrderData {
  const result: MonthOrderData = {
    unitsSold: 0,
    unitsShippedStandard: 0,
    unitsShippedExpress: 0,
    bumpCount: 0,
    otoCount: 0,
    kitStandaloneCount: 0,
    expressOrderCount: 0,
    orderCount: 0,
    unitRevenue: 0,
    bumpRevenue: 0,
    otoRevenue: 0,
    kitStandaloneRevenue: 0,
  };

  for (const row of allOrders) {
    const f = row.fields;
    const orderTs = (f.OrderTS as string) || "";
    if (!orderTs) continue;

    const orderMonth = orderTs.slice(0, 7); // YYYY-MM
    if (orderMonth !== month) continue;

    const itemType = (f.ItemType as string) || "";
    const amount = (f.Amount as number) || 0;
    const unitQty = (f.UnitQty as number) || 0;
    const shippingMethod = (f.ShippingMethod as string) || "standard";
    const refunded = (f.Refunded as boolean) || false;

    if (refunded) continue; // skip refunded orders from unit counts

    if (itemType === "kit") {
      // Standalone kit order (UnitQty = 0)
      result.kitStandaloneCount++;
      result.kitStandaloneRevenue += amount;
      continue;
    }

    // Unit-based order
    result.orderCount++;
    result.unitsSold += unitQty;

    if (shippingMethod === "express") {
      result.unitsShippedExpress += unitQty;
      result.expressOrderCount++;
    } else {
      result.unitsShippedStandard += unitQty;
    }

    if (f.BumpTaken) {
      result.bumpCount++;
    }

    if (f.OTOAccepted) {
      result.otoCount++;
      result.otoRevenue += (f.OTOAmount as number) || 0;
    }

    result.unitRevenue += amount;
  }

  return result;
}

// ─── Month tab layout ───────────────────────────────────────────────────────

// Row indices (0-based) for the month tab
// Column A = label, B = Accrual, C = Cash, D = Notes
const MONTH_ROWS = {
  header: 0,
  status: 1,
  blank1: 2,
  revenueHeader: 3,
  unitSales: 4,
  bumpRevenue: 5,
  otoRevenue: 6,
  kitStandalone: 7,
  expressShipping: 8,
  grossRevenue: 9,
  blank2: 10,
  lessRefunds: 11,
  lessStripeFees: 12,
  netRevenue: 13,
  blank3: 14,
  cogsHeader: 15,
  cogsStandard: 16,
  cogsExpress: 17,
  cogsBump: 18,
  cogsOto: 19,
  cogsKit: 20,
  totalCogs: 21,
  blank4: 22,
  grossProfit: 23,
  grossMargin: 24,
  blank5: 25,
  adSpend: 26,
  fixedOpex: 27,
  blank6: 28,
  ebitda: 29,
  blank7: 30,
  cashHeader: 31,
  stripePayouts: 32,
  supplierPayments: 33,
  adCharges: 34,
  netCashChange: 35,
  blank8: 36,
  distributionHeader: 37,
  freeCash: 38,
  workingCapital: 39,
  distributable: 40,
  ownerPay: 41,
  taxSetAside: 42,
} as const;

// The Inputs tab layout
const INPUTS_ROWS = {
  header: 0,
  landedCostStandard: 1,  // B2
  landedCostExpress: 2,   // B3
  kitLandedCost: 3,       // B4
  bumpLandedCost: 4,      // B5
  blank1: 5,
  opexHeader: 6,
  // Opex items start at row 8 (index 7): Vercel, Zoho, Airtable, iPostal1, domains, GWorkspace, other
  opexStart: 7,           // B8 through B14
  opexEnd: 13,            // B14
  blank2: 14,
  ownerPayPct: 15,        // B16
  taxSetAsidePct: 16,     // B17
} as const;

function buildInputsTab(): unknown[][] {
  return [
    ["INPUTS", "Amount", "Notes"],
    ["Landed cost per unit (standard)", 113, ""],
    ["Landed cost per unit (express)", 128, ""],
    ["Kit landed cost", "", "Blank until quoted"],
    ["Bump cartridge landed cost", 20, "Flat — rides in unit box"],
    ["", "", ""],
    ["FIXED MONTHLY OPEX", "Amount", "Notes"],
    ["Vercel", "", ""],
    ["Zoho", "", ""],
    ["Airtable", "", ""],
    ["iPostal1", "", ""],
    ["Domains", "", ""],
    ["Google Workspace", "", ""],
    ["Other", "", ""],
    ["", "", ""],
    ["Owner pay allocation %", "", ""],
    ["Tax set-aside %", "", ""],
  ];
}

function buildSupplierInvoicesTab(): unknown[][] {
  return [
    ["SUPPLIER INVOICES", "", "", "", ""],
    ["Date", "Amount", "Units", "Shipping Method", "Note"],
  ];
}

function buildAdSpendTab(): unknown[][] {
  return [
    ["AD SPEND", "", ""],
    ["Platform", "Month (YYYY-MM)", "Amount"],
  ];
}

function buildMonthTab(
  month: string,
  stripeData: MonthStripeData,
  orderData: MonthOrderData,
): unknown[][] {
  const rows: unknown[][] = new Array(43).fill(null).map(() => ["", "", "", ""]);

  // Helper: Inputs tab cell references
  const INP_STD = "Inputs!B2";
  const INP_EXP = "Inputs!B3";
  const INP_KIT = "Inputs!B4";
  const INP_BUMP = "Inputs!B5";
  const INP_OPEX_RANGE = "Inputs!B8:B14";
  const INP_OWNER_PCT = "Inputs!B16";
  const INP_TAX_PCT = "Inputs!B17";

  // Supplier invoices: SUMPRODUCT for this month
  // Column A = dates, B = amounts, D = shipping method
  const SI_AMOUNT = "'Supplier Invoices'!B:B";
  const SI_DATE = "'Supplier Invoices'!A:A";
  const supplierMonthFormula = `=IFERROR(SUMPRODUCT((TEXT(${SI_DATE},"YYYY-MM")="${month}")*(${SI_AMOUNT})),0)`;

  // Ad spend: SUMPRODUCT for this month
  const AD_MONTH = "'Ad Spend'!B:B";
  const AD_AMOUNT = "'Ad Spend'!C:C";
  const adMonthFormula = `=IFERROR(SUMPRODUCT((${AD_MONTH}="${month}")*(${AD_AMOUNT})),0)`;

  // Row references within the sheet (1-indexed for Sheets)
  const R = (n: number) => n + 1;

  // Header
  // Prefix with ' to prevent Sheets from parsing YYYY-MM as a date
  rows[MONTH_ROWS.header] = [`'${month}`, "Accrual", "Cash", "Notes"];
  rows[MONTH_ROWS.status] = ["Status", "draft", "", ""];

  // Revenue — Stripe charges is the verified gross. Break out OTO, kit, and shipping
  // from Airtable; unit sales (incl. bumps) is the remainder.
  const otoRev = orderData.otoRevenue;
  const kitRev = orderData.kitStandaloneRevenue;
  const shipRev = stripeData.shippingRevenue;
  const unitSalesRev = stripeData.charges - otoRev - kitRev - shipRev;

  rows[MONTH_ROWS.revenueHeader] = ["REVENUE", "", "", ""];
  rows[MONTH_ROWS.unitSales] = [
    "Unit sales (incl. bumps)",
    unitSalesRev,
    unitSalesRev,
    `${orderData.unitsSold} units, ${orderData.bumpCount} bumps`,
  ];
  rows[MONTH_ROWS.bumpRevenue] = [
    "Bump (spare cartridge)",
    "",
    "",
    `${orderData.bumpCount} included above`,
  ];
  rows[MONTH_ROWS.otoRevenue] = [
    "OTO (spares kit)",
    otoRev,
    otoRev,
    `${orderData.otoCount} OTOs`,
  ];
  rows[MONTH_ROWS.kitStandalone] = [
    "Kit standalone",
    kitRev,
    kitRev,
    `${orderData.kitStandaloneCount} kits`,
  ];
  rows[MONTH_ROWS.expressShipping] = [
    "Express shipping charges",
    shipRev,
    shipRev,
    `${orderData.expressOrderCount} express orders`,
  ];
  rows[MONTH_ROWS.grossRevenue] = [
    "Gross revenue",
    `=SUM(B${R(MONTH_ROWS.unitSales)}:B${R(MONTH_ROWS.expressShipping)})`,
    `=SUM(C${R(MONTH_ROWS.unitSales)}:C${R(MONTH_ROWS.expressShipping)})`,
    "",
  ];

  // Deductions
  rows[MONTH_ROWS.lessRefunds] = [
    "Less refunds",
    stripeData.refunds,
    stripeData.refunds,
    "",
  ];
  rows[MONTH_ROWS.lessStripeFees] = [
    "Less Stripe fees",
    stripeData.fees,
    stripeData.fees,
    "",
  ];
  rows[MONTH_ROWS.netRevenue] = [
    "Net revenue",
    `=B${R(MONTH_ROWS.grossRevenue)}-B${R(MONTH_ROWS.lessRefunds)}-B${R(MONTH_ROWS.lessStripeFees)}`,
    `=C${R(MONTH_ROWS.grossRevenue)}-C${R(MONTH_ROWS.lessRefunds)}-C${R(MONTH_ROWS.lessStripeFees)}`,
    "",
  ];

  // COGS
  rows[MONTH_ROWS.cogsHeader] = ["COGS", "", "", ""];
  rows[MONTH_ROWS.cogsStandard] = [
    "Units shipped (standard)",
    `=${orderData.unitsShippedStandard}*${INP_STD}`,
    "",
    `${orderData.unitsShippedStandard} units`,
  ];
  rows[MONTH_ROWS.cogsExpress] = [
    "Units shipped (express)",
    `=${orderData.unitsShippedExpress}*${INP_EXP}`,
    "",
    `${orderData.unitsShippedExpress} units`,
  ];
  rows[MONTH_ROWS.cogsBump] = [
    "Bump cartridges",
    `=${orderData.bumpCount}*${INP_BUMP}`,
    "",
    `${orderData.bumpCount} bumps`,
  ];
  rows[MONTH_ROWS.cogsOto] = [
    "OTO kits",
    `=${orderData.otoCount}*IF(${INP_KIT}="",0,${INP_KIT})`,
    "",
    `${orderData.otoCount} OTOs`,
  ];
  rows[MONTH_ROWS.cogsKit] = [
    "Kit standalone",
    `=${orderData.kitStandaloneCount}*IF(${INP_KIT}="",0,${INP_KIT})`,
    "",
    `${orderData.kitStandaloneCount} kits`,
  ];
  rows[MONTH_ROWS.totalCogs] = [
    "Total COGS",
    `=SUM(B${R(MONTH_ROWS.cogsStandard)}:B${R(MONTH_ROWS.cogsKit)})`,
    supplierMonthFormula,
    "Cash = supplier invoices paid",
  ];

  // Gross profit
  rows[MONTH_ROWS.grossProfit] = [
    "Gross profit",
    `=B${R(MONTH_ROWS.netRevenue)}-B${R(MONTH_ROWS.totalCogs)}`,
    `=C${R(MONTH_ROWS.netRevenue)}-C${R(MONTH_ROWS.totalCogs)}`,
    "",
  ];
  rows[MONTH_ROWS.grossMargin] = [
    "Gross margin %",
    `=IF(B${R(MONTH_ROWS.netRevenue)}=0,"",B${R(MONTH_ROWS.grossProfit)}/B${R(MONTH_ROWS.netRevenue)})`,
    `=IF(C${R(MONTH_ROWS.netRevenue)}=0,"",C${R(MONTH_ROWS.grossProfit)}/C${R(MONTH_ROWS.netRevenue)})`,
    "",
  ];

  // Operating expenses
  rows[MONTH_ROWS.adSpend] = [
    "Ad spend",
    adMonthFormula,
    adMonthFormula,
    "",
  ];
  rows[MONTH_ROWS.fixedOpex] = [
    "Fixed opex",
    `=SUM(${INP_OPEX_RANGE})`,
    `=SUM(${INP_OPEX_RANGE})`,
    "",
  ];

  // EBITDA
  rows[MONTH_ROWS.ebitda] = [
    "Operating profit (EBITDA)",
    `=B${R(MONTH_ROWS.grossProfit)}-B${R(MONTH_ROWS.adSpend)}-B${R(MONTH_ROWS.fixedOpex)}`,
    `=C${R(MONTH_ROWS.grossProfit)}-C${R(MONTH_ROWS.adSpend)}-C${R(MONTH_ROWS.fixedOpex)}`,
    "",
  ];

  // Cash section
  rows[MONTH_ROWS.cashHeader] = ["CASH", "", "", ""];
  rows[MONTH_ROWS.stripePayouts] = [
    "Stripe payouts received",
    "",
    stripeData.payouts,
    "",
  ];
  rows[MONTH_ROWS.supplierPayments] = [
    "Supplier payments made",
    "",
    supplierMonthFormula,
    "",
  ];
  rows[MONTH_ROWS.adCharges] = [
    "Ad charges",
    "",
    adMonthFormula,
    "",
  ];
  rows[MONTH_ROWS.netCashChange] = [
    "Net cash change",
    "",
    `=C${R(MONTH_ROWS.stripePayouts)}-C${R(MONTH_ROWS.supplierPayments)}-C${R(MONTH_ROWS.adCharges)}-C${R(MONTH_ROWS.fixedOpex)}`,
    "",
  ];

  // Distribution block
  rows[MONTH_ROWS.distributionHeader] = ["DISTRIBUTION", "", "", ""];
  rows[MONTH_ROWS.freeCash] = [
    "Free cash",
    "",
    `=C${R(MONTH_ROWS.netCashChange)}`,
    "",
  ];
  rows[MONTH_ROWS.workingCapital] = [
    "Next 3 months working capital",
    "",
    `=3*((B${R(MONTH_ROWS.totalCogs)}+B${R(MONTH_ROWS.adSpend)}))`,
    "3 x (COGS + ad spend)",
  ];
  rows[MONTH_ROWS.distributable] = [
    "Distributable",
    "",
    `=MAX(0,C${R(MONTH_ROWS.freeCash)}-C${R(MONTH_ROWS.workingCapital)})`,
    "",
  ];
  rows[MONTH_ROWS.ownerPay] = [
    "Owner pay",
    "",
    `=IF(${INP_OWNER_PCT}="",0,C${R(MONTH_ROWS.distributable)}*${INP_OWNER_PCT})`,
    "",
  ];
  rows[MONTH_ROWS.taxSetAside] = [
    "Tax set-aside",
    "",
    `=IF(${INP_TAX_PCT}="",0,C${R(MONTH_ROWS.distributable)}*${INP_TAX_PCT})`,
    "",
  ];

  return rows;
}

// ─── Summary tab ────────────────────────────────────────────────────────────

async function writeSummaryTab(
  token: string,
  spreadsheetId: string,
  monthTabs: string[],
): Promise<void> {
  const tabs = await listTabs(token, spreadsheetId);
  const hasTab = tabs.some((t) => t.properties.title === "Summary");
  if (!hasTab) await addTab(token, spreadsheetId, "Summary");

  const header = [
    "Month",
    "Units shipped",
    "Net revenue",
    "COGS",
    "Gross profit",
    "GP%",
    "Ad spend",
    "Fixed opex",
    "EBITDA",
    "Net cash change",
    "AOV",
  ];

  const sorted = [...monthTabs].sort();
  const rows: unknown[][] = [header];

  for (const tab of sorted) {
    const R = (n: number) => n + 1;
    const ref = (row: number) => `'${tab}'!B${R(row)}`;
    const cRef = (row: number) => `'${tab}'!C${R(row)}`;
    const dataRow = rows.length + 1; // 1-indexed row this data will land on

    rows.push([
      `'${tab}`,
      `=VALUE(REGEXEXTRACT('${tab}'!D${R(MONTH_ROWS.unitSales)},"([0-9]+)"))`,
      `=${ref(MONTH_ROWS.netRevenue)}`,
      `=${ref(MONTH_ROWS.totalCogs)}`,
      `=${ref(MONTH_ROWS.grossProfit)}`,
      `=${ref(MONTH_ROWS.grossMargin)}`,
      `=${ref(MONTH_ROWS.adSpend)}`,
      `=${ref(MONTH_ROWS.fixedOpex)}`,
      `=${ref(MONTH_ROWS.ebitda)}`,
      `=${cRef(MONTH_ROWS.netCashChange)}`,
      `=IF(B${dataRow}=0,"",C${dataRow}/B${dataRow})`,
    ]);
  }

  // YTD row
  const lastDataRow = rows.length;
  const ytdRow: unknown[] = ["YTD"];
  for (let col = 1; col < header.length; col++) {
    const colLetter = String.fromCharCode(66 + col - 1); // B, C, D...
    if (col === 5) {
      // GP% = gross profit / net revenue
      ytdRow.push(`=IF(C${lastDataRow + 1}=0,"",E${lastDataRow + 1}/C${lastDataRow + 1})`);
    } else if (col === 10) {
      // AOV = net revenue / units
      ytdRow.push(`=IF(B${lastDataRow + 1}=0,"",C${lastDataRow + 1}/B${lastDataRow + 1})`);
    } else {
      ytdRow.push(`=SUM(${colLetter}2:${colLetter}${lastDataRow})`);
    }
  }
  rows.push(ytdRow);

  await clearAndWrite(token, spreadsheetId, "Summary!A1:K" + (rows.length + 5), rows);
}

// ─── Reconciliation ─────────────────────────────────────────────────────────

interface UnmatchedSession {
  sessionId: string;
  amount: number;
  email: string;
  livemode: boolean;
  created: string;
}

async function reconcileSessions(
  month: string,
  allOrders: Array<{ fields: Record<string, unknown> }>,
): Promise<UnmatchedSession[]> {
  const stripe = getStripe();
  const [year, mon] = month.split("-").map(Number);
  const gte = Math.floor(new Date(Date.UTC(year, mon - 1, 1)).getTime() / 1000);
  const lt = Math.floor(new Date(Date.UTC(year, mon, 1)).getTime() / 1000);

  const airtableSids = new Set(
    allOrders
      .filter((r) => {
        const ts = (r.fields.OrderTS as string) || "";
        return ts.slice(0, 7) === month;
      })
      .map((r) => r.fields.StripeSessionId as string),
  );

  const unmatched: UnmatchedSession[] = [];
  let hasMore = true;
  let startingAfter: string | undefined;
  while (hasMore) {
    const params: Stripe.Checkout.SessionListParams = {
      created: { gte, lt },
      limit: 100,
    };
    if (startingAfter) params.starting_after = startingAfter;
    const page = await stripe.checkout.sessions.list(params);

    for (const s of page.data) {
      if (s.payment_status !== "paid") continue;
      if (!airtableSids.has(s.id)) {
        unmatched.push({
          sessionId: s.id,
          amount: (s.amount_total || 0) / 100,
          email: s.customer_details?.email || "",
          livemode: s.livemode,
          created: new Date(s.created * 1000).toISOString(),
        });
      }
    }

    hasMore = page.has_more;
    if (page.data.length > 0) startingAfter = page.data[page.data.length - 1].id;
  }

  return unmatched;
}

// ─── Main runner ────────────────────────────────────────────────────────────

export interface PnlResult {
  month: string;
  tabCreated: boolean;
  stripeData: MonthStripeData;
  orderData: MonthOrderData;
  summaryMonths: string[];
  unmatchedSessions: UnmatchedSession[];
}

export async function runPnl(month: string): Promise<PnlResult> {
  // Validate month format
  if (!/^\d{4}-\d{2}$/.test(month)) {
    throw new Error(`Invalid month format: ${month}. Expected YYYY-MM.`);
  }

  const sa = getServiceAccountKey();
  const spreadsheetId = getSheetId();
  const token = await getAccessToken(sa);

  // Check existing tabs
  const tabs = await listTabs(token, spreadsheetId);
  const tabNames = tabs.map((t) => t.properties.title);

  // Ensure scaffold tabs exist
  for (const [name, builder] of [
    ["Inputs", buildInputsTab],
    ["Supplier Invoices", buildSupplierInvoicesTab],
    ["Ad Spend", buildAdSpendTab],
  ] as const) {
    if (!tabNames.includes(name)) {
      await addTab(token, spreadsheetId, name);
      const data = builder();
      await clearAndWrite(token, spreadsheetId, `'${name}'!A1`, data);
    }
  }

  // Check if month tab exists and is closed
  const existingTab = tabNames.includes(month);
  if (existingTab) {
    const statusCell = await readRange(token, spreadsheetId, `'${month}'!B2`);
    const status = statusCell?.[0]?.[0];
    if (status === "closed") {
      throw new Error(`Month ${month} is closed. Will not overwrite.`);
    }
  }

  // Fetch data — get full order list once for both aggregation and reconciliation
  const allOrders = await listAllOrders();
  const [stripeData, orderData] = await Promise.all([
    getStripeMonthData(month),
    Promise.resolve(aggregateMonthOrders(month, allOrders)),
  ]);

  // Reconcile Stripe sessions vs Airtable orders
  const unmatchedSessions = await reconcileSessions(month, allOrders);

  // Create tab if needed
  let tabCreated = false;
  if (!existingTab) {
    await addTab(token, spreadsheetId, month);
    tabCreated = true;
  }

  // Write month tab
  const monthRows = buildMonthTab(month, stripeData, orderData);
  await clearAndWrite(token, spreadsheetId, `'${month}'!A1:D${monthRows.length}`, monthRows);

  // Refresh tabs list for summary
  const updatedTabs = await listTabs(token, spreadsheetId);
  const monthTabs = updatedTabs
    .map((t) => t.properties.title)
    .filter((name) => /^\d{4}-\d{2}$/.test(name));

  // Write summary
  await writeSummaryTab(token, spreadsheetId, monthTabs);

  return {
    month,
    tabCreated,
    stripeData,
    orderData,
    summaryMonths: monthTabs.sort(),
    unmatchedSessions,
  };
}
