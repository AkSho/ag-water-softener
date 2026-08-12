import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

const PAGE_FAQS = [
  {
    q: "Did I waste money on the Jolie?",
    a: "Not if your water has chlorine, which most city water does. It's doing that job well. The gap is in what filter chemistry can ever do about dissolved minerals, and it's a gap the whole product category's marketing tends to blur.",
  },
  {
    q: "Why does my hair feel better some days with just the filter?",
    a: "Chlorine removal helps dryness, and dryness varies with weather, washing, and products. The mineral load doesn't vary, which is why the improvement never quite completes.",
  },
  {
    q: "Will softened water feel different?",
    a: "Yes, in a good way that takes a few days of adjustment. Soap finally rinses instead of leaving scum, which some people first describe as slippery. It's the feeling of skin without a mineral film.",
  },
];

export const Route = createFileRoute("/jolie-alternative-for-hard-water")({
  head: () => ({
    meta: [
      { title: "Jolie Alternative That Softens Hard Water: $249" },
      {
        name: "description",
        content:
          "The Jolie is a good chlorine filter, and that's the problem: if your water is hard, no filter helps. Here is the device that removes hardness instead.",
      },
      { property: "og:title", content: "Jolie Alternative That Softens Hard Water: $249" },
      { property: "og:description", content: "The Jolie is a good chlorine filter, and that's the problem: if your water is hard, no filter helps. Here is the device that removes hardness instead." },
      { property: "og:url", content: "https://agsoftener.com/jolie-alternative-for-hard-water" },
      { property: "og:type", content: "article" },
      { property: "og:image", content: "https://agsoftener.com/assets/hero.png" },
      { property: "og:site_name", content: "AG Water Softener" },
    ],
    links: [
      { rel: "canonical", href: "https://agsoftener.com/jolie-alternative-for-hard-water" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "Jolie alternative for hard water: why a filter didn't help",
          datePublished: "2026-07-28",
          dateModified: "2026-08-12",
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
            { "@type": "ListItem", position: 2, name: "Jolie alternative for hard water", item: "https://agsoftener.com/jolie-alternative-for-hard-water" },
          ],
        }),
      },
    ],
  }),
  component: JolieAlternativePage,
});

