import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

const PAGE_FAQS = [
  {
    q: "Is the softening performance different?",
    a: "Not meaningfully. Ion exchange is pass or fail: the resin either trades out the hardness minerals or it's exhausted and needs a recharge. Design changes how you recharge and where the unit sits, not how soft the water gets.",
  },
  {
    q: "Why is AG worth considering over the established product?",
    a: "Fit and upkeep. If a hanging column with a handheld head and a weekly drain-and-pour routine sounds fine for your bathroom, their track record is a fair reason to choose them. Our bet is that once you picture both routines in your own shower, the difference matters.",
  },
  {
    q: "Can I switch from a ShowerStick to an AG easily?",
    a: "Yes. AG threads onto a standard 1/2-inch shower arm, so the swap is remove one, install the other, about ten minutes with no tools.",
  },
];

export const Route = createFileRoute("/showerstick-alternative")({
  head: () => ({
    meta: [
      { title: "Affordable ShowerStick Alternative: In Stock at $249" },
      {
        name: "description",
        content:
          "The ShowerStick softens but needs a salt recharge every week. Here is how it compares with the AG, which recharges every 3 to 5 weeks, on price and terms.",
      },
      { property: "og:title", content: "Affordable ShowerStick Alternative: In Stock at $249" },
      { property: "og:description", content: "The ShowerStick softens but needs a salt recharge every week. Here is how it compares with the AG, which recharges every 3 to 5 weeks, on price and terms." },
      { property: "og:url", content: "https://agsoftener.com/showerstick-alternative" },
      { property: "og:type", content: "article" },
      { property: "og:image", content: "https://agsoftener.com/assets/hero.png" },
      { property: "og:site_name", content: "AG Water Softener" },
    ],
    links: [
      { rel: "canonical", href: "https://agsoftener.com/showerstick-alternative" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "ShowerStick alternative: the side-by-side comparison",
          datePublished: "2026-07-28",
          dateModified: "2026-08-18",
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
            { "@type": "ListItem", position: 2, name: "ShowerStick vs AG compared", item: "https://agsoftener.com/showerstick-alternative" },
          ],
        }),
      },
    ],
  }),
  component: ShowerstickAlternativePage,
});

