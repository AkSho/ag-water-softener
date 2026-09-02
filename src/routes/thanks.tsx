import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check } from "lucide-react";

import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { track, fbPixel } from "@/lib/analytics";

type ThanksSearch = { session_id?: string };

type OrderItem = {
  id: string;
  description: string | null;
  quantity: number;
  formattedAmount: string;
  priceId?: string;
};

type OrderSummary = {
  verified: boolean;
  id?: string;
  formattedTotal?: string;
  amountTotal?: number;
  currency?: string;
  customerEmail?: string;
  shippingCountry?: string;
  estimatedDeliveryDate?: string;
  items?: OrderItem[];
  sparePurchased?: boolean;
  bumpSource?: "drawer" | "stripe_crosssell" | null;
  metadata?: {
    requestedUnitQty?: string;
    requestedIncludeSpare?: boolean;
    source?: string;
  };
};

export const Route = createFileRoute("/thanks")({
  validateSearch: (raw: Record<string, unknown>): ThanksSearch => ({
    session_id: typeof raw.session_id === "string" ? raw.session_id : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Order Confirmed — AG Water Softener" },
      { name: "description", content: "Your AG Water Softener order is confirmed." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ThanksPage,
});

type OtoState = "idle" | "accepting" | "accepted" | "declined" | "hidden";

function ThanksPage() {
  const { session_id } = Route.useSearch();
  const [summary, setSummary] = useState<OrderSummary | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(session_id));
  const [otoState, setOtoState] = useState<OtoState>("hidden");
  const [otoFallbackUrl, setOtoFallbackUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!session_id) {
      setIsLoading(false);
      return;
    }

    let ignore = false;
    const sessionId = session_id;

    async function loadOrder() {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/checkout-session?session_id=${encodeURIComponent(sessionId)}`);
        const payload = (await response.json()) as OrderSummary;
        if (!ignore) setSummary(payload);
      } catch (error) {
        console.error(error);
        if (!ignore) setSummary({ verified: false });
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    void loadOrder();

    return () => {
      ignore = true;
    };
  }, [session_id]);

  // OTO eligibility: unit order from PDP, paid, no prior accept/decline
  useEffect(() => {
    if (!summary?.verified || !summary.id) return;
    if (summary.metadata?.source !== "ag_pdp") return;

    const dismissKey = `agOtoDismissed:${summary.id}`;
    const acceptKey = `agOtoAccepted:${summary.id}`;
    if (window.localStorage.getItem(dismissKey) || window.localStorage.getItem(acceptKey)) return;

    setOtoState("idle");
  }, [summary]);

  useEffect(() => {
    if (!summary?.verified || !summary.id) return;

    const purchaseKey = `agPurchaseTracked:${summary.id}`;
    if (window.localStorage.getItem(purchaseKey)) return;

    track("purchase", {
      transaction_id: summary.id,
      revenue: typeof summary.amountTotal === "number" ? summary.amountTotal / 100 : undefined,
      currency: summary.currency?.toUpperCase() || "USD",
      items: summary.items,
    });

    fbPixel("track", "Purchase", {
      value: typeof summary.amountTotal === "number" ? summary.amountTotal / 100 : 0,
      currency: summary.currency?.toUpperCase() || "USD",
      content_ids: summary.items?.map((i) => i.id) || [],
      content_type: "product",
    }, { eventID: summary.id });

    if (summary.sparePurchased && summary.bumpSource) {
      track("bump_accepted", { source: summary.bumpSource });
    }

    // --- Google Ads conversion tag ---
    const gtagScript = document.createElement("script");
    gtagScript.src = "https://www.googletagmanager.com/gtag/js?id=AW-18415554350";
    gtagScript.async = true;
    document.head.appendChild(gtagScript);
    gtagScript.onload = () => {
      (window as any).dataLayer = (window as any).dataLayer || [];
      function gtag(...args: any[]) { (window as any).dataLayer.push(args); }
      gtag("js", new Date());
      gtag("config", "AW-18415554350");
      if (summary.customerEmail) {
        gtag("set", "user_data", { email: summary.customerEmail });
      }
      gtag("event", "conversion", {
        send_to: "AW-18415554350/R8EmCICLz-kcEK6enM1E",
        value: typeof summary.amountTotal === "number" ? summary.amountTotal / 100 : 0,
        currency: summary.currency?.toUpperCase() || "USD",
        transaction_id: summary.id,
      });
    };
    // --- end conversion tag ---

    // --- Microsoft UET conversion tag ---
    (window as any).uetq = (window as any).uetq || [];
    const uetRevenue = typeof summary.amountTotal === "number" ? summary.amountTotal / 100 : 0;
    const pushUetPurchase = () => {
      (window as any).uetq.push("event", "purchase", {
        revenue_value: uetRevenue,
        currency: "USD",
        transaction_id: summary.id,
      });
    };
    if (summary.customerEmail) {
      const normalized = summary.customerEmail.trim().toLowerCase();
      crypto.subtle.digest("SHA-256", new TextEncoder().encode(normalized))
        .then((buf) => {
          const hash = Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
          (window as any).uetq.push("set", { pid: { em: hash } });
          pushUetPurchase();
        })
        .catch(() => { pushUetPurchase(); });
    } else {
      pushUetPurchase();
    }
    const uetScript = document.createElement("script");
    uetScript.src = "https://bat.bing.net/bat.js";
    uetScript.async = true;
    uetScript.onload = () => {
      (window as any).uetq = new (window as any).UET({
        ti: "187271291",
        enableAutoSpaTracking: false,
        q: (window as any).uetq,
      });
      (window as any).uetq.push("pageLoad");
    };
    document.head.appendChild(uetScript);
    // --- end UET conversion tag ---

    // --- Google Customer Reviews opt-in ---
    if (summary.customerEmail && summary.shippingCountry && summary.estimatedDeliveryDate) {
      (window as any).renderOptIn = function () {
        (window as any).gapi.load("surveyoptin", function () {
          (window as any).gapi.surveyoptin.render({
            merchant_id: 5832203924,
            order_id: summary.id,
            email: summary.customerEmail,
            delivery_country: summary.shippingCountry,
            estimated_delivery_date: summary.estimatedDeliveryDate,
          });
        });
      };
      const gcrScript = document.createElement("script");
      gcrScript.src = "https://apis.google.com/js/platform.js?onload=renderOptIn";
      gcrScript.async = true;
      gcrScript.defer = true;
      document.head.appendChild(gcrScript);
    }
    // --- end Google Customer Reviews ---

    window.localStorage.setItem(purchaseKey, "1");
  }, [summary]);

  async function handleOtoAccept() {
    if (!summary?.id) return;
    setOtoState("accepting");
    try {
      const res = await fetch("/api/oto-accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: summary.id }),
      });
      const data = (await res.json()) as { ok?: boolean; fallback?: boolean; url?: string; already?: boolean };
      if (data.ok) {
        setOtoState("accepted");
        window.localStorage.setItem(`agOtoAccepted:${summary.id}`, "1");
      } else if (data.fallback && data.url) {
        setOtoState("idle");
        setOtoFallbackUrl(data.url);
      } else {
        setOtoState("idle");
        setOtoFallbackUrl("https://buy.stripe.com/fZu3cubcWh1XcRK9A81sQ0I");
      }
    } catch {
      setOtoState("idle");
      setOtoFallbackUrl("https://buy.stripe.com/fZu3cubcWh1XcRK9A81sQ0I");
    }
  }

  function handleOtoDecline() {
    if (!summary?.id) return;
    setOtoState("declined");
    window.localStorage.setItem(`agOtoDismissed:${summary.id}`, "1");
  }

  const isVerified = summary?.verified === true;
  const showOto = isVerified && (otoState === "idle" || otoState === "accepting" || otoState === "accepted");

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-3xl">
          {isLoading ? (
            <OrderPanel eyebrow="Confirming order" title="Pulling up your order..." />
          ) : isVerified ? (
            <>
            {showOto && (
              <section className="mb-6 border border-border/70 bg-surface p-6 md:p-10">
                {otoState === "accepted" ? (
                  <p className="text-base font-medium text-foreground">Done. The Spares Kit ships with your softener.</p>
                ) : (
                  <div className="flex gap-5 items-start">
                    <img
                      src="/assets/spares_kit_image.png"
                      alt="The three parts of the AG Spares Kit"
                      className="hidden sm:block w-20 h-20 flex-shrink-0 rounded border border-border/50 object-cover"
                    />
                    <div className="min-w-0">
                      <h2 className="font-display text-2xl leading-tight md:text-3xl">Add the Spares Kit to your order for $39?</h2>
                      <p className="mt-3 text-sm leading-relaxed text-foreground/80">A second set of the parts that mount your softener and run its recharge. Accidents happen, and a spare set means no waiting on a replacement to ship. It packs into your current order and ships free. Bought later, it's $45 and ships on its own (so you save $6 today).</p>
                      <div className="mt-4 flex gap-3">
                        {otoFallbackUrl ? (
                          <a
                            href={otoFallbackUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center px-5 py-2.5 border-2 border-foreground bg-foreground text-background text-sm font-semibold hover:opacity-90"
                          >
                            Add for $39
                          </a>
                        ) : (
                          <button
                            onClick={handleOtoAccept}
                            disabled={otoState === "accepting"}
                            className="inline-flex items-center justify-center px-5 py-2.5 border-2 border-foreground bg-foreground text-background text-sm font-semibold hover:opacity-90 disabled:opacity-50"
                          >
                            {otoState === "accepting" ? "Processing…" : "Add for $39"}
                          </button>
                        )}
                        <button
                          onClick={handleOtoDecline}
                          disabled={otoState === "accepting"}
                          className="inline-flex items-center justify-center px-5 py-2.5 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
                        >
                          No thanks
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}
            <section className="border border-border/70 bg-surface p-6 md:p-10">
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background">
                <Check className="h-5 w-5" />
              </div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Order confirmed
              </div>
              <h1 className="mt-3 font-display text-4xl leading-tight md:text-6xl">Order confirmed</h1>
              <p className="mt-4 text-base leading-relaxed text-foreground/80">
                Your card statement will show GRNLABS* AGSOFTENER.
              </p>
              <p className="mt-3 text-base leading-relaxed text-foreground/80">
                Most people notice the difference in their first shower. Your 60-day guarantee starts
                the day it arrives.
              </p>

              <div className="mt-8 border-t border-border/70 pt-6">
                <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Order summary
                </div>
                <ul className="divide-y divide-border/70">
                  {summary.items?.map((item) => (
                    <li key={item.id} className="flex items-start justify-between gap-6 py-4 text-sm">
                      <div>
                        <div className="font-medium">{item.description}</div>
                        <div className="mt-1 text-xs text-muted-foreground">Qty {item.quantity}</div>
                      </div>
                      <div className="tabular-nums">{item.formattedAmount}</div>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-4 font-medium">
                  <span>Total</span>
                  <span className="tabular-nums">{summary.formattedTotal}</span>
                </div>
              </div>
            </section>
            </>
          ) : (
            <OrderPanel
              eyebrow="Order lookup"
              title="We couldn't verify this order."
              body="If your checkout completed, check your email receipt or refresh this page in a moment."
            />
          )}

          <div className="mt-8 text-center">
            <Link to="/" className="text-sm font-medium underline underline-offset-4">
              Back to AG Water Softener
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function OrderPanel({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body?: string;
}) {
  return (
    <section className="border border-border/70 bg-surface p-6 md:p-10">
      <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {eyebrow}
      </div>
      <h1 className="mt-3 font-display text-4xl leading-tight md:text-6xl">{title}</h1>
      {body && <p className="mt-4 text-base leading-relaxed text-foreground/80">{body}</p>}
    </section>
  );
}
