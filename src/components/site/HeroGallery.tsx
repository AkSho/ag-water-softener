import { useEffect, useRef, useState } from "react";

export type HeroGalleryItem = {
  key: string;
  src: string;
  alt: string;
  contain?: boolean;
  overlay?: React.ReactNode;
};

type Props = {
  items: HeroGalleryItem[];
};

/**
 * Mobile + tablet portrait: horizontally swipeable scroll-snap carousel with
 * dot pagination.
 * Desktop (lg+): the existing vertically stacked column of images.
 */
export function HeroGallery({ items }: Props) {
  return (
    <>
      <MobileCarousel items={items} />
      <DesktopStack items={items} />
    </>
  );
}

function MobileCarousel({ items }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const root = trackRef.current;
    if (!root) return;
    const slides = Array.from(root.querySelectorAll<HTMLElement>("[data-slide]"));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && e.intersectionRatio > 0.6) {
            const idx = slides.indexOf(e.target as HTMLElement);
            if (idx >= 0) setActive(idx);
          }
        });
      },
      { root, threshold: [0.6, 0.9] },
    );
    slides.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [items.length]);

  const scrollTo = (i: number) => {
    const root = trackRef.current;
    if (!root) return;
    const slide = root.querySelectorAll<HTMLElement>("[data-slide]")[i];
    slide?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
  };

  return (
    <div className="lg:hidden">
      <div
        ref={trackRef}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
        style={{ scrollbarWidth: "none" }}
      >
        {items.map((g, idx) => (
          <div
            key={g.key}
            data-slide
            className="w-full shrink-0 snap-center"
            aria-roledescription="slide"
            aria-label={`${idx + 1} of ${items.length}: ${g.alt}`}
          >
            {g.overlay}
            <div className="relative aspect-square bg-muted">
              <img
                src={g.src}
                alt={g.alt}
                className={`absolute inset-0 h-full w-full ${g.contain ? "object-contain" : "object-cover"}`}
                loading={idx === 0 ? "eager" : "lazy"}
                fetchPriority={idx === 0 ? "high" : "auto"}
                draggable={false}
              />
            </div>
          </div>
        ))}
      </div>
      {/* Dot pagination */}
      <div
        role="tablist"
        aria-label="Product images"
        className="mt-3 flex items-center justify-center gap-1.5"
      >
        {items.map((_, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={i === active}
            aria-label={`Show image ${i + 1}`}
            onClick={() => scrollTo(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === active ? "w-6 bg-foreground" : "w-1.5 bg-foreground/25"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function DesktopStack({ items }: Props) {
  return (
    <div className="hidden space-y-4 lg:block">
      {items.map((g, idx) => (
        <div key={g.key} aria-label={g.alt}>
          {g.overlay}
          <div className="relative aspect-square w-full overflow-hidden bg-muted">
            <img
              src={g.src}
              alt={g.alt}
              className={`absolute inset-0 h-full w-full ${g.contain ? "object-contain" : "object-cover"}`}
              loading={idx === 0 ? "eager" : "lazy"}
              fetchPriority={idx === 0 ? "high" : "auto"}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
