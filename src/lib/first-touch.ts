const STORAGE_KEY = "ag_ft";
const INTERNAL_KEY = "ag_internal";

function classifySource(referrer: string, params: URLSearchParams): string {
  // Click-ID detection takes priority over referrer parsing
  if (params.has("gclid")) return "google-cpc";
  if (params.has("msclkid")) return "bing-cpc";
  if (params.get("utm_medium") === "cpc") {
    const source = params.get("utm_source");
    return source ? `${source}-cpc` : "cpc";
  }

  // Cross-domain token from myapt
  if (params.get("xd") === "myapt") return "myapt";

  // Referrer-based fallback
  if (!referrer) return "direct";
  try {
    const host = new URL(referrer).hostname.toLowerCase();
    if (host.includes("google.")) return "google";
    if (host.includes("bing.")) return "bing";
    if (host.includes("facebook.") || host.includes("instagram.") || host.includes("fb.")) return "meta";
    if (host.includes("reddit.")) return "reddit";
    if (host.includes("medium.")) return "medium";
    return host;
  } catch {
    return "direct";
  }
}

export function initFirstTouch(): void {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(INTERNAL_KEY) === "1") return;
  if (localStorage.getItem(STORAGE_KEY)) return;

  const params = new URLSearchParams(location.search);
  const utm: Record<string, string> = {};
  params.forEach((v, k) => {
    if (k.startsWith("utm_")) utm[k] = v;
  });

  const data: Record<string, unknown> = {
    src: classifySource(document.referrer, params),
    ref: document.referrer || "",
    lp: location.pathname,
    ts: new Date().toISOString(),
    utm,
  };

  const mlp = params.get("mlp");
  if (mlp) data.mlp = mlp;

  // Store click IDs bare (no ft_ prefix inside the namespaced object)
  const gclid = params.get("gclid");
  if (gclid) data.gclid = gclid;
  const msclkid = params.get("msclkid");
  if (msclkid) data.msclkid = msclkid;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
