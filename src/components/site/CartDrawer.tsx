import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCart, money } from "@/lib/cart";
import { PDP_FEATURES } from "@/lib/pdp-features";
import { Minus, Plus, X } from "lucide-react";

const SPARE_ID = "ag-softener-spare";

export function CartDrawer() {
  const { isOpen, close, items, updateQty, remove, subtotal, add } = useCart();
  const hasMain = items.some((i) => i.id.startsWith("ag-softener") && i.id !== SPARE_ID);
  const hasSpare = items.some((i) => i.id === SPARE_ID);
  return (
    <Sheet open={isOpen} onOpenChange={(o) => (o ? null : close())}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 border-l border-border/60 bg-background p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border/60 px-6 py-5">
          <SheetTitle className="font-display text-lg">YOUR CART</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="grid h-full place-items-center text-center text-sm text-muted-foreground">
              Your cart is empty.
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {items.map((it) => (
                <li key={it.id} className="grid grid-cols-[72px_1fr_auto] gap-4 py-4">
                  {it.image ? (
                    <img src={it.image} alt={it.title} className="aspect-square object-cover" loading="lazy" />
                  ) : (
                    <div className="aspect-square bg-surface" aria-hidden />
                  )}
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{it.title}</div>
                    <div className="text-xs text-muted-foreground">{it.variantLabel}</div>
                    <div className="mt-2 inline-flex items-center border border-border">
                      <button aria-label="Decrease" className="p-1.5" onClick={() => updateQty(it.id, it.quantity - 1)}>
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="min-w-6 text-center text-xs tabular-nums">{it.quantity}</span>
                      <button aria-label="Increase" className="p-1.5" onClick={() => updateQty(it.id, it.quantity + 1)}>
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm tabular-nums">{money(it.price * it.quantity)}</div>
                    <button className="mt-2 text-xs text-muted-foreground hover:text-foreground" onClick={() => remove(it.id)}>
                      <X className="inline h-3 w-3" /> Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-border/60 px-6 py-5">
          {PDP_FEATURES.spareCartridge && hasMain && !hasSpare && (
            <div className="mb-4 border-2 border-foreground/80 bg-surface p-4">
              <div className="mb-1 font-display text-sm font-semibold tracking-wide text-foreground">
                ADD A SPARE SOFTENER
              </div>
              <p className="mb-3 text-sm leading-snug text-foreground">
                One softens while the other soaks and skip the recharge downtime entirely.
              </p>
              <button
                onClick={() =>
                  add({
                    id: SPARE_ID,
                    title: "Spare Softener Cartridge",
                    variantLabel: "Backup unit",
                    price: 39,
                  })
                }
                className="w-full border border-foreground bg-foreground py-2 text-xs font-medium tracking-wide text-background transition hover:opacity-90"
              >
                ADD SPARE — {money(39)}
              </button>
            </div>
          )}
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium tabular-nums">{money(subtotal)}</span>
          </div>
          <p className="mb-3 text-[11px] text-muted-foreground">Shipping and taxes calculated at checkout.</p>
          <button
            disabled
            className="w-full bg-foreground py-3 text-sm font-medium tracking-wide text-background transition hover:opacity-90 disabled:opacity-40"
          >
            CHECKOUT OPENING SOON
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
