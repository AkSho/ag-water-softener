import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

export const Route = createFileRoute("/returns")({
  head: () => ({
    meta: [
      { title: "Returns and refunds | AG Water Softener" },
      {
        name: "description",
        content:
          "60-day money-back guarantee on every AG Water Softener. Change your mind, ship it back for a full refund of the purchase price. Defective on arrival, we cover it.",
      },
      { property: "og:title", content: "Returns and refunds | AG Water Softener" },
      { property: "og:description", content: "60-day money-back guarantee on every AG Water Softener. Change your mind, ship it back for a full refund of the purchase price. Defective on arrival, we cover it." },
      { property: "og:url", content: "https://agsoftener.com/returns" },
      { property: "og:type", content: "article" },
      { property: "og:image", content: "https://agsoftener.com/assets/hero.png" },
      { property: "og:site_name", content: "AG Water Softener" },
    ],
    links: [
      { rel: "canonical", href: "https://agsoftener.com/returns" },
    ],
  }),
  component: ReturnsPage,
});

function ReturnsPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <article className="mx-auto max-w-[760px] px-5 py-12 md:px-8 md:py-16 lg:py-24">
        <h1 className="font-display text-3xl leading-[1.05] sm:text-4xl md:text-[46px]">
          Returns and refunds
        </h1>

        <div className="mt-8 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            Every AG Water Softener comes with a 60-day money-back guarantee, counted from the day your order is delivered. Use it and test your water with a hardness strip. If it's not for you, send it back for a full refund of the purchase price.
          </p>
        </div>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          How a return works
        </h2>
        <div className="mt-6 text-[15px] leading-[1.7] text-foreground/90">
          <ol className="space-y-4 pl-6 list-decimal">
            <li>Email <a href="mailto:support@agsoftener.com" className="underline hover:opacity-70">support@agsoftener.com</a> with your order number and a photo of the unit and its parts.</li>
            <li>We reply with the return address. You ship it back with any carrier and send us the tracking number. Return shipping is at your cost.</li>
            <li>When the return arrives and is checked in, we refund the purchase price to your original payment method. Refunds show within 5 to 10 business days. We'll email you when it's processed.</li>
          </ol>
        </div>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          What we need back
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            The softener body and all included parts. That means the hose, wrench, mounting hardware, and the brine tank with its pump. Normal use is expected; that's the point of the guarantee. Missing parts and damage beyond normal use are deducted from the refund at replacement cost. A unit that comes back unusable is not refundable.
          </p>
          <p>
            You don't need the original box if you have another way to pack it safely. Damage from loose packing is the sender's responsibility.
          </p>
        </div>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          Damaged or defective on arrival
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            Email photos to <a href="mailto:support@agsoftener.com" className="underline hover:opacity-70">support@agsoftener.com</a> within 14 days of delivery. We'll replace the unit or refund it, your choice, and we cover the return shipping in that case.
          </p>
        </div>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          What isn't refunded
        </h2>
        <div className="mt-6 text-[15px] leading-[1.7] text-foreground/90">
          <ul className="space-y-4 pl-6 list-disc">
            <li>Return shipping on a change-of-mind return</li>
            <li>The express shipping charge, if you chose it at checkout</li>
            <li>Opened spare cartridges and opened Spares Kits, since resin and consumables can't be resold</li>
            <li>Returns that arrive after the 60-day window</li>
          </ul>
        </div>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          Warranty
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            Beyond the 60-day guarantee, every AG Water Softener is covered for 12 months from delivery against defects in materials and workmanship. If a part fails under normal use in that time, email <a href="mailto:support@agsoftener.com" className="underline hover:opacity-70">support@agsoftener.com</a> with photos and your order number and we'll ship a replacement part or unit at no cost.
          </p>
          <p>
            The warranty doesn't cover damage from installation outside the setup guide, freezing, water above 80 °C, skipped recharges, modifications, or use with anything other than the shower supply. Replacement is the remedy. The warranty doesn't cover labor or consequential costs such as water damage.
          </p>
          <p>
            Questions before you buy, or anything unclear here: <a href="mailto:support@agsoftener.com" className="underline hover:opacity-70">support@agsoftener.com</a>.
          </p>
        </div>
      </article>

      <SiteFooter />
    </div>
  );
}
