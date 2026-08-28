import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

export const Route = createFileRoute("/prevent-limescale-in-shower")({
  head: () => ({
    meta: [
      { title: "How to prevent limescale in your shower for good" },
      {
        name: "description",
        content:
          "Scrubbing removes limescale but can't stop it from coming back. Here's what actually prevents scale, including for renters who can't touch the plumbing.",
      },
      { property: "og:title", content: "How to prevent limescale in your shower for good" },
      { property: "og:description", content: "Scrubbing removes limescale but can't stop it from coming back. Here's what actually prevents scale, including for renters who can't touch the plumbing." },
      { property: "og:url", content: "https://agsoftener.com/prevent-limescale-in-shower" },
      { property: "og:type", content: "article" },
      { property: "og:image", content: "https://agsoftener.com/assets/hero.png" },
      { property: "og:site_name", content: "AG Water Softener" },
    ],
    links: [
      { rel: "canonical", href: "https://agsoftener.com/prevent-limescale-in-shower" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "How to prevent limescale in your shower for good",
          datePublished: "2026-08-27",
          dateModified: "2026-08-27",
          author: { "@type": "Organization", name: "AG Water Softener" },
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
              name: "Prevent limescale in shower",
              item: "https://agsoftener.com/prevent-limescale-in-shower",
            },
          ],
        }),
      },
    ],
  }),
  component: PreventLimescaleInShowerPage,
});

function PreventLimescaleInShowerPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <article className="mx-auto max-w-[760px] px-5 py-12 md:px-8 md:py-16 lg:py-24">
        <h1 className="font-display text-3xl leading-[1.05] sm:text-4xl md:text-[46px]">
          How to prevent limescale in your shower for good
        </h1>
        <p className="text-sm text-muted-foreground">
          Updated Aug 27, 2026
        </p>

        <div className="mt-8 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            The only way to prevent limescale is to take the minerals out of the water before it reaches your shower. Everything else is just cleanup. Limescale is what hard water leaves behind: every time water dries on glass or metal, the calcium and magnesium dissolved in it stay put as a white crust. Cleaning takes the crust off. The next shower, however, brings the same minerals.
          </p>
        </div>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          Why scale comes back no matter how you clean
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            Hard water holds dissolved calcium and magnesium. You can't see them while the water is wet. When the water dries though, the minerals stay behind and bond to whatever they dried on. That's the white crust and spots on your glass door and the ring on the shower head. Anything above about 120 ppm of hardness will cause scale. In <a href="https://www.myapartmentwaterquality.com/hardest-water-cities" className="underline hover:opacity-70">The hardest water cities in America</a>, our verified 25-city study, readings run as high as 350 ppm. And the harder the water, the faster the crust builds. Scale is a water problem that shows up noticeably on your surfaces.
          </p>
        </div>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          What cleaning does
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            Vinegar and descalers work. The acid dissolves the mineral crust and your glass looks new for a while. Use them. Just know what they are. Removal, not prevention. The minerals arrive with every shower, so the cycle restarts the moment you rinse. If you've been cleaning the same glass every few weeks for years, that's the cycle working exactly as the chemistry says it will.
          </p>
        </div>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          The only prevention is softer water
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            To stop scale from forming, the calcium and magnesium have to leave the water before it reaches your shower. That's what a water softener does, through ion exchange resin that trades hardness minerals for sodium. If you own your home, a whole-house softener protects every tap and appliance. If you rent, or your building's plumbing is off limits, a shower-scale softener does the same job for the one room where scale shows most. <a href="/" className="underline hover:opacity-70">The AG Water Softener</a> hangs on the wall and connects to a hose line by hand. One recharge treats about 1,300 gallons, which is three to five weeks of daily showers for most households. Scale stops building on the shower glass because the minerals that formed it never arrive.
          </p>
          <p>
            A shower filter won't do this. Carbon and KDF take out chlorine and leave the minerals in, which is why filtered showers still scale. The full chemistry is in <a href="/shower-filter-vs-water-softener" className="underline hover:opacity-70">our filter vs softener guide</a>. And if you're weighing the products that soften at shower scale, <a href="/best-shower-water-softener" className="underline hover:opacity-70">our ranking</a> covers the field.
          </p>
        </div>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          If you host guests
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            Short-term rental hosts run into limescale at every turnover. Guests notice water spots on the glass, and cleaners charge for the time it takes to scrub them off. Softening the shower line takes that job off the checklist. The glass stays clear between bookings because nothing is left behind to dry on it.
          </p>
        </div>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          How to check it's working
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            A hardness test strip before and after the unit tells you in seconds whether minerals are leaving the water. Your glass tells you over a month. Clean it once and soften the line. Then watch whether the crust returns. Scale that doesn't come back is the whole point.
          </p>
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
