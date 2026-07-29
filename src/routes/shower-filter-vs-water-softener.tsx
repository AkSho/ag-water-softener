import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

const PAGE_FAQS = [
  {
    q: "Can one device filter and soften?",
    a: "A few combo units exist. Be careful with the small ones: a cartridge that claims 15 stages in a 4-inch housing has almost no resin volume, so any softening effect is gone within days. Real softening needs a real resin bed.",
  },
  {
    q: 'Do "water softener showerheads" on Amazon work?',
    a: "The $18 ones are filters with the word \"softener\" on the listing. Check the media list. If you see KDF, carbon, or vitamin C and no mention of ion-exchange resin and salt regeneration, it cannot soften water.",
  },
  {
    q: "Is softened water safe for hair and skin?",
    a: "Yes. The sodium added is small, far less than in a slice of bread, and softened water is why soap lathers properly and rinses clean.",
  },
  {
    q: "How do I know it's working?",
    a: "Test strips. Hard water reads 120 ppm and up; after a working softener the same strip reads near zero. That is a pass or fail result you can see in thirty seconds.",
  },
];

export const Route = createFileRoute("/shower-filter-vs-water-softener")({
  head: () => ({
    meta: [
      { title: "Shower filter vs water softener: which one fixes your water" },
      {
        name: "description",
        content:
          "Shower filters remove chlorine. Water softeners remove calcium and magnesium. Here is how to tell which problem you have and which device fixes it.",
      },
      { property: "og:title", content: "Shower filter vs water softener: which one fixes your water" },
      { property: "og:description", content: "Shower filters remove chlorine. Water softeners remove calcium and magnesium. Here is how to tell which problem you have and which device fixes it." },
      { property: "og:url", content: "https://agsoftener.com/shower-filter-vs-water-softener" },
      { property: "og:type", content: "article" },
      { property: "og:image", content: "https://agsoftener.com/assets/hero.png" },
      { property: "og:site_name", content: "AG Water Softener" },
    ],
    links: [
      { rel: "canonical", href: "https://agsoftener.com/shower-filter-vs-water-softener" },
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
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: "https://agsoftener.com/",
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Shower filter vs water softener",
              item: "https://agsoftener.com/shower-filter-vs-water-softener",
            },
          ],
        }),
      },
    ],
  }),
  component: ShowerFilterVsSoftenerPage,
});

function ShowerFilterVsSoftenerPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <article className="mx-auto max-w-[760px] px-5 py-12 md:px-8 md:py-16 lg:py-24">
        <h1 className="font-display text-3xl leading-[1.05] sm:text-4xl md:text-[46px]">
          Shower filter vs water softener: which one fixes your water
        </h1>

        <div className="mt-8 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            People compare shower filters and water softeners because both screw onto a shower and both promise better hair and skin. They are not the same device. A filter removes chemicals. A softener removes minerals. If you buy the wrong one, your water problem stays exactly where it was, and you'll blame the product instead of the mismatch.
          </p>
          <p>Here is the fastest way to sort it out.</p>
        </div>

        <img
          src="/assets/test-strips.png"
          alt="Test strip comparing shower water before and after a shower filter vs water softener"
          width={1024}
          height={1535}
          loading="lazy"
          className="mt-10 w-full max-w-[520px] h-auto"
        />

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          What a shower filter actually does
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            A shower filter runs your water through media like KDF-55, activated carbon, calcium sulfite, or vitamin C. These are good at neutralizing chlorine and chloramine, and they catch some sediment and metals along the way.
          </p>
          <p>
            That matters. Chlorine strips oil from hair and skin, and many people notice less dryness within a couple of weeks of installing a decent filter. Brands like Jolie and Canopy have built real businesses on this, and for chlorine, the products work.
          </p>
          <p>
            What no filter does is soften water. Calcium and magnesium are dissolved ions, not particles. They are thousands of times smaller than the pores in carbon or KDF media, so at two gallons per minute they flow straight through. Filter brands know this. Some say it plainly, and some bury it, but the chemistry is the same for all of them.
          </p>
        </div>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          What a water softener actually does
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            A softener uses ion exchange: water passes through a bed of resin beads that swap calcium and magnesium ions for sodium ions. This is the same process inside a $2,000 whole-house system, and it is the only consumer chemistry that removes hardness. When the resin fills up, an automatic salt recharge resets it.
          </p>
          <p>
            A softener does little for chlorine. That is the filter's job. The two devices are answers to two different questions.
          </p>
        </div>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          Which problem do you have?
        </h2>
        <div className="mt-6 text-[15px] leading-[1.7] text-foreground/90">
          <p className="mb-6">Match your symptoms:</p>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-border text-[14px] leading-[1.6]">
              <thead>
                <tr className="bg-surface">
                  <th className="border border-border px-4 py-3 text-left font-semibold">Your symptom</th>
                  <th className="border border-border px-4 py-3 text-left font-semibold">The culprit</th>
                  <th className="border border-border px-4 py-3 text-left font-semibold">What fixes it</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-border px-4 py-3">Pool smell, faded hair color, dry skin in a soft-water city</td>
                  <td className="border border-border px-4 py-3">Chlorine</td>
                  <td className="border border-border px-4 py-3">Shower filter</td>
                </tr>
                <tr className="bg-surface/50">
                  <td className="border border-border px-4 py-3">White crust on the showerhead, film on glass, soap that won't lather</td>
                  <td className="border border-border px-4 py-3">Hardness</td>
                  <td className="border border-border px-4 py-3">Water softener</td>
                </tr>
                <tr>
                  <td className="border border-border px-4 py-3">Hair that feels coated, dull, and heavy no matter the shampoo</td>
                  <td className="border border-border px-4 py-3">Hardness</td>
                  <td className="border border-border px-4 py-3">Water softener</td>
                </tr>
                <tr className="bg-surface/50">
                  <td className="border border-border px-4 py-3">Straw hair AND chemical smell</td>
                  <td className="border border-border px-4 py-3">Both</td>
                  <td className="border border-border px-4 py-3">Softener first, filter second</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-6 space-y-6">
            <p>
              Still unsure? Two checks settle it. Look up your local water hardness with <a href="https://www.myapartmentwaterquality.com/" className="underline hover:opacity-70">our free report tool</a>, or run a $10 test strip on your shower water. Above roughly 120 ppm (7 gpg), hardness is doing real damage, and a filter will not touch it.
            </p>
          </div>
        </div>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          The apartment and condo problem
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            Whole-house softeners fix hardness, but they need a plumber, a drain line, and permission to cut into the building's supply. If you rent, own a condo, or just don't want a $2,000 install, that door is closed.
          </p>
          <p>
            This is the gap <a href="/" className="underline hover:opacity-70">a shower water softener</a> fills. The AG Water Softener is a full ion-exchange unit sized for one shower. It installs on the shower arm in about ten minutes with no tools, recharges with ordinary salt, and comes with test strips so you can measure the before and after yourself instead of taking our word for it. It costs $249 and carries a 60-day money-back guarantee.
          </p>
          <p>
            We'll be direct about the trade: AG does not remove chlorine. If your water is both hard and heavily chlorinated, soften first, because hardness causes the buildup, then add a basic filter if the chlorine still bothers you.
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
            <a href="https://www.myapartmentwaterquality.com/" className="underline hover:opacity-70">Check your water hardness free</a> at MyApartmentWaterQuality.com, or <a href="/" className="underline hover:opacity-70">see the AG Water Softener</a>.
          </p>
        </div>
      </article>

      <SiteFooter />
    </div>
  );
}
