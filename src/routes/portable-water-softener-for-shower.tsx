import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

const PAGE_FAQS = [
  {
    q: "Can I take it between bathrooms or homes?",
    a: "Yes. It threads onto any standard 1/2-inch shower arm, which is nearly every US shower. Moving it is the same job as moving a showerhead.",
  },
  {
    q: "How is this different from a portable RV softener?",
    a: "Same chemistry, different body. The RV unit is a freestanding tank with hose fittings; AG mounts at the shower arm, and its salt recharge runs automatically from an included brine tank instead of a manual drain-and-refill routine.",
  },
  {
    q: "Does portable mean less effective?",
    a: "No. Softening is pass or fail chemistry: either resin exchanges the minerals or it doesn't. Size affects how often you recharge, not whether the water gets soft. The included strips let you verify the output yourself.",
  },
];

export const Route = createFileRoute("/portable-water-softener-for-shower")({
  head: () => ({
    meta: [
      { title: "Portable water softener for your shower: the real options" },
      {
        name: "description",
        content:
          "RV softeners work but weigh 30 pounds and sit on your floor. Here is what a portable water softener built for a shower looks like, and what it costs.",
      },
      { property: "og:title", content: "Portable water softener for your shower: the real options" },
      { property: "og:description", content: "RV softeners work but weigh 30 pounds and sit on your floor. Here is what a portable water softener built for a shower looks like, and what it costs." },
      { property: "og:url", content: "https://agsoftener.com/portable-water-softener-for-shower" },
      { property: "og:type", content: "article" },
      { property: "og:image", content: "https://agsoftener.com/assets/hero.png" },
      { property: "og:site_name", content: "AG Water Softener" },
    ],
    links: [
      { rel: "canonical", href: "https://agsoftener.com/portable-water-softener-for-shower" },
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
            { "@type": "ListItem", position: 2, name: "Portable water softener for your shower", item: "https://agsoftener.com/portable-water-softener-for-shower" },
          ],
        }),
      },
    ],
  }),
  component: PortableWaterSoftenerPage,
});

function PortableWaterSoftenerPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <article className="mx-auto max-w-[760px] px-5 py-12 md:px-8 md:py-16 lg:py-24">
        <h1 className="font-display text-3xl leading-[1.05] sm:text-4xl md:text-[46px]">
          Portable water softener for your shower: the real options
        </h1>

        <div className="mt-8 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            Search for a portable water softener and most of what you'll find was built for RVs: 30-pound tanks meant to sit beside a camper and treat the whole hookup. They soften water properly, and some determined apartment dwellers have rigged them into bathrooms with hose adapters and a tank parked on the shower floor.
          </p>
          <p>
            It works. It also looks like it sounds. If you want soft water without a plumber and without a tank next to your feet, here is how the options actually compare.
          </p>
        </div>

        <img
          src="/assets/quick-connect.png"
          alt="Portable water softener for shower installation on a standard shower arm"
          width={988}
          height={1060}
          loading="lazy"
          className="mt-10 w-full max-w-[520px] h-auto"
        />

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          What "portable" needs to mean for a shower
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>Three requirements, and most products fail at least one:</p>
          <p>
            The unit has to soften, which means ion-exchange resin and salt regeneration. Cartridge showerheads that claim softening skip this entirely; <a href="/shower-filter-vs-water-softener" className="underline hover:opacity-70">a filter is not a softener</a>.
          </p>
          <p>
            It has to install without touching the building's plumbing. Thread on at the shower arm, thread off when you leave.
          </p>
          <p>
            And it has to live in a bathroom without dominating it. This is where RV units lose, not on chemistry.
          </p>
        </div>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          The RV softener route
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            Units like the Pro+Aqua Travel Series are real softeners at a fair price, and if you already own one for a camper, adapting it to a shower with garden-hose fittings is a legitimate weekend project. The trade-offs are the ones you'd guess: a tank on the floor or in the tub, hoses crossing the bathroom, and a regeneration process built around outdoor use. As a permanent fixture in the place you shower every day, it wears thin.
          </p>
        </div>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          The shower-native route
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            <a href="/" className="underline hover:opacity-70">The AG Water Softener</a> puts the same resin chemistry in a housing designed for the shower arm. It hangs where the showerhead connects, installs in about ten minutes with no tools, and recharges automatically from its included brine tank: add plain non-iodized salt every few weeks and the cycle runs itself, with no hose-and-bucket routine.
          </p>
          <p>
            Because it threads on like a showerhead, it comes with you when you move: unscrew it, put the original hardware back, done. It ships with test strips so the before and after is a number you read, not a feeling you talk yourself into. $249 with a 60-day money-back guarantee.
          </p>
          <p>
            The trade-off in the other direction: an RV tank holds more resin, so it goes longer between recharges. AG trades some capacity for actually belonging in a bathroom. For one or two people showering daily, the recharge cadence is a routine, not a chore.
          </p>
        </div>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          Before you buy anything
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            Confirm hardness is your problem. <a href="https://www.myapartmentwaterquality.com/" className="underline hover:opacity-70">Check your water free</a> with our lookup tool or run a test strip; above about 120 ppm you'll feel the difference a softener makes. If your water reads soft, no softener, portable or otherwise, will change anything you notice.
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
