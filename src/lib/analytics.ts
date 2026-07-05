type AnalyticsPayload = Record<string, unknown>;

declare global {
  interface Window {
    dataLayer?: AnalyticsPayload[];
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
