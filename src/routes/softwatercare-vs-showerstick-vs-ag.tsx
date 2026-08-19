import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

const PAGE_FAQS = [
  {
    q: "How often does each one need a recharge?",
    a: "The ShowerStick needs a recharge about once a week, though each one takes only about 5 minutes. SoftWaterCare runs about a month for one person and the AG runs 3 to 5 weeks, so those two are close on frequency. The processes differ more than the schedules: SoftWaterCare\u2019s spans a couple of days including salt prep, and the AG\u2019s takes about 30 minutes.",
  },
  {
    q: "Is SoftWaterCare a shower filter?",
    a: "No, and their own site says so plainly. It\u2019s an ion-exchange softener paired with an ACF chlorine filter. Standard shower filters remove chlorine but can\u2019t remove the calcium and magnesium that make water hard. All three products on this page are true softeners, which is exactly why these three end up compared against each other.",
  },
  {
    q: "Which one should a renter pick?",
    a: "All three install without plumbing changes, so none requires landlord permission. Pick the ShowerStick if a 5-minute weekly chore suits you better than a longer monthly one, and a handheld head is fine. SoftWaterCare makes sense if you want filter and softener in one box and don\u2019t mind the recharge project. The AG is for people who want the shortest recharge and the longest guarantee, and who are fine adding a cheap filter for chlorine. We make the AG, so weigh this paragraph accordingly.",
  },
];

export const Route = createFileRoute("/softwatercare-vs-showerstick-vs-ag")({
  head: () => ({
    meta: [
      {
        title:
          "SoftWaterCare vs ShowerStick vs AG: three shower softeners compared",
      },
      {
        name: "description",
        content:
          "SoftWaterCare, the ShowerStick, and the AG Water Softener all use ion-exchange resin. Here is how they compare on recharge routine, form factor, warranty, and price.",
      },
      {
        property: "og:title",
        content:
          "SoftWaterCare vs ShowerStick vs AG: three shower softeners compared",
      },
      {
        property: "og:description",
        content:
          "SoftWaterCare, the ShowerStick, and the AG Water Softener all use ion-exchange resin. Here is how they compare on recharge routine, form factor, warranty, and price.",
      },
      {
        property: "og:url",
        content: "https://agsoftener.com/softwatercare-vs-showerstick-vs-ag",
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
        href: "https://agsoftener.com/softwatercare-vs-showerstick-vs-ag",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline:
            "SoftWaterCare vs ShowerStick vs AG: three shower softeners compared",
          datePublished: "2026-08-18",
          dateModified: "2026-08-18",
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
              name: "SoftWaterCare vs ShowerStick vs AG",
              item: "https://agsoftener.com/softwatercare-vs-showerstick-vs-ag",
            },
          ],
        }),
      },
    ],
  }),
  component: SoftwatercareVsShowerstickVsAgPage,
});

function SoftwatercareVsShowerstickVsAgPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <article className="mx-auto max-w-[760px] px-5 py-12 md:px-8 md:py-16 lg:py-24">
        <h1 className="font-display text-3xl leading-[1.05] sm:text-4xl md:text-[46px]">
          SoftWaterCare vs ShowerStick vs AG: three shower softeners compared
        </h1>
        <p className="text-sm text-muted-foreground">
          Updated Aug 18, 2026
        </p>
        <p className="mt-3 text-[13px] italic text-muted-foreground">
          Checked against live product pages on August 18, 2026. If anything
          below has changed, tell us and we will correct it.
        </p>

        {/* Three-panel hero */}
        <div
          className="mt-10 grid gap-0 overflow-hidden border border-border sm:grid-cols-3"
          role="img"
          aria-label="Three shower water softeners compared: SoftWaterCare, ShowerStick, and the AG Water Softener"
        >
          {/* SoftWaterCare panel */}
          <div className="flex flex-col items-center justify-center bg-surface/40 p-6 sm:p-8">
            <p className="text-center font-display text-lg leading-tight sm:text-xl">
              SoftWaterCare
            </p>
            <div className="mt-4 space-y-1 text-center text-[14px] text-foreground/80">
              <p>$238</p>
              <p>Monthly recharge (multi-day process)</p>
              <p>30-day money-back</p>
            </div>
          </div>

          {/* ShowerStick panel */}
          <div className="flex flex-col items-center justify-center border-y border-border bg-surface/40 p-6 sm:border-x sm:border-y-0 sm:p-8">
            <p className="text-center font-display text-lg leading-tight sm:text-xl">
              ShowerStick
            </p>
            <div className="mt-4 space-y-1 text-center text-[14px] text-foreground/80">
              <p>$260</p>
              <p>Weekly recharge (~5 min)</p>
              <p>14-day returns</p>
            </div>
          </div>

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
            <p className="mt-4 text-center font-display text-lg leading-tight sm:text-xl">
              AG Water Softener
            </p>
            <div className="mt-4 space-y-1 text-center text-[14px] text-foreground/80">
              <p>$249</p>
              <p>Automatic recharge (~30 min)</p>
              <p>60-day money-back</p>
            </div>
          </div>
        </div>
        <p className="mt-4 text-center text-[14px] text-muted-foreground">
          Same chemistry. The differences are in the recharge and the terms.
        </p>

        {/* Intro */}
        <div className="mt-8 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            SoftWaterCare, the ShowerStick, and the AG Water Softener are the
            three shower softeners a renter will actually find in stock. All
            three use ion-exchange resin to soften shower water. That puts them
            in the same small category of products that actually remove hardness
            minerals, as opposed to the{" "}
            <a
              href="/shower-filter-vs-water-softener"
              className="underline hover:opacity-70"
            >
              shower filters sold as softeners
            </a>{" "}
            that cannot. The mechanism works the same way in each one: resin
            trades sodium ions for calcium and magnesium, and salt recharges the
            resin when it is spent. What separates them is everything around that
            chemistry.
          </p>
        </div>

        {/* Recharge section */}
        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          The recharge difference
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            All three softeners exhaust their resin over time and need a salt
            recharge. How that recharge works is the biggest practical difference
            between them.
          </p>
          <p>
            <strong>SoftWaterCare.</strong> Their system holds more resin, so it
            goes longer between recharges, but each one is a project. You
            prepare a salt solution one to two days ahead (2 lbs of softener
            pellets in 1.3 gallons of water), then connect the recharge hoses,
            run a pump for 4 to 5 hours, let the unit rest overnight, and flush
            for 3 minutes. The pump runs off a portable power bank. Total
            elapsed time from salt prep to finished flush spans about two days.
            Their instructions are clear and the process works.
          </p>
          <p>
            <strong>
              <a
                href="/showerstick-alternative"
                className="underline hover:opacity-70"
              >
                ShowerStick
              </a>
            </strong>
            . Theirs is the lightest procedure of the three: pour a salt solution
            through the port, flush for 15 to 30 seconds, and you're done in
            about 5 minutes. The trade is frequency. Their site puts
            regeneration at about once a week, so the small chore comes around
            four times as often as the other two.
          </p>
          <p>
            <strong>AG.</strong> About 30 minutes, no pump, no power bank, no
            advance salt prep. Add plain non-iodized salt to the included brine
            tank, and the recharge cycle runs itself. Typical interval is every 3
            to 5 weeks.
          </p>
        </div>

        {/* Frequency */}
        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          How often
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            SoftWaterCare's larger canister holds more resin, and their own FAQ
            puts a recharge at about 30 days for one person showering 10 minutes
            a day in hard water. The AG runs 3 to 5 weeks on the same kind of
            use. Add a second person and both shorten. The ShowerStick sits apart
            at about once a week, and each product is making a different trade.
            The ShowerStick keeps each recharge tiny and asks for it often.
            SoftWaterCare and the AG both ask rarely, and differ in what the ask
            costs you.
          </p>
        </div>

        {/* Form factor */}
        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          Form factor
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            The SoftWaterCare unit sits on the shower floor or outside the tub,
            and it only works with a handheld shower head. Theirs costs $36
            extra, or you can use one you already own. If you want your existing
            fixed shower head unchanged, the AG threads onto the shower arm above
            it. The ShowerStick hangs on the shower pipe with a clamp and also
            pairs with a handheld head.
          </p>
        </div>

        {/* Filtration */}
        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          Chlorine filtration
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            The ShowerStick sells a KDF chlorine filter as a separate add-on,
            and the AG softens only; pair it with an inline carbon filter if you
            also want chlorine removed. SoftWaterCare is the only one of the
            three that includes chlorine filtration, with an ACF filter layer
            alongside the softening resin at the $238 price. Their warranty runs
            2 years against 12 months on the AG and the ShowerStick, which is
            worth knowing even though their money-back window is the shortest of
            the three at 30 days.
          </p>
          <p>
            If you want chlorine filtration with the AG, any standard $25 shower
            filter handles it, which puts the pair at about $274 against
            SoftWaterCare's $238. That's $36 more for a 30-minute recharge
            instead of a multi-day one, and a 60-day money-back window instead
            of a 30-day one. If you don't already own a handheld shower head, the
            gap closes to zero, since their setup needs one and theirs costs $36.
            Whether the trade is worth it is your call.
          </p>
        </div>

        {/* Table */}
        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          Side by side
        </h2>
        <div className="mt-6 text-[15px] leading-[1.7] text-foreground/90">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-border text-[14px] leading-[1.6]">
              <thead>
                <tr className="bg-surface">
                  <th className="border border-border px-4 py-3 text-left font-semibold" />
                  <th className="border border-border px-4 py-3 text-left font-semibold">
                    SoftWaterCare
                  </th>
                  <th className="border border-border px-4 py-3 text-left font-semibold">
                    ShowerStick
                  </th>
                  <th className="border border-border px-4 py-3 text-left font-semibold">
                    AG Water Softener
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-border px-4 py-3 font-semibold">
                    Chemistry
                  </td>
                  <td className="border border-border px-4 py-3">
                    Ion-exchange resin + ACF filter
                  </td>
                  <td className="border border-border px-4 py-3">
                    Ion-exchange resin
                  </td>
                  <td className="border border-border px-4 py-3">
                    Ion-exchange resin
                  </td>
                </tr>
                <tr className="bg-surface/50">
                  <td className="border border-border px-4 py-3 font-semibold">
                    Where it lives in your shower
                  </td>
                  <td className="border border-border px-4 py-3">
                    On the shower floor or outside the tub; needs a handheld
                    head, theirs is a $36 add-on or use your own
                  </td>
                  <td className="border border-border px-4 py-3">
                    Hangs on the shower pipe with a clamp, used with a handheld
                    head
                  </td>
                  <td className="border border-border px-4 py-3">
                    In line at the shower arm, works with your existing
                    showerhead
                  </td>
                </tr>
                <tr>
                  <td className="border border-border px-4 py-3 font-semibold">
                    Recharge frequency
                  </td>
                  <td className="border border-border px-4 py-3">
                    About once a month
                  </td>
                  <td className="border border-border px-4 py-3">
                    About once a week
                  </td>
                  <td className="border border-border px-4 py-3">
                    Every 3 to 5 weeks
                  </td>
                </tr>
                <tr className="bg-surface/50">
                  <td className="border border-border px-4 py-3 font-semibold">
                    What a recharge takes
                  </td>
                  <td className="border border-border px-4 py-3">
                    Prep salt solution 1–2 days ahead, pump circulation 4–5
                    hours, rest overnight, flush 3 min
                  </td>
                  <td className="border border-border px-4 py-3">
                    About 5 minutes: pour salt water through the port and flush
                  </td>
                  <td className="border border-border px-4 py-3">
                    About 30 minutes, automatic from included brine tank
                  </td>
                </tr>
                <tr>
                  <td className="border border-border px-4 py-3 font-semibold">
                    Salt type
                  </td>
                  <td className="border border-border px-4 py-3">
                    Water softener pellets or crystals only
                  </td>
                  <td className="border border-border px-4 py-3">
                    Plain table salt
                  </td>
                  <td className="border border-border px-4 py-3">
                    Plain non-iodized salt
                  </td>
                </tr>
                <tr className="bg-surface/50">
                  <td className="border border-border px-4 py-3 font-semibold">
                    Chlorine filtration
                  </td>
                  <td className="border border-border px-4 py-3">
                    Built-in ACF filter
                  </td>
                  <td className="border border-border px-4 py-3">
                    Sold as a separate add-on
                  </td>
                  <td className="border border-border px-4 py-3">
                    Not included
                  </td>
                </tr>
                <tr>
                  <td className="border border-border px-4 py-3 font-semibold">
                    Price
                  </td>
                  <td className="border border-border px-4 py-3">$238</td>
                  <td className="border border-border px-4 py-3">
                    $260{" "}
                    <span className="text-[12px] text-muted-foreground">
                      (on sale from $299, checked Aug 18, 2026)
                    </span>
                  </td>
                  <td className="border border-border px-4 py-3">$249</td>
                </tr>
                <tr className="bg-surface/50">
                  <td className="border border-border px-4 py-3 font-semibold">
                    Returns
                  </td>
                  <td className="border border-border px-4 py-3">
                    30-day money-back
                  </td>
                  <td className="border border-border px-4 py-3">
                    14-day returns
                  </td>
                  <td className="border border-border px-4 py-3">
                    60-day money-back
                  </td>
                </tr>
                <tr>
                  <td className="border border-border px-4 py-3 font-semibold">
                    Warranty
                  </td>
                  <td className="border border-border px-4 py-3">2 years</td>
                  <td className="border border-border px-4 py-3">12 months</td>
                  <td className="border border-border px-4 py-3">12 months</td>
                </tr>
                <tr className="bg-surface/50">
                  <td className="border border-border px-4 py-3 font-semibold">
                    Availability
                  </td>
                  <td className="border border-border px-4 py-3">
                    Available to order
                  </td>
                  <td className="border border-border px-4 py-3">In stock</td>
                  <td className="border border-border px-4 py-3">
                    In stock, free shipping, 12 to 18 days
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* How to choose */}
        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          How to choose
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            Start with what you care about most. SoftWaterCare covers built-in
            chlorine filtration and the lowest sticker price at $238, though you
            should budget for the handheld add-on and plan around the recharge
            project. The ShowerStick suits people who'd rather have a tiny weekly
            chore than a longer monthly one, and it uses plain table salt. Their
            site says they have been selling them since 2004.
          </p>
          <p>
            The AG Water Softener sits between them on price at $249. It
            recharges automatically in about 30 minutes every few weeks and
            works with the showerhead you already have. It does not filter
            chlorine.
          </p>
          <p>
            Whichever way you lean, confirm your water is actually hard first.
            All three products are wasted on soft water.
          </p>
        </div>

        {/* FAQ */}
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

        {/* Sources */}
        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          Sources
        </h2>
        <ul className="mt-6 space-y-2 text-[14px] leading-[1.7] text-foreground/90">
          <li>
            <a
              href="https://softwatercare.com/products/water-softener-for-shower"
              className="underline hover:opacity-70"
              rel="nofollow noopener"
              target="_blank"
            >
              SoftWaterCare product page
            </a>
            , accessed August 18, 2026
          </li>
          <li>
            <a
              href="https://softwatercare.com/pages/faq"
              className="underline hover:opacity-70"
              rel="nofollow noopener"
              target="_blank"
            >
              SoftWaterCare FAQ
            </a>
            , accessed August 18, 2026
          </li>
          <li>
            <a
              href="https://softwatercare.com/pages/recharge-guide-for-water-softener-system-for-shower"
              className="underline hover:opacity-70"
              rel="nofollow noopener"
              target="_blank"
            >
              SoftWaterCare recharge guide
            </a>
            , accessed August 18, 2026
          </li>
          <li>
            <a
              href="https://watersticks.com/product/showerstick/"
              className="underline hover:opacity-70"
              rel="nofollow noopener"
              target="_blank"
            >
              ShowerStick (WaterSticks) product page
            </a>
            , accessed August 18, 2026
          </li>
          <li>
            <a
              href="https://watersticks.com/showerstick-frequently-asked-questions/"
              className="underline hover:opacity-70"
              rel="nofollow noopener"
              target="_blank"
            >
              ShowerStick FAQ
            </a>
            , accessed August 18, 2026
          </li>
        </ul>

        {/* Closing box */}
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
