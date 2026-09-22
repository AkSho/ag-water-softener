import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

type ReviewSearch = { token?: string };

export const Route = createFileRoute("/review")({
  validateSearch: (raw: Record<string, unknown>): ReviewSearch => ({
    token: typeof raw.token === "string" ? raw.token : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Leave a Review — AG Water Softener" },
      { name: "description", content: "Leave a review for your AG Water Softener." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReviewPage,
});

type FormState = "loading" | "invalid" | "ready" | "submitting" | "done";

function ReviewPage() {
  const { token } = Route.useSearch();
  const [state, setState] = useState<FormState>(token ? "loading" : "invalid");
  const [name, setName] = useState("");

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [body, setBody] = useState("");
  const [city, setCity] = useState("");
  const [hardnessBefore, setHardnessBefore] = useState("");
  const [hardnessAfter, setHardnessAfter] = useState("");

  useEffect(() => {
    if (!token) return;
    fetch(`/api/review-token?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d: { valid: boolean; name?: string }) => {
        if (d.valid) {
          setName(d.name || "");
          setState("ready");
        } else {
          setState("invalid");
        }
      })
      .catch(() => setState("invalid"));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || rating < 1 || !body.trim()) return;
    setState("submitting");

    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          rating,
          body: body.trim(),
          city: city.trim() || undefined,
          hardnessBefore: hardnessBefore ? Number(hardnessBefore) : undefined,
          hardnessAfter: hardnessAfter ? Number(hardnessAfter) : undefined,
        }),
      });
      const data = (await res.json()) as { ok: boolean };
      setState(data.ok ? "done" : "ready");
    } catch {
      setState("ready");
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-xl">
          {state === "loading" && (
            <p className="text-base text-muted-foreground">Loading...</p>
          )}

          {state === "invalid" && (
            <section className="border border-border/70 bg-surface p-6 md:p-10">
              <h1 className="font-display text-3xl leading-tight md:text-4xl">
                This link has expired or is invalid.
              </h1>
              <p className="mt-4 text-base leading-relaxed text-foreground/80">
                If you'd like to leave a review, reply to the email we sent you.
              </p>
            </section>
          )}

          {state === "done" && (
            <section className="border border-border/70 bg-surface p-6 md:p-10">
              <h1 className="font-display text-3xl leading-tight md:text-4xl">Thank you</h1>
              <p className="mt-4 text-base leading-relaxed text-foreground/80">
                Your review has been submitted.
              </p>
            </section>
          )}

          {(state === "ready" || state === "submitting") && (
            <section className="border border-border/70 bg-surface p-6 md:p-10">
              <h1 className="font-display text-3xl leading-tight md:text-4xl">
                How's the water?
              </h1>
              {name && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Reviewing as {name.split(/\s+/)[0]}
                </p>
              )}

              <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground">Your rating</label>
                  <div className="mt-2 flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setRating(n)}
                        onMouseEnter={() => setHoverRating(n)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 text-2xl leading-none"
                        aria-label={`${n} star${n > 1 ? "s" : ""}`}
                      >
                        <span className={n <= (hoverRating || rating) ? "text-foreground" : "text-border"}>
                          {n <= (hoverRating || rating) ? "\u2605" : "\u2606"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="review-body" className="block text-sm font-medium text-foreground">
                    Your review
                  </label>
                  <textarea
                    id="review-body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="What changed after you switched to soft water?"
                    rows={4}
                    required
                    className="mt-2 w-full border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/30"
                  />
                </div>

                <div>
                  <label htmlFor="review-city" className="block text-sm font-medium text-foreground">
                    Your city (optional)
                  </label>
                  <input
                    id="review-city"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Austin, TX"
                    className="mt-2 w-full border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="hardness-before" className="block text-sm font-medium text-foreground">
                      Water hardness before (ppm) — optional
                    </label>
                    <input
                      id="hardness-before"
                      type="number"
                      value={hardnessBefore}
                      onChange={(e) => setHardnessBefore(e.target.value)}
                      placeholder="e.g. 220"
                      min="0"
                      className="mt-2 w-full border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/30"
                    />
                  </div>
                  <div>
                    <label htmlFor="hardness-after" className="block text-sm font-medium text-foreground">
                      Water hardness after (ppm) — optional
                    </label>
                    <input
                      id="hardness-after"
                      type="number"
                      value={hardnessAfter}
                      onChange={(e) => setHardnessAfter(e.target.value)}
                      placeholder="e.g. 15"
                      min="0"
                      className="mt-2 w-full border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/30"
                    />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  If you've tested with a strip, we'd love the numbers. If not, skip this.
                </p>

                <button
                  type="submit"
                  disabled={state === "submitting" || rating < 1 || !body.trim()}
                  className="w-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition hover:opacity-90 disabled:opacity-50"
                >
                  {state === "submitting" ? "Submitting..." : "Submit review"}
                </button>
              </form>
            </section>
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
