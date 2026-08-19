import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

const PAGE_FAQS = [
  {
    q: "Is Arius the same as Aquus One?",
    a: "Yes. The product was previously marketed as the Aquus One. As of August 2026, the Aquus website (aquuswater.com) redirects to ariuswater.com, and the product is listed as the Arius One.",
  },
  {
    q: "Does the Arius One really soften water?",
    a: "Yes. It uses ion-exchange resin with salt regeneration, which is the chemistry that removes dissolved calcium and magnesium. This is what separates both the Arius and the AG from shower filters, which remove chlorine but cannot soften water.",
  },
  {
    q: "When does Arius ship?",
    a: "As of August 9, 2026, the Arius product page states units ship by the end of August 2026. Check ariuswater.com for the current status.",
  },
  {
    q: "How often do you have to regenerate each one?",
    a: "Arius states roughly every 2 weeks for a two-person household. The AG regenerates every 3 to 5 weeks. Both depend on usage and water hardness.",
  },
  {
    q: "Which one should a renter pick?",
    a: "The AG threads onto a standard half-inch shower arm, so there are no plumbing changes and nothing to ask a landlord about. Check the Arius product page for their install requirements. The AG is in stock and ships immediately; Arius is currently a preorder.",
  },
];

export const Route = createFileRoute("/arius-vs-ag-water-softener")({
  head: () => ({
    meta: [
      { title: "Arius vs AG Water Softener: preorder-stage comparison" },
      {
        name: "description",
        content:
          "The Arius One (formerly the Aquus One) and the AG Water Softener both use ion-exchange resin. Here is how they compare on regeneration, availability, warranty, and price.",
      },
      { property: "og:title", content: "Arius vs AG Water Softener: preorder-stage comparison" },
      { property: "og:description", content: "The Arius One (formerly the Aquus One) and the AG Water Softener both use ion-exchange resin. Here is how they compare on regeneration, availability, warranty, and price." },
      { property: "og:url", content: "https://agsoftener.com/arius-vs-ag-water-softener" },
      { property: "og:type", content: "article" },
      { property: "og:image", content: "https://agsoftener.com/assets/hero.png" },
      { property: "og:site_name", content: "AG Water Softener" },
    ],
    links: [
      { rel: "canonical", href: "https://agsoftener.com/arius-vs-ag-water-softener" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "Arius vs AG Water Softener: preorder-stage comparison",
          datePublished: "2026-08-10",
          dateModified: "2026-08-10",
          author: { "@type": "Organization", name: "AG Water Softener" },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: PAGE_FAQS.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://agsoftener.com/" },
            { "@type": "ListItem", position: 2, name: "Arius vs AG compared", item: "https://agsoftener.com/arius-vs-ag-water-softener" },
          ],
        }),
      },
    ],
  }),
  component: AriusVsAgPage,
});

function AriusVsAgPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <article className="mx-auto max-w-[760px] px-5 py-12 md:px-8 md:py-16 lg:py-24">
        <h1 className="font-display text-3xl leading-[1.05] sm:text-4xl md:text-[46px]">
          Arius vs AG Water Softener: preorder-stage comparison
        </h1>
        <p className="text-sm text-muted-foreground">
          Updated Aug 10, 2026
        </p>
        <p className="mt-3 text-[13px] italic text-muted-foreground">
          Checked against the live Arius product page on August 9, 2026. If anything below has changed, tell us and we will correct it.
        </p>

        <div className="mt-8 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            The Arius One (formerly the Aquus One) and the AG Water Softener both use ion-exchange resin to soften shower water. That puts them in the same small category of products that actually remove hardness, as opposed to the hundreds of <a href="/shower-filter-vs-water-softener" className="underline hover:opacity-70">shower filters sold as softeners</a> that cannot. The mechanism argument is settled between these two. What differs is how the resin gets recharged and what the purchase terms look like.
          </p>
        </div>

        <div
          className="mt-10 grid gap-0 overflow-hidden border border-border sm:grid-cols-[1fr_auto_1fr]"
          role="img"
          aria-label="AG Water Softener compared with the Arius One, which is sold as a preorder"
        >
          {/* AG panel */}
          <div className="flex flex-col items-center bg-background p-6 sm:p-8">
            <img
              src="/assets/cross-section.png"
              alt="Cross-section of the AG cartridge showing the ion-exchange resin bed inside"
              width={1254}
              height={1254}
              loading="lazy"
              className="w-full max-w-[240px] h-auto"
            />
            <p className="mt-4 text-center font-display text-lg leading-tight sm:text-xl">AG Water Softener</p>
            <p className="mt-1 text-center text-[13px] text-muted-foreground">$249 — in stock</p>
          </div>

          {/* VS mark */}
          <div className="flex items-center justify-center border-y border-border bg-surface px-4 py-2 sm:border-x sm:border-y-0 sm:py-0">
            <span className="text-[13px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">vs</span>
          </div>

          {/* Arius panel — typographic only, no product image */}
          <div className="flex flex-col items-center justify-center bg-surface/40 p-6 sm:p-8">
            <p className="text-center font-display text-lg leading-tight sm:text-xl">Arius One</p>
            <div className="mt-4 space-y-1 text-center text-[14px] text-foreground/80">
              <p>$296.87</p>
              <p>Preorder</p>
              <p className="text-[13px] text-muted-foreground">Ships end of August 2026, per Arius</p>
            </div>
          </div>
        </div>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          Where they agree
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            Both are genuine ion-exchange softeners that need salt to recharge the resin. The AG threads onto a standard half-inch shower arm with no tools. Both offer a 60-day satisfaction guarantee. Neither is a filter wearing a softener label, and that distinction matters more than anything separating them from each other.
          </p>
          <p>
            Arius builds filtration and softening into one unit. If you want both in a single system and the preorder timeline works for you, it is a reasonable pick. The AG does one job, softening, and does it without a maintenance schedule.
          </p>
        </div>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          The regeneration difference
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            Both systems soften water the same way, with ion-exchange resin that has to be recharged with salt. The difference is who does the work. With Arius you add salt, wait about 4 hours for the brine to form, turn the valve to REGEN, and run it for about 10 minutes, roughly every 2 weeks for two people. The AG recharges itself from its brine tank in about 30 minutes, every 3 to 5 weeks. You add salt and walk away.
          </p>
          <p>
            Neither regeneration is difficult. The question is whether a 4-hour manual cycle every 2 weeks fits your routine, or whether automatic recharging every few weeks is the version you will actually keep doing. Softeners that stop getting recharged stop softening, and that pattern is more common than any product failure.
          </p>
        </div>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          Availability and purchase terms
        </h2>
        <div className="mt-6 text-[15px] leading-[1.7] text-foreground/90">
          <p className="mb-6">
            As of August 9, 2026, the Arius One is sold as a preorder. Arius says units ship by the end of August 2026. Their product reviews are from prototype testers, which Arius discloses on the page.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-border text-[14px] leading-[1.6]">
              <thead>
                <tr className="bg-surface">
                  <th className="border border-border px-4 py-3 text-left font-semibold"></th>
                  <th className="border border-border px-4 py-3 text-left font-semibold">Arius One</th>
                  <th className="border border-border px-4 py-3 text-left font-semibold">AG Water Softener</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-border px-4 py-3 font-semibold">Price</td>
                  <td className="border border-border px-4 py-3">$296.87</td>
                  <td className="border border-border px-4 py-3">$249</td>
                </tr>
                <tr className="bg-surface/50">
                  <td className="border border-border px-4 py-3 font-semibold">Availability</td>
                  <td className="border border-border px-4 py-3">Preorder; ships end of August 2026 per Arius</td>
                  <td className="border border-border px-4 py-3">In stock, ships with tracking</td>
                </tr>
                <tr>
                  <td className="border border-border px-4 py-3 font-semibold">Regeneration</td>
                  <td className="border border-border px-4 py-3">Manual: add salt, ~4 hr brine soak, turn valve, run ~10 min. Roughly every 2 weeks</td>
                  <td className="border border-border px-4 py-3">Automatic from included brine tank, ~30 min, every 3 to 5 weeks</td>
                </tr>
                <tr className="bg-surface/50">
                  <td className="border border-border px-4 py-3 font-semibold">Guarantee</td>
                  <td className="border border-border px-4 py-3">60-day money-back</td>
                  <td className="border border-border px-4 py-3">60-day money-back</td>
                </tr>
                <tr>
                  <td className="border border-border px-4 py-3 font-semibold">Warranty</td>
                  <td className="border border-border px-4 py-3">Not listed separately</td>
                  <td className="border border-border px-4 py-3">12 months against defects</td>
                </tr>
                <tr className="bg-surface/50">
                  <td className="border border-border px-4 py-3 font-semibold">Reviews</td>
                  <td className="border border-border px-4 py-3">Prototype testers (per Arius disclosure)</td>
                  <td className="border border-border px-4 py-3">Early customers</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          How to decide
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            If you want filtration and softening in one unit and the Arius preorder timeline fits your plans, it is a legitimate option. The ion-exchange chemistry is real, and the combined-unit design means one less device in your shower.
          </p>
          <p>
            If you want a softener that is in stock, ships immediately, recharges automatically, and carries a 12-month warranty beyond the guarantee, that is the case for <a href="/" className="underline hover:opacity-70">the AG Water Softener</a>. It handles 2.1 gallons per minute at the shower arm, regenerates about 1,300 gallons of capacity per recharge, and threads onto any standard shower connection with no tools and no plumbing changes.
          </p>
          <p>
            Either way, confirm your water is hard first. <a href="https://www.myapartmentwaterquality.com/" className="underline hover:opacity-70">Check your water free</a> with our lookup tool or test it yourself. If your water reads soft, neither product will change anything you notice. If it reads hard, the real question is which recharge routine you will stick with.
          </p>
        </div>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          About the portability angle
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            The AG mounts on the shower arm and comes off when you move. The Arius One weighs 19 lbs, which puts it closer to an RV softener in heft than a showerhead accessory. If portability between bathrooms or apartments matters to you, the <a href="/portable-water-softener-for-shower" className="underline hover:opacity-70">portable softener comparison</a> covers the form-factor tradeoffs in more detail.
          </p>
        </div>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          Frequently asked questions
        </h2>
        <div className="mt-6 space-y-8 text-[15px] leading-[1.7] text-foreground/90">
          {PAGE_FAQS.map((faq) => (
            <div key={faq.q}>
              <h3 className="text-[16px] font-semibold leading-[1.4]">{faq.q}</h3>
              <p className="mt-2">{faq.a}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 border border-border bg-surface/40 p-8 md:p-10">
          <p className="text-[15px] leading-[1.7] text-foreground/90">
            <a href="https://www.myapartmentwaterquality.com/" className="underline hover:opacity-70">Check your water hardness free</a>, or <a href="/" className="underline hover:opacity-70">see the AG Water Softener</a>.
          </p>
        </div>
      </article>

      <SiteFooter />
    </div>
  );
}
