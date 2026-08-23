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
          "Every AG Water Softener has a 60-day money-back guarantee and a 12-month warranty. We pay return shipping and send you the label.",
      },
      { property: "og:title", content: "Returns and refunds | AG Water Softener" },
      { property: "og:description", content: "Every AG Water Softener has a 60-day money-back guarantee and a 12-month warranty. We pay return shipping and send you the label." },
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
            Every AG Water Softener comes with a 60-day money-back guarantee, counted from the day your order is delivered. Use it and test your water with a hardness strip. If you're not happy for any reason, send it back for a full refund.
          </p>
        </div>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          How it works
        </h2>
        <div className="mt-6 text-[15px] leading-[1.7] text-foreground/90">
          <ol className="space-y-4 pl-6 list-decimal">
            <li>Email <a href="mailto:support@agsoftener.com" className="underline hover:opacity-70">support@agsoftener.com</a> with your order number and let us know you'd like a return. No forms, no phone trees.</li>
            <li>We email you a prepaid return shipping label. Return shipping is on us.</li>
            <li>Box the unit up, drop it off, done.</li>
            <li>Your refund goes back to your original payment method within 5 to 10 business days of the return arriving to us. We'll email you when it's processed.</li>
          </ol>
        </div>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          The fine print, kept short
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            We ask that the unit comes back in reasonably complete condition: the softener body and its included parts. Normal use is expected; that's the point of the guarantee. You don't need the original box if you have another way to pack it safely.
          </p>
          <p>
            Refunds cover the full purchase price. If you believe your unit arrived damaged or defective, email us photos and we'll replace it or refund it, your choice, without waiting on the return.
          </p>
          <p>
            Questions before you buy, or anything unclear here: <a href="mailto:support@agsoftener.com" className="underline hover:opacity-70">support@agsoftener.com</a>.
          </p>
        </div>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          Warranty
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            Beyond the 60-day guarantee, every AG Water Softener is covered by a 12-month warranty against manufacturing defects, counted from the delivery date. If a part fails under normal use within the first year, email <a href="mailto:support@agsoftener.com" className="underline hover:opacity-70">support@agsoftener.com</a> with photos and your order number and we'll ship a replacement part or unit at no cost.
          </p>
        </div>
      </article>

      <SiteFooter />
    </div>
  );
}
