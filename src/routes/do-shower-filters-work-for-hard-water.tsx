import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

const PAGE_FAQS = [
  {
    q: "My filter's listing says it softens water. Is that false?",
    a: 'Read the media list. If the cartridge contains KDF, carbon, or vitamin C and no ion-exchange resin with salt regeneration, the softening claim is marketing. Some listings use "softens" to mean "feels nicer," which is a feeling, not a measurement.',
  },
  {
    q: "Will a filter at least stop the white crust on my fixtures?",
    a: "No. Scale is calcium and magnesium coming out of solution as water dries. The filter never removed them, so the crust keeps forming.",
  },
  {
    q: "Should I use a filter and a softener together?",
    a: "If your water is both hard and heavily chlorinated, yes, that combination covers both problems. Soften first. Hardness causes the buildup and the lathering issues, and it is the half a filter can never fix.",
  },
];

export const Route = createFileRoute(
  "/do-shower-filters-work-for-hard-water",
)({
  head: () => ({
    meta: [
      { title: "Do Shower Filters Work for Hard Water? No, and What Works Instead" },
      {
        name: "description",
        content:
          "Shower filters remove chlorine, not hardness. Calcium and magnesium pass straight through carbon and KDF. Here is what removes them instead.",
      },
      { property: "og:title", content: "Do Shower Filters Work for Hard Water? No, and What Works Instead" },
      { property: "og:description", content: "Shower filters remove chlorine, not hardness. Calcium and magnesium pass straight through carbon and KDF. Here is what removes them instead." },
      { property: "og:url", content: "https://agsoftener.com/do-shower-filters-work-for-hard-water" },
      { property: "og:type", content: "article" },
      { property: "og:image", content: "https://agsoftener.com/assets/hero.png" },
      { property: "og:site_name", content: "AG Water Softener" },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://agsoftener.com/do-shower-filters-work-for-hard-water",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "Do shower filters work for hard water?",
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
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: "https://agsoftener.com/",
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Do shower filters work for hard water?",
              item: "https://agsoftener.com/do-shower-filters-work-for-hard-water",
            },
          ],
        }),
      },
    ],
  }),
  component: DoShowerFiltersWorkPage,
});

function DoShowerFiltersWorkPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <article className="mx-auto max-w-[760px] px-5 py-12 md:px-8 md:py-16 lg:py-24">
        <h1 className="font-display text-3xl leading-[1.05] sm:text-4xl md:text-[46px]">
          Do shower filters work for hard water?
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Ana · Client Support | AG Water Softener
        </p>
        <p className="text-sm text-muted-foreground">
          Published Jul 28, 2026 · Updated Aug 12, 2026
        </p>

        <div className="mt-8 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            No. Shower filters work for chlorine, sediment, and some metals. They do not work for hardness. Any showerhead filter marketed as a fix for hard water is selling you a product that cannot do the job, and this page explains why in plain terms so you can spend your money once instead of twice.
          </p>
        </div>

        <img
          src="/assets/showerhead_hard_water.png"
          alt="Mineral buildup on a showerhead that a shower filter for hard water cannot remove"
          width={1448}
          height={1086}
          loading="lazy"
          className="mt-10 w-full h-auto"
        />

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          Why filters can't remove hardness
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            Hard water is water carrying dissolved calcium and magnesium. Dissolved is the key word. These are not particles floating in the stream that a screen can catch. They are individual charged ions, small enough to pass through every filter media on the market as if it weren't there.
          </p>
          <p>
            KDF-55, activated carbon, calcium sulfite, vitamin C: all of these neutralize chlorine through chemical reactions. None of them has a mechanism for grabbing a dissolved mineral ion at shower flow rates. This is not a quality difference between brands. A $170 filter and an $18 filter fail at hardness for the same reason.
          </p>
          <p>
            The one chemistry that removes dissolved calcium and magnesium is ion exchange, where water passes through resin beads that trade the hardness minerals for sodium. Whole-house softeners use it. So does <a href="/" className="underline hover:opacity-70">the AG Water Softener</a>, scaled down to fit a single shower.
          </p>
        </div>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          Then why do filter reviews mention softer hair?
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            Because the chlorine removal is real. Chlorine dries hair and skin on its own, so removing it helps, and people reasonably describe that improvement as "softer." If your city's water is soft and chlorinated, a filter may be all you need, and we'd rather tell you that than sell you a softener you don't need.
          </p>
          <p>
            But if your water is hard, the improvement plateaus fast. The minerals keep coating your hair, the crust keeps growing on the showerhead, and soap still won't lather right. You fixed half the problem and the visible half remains.
          </p>
        </div>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          How to check whether hardness is your problem
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>Two ways, both under ten dollars and ten minutes.</p>
          <p>
            First, check your local water hardness with <a href="https://www.myapartmentwaterquality.com/" className="underline hover:opacity-70">our free report tool</a>. It pulls from public utility and USGS data and shows the number for your area in parts per million. Anything above about 120 ppm counts as hard; plenty of US cities run 200 to 300.
          </p>
          <p>
            Second, run a test strip on your own shower. Strips don't care about marketing claims. If the strip reads hard, no filter cartridge will change that reading. A working softener will take the same strip to near zero.
          </p>
        </div>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          What works when you can't install a whole-house system
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            Renters, condo owners, and anyone unwilling to cut into their plumbing have been stuck with this problem for years, because the standard advice was "install a whole-house softener" and the standard price was $2,000 plus a plumber.
          </p>
          <p>
            A shower water softener closes that gap. <a href="/" className="underline hover:opacity-70">The AG Water Softener</a> is an ion-exchange unit that mounts on the shower arm, installs in about ten minutes without tools, and regenerates with plain non-iodized salt. A $10 test strip puts the proof on your counter. $249, 60-day money-back guarantee, and it leaves the building's plumbing untouched when you move out.
          </p>
          <p>
            For a side-by-side of what each device removes, read the <a href="/shower-filter-vs-water-softener" className="underline hover:opacity-70">full filter vs softener comparison</a>.
          </p>
        </div>

        <h2 id="filter-did-not-work" className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          If your shower filter did not work
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            You bought a filter and installed it right. The film on your skin stayed and the spots came back on the glass. The instinct is to blame the brand or your routine. The chemistry says otherwise.
          </p>
          <p>
            Carbon and KDF media capture chlorine. They cannot hold dissolved calcium and magnesium, so every gallon leaves the filter as hard as it arrived. The product was matched to a different problem.
          </p>
          <p>
            If chlorine was bothering you too, keep the filter. For the hardness, the fix is ion-exchange resin, the same chemistry inside a whole-home softener, sized for a shower arm. <a href="/" className="underline hover:opacity-70">See how the AG Water Softener works</a>.
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
