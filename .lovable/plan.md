# Commit real image files into `public/assets`

Right now all 12 product/hero images live only as `.asset.json` pointers to Lovable's CDN (`/__l5e/assets-v1/...`). GitHub gets the JSON pointers, not the actual PNGs. This plan puts the real binaries in the repo so `AkSho/ag-water-softener` and Vercel serve them independently of the Lovable CDN.

## Steps

1. **Download binaries from the CDN** for each of the 12 assets in `src/assets/*.png.asset.json` and save them to `public/assets/<filename>.png` (e.g. `public/assets/hero.png`). Filenames match the `original_filename` in each pointer.

2. **Rewrite `src/routes/index.tsx`** imports (lines ~50–61): remove the 12 `.asset.json` imports and replace usages (`heroAsset.url`, etc.) with plain string paths like `/assets/hero.png`. Vercel serves `public/` at the site root, so these URLs work in prod and dev.

3. **Delete the `.asset.json` pointer files** in `src/assets/` since nothing imports them anymore. Leave the `src/assets/` directory (empty) or remove it — will remove if empty.

4. **Verify** with `bunx tsgo --noEmit` and a quick `bun run build` to confirm the images resolve and no dangling imports remain.

## Notes

- No CDN deletion — the pointers on Lovable's CDN stay live (harmless; previous deploys keep working).
- `public/assets/` files add ~a few MB to the git repo; that's the tradeoff for Vercel-native hosting.
- No behavior/visual changes; same images, just served from `agsoftener.com/assets/*` instead of the Lovable CDN.
- Does not touch `?band=` logic, cart drawer, or any other route.
