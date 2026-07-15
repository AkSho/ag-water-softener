type AnalyticsPayload = Record<string, unknown>;

declare global {
  interface Window {
    dataLayer?: AnalyticsPayload[];
    fbq?: (...args: unknown[]) => void;
  }
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
) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  window.fbq(method, event, params);
}
