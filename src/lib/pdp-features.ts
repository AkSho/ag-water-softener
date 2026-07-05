// Toggles for buy-box components carried over from the previous PDP.
// Kept for easy re-enablement — AG Water Softener launches as a single SKU
// at a single price with no subscription and no finish variants.
export const PDP_FEATURES = {
  subscription: false,
  finishes: false,
  filterFrequency: false,
} as const;
