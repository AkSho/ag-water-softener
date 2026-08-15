const ORDERS_TABLE = "Orders";
const SUBMISSIONS_TABLE = "Submissions";

interface OrderRecord {
  email: string;
  name: string;
  amount: number;
  stripeSessionId: string;
  eventId: string;
  orderTs: string;
  ftSrc: string;
  ftRef: string;
  ftLp: string;
  ftMlp: string;
  ftTs: string;
  ftUtm: string;
}

function airtableConfig() {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!apiKey || !baseId) return null;
  return { apiKey, baseId };
}

function daysBetween(isoA: string, isoB: string): number | null {
  try {
    const a = new Date(isoA).getTime();
    const b = new Date(isoB).getTime();
    if (isNaN(a) || isNaN(b)) return null;
    return Math.round(Math.abs(b - a) / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}

function promiseDate(orderTs: string): string {
  const d = new Date(orderTs);
  d.setDate(d.getDate() + 21);
  return d.toISOString().split("T")[0];
}

function deriveVerdict(ftSrc: string, toolTouch: boolean): string {
  if (toolTouch) return "tool-lead";
  if (ftSrc === "myapt") return "content-lead";
  if (["direct", "google", "bing"].includes(ftSrc)) return "direct";
  return "unknown";
}

async function checkToolTouch(config: { apiKey: string; baseId: string }, email: string): Promise<boolean> {
  const formula = encodeURIComponent(`{Email Address}='${email}'`);
  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${encodeURIComponent(config.baseId)}/${encodeURIComponent(SUBMISSIONS_TABLE)}?filterByFormula=${formula}&maxRecords=1`,
      { headers: { Authorization: `Bearer ${config.apiKey}` } }
    );
    if (!response.ok) return false;
    const data = (await response.json()) as { records: unknown[] };
    return data.records.length > 0;
  } catch {
    return false;
  }
}

export async function writeOrderRow(record: OrderRecord): Promise<{ ok: boolean; id?: string; error?: string }> {
  const config = airtableConfig();
  if (!config) return { ok: false, error: "airtable_not_configured" };

  const toolTouch = record.email ? await checkToolTouch(config, record.email.trim().toLowerCase()) : false;
  const hasFt = !!record.ftSrc;
  const daysToPurchase = hasFt && record.ftTs ? daysBetween(record.ftTs, record.orderTs) : null;
  const verdict = hasFt ? deriveVerdict(record.ftSrc, toolTouch) : (toolTouch ? "tool-lead" : "unknown");

  const fields: Record<string, unknown> = {
    Email: record.email || "",
    Name: record.name || "",
    Amount: record.amount,
    StripeSessionId: record.stripeSessionId,
    EventId: record.eventId,
    OrderTS: record.orderTs,
    FT_Source: record.ftSrc || "",
    FT_Referrer: record.ftRef || "",
    FT_LandingPage: record.ftLp || "",
    FT_MyaptPage: record.ftMlp || "",
    FT_Timestamp: record.ftTs || "",
    DaysToPurchase: daysToPurchase,
    ToolTouch: toolTouch,
    Verdict: verdict,
    SelfReport: "",
    Status: "paid",
    PromisedBy: promiseDate(record.orderTs),
  };

  const url = `https://api.airtable.com/v0/${encodeURIComponent(config.baseId)}/${encodeURIComponent(ORDERS_TABLE)}`;
  const opts: RequestInit = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ records: [{ fields }] }),
  };

  for (const attempt of [1, 2] as const) {
    try {
      const response = await fetch(url, opts);

      if (!response.ok) {
        const detail = await response.text();
        const msg = `airtable_${response.status}: ${detail.slice(0, 300)}`;
        if (attempt === 1 && response.status >= 500) {
          console.warn(`orders_row_attempt1 failed (retrying): ${msg}`);
          await new Promise((r) => setTimeout(r, 2500));
          continue;
        }
        return { ok: false, error: msg, attempt };
      }

      const data = (await response.json()) as { records: Array<{ id: string }> };
      return { ok: true, id: data.records?.[0]?.id, attempt };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (attempt === 1) {
        console.warn(`orders_row_attempt1 exception (retrying): ${msg}`);
        await new Promise((r) => setTimeout(r, 2500));
        continue;
      }
      return { ok: false, error: msg, attempt };
    }
  }

  return { ok: false, error: "unreachable" };
}
