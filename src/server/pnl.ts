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
        // Revenue math only — count derived from paid checkout sessions below
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

  // Shipping revenue + paid session count from checkout sessions
  let shippingRevenue = 0;
  let paidSessionCount = 0;
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
      paidSessionCount++;
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
    chargeCount: paidSessionCount,
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

// ─── BOM + README one-shot write ─────────────────────────────────────────────

function fmtBlue(sheetId: number, r: number, c: number, re?: number, ce?: number): object {
  return {
    repeatCell: {
      range: { sheetId, startRowIndex: r, endRowIndex: re ?? r + 1, startColumnIndex: c, endColumnIndex: ce ?? c + 1 },
      cell: { userEnteredFormat: { textFormat: { foregroundColor: { red: 0, green: 0, blue: 1 } } } },
      fields: "userEnteredFormat.textFormat.foregroundColor",
    },
  };
}
function fmtYellow(sheetId: number, r: number, c: number): object {
  return {
    repeatCell: {
      range: { sheetId, startRowIndex: r, endRowIndex: r + 1, startColumnIndex: c, endColumnIndex: c + 1 },
      cell: { userEnteredFormat: { backgroundColor: { red: 1, green: 1, blue: 0 } } },
      fields: "userEnteredFormat.backgroundColor",
    },
  };
}
function fmtBold(sheetId: number, r: number, cols: number): object {
  return {
    repeatCell: {
      range: { sheetId, startRowIndex: r, endRowIndex: r + 1, startColumnIndex: 0, endColumnIndex: cols },
      cell: { userEnteredFormat: { textFormat: { bold: true } } },
      fields: "userEnteredFormat.textFormat.bold",
    },
  };
}

