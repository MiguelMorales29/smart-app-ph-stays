/**
 * Property palette: turns an owner's look (60/30/10 + brand accent) into readable OKLCH CSS tokens.
 * Pure maths (OKLab/OKLCH and WCAG 2 contrast), no external dependencies.
 * Storefront is light-only (D36); words and button lightness adjust so every pair passes WCAG AA.
 */
export interface Oklch {
  readonly l: number;
  readonly c: number;
  readonly h: number;
}

export interface PropertyLookInput {
  readonly brandColor: string;
  readonly pageColor?: string | null | undefined;
  readonly cardColor?: string | null | undefined;
  readonly accentColor?: string | null | undefined;
}

export interface AccentRole {
  readonly fill: string;
  readonly foreground: string;
  readonly hover: string;
  readonly text: string;
  readonly soft: string;
  readonly softForeground: string;
}

export interface PropertyPalette {
  /** The page (60): the owner's page colour, or neutral off-white. */
  readonly property60: string;
  /** Cards, sheets and bars (30): the owner's card colour, or white. */
  readonly property30: string;
  /** Body text on the cards (30), and on the page when both share a lightness side. */
  readonly foreground: string;
  /** The brand (10): filled buttons and active indicators. */
  readonly property10: string;
  readonly property10Foreground: string;
  readonly property10Hover: string;
  /** Brand-coloured text and rings on 60 and 30 (prices, links, focus). */
  readonly property10Text: string;
  /** A soft brand tint (chips, selected rows) and the readable text on it. */
  readonly property10Soft: string;
  readonly property10SoftForeground: string;
  /** Secondary brand accent (from look.accentColor), guarded for contrast. */
  readonly brandAccent: string;
  readonly brandAccentForeground: string;
  readonly brandAccentHover: string;
  readonly brandAccentText: string;
  readonly brandAccentSoft: string;
  readonly brandAccentSoftForeground: string;
  /** Only with a standalone page colour: quiet fills and lines in the page's hue. */
  readonly tint: { readonly muted: string; readonly border: string } | null;
  /** True when the cards (30) are dark (e.g. an owner picked a dark card colour). */
  readonly dark: boolean;
  /** True when page and cards sit on opposite lightness sides. */
  readonly mixed: boolean;
  /** Words, captions and brand-coloured links straight on the page (60). */
  readonly page: { readonly foreground: string; readonly muted: string; readonly link: string };
  /** Captions on the cards (4.5:1 on property30). */
  readonly cardMuted: string;
}

export const DEFAULT_BRAND_COLOR = '#2866EE';
export const DEFAULT_BRAND_ACCENT_COLOR = '#7ED6AC';

/** Colour presets for quick palette testing; includes a very light and very dark swatch. */
export const BRAND_COLOR_PRESETS = [
  DEFAULT_BRAND_COLOR,
  '#008481',
  '#6167C6',
  '#BF4700',
  '#FFE600',
  '#0B1736',
] as const;

export const PALETTE_WHITE = 'oklch(1 0 0)';
export const PALETTE_BLACK = 'oklch(0.145 0 0)';
export const PALETTE_LIGHT_TEXT = 'oklch(0.985 0 0)';

const MIN_TEXT_CONTRAST = 4.5;
const MIN_UI_CONTRAST = 3;
const MAX_DARKEN = 0.2;
const DARKEN_STEP = 0.005;
const LIGHT_BRAND = 0.7;
const HOVER_STEP = 0.06;
// A small margin so rounded OKLCH values printed to CSS still clear 4.5:1 when re-parsed.
const READABLE_MARGIN = 0.1;

type Rgb = readonly [number, number, number];

function srgbToLinear(v: number): number {
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function linearToSrgb(v: number): number {
  return v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
}

function oklchToLinearRgb({ l, c, h }: Oklch): Rgb {
  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);
  const l1 = l + 0.3963377774 * a + 0.2158037573 * b;
  const m1 = l - 0.1055613458 * a - 0.0638541728 * b;
  const s1 = l - 0.0894841775 * a - 1.291485548 * b;
  const l3 = l1 * l1 * l1;
  const m3 = m1 * m1 * m1;
  const s3 = s1 * s1 * s1;
  return [
    4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3,
    -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3,
    -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3,
  ];
}

