## Goal

Add `?band=hard` / `?band=veryhard` contextual pre-head above the H1 in the hero, using TanStack Router's typed search params so it works under SSR on Vercel.

## Changes

**`src/routes/index.tsx`**

1. Add `validateSearch` to the `/` route:
   ```ts
   type BandSearch = { band?: "hard" | "veryhard" };
   validateSearch: (raw): BandSearch => {
     const b = typeof raw.band === "string" ? raw.band.toLowerCase() : undefined;
     return b === "hard" || b === "veryhard" ? { band: b } : {};
   },
   ```
   Silently drops `soft`, `moderate`, unknown values, and missing param — component just sees `band === undefined`.

2. In `ProductHero`, read it with `Route.useSearch()` and render the pre-head between the italic review quote and the `<h1>`:
   ```tsx
   const { band } = Route.useSearch();
   const bandLine =
     band === "hard" ? "Your zip tested hard. This is the fix for exactly that." :
     band === "veryhard" ? "Your zip tested very hard. This is the fix for exactly that." :
     null;
   ```
   ```tsx
   {bandLine && (
     <p className="mb-3 font-display text-[13px] uppercase tracking-[0.14em] text-foreground/80">
       {bandLine}
     </p>
   )}
   ```
   Small, uppercase, tracked — feels like an eyebrow/pre-head, not an alert banner. Matches the existing display type used elsewhere in the hero.

3. No zip captured, stored, or displayed. No cart / drawer / route changes.

## Verify

- Sandbox build passes.
- Playwright hits `/`, `/?band=hard`, `/?band=veryhard`, `/?band=soft`, `/?band=bogus` — screenshot each; confirm the line appears only on the two intended URLs and the H1 renders on first paint (SSR — no hydration flash).

## Out of scope

Water Test repo, cart drawer, home route path, anything else in the plan file's earlier steps (Vercel preset already shipped in the prior turn).
