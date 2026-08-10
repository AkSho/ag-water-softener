type AnalyticsPayload = Record<string, unknown>;

declare global {
  interface Window {
    dataLayer?: AnalyticsPayload[];
    fbq?: (...args: unknown[]) => void;
  }
}

function generateEventId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function track(event: string, payload: AnalyticsPayload = {}) {
  if (typeof window === "undefined") return;

  const data = { event, ...payload };
  window.dataLayer?.push(data);

  if (import.meta.env.DEV) {
    console.info("[analytics]", data);
  }
}

export function fbPixel(
  method: "track" | "trackCustom",
  event: string,
  params: AnalyticsPayload = {},
  options?: AnalyticsPayload,
) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;

  // Always include an eventID for Meta dedup (browser + server events)
  const eventID = (options?.eventID as string) || generateEventId();
  const opts = { ...options, eventID };

  window.fbq(method, event, params, opts);
}
