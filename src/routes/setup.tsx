import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { YouTubeEmbed } from "@/components/YouTubeEmbed";

export const Route = createFileRoute("/setup")({
  head: () => ({
    meta: [
      { title: "AG Water Softener setup and recharge guide" },
      {
        name: "description",
        content:
          "How to install the AG Water Softener and run the recharge cycle, with photos of each step. Download the guide as a PDF.",
      },
      { property: "og:title", content: "AG Water Softener setup and recharge guide" },
      {
        property: "og:description",
        content:
          "How to install the AG Water Softener and run the recharge cycle, with photos of each step. Download the guide as a PDF.",
      },
      { property: "og:url", content: "https://agsoftener.com/setup" },
      { property: "og:type", content: "article" },
      { property: "og:image", content: "https://agsoftener.com/assets/hero.png" },
      { property: "og:site_name", content: "AG Water Softener" },
    ],
    links: [
      { rel: "canonical", href: "https://agsoftener.com/setup" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: "How to install the AG Water Softener",
          step: [
            {
              "@type": "HowToStep",
              name: "Place the hooks",
              text: "Apply the adhesive hooks to a clean, dry surface.",
            },
            {
              "@type": "HowToStep",
              name: "Hang the unit",
              text: "Hang the water softener on the hooks.",
            },
            {
              "@type": "HowToStep",
              name: "Connect the hoses",
              text: "Connect the hose to the inlet of the wall mount adapter. Then attach the shower head hose to the outlet.",
            },
          ],
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: "How to recharge the AG Water Softener",
          step: [
            {
              "@type": "HowToStep",
              name: "Attach the pump",
              text: "Attach the pump to the regeneration adapter. Then attach the filter element and rotate to lock.",
            },
            {
              "@type": "HowToStep",
              name: "Seat the pump",
              text: "Place the pump at the bottom of the brine tank and press the suction cups down firmly. Keep the drain hose outside the tank.",
            },
            {
              "@type": "HowToStep",
              name: "Add the salt",
              text: "Add 500 grams of table salt, then fill the tank to about 80 percent full. Stir, or wait 5 minutes.",
            },
            {
              "@type": "HowToStep",
              name: "Run the cycle",
              text: "Plug in the pump and run the recharge cycle for about 30 minutes. The tank will be empty when it finishes.",
            },
            {
              "@type": "HowToStep",
              name: "Rinse and reinstall",
              text: "Remove the filter and rinse the pump with fresh water to prevent salt buildup. Then reinstall the filter.",
            },
          ],
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
              name: "Setup",
              item: "https://agsoftener.com/setup",
            },
          ],
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "VideoObject",
          name: "How to install the AG Water Softener (renter-friendly, no drilling)",
          description:
            "The AG Water Softener is a shower-arm water softener for renters. This video shows the complete install: wall mounting with the adhesive bracket, then the shower arm and hose connections.",
          thumbnailUrl:
            "https://i.ytimg.com/vi/hQ4HQuQDSV8/maxresdefault.jpg",
          uploadDate: "2026-09-03T16:30:00-04:00",
          duration: "PT47S",
          contentUrl:
            "https://www.youtube.com/watch?v=hQ4HQuQDSV8",
          embedUrl:
            "https://www.youtube-nocookie.com/embed/hQ4HQuQDSV8",
          transcript:
            "Confirm the position, about 30 cm from the water outlet. Wipe the wall clean and keep it dry. Remove the backing film. Align and apply the hook support, hooks facing down. Press firmly from the center outward to remove all air bubbles. Make sure to screw the screws tight. Hang the wall water softener on the hooks. Use the included wrench to loosen and remove the shower head pipe. Then attach it to the outlet and tighten. Attach the included soft hose and secure it firmly. Connect the other end of the hose to the inlet and tighten.",
          publisher: { "@id": "https://agsoftener.com/#organization" },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "VideoObject",
          name: "How to recharge the AG Water Softener with plain salt",
          description:
            "The AG Water Softener recharges at home using the regeneration attachment with the pump built in. Salt: use plain non-iodized salt, about 500 grams per recharge.",
          thumbnailUrl:
            "https://i.ytimg.com/vi/NAjgfH0UlBI/maxresdefault.jpg",
          uploadDate: "2026-09-03T16:30:00-04:00",
          duration: "PT33S",
          contentUrl:
            "https://www.youtube.com/watch?v=NAjgfH0UlBI",
          embedUrl:
            "https://www.youtube-nocookie.com/embed/NAjgfH0UlBI",
          transcript:
            "Remove the filter element, then attach the regeneration attachment and rotate to lock. The drain hose goes outside the tank. Place the pump at the bottom of the brine tank. Add 500 grams of table salt. Fill with water to about 80% full. Stir it. Plug in the pump and run the regeneration cycle.",
          publisher: { "@id": "https://agsoftener.com/#organization" },
        }),
      },
    ],
  }),
  component: SetupPage,
});

function SetupPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <article className="mx-auto max-w-[760px] px-5 py-12 md:px-8 md:py-16 lg:py-24">
        <h1 className="font-display text-3xl leading-[1.05] sm:text-4xl md:text-[46px]">
          Setup and recharge guide
        </h1>

        <div className="mt-8 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            The AG Water Softener fits any standard shower arm with a 1/2-inch fitting. In Europe,
            that is the G1/2 standard. If your shower hose screws onto the arm by hand, the AG fits
            it.
          </p>
          <p>
            <a
              href="/assets/AG-Water-Softener-Setup-Guide.pdf"
              className="underline hover:opacity-70"
            >
              Download this guide as a PDF.
            </a>
          </p>
        </div>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          What's in the box
        </h2>
        <ul className="mt-6 space-y-2 text-[15px] leading-[1.7] text-foreground/90">
          <li>Softener unit</li>
          <li>Salt brine tank</li>
          <li>Regeneration pump and adapter</li>
          <li>Adhesive hooks (2)</li>
          <li>Hose</li>
          <li>Setup guide</li>
        </ul>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">Installation</h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>Most installs take about 5 minutes and need no tools.</p>
          <p>
            The adhesive hooks hold best on a clean, dry wall. Wipe the surface dry before you
            start.
          </p>
        </div>

        <div className="mt-8">
          <YouTubeEmbed
            videoId="hQ4HQuQDSV8"
            title="How to install the AG Water Softener (renter-friendly, no drilling)"
          />
        </div>

        <ol className="mt-8 space-y-10">
          <li>
            <p className="text-[15px] leading-[1.7] text-foreground/90">
              <strong>Place the hooks.</strong> Apply the adhesive hooks to a clean, dry surface.
            </p>
            <img
              src="/assets/setup-01.jpg"
              alt="AG Water Softener setup step: place the hooks"
              className="mt-4 w-full rounded-lg"
            />
          </li>
          <li>
            <p className="text-[15px] leading-[1.7] text-foreground/90">
              <strong>Hang the unit.</strong> Hang the water softener on the hooks.
            </p>
            <img
              src="/assets/setup-02.jpg"
              alt="AG Water Softener setup step: hang the unit"
              className="mt-4 w-full rounded-lg"
            />
          </li>
          <li>
            <p className="text-[15px] leading-[1.7] text-foreground/90">
              <strong>Connect the hoses.</strong> Connect the hose to the inlet of the wall mount
              adapter. Then attach the shower head hose to the outlet.
            </p>
            <img
              src="/assets/setup-03.jpg"
              alt="AG Water Softener setup step: connect the hoses (1)"
              className="mt-4 w-full rounded-lg"
            />
            <img
              src="/assets/setup-04.jpg"
              alt="AG Water Softener setup step: connect the hoses (2)"
              className="mt-4 w-full rounded-lg"
            />
          </li>
        </ol>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          Recharging the softener
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            The filter recharges with plain table salt every 3 to 5 weeks. The cycle takes about 30
            minutes.
          </p>
        </div>

        <div className="mt-8">
          <YouTubeEmbed
            videoId="NAjgfH0UlBI"
            title="How to recharge the AG Water Softener with plain salt"
          />
        </div>

        <ol className="mt-8 space-y-10">
          <li>
            <p className="text-[15px] leading-[1.7] text-foreground/90">
              <strong>Attach the pump.</strong> Attach the pump to the regeneration adapter. Then
              attach the filter element and rotate to lock.
            </p>
            <img
              src="/assets/setup-06.png"
              alt="AG Water Softener setup step: attach the pump (1)"
              className="mt-4 w-full rounded-lg"
            />
            <img
              src="/assets/setup-07.png"
              alt="AG Water Softener setup step: attach the pump (2)"
              className="mt-4 w-full rounded-lg"
            />
          </li>
          <li>
            <p className="text-[15px] leading-[1.7] text-foreground/90">
              <strong>Seat the pump.</strong> Place the pump at the bottom of the brine tank and
              press the suction cups down firmly. Keep the drain hose outside the tank.
            </p>
            <img
              src="/assets/setup-08.jpg"
              alt="AG Water Softener setup step: seat the pump"
              className="mt-4 w-full rounded-lg"
            />
          </li>
          <li>
            <p className="text-[15px] leading-[1.7] text-foreground/90">
              <strong>Add the salt.</strong> Add 500 grams of table salt, then fill the tank to
              about 80 percent full. Stir, or wait 5 minutes.
            </p>
            <img
              src="/assets/setup-09.png"
              alt="AG Water Softener setup step: add the salt (1)"
              className="mt-4 w-full rounded-lg"
            />
            <img
              src="/assets/setup-10.jpg"
              alt="AG Water Softener setup step: add the salt (2)"
              className="mt-4 w-full rounded-lg"
            />
          </li>
          <li>
            <p className="text-[15px] leading-[1.7] text-foreground/90">
              <strong>Run the cycle.</strong> Plug in the pump and run the recharge cycle for about
              30 minutes. The tank will be empty when it finishes.
            </p>
            <img
              src="/assets/setup-11.jpg"
              alt="AG Water Softener setup step: run the cycle"
              className="mt-4 w-full rounded-lg"
            />
          </li>
          <li>
            <p className="text-[15px] leading-[1.7] text-foreground/90">
              <strong>Rinse and reinstall.</strong> Remove the filter and rinse the pump with fresh
              water to prevent salt buildup. Then reinstall the filter.
            </p>
            <img
              src="/assets/setup-12.png"
              alt="AG Water Softener setup step: rinse and reinstall"
              className="mt-4 w-full rounded-lg"
            />
          </li>
        </ol>

        <p className="mt-10 text-[15px] font-semibold leading-[1.7] text-foreground">
          Before your first shower after a recharge, run the water for one minute to flush out the
          remaining salt water.
        </p>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          Frequently asked questions
        </h2>
        <div className="mt-6 space-y-8 text-[15px] leading-[1.7] text-foreground/90">
          <div>
            <h3 className="text-[16px] font-semibold leading-[1.4]">Does the AG work with a fixed shower head?</h3>
            <p className="mt-2">
              The AG connects into a hose line, so it works right away with any handheld or hose-fed shower head. A fixed head screws straight onto its arm with no hose, so the AG can't feed it directly. The fix is a standard handheld conversion kit from any hardware store, usually $20 to $40. The holder screws onto your existing arm and the AG connects in. The new wand hangs right where the fixed head was. And the AG treats only the line it's attached to. If your shower has both a fixed head and a separate handheld, the water splits behind the wall, so you pick one line to soften.
            </p>
          </div>
        </div>
      </article>

      <SiteFooter />
    </div>
  );
}
