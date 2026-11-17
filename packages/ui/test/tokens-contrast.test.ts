import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

type TokenMap = Readonly<Record<string, string>>;

interface ContrastPair {
  readonly label: string;
  readonly fg: string;
  readonly bg: string;
  readonly minRatio: number;
}

const tokensCssPath = resolve(import.meta.dirname, '../src/styles/tokens.css');

function extractBlock(css: string, selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(`(?:^|\\n)\\s*${escaped}\\s*\\{([\\s\\S]*?)\\n\\}`, 'm').exec(css);
  if (!match?.[1]) {
    throw new Error(`Could not find CSS block for selector "${selector}" in tokens.css`);
  }
  return match[1];
}

function parseCssVars(block: string): TokenMap {
  const vars: Record<string, string> = {};
  const regex = /(--[a-z0-9-]+)\s*:\s*([^;]+);/gi;
  for (const match of block.matchAll(regex)) {
    const name = match[1];
    const value = match[2];
    if (name && value) {
      vars[name.trim()] = value.trim();
    }
  }
  return vars;
}

function parseHexRgb(hex: string): readonly [number, number, number] {
  const normalized = hex.trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    throw new Error(`Expected 6-digit hex colour, received "${hex}"`);
  }
  const r = Number.parseInt(normalized.slice(0, 2), 16) / 255;
  const g = Number.parseInt(normalized.slice(2, 4), 16) / 255;
  const b = Number.parseInt(normalized.slice(4, 6), 16) / 255;
  return [r, g, b];
}

function linearizeChannel(channel: number): number {
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = parseHexRgb(hex);
  return 0.2126 * linearizeChannel(r) + 0.7152 * linearizeChannel(g) + 0.0722 * linearizeChannel(b);
}

