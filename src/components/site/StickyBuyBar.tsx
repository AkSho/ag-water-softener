import { useEffect, useState } from "react";
import { useCart, money } from "@/lib/cart";

type Props = {
  price: number;
  productId: string;
  productTitle: string;
  variantLabel: string;
  image?: string;
};

/**
 * Mobile + tablet sticky Add-to-Cart bar. Appears once the hero (element
 * with `data-hero`) scrolls out of the viewport. Hidden when the cart
 * drawer is open. Absent at lg (≥1024px).
 */
export function StickyBuyBar({
  price,
  productId,
  productTitle,
  variantLabel,
  image,
}: Props) {
  const { add, isOpen } = useCart();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = document.querySelector("[data-hero]");
    if (!hero) return;
    const io = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 },
    );
    io.observe(hero);
    return () => io.disconnect();
  }, []);

  if (!visible || isOpen) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3">
        <div className="min-w-0">
          <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            60-day guarantee
          </div>
          <div className="font-display text-lg leading-none tabular-nums">
            {money(price)}
          </div>
        </div>
        <button
          onClick={() =>
            add({
              id: productId,
              title: productTitle,
              variantLabel,
              price,
              image,
            })
          }
          className="ml-auto shrink-0 bg-foreground px-6 py-3.5 text-[12px] font-medium uppercase tracking-[0.16em] text-background transition hover:opacity-90"
        >
          Add to cart
        </button>
      </div>
    </div>
  );
}
