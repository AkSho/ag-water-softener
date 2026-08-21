import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

const PAGE_FAQS = [
  {
    q: "Can I install a water softener in my apartment?",
    a: "Yes. Shower-arm softeners thread on like a shower head, with no plumbing changes and nothing a landlord needs to approve. Portable RV softeners connect by hose. Only whole-house systems require installation you can\u2019t do in a rental.",
  },
  {
    q: "Do shower head water softeners work?",
    a: "Most products sold under that name are chlorine filters and can\u2019t remove hardness. The ones that work contain ion-exchange resin and recharge with salt. If a product doesn\u2019t mention resin and salt, it filters rather than softens.",
  },
  {
    q: "How can you tell if an apartment has hard water?",
    a: "Scale on the shower glass and coated-feeling hair are the usual signs, along with soap that rinses poorly. A test strip from the hardware store gives you a number in thirty seconds.",
  },
];

export const Route = createFileRoute("/water-softener-for-apartment")({
  head: () => ({
    meta: [
      { title: "Affordable Hard Water Softener for Apartments ($249)" },
      {
        name: "description",
        content:
          "You can put a water softener in an apartment without touching the plumbing. Here are the real options and what hard water costs over two years.",
      },
      {
        property: "og:title",
        content: "Affordable Hard Water Softener for Apartments ($249)",
      },
      {
        property: "og:description",
        content:
          "You can put a water softener in an apartment without touching the plumbing. Here are the real options and what hard water costs over two years.",
      },
      {
        property: "og:url",
        content: "https://agsoftener.com/water-softener-for-apartment",
      },
      { property: "og:type", content: "article" },
      {
        property: "og:image",
        content: "https://agsoftener.com/assets/hero.png",
      },
      { property: "og:site_name", content: "AG Water Softener" },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://agsoftener.com/water-softener-for-apartment",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline:
            "Water softener for an apartment: what actually works",
          datePublished: "2026-07-28",
          dateModified: "2026-08-19",
          author: {
            "@type": "Organization",
            name: "AG Water Softener",
          },
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
              name: "Water softener for an apartment",
              item: "https://agsoftener.com/water-softener-for-apartment",
            },
          ],
        }),
      },
    ],
  }),
  component: WaterSoftenerForApartmentPage,
});

function WaterSoftenerForApartmentPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <article className="mx-auto max-w-[760px] px-5 py-12 md:px-8 md:py-16 lg:py-24">
        <h1 className="font-display text-3xl leading-[1.05] sm:text-4xl md:text-[46px]">
          Water softener for an apartment: what actually works
        </h1>
        <p className="text-sm text-muted-foreground">
          Updated Aug 19, 2026
        </p>

        <div className="mt-8 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            A water softener can work in an apartment. The whole-house version is
            off the table, so the fix happens at the shower instead. This page
            covers your unit; building-wide systems are a landlord purchase, and
            a different conversation.
          </p>
        </div>

        <img
          src="/assets/in-shower.png"
          alt="AG water softener for an apartment shower, mounted without plumbing changes"
          width={1254}
          height={1254}
          loading="lazy"
          className="mt-10 w-full max-w-[520px] h-auto"
        />

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          The three real options
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            <strong>A shower-arm softener.</strong> An ion-exchange unit that
            threads onto the arm behind your shower head. It takes no floor space
            and needs no plumbing changes, so there's nothing to ask a landlord
            about. This is what we make, the{" "}
            <a href="/" className="underline hover:opacity-70">
              AG Water Softener
            </a>
            , and two competitors make true softeners in the same class. The{" "}
            <a
              href="/softwatercare-vs-showerstick-vs-ag"
              className="underline hover:opacity-70"
            >
              three-way comparison
            </a>{" "}
            covers how they differ on recharge routines and terms.
          </p>
          <p>
            <strong>
              A{" "}
              <a
                href="/portable-water-softener-for-shower"
                className="underline hover:opacity-70"
              >
                portable RV softener
              </a>
              .
            </strong>{" "}
            These genuinely soften, and prices run from about $165 for compact
            units to about $280 for larger tanks. The tradeoff is bulk: a tank of
            about 30 pounds that lives on your shower floor and connects by hose.
            If you have a big shower and don't mind the tank, they work.
          </p>
          <p>
            <strong>Wait until you own.</strong> A whole-house system softens
            every tap and protects the water heater. It also runs several
            thousand dollars all-in and requires additional plumbing work, which
            is why it's perfect for homeowners. If you're renting short-term in a
            soft-water city, doing nothing is a legitimate answer too.
          </p>
          <p>
            What doesn't belong on this list: shower filters. That surprises a
            lot of people, so it gets its own section.
          </p>
        </div>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          If you already tried a filter
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            Plenty of renters buy a filtered shower head first. The reviews are
            good and the price is reasonable. It just{" "}
            <a
              href="/do-shower-filters-work-for-hard-water"
              className="underline hover:opacity-70"
            >
              doesn't work on hardness
            </a>
            , because it was never built to. Carbon and KDF media remove
            chlorine, and they do that job well. Calcium and magnesium pass
            straight through, which is why your water still leaves film on the
            glass and your hair still feels coated.
          </p>
          <p>
            The label rarely helps. Products sold as "water softener shower
            heads" are usually chlorine filters with an optimistic name. The test
            is the mechanism: if it doesn't contain ion-exchange resin and take
            salt, it can't soften.{" "}
            <a
              href="/shower-filter-vs-water-softener"
              className="underline hover:opacity-70"
            >
              Shower filter vs water softener
            </a>{" "}
            walks through the chemistry.
          </p>
          <p>
            None of this makes filters a scam. Chlorine removal is a real
            benefit, and the two devices solve different problems. It just means
            a filter can't be the answer to hard water, no matter what the
            listing says.{" "}
            <a
              href="/reddit-shower-water-softener"
              className="underline hover:opacity-70"
            >
              Reddit threads on shower water softeners
            </a>{" "}
            land on the same conclusion independently.
          </p>
        </div>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          Can I install a water softener in my apartment?
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            Yes. A shower-arm unit installs the way a shower head does: unthread
            the old one and thread the new one on. Nothing about it needs
            landlord permission, because nothing about it is permanent. Portable
            RV units need even less, just a hose connection. The only version
            that requires permission and a plumber is the whole-house system, and
            that's the one renters skip.
          </p>
        </div>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          How to tell if your apartment has hard water
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            The signs show up on their own. White scale builds on the shower
            glass and fixtures, and hair starts feeling coated a few days after
            every wash. Soap gives it away too, either refusing to lather or
            refusing to rinse clean. For a number, a hardness test strip costs a
            few bucks at any hardware store and reads in thirty seconds.
          </p>
          <p>
            Location is a guide, but a rough one. Las Vegas has a hard-water
            reputation and measures 291 ppm by its own utility's report. Madison,
            Wisconsin has no such reputation and measures harder, at 18 to 20
            grains per gallon by the city's numbers. Test rather than guess.
          </p>
        </div>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          What hard water costs over two years
        </h2>
        <div className="mt-6 text-[15px] leading-[1.7] text-foreground/90">
          <p className="mb-6">
            The purchase price is the smaller number. What separates the options
            is what they consume.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-border text-[14px] leading-[1.6]">
              <thead>
                <tr className="bg-surface">
                  <th className="border border-border px-4 py-3 text-left font-semibold" />
                  <th className="border border-border px-4 py-3 text-left font-semibold">
                    Day 1
                  </th>
                  <th className="border border-border px-4 py-3 text-left font-semibold">
                    Year 1 total
                  </th>
                  <th className="border border-border px-4 py-3 text-left font-semibold">
                    Year 2 total
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-border px-4 py-3 font-semibold">
                    AG Water Softener
                  </td>
                  <td className="border border-border px-4 py-3">$249</td>
                  <td className="border border-border px-4 py-3">$249</td>
                  <td className="border border-border px-4 py-3">$294</td>
                </tr>
                <tr className="bg-surface/50">
                  <td className="border border-border px-4 py-3 font-semibold">
                    Jolie (filter, for comparison)
                  </td>
                  <td className="border border-border px-4 py-3">$169</td>
                  <td className="border border-border px-4 py-3">$274</td>
                  <td className="border border-border px-4 py-3">$414</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-6 space-y-6">
            <p>
              The AG runs on one $45 replacement canister a year, and plain salt
              from the grocery store. Jolie's filter cartridges run $35 about
              every 90 days. And the two rows aren't doing the same job: the AG
              softens, while Jolie filters chlorine and leaves hardness in the
              water. The table exists because the filter route costs more over
              two years without touching the problem this page is about.
            </p>
            <p className="text-[13px] italic text-muted-foreground">
              Figures checked against retailer listings: Jolie pricing August 19,
              2026. If they change their prices, tell us and we'll update the
              table.
            </p>
          </div>
        </div>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          Frequently asked questions
        </h2>
        <div className="mt-6 space-y-8 text-[15px] leading-[1.7] text-foreground/90">
          {PAGE_FAQS.map((faq) => (
            <div key={faq.q}>
              <h3 className="text-[16px] font-semibold leading-[1.4]">
                {faq.q}
              </h3>
              <p className="mt-2">{faq.a}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          Sources
        </h2>
        <ul className="mt-6 space-y-2 text-[14px] leading-[1.7] text-foreground/90">
          <li>
            <a
              href="https://www.lvvwd.com/water-quality/facts/index.html"
              className="underline hover:opacity-70"
              rel="nofollow noopener"
              target="_blank"
            >
              Las Vegas Valley Water District FAQ
            </a>
            , hardness figures, accessed August 19, 2026
          </li>
          <li>
            <a
              href="https://www.cityofmadison.com/water/water-quality/faq"
              className="underline hover:opacity-70"
              rel="nofollow noopener"
              target="_blank"
            >
              City of Madison Water Utility FAQ
            </a>
            , hardness figures, accessed August 17, 2026
          </li>
          <li>
            <a
              href="https://www.portablewatersoftener.com/shop/water-softeners/portable-standard-water-softener"
              className="underline hover:opacity-70"
              rel="nofollow noopener"
              target="_blank"
            >
              On The Go Portable Water Softener
            </a>
            , pricing, accessed August 19, 2026
          </li>
          <li>
            <a
              href="https://proaquawater.com/products/portable-water-softener-pro-16-000-grain-premium-grade"
              className="underline hover:opacity-70"
              rel="nofollow noopener"
              target="_blank"
            >
              Pro+Aqua Portable Water Softener
            </a>
            , pricing, accessed August 19, 2026
          </li>
          <li>
            jolieskinco.com, pricing checked against retailer listings, August
            19, 2026
          </li>
        </ul>

        <div className="mt-16 border border-border bg-surface/40 p-8 md:p-10">
          <p className="text-[15px] leading-[1.7] text-foreground/90">
            <a href="/" className="underline hover:opacity-70">
              See the AG Water Softener
            </a>
            .
          </p>
        </div>
      </article>

      <SiteFooter />
    </div>
  );
}
