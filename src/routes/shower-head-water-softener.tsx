import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { PreferredSourceBlock } from "@/components/PreferredSourceBlock";

const PAGE_FAQS = [
  {
    q: "Are the cheap ones a scam?",
    a: 'The products mostly do what their media can do: reduce chlorine. The scam, where there is one, is the word "softener" in the title. If chlorine is your actual problem, a cheap filter is a reasonable buy. If hardness is your problem, it will do nothing you can measure.',
  },
  {
    q: 'What about showerheads with "softening mineral balls"?',
    a: "Ceramic and \"mineral\" beads condition or filter at best. They do not perform ion exchange and there is no salt regeneration, so hardness passes through. Same ten-second check applies.",
  },
  {
    q: "How do I find out if I even have hard water?",
    a: "Check your water free with our lookup tool, or use a $10 test strip on the shower itself. If you read under about 120 ppm, skip softeners entirely and shop filters for chlorine instead.",
  },
];

export const Route = createFileRoute("/shower-head-water-softener")({
  head: () => ({
    meta: [
      { title: "Shower head water softener: most of them can't soften water" },
      {
        name: "description",
        content:
          "Most products sold as shower head water softeners are chlorine filters. Here is how to read a listing and what removes hardness for real.",
      },
      { property: "og:title", content: "Shower head water softener: most of them can't soften water" },
      { property: "og:description", content: "Most products sold as shower head water softeners are chlorine filters. Here is how to read a listing and what removes hardness for real." },
      { property: "og:url", content: "https://agsoftener.com/shower-head-water-softener" },
      { property: "og:type", content: "article" },
      { property: "og:image", content: "https://agsoftener.com/assets/hero.png" },
      { property: "og:site_name", content: "AG Water Softener" },
    ],
    links: [
      { rel: "canonical", href: "https://agsoftener.com/shower-head-water-softener" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "Shower head water softener: most of them can't soften water",
          datePublished: "2026-07-28",
          dateModified: "2026-08-27",
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
            { "@type": "ListItem", position: 2, name: "Shower head water softeners", item: "https://agsoftener.com/shower-head-water-softener" },
          ],
        }),
      },
    ],
  }),
  component: ShowerHeadWaterSoftenerPage,
});

function ShowerHeadWaterSoftenerPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <article className="mx-auto max-w-[760px] px-5 py-12 md:px-8 md:py-16 lg:py-24">
        <h1 className="font-display text-3xl leading-[1.05] sm:text-4xl md:text-[46px]">
          Shower head water softener: most of them can't soften water
        </h1>
        <p className="text-sm text-muted-foreground">
          Updated Aug 27, 2026
        </p>

        <div className="mt-8 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            Search "shower head water softener" on Amazon or Walmart and you'll see pages of results from $15 cartridges to $199 "water softener shower heads," prices checked August 2026, many with thousands of reviews, promising to soften hard water. Almost none of them can. They are chlorine filters wearing the word "softener" on the listing, and the way to catch them takes about ten seconds once you know where to look.
          </p>
        </div>

        <img
          src="/assets/cross-section.png"
          alt="A real shower head water softener uses ion-exchange resin, not filter cartridges"
          width={1254}
          height={1254}
          loading="lazy"
          className="mt-10 w-full max-w-[520px] h-auto"
        />

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          The ten-second listing check
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            Scroll past the title to the materials or media list. You'll see some mix of: KDF-55, activated carbon, calcium sulfite, vitamin C, ceramic balls, "mineral beads," or a stage count like "15-stage" or "20-stage."
          </p>
          <p>
            Every one of those is filtration media. All of it targets chlorine, sediment, and odor. None of it removes calcium or magnesium, because hardness minerals are dissolved ions that pass through filter media untouched. The full chemistry is on our page about <a href="/do-shower-filters-work-for-hard-water" className="underline hover:opacity-70">why filter media can't remove hardness</a>, but the shopping rule is short: <strong>no ion-exchange resin and no salt regeneration means it cannot soften water,</strong> whatever the title says.
          </p>
          <p>
            The stage count is theater. Fifteen materials that each fail to remove hardness still remove no hardness.
          </p>
        </div>

        <PreferredSourceBlock />

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          Why the reviews look good anyway
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            Two reasons, and neither is fraud by the reviewers. First, these products do remove chlorine, and chlorine removal genuinely helps dry skin and hair, so "my skin feels better" reviews are often true. Second, a new showerhead usually sprays better than the crusted one it replaced, and people credit the filter for what is really fresh hardware.
          </p>
          <p>
            What the reviews can't tell you: whether a test strip reads any different. It doesn't. The white crust comes back, soap still fights you, and the mineral coating on your hair keeps building.
          </p>
        </div>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          What a real one looks like
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            A device that softens shower water has to hold a bed of ion-exchange resin large enough to treat water at two gallons per minute, and it has to regenerate with salt when the resin fills up. That has a physical size, which is why no $18 cartridge in a 4-inch housing does it, and why the real category is small: purpose-built units mounted at the shower arm, not screw-in showerheads.
          </p>
          <p>
            <a href="/" className="underline hover:opacity-70">The AG Water Softener</a> is built this way: a resin bed at the shower arm, a ten-minute no-tool install, recharges with plain non-iodized salt, and a $10 test strip makes the claim checkable on your counter. Hard water in reads 120 ppm and up; the output reads near zero. $249, 60-day money-back guarantee.
          </p>
          <p>
            Yes, that's more than $18. It's also the difference between buying a softener and buying the word. For the full side-by-side, read <a href="/shower-filter-vs-water-softener" className="underline hover:opacity-70">the filter vs softener comparison</a>. The full field is ranked in <a href="/best-shower-water-softener" className="underline hover:opacity-70">our shower water softener list</a>.
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
