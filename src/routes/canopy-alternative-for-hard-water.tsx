import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { PreferredSourceBlock } from "@/components/PreferredSourceBlock";

const PAGE_FAQS = [
  {
    q: "Does the Canopy filter soften water?",
    a: "No. It is a filter. Its media reduce chlorine and some particles. Softening means removing dissolved calcium and magnesium, which takes ion-exchange resin.",
  },
  {
    q: "Why does Canopy's listing mention calcium and magnesium?",
    a: "Canopy's site says its filter media have been shown to help reduce chlorine, magnesium, and calcium carbonate. Filter media can reduce some scale-forming particles. Dissolved hardness minerals stay in the water, which is why hard-water problems continue with a filter installed.",
  },
  {
    q: "Can I use Canopy and the AG together?",
    a: "Yes. They do different jobs. The softener removes hardness minerals, and a filter ahead of it can handle chlorine. Most people start with the one that matches their main complaint.",
  },
  {
    q: "Is Canopy bad?",
    a: "No. It is a well-made chlorine filter with strong press. The only problem is buying it for hardness, which it is not built to remove.",
  },
];

export const Route = createFileRoute("/canopy-alternative-for-hard-water")({
  head: () => ({
    meta: [
      { title: "Canopy alternative for hard water: why a filter falls short" },
      {
        name: "description",
        content:
          "The Canopy is a chlorine filter. If your water is hard, no filter removes calcium and magnesium. Here is the device that does.",
      },
      { property: "og:title", content: "Canopy alternative for hard water: why a filter falls short" },
      { property: "og:description", content: "The Canopy is a chlorine filter. If your water is hard, no filter removes calcium and magnesium. Here is the device that does." },
      { property: "og:url", content: "https://agsoftener.com/canopy-alternative-for-hard-water" },
      { property: "og:type", content: "article" },
      { property: "og:image", content: "https://agsoftener.com/assets/hero.png" },
      { property: "og:site_name", content: "AG Water Softener" },
    ],
    links: [
      { rel: "canonical", href: "https://agsoftener.com/canopy-alternative-for-hard-water" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "Canopy alternative for hard water",
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
            { "@type": "ListItem", position: 2, name: "Canopy alternative for hard water", item: "https://agsoftener.com/canopy-alternative-for-hard-water" },
          ],
        }),
      },
    ],
  }),
  component: CanopyAlternativePage,
});

