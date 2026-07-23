import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  Minus,
  Plus,
  Search,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react";
import { AnnouncementBar } from "@/components/site/AnnouncementBar";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { HeroGallery, type HeroGalleryItem } from "@/components/site/HeroGallery";
import { StickyBuyBar } from "@/components/site/StickyBuyBar";

import { useCart, money } from "@/lib/cart";
import { PDP_FEATURES } from "@/lib/pdp-features";
import { fbPixel } from "@/lib/analytics";

export const openWaterReport = () =>
  document.dispatchEvent(new CustomEvent("open-water-report"));


type BandSearch = { band?: "hard" | "veryhard" };

export const Route = createFileRoute("/")({
  validateSearch: (raw: Record<string, unknown>): BandSearch => {
    const b = typeof raw.band === "string" ? raw.band.toLowerCase() : undefined;
    return b === "hard" || b === "veryhard" ? { band: b } : {};
  },
  head: () => ({
    meta: [
      { title: "AG Water Softener — Hard Water Shower Softener" },
      { name: "description", content: "The AG Water Softener uses true ion-exchange to pull calcium and magnesium out of your shower water. Softer hair and skin in your first shower — 60-day money-back guarantee." },
    ],
  }),
  component: ProductPage,
});

/* Kept behind PDP_FEATURES.finishes for future re-enablement. */
const FINISHES = [
  { id: "modern-chrome", label: "Modern Chrome", ring: "linear-gradient(135deg,#e9e9ec 0%,#a9adb3 100%)", dot: "radial-gradient(circle at 40% 35%, #f3f4f6 0%, #cfd2d7 45%, #7a7d82 100%)" },
  { id: "brushed-steel", label: "Brushed Steel", ring: "linear-gradient(135deg,#d8d1c3 0%,#9a9282 100%)", dot: "radial-gradient(circle at 40% 35%, #ebe3d1 0%, #b6ac96 55%, #746c5a 100%)" },
  { id: "matte-black", label: "Matte Black", ring: "linear-gradient(135deg,#2b2b2b 0%,#0a0a0a 100%)", dot: "radial-gradient(circle at 40% 35%, #3a3a3a 0%, #1a1a1a 60%, #050505 100%)" },
  { id: "matte-olive", label: "Matte Olive", ring: "linear-gradient(135deg,#6a6a4e 0%,#3f3f28 100%)", dot: "radial-gradient(circle at 40% 35%, #7d7c58 0%, #4a4a30 60%, #262617 100%)" },
  { id: "brick", label: "Brick", ring: "linear-gradient(135deg,#b04a34 0%,#6a2717 100%)", dot: "radial-gradient(circle at 40% 35%, #c1583f 0%, #7a2d1c 60%, #3e1409 100%)" },
];

const heroAsset = { url: "/assets/hero.png" };
const wholeSetAsset = { url: "/assets/whole-set.png" };
const crossSectionAsset = { url: "/assets/cross-section.png" };
const inShowerAsset = { url: "/assets/in-shower.png" };
const underSinkAsset = { url: "/assets/under-sink.png" };
const randomProductsAsset = { url: "/assets/random-products.png" };
const portableTankAsset = { url: "/assets/portable-tank-1930s.png" };
const crossSection2Asset = { url: "/assets/ag-softener-cross-2.png" };
const installShowerAsset = { url: "/assets/install-shower.png" };
const installUnderSinkAsset = { url: "/assets/install-under-sink.png" };
const testStripsAsset = { url: "/assets/test-strips.png" };
const vacationMomentAsset = { url: "/assets/vacation-moment.png" };
const showerheadHardWaterAsset = { url: "/assets/showerhead_hard_water.png" };
const hairHardWaterAsset = { url: "/assets/hair_hard_water.png" };
const beardHardWaterAsset = { url: "/assets/beard_hard_water.png" };
const lifestyleShot2Asset = { url: "/assets/lifestyle_shot-2.png" };
const quickConnectAsset = { url: "/assets/quick-connect.png" };

const beforeAfterAsset = { url: "/assets/before-after.png" };

const GALLERY: HeroGalleryItem[] = [
  { key: "g1", src: heroAsset.url, alt: "AG Water Softener — product front view" },
  { key: "g2", src: testStripsAsset.url, alt: "Hardness test strips — verify your water tests soft" },
  { key: "g3", src: beforeAfterAsset.url, alt: "Before and after — hair and skin results with the AG Water Softener", contain: true, overlay: (
    <div className="flex pb-2">
      <div className="flex w-1/2 justify-center"><span className="text-xl font-bold text-black sm:text-2xl lg:text-3xl">Before</span></div>
      <div className="flex w-1/2 justify-center"><span className="text-xl font-bold text-black sm:text-2xl lg:text-3xl">After</span></div>
    </div>
  ) },
  { key: "g4", src: wholeSetAsset.url, alt: "AG Water Softener with brine tank — whole set" },
  { key: "g5", src: crossSectionAsset.url, alt: "Cross-section showing ion-exchange resin core" },
  { key: "g6", src: inShowerAsset.url, alt: "AG Water Softener installed inline in a shower" },
  { key: "g7", src: "/assets/gallery-chart.png", alt: "Water hardness comparison chart" },
];

const PRICE = 249;
const PRODUCT_TITLE = "The AG Water Softener";

function ProductPage() {
  useEffect(() => {
    fbPixel("track", "ViewContent", {
      content_name: "AG Water Softener",
      content_ids: ["ag-softener"],
      content_type: "product",
      value: PRICE,
      currency: "USD",
    });
  }, []);

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-0">
      <AnnouncementBar />
      <SiteHeader />
      <ProductHero />
      <TabBar />
      <VacationMoment />
      <WhyNothingWorked />
      <WhatSoftWaterChanges />
      <ForgottenFix />
      <MeetTheSoftener />
      <ProofWall />

      <InstallAndMaintenance />
      <FAQSection />
      <ClosingSection />
      <SiteFooter />
      <StickyBuyBar
        price={PRICE}
        productId="ag-softener"
        productTitle={PRODUCT_TITLE}
        variantLabel="Single unit"
        image="/assets/cart-main.png"
      />
      <WaterReportModal />
    </div>
  );
}

/* ─────────────────────────────── HERO (Section 1) ─────────────────────────────── */

function isValidBand(v: unknown): v is "hard" | "veryhard" {
  return v === "hard" || v === "veryhard";
}

function useBand(): "hard" | "veryhard" | null {
  const { band: searchBand } = Route.useSearch();
  const [band] = useState<"hard" | "veryhard" | null>(() => {
    if (isValidBand(searchBand)) return searchBand;
    if (typeof window === "undefined") return null;
    const stored = sessionStorage.getItem("band");
    return isValidBand(stored) ? stored : null;
  });

  useEffect(() => {
    if (isValidBand(searchBand)) {
      sessionStorage.setItem("band", searchBand);
    }
  }, [searchBand]);

  return band;
}

