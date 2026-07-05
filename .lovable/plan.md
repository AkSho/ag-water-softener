## Goal

Move the four CDN-hosted images into the repo at `public/assets/` and update `src/routes/index.tsx` to reference them by local path.

## Files to materialize

Download each asset from its CDN URL into `public/assets/`:

- `public/assets/beard_hard_water.png` (from `beard_hard_water.png.asset.json`)
- `public/assets/hair_hard_water.png` (from `hair_hard_water.png.asset.json`)
- `public/assets/showerhead_hard_water.png` (from `showerhead_hard_water.png.asset.json`)
- `public/assets/lifestyle_shot-2.png` (from `lifestyle_shot-2.png.asset.json`)

Fetch via `curl` using the `url` field in each pointer JSON.

## Code changes

In `src/routes/index.tsx`:

- Remove the four `import ... from "@/assets/*.png.asset.json"` lines.
- Replace each `<img src={xxxAsset.url} ...>` with `<img src="/assets/<filename>.png" ...>` (files in `public/` are served from the site root).

## Cleanup

Delete the four `.asset.json` pointer files from `src/assets/` after references are switched. (Skipping `lovable-assets delete` so the CDN copies remain intact in case of revert; user can prune later.)

## Verification

Run typecheck; visually confirm images still render on `/`.

## Note

This is the reverse of the standard Lovable pattern (which externalizes binaries to CDN to keep the repo light). Committing ~9 MB of PNGs into `public/assets/` will bloat the repo — proceeding because you explicitly asked.