export async function writeBomTabs(): Promise<{ tabsCreated: string[]; inputsUpdated: boolean }> {
  const sa = getServiceAccountKey();
  const spreadsheetId = getSheetId();
  const token = await getAccessToken(sa);
  const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // ── Create new tabs ──
  let tabs = await listTabs(token, spreadsheetId);
  const needed = ["README", "BOM", "Shipping tiers", "Landed scenarios", "Add-on economics", "BOM sources"];
  for (const name of needed) {
    if (!tabs.some((t) => t.properties.title === name)) {
      await addTab(token, spreadsheetId, name);
    }
  }
  tabs = await listTabs(token, spreadsheetId);
  const gid = (name: string) => {
    const t = tabs.find((x) => x.properties.title === name);
    if (!t) throw new Error(`Tab not found: ${name}`);
    return t.properties.sheetId;
  };

  // ── README ──
  const readmeData: unknown[][] = [
    ["AG Water Softener — P&L Sheet and operations reference"],
    ["SOP v1, Sep 5, 2026"],
    [""],
    ["Owner-run. Everything here takes under 15 minutes on a normal day. Automated steps are marked AUTO; everything else is a tick, a paste, or a read."],
    [""],
    ["THE DAILY RHYTHM"],
    ["When (ET)", "What", "Who"],
    ["~3:00 AM", "Cathy's cutoff (3 PM Beijing). Orders paid before this make today's batch.", "AUTO"],
    ["Morning", "1. Read the digest. 2. Send batch to Cathy. 3. Enter tracking. 4. Tick notifications.", "You"],
    ["Every 15 min", "Fulfill cron: validates tracking, sends notifications, logs timestamps.", "AUTO"],
    ["Evening (opt.)", "Second glance at Ops view for late orders and Cathy replies.", "You"],
    [""],
    ["1. ORDERS ARRIVING"],
    ["AUTO. Paid checkout writes the Airtable row (order number, customer, address, first-touch, Verdict, ItemType, PromisedBy, IntakeBlock). Status: intake-ready."],
    ["You do nothing here. Missing row for a Stripe order = bug. Note the session ID and flag it."],
    [""],
    ["2. SENDING THE BATCH TO CATHY"],
    ["Each morning, Ops view, filter Status = intake-ready:"],
    ["1. Copy each row's IntakeBlock into one Alibaba message (one message, all orders, per her request)."],
    ["2. She sends one payment link. Pay it."],
    ["3. Tick SentToSupplier. Cron sets SentToSupplierTS + Status = sent-to-supplier within 15 min."],
    ["Express orders show Shipping: EXPRESS in the block. Kit-only orders (ItemType = kit) go in the same message."],
    [""],
    ["3. TRACKING NUMBERS COMING BACK"],
    ["Cathy returns tracking numbers in the batch document. For each:"],
    ["1. Paste number into the row's Tracking field."],
    ["2. Cron validates format, sets Carrier. Valid = ready-to-notify. Invalid = flagged (check for typo)."],
    ["3. Review Pending view. If the email reads right, tick Notify."],
    ["4. Cron sends shipping confirmation, sets ConfirmationSentTS + ShippedTS + Status = shipped. Cannot send twice."],
    ["Rule: a tracking number is not a promise kept. The Notify tick is. Do not leave rows in ready-to-notify overnight."],
    [""],
    ["4. DELIVERY AND CHECK-IN"],
    ["When tracking shows delivered (check FedEx/17track for shipped rows past ~10 days):"],
    ["1. Enter carrier's delivery date in DeliveredDate (the date FedEx shows, not today's date)."],
    ["2. Tick NotifyCheckIn. Cron sends check-in email, sets CheckInTS + Status = delivered."],
    ["3. If DeliveredDate is empty, check-in is blocked on purpose."],
    [""],
    ["5. CANCELLATIONS AND REFUNDS"],
    ["Refund in Stripe first. charge.refunded webhook sets Refunded + RefundTS + Status = cancelled (AUTO). Then:"],
    ["1. If order already in Cathy's batch, message her to pull it (hold the packed unit, never unpack)."],
    ["2. Ana confirms to customer only after refund is issued."],
    ["3. Untick any Notify boxes on the row."],
    [""],
    ["6. CUSTOMER EMAILS (ANA)"],
    ["Reply from support@agsoftener.com only. Ana never mentions the supplier, China, customs, or anything upstream."],
    ["Tracking questions: quote the tracking number and what the carrier page shows."],
    ["Claimed non-delivery: give tracking, delivery time/location, photo note, offer to take it up with FedEx. Do not volunteer a replacement in the first reply."],
    ["Late shipments: commit to a dated update, not a delivery date. Every promise Ana makes gets a date on your calendar."],
    [""],
    ["7. WATCHING THE CLOCKS"],
    ["Daily, in the Ops view:"],
    ["intake-ready older than 24 hours: you missed a batch."],
    ["sent-to-supplier older than 10 days, no tracking: ask Cathy."],
    ["Past PromisedBy, not delivered: check carrier; Ana emails customer if stalled."],
    ["ready-to-notify: tick Notify or find out why."],
    [""],
    ["8. WEEKLY (SUNDAY)"],
    ["GSC pull, both properties. Ads search-terms report. Indexing check."],
    ["Cathy thread review: anything open more than 7 days gets a nudge."],
    ["Clear VerdictLegacy after end of September."],
    [""],
    ["9. MONTHLY (BY THE 15TH)"],
    ["Close prior month's books: revenue (Stripe), refunds, fees, ad spend, supplier payments, fixed costs. Cash and accrual side by side."],
    ["Compute: free cash minus next three months' working capital = distributable."],
    ["Update BOM if Cathy's prices moved."],
    [""],
    ["TOOLS"],
    ["Airtable Ops view: OrderNumber, Name, OrderTS, ItemType, Verdict, Status, Tracking, PromisedBy, Delivered, Notify."],
    ["Pending view: rows in ready-to-notify with the email preview."],
    ["Fulfill now (skip 15-min wait): fulfill-dry then fulfill in Terminal."],
    ["Cathy: Alibaba chat; cutoff 3:00 PM Beijing."],
    ["Stripe: refunds, disputes, the receipt number customers quote."],
    [""],
    ["WHAT IS STILL MANUAL"],
    ["Step", "Manual today", "Automates when"],
    ["Paste batch to Cathy", "yes", "she gives an email address"],
    ["Enter tracking", "yes", "she returns it in a shared sheet the script reads"],
    ["Mark delivered", "yes", "a carrier tracking API is added"],
    ["Read the numbers", "Ops view", "Phase 3b digest email"],
    [""],
    ["LINKS"],
    ["Airtable base", "https://airtable.com/appaf8mnGx7nO6f3B"],
    ["Airtable Ops view", "Open base → Orders table → Ops view"],
    ["Airtable Pending view", "Open base → Orders table → Pending view"],
    ["Stripe dashboard", "https://dashboard.stripe.com"],
    ["Google Merchant Center", "https://merchants.google.com"],
    [`=HYPERLINK("#gid=${gid("BOM")}","BOM tab")`, "Bill of materials"],
    [`=HYPERLINK("#gid=${gid("Shipping tiers")}","Shipping tiers tab")`, "Cathy price-break table"],
    [`=HYPERLINK("#gid=${gid("Landed scenarios")}","Landed scenarios tab")`, "Landed cost by route"],
    [`=HYPERLINK("#gid=${gid("Add-on economics")}","Add-on economics tab")`, "Bump and OTO margins"],
    [`=HYPERLINK("#gid=${gid("BOM sources")}","BOM sources tab")`, "Source log and open questions"],
  ];
  const readmeBoldRows = [0, 5, 6, 12, 16, 23, 31, 37, 43, 49, 55, 59, 63, 71, 72, 79];
  await clearAndWrite(token, spreadsheetId, `'README'!A1:C${readmeData.length + 2}`, readmeData);

  // ── BOM ──
  const bomData: unknown[][] = [
    ["Bill of materials — what AG ships per order (Cathy catalog, EXW USD)"],
    ["Catalog line 'Softener Unit + Brine Tank Package' = $45 EXW. Sub-components from the same catalog. Supplier: Cathy Xie (Alibaba). Model H1-230KM."],
    ["Component", "Contents", "EXW USD", "Ships in AG order?", "Dims (cm)", "Weight (kg)", "Source (date)"],
    ["Softener unit package", "Softener unit (1), hose (1), wrench (1), adhesive hooks (2), English manual, Teflon tape", 30, "Yes", "13\u00d713\u00d735", 2, "Cathy catalog Jun 30 2026; re-sent Sep 4 2026"],
    ["Brine tank package", "Brine tank (1), regeneration pump + adapter (1 set)", 15, "Yes", "19\u00d724\u00d736", 2, "Cathy catalog Jun 30 2026"],
    ["Spare filter package (cartridge)", "Softener filter cartridge (1) — the cart-drawer bump SKU", 20, "Only if bump taken", "13\u00d713\u00d735", 1.8, "Cathy catalog Jun 30 2026"],
    ["Spares Kit (mount adapter, adhesive mount, regeneration attachment)", "Second set of mounting + recharge parts — OTO / standalone SKU", "", "Only if OTO or kit ordered", "", "", "EXW not yet quoted separately; ASK CATHY"],
    [],
    ["Standard AG order, product only (unit + brine tank)", "", "=C4+C5", "Equals catalog 'Softener Unit + Brine Tank Package' line"],
    ["Combined shipped box (unit + brine tank)", "", "", "", "20\u00d725\u00d738", 3.8, "Cathy price table Aug 20 2026"],
    [],
    ["Note: brine tank is the shipping-cost driver. Unit alone air DDP = $35 (Sep 4 quote); unit + tank air DDP = $65 (Aug 20 table). The tank adds ~$30 of air shipping on $15 of product."],
  ];
  await clearAndWrite(token, spreadsheetId, "'BOM'!A1:G12", bomData);

  // ── Shipping tiers ──
  const stData: unknown[][] = [
    ["Cathy price-break table — Softener Unit + Brine Tank Package (Aug 20 2026)"],
    ["Air cartons ship to ONE address. Sea = DDP to a US address, 25-30 days. Air per-order = 8-15 days quoted (site promise 12-18)."],
    ["Route", "Qty per shipment", "Product USD/unit", "Ship DDP USD/unit", "Product + ship USD/unit", "Transit (days)", "Ships to"],
    ["Air, per order", 1, 45, 65, "=C4+D4", "8-15", "customer"],
    ["Air, 1 carton", 2, 45, 60, "=C5+D5", "8-12", "one address"],
    ["Air, 1 carton", 3, 45, 55, "=C6+D6", "8-12", "one address"],
    ["Air, 1 carton", 4, 45, 55, "=C7+D7", "8-12", "one address"],
    ["Air, 1 carton", 5, 45, 52, "=C8+D8", "8-12", "one address"],
    ["Air, 1 carton", 6, 45, 52, "=C9+D9", "8-12", "one address"],
    ["Sea DDP", 10, 44, 20, "=C10+D10", "25-30", "one US address"],
    ["Sea DDP", 20, 43, 18, "=C11+D11", "25-30", "one US address"],
    ["Sea DDP", 30, 42, 17, "=C12+D12", "25-30", "one US address"],
    ["Sea DDP", 40, 41, 16, "=C13+D13", "25-30", "one US address"],
    ["Sea DDP", 50, 40, 16, "=C14+D14", "25-30", "one US address"],
    ["Sea DDP", 100, 40, 16, "=C15+D15", "25-30", "one US address"],
    [],
    ["Also quoted: 'If 10 sets, by sea DDP, the total shipping cost is 200 USD' (Aug 20) = $20/unit, consistent with row 10."],
  ];
  await clearAndWrite(token, spreadsheetId, "'Shipping tiers'!A1:G17", stData);

  // ── Landed scenarios ── (rewired: standard→Inputs!B2, express→Inputs!B3)
  const lsData: unknown[][] = [
    ["Landed cost per unit delivered to the customer, by route"],
    ["Formulas pull from Shipping tiers and Inputs. Change inputs there, not here. Domestic ship applies only to routes that land at your address first."],
    ["Route", "Qty", "Product", "Intl ship DDP", "Duties/other", "Card fee", "Domestic ship to customer", "Landed / unit", "COGS % of $249", "Gross margin / unit", "Breakeven CAC (margin minus Stripe fee)", "Days to customer"],
    // Row 4: Air, per order — standard
    ["Air, per order — standard (today)", "='Shipping tiers'!B4", "='Shipping tiers'!C4", "='Shipping tiers'!D4", "=H4-C4-D4-F4-G4", "=Inputs!B24", 0, "=Inputs!B2", "=H4/Inputs!$B$20", "=Inputs!$B$20-H4", "=J4-Inputs!$B$25", "12-18"],
    // Row 5: Air, per order — express (NEW)
    ["Air, per order — express", 1, 45, 80, "=H5-C5-D5-F5-G5", "=Inputs!B24", 0, "=Inputs!B3", "=H5/Inputs!$B$20", "=Inputs!$B$20-H5", "=J5-Inputs!$B$25", "4-7 business days"],
    // Row 6: Air, 6-carton to NJ
    ["Air, 6-carton to NJ", "='Shipping tiers'!B9", "='Shipping tiers'!C9", "='Shipping tiers'!D9", 0, "=Inputs!B24", "=Inputs!B26", "=C6+D6+E6+F6+G6", "=H6/Inputs!$B$20", "=Inputs!$B$20-H6", "=J6-Inputs!$B$25", "3-5 after stock"],
    // Row 7: Sea, 10 to NJ
    ["Sea, 10 to NJ", "='Shipping tiers'!B10", "='Shipping tiers'!C10", "='Shipping tiers'!D10", 0, "=Inputs!B24", "=Inputs!B26", "=C7+D7+E7+F7+G7", "=H7/Inputs!$B$20", "=Inputs!$B$20-H7", "=J7-Inputs!$B$25", "3-5 after stock"],
    // Row 8: Sea, 20 to NJ
    ["Sea, 20 to NJ", "='Shipping tiers'!B11", "='Shipping tiers'!C11", "='Shipping tiers'!D11", 0, "=Inputs!B24", "=Inputs!B26", "=C8+D8+E8+F8+G8", "=H8/Inputs!$B$20", "=Inputs!$B$20-H8", "=J8-Inputs!$B$25", "3-5 after stock"],
    // Row 9: Sea, 50 to NJ
    ["Sea, 50 to NJ", "='Shipping tiers'!B14", "='Shipping tiers'!C14", "='Shipping tiers'!D14", 0, "=Inputs!B24", "=Inputs!B26", "=C9+D9+E9+F9+G9", "=H9/Inputs!$B$20", "=Inputs!$B$20-H9", "=J9-Inputs!$B$25", "3-5 after stock"],
    // Row 10: Sea, 100 to NJ
    ["Sea, 100 to NJ", "='Shipping tiers'!B15", "='Shipping tiers'!C15", "='Shipping tiers'!D15", 0, "=Inputs!B24", "=Inputs!B26", "=C10+D10+E10+F10+G10", "=H10/Inputs!$B$20", "=Inputs!$B$20-H10", "=J10-Inputs!$B$25", "3-5 after stock"],
    [],
    ["Reading: shipping is ~53% of today's landed cost. Sea + domestic fulfillment cuts landed by roughly $30-35/unit and cuts delivery time by ~10 days. Working capital required = qty x (product + intl ship), wired 25-30 days ahead."],
    ["Working capital per sea order:"],
    ["10 units", "=B7*(C7+D7)"],
    ["20 units", "=B8*(C8+D8)"],
    ["50 units", "=B9*(C9+D9)"],
    [],
    ["Sea pilot trigger (owner, Sep 5 2026): a month closing with $1,500 cash cushion above expenses OR first week of Meta at CAC under $100."],
  ];
  await clearAndWrite(token, spreadsheetId, `'Landed scenarios'!A1:L${lsData.length}`, lsData);

  // ── Add-on economics ── (rewired: retail→Inputs, kit standalone cost→Inputs!B4)
  const aeData: unknown[][] = [
    ["Bump and OTO margin — ride in the unit box (marginal shipping = $0)"],
    [],
    ["Add-on", "Retail", "EXW cost", "Marginal ship", "Gross margin", "Margin %", "Note"],
    ["Spare cartridge (cart bump)", "=Inputs!B23", "='BOM'!C6", 0, "=B4-C4-D4", "=E4/B4", "Rides in the same box per Cathy (Sep 2 2026 confirmation)"],
    ["Spares Kit (post-purchase OTO, $39)", "=Inputs!B22", "='BOM'!C7", 0, "=B5-C5-D5", "=IF(B5=0,0,E5/B5)", "Kit EXW not yet quoted — margin shows full retail until BOM!C7 is filled"],
    ["Spares Kit (standalone, $45, solo DDP)", "=Inputs!B21", "=Inputs!B4", 0, "=B6-C6-D6", "=IF(B6=0,0,E6/B6)", "C6 = Inputs!B4 (all-in Alibaba landed cost); D6 = 0 because B4 includes DDP"],
  ];
  await clearAndWrite(token, spreadsheetId, "'Add-on economics'!A1:G6", aeData);

  // ── BOM sources ──
  const bsData: unknown[][] = [
    ["Sources and open questions"],
    [],
    ["Date", "Source", "What it established"],
    ["2026-06-30", "Cathy, Alibaba chat + catalog image", "H1-230KM catalog: unit package $30, spare filter $20, brine tank $15, unit+brine $45, whole set $65 EXW. Shipping $60 for unit+brine; $125 total quoted for 'whole set' incl. shipping."],
    ["2026-08-20", "Cathy, Alibaba chat + price table image", "Price-break table for unit+brine package: air 1=$65, 2=$60, 3-4=$55, 5-6=$52 per unit. Sea DDP 10=$44+$20, 20=$43+$18, 30=$42+$17, 40=$41+$16, 50+=$40+$16. Granular resin limits shipping options; 8-12 days fastest air. Sea 25-30 days."],
    ["2026-09-02", "Cathy (via owner)", "Spares Kit can ride in the unit shipment at no extra shipping."],
    ["2026-09-04", "Cathy, Alibaba chat + table image", "Unit alone: $30 EXW, $35 DDP, 8-15 days. (Answered 'unit' literally; AG ships unit + brine tank.)"],
    ["2026-09-05", "Cathy, Alibaba chat", "Order intake: compile orders into one document; she issues one payment link; adds tracking and returns it. Cutoff 3:00 PM Beijing (3:00 AM ET)."],
    ["2026-09-05", "Owner", "Actual per-unit landed today: $110 + $3 card = $113 (taxes reduced via supplier cooperation vs. the June $125 quote)."],
    [],
    ["Open questions for Cathy"],
    ["1. Spares Kit EXW price on its own (mount adapter + adhesive mount + regeneration attachment)."],
    ["2. Does her factory carry export credit insurance (Sinosure or similar)? Relevant to payment terms later."],
    ["3. Can brine tanks ship separately in bulk (sea) while units go per-order by air? Tank is cheap to make, expensive to fly."],
    ["4. Exact duties/tax line inside the $65 air DDP figure (the ~$0-5 residual is back-solved, not quoted)."],
  ];
  await clearAndWrite(token, spreadsheetId, `'BOM sources'!A1:C${bsData.length}`, bsData);

  // ── Inputs update (new rows 19-28) ──
  const inputsRows: unknown[][] = [
    ["BOM & PRICING", "", ""],
    ["Retail price, unit", 249, "agsoftener.com PDP"],
    ["Retail price, Spares Kit (standalone)", 45, "agsoftener.com/spares-kit"],
    ["Retail price, Spares Kit (OTO)", 39, "thanks-page OTO"],
    ["Retail price, spare cartridge bump", 39, "cart-drawer bump"],
    ["Card processing fee per order (approx.)", 3, ""],
    ["Stripe fee per unit sale (approx.)", "=ROUND(B20*0.029+0.3,2)", "Stripe standard pricing"],
    ["Domestic shipping per unit from NJ (est.)", 12, "estimate; VERIFY"],
    ["", "", ""],
    ["Landed costs here drive the P&L month tabs, Landed scenarios, and Add-on economics.", "", ""],
  ];
  await clearAndWrite(token, spreadsheetId, "'Inputs'!A19:C28", inputsRows);

  // ── Formatting + reorder ──
  const reqs: object[] = [];

  // README: bold headings + column A width
  const rg = gid("README");
  for (const r of readmeBoldRows) reqs.push(fmtBold(rg, r, 3));
  reqs.push({
    updateDimensionProperties: {
      range: { sheetId: rg, dimension: "COLUMNS", startIndex: 0, endIndex: 1 },
      properties: { pixelSize: 800 },
      fields: "pixelSize",
    },
  });

  // BOM: blue input cells (0-indexed: row 3=C4,F4; row 4=C5,F5; row 5=C6,F6; row 9=F10)
  const bg = gid("BOM");
  for (const [r, c] of [[3, 2], [3, 5], [4, 2], [4, 5], [5, 2], [5, 5], [9, 5]]) {
    reqs.push(fmtBlue(bg, r, c));
  }

  // Shipping tiers: blue range B4:D15 (0-indexed rows 3-14, cols 1-3)
  reqs.push(fmtBlue(gid("Shipping tiers"), 3, 1, 15, 4));

  // Landed scenarios: blue input cells
  const lg = gid("Landed scenarios");
  reqs.push(fmtBlue(lg, 3, 6)); // G4: domestic ship 0
  reqs.push(fmtBlue(lg, 4, 1)); // B5: express qty (blue input)
  reqs.push(fmtBlue(lg, 4, 2)); // C5: express product (blue input)
  reqs.push(fmtBlue(lg, 4, 3)); // D5: express ship (blue input)
  reqs.push(fmtBlue(lg, 4, 6)); // G5: domestic ship 0
  for (let r = 5; r <= 9; r++) reqs.push(fmtBlue(lg, r, 4)); // E6-E10: duties 0

  // Add-on economics: blue + yellow
  const ag = gid("Add-on economics");
  reqs.push(fmtBlue(ag, 3, 3)); // D4: marginal ship 0
  reqs.push(fmtBlue(ag, 4, 3)); // D5: marginal ship 0
  reqs.push(fmtYellow(ag, 4, 2)); // C5: BOM!C7 (kit EXW not quoted)

  // Inputs: blue input values in new rows (0-indexed row 19=B20, etc.)
  for (const r of [19, 20, 21, 22, 23, 25]) reqs.push(fmtBlue(gid("Inputs"), r, 1));
  reqs.push(fmtYellow(gid("Inputs"), 25, 1)); // B26: domestic ship NJ (VERIFY)

  // BOM sources: merge cells for open questions (rows 11-14, 0-indexed, cols A:C)
  const sg = gid("BOM sources");
  for (let r = 11; r <= 14; r++) {
    reqs.push({
      mergeCells: {
        range: { sheetId: sg, startRowIndex: r, endRowIndex: r + 1, startColumnIndex: 0, endColumnIndex: 3 },
        mergeType: "MERGE_ALL",
      },
    });
  }

  // Tab reorder
  const tabOrder = [
    "README", "Inputs", "BOM", "Shipping tiers", "Landed scenarios",
    "Add-on economics", "BOM sources", "Supplier Invoices", "Ad Spend",
  ];
  for (let i = 0; i < tabOrder.length; i++) {
    const t = tabs.find((x) => x.properties.title === tabOrder[i]);
    if (t) {
      reqs.push({
        updateSheetProperties: {
          properties: { sheetId: t.properties.sheetId, index: i },
          fields: "index",
        },
      });
    }
  }

  await sheetsPost(token, spreadsheetId, ":batchUpdate", { requests: reqs });

  return { tabsCreated: needed, inputsUpdated: true };
}