function contrastRatio(fgHex: string, bgHex: string): number {
  const l1 = relativeLuminance(fgHex);
  const l2 = relativeLuminance(bgHex);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const CONTRAST_PAIRS: readonly ContrastPair[] = [
  // Base text on surfaces (4.5:1)
  { label: 'foreground on background', fg: '--foreground', bg: '--background', minRatio: 4.5 },
  { label: 'foreground on sidebar', fg: '--foreground', bg: '--sidebar', minRatio: 4.5 },
  { label: 'foreground on card', fg: '--foreground', bg: '--card', minRatio: 4.5 },
  { label: 'foreground on popover', fg: '--foreground', bg: '--popover', minRatio: 4.5 },
  { label: 'foreground on raised', fg: '--foreground', bg: '--raised', minRatio: 4.5 },
  { label: 'foreground on muted', fg: '--foreground', bg: '--muted', minRatio: 4.5 },
  { label: 'foreground on accent', fg: '--foreground', bg: '--accent', minRatio: 4.5 },
  { label: 'foreground on secondary', fg: '--foreground', bg: '--secondary', minRatio: 4.5 },
  {
    label: 'sidebar-foreground on sidebar',
    fg: '--sidebar-foreground',
    bg: '--sidebar',
    minRatio: 4.5,
  },
  {
    label: 'sidebar-accent-foreground on sidebar-accent',
    fg: '--sidebar-accent-foreground',
    bg: '--sidebar-accent',
    minRatio: 4.5,
  },
  {
    label: 'accent-foreground on accent',
    fg: '--accent-foreground',
    bg: '--accent',
    minRatio: 4.5,
  },
  {
    label: 'secondary-foreground on secondary',
    fg: '--secondary-foreground',
    bg: '--secondary',
    minRatio: 4.5,
  },

  // Muted text on surfaces (4.5:1)
  {
    label: 'muted-foreground on background',
    fg: '--muted-foreground',
    bg: '--background',
    minRatio: 4.5,
  },
  {
    label: 'muted-foreground on sidebar',
    fg: '--muted-foreground',
    bg: '--sidebar',
    minRatio: 4.5,
  },
  { label: 'muted-foreground on card', fg: '--muted-foreground', bg: '--card', minRatio: 4.5 },
  {
    label: 'muted-foreground on popover',
    fg: '--muted-foreground',
    bg: '--popover',
    minRatio: 4.5,
  },
  { label: 'muted-foreground on muted', fg: '--muted-foreground', bg: '--muted', minRatio: 4.5 },

  // Primary & brand accent (4.5:1)
  {
    label: 'primary-foreground on primary',
    fg: '--primary-foreground',
    bg: '--primary',
    minRatio: 4.5,
  },
  {
    label: 'primary-foreground on primary-hover',
    fg: '--primary-foreground',
    bg: '--primary-hover',
    minRatio: 4.5,
  },
  {
    label: 'sidebar-primary-foreground on sidebar-primary',
    fg: '--sidebar-primary-foreground',
    bg: '--sidebar-primary',
    minRatio: 4.5,
  },
  {
    label: 'primary-hover on primary-tint',
    fg: '--primary-hover',
    bg: '--primary-tint',
    minRatio: 4.5,
  },
  {
    label: 'foreground on primary-tint',
    fg: '--foreground',
    bg: '--primary-tint',
    minRatio: 4.5,
  },
  { label: 'primary on background', fg: '--primary', bg: '--background', minRatio: 4.5 },
  { label: 'primary on card', fg: '--primary', bg: '--card', minRatio: 4.5 },
  {
    label: 'brand-accent-foreground on brand-accent',
    fg: '--brand-accent-foreground',
    bg: '--brand-accent',
    minRatio: 4.5,
  },

  // Status pairs (4.5:1)
  { label: 'success on background', fg: '--success', bg: '--background', minRatio: 4.5 },
  { label: 'success on card', fg: '--success', bg: '--card', minRatio: 4.5 },
  { label: 'success on success-tint', fg: '--success', bg: '--success-tint', minRatio: 4.5 },
  { label: 'warning on background', fg: '--warning', bg: '--background', minRatio: 4.5 },
  { label: 'warning on card', fg: '--warning', bg: '--card', minRatio: 4.5 },
  { label: 'warning on warning-tint', fg: '--warning', bg: '--warning-tint', minRatio: 4.5 },
  { label: 'destructive on background', fg: '--destructive', bg: '--background', minRatio: 4.5 },
  { label: 'destructive on card', fg: '--destructive', bg: '--card', minRatio: 4.5 },
  { label: 'destructive on danger-tint', fg: '--destructive', bg: '--danger-tint', minRatio: 4.5 },
  {
    label: 'destructive-foreground on destructive',
    fg: '--destructive-foreground',
    bg: '--destructive',
    minRatio: 4.5,
  },
  { label: 'info on background', fg: '--info', bg: '--background', minRatio: 4.5 },
  { label: 'info on card', fg: '--info', bg: '--card', minRatio: 4.5 },
  { label: 'info on info-tint', fg: '--info', bg: '--info-tint', minRatio: 4.5 },

  // Input border and focus ring (3.0:1 UI components)
  { label: 'input on background', fg: '--input', bg: '--background', minRatio: 3.0 },
  { label: 'input on card', fg: '--input', bg: '--card', minRatio: 3.0 },
  { label: 'input on muted', fg: '--input', bg: '--muted', minRatio: 3.0 },
  { label: 'ring on background', fg: '--ring', bg: '--background', minRatio: 3.0 },
  { label: 'ring on card', fg: '--ring', bg: '--card', minRatio: 3.0 },
  { label: 'sidebar-ring on sidebar', fg: '--sidebar-ring', bg: '--sidebar', minRatio: 3.0 },
];

const FORBIDDEN_PRIMARY_ON_TINT =
  /\bbg-primary-tint\b[^\n]*\btext-primary(?![-\w])|\btext-primary(?![-\w])[^\n]*\bbg-primary-tint\b/;

function collectSourceFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(full));
    } else if (entry.isFile() && /\.(ts|tsx|css)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

describe('tokens.css WCAG AA contrast', () => {
  const css = readFileSync(tokensCssPath, 'utf8');
  const lightVars = parseCssVars(extractBlock(css, ':root'));
  const darkVars = parseCssVars(extractBlock(css, '.dark'));

  for (const [modeName, vars] of [
    ['light', lightVars],
    ['dark', darkVars],
  ] as const) {
    describe(`${modeName} mode`, () => {
      for (const pair of CONTRAST_PAIRS) {
        it(`${pair.label} meets ${String(pair.minRatio)}:1`, () => {
          const fgHex = vars[pair.fg];
          const bgHex = vars[pair.bg];
          expect(fgHex, `Missing ${pair.fg} in ${modeName}`).toBeDefined();
          expect(bgHex, `Missing ${pair.bg} in ${modeName}`).toBeDefined();
          if (!fgHex || !bgHex) return;

          const ratio = contrastRatio(fgHex, bgHex);
          expect(
            ratio,
            `${modeName} ${pair.label} (${fgHex} on ${bgHex}) = ${ratio.toFixed(2)}:1`,
          ).toBeGreaterThanOrEqual(pair.minRatio);
        });
      }
    });
  }

  it('guards against using --primary as text on --primary-tint in light mode (D35)', () => {
    const primaryHex = lightVars['--primary'];
    const tintHex = lightVars['--primary-tint'];
    expect(primaryHex).toBeDefined();
    expect(tintHex).toBeDefined();
    if (!primaryHex || !tintHex) return;

    // Documents why light --primary on --primary-tint (4.23:1) must use --primary-hover or --foreground instead.
    expect(contrastRatio(primaryHex, tintHex)).toBeLessThan(4.5);

    const repoRoot = resolve(import.meta.dirname, '../../..');
    const searchRoots = [
      resolve(repoRoot, 'packages/ui/src'),
      resolve(repoRoot, 'apps/storefront/src'),
      resolve(repoRoot, 'apps/dashboard/src'),
    ];
    for (const root of searchRoots) {
      for (const filePath of collectSourceFiles(root)) {
        const content = readFileSync(filePath, 'utf8');
        expect(
          FORBIDDEN_PRIMARY_ON_TINT.test(content),
          `Found text-primary on bg-primary-tint in ${filePath}; use text-primary-hover or text-foreground (D35)`,
        ).toBe(false);
      }
    }
  });
});
