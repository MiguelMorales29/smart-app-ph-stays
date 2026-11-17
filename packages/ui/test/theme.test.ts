import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { FONT_PAIRS, fixedClock, propertyPalette, resolveDemoWorld } from '@smartapp/core';
import { describe, expect, it } from 'vitest';

import { propertyThemeVars } from '../src/compositions/property-theme';
import { cssVars } from '../src/lib/css-vars';
import { FONT_PAIR_FAMILIES, fontPairVars } from '../src/lib/font-pairs';

const repoRoot = resolve(import.meta.dirname, '../../..');

describe('font pairs (D37)', () => {
  it('maps every FONT_PAIRS id to heading and body CSS font variables', () => {
    expect(Object.keys(FONT_PAIR_FAMILIES)).toEqual([...FONT_PAIRS]);

    for (const pair of FONT_PAIRS) {
      const vars = fontPairVars(pair);
      expect(typeof vars['--font-sans']).toBe('string');
      expect(typeof vars['--font-heading']).toBe('string');
      expect(vars['--font-sans']).toBe(FONT_PAIR_FAMILIES[pair].body);
      expect(vars['--font-heading']).toBe(FONT_PAIR_FAMILIES[pair].heading);
    }
  });

  it('keeps dashboard CSS on Plus Jakarta Sans only while storefront loads property-fonts.css', () => {
    const globalsCss = readFileSync(
      resolve(repoRoot, 'packages/ui/src/styles/globals.css'),
      'utf8',
    );
    const propertyFontsCss = readFileSync(
      resolve(repoRoot, 'packages/ui/src/styles/property-fonts.css'),
      'utf8',
    );
    const dashboardCss = readFileSync(resolve(repoRoot, 'apps/dashboard/src/index.css'), 'utf8');
    const storefrontCss = readFileSync(
      resolve(repoRoot, 'apps/storefront/src/app/globals.css'),
      'utf8',
    );

    const globalsFontImports = globalsCss.match(/@fontsource[^'"]+/g) ?? [];
    expect(globalsFontImports).toEqual(['@fontsource-variable/plus-jakarta-sans']);

    const propertyFontImports = propertyFontsCss.match(/@fontsource[^'"]+/g) ?? [];
    expect(propertyFontImports).toHaveLength(13);

    expect(dashboardCss).toContain('@smartapp/ui/styles/globals.css');
    expect(dashboardCss).not.toContain('property-fonts.css');
    expect(storefrontCss).toContain('@smartapp/ui/styles/globals.css');
    expect(storefrontCss).toContain('@smartapp/ui/styles/property-fonts.css');
  });
});

describe('propertyThemeVars', () => {
  it('builds readable CSS variables for all four demo brands and forwards control height', () => {
    const world = resolveDemoWorld({
      pack: 'marketing',
      clock: fixedClock('2026-12-10T10:00:00+08:00'),
    });

    for (const page of world.property_pages) {
      expect(page.published).not.toBeNull();
      if (!page.published) continue;
      const look = page.published.look;
      const palette = propertyPalette(look);
      const vars = propertyThemeVars(palette, {
        logoShape: look.logoShape,
        controlHeight: '48px',
      });

      expect(vars['--property-60']).toBe(palette.property60);
      expect(vars['--property-30']).toBe(palette.property30);
      expect(vars['--property-10']).toBe(palette.property10);
      expect(vars['--primary']).toBe(palette.property10);
      expect(vars['--primary-foreground']).toBe(palette.property10Foreground);
      expect(vars['--brand-accent']).toBe(palette.brandAccent);
      expect(vars['--brand-accent-foreground']).toBe(palette.brandAccentForeground);
      expect(vars['--control-h']).toBe('48px');
      expect(vars['--logo-radius']).toBe('var(--radius)');

      const style = cssVars({ ...vars, ...fontPairVars(look.fontPair) });
      expect(Object.keys(style)).toContain('--font-sans');
      expect(Object.keys(style)).toContain('--font-heading');
    }
  });
});
