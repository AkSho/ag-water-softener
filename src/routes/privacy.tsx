import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy | AG Water Softener" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <article className="mx-auto max-w-[760px] px-5 py-12 md:px-8 md:py-16 lg:py-24">
        <h1 className="font-display text-3xl leading-[1.05] sm:text-4xl md:text-[46px]">
          Privacy policy
        </h1>

        <div className="mt-8 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>Effective September 2, 2026</p>
          <p>
            This policy covers agsoftener.com, operated by GRN Labs.
          </p>
        </div>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          What we collect
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            When you order: your name, email, shipping address, and order details. Card numbers go directly to Stripe and never touch our servers. When you browse: standard signals such as pages visited and referring site, plus the cookies described below.
          </p>
        </div>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          How we use it
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            To fulfill and ship orders, answer support email, and understand how people find the site. If you add a post-purchase item, your saved payment method with Stripe is used for that charge.
          </p>
        </div>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          Order surveys
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            After checkout you may see a Google Customer Reviews opt-in. If you accept, your email and order details are shared with Google so it can send the survey. Declining changes nothing about your order.
          </p>
        </div>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          Advertising measurement
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            We use conversion tracking from Google, Microsoft, and Meta to know when an ad led to an order, which can include a hashed, non-readable version of your email. These services set their own cookies under their own policies.
          </p>
        </div>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          Cookies and local storage
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            Used for cart contents, order-confirmation state, and the measurement above. Your browser can clear or block them; the cart may not work with them fully blocked.
          </p>
        </div>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          Who we share with
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            Stripe for payments, carriers for delivery, Google, Microsoft, and Meta for measurement as described, and our email provider for support messages. We don't sell your personal information.
          </p>
        </div>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          Retention
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            Order records are kept as long as needed for support, returns, accounting, and legal requirements.
          </p>
        </div>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          Your choices
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            Email <a href="mailto:support@agsoftener.com" className="underline hover:opacity-70">support@agsoftener.com</a> to ask what we hold, correct it, or request deletion of what we're not required to keep. California residents can exercise their CCPA rights the same way.
          </p>
        </div>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          Changes
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>Updates appear here with a new effective date.</p>
        </div>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          Contact
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            <a href="mailto:support@agsoftener.com" className="underline hover:opacity-70">support@agsoftener.com</a>
          </p>
        </div>
      </article>

      <SiteFooter />
    </div>
  );
}
