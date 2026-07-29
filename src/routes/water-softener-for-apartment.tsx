import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

const PAGE_FAQS = [
  {
    q: "Will this violate my lease?",
    a: "A shower-arm unit is in the same category as swapping a showerhead: it threads on, it threads off, and the original hardware goes back when you move out. No walls are opened and no building plumbing is modified. Check your lease if you're unsure, but there is nothing permanent involved.",
  },
  {
    q: "Does it work in a condo I own?",
    a: "Yes, and it's often the only route, since HOAs control the building supply lines even when you own the unit. Nothing outside your bathroom is touched.",
  },
  {
    q: "What's the ongoing cost?",
    a: "Plain non-iodized salt, sold in any grocery store, used to recharge the resin. No cartridge subscription.",
  },
];

export const Route = createFileRoute("/water-softener-for-apartment")({
  head: () => ({
    meta: [
      { title: "Water softener for an apartment: what actually works" },
      {
        name: "description",
        content:
          "You can't install a whole-house softener in an apartment or condo. A shower-mounted ion-exchange softener is the option that actually softens water.",
      },
      { property: "og:title", content: "Water softener for an apartment: what actually works" },
      { property: "og:description", content: "You can't install a whole-house softener in an apartment or condo. A shower-mounted ion-exchange softener is the option that actually softens water." },
      { property: "og:url", content: "https://agsoftener.com/water-softener-for-apartment" },
      { property: "og:type", content: "article" },
      { property: "og:image", content: "https://agsoftener.com/assets/hero.png" },
      { property: "og:site_name", content: "AG Water Softener" },
    ],
    links: [
      { rel: "canonical", href: "https://agsoftener.com/water-softener-for-apartment" },
    ],
    scripts: [
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
            { "@type": "ListItem", position: 2, name: "Water softener for an apartment", item: "https://agsoftener.com/water-softener-for-apartment" },
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

        <div className="mt-8 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            For years, the honest answer to hard water in an apartment was "you can't fix it." Whole-house softeners need a plumber, a drain line, and the landlord's or HOA's blessing to cut into the building supply. So renters and condo owners got told to rinse with vinegar and live with it.
          </p>
          <p>
            That advice is out of date. Ion exchange, the chemistry inside a whole-house system, now comes in a unit small enough to hang in your shower. Here is what your real options look like, ranked by what they actually accomplish.
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
          Option 1: a shower water softener
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            This is the direct fix. A shower-mounted softener holds a bed of ion-exchange resin, the same material inside a $2,000 whole-house tank, sized for one bathroom. Water passes through on its way to the showerhead, the resin swaps out calcium and magnesium, and the water arriving at your hair is soft. When the resin fills up, an automatic salt recharge from the included brine tank resets it.
          </p>
          <p>
            <a href="/" className="underline hover:opacity-70">The AG Water Softener</a> is our version: it mounts on the shower arm in about ten minutes, needs no tools and no plumbing changes, and touches nothing the building owns. It ships with test strips, so you can measure your water before and after instead of trusting the box. $249, 60-day money-back guarantee.
          </p>
          <p>
            The honest limitation: it softens one shower, not your dishwasher or laundry. For most people in apartments, the shower is where hard water hurts, because that is where it meets your hair and skin.
          </p>
        </div>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          Option 2: a shower filter
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            Cheaper, and useful for a different problem. Filters remove chlorine, which helps if your city's water is soft but heavily treated. They do not remove calcium or magnesium, so if your issue is crusty fixtures, coated hair, or soap that won't lather, a filter will disappoint you. <a href="/shower-filter-vs-water-softener" className="underline hover:opacity-70">Filters and softeners do different jobs</a>, and buying the wrong one is the most common mistake in this category.
          </p>
        </div>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          Option 3: under-sink or countertop units
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            These soften or filter drinking water at one tap. Fine for what they do, but they don't reach the shower, and the shower is usually the complaint.
          </p>
        </div>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          Option 4: ask the landlord or HOA for a building system
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            Worth one email if hard water is damaging appliances building-wide, since that costs the owner money too. In practice this rarely goes anywhere, and even a yes takes months. Treat it as a bonus, not a plan.
          </p>
        </div>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          First: confirm you actually have hard water
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            Before buying anything, <a href="https://www.myapartmentwaterquality.com/" className="underline hover:opacity-70">check your building's water free</a> with our lookup tool, or spend $10 on test strips. Above about 120 ppm (7 gpg) you're in hard territory; many US cities run 200 to 300. If your reading comes back soft, skip the softener entirely and consider whether chlorine is your real complaint.
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
            <a href="https://www.myapartmentwaterquality.com/" className="underline hover:opacity-70">Check your building's water hardness free</a>, or <a href="/" className="underline hover:opacity-70">see the AG Water Softener</a>.
          </p>
        </div>
      </article>

      <SiteFooter />
    </div>
  );
}
