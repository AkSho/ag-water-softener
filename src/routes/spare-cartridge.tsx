import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

const PAGE_FAQS = [
  {
    q: "Why is it $64 here and $39 in the cart?",
    a: "$39 is the price when it ships in the same box as your softener.",
  },
  {
    q: "Is this the same as the Spares Kit?",
    a: "No. The kit is the mounting and recharge hardware around the cartridge. This is the cartridge itself.",
  },
  {
    q: "How do I recharge the spare?",
    a: "The same way as the one in the unit, with the brine tank and plain non-iodized salt, about 30 minutes. The recharge video at agsoftener.com/setup shows it.",
  },
];

export const Route = createFileRoute("/spare-cartridge")({
  head: () => ({
    meta: [
      { title: "Spare Cartridge | AG Water Softener" },
      {
        name: "description",
        content:
          "A second resin cartridge for the AG Water Softener, $64 shipped, 5 to 8 days. Swap it in while the other recharges.",
      },
      { property: "og:title", content: "Spare Cartridge | AG Water Softener" },
      {
        property: "og:description",
        content:
          "A second resin cartridge for the AG Water Softener, $64 shipped, 5 to 8 days. Swap it in while the other recharges.",
      },
      { property: "og:url", content: "https://agsoftener.com/spare-cartridge" },
      { property: "og:type", content: "product" },
      { property: "og:image", content: "https://agsoftener.com/assets/hero.png" },
      { property: "og:site_name", content: "AG Water Softener" },
    ],
    links: [
      { rel: "canonical", href: "https://agsoftener.com/spare-cartridge" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          name: "AG Spare Cartridge",
          brand: { "@id": "https://agsoftener.com/#organization" },
          mpn: "AG-SC-001",
          url: "https://agsoftener.com/spare-cartridge",
          description:
            "A second resin cartridge for the AG Water Softener, $64 shipped, 5 to 8 days. Swap it in while the other recharges.",
          image: "https://agsoftener.com/assets/hero.png",
          offers: {
            "@type": "Offer",
            url: "https://agsoftener.com/spare-cartridge",
            price: "64.00",
            priceCurrency: "USD",
            availability: "https://schema.org/InStock",
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
              name: "Spare Cartridge",
              item: "https://agsoftener.com/spare-cartridge",
            },
          ],
        }),
      },
    ],
  }),
  component: SpareCartridgePage,
});

function SpareCartridgePage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <article className="mx-auto max-w-[760px] px-5 py-12 md:px-8 md:py-16 lg:py-24">
        <img
          src="/assets/hero.png"
          alt="The AG Water Softener spare cartridge"
          width={760}
          height={760}
          className="w-full rounded-lg"
        />
        <p className="mt-3 text-center text-xs text-foreground/50">
          The cartridge, shown without the brine tank and hoses.
        </p>

        <h1 className="mt-10 font-display text-3xl leading-[1.05] sm:text-4xl md:text-[46px]">
          Spare cartridge
        </h1>

        <div className="mt-4">
          <span className="text-2xl font-semibold">$64</span>
          <p className="mt-1 text-sm text-foreground/70">
            shipped · typically arrives in 5 to 8 days
          </p>
        </div>

        <div className="mt-10 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            A second resin cartridge for the AG Water Softener. Keep one in the unit and one on the shelf. When it's time to recharge, swap them. The shower stays soft while the other one recharges.
          </p>
          <p>
            <strong>What's in the box:</strong> one softener filter cartridge, the same part that comes with every unit.
          </p>
          <p>
            <strong>You don't need this on day one.</strong> Every AG Water Softener comes with a cartridge. This is the spare.
          </p>
        </div>

        <a
          href="https://buy.stripe.com/5kQ9ASgxgcLHcRK27G1sQ0J"
          className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-sage px-8 py-4 text-base font-semibold text-white transition-opacity hover:opacity-90"
        >
          Add the spare cartridge · $64
        </a>

        <div className="mt-14 border-t border-border/60 pt-10">
          <h2 className="font-display text-2xl leading-[1.1] sm:text-3xl">
            Questions people ask
          </h2>
          <div className="mt-6 space-y-8 text-[15px] leading-[1.7] text-foreground/90">
            {PAGE_FAQS.map((f) => (
              <div key={f.q}>
                <h3 className="font-semibold text-foreground">{f.q}</h3>
                <p className="mt-2">
                  {f.q === "How do I recharge the spare?"
                    ? <>The same way as the one in the unit, with the brine tank and plain non-iodized salt, about 30 minutes. The recharge video at <a href="/setup" className="underline hover:opacity-70">agsoftener.com/setup</a> shows it.</>
                    : f.a}
                </p>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-10 text-sm text-foreground/70">
          If you have any other questions, reach out to us: support@agsoftener.com.
        </p>

        <div className="mt-14 border-t border-border/60 pt-10">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Related
          </div>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <a href="/" className="underline hover:opacity-70">
                AG Water Softener
              </a>
            </li>
            <li>
              <a href="/spares-kit" className="underline hover:opacity-70">
                AG Spares Kit
              </a>
            </li>
          </ul>
        </div>
      </article>

      <SiteFooter />
    </div>
  );
}