function BandPrehead() {
  const band = useBand();

  if (import.meta.env.VITE_BAND_BANNER !== "true") return null;
  if (!band) return null;

  const line =
    band === "hard"
      ? "Your zip tested hard. This is the fix for exactly that."
      : "Your zip tested very hard. This is the fix for exactly that.";

  return (
    <p className="mb-3 w-full rounded-sm bg-butter px-3 py-2 text-[13px] tracking-[0.14em] text-foreground/90">
      {line}
    </p>
  );
}


function ProductHero() {
  const [finish, setFinish] = useState(FINISHES[0].id);
  const [subscribe, setSubscribe] = useState(false);
  const [qty, setQty] = useState(1);
  const infoRef = useRef<HTMLDivElement>(null);
  const { add } = useCart();

  const selectedFinish = FINISHES.find((f) => f.id === finish)!;
  const variantLabel = PDP_FEATURES.finishes ? selectedFinish.label : "Single unit";

  const bullets = [
    "True ion-exchange softening — the same technology inside whole-house systems",
    "Your water tests soft on a standard hardness strip. You can verify it yourself",
    "Installs in under 10 minutes, without a plumber. Your landlord never needs to know",
    "Better hair and skin in 60 days, or your money back",
  ];

  return (
    <section
      data-hero
      className="mx-auto max-w-[1400px] px-5 pb-10 pt-2 md:px-8 md:pb-14 md:pt-4"
    >
      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
        {/* Gallery — mobile swipe carousel, desktop stack */}
        <HeroGallery items={GALLERY} />

        {/* Sticky info column */}
        <div className="lg:sticky lg:top-24 lg:h-fit lg:pl-4 xl:pl-10" ref={infoRef}>
          <BandPrehead />

          <h1 className="font-display text-3xl leading-[1.05] md:text-4xl lg:text-[36px]">
            AG Water Softener
          </h1>

          {/* Subhead */}
          <p className="mt-2 max-w-prose text-[15px] leading-[1.65] text-foreground/90 md:mt-3">
            The AG Water Softener pulls the hard-water minerals out of your shower before they ever touch your hair and skin, so the soft, swishy hair you only get on vacation becomes what home feels like. Most people notice the difference in their very first shower.
          </p>

          {/* Checkmark bullets */}
          <ul className="mt-4 space-y-2 md:mt-6 md:space-y-3">
            {bullets.map((b) => (
              <li key={b} className="grid grid-cols-[auto_1fr] items-start gap-3 text-[14px] leading-[1.55]">
                <Check className="mt-[3px] h-4 w-4 shrink-0 text-foreground" strokeWidth={2.25} />
                <span>{b}</span>
              </li>
            ))}
          </ul>

          {/* Price block */}
          <div className="mt-5 border-t border-border/60 pt-4 md:mt-8 md:pt-6">
            <div className="flex items-baseline gap-3">
              <span className="font-display text-4xl leading-none">{money(PRICE)}</span>
            </div>
            <p className="mt-2 text-xs italic text-muted-foreground">
              The softening technology inside $2,000 whole-house systems, sized to fit your shower.
            </p>
            <p className="mt-2 text-xs italic text-muted-foreground">
              Most of a whole-house system's price is the plumbing and the installer. This is the part that actually softens your water.
            </p>
          </div>

          {/* Finishes — hidden by feature flag */}
          {PDP_FEATURES.finishes && (
            <div className="mt-8">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Color</span>
                <span className="font-medium">{selectedFinish.label}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-3">
                {FINISHES.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFinish(f.id)}
                    aria-label={f.label}
                    aria-pressed={finish === f.id}
                    className={`grid h-14 w-14 place-items-center border transition ${
                      finish === f.id ? "border-foreground" : "border-border hover:border-foreground/40"
                    }`}
                  >
                    <span className="grid h-9 w-9 place-items-center rounded-full ring-1 ring-black/5" style={{ background: f.ring }}>
                      <span className="h-6 w-6 rounded-full" style={{ background: f.dot }} />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Subscribe toggle — hidden by feature flag */}
          {PDP_FEATURES.subscription && (
            <div className="mt-6">
              <label className={`flex cursor-pointer items-start justify-between gap-4 border p-4 transition ${subscribe ? "border-foreground bg-foreground/[0.02]" : "border-border"}`}>
                <div className="flex items-start gap-3">
                  <span className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center border ${subscribe ? "border-foreground bg-foreground" : "border-foreground"}`}>
                    {subscribe && <span className="h-1.5 w-1.5 bg-background" />}
                  </span>
                  <input type="radio" name="purchase" className="sr-only" checked={subscribe} onChange={() => setSubscribe(true)} />
                  <div className="text-sm">Subscribe & Save</div>
                </div>
                {PDP_FEATURES.filterFrequency && <FilterFrequencyDropdown />}
              </label>
              <label className={`mt-2 flex cursor-pointer items-center justify-between gap-4 border p-4 transition ${!subscribe ? "border-foreground bg-foreground/[0.02]" : "border-border"}`}>
                <div className="flex items-center gap-3">
                  <span className={`grid h-4 w-4 shrink-0 place-items-center border ${!subscribe ? "border-foreground bg-foreground" : "border-foreground"}`}>
                    {!subscribe && <span className="h-1.5 w-1.5 bg-background" />}
                  </span>
                  <input type="radio" name="purchase" className="sr-only" checked={!subscribe} onChange={() => setSubscribe(false)} />
                  <span className="text-sm">One time purchase</span>
                </div>
                <div className="text-sm font-medium">{money(PRICE)}</div>
              </label>
            </div>
          )}

          {/* Qty + primary CTA */}
          <div className="mt-4 grid grid-cols-[auto_1fr] gap-2 md:mt-6">
            <div className="inline-flex items-center border border-border">
              <button className="grid h-14 w-11 place-items-center" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease">
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="min-w-6 text-center text-sm tabular-nums">{qty}</span>
              <button className="grid h-14 w-11 place-items-center" onClick={() => setQty((q) => q + 1)} aria-label="Increase">
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <button
              onClick={() =>
                add(
                  {
                    id: `ag-softener${PDP_FEATURES.finishes ? `:${finish}` : ""}${PDP_FEATURES.subscription && subscribe ? ":sub" : ""}`,
                    title: PRODUCT_TITLE,
                    variantLabel,
                    price: PRICE,
                    image: "/assets/cart-main.png",
                  },
                  qty,
                )
              }
              className="h-auto bg-black px-4 py-3 text-[12px] font-medium uppercase tracking-[0.14em] text-white transition hover:opacity-90"
            >
              <span className="block">Add to Cart</span>
              <span className="mt-1 block text-[10px] font-normal normal-case tracking-normal opacity-80">
                {money(PRICE)} · 60-day money-back guarantee
              </span>
            </button>
          </div>

          <p className="mt-3 text-xs italic text-muted-foreground">
            Love your water or send it back. The guarantee starts the day it arrives.
          </p>

          {/* Trust badges rotator */}
          <RotatorStrip
            items={[
              "True ion-exchange softening",
              "60-day money-back guarantee",
            ]}
          />
        </div>
      </div>
    </section>
  );
}

function RotatorStrip({ items }: { items: string[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const int = setInterval(() => setI((n) => (n + 1) % items.length), 3500);
    return () => clearInterval(int);
  }, [items.length]);
  return (
    <div className="mt-5 flex items-center justify-between gap-4 border-t border-border/60 pt-4">
      <div key={i} className="animate-in fade-in text-xs uppercase tracking-[0.14em] text-muted-foreground duration-500">{items[i]}</div>
      <div className="flex gap-1.5">
        {items.map((_, j) => (
          <button key={j} onClick={() => setI(j)} aria-label={`Slide ${j + 1}`}
            className={`h-1 w-1 rounded-full transition ${j === i ? "bg-foreground" : "bg-foreground/25"}`} />
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────── TAB BAR (jump nav) ─────────────────────────────── */

const TABS = [
  { label: "The Problem", href: "#the-problem" },
  { label: "What Changes", href: "#what-changes" },
  { label: "The Fix", href: "#the-fix" },
  { label: "Reviews", href: "#proof" },
  { label: "FAQ", href: "#faq" },
] as const;

function TabBar() {
  const [active, setActive] = useState<string>(TABS[0].href);

  useEffect(() => {
    const ids = TABS.map((t) => t.href.slice(1));
    const targets = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);
    if (targets.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive("#" + e.target.id);
        });
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: 0 },
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, []);

  return (
    <div className="sticky top-14 z-30 border-y border-border/60 bg-surface/95 backdrop-blur md:top-16">
      <div
        className="mx-auto max-w-[1400px] overflow-x-auto px-4 md:px-8 no-scrollbar"
        style={{
          maskImage:
            "linear-gradient(to right, black calc(100% - 32px), transparent)",
          WebkitMaskImage:
            "linear-gradient(to right, black calc(100% - 32px), transparent)",
        }}
      >
        <nav className="flex min-w-max gap-8 py-3 text-sm md:py-4">
          {TABS.map((t) => (
            <a
              key={t.href}
              href={t.href}
              onClick={() => setActive(t.href)}
              className={`relative pb-2 transition ${active === t.href ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {t.label}
              {active === t.href && <span className="absolute -bottom-3 left-0 right-0 h-px bg-foreground md:-bottom-4" />}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
}

/* ─────────────────────────────── SECTION 2 — VACATION WATER MOMENT ─────────────────────────────── */

function VacationMoment() {
  return (
    <section id="vacation" className="mx-auto max-w-[1400px] px-5 py-12 md:px-8 md:py-16 lg:py-24">
      <div className="grid gap-8 md:gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16">
        {/* Desktop image (right column on lg) */}
        <img
          src={vacationMomentAsset.url}
          alt="Woman in hotel bathrobe, towel-drying soft hair, warm light"
          className="hidden aspect-[4/5] w-full object-cover lg:order-2 lg:block"
          loading="lazy"
        />
        <div className="max-w-[560px] self-center lg:order-1">
          <h2 className="font-display text-3xl leading-[1.05] md:text-4xl lg:text-[42px]">
            You've already felt soft water. You just didn't know that's what it was.
          </h2>
          <div className="mt-6 space-y-5 text-[15px] leading-[1.7] text-foreground/90 md:mt-8">
            <p>Maybe it was a hotel. Or a week at your sister's place in another city.</p>
            <p>You washed your hair with the same shampoo you use at home, out of the same travel bottle. And something strange happened...it lathered. Your hair dried soft and swishy instead of poofy and wiry. Your face didn't feel tight ten minutes after you stepped out.</p>
            <p>You probably credited the hotel shampoo or just being relaxed.</p>
          </div>

          {/* Mobile-only image break between paragraphs */}
          <img
            src={vacationMomentAsset.url}
            alt="Woman in hotel bathrobe, towel-drying soft hair, warm light"
            className="my-8 aspect-[4/5] w-full object-cover lg:hidden"
            loading="lazy"
          />

          <div className="space-y-5 text-[15px] leading-[1.7] text-foreground/90">
            <p>Then you came home, showered in your own bathroom, and within days everything went back: the frizz, the tangles, the tightness, the flakes.</p>
            <p>Same you. Same products.</p>
            <p>The only thing that changed was the water.</p>
            <p>Unless you're in one of the lucky pockets of the map, your water is what the USGS classifies as "hard" or "very hard" — loaded with dissolved calcium and magnesium. Every shower leaves a fine layer of these minerals on your hair and skin. It's the same residue you can see on your shower door and your faucet.</p>
          </div>

          <blockquote className="mt-10 border-l-2 border-foreground pl-6 font-display text-2xl italic leading-[1.25] text-foreground sm:text-3xl">
            &ldquo;I thought I had hormone problems or something. It was just my water.&rdquo;
          </blockquote>
          <p className="mt-6 text-[15px] leading-[1.7] text-foreground/90">
            That sentence is the whole story. Something in you has probably suspected this for a while...and you were right.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────── SECTION 3 — WHY NOTHING WORKED ─────────────────────────────── */

function WhyNothingWorked() {
  return (
    <section id="the-problem" className="border-t border-border/60">
      <div className="mx-auto max-w-[1400px] px-5 py-12 md:px-8 md:py-16 lg:py-24">
        <div className="grid gap-12 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:gap-16">
          {/* Product photo */}
          <div className="order-2 md:order-1">
            <img
              src={showerheadHardWaterAsset.url}
              alt="Before and after — a showerhead caked in hard-water scale next to a clean, softened one"
              className="w-full max-h-[70vh] object-cover md:max-h-none md:h-full"
              loading="lazy"
            />
          </div>

          {/* Copy */}
          <div className="order-1 md:order-2">
            <h2 className="font-display text-3xl leading-[1.05] sm:text-4xl md:text-[42px]">
              You didn't buy the wrong products. You were sold the wrong category.
            </h2>
            <div className="mt-8 space-y-5 text-[15px] leading-[1.7] text-foreground/90">
              <p>If your bathroom has seen a clarifying shampoo, a Malibu C packet, a vinegar rinse, a bottle of "hard water" leave-in, or at least one filtered showerhead from Amazon, you're in good company. Nearly everyone dealing with hard water goes through this.</p>
              <p>And each step probably helped a little, for a little while. Then wash day came around and the coated, dull, straw-like feeling came back.</p>
              <p>But here's the part nobody selling those products said out loud:</p>
            </div>
          </div>
        </div>
      </div>

      {/* Full-width reveal band */}
      <div className="border-y border-border/60 bg-foreground text-background">
        <div className="mx-auto max-w-[1000px] px-5 py-12 md:px-8 md:py-16 lg:py-24">
          <h3 className="font-display text-3xl leading-[1.05] sm:text-4xl md:text-[46px]">
            Filtering water and softening water are two different things.
          </h3>
          <div className="mt-8 space-y-5 text-[15px] leading-[1.7] text-background/85">
            <p>A shower filter reduces chlorine. That's worthwhile, but chlorine was never what made your hair frizzy or your skin tight. Hardness minerals did. And a filter does not remove them.</p>
            <p>This isn't a matter of opinion. The industry certification most shower filters point to (NSF/ANSI 177) covers chlorine reduction only. Even filters marketed with "hard water" on the box will state, somewhere in the fine print, that they don't remove calcium or magnesium.</p>
            <p>So the water coming out of your filtered showerhead was cleaner. It just wasn't softer. It sends the exact same minerals to your hair and skin as the day you installed it.</p>
            <p>Which means every disappointing result you've had was the predictable outcome of solving the wrong half of the problem.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────── SECTION 4 — WHAT SOFT WATER CHANGES ─────────────────────────────── */

function WhatSoftWaterChanges() {
  const timeline = [
    {
      emoji: "🚿",
      when: "The first shower",
      body: "The lather is different. Shampoo foams the way it does on vacation, because it's no longer fighting minerals to do its job. When you rinse, your hair feels clean instead of coated. Your skin feels rinsed instead of filmed.",
    },
    {
      emoji: "✨",
      when: "The first week or two",
      body: "Your hair starts behaving. Conditioner absorbs instead of sitting on top. Detangling gets faster. If you have waves or curls, they start clumping and holding shape again instead of collapsing into frizz by day two. Skin stops feeling tight the moment you towel off.",
    },
    {
      emoji: "🌿",
      when: "By the second month",
      body: "The difference stops being an event and becomes your new normal. Wash day gets shorter because there's no mineral buildup to fight through. The products you already own quietly start working the way their labels promised. Several people tell us they end up using less of everything.",
    },
  ];
  return (
    <section id="what-changes" className="border-t border-border/60">
      <div className="mx-auto max-w-[1400px] px-5 py-12 md:px-8 md:py-16 lg:py-24">
        <div className="mx-auto max-w-[900px]">
          <h2 className="font-display text-3xl leading-[1.05] sm:text-4xl md:text-[38px]">
            The first few weeks of soft water feel like getting your money's worth out of every product you already own
          </h2>
          <p className="mt-8 text-[15px] leading-[1.7] text-foreground/90">
            People who finally get soft water at home tend to describe it the same way, in the same order.
          </p>

          <figure className="mt-10">
            <img
              src={hairHardWaterAsset.url}
              alt="Before and after — the same blonde hair, frizzy and dry vs. defined soft curls"
              className="aspect-[3/2] w-full object-cover"
              loading="lazy"
            />
            <figcaption className="mt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Before / After — same hair, same products, different water.
            </figcaption>
          </figure>
        </div>

        {/* Timeline */}
        <ol className="mx-auto mt-14 max-w-[900px] space-y-12 border-l border-border/60 pl-10 md:space-y-16 md:pl-14">
          {timeline.map((t) => (
            <li key={t.when} className="relative">
              <span
                aria-hidden
                className="absolute -left-[52px] top-0 grid h-10 w-10 place-items-center rounded-full bg-foreground text-2xl leading-none ring-1 ring-foreground md:-left-[60px] md:h-11 md:w-11 md:text-[26px]"
              >
                {t.emoji}
              </span>
              <div className="pt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {t.when}
              </div>
              <p className="mt-3 text-[15px] leading-[1.7] text-foreground/90">{t.body}</p>
            </li>
          ))}
        </ol>

        <p className="mx-auto mt-14 max-w-[900px] text-[15px] leading-[1.7] text-foreground/90">
          That's the real outcome here: mornings where your hair and skin cooperate, and a routine that finally pays you back for the effort you put into it.
        </p>
      </div>

      {/* Research band */}
      <div className="border-y border-border/60 bg-surface">
        <div className="mx-auto max-w-[900px] px-5 py-12 md:px-8 md:py-16 lg:py-20">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Research
          </div>
          <h3 className="mt-4 font-display text-2xl italic leading-[1.15] sm:text-3xl md:text-[38px]">
            You're not imagining it. Researchers have measured it.
          </h3>

          <div className="mt-10 space-y-8 text-[15px] leading-[1.7] text-foreground/90">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">On hair</div>
              <p className="mt-3">
                Dermatology researchers washed hair in hard water for thirty days and examined it under an electron microscope (<a href="https://pubmed.ncbi.nlm.nih.gov/26711619/" target="_blank" rel="noopener" className="underline">see the study</a>). The hard-water strands carried about three times the calcium and four times the magnesium of strands washed in distilled water, measured thinner, and showed a ruffled surface instead of a smooth one. That roughened surface is what you experience as coarseness and dullness.
              </p>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">On skin</div>
              <figure className="mt-4">
                <img
                  src={beardHardWaterAsset.url}
                  alt="Before and after — irritated, red neck after shaving in hard water vs. calm skin after softened water"
                  className="aspect-[3/2] w-full object-cover"
                  loading="lazy"
                />
                <figcaption className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Before / After — hard-water irritation after shaving vs. softened water.
                </figcaption>
              </figure>
              <p className="mt-4">
                Research published in the <em>Journal of Investigative Dermatology</em> (<a href="https://www.jidonline.org/article/S0022-202X(17)32938-X/fulltext" target="_blank" rel="noopener" className="underline">see the study</a>) found that washing with hard water leaves significantly more soap residue clinging to the skin, which raises water loss through the skin barrier — the mechanism behind that tight, stripped feeling after a shower. The same researchers found that <span className="font-medium">softening the water by ion exchange reduced this effect.</span>
              </p>
            </div>
            <p className="border-t border-border/60 pt-6 text-[13px] italic text-muted-foreground">
              Ion exchange is exactly the technology inside the AG Water Softener — the same mechanism, at shower scale.
            </p>
          </div>
        </div>
      </div>

      {/* Soft mid-page CTA */}
      <div className="mx-auto max-w-[1400px] px-5 py-10 text-center md:px-8 md:py-16">
        <a
          href="#top"
          onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
          className="inline-flex items-center bg-black px-8 py-5 text-[12px] font-medium uppercase tracking-[0.16em] text-white transition hover:opacity-90"
        >
          Try The AG Water Softener In Your Shower
        </a>
      </div>
    </section>
  );
}

/* ─────────────────────────────── SECTION 5 — THE FORGOTTEN FIX ─────────────────────────────── */

function ForgottenFix() {
  return (
    <section
      className="border-t border-border/60"
      style={{ backgroundColor: "oklch(0.94 0.010 80)" }}
    >
      <div className="mx-auto max-w-[1400px] px-5 py-12 md:px-8 md:py-16 lg:py-24">
        <div className="grid gap-10 md:grid-cols-2 md:gap-16">
          <div className="text-left">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              A short history
            </div>
            <h2 className="mt-4 font-display text-3xl leading-[1.1] sm:text-4xl md:text-[44px]">
              Portable water softening isn't new. It's forgotten.
            </h2>
            <div className="mt-10 space-y-5 text-[15px] leading-[1.75] text-foreground/90">
              <p>The chemistry that removes hardness minerals from water — ion exchange — has been understood since 1905.</p>
              <p>In the 1930s, portable softening was an ordinary household service. Families rented compact exchange tanks and swapped them out monthly when the resin was spent, without ever touching their plumbing. Soft water, delivered at apartment scale.</p>
              <p>Then the industry consolidated around two formats: big whole-house systems for homeowners, and cheap chlorine filters for everyone else. The convenient middle, true softening sized for renters, simply stopped being made.</p>
              <p>So if you've spent years feeling like the actual fix was locked behind homeownership and a four-figure quote, you weren't wrong about the fix. The technology existed the entire time. It just needed to be rebuilt for the way people live now, leases and all.</p>
            </div>
            <p className="mt-10 font-display text-xl italic sm:text-2xl">
              That's what the AG Water Softener is.
            </p>
          </div>
          <img
            src={portableTankAsset.url}
            alt="A man wheels a portable water softening exchange tank, 1930s"
            className="aspect-[4/5] w-full self-center border border-border/60 object-cover"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────── SECTION 6 — MEET THE AG WATER SOFTENER ─────────────────────────────── */

function MeetTheSoftener() {
  const compareRows = [
    { label: "Softens hard water (removes calcium & magnesium)", ag: true, filter: false, whole: true },
    { label: "Reduces chlorine", ag: false, filter: true, whole: false },
    { label: "No plumbing changes to install", ag: true, filter: true, whole: false },
    { label: "Renter-safe & fully removable", ag: true, filter: true, whole: false },
    { label: "Verifiable with a hardness test strip", ag: true, filter: false, whole: true },
  ];
  return (
    <section id="the-fix" className="border-t border-border/60">
      <div className="mx-auto max-w-[1400px] px-5 py-12 md:px-8 md:py-16 lg:py-24">
        <div className="mx-auto max-w-[900px]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">The fix</div>
          <h2 className="mt-4 font-display text-3xl leading-[1.05] sm:text-4xl md:text-[42px]">
            The AG Water Softener: real softening, finally sized for your shower
          </h2>
          <p className="mt-8 text-[15px] leading-[1.7] text-foreground/90">
            The AG Water Softener is deliberately a one-job machine. As you now know, filtering and softening are two different jobs — this is the one that fixes hard water, and the one no filter can do.
          </p>
        </div>

        {/* Cross-section callout */}
        <div className="mt-16 grid gap-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:gap-16">
          <img
            src={crossSection2Asset.url}
            alt="Cross-section of the AG Water Softener showing ion-exchange resin core and water flow path"
            className="aspect-[4/5] w-full object-contain"
            loading="lazy"
          />
          <div className="self-center">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Inside the unit
            </div>
            <h3 className="mt-3 font-display text-2xl leading-[1.15] sm:text-3xl md:text-[34px]">
              A true ion-exchange resin bed
            </h3>
            <p className="mt-6 text-[15px] leading-[1.7] text-foreground/90">
              The heart of the AG Water Softener is a bed of ion-exchange resin — the same class of tech inside whole-house softeners that homeowners describe as "the best hair product investment" they've made.
            </p>
            <p className="mt-4 text-[15px] leading-[1.7] text-foreground/90">
              As water passes through, the resin captures calcium and magnesium ions and releases harmless sodium ions in their place. The minerals that coat your hair and crust your shower door get pulled out of the water before it ever reaches you.
            </p>
            <p className="mt-4 text-[15px] leading-[1.7] text-foreground/90">
              When the resin fills up, the included salt tank recharges it — about forty minutes every 4 to 5 weeks.
            </p>
            <p className="mt-4 text-[15px] leading-[1.7] text-foreground/90">
              This is the important part no filter does. It's the entire reason the AG Water Softener exists.
            </p>
          </div>
        </div>

        {/* Test-strip proof */}
        <div className="mt-20">
          <div className="mx-auto max-w-[900px] text-center">
            <h3 className="font-display text-2xl leading-[1.15] sm:text-3xl md:text-[38px]">
              Don't take the label's word for it. Test it.
            </h3>
            <p className="mt-6 text-[15px] leading-[1.7] text-foreground/90">
              Every AG Water Softener ships with standard water hardness test strips. Dip one in your tap water today, and another once the AG Water Softener is installed.
            </p>
          </div>

          <figure className="mx-auto mt-12 max-w-[520px]">
            <img
              src={testStripsAsset.url}
              alt="Water hardness test strips showing Before (hard water, orange-red) and After (soft water, yellow) results"
              className="w-full"
              loading="lazy"
            />
            <figcaption className="mt-4 text-center text-[13px] leading-[1.6] text-foreground/85">
              Every unit ships with test strips. The color change is immediate and visible.
            </figcaption>
          </figure>

        </div>

        {/* Comparison */}
        <div className="mt-20">
          <div className="mx-auto max-w-[900px] text-center">
            <h3 className="font-display text-2xl leading-[1.15] sm:text-3xl md:text-[34px]">
              Where the AG Water Softener fits
            </h3>
            <p className="mt-4 text-[14px] leading-[1.6] text-muted-foreground">
              How it compares to shower filters and whole-house softeners.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-[1000px]">
            <table className="w-full table-fixed border-collapse text-sm">
              <colgroup>
                <col style={{ width: "40%" }} />
                <col style={{ width: "22%" }} />
                <col style={{ width: "19%" }} />
                <col style={{ width: "19%" }} />
              </colgroup>
              <thead>
                <tr className="text-left">
                  <th className="border-b border-foreground/80 py-3 pr-2 font-normal text-muted-foreground sm:py-4 sm:pr-4"></th>
                  <th className="border-t-2 border-b-2 border-foreground bg-sage px-1.5 py-3 text-center sm:px-3 sm:py-4">
                    <div className="text-[9px] font-semibold uppercase tracking-[0.15em] text-foreground/70 sm:text-[10px] sm:tracking-[0.2em]">Our pick</div>
                    <div className="mt-1 font-display text-[13px] uppercase leading-tight sm:text-lg md:text-xl">AG Water<br />Softener</div>
                  </th>
                  <th className="border-b border-foreground/80 px-1.5 py-3 text-center text-muted-foreground sm:px-3 sm:py-4">
                    <div className="text-[10px] uppercase leading-tight tracking-[0.1em] sm:text-xs sm:tracking-[0.14em]">Shower<br />Filters</div>
                  </th>
                  <th className="border-b border-foreground/80 px-1.5 py-3 text-center text-muted-foreground sm:px-3 sm:py-4">
                    <div className="text-[10px] uppercase leading-tight tracking-[0.1em] sm:text-xs sm:tracking-[0.14em]">Whole-House<br />Softener</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {compareRows.map((r) => (
                  <tr key={r.label} className="border-b border-border/60">
                    <td className="py-3 pr-2 text-[12px] leading-[1.35] sm:py-4 sm:pr-4 sm:text-[14px]">{r.label}</td>
                    <td className="bg-sage px-1.5 py-3 text-center sm:px-3 sm:py-4"><Dot filled={r.ag} strong /></td>
                    <td className="px-1.5 py-3 text-center sm:px-3 sm:py-4"><Dot filled={r.filter} /></td>
                    <td className="px-1.5 py-3 text-center sm:px-3 sm:py-4"><Dot filled={r.whole} /></td>
                  </tr>
                ))}
                <tr>
                  <td className="py-4 pr-2 text-[12px] leading-[1.35] sm:py-5 sm:pr-4 sm:text-[14px]">Typical cost</td>
                  <td className="border-b-2 border-foreground bg-sage px-1.5 py-4 text-center font-display text-[13px] sm:px-3 sm:py-5 sm:text-lg">$249</td>
                  <td className="px-1.5 py-4 text-center text-[11px] leading-[1.3] text-muted-foreground sm:px-3 sm:py-5 sm:text-sm">$30–$190</td>
                  <td className="px-1.5 py-4 text-center text-[11px] leading-[1.3] text-muted-foreground sm:px-3 sm:py-5 sm:text-sm">$1,500–$6,000<br />installed</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <p className="mx-auto mt-16 max-w-[820px] text-center text-[15px] leading-[1.7] text-foreground/90">
          Whole-house results, at shower-sized commitment. And if your test strip doesn't read soft, you have 60 full days to send it back.
        </p>
        <p className="mx-auto mt-6 max-w-[820px] text-center text-[15px] leading-[1.7] text-foreground/90">
          A whole-house softener's price tag is mostly installation, plumbing runs, and the labor to tie it all together. The AG is the softening part alone, the ion-exchange core that does the actual work, which is why it can cost $249 instead of $2,000.
        </p>

        <div className="mt-10 flex justify-center">
          <a
            href="#top"
            onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            className="inline-flex items-center justify-center bg-black px-8 py-5 text-[12px] font-medium uppercase tracking-[0.14em] text-white transition hover:opacity-90"
          >
            Try The AG Water Softener In Your Shower
          </a>
        </div>
      </div>
    </section>
  );
}

function TestStripCard({ when, caption, tone, stripTone }: { when: string; caption: string; tone: string; stripTone: string }) {
  return (
    <figure>
      <div className="relative aspect-[4/3] w-full overflow-hidden" style={{ backgroundColor: tone }}>
        <div className="absolute inset-0 grid place-items-center">
          <div className="h-24 w-8 rounded-sm shadow-[0_2px_6px_rgba(0,0,0,0.2)]" style={{ backgroundColor: stripTone }} aria-hidden />
        </div>
        <div className="absolute left-4 top-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-background/90">
          {when}
        </div>
      </div>
      <figcaption className="mt-4 text-[13px] leading-[1.6] text-foreground/85">{caption}</figcaption>
    </figure>
  );
}

function Dot({ filled, strong = false }: { filled: boolean; strong?: boolean }) {
  if (filled) {
    return (
      <span
        aria-label="Yes"
        className={`inline-block h-3 w-3 rounded-full ${strong ? "bg-foreground" : "bg-foreground"}`}
      />
    );
  }
  return <span aria-label="No" className="inline-block h-3 w-3 rounded-full border border-foreground/40" />;
}

/* ─────────────────────────────── SECTION 7 — PROOF WALL ─────────────────────────────── */

const PROOF_REVIEWS = [
  { name: "Melissa J.", title: "It finally felt soft again", body: "No matter how much conditioner I used, my hair felt like dry hay — like it just sucked up moisture and spit it out. A couple weeks with soft water and it finally felt soft again. I don't have to hide it in a bun every day just to deal with it." },
  { name: "Jess C.", title: "Waves are waving again", body: "I'm a 2B and hard water minerals used to make my waves limp and frizz out by day two. Now my waves clump beautifully, hold shape all week, and my scalp doesn't feel coated. Wash day is so much easier because there's no mineral buildup to fight through." },
  { name: "Jack M.", title: "My beard says otherwise", body: "I figured this was just another gadget, but my beard says otherwise. It used to feel like sandpaper after every shower, and now it's actually soft. Even my barber noticed. My girlfriend keeps touching it too, so I guess that's a win." },
  { name: "Jasmine", title: "My hair finally feels clean", body: "No matter what shampoo I used, my hair always felt coated and dull. Now it actually feels clean and light again. My curls bounce back instead of falling flat." },
  { name: "Verified customer", title: "The strips don't lie", body: "The included test strips verified the effectiveness of softening my water, and I noticed an immediate difference in my hair and skin." },
  { name: "Verified customer", title: "Hydrated instead of stripped", body: "My hair feels significantly softer and less frizzy. My skin feels hydrated and moisturized instead of tight." },
];

function ProofWall() {
  const [expanded, setExpanded] = useState(false);
  const MOBILE_CAP = 2;
  return (
    <section id="proof" className="border-t border-border/60 bg-surface/40">
      <div className="mx-auto max-w-[1400px] px-5 py-12 md:px-8 md:py-16 lg:py-24">
        <div className="mx-auto max-w-[900px]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Early customer & tester reviews
          </div>
          <h2 className="mt-4 font-display text-3xl leading-[1.05] md:text-4xl lg:text-[46px]">
            What people notice, in their own words
          </h2>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:mt-14 lg:grid-cols-3">
          {PROOF_REVIEWS.map((r, i) => {
            const hideOnMobile = !expanded && i >= MOBILE_CAP;
            return (
              <article
                key={r.title + r.name}
                className={`flex flex-col border border-border/60 bg-background p-6 ${
                  hideOnMobile ? "hidden sm:flex" : ""
                }`}
              >
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {r.name}
                </div>
                <h3 className="mt-3 font-display text-xl italic leading-[1.2]">"{r.title}"</h3>
                <p className="mt-4 text-[14px] leading-[1.65] text-foreground/85">{r.body}</p>
              </article>
            );
          })}
        </div>

        {PROOF_REVIEWS.length > MOBILE_CAP && !expanded && (
          <div className="mt-6 flex justify-center sm:hidden">
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="border border-foreground/70 px-6 py-3 text-[12px] font-medium uppercase tracking-[0.14em] text-foreground transition hover:bg-foreground hover:text-background"
            >
              Show More Reviews
            </button>
          </div>
        )}

        <div className="mt-12 flex flex-col items-center gap-3">
          <a
            href="#top"
            onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            className="inline-flex items-center bg-black px-8 py-5 text-[12px] font-medium uppercase tracking-[0.14em] text-white transition hover:opacity-90"
          >
            I Want This In My Shower
          </a>
          <p className="max-w-[520px] text-center text-[13px] italic text-muted-foreground">
            Installed by you in about 10 minutes, in the one room where your hair and skin meet the water.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────── SECTION 8 removed (After Day One) ─────────────────────────────── */

/* ─────────────────────────────── SECTION 9 — INSTALL & MAINTENANCE ─────────────────────────────── */

function InstallAndMaintenance() {
  return (
    <section id="install" className="border-t border-border/60 bg-surface/40">
      <div className="mx-auto max-w-[1400px] px-5 py-12 md:px-8 md:py-16 lg:py-24">
        <div className="mx-auto max-w-[900px]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Installation
          </div>
          <h2 className="mt-4 font-display text-3xl leading-[1.05] sm:text-4xl md:text-[46px]">
            Installs in about ten minutes
          </h2>
          <p className="mt-8 text-[15px] leading-[1.7] text-foreground/90">
            Everything you need is in the box: hoses, connectors, hardware, and a step-by-step video that assumes you've never installed anything in your life.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          <InstallCard
            n="01"
            title="Hang it on the shower pipe"
            body="Untwist your showerhead, hang the bracket, connect two hoses, and reattach. Most people finish in under ten minutes with their bare hands."
            tone="oklch(0.90 0.012 200)"
            image={installShowerAsset.url}
            alt="Three-step install: mount bracket on shower wall, attach softener, connect hoses."
          />
          <InstallCard
            n="02"
            title="Or set it on the floor"
            body="If you'd rather keep it out of sight, or use it for your sink, the unit can sit in the corner, connected the same way. Same water, same result."
            tone="oklch(0.91 0.014 90)"
            image={installUnderSinkAsset.url}
            alt="AG Water Softener installed under a sink, connected to supply lines."
          />
        </div>

        <p className="mx-auto mt-10 max-w-[820px] text-[15px] leading-[1.7] text-foreground/90">
          When you move out, removal takes about as long as installation, and your shower goes back to exactly how you found it. Nothing to patch or explain at the walkthrough.
        </p>

        {/* Maintenance */}
        <div className="mx-auto mt-16 max-w-[860px] border border-border bg-background p-8 md:p-12">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Maintenance
          </div>
          <h3 className="mt-3 font-display text-xl italic leading-[1.2] sm:text-2xl">
            Yes, there's some maintenance. Here's exactly what it is.
          </h3>
          <p className="mt-6 text-[15px] leading-[1.7] text-foreground/90">
            A true softener needs occasional care, because the resin that captures hardness minerals eventually fills up and has to be rinsed clean with salt water. Every real softener on earth works this way, including the $2,000 ones. Here is exactly what the AG Water Softener asks of you:
          </p>
          <div className="mt-6 text-[13px] font-semibold uppercase tracking-[0.14em]">
            Every four to five weeks, the softener recharges:
          </div>
          <ol className="mt-4 space-y-3 text-[14px] leading-[1.65]">
            <li className="grid grid-cols-[auto_1fr] gap-3">
              <span className="text-muted-foreground tabular-nums">1.</span>
              <span>Pour softener salt into the salt tank</span>
            </li>
            <li className="grid grid-cols-[auto_1fr] gap-3">
              <span className="text-muted-foreground tabular-nums">2.</span>
              <span>Let it soak to form brine</span>
            </li>
            <li className="grid grid-cols-[auto_1fr] gap-3">
              <span className="text-muted-foreground tabular-nums">3.</span>
              <span>Turn the valve to REGEN and run the water</span>
            </li>
          </ol>
          <p className="mt-6 text-[15px] leading-[1.7] text-foreground/90">
            Your hands-on time is about ten minutes. The full recharge takes about forty, and the soaking part happens while you're at work or asleep. Shower normally the rest of the time.
          </p>
          <p className="mt-6 border-t border-border/60 pt-6 text-[15px] leading-[1.7] text-foreground/90">
            If that ritual every month or so sounds like more than soft water is worth, this product isn't for you, and we'd rather say so here than in a return email. If it sounds like a fair trade for hair and skin that behave every single day in between, keep reading.
          </p>
        </div>
      </div>
    </section>
  );
}

function InstallCard({ n, title, body, tone, image, alt }: { n: string; title: string; body: string; tone: string; image?: string; alt?: string }) {
  return (
    <article className="flex flex-col border border-border/60 bg-background">
      {image ? (
        <img src={image} alt={alt || ""} className="aspect-[16/10] w-full object-cover" loading="lazy" />
      ) : (
        <div className="aspect-[16/10] w-full" style={{ backgroundColor: tone }} aria-hidden />
      )}
      <div className="p-6 md:p-8">
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{n}</div>
        <h3 className="mt-3 font-display text-xl leading-[1.2] sm:text-2xl">{title}</h3>
        <p className="mt-4 text-[14px] leading-[1.65] text-foreground/85">{body}</p>
      </div>
    </article>
  );
}




/* ─────────────────────────────── SECTION 11 — FAQ ─────────────────────────────── */

const FAQS = [
  { q: "Will the AG Water Softener lower my water pressure?", a: "The AG Water Softener is engineered for full-flow showering, and pressure preservation was a core design requirement, since it's the most common complaint about lesser shower products." },
  { q: "How do I know the softening claim is real and this isn't another mislabeled filter?", a: "You test it yourself, in your own bathroom, on day one. The AG Water Softener ships with standard water-hardness test strips. Dip one in your tap water and one in the treated water and compare the colors. Hardness strips are an industry-standard measure and they cannot be flattered by marketing. If your treated water doesn't test soft, use the guarantee." },
  { q: "I rent. Will this come down cleanly when I move?", a: "Yes. The AG Water Softener attaches to the shower pipe the same way a showerhead does, or simply sits on the floor. Removal takes minutes and leaves your shower exactly as you found it. Nothing is drilled or glued, and there's no plumbing change for a landlord to notice or a deposit to absorb." },
  { q: "What exactly does the AG Water Softener remove — and what doesn't it?", a: "It removes hardness minerals, calcium and magnesium, through ion exchange — the minerals that coat your hair and crust your shower door. It does not filter chlorine, and we won't pretend otherwise. Chlorine reduction is the job basic shower filters already handle; hardness is the job they can't. If your water report came back hard or very hard, hardness is the half that's been working against your hair and skin." },
  { q: "Does soft water feel slippery at first?", a: "For some people, yes, briefly. That silky feeling is what skin feels like when soap actually rinses away instead of combining with hardness minerals and clinging to you as residue. Research published in the Journal of Investigative Dermatology measured exactly this: hard water leaves significantly more surfactant deposited on skin after washing. What hard water taught you to interpret as \"squeaky clean\" was residue. Most people stop noticing the change within a week and then can't stand hotel hard water afterward." },
  { q: "Does the salt make my shower water salty?", a: "You'll never smell or feel it. Ion exchange swaps hardness minerals for a small amount of sodium, the same trade every whole-house softener makes, and the water remains ordinary soft water. The salt you pour into the tank is used to rinse the resin during regeneration, then drains away." },
  { q: "What are the ongoing costs?", a: "A bag of standard softener salt every few months — that's the only consumable. The ion-exchange resin itself lasts for years with regular recharging, and there's no cartridge subscription waiting to surprise you." },
  { q: "Will it fit my shower?", a: "The AG Water Softener works with standard shower setups and most showerheads, mounts on the pipe or stands on the floor, and includes every hose and connector needed for both options. If your setup turns out to be the rare exception, the 60-day guarantee applies from day one." },
];

function FAQSection() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="border-t border-border/60">
      <div className="mx-auto max-w-[1400px] px-5 py-12 md:px-8 md:py-16 lg:py-24">
        <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] md:gap-16">
          <div>
            <div className="md:sticky md:top-24">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">FAQ</div>
              <h2 className="mt-4 font-display text-4xl leading-[0.95] sm:text-5xl md:text-[56px]">
                Frequently asked questions
              </h2>
              <img
                src={lifestyleShot2Asset.url}
                alt="Woman in profile after a soft-water shower — smooth wet hair, calm skin"
                className="mt-8 aspect-[3/4] w-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
          <div>
            <ul className="divide-y divide-border/60 border-y border-border/60">
              {FAQS.map((f, i) => {
                const isOpen = open === i;
                return (
                  <li key={f.q}>
                    <button
                      onClick={() => setOpen(isOpen ? null : i)}
                      className="grid w-full grid-cols-[1fr_auto] items-center gap-4 py-5 text-left"
                      aria-expanded={isOpen}
                    >
                      <span className="text-[15px]">{f.q}</span>
                      <ChevronDown className={`h-4 w-4 text-muted-foreground transition ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isOpen && <p className="pb-5 pr-8 text-[14px] leading-[1.7] text-foreground/85">{f.a}</p>}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}






/* ─────────────────────────────── SECTION 12 — CLOSING CTA ─────────────────────────────── */

function ClosingSection() {
  const { add } = useCart();
  return (
    <section className="border-t border-border/60">
      <div className="mx-auto max-w-[1400px] px-5 py-12 md:px-8 md:py-16 lg:py-24">
        <div className="mx-auto max-w-[900px]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            The guarantee
          </div>
          <h2 className="mt-4 font-display text-3xl leading-[1.05] sm:text-4xl md:text-[46px]">
            Try it against your own test strip
          </h2>
          <p className="mt-8 text-[15px] leading-[1.7] text-foreground/90">
            Dip a hardness strip in your tap water today. Install the AG, then dip another strip. If the second strip doesn't read soft, you have 60 full days to send it back for a complete refund. Softer hair and skin in the meantime.
          </p>
          <div className="mt-8">
            <button
              onClick={() =>
                add({
                  id: "ag-softener",
                  title: PRODUCT_TITLE,
                  variantLabel: "Single unit",
                  price: PRICE,
                  image: "/assets/cart-main.png",
                })
              }
              className="bg-black px-8 py-5 text-[12px] font-medium uppercase tracking-[0.14em] text-white transition hover:opacity-90"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────── FILTER FREQUENCY DROPDOWN (feature-flagged) ─────────────────────────────── */

const FREQUENCIES = [
  { id: "3m", label: "Every 3 months", note: "Recommended" },
  { id: "4m", label: "Every 4 months" },
  { id: "6m", label: "Every 6 months" },
];

function FilterFrequencyDropdown() {
  const [open, setOpen] = useState(false);
  const [freq, setFreq] = useState(FREQUENCIES[0]);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  return (
    <div ref={ref} className="relative mt-6 inline-block text-left">
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); setOpen((o) => !o); }}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        aria-expanded={open}
      >
        {freq.label} <ChevronDown className={`h-3 w-3 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-56 border border-border bg-background shadow-lg">
          <ul className="py-1 text-left text-sm">
            {FREQUENCIES.map((f) => (
              <li key={f.id}>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setFreq(f); setOpen(false); }}
                  className={`flex w-full items-center justify-between px-3 py-2 hover:bg-surface ${freq.id === f.id ? "font-medium" : ""}`}
                >
                  <span>{f.label}</span>
                  {f.note && <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{f.note}</span>}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────── BEAUTY MARQUEE ─────────────────────────────── */

function BeautyMarquee() {
  const text = "IT'S NOT YOUR HAIR. IT'S YOUR WATER.";
  return (
    <section aria-label={text} className="overflow-hidden border-y border-border/60 bg-sage py-10 md:py-16">
      <div className="flex whitespace-nowrap" style={{ animation: "marquee 40s linear infinite" }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <span key={i} className="font-display px-8 text-6xl leading-none tracking-tight sm:text-7xl md:text-[120px]">
            {text} <span className="mx-6 inline-block align-middle">✻</span>
          </span>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────────── WATER REPORT MODAL (unused; kept for reuse) ─────────────────────────────── */

function WaterReportModal() {
  const [open, setOpen] = useState(false);
  const [zip, setZip] = useState("");
  const [submitted, setSubmitted] = useState(false);
  useEffect(() => {
    const onOpen = () => { setOpen(true); setSubmitted(false); };
    document.addEventListener("open-water-report", onOpen);
    return () => document.removeEventListener("open-water-report", onOpen);
  }, []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-foreground/40 p-4" role="dialog" aria-modal="true" aria-label="Get your water report">
      <div className="relative w-full max-w-md bg-background p-8 shadow-xl">
        <button aria-label="Close" onClick={() => setOpen(false)} className="absolute right-3 top-3 grid h-9 w-9 place-items-center hover:bg-surface">
          <X className="h-4 w-4" />
        </button>
        {!submitted ? (
          <>
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Water Report</div>
            <h3 className="mt-3 font-display text-3xl leading-[1.05]">See what's in<br />your water</h3>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Enter your zip code and we'll send a personalized report of the hardness likely present in your tap water.
            </p>
            <form
              onSubmit={(e) => { e.preventDefault(); if (zip.trim().length >= 3) setSubmitted(true); }}
              className="mt-6 grid grid-cols-[1fr_auto] gap-2"
            >
              <input
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={10}
                placeholder="Enter your zip code"
                className="border border-border bg-transparent px-3 py-3 text-sm placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
              />
              <button type="submit" className="bg-foreground px-5 text-sm font-medium text-background hover:opacity-90">
                Send
              </button>
            </form>
            <p className="mt-4 text-[11px] text-muted-foreground">We'll never share your info. Unsubscribe any time.</p>
          </>
        ) : (
          <>
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Water Report</div>
            <h3 className="mt-3 font-display text-3xl leading-[1.05]">Check your<br />inbox</h3>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Your report for {zip} is on its way.
            </p>
            <button onClick={() => setOpen(false)} className="mt-6 w-full bg-foreground py-3 text-sm font-medium text-background hover:opacity-90">
              Close
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// Suppress unused-import warnings for Pass 2 reuse
void Search; void ThumbsDown; void ThumbsUp;