function linearRgbToOklch([r, g, b]: Rgb): Oklch {
  const l1 = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m1 = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s1 = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const l = 0.2104542553 * l1 + 0.793617785 * m1 - 0.0040720468 * s1;
  const a = 1.9779984951 * l1 - 2.428592205 * m1 + 0.4505937099 * s1;
  const bb = 0.0259040371 * l1 + 0.7827717662 * m1 - 0.808675766 * s1;
  const c = Math.sqrt(a * a + bb * bb);
  const h = c < 1e-4 ? 0 : ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360;
  return { l, c, h };
}

function inGamut(rgb: Rgb): boolean {
  return rgb.every((v) => v >= -1e-4 && v <= 1 + 1e-4);
}

/** Lowers chroma until the colour fits in sRGB, so printed OKLCH matches what renders. */
function toGamut(color: Oklch): Oklch {
  const l = Math.min(1, Math.max(0, color.l));
  if (inGamut(oklchToLinearRgb({ ...color, l }))) return { ...color, l };
  let lo = 0;
  let hi = color.c;
  for (let i = 0; i < 24; i += 1) {
    const mid = (lo + hi) / 2;
    if (inGamut(oklchToLinearRgb({ l, c: mid, h: color.h }))) lo = mid;
    else hi = mid;
  }
  return { l, c: lo, h: color.h };
}

function relativeLuminance(color: Oklch): number {
  const [r, g, b] = oklchToLinearRgb(toGamut(color)).map((v) => Math.min(1, Math.max(0, v)));
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
}

export function hexToOklch(hex: string): Oklch | null {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  const digits = match?.[1];
  if (!digits) return null;
  const full =
    digits.length === 3
      ? digits
          .split('')
          .map((d) => d + d)
          .join('')
      : digits;
  const channel = (i: number): number => srgbToLinear(parseInt(full.slice(i, i + 2), 16) / 255);
  return linearRgbToOklch([channel(0), channel(2), channel(4)]);
}

/** OKLCH of an 8-bit sRGB pixel (0 to 255 per channel). */
export function rgbToOklch(r: number, g: number, b: number): Oklch {
  return linearRgbToOklch([srgbToLinear(r / 255), srgbToLinear(g / 255), srgbToLinear(b / 255)]);
}

export function parseOklch(value: string): Oklch | null {
  const match = /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/[^)]*)?\)$/.exec(value.trim());
  if (!match?.[1] || !match[2] || !match[3]) return null;
  return { l: Number(match[1]), c: Number(match[2]), h: Number(match[3]) };
}

function parseColor(value: string): Oklch | null {
  return value.trim().startsWith('oklch(') ? parseOklch(value) : hexToOklch(value);
}

const round = (n: number, digits: number): number => {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
};

export function formatOklch(color: Oklch): string {
  const fitted = toGamut(color);
  return `oklch(${round(fitted.l, 3)} ${round(fitted.c, 3)} ${round(fitted.h, 1)})`;
}

