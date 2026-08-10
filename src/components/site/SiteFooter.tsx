export function SiteFooter() {
  const shop = ["The AG Water Softener"];
  const support: { label: string; href: string }[] = [
    { label: "Shipping", href: "/shipping" },
    { label: "Returns and refunds", href: "/returns" },
    { label: "Contact", href: "/contact" },
  ];
  const guides: { label: string; href: string }[] = [
    { label: "Shower filter vs water softener", href: "/shower-filter-vs-water-softener" },
    { label: "Do shower filters work for hard water?", href: "/do-shower-filters-work-for-hard-water" },
    { label: "Water softener for an apartment", href: "/water-softener-for-apartment" },
    { label: "Portable water softener for your shower", href: "/portable-water-softener-for-shower" },
    { label: "Shower head water softeners", href: "/shower-head-water-softener" },
    { label: "Jolie alternative for hard water", href: "/jolie-alternative-for-hard-water" },
    { label: "ShowerStick vs AG compared", href: "/showerstick-alternative" },
    { label: "Arius vs AG compared", href: "/arius-vs-ag-water-softener" },
    { label: "Canopy alternative for hard water", href: "/canopy-alternative-for-hard-water" },
  ];

  return (
    <footer className="border-t border-border/60 bg-surface">
      <div className="mx-auto grid max-w-[1400px] gap-10 px-4 py-14 sm:grid-cols-2 md:grid-cols-3 md:px-8">
        <FooterCol title="SHOP" items={shop} />
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Support</div>
          <ul className="mt-4 space-y-2 text-sm">
            {support.map((s) => (
              <li key={s.href}><a href={s.href} className="hover:opacity-70">{s.label}</a></li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Guides</div>
          <ul className="mt-4 space-y-2 text-sm">
            {guides.map((g) => (
              <li key={g.href}><a href={g.href} className="hover:opacity-70">{g.label}</a></li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-border/60">
        <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-muted-foreground">
            <div>© {new Date().getFullYear()} AG Water Softener — a GRN Labs product</div>
            <div className="flex gap-4">
              <a href="#">US / EN</a>
              <a href="#">Terms + Conditions</a>
              <a href="#">Privacy Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{title}</div>
      <ul className="mt-4 space-y-2 text-sm">
        {items.map((i) => (
          <li key={i}><a href="#" className="hover:opacity-70">{i}</a></li>
        ))}
      </ul>
    </div>
  );
}
