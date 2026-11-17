import type { FontPair } from '@smartapp/core';

import type { CssVarsObject } from './css-vars';

// Self-hosted font pairs (D37). property-fonts.css declares @font-face rules only: a browser
// downloads a family only when a page's active CSS uses it.
const SANS = 'ui-sans-serif, system-ui, sans-serif';
const SERIF = 'ui-serif, Georgia, serif';

export const FONT_PAIR_FAMILIES: Record<
  FontPair,
  { readonly heading: string; readonly body: string }
> = {
  malinaw: {
    heading: `'Plus Jakarta Sans Variable', ${SANS}`,
    body: `'Plus Jakarta Sans Variable', ${SANS}`,
  },
  friendly: { heading: `'Fredoka Variable', ${SANS}`, body: `'Nunito Variable', ${SANS}` },
  street: {
    heading: `'Bricolage Grotesque Variable', ${SANS}`,
    body: `'DM Sans Variable', ${SANS}`,
  },
  cafe: { heading: `'Fraunces Variable', ${SERIF}`, body: `'Figtree Variable', ${SANS}` },
  elegant: {
    heading: `'Playfair Display Variable', ${SERIF}`,
    body: `'Manrope Variable', ${SANS}`,
  },
  bakery: { heading: `'Young Serif', ${SERIF}`, body: `'Nunito Variable', ${SANS}` },
  playful: { heading: `'Baloo 2 Variable', ${SANS}`, body: `'Nunito Variable', ${SANS}` },
  modern: { heading: `'Sora Variable', ${SANS}`, body: `'Outfit Variable', ${SANS}` },
  bold: {
    heading: `'Unbounded Variable', ${SANS}`,
    body: `'Plus Jakarta Sans Variable', ${SANS}`,
  },
  homey: {
    heading: `'Young Serif', ${SERIF}`,
    body: `'Plus Jakarta Sans Variable', ${SANS}`,
  },
};

/** The pair as the two font variables every page reads: `--font-sans` (body) and `--font-heading`. */
export function fontPairVars(pair: FontPair): CssVarsObject {
  const families = FONT_PAIR_FAMILIES[pair];
  return { '--font-sans': families.body, '--font-heading': families.heading };
}
