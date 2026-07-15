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
  items?: OrderItem[];
  sparePurchased?: boolean;
  bumpSource?: "drawer" | "stripe_crosssell" | null;
};

export const Route = createFileRoute("/thanks")({
  validateSearch: (raw: Record<string, unknown>): ThanksSearch => ({
    session_id: typeof raw.session_id === "string" ? raw.session_id : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Order Confirmed — AG Water Softener" },
      { name: "description", content: "Your AG Water Softener order is confirmed." },
    ],
  }),
  component: ThanksPage,
});

function ThanksPage() {
  const { session_id } = Route.useSearch();
  const [summary, setSummary] = useState<OrderSummary | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(session_id));

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
    });

    if (summary.sparePurchased && summary.bumpSource) {
      track("bump_accepted", { source: summary.bumpSource });
    }

    window.localStorage.setItem(purchaseKey, "1");
  }, [summary]);

  const isVerified = summary?.verified === true;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-3xl">
          {isLoading ? (
            <OrderPanel eyebrow="Confirming order" title="Pulling up your order..." />
          ) : isVerified ? (
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