/** The sRGB hex of an OKLCH colour (gamut-mapped). */
export function oklchToHex(color: Oklch): string {
  const rgb = oklchToLinearRgb(toGamut(color));
  return `#${rgb
    .map((v) =>
      Math.round(Math.min(1, Math.max(0, linearToSrgb(Math.min(1, Math.max(0, v))))) * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}

/** WCAG 2 contrast ratio of two colours (hex or `oklch(l c h)` strings); 1 when either can't be read. */
export function contrastRatio(a: string, b: string): number {
  const ca = parseColor(a);
  const cb = parseColor(b);
  if (!ca || !cb) return 1;
  const la = relativeLuminance(ca);
  const lb = relativeLuminance(cb);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function contrastOf(a: Oklch, b: string): number {
  return contrastRatio(formatOklch(a), b);
}

function darkenForWhite(base: Oklch, floor: number): Oklch | null {
  for (let l = base.l; l >= floor; l -= DARKEN_STEP) {
    const candidate = toGamut({ ...base, l });
    if (contrastOf(candidate, PALETTE_WHITE) >= MIN_TEXT_CONTRAST) return candidate;
  }
  return null;
}

function firstReadable(base: Oklch, against: string, step: number, min: number): Oklch | null {
  for (let l = base.l; l >= 0 && l <= 1; l += step) {
    const candidate = toGamut({ ...base, l });
    if (contrastOf(candidate, against) >= min) return candidate;
  }
  return null;
}

function untilReadable(base: Oklch, against: string, direction: 'darker' | 'lighter'): Oklch {
  const step = direction === 'darker' ? -DARKEN_STEP : DARKEN_STEP;
  return (
    firstReadable(base, against, step, MIN_TEXT_CONTRAST + READABLE_MARGIN) ??
    firstReadable(base, against, step, MIN_TEXT_CONTRAST) ??
    toGamut({ ...base, l: direction === 'darker' ? 0.2 : 0.9 })
  );
}

/** Black or white text, whichever reads better on `bg`; every colour has one at 4.5:1 or more. */
function wordsOn(bg: Oklch): { text: string; dark: boolean } {
  const onWhite = contrastOf(bg, PALETTE_LIGHT_TEXT);
  const onBlack = contrastOf(bg, PALETTE_BLACK);
  if (onWhite <= onBlack) return { text: PALETTE_BLACK, dark: false };
  return { text: onWhite >= MIN_TEXT_CONTRAST ? PALETTE_LIGHT_TEXT : PALETTE_WHITE, dark: true };
}

/** A quiet grey in the surface's hue that still reads at 4.5:1 (captions, hints). */
function mutedOn(bg: Oklch, dark: boolean): string {
  const start: Oklch = { l: dark ? 0.78 : 0.48, c: Math.min(0.02, bg.c), h: bg.h };
  return formatOklch(untilReadable(start, formatOklch(bg), dark ? 'lighter' : 'darker'));
}

/** Resolves a brand or accent colour into contrast-checked fill, hover, text, and soft tint tokens. */
function resolveAccentRole(
  base: Oklch,
  context: {
    readonly page: Oklch;
    readonly card: Oklch;
    readonly pageHex: string;
    readonly cardHex: string;
    readonly linkOn: Oklch;
    readonly dark: boolean;
    readonly mixed: boolean;
    readonly pageTinted: boolean;
  },
): AccentRole {
  const keepLight = base.l >= LIGHT_BRAND && contrastOf(base, PALETTE_BLACK) >= MIN_TEXT_CONTRAST;
  let fill = keepLight ? null : darkenForWhite(base, Math.max(0, base.l - MAX_DARKEN));
  let foreground = PALETTE_WHITE;
  if (!fill) {
    if (contrastOf(base, PALETTE_BLACK) >= MIN_TEXT_CONTRAST) {
      fill = base;
      foreground = PALETTE_BLACK;
    } else {
      fill = darkenForWhite(base, 0) ?? { ...base, l: 0.3 };
    }
  }

  const fits = (c: Oklch, both: boolean) =>
    contrastOf(c, context.pageHex) >= MIN_UI_CONTRAST &&
    (!both || contrastOf(c, context.cardHex) >= MIN_UI_CONTRAST);
  const wordsFor = (c: Oklch) =>
    contrastOf(c, PALETTE_WHITE) >= MIN_TEXT_CONTRAST ? PALETTE_WHITE : PALETTE_BLACK;

  if (!fits(fill, true)) {
    let found: Oklch | null = null;
    for (const both of [true, false]) {
      for (let d = DARKEN_STEP; d < 0.7 && !found; d += DARKEN_STEP) {
        for (const l of [fill.l - d, fill.l + d]) {
          if (l <= 0.05 || l >= 0.98) continue;
          const candidate = toGamut({ ...fill, l });
          if (
            fits(candidate, both) &&
            contrastOf(candidate, wordsFor(candidate)) >= MIN_TEXT_CONTRAST
          ) {
            found = candidate;
            break;
          }
        }
      }
      if (found) break;
    }
    if (found) {
      fill = found;
      foreground = wordsFor(found);
    }
  }

  const darkerHover = toGamut({ ...fill, l: Math.max(0.05, fill.l - HOVER_STEP) });
  const lighterHover = toGamut({ ...fill, l: Math.min(0.95, fill.l + HOVER_STEP) });
  const hover =
    contrastOf(darkerHover, foreground) >= MIN_TEXT_CONTRAST
      ? darkerHover
      : contrastOf(lighterHover, foreground) >= MIN_TEXT_CONTRAST
        ? lighterHover
        : fill;

  const soft: Oklch = context.dark
    ? toGamut(
        context.pageTinted
          ? { l: context.card.l + 0.1, c: Math.min(0.08, context.page.c), h: context.page.h }
          : { l: Math.min(0.42, context.card.l + 0.1), c: Math.min(0.06, base.c), h: base.h },
      )
    : toGamut({
        l: Math.min(
          0.95,
          (context.mixed ? context.card.l : Math.min(context.page.l, context.card.l)) - 0.04,
        ),
        c: Math.min(context.pageTinted ? 0.06 : 0.035, base.c),
        h: base.h,
      });

  const softHex = formatOklch(soft);
  const softForeground = formatOklch(
    untilReadable(base, softHex, context.dark ? 'lighter' : 'darker'),
  );
  const text = formatOklch(
    untilReadable(base, formatOklch(context.linkOn), context.dark ? 'lighter' : 'darker'),
  );

  return {
    fill: formatOklch(fill),
    foreground,
    hover: formatOklch(hover),
    text,
    soft: softHex,
    softForeground,
  };
}

/**
 * Turns a property's look (`brandColor`, `pageColor`, `cardColor`, `accentColor`) into a readable
 * 60/30/10 + accent palette. Words switch to black or white at 4.5:1; buttons lighten or darken
 * until their words reach 4.5:1 and they stand out 3:1 from page and cards.
 */
export function propertyPalette(look: PropertyLookInput): PropertyPalette {
  const brand = hexToOklch(look.brandColor) ?? hexToOklch(DEFAULT_BRAND_COLOR);
  if (!brand) throw new Error('Default brand colour is invalid');
  const base = toGamut(brand);

  const accentInput = look.accentColor ? hexToOklch(look.accentColor) : null;
  const fallbackAccent = hexToOklch(DEFAULT_BRAND_ACCENT_COLOR);
  if (!fallbackAccent) throw new Error('Default accent colour is invalid');
  const accentBase = toGamut(accentInput ?? fallbackAccent);

  const pageBase = look.pageColor ? hexToOklch(look.pageColor) : null;
  const page: Oklch = pageBase
    ? toGamut(pageBase)
    : { l: 0.982, c: Math.min(0.003, base.c), h: base.h };
  const pageWords = wordsOn(page);
  const pageDark = pageWords.dark;

  const cardBase = look.cardColor ? hexToOklch(look.cardColor) : null;
  const card: Oklch = cardBase
    ? toGamut(cardBase)
    : pageDark
      ? toGamut({ ...page, l: page.l + 0.055 })
      : { l: 1, c: 0, h: 0 };
  const cardWords = wordsOn(card);
  const dark = cardWords.dark;
  const mixed = dark !== pageDark;

  const pageHex = formatOklch(page);
  const cardHex = formatOklch(card);
  const pageTinted = Boolean(pageBase) && !mixed && !cardBase;
  const harder = dark === card.l < page.l ? page : card;
  const linkOn = mixed ? card : harder;

  const roleContext = { page, card, pageHex, cardHex, linkOn, dark, mixed, pageTinted };
  const primaryRole = resolveAccentRole(base, roleContext);
  const accentRole = resolveAccentRole(accentBase, roleContext);

  const tint: PropertyPalette['tint'] = pageTinted
    ? dark
      ? {
          muted: formatOklch({ l: card.l + 0.04, c: Math.min(0.05, page.c), h: page.h }),
          border: formatOklch({ l: card.l + 0.1, c: Math.min(0.05, page.c), h: page.h }),
        }
      : {
          muted: formatOklch({ l: page.l - 0.03, c: Math.min(0.03, page.c), h: page.h }),
          border: formatOklch({ l: page.l - 0.09, c: Math.min(0.04, page.c), h: page.h }),
        }
    : null;

  const pageLink = formatOklch(untilReadable(base, pageHex, pageDark ? 'lighter' : 'darker'));

  return {
    property60: pageHex,
    property30: cardBase || pageDark || dark ? cardHex : PALETTE_WHITE,
    foreground: cardWords.text === PALETTE_LIGHT_TEXT ? PALETTE_LIGHT_TEXT : PALETTE_BLACK,
    property10: primaryRole.fill,
    property10Foreground: primaryRole.foreground,
    property10Hover: primaryRole.hover,
    property10Text: primaryRole.text,
    property10Soft: primaryRole.soft,
    property10SoftForeground: primaryRole.softForeground,
    brandAccent: accentRole.fill,
    brandAccentForeground: accentRole.foreground,
    brandAccentHover: accentRole.hover,
    brandAccentText: accentRole.text,
    brandAccentSoft: accentRole.soft,
    brandAccentSoftForeground: accentRole.softForeground,
    tint,
    dark,
    mixed,
    page: {
      foreground: pageWords.text,
      muted: mutedOn(page, pageDark),
      link: pageLink,
    },
    cardMuted: mutedOn(card, dark),
  };
}
