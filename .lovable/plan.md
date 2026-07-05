## Goal

Add the uploaded quick-connect exploded-view image to the hero gallery, committed at `public/assets/quick-connect.png` and referenced by local path in `src/routes/index.tsx`.

## Steps

1. **Copy image**: `cp /mnt/user-uploads/Screenshot_2026-07-05_at_3.00.47_PM.png public/assets/quick-connect.png`
2. **In `src/routes/index.tsx`** (around lines 51–74):
   - Add: `const quickConnectAsset = { url: "/assets/quick-connect.png" };` alongside the other asset consts.
   - Add a new `GALLERY` entry as `g6`: `{ key: "g6", src: quickConnectAsset.url, alt: "Quick-Connect Water Softener — exploded view showing 4-ring seal and no-leakage fitting" }`. Insert it as the second slide (right after `g1` hero) so the exploded/feature detail appears early in the carousel — placement is a small judgment call; if you'd prefer it at the end, say so.
3. **Verification**: typecheck; visually confirm the new slide appears in the mobile carousel and desktop stack on `/`.

## Out of scope

No cropping/resizing, no other layout changes, no changes to gallery UI.