function JolieAlternativePage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <article className="mx-auto max-w-[760px] px-5 py-12 md:px-8 md:py-16 lg:py-24">
        <h1 className="font-display text-3xl leading-[1.05] sm:text-4xl md:text-[46px]">
          Jolie alternative for hard water: why a filter didn't help
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Ana · Client Support | AG Water Softener
        </p>
        <p className="text-sm text-muted-foreground">
          Published Jul 28, 2026 · Updated Aug 12, 2026
        </p>

        {/* Split-card hero */}
        <div
          className="mt-10 grid gap-0 overflow-hidden border border-border sm:grid-cols-[1fr_auto_1fr]"
          role="img"
          aria-label="AG Water Softener removes hardness, Jolie removes chlorine: different devices for different problems"
        >
          {/* AG panel */}
          <div className="flex flex-col items-center bg-background p-6 sm:p-8">
            <img
              src="/assets/cross-section.png"
              alt=""
              width={1254}
              height={1254}
              loading="lazy"
              className="w-full max-w-[240px] h-auto"
            />
            <p className="mt-4 text-center font-display text-lg leading-tight sm:text-xl">AG Water Softener</p>
            <div className="mt-4 space-y-1 text-center text-[14px] text-foreground/80">
              <p>The AG Water Softener removes hardness. That's the job filters can't do.</p>
            </div>
          </div>

          {/* Connector */}
          <div className="flex items-center justify-center border-y border-border bg-surface px-4 py-2 sm:border-x sm:border-y-0 sm:py-0">
            <span className="text-[13px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">different jobs</span>
          </div>

          {/* Jolie panel — typographic only */}
          <div className="flex flex-col items-center justify-center bg-surface/40 p-6 sm:p-8">
            <p className="text-center font-display text-lg leading-tight sm:text-xl">Jolie</p>
            <div className="mt-4 space-y-1 text-center text-[14px] text-foreground/80">
              <p>Jolie removes chlorine. It can't remove hardness.</p>
            </div>
          </div>
        </div>
        <p className="mt-4 text-center text-[14px] text-muted-foreground">
          Different devices for different problems. A $10 strip tells you which one you have.
        </p>

        <div className="mt-8 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            The Jolie is a well-made chlorine filter. Its KDF-55 and calcium sulfite media reduce chlorine and heavy metals, the pressure holds up, and if chlorine was your problem, it probably helped.
          </p>
          <p>
            If you're searching for an alternative anyway, the likely reason is that your problem was never chlorine. It's hardness: dissolved calcium and magnesium, and removing those takes a different chemistry than any filter uses.
          </p>
        </div>

        <img
          src="/assets/ion-exchange-diagram.png"
          alt="Ion exchange diagram: hard water in, calcium and magnesium removed by resin, soft water out"
          width={1254}
          height={1254}
          loading="lazy"
          className="mt-10 w-full max-w-[520px] h-auto"
        />

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          But the box says it handles hard water
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            Jolie's marketing mentions hard water and scale, so let's deal with that directly, using only things you can check.
          </p>
          <p>
            Jolie's own materials describe how their media works: KDF-55 is copper-zinc granules that neutralize chlorine and capture heavy metals through redox reactions, and calcium sulfite assists with chlorine at higher temperatures. Both are respected chemistries for exactly those jobs. Neither one is ion exchange, and ion exchange, resin plus salt regeneration, is the process that removes dissolved calcium and magnesium from water. <a href="/shower-filter-vs-water-softener" className="underline hover:opacity-70">The full filter vs softener breakdown</a> walks through why.
          </p>
          <p>
            A $10 hardness test strip is the referee: run one on your shower with the filter installed. If your water reads above about 120 ppm through the filter, then whatever the marketing means by "hard water," your hardness is arriving at your hair intact. That reading is the whole argument.
          </p>
        </div>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          How this feels in practice
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            The pattern Jolie owners with hard water describe is consistent. The first couple of weeks feel like an improvement, because chlorine removal is real and new hardware sprays nicer. Then it plateaus: the white crust keeps growing on fixtures, shampoo still won't lather into much, and hair still feels coated by week's end. The chlorine half of the problem got fixed. The mineral half never could be.
          </p>
        </div>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          The alternative for hard water is a softener
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            <a href="/" className="underline hover:opacity-70">The AG Water Softener</a> does the job filters can't. It holds a bed of ion-exchange resin at the shower arm, swaps the calcium and magnesium out of your water, and regenerates with plain non-iodized salt. About ten minutes to install, no tools, and a $10 test strip makes the before and after a measurement on your counter. Hard water in reads 120 ppm and up; the output reads near zero. $249, 60-day money-back guarantee.
          </p>
          <p>
            The trade in the other direction: AG does not remove chlorine. It removes hardness, the thing that was crusting your fixtures and coating your hair.
          </p>
        </div>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          Can you run both?
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            Yes. If your water is both hard and heavily chlorinated, a softener at the shower arm doing ion exchange with a filter downstream handling chlorine covers everything. If you already own a Jolie, keeping it in line behind a softener is a sensible setup. Starting from zero, soften first, then decide whether chlorine still bothers you.
          </p>
        </div>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          Check before you buy anything else
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            <a href="https://www.myapartmentwaterquality.com/" className="underline hover:opacity-70">Look up your water hardness free</a> with our report tool, or use a strip. Under 120 ppm, hardness isn't your issue and a softener won't help; a chlorine filter like the one you have is the right tool. Over 120 ppm, and especially in the 200 to 300 range many US cities sit in, the softener is the missing device.
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
