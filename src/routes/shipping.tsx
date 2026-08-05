import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

export const Route = createFileRoute("/shipping")({
  head: () => ({
    meta: [
      { title: "Shipping | AG Water Softener" },
      {
        name: "description",
        content:
          "Free shipping on every AG Water Softener order. Typical delivery is 12 to 18 days, with tracking emailed to you.",
      },
      { property: "og:title", content: "Shipping | AG Water Softener" },
      { property: "og:description", content: "Free shipping on every AG Water Softener order. Typical delivery is 12 to 18 days, with tracking emailed to you." },
      { property: "og:url", content: "https://agsoftener.com/shipping" },
      { property: "og:type", content: "article" },
      { property: "og:image", content: "https://agsoftener.com/assets/hero.png" },
      { property: "og:site_name", content: "AG Water Softener" },
    ],
    links: [
      { rel: "canonical", href: "https://agsoftener.com/shipping" },
    ],
  }),
  component: ShippingPage,
});

function ShippingPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <article className="mx-auto max-w-[760px] px-5 py-12 md:px-8 md:py-16 lg:py-24">
        <h1 className="font-display text-3xl leading-[1.05] sm:text-4xl md:text-[46px]">
          Shipping
        </h1>

        <div className="mt-8 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            Shipping is free on every order. No minimums, no codes.
          </p>
        </div>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          What to expect
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            Orders ship via DHL or UPS with tracking and typically arrive within 12 to 18 days of purchase. You'll receive a tracking number by email as soon as your order ships, so you can follow it the whole way.
          </p>
          <p>
            We currently ship within the United States.
          </p>
        </div>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          Why the timeline
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            We're a small company and we ship directly from our production facility rather than marking the product up to cover US warehousing. The trade is a longer transit time for a lower price and free shipping. Your 60-day money-back guarantee doesn't start until the day your order is delivered, so the transit time never eats into your trial window.
          </p>
        </div>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          If something goes wrong
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            If your tracking stalls or your order hasn't arrived within 18 days, email <a href="mailto:support@agsoftener.com" className="underline hover:opacity-70">support@agsoftener.com</a> with your order number and we'll chase it down. If a package is lost in transit, we send a replacement or refund you in full, your choice.
          </p>
        </div>
      </article>

      <SiteFooter />
    </div>
  );
}
