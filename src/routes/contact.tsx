import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact | AG Water Softener" },
      {
        name: "description",
        content:
          "Reach the AG Water Softener team at support@agsoftener.com. We answer every email, typically within one business day.",
      },
      { property: "og:title", content: "Contact | AG Water Softener" },
      { property: "og:description", content: "Reach the AG Water Softener team at support@agsoftener.com. We answer every email, typically within one business day." },
      { property: "og:url", content: "https://agsoftener.com/contact" },
      { property: "og:type", content: "article" },
      { property: "og:image", content: "https://agsoftener.com/assets/hero.png" },
      { property: "og:site_name", content: "AG Water Softener" },
    ],
    links: [
      { rel: "canonical", href: "https://agsoftener.com/contact" },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <article className="mx-auto max-w-[760px] px-5 py-12 md:px-8 md:py-16 lg:py-24">
        <h1 className="font-display text-3xl leading-[1.05] sm:text-4xl md:text-[46px]">
          Contact
        </h1>

        <div className="mt-8 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>The fastest way to reach us is email:</p>
          <p className="text-[16px] font-semibold">
            <a href="mailto:support@agsoftener.com" className="underline hover:opacity-70">support@agsoftener.com</a>
          </p>
          <p>
            We answer every message, typically within one business day, and the person answering is the person who runs the company, not a ticket queue.
          </p>
        </div>

        <h2 className="mt-14 font-display text-2xl leading-[1.1] sm:text-3xl">
          What we can help with
        </h2>
        <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/90">
          <p>
            Order status and tracking, returns and the 60-day guarantee, install questions, recharge questions, reading your test strips, and whether the AG is right for your water in the first place. If your water report or strip says your water is soft, we'll tell you not to buy one.
          </p>
          <p>
            AG Water Softener is made by GRN Labs.
          </p>
        </div>
      </article>

      <SiteFooter />
    </div>
  );
}
