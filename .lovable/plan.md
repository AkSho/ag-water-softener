## 1. Emoji rail markers on black

`src/routes/index.tsx` — `WhatSoftWaterChanges` timeline marker span. Change classes from `bg-background ... ring-1 ring-border` to **`bg-foreground text-background ring-1 ring-foreground`** so each emoji sits on a black disc. Size/position unchanged.

## 2. Reviews CTA rename

`src/routes/index.tsx` line 854: `Show all {PROOF_REVIEWS.length} reviews` → **`Show More Reviews`**.

## 3. Lifestyle image inside FAQ

Upload `lifestyle_shot-2.png` via `lovable-assets` → import in `src/routes/index.tsx`. Restructure `FAQSection` inner container into a **2-column grid** on `md+` (`grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]`, gap-12):

- Left: `<img>` at `aspect-[3/4]`, `object-cover`, `sticky top-24` so it stays visible as the accordion scrolls.
- Right: the existing FAQ eyebrow + heading + accordion.
- Mobile: single column — image renders full-width above the eyebrow.

## Files

- `src/routes/index.tsx` — marker classes, CTA copy, FAQ layout + image import.
- `src/assets/lifestyle_shot-2.png.asset.json` (new)
