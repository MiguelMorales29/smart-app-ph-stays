import { describe, expect, it } from 'vitest';

import { resolveDemoWorld } from '../demo/index.js';
import { fixedClock } from '../time/index.js';
import {
  BRAND_COLOR_PRESETS,
  contrastRatio,
  DEFAULT_BRAND_ACCENT_COLOR,
  DEFAULT_BRAND_COLOR,
  PALETTE_BLACK,
  PALETTE_WHITE,
  propertyPalette,
  type PropertyPalette,
} from './palette.js';

const GOLDEN_CLOCK_ISO = '2026-12-10T10:00:00+08:00';

function assertPalettePassesContrast(p: PropertyPalette): void {
  const textPairs: readonly (readonly [string, string])[] = [
    [p.property60, p.page.foreground],
    [p.property60, p.page.muted],
    [p.property60, p.page.link],
    [p.property30, p.foreground],
    [p.property30, p.cardMuted],
    [p.property30, p.property10Text],
    [p.property30, p.brandAccentText],
    [p.property10, p.property10Foreground],
    [p.property10Hover, p.property10Foreground],
    [p.property10Soft, p.property10SoftForeground],
    [p.brandAccent, p.brandAccentForeground],
    [p.brandAccentHover, p.brandAccentForeground],
    [p.brandAccentSoft, p.brandAccentSoftForeground],
  ];

  for (const [bg, fg] of textPairs) {
    expect(contrastRatio(bg, fg)).toBeGreaterThanOrEqual(4.5);
  }

  expect(
    Math.max(contrastRatio(p.property10, p.property60), contrastRatio(p.property10, p.property30)),
  ).toBeGreaterThanOrEqual(3);
  expect(
    Math.max(
      contrastRatio(p.brandAccent, p.property60),
      contrastRatio(p.brandAccent, p.property30),
    ),
  ).toBeGreaterThanOrEqual(3);
}

describe('contrastRatio', () => {
  it('is 21 for black on white and 1 for the same colour', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1);
    expect(contrastRatio('#2866EE', '#2866EE')).toBeCloseTo(1, 5);
  });

  it('reads oklch strings like hex', () => {
    expect(contrastRatio('oklch(1 0 0)', '#000')).toBeCloseTo(21, 1);
  });
});

describe('propertyPalette', () => {
  it.each(BRAND_COLOR_PRESETS)('preset %s passes all text and UI contrast guards', (brandColor) => {
    const p = propertyPalette({ brandColor });
    assertPalettePassesContrast(p);
    expect(p.foreground).toBe(PALETTE_BLACK);
    expect(p.tint).toBeNull();
  });

  it('resolves all four demo brands with every pair passing WCAG AA', () => {
    const world = resolveDemoWorld({ pack: 'marketing', clock: fixedClock(GOLDEN_CLOCK_ISO) });
    expect(world.property_pages).toHaveLength(4);

    for (const pageRow of world.property_pages) {
      expect(pageRow.published).not.toBeNull();
      if (!pageRow.published) continue;
      const p = propertyPalette(pageRow.published.look);
      assertPalettePassesContrast(p);
      expect(p.mixed).toBe(false);
    }

    const pages = world.property_pages.map((row) =>
      row.published ? propertyPalette(row.published.look).property60 : '',
    );
    expect(new Set(pages).size).toBe(4);
  });

  it('worst case 1: yellow #FFE600 button darkens to stand out 3:1 with black text >= 4.5:1', () => {
    const p = propertyPalette({
      brandColor: '#FFE600',
      pageColor: '#F9FAFD',
      cardColor: '#FFFFFF',
      accentColor: '#FFE600',
    });

    assertPalettePassesContrast(p);
    expect(p.property10Foreground).toBe(PALETTE_BLACK);
    expect(contrastRatio(p.property10, p.property60)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(p.property10, p.property30)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(p.property10, '#FFE600')).toBeGreaterThan(1.5);
  });

  it('worst case 2: near-white page with white card keeps every text and button pair readable', () => {
    const p = propertyPalette({
      brandColor: '#2866EE',
      pageColor: '#F9FAFD',
      cardColor: '#FFFFFF',
      accentColor: '#7ED6AC',
    });

    assertPalettePassesContrast(p);
    expect(p.mixed).toBe(false);
    expect(p.foreground).toBe(PALETTE_BLACK);
    expect(contrastRatio(p.property10, p.property60)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(p.property10, p.property30)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(p.brandAccent, p.property60)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(p.brandAccent, p.property30)).toBeGreaterThanOrEqual(3);
  });

  it('worst case 3: near-black brand #0B1736 keeps white text on light surfaces and lightens on near-black page', () => {
    const onLight = propertyPalette({
      brandColor: '#0B1736',
      pageColor: '#F9FAFD',
      cardColor: '#FFFFFF',
    });
    assertPalettePassesContrast(onLight);
    expect(onLight.property10Foreground).toBe(PALETTE_WHITE);

    const onNearBlack = propertyPalette({
      brandColor: '#0B1736',
      pageColor: '#0B1736',
      cardColor: null,
    });
    assertPalettePassesContrast(onNearBlack);
    expect(contrastRatio(onNearBlack.property10, onNearBlack.property60)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(onNearBlack.property10, onNearBlack.property30)).toBeGreaterThanOrEqual(3);
  });

  const MIXED_CASES = [
    ['#D7372F', '#D7372F', '#FFFFFF', '#7ED6AC'],
    ['#D7372F', '#1A1414', '#FFFFFF', '#FFE600'],
    ['#0E7AC4', '#F7F9FC', '#14213D', '#7ED6AC'],
    ['#C9A227', '#C9A227', '#253475', '#FFFFFF'],
  ] as const;

  it.each(MIXED_CASES)(
    '%s on page %s with cards %s and accent %s passes contrast (mixed surfaces)',
    (brandColor, pageColor, cardColor, accentColor) => {
      const p = propertyPalette({ brandColor, pageColor, cardColor, accentColor });
      assertPalettePassesContrast(p);
    },
  );

  it('marks opposite-side page and card colours as mixed, and standalone page colour as tinted', () => {
    expect(
      propertyPalette({ brandColor: '#D7372F', pageColor: '#D7372F', cardColor: '#FFFFFF' }).mixed,
    ).toBe(true);
    expect(
      propertyPalette({ brandColor: '#D7372F', pageColor: '#FFF1C9', cardColor: null }).tint,
    ).not.toBeNull();
  });

  it('falls back to defaults for unreadable hex inputs and emits OKLCH strings', () => {
    const fallback = propertyPalette({ brandColor: 'not-a-colour', accentColor: 'not-a-colour' });
    const explicit = propertyPalette({
      brandColor: DEFAULT_BRAND_COLOR,
      accentColor: DEFAULT_BRAND_ACCENT_COLOR,
    });
    expect(fallback).toEqual(explicit);

    const values = [
      fallback.property60,
      fallback.property30,
      fallback.foreground,
      fallback.property10,
      fallback.property10Foreground,
      fallback.property10Hover,
      fallback.property10Text,
      fallback.property10Soft,
      fallback.property10SoftForeground,
      fallback.brandAccent,
      fallback.brandAccentForeground,
      fallback.brandAccentHover,
      fallback.brandAccentText,
      fallback.brandAccentSoft,
      fallback.brandAccentSoftForeground,
      fallback.cardMuted,
      ...Object.values(fallback.page),
    ];
    for (const value of values) {
      expect(value).toMatch(/^oklch\(/);
    }
  });
});
