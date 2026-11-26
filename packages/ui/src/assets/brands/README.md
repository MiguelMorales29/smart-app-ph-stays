# Payment brand marks

`BrandIcon` (packages/ui/src/compositions/brand-icon.tsx) shows GCash, Maya and bank marks only from
the brands' **official** files, unaltered, and only to say which payment method an owner accepts
(verdict 2, D94). Until a file is added here, a neutral wallet or bank icon is shown instead.

To add one:

1. Get the official mark from the brand's press or brand kit page (GCash, Maya, each bank).
2. Save it here as `gcash.svg`, `maya.svg` or `bank-<code>.svg`, without editing it.
3. Import it in `brand-icon.tsx` and add it to `OFFICIAL_MARKS`.
4. Add the brand, its source link and its usage terms to `TRADEMARKS.md` at the repo root.