function CanopyAlternativePage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <article className="mx-auto max-w-[760px] px-5 py-12 md:px-8 md:py-16 lg:py-24">
        <h1 className="font-display text-3xl leading-[1.05] sm:text-4xl md:text-[46px]">
          Canopy alternative for hard water
        </h1>
        <p className="text-sm text-muted-foreground">
          Updated Aug 10, 2026
        </p>
        <p className="mt-3 text-[13px] italic text-muted-foreground">
          Checked against the live Canopy product page on August 10, 2026. If anything below has changed, tell us and we will correct it.
        </p>

        {/* Split-card hero */}
        <div
          className="mt-10 grid gap-0 overflow-hidden border border-border sm:grid-cols-[1fr_auto_1fr]"
          role="img"
          aria-label="AG Water Softener, which removes hardness minerals, compared with the Canopy chlorine filter"
        >
          {/* AG panel */}
          <div className="flex flex-col items-center bg-background p-6 sm:p-8">
            <img
              src="/assets/cross-section.png"
              alt="AG Water Softener, which removes hardness minerals, compared with the Canopy chlorine filter"
              width={1254}
              height={1254}
              loading="lazy"
              className="w-full max-w-[240px] h-auto"
            />
            <p className="mt-4 text-center font-display text-lg leading-tight sm:text-xl">AG Water Softener</p>
            <p className="mt-1 text-center text-[13px] text-muted-foreground">Removes hardness minerals</p>
            <p className="mt-0.5 text-center text-[13px] text-muted-foreground">$249 — in stock</p>
          </div>

          {/* Connector */}
          <div className="flex items-center justify-center border-y border-border bg-surface px-4 py-2 sm:border-x sm:border-y-0 sm:py-0">
            <span className="text-[13px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">different jobs</span>
          </div>

          {/* Canopy panel — typographic only */}
          <div className="flex flex-col items-center justify-center bg-surface/40 p-6 sm:p-8">
            <p className="text-center font-display text-lg leading-tight sm:text-xl">Canopy</p>
            <div className="mt-4 space-y-1 text-center text-[14px] text-foreground/80">
              <p>Chlorine filter</p>
              <p className="text-[13px] text-muted-foreground">KDF-55, carbon, calcium sulfite</p>
            </div>
          </div>
        </div>

        <div className="mt-10 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            The Canopy filter is one of the best-known shower filters in the country. It is also a filter, and that is the whole issue if your problem is hard water. Canopy's site says its filter media have been shown to help reduce chlorine, magnesium, and calcium carbonate. On the chlorine job it delivers. Hardness is a different job. Calcium and magnesium are dissolved minerals, and carbon and KDF media do not remove them. Ion-exchange resin does.
          </p>
        </div>

        <PreferredSourceBlock />

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          What Canopy does well
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            Canopy removes chlorine and improves how shower water smells and feels. The design is polished and replacement filters arrive on a schedule. The brand has real press behind it. If chlorine is your problem, Canopy is a reasonable buy.
          </p>
        </div>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          Where hard water comes in
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            Canopy's site says its filter media have been shown to help reduce chlorine, magnesium, and calcium carbonate. The media inside are KDF-55, activated carbon, and calcium sulfite. Those materials reduce chlorine well. They do not hold dissolved calcium and magnesium the way ion-exchange resin holds them, which is why a filter can pass a chlorine test and still leave spots on your glass and film on your skin. If you have used a shower filter and your hair still feels coated, this is the reason. The full chemistry is on our page about <a href="/do-shower-filters-work-for-hard-water" className="underline hover:opacity-70">why filter media cannot remove hardness</a>.
          </p>
        </div>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          The alternative for hardness
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            <a href="/" className="underline hover:opacity-70">The AG Water Softener</a> uses ion-exchange resin, the same chemistry as a whole-home softener, sized for a shower arm. It removes dissolved calcium and magnesium instead of filtering particles. It recharges itself from an included brine tank in about 30 minutes, every 3 to 5 weeks, with plain non-iodized salt. It costs $249 and ships free with tracking. The guarantee is 60 days money-back, with a 12-month warranty behind it.
          </p>
        </div>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          Side by side
        </h2>
        <div className="mt-6 text-[15px] leading-[1.7] text-foreground/90">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-border text-[14px] leading-[1.6]">
              <thead>
                <tr className="bg-surface">
                  <th className="border border-border px-4 py-3 text-left font-semibold"></th>
                  <th className="border border-border px-4 py-3 text-left font-semibold">Canopy</th>
                  <th className="border border-border px-4 py-3 text-left font-semibold">AG Water Softener</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-border px-4 py-3 font-semibold">What it removes</td>
                  <td className="border border-border px-4 py-3">Chlorine and particles</td>
                  <td className="border border-border px-4 py-3">Dissolved calcium and magnesium</td>
                </tr>
                <tr className="bg-surface/50">
                  <td className="border border-border px-4 py-3 font-semibold">Mechanism</td>
                  <td className="border border-border px-4 py-3">KDF-55, carbon, calcium sulfite</td>
                  <td className="border border-border px-4 py-3">Ion-exchange resin</td>
                </tr>
                <tr>
                  <td className="border border-border px-4 py-3 font-semibold">Price</td>
                  <td className="border border-border px-4 py-3">$150</td>
                  <td className="border border-border px-4 py-3">$249</td>
                </tr>
                <tr className="bg-surface/50">
                  <td className="border border-border px-4 py-3 font-semibold">Ongoing cost</td>
                  <td className="border border-border px-4 py-3">Replacement filter $27 every 90 days on subscription ($25 one-time)</td>
                  <td className="border border-border px-4 py-3">Plain non-iodized salt</td>
                </tr>
                <tr>
                  <td className="border border-border px-4 py-3 font-semibold">Guarantee</td>
                  <td className="border border-border px-4 py-3">60-day return on devices, minus a handling fee; filters are final sale</td>
                  <td className="border border-border px-4 py-3">60-day money-back, with a 12-month warranty</td>
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
            Start with your water. <a href="https://www.myapartmentwaterquality.com/" className="underline hover:opacity-70">Check it free</a> with our lookup tool. If your water is soft and your complaint is smell or dryness after showering, chlorine is the likely cause and Canopy fits. If your water is hard and your complaint is buildup and hair that will not rinse clean, filtration will not touch it and softening will.
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