function ShowerstickAlternativePage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <article className="mx-auto max-w-[760px] px-5 py-12 md:px-8 md:py-16 lg:py-24">
        <h1 className="font-display text-3xl leading-[1.05] sm:text-4xl md:text-[46px]">
          ShowerStick alternative: the side-by-side comparison
        </h1>
        <p className="text-sm text-muted-foreground">
          Updated Aug 18, 2026
        </p>

        <div
          className="mt-10 grid gap-0 overflow-hidden border border-border sm:grid-cols-[1fr_auto_1fr]"
          role="img"
          aria-label="ShowerStick compared with the AG Water Softener: same chemistry, different design"
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
            <div className="mt-4 space-y-1 text-center text-[14px] text-foreground/80">
              <p>$249</p>
              <p>Automatic recharge</p>
              <p>60-day guarantee</p>
              <p>In stock</p>
            </div>
          </div>

          {/* VS mark */}
          <div className="flex items-center justify-center border-y border-border bg-surface px-4 py-2 sm:border-x sm:border-y-0 sm:py-0">
            <span className="text-[13px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">vs</span>
          </div>

          {/* ShowerStick panel — typographic only */}
          <div className="flex flex-col items-center justify-center bg-surface/40 p-6 sm:p-8">
            <p className="text-center font-display text-lg leading-tight sm:text-xl">ShowerStick</p>
            <div className="mt-4 space-y-1 text-center text-[14px] text-foreground/80">
              <p>$260</p>
              <p>Manual weekly recharge</p>
              <p>14-day returns</p>
              <p>Handmade batches, often sells out</p>
            </div>
          </div>
        </div>
        <p className="mt-4 text-center text-[14px] text-muted-foreground">
          Same chemistry. The differences are around it.
        </p>

        <div className="mt-8 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            The ShowerStick deserves credit before comparison. It has been softening showers with real ion-exchange resin since 2004, it's handmade in the USA by a family company, and its long review base is a big part of why anyone believes a shower-sized softener works at all. If you've researched this category, you found it, and you found people vouching for it, for good reason.
          </p>
          <p>
            <a href="/" className="underline hover:opacity-70">The AG Water Softener</a> uses the same chemistry. The differences are in everything around the chemistry: how each unit lives in your shower, how it recharges, and the terms behind the purchase. Here is the comparison we'd want if we were the ones shopping.
          </p>
        </div>

        <img
          src="/assets/cross-section.png"
          alt="AG Water Softener, a ShowerStick alternative using the same ion-exchange chemistry"
          width={1254}
          height={1254}
          loading="lazy"
          className="mt-10 w-full max-w-[520px] h-auto"
        />

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          Where they're the same
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            Both are genuine softeners: ion-exchange resin, salt regeneration, hardness measurably removed. Run a test strip on either one's output and it reads soft. Neither is a filter wearing a softener label, and both companies spend real energy explaining that difference, because <a href="/shower-head-water-softener" className="underline hover:opacity-70">most "softener" showerheads are filters</a>. On the question that decides whether your water actually gets soft, there is no meaningful difference between these two products.
          </p>
        </div>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          Where they differ
        </h2>
        <div className="mt-6 text-[15px] leading-[1.7] text-foreground/90">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-border text-[14px] leading-[1.6]">
              <thead>
                <tr className="bg-surface">
                  <th className="border border-border px-4 py-3 text-left font-semibold"></th>
                  <th className="border border-border px-4 py-3 text-left font-semibold">ShowerStick</th>
                  <th className="border border-border px-4 py-3 text-left font-semibold">AG Water Softener</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-border px-4 py-3 font-semibold">Chemistry</td>
                  <td className="border border-border px-4 py-3">Ion-exchange resin, salt regeneration</td>
                  <td className="border border-border px-4 py-3">Same</td>
                </tr>
                <tr className="bg-surface/50">
                  <td className="border border-border px-4 py-3 font-semibold">How it lives in your shower</td>
                  <td className="border border-border px-4 py-3">3-inch PVC column (about 7 lb full) hanging inside the shower, used with the included handheld showerhead</td>
                  <td className="border border-border px-4 py-3">In line at the shower arm, works with your existing showerhead</td>
                </tr>
                <tr>
                  <td className="border border-border px-4 py-3 font-semibold">Showerhead requirement</td>
                  <td className="border border-border px-4 py-3">Handheld head that drains freely (theirs included, or a compatible one)</td>
                  <td className="border border-border px-4 py-3">None; keep what you have</td>
                </tr>
                <tr className="bg-surface/50">
                  <td className="border border-border px-4 py-3 font-semibold">Regeneration</td>
                  <td className="border border-border px-4 py-3">Drain the unit with head and hose on the floor, dissolve a cup of table salt in a liter bottle, pour into the port, flush; typically weekly</td>
                  <td className="border border-border px-4 py-3">Automatic recharge from an included brine tank; add salt and the cycle runs itself</td>
                </tr>
                <tr>
                  <td className="border border-border px-4 py-3 font-semibold">Verifying it works</td>
                  <td className="border border-border px-4 py-3">Any $10 hardness strip reads the output soft</td>
                  <td className="border border-border px-4 py-3">Any $10 test strip reads the output near zero</td>
                </tr>
                <tr className="bg-surface/50">
                  <td className="border border-border px-4 py-3 font-semibold">Price</td>
                  <td className="border border-border px-4 py-3">$260 <span className="text-[12px] text-muted-foreground">(on sale from $299, checked Aug 18, 2026)</span></td>
                  <td className="border border-border px-4 py-3">$249</td>
                </tr>
                <tr>
                  <td className="border border-border px-4 py-3 font-semibold">Returns</td>
                  <td className="border border-border px-4 py-3">14 days, shipping not refunded</td>
                  <td className="border border-border px-4 py-3">60-day money-back guarantee</td>
                </tr>
                <tr className="bg-surface/50">
                  <td className="border border-border px-4 py-3 font-semibold">Warranty</td>
                  <td className="border border-border px-4 py-3">12 months</td>
                  <td className="border border-border px-4 py-3">12 months</td>
                </tr>
                <tr>
                  <td className="border border-border px-4 py-3 font-semibold">Availability</td>
                  <td className="border border-border px-4 py-3">Handmade in small daily batches; frequently sells out</td>
                  <td className="border border-border px-4 py-3">In stock</td>
                </tr>
                <tr className="bg-surface/50">
                  <td className="border border-border px-4 py-3 font-semibold">Track record</td>
                  <td className="border border-border px-4 py-3">Two decades, deep review base</td>
                  <td className="border border-border px-4 py-3">Newer</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          What the table doesn't show
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            The last row is theirs: a product with twenty years of users has answered questions a newer one hasn't. Their regeneration routine also isn't the horror story competitors sometimes imply; their customers describe it as easy and about five minutes.
          </p>
          <p>
            The case for AG is smaller and specific. It lives at the shower arm instead of hanging in the shower with you, it works with the showerhead you already like, its recharge runs automatically from an included brine tank, and you get 60 days to change your mind instead of 14. Softeners fail when the upkeep stops happening or the hardware never fit the bathroom. Those are the margins AG is built on.
          </p>
        </div>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          How to choose
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            If the longest track record in the category matters most to you and the handheld-head setup suits your shower, the ShowerStick is a legitimate buy, and we'd genuinely rather you own one than a fake-softener showerhead. If you want the same soft water at the shower arm, with your own showerhead, an automatic recharge, and a 60-day window to verify it with a test strip, that's the case for AG. For a wider view that includes SoftWaterCare, see the <a href="/softwatercare-vs-showerstick-vs-ag" className="underline hover:opacity-70">three-way comparison</a>.
          </p>
          <p>
            Either way, confirm your water is actually hard first: <a href="https://www.myapartmentwaterquality.com/" className="underline hover:opacity-70">check it free with our lookup tool</a> or run a strip. Both products are wasted on soft water.
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
