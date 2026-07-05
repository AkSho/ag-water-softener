import { ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart";

export function SiteHeader() {
  const { open, count } = useCart();
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background">
      <div className="mx-auto grid h-16 max-w-[1400px] grid-cols-[auto_1fr_auto] items-center gap-4 px-4 md:h-20 md:px-8">
        {/* logo */}
        <a href="/" className="flex flex-col leading-none" aria-label="AG Water Softener — Home">
          <span
            className="font-display text-2xl tracking-[0.02em] sm:text-3xl line-clamp-3"
            style={{ textTransform: "none" }}
          >
            AG
          </span>
          <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Water Softener
          </span>
        </a>

        {/* center spacer */}
        <div aria-hidden />

        {/* right */}
        <button
          onClick={open}
          aria-label={`Your Cart, ${count} items`}
          className="relative inline-flex items-center gap-2 p-1 text-[12px] font-medium uppercase tracking-[0.14em] hover:opacity-70"
        >
          <span>Your Cart</span>
          <span className="relative inline-flex">
            <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-foreground px-1 text-[10px] font-medium text-background">
                {count}
              </span>
            )}
          </span>
        </button>
      </div>
    </header>
  );
}