export async function verifyBomTabs(): Promise<{
  tabOrder: string[];
  landedStandardFormulas: unknown[];
  landedStandardValues: unknown[];
  errors: string[];
}> {
  const sa = getServiceAccountKey();
  const token = await getAccessToken(sa);
  const spreadsheetId = getSheetId();
  const tabs = await listTabs(token, spreadsheetId);
  const tabOrder = tabs.map((t) => t.properties.title);

  // Read Landed scenarios row 4 (standard) — formulas
  const formulaData = (await sheetsGet(
    token,
    spreadsheetId,
    `/values/${encodeURIComponent("'Landed scenarios'!A4:L4")}?valueRenderOption=FORMULA`,
  )) as { values?: unknown[][] };
  const landedStandardFormulas = formulaData.values?.[0] || [];

  // Read Landed scenarios row 4 (standard) — evaluated values
  const valueData = await readRange(token, spreadsheetId, "'Landed scenarios'!A4:L4");
  const landedStandardValues = valueData[0] || [];

  // Scan all BOM tabs for #REF! or #N/A
  const bomTabNames = ["BOM", "Shipping tiers", "Landed scenarios", "Add-on economics", "BOM sources"];
  const errors: string[] = [];
  for (const name of bomTabNames) {
    const rows = await readRange(token, spreadsheetId, `'${name}'!A1:Z50`);
    for (let r = 0; r < rows.length; r++) {
      for (let c = 0; c < (rows[r]?.length || 0); c++) {
        const v = String(rows[r][c] || "");
        if (v.includes("#REF!") || v.includes("#N/A") || v.includes("#ERROR!") || v.includes("#VALUE!")) {
          errors.push(`${name}!${String.fromCharCode(65 + c)}${r + 1}: ${v}`);
        }
      }
    }
  }

  // Also scan Inputs rows 19-28
  const inputsRows = await readRange(token, spreadsheetId, "'Inputs'!A19:C28");
  for (let r = 0; r < inputsRows.length; r++) {
    for (let c = 0; c < (inputsRows[r]?.length || 0); c++) {
      const v = String(inputsRows[r][c] || "");
      if (v.includes("#REF!") || v.includes("#N/A") || v.includes("#ERROR!") || v.includes("#VALUE!")) {
        errors.push(`Inputs!${String.fromCharCode(65 + c)}${r + 19}: ${v}`);
      }
    }
  }

  return { tabOrder, landedStandardFormulas, landedStandardValues, errors };
}
