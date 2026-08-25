import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

const PAGE_FAQS = [
  {
    q: "Does the Spares Kit include the recharge pump?",
    a: "Yes. The pump is built into the regeneration attachment. Replacing the attachment replaces the pump.",
  },
  {
    q: "Is this the same as the spare cartridge?",
    a: "No. The cartridge is the filter inside the canister, sold separately. This kit is the mounting and recharge hardware around it.",
  },
];

export const Route = createFileRoute("/spares-kit")({
  head: () => ({
    meta: [
      { title: "AG Spares Kit for the AG Water Softener" },
      {
        name: "description",
        content:
          "The three replaceable mounting and recharge parts for the AG Water Softener, sold as one kit for $45.",
      },
      { property: "og:title", content: "AG Spares Kit for the AG Water Softener" },
      {
        property: "og:description",
        content:
          "The three replaceable mounting and recharge parts for the AG Water Softener, sold as one kit for $45.",
      },
      { property: "og:url", content: "https://agsoftener.com/spares-kit" },
      { property: "og:type", content: "product" },
      { property: "og:image", content: "https://agsoftener.com/assets/spares_kit_image.png" },
      { property: "og:site_name", content: "AG Water Softener" },
    ],
    links: [
      { rel: "canonical", href: "https://agsoftener.com/spares-kit" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          name: "AG Spares Kit",
          brand: { "@type": "Brand", name: "GRN Labs" },
          mpn: "AG-SK-001",
          url: "https://agsoftener.com/spares-kit",
          description:
            "The three replaceable mounting and recharge parts for the AG Water Softener, sold as one kit for $45.",
          image: "https://agsoftener.com/assets/spares_kit_image.png",
          offers: {
            "@type": "Offer",
            url: "https://agsoftener.com/spares-kit",
            price: "45.00",
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
              name: "Spares Kit",
              item: "https://agsoftener.com/spares-kit",
            },
          ],
        }),
      },
    ],
  }),
  component: SparesKitPage,
});

function SparesKitPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <article className="mx-auto max-w-[760px] px-5 py-12 md:px-8 md:py-16 lg:py-24">
        <img
          src="/assets/spares_kit_image.png"
          alt="The three parts of the AG Spares Kit arranged on a studio backdrop"
          width={760}
          height={760}
          className="w-full rounded-lg"
        />

        <h1 className="mt-10 font-display text-3xl leading-[1.05] sm:text-4xl md:text-[46px]">
          AG Spares Kit
        </h1>

        <div className="mt-4">
          <span className="text-2xl font-semibold">$45</span>
          <p className="mt-1 text-sm text-foreground/70">
            Ships separately from the unit, in 8 to 15 days.
          </p>
        </div>

        <a
          href="https://buy.stripe.com/fZu3cubcWh1XcRK9A81sQ0I"
          className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-sage px-8 py-4 text-base font-semibold text-white transition-opacity hover:opacity-90"
        >
          Add the Spares Kit · $45
        </a>

        <div className="mt-10 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            This kit contains the three replaceable parts that mount your AG Water Softener and run
            its recharge. It fits every AG Water Softener. If a part breaks or goes missing in a
            move, this is the kit that makes the unit whole again.
          </p>
        </div>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          What's in the kit
        </h2>
        <ul className="mt-6 space-y-4 text-[15px] leading-[1.7] text-foreground/90">
          <li>
            <strong>Mount adapter.</strong> The bracket that holds the canister to the wall and
            connects the water lines.
          </li>
          <li>
            <strong>Adhesive mount.</strong> The no-drill mounting plate for renters who can't put
            holes in tile.
          </li>
          <li>
            <strong>Regeneration attachment.</strong> The tube set that runs the recharge cycle, with
            the recharge pump built in. If your pump ever fails, this is the replacement part.
          </li>
        </ul>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          Do you need this kit?
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            Not on day one. Every AG Water Softener ships with these parts. The kit exists for two
            situations: a part breaks or wears out later, or you want a spare set on the shelf so a
            cracked fitting never means a week without soft water.
          </p>
        </div>

        <div className="mt-14 border-t border-border/60 pt-10">
          <h2 className="font-display text-2xl leading-[1.1] sm:text-3xl">FAQ</h2>
          <div className="mt-6 space-y-8 text-[15px] leading-[1.7] text-foreground/90">
            {PAGE_FAQS.map((f) => (
              <div key={f.q}>
                <h3 className="font-semibold text-foreground">{f.q}</h3>
                <p className="mt-2">{f.a}</p>
              </div>
            ))}
          </div>
        </div>

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
          </ul>
        </div>
      </article>

      <SiteFooter />
    </div>
  );
}
