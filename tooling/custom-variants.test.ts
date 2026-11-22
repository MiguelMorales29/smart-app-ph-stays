import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const repoRoot = resolve(import.meta.dirname, '..');
const GLOBALS_CSS = resolve(repoRoot, 'packages/ui/src/styles/globals.css');

const SCAN_ROOTS = [
  resolve(repoRoot, 'packages/ui/src'),
  resolve(repoRoot, 'apps/dashboard/src'),
  resolve(repoRoot, 'apps/storefront/src'),
];

/**
 * Custom variant prefixes that MUST be declared via `@custom-variant` in `globals.css`.
 * Tailwind v4 maps native boolean `data-*` attributes (like `data-open:`, `data-active:`,
 * `data-checked:`) directly to `[data-<name>]`, whereas shorthand orientation/state/size/shell
 * variants (`data-horizontal`, `data-vertical`, `data-size-*`, `state-*`, `orientation-*`,
 * `sidebar-*`, `shell-*`, `tablet-*`, `pointer-*`, `hover-*`, `keyboard-*`) silently fail to
 * match DOM attributes unless explicitly declared with `@custom-variant`.
 */
const REQUIRES_CUSTOM_VARIANT =
  /^(?:data-(?:horizontal|vertical|size-[a-z0-9-]+)|state-[a-z0-9-]+|orientation-[a-z0-9-]+|sidebar-[a-z0-9-]+|shell-[a-z0-9-]+|tablet-[a-z0-9-]+|pointer-(?:coarse|fine)|hover-(?:hover|none)|keyboard-[a-z0-9-]+)$/;

// Tailwind v4 native media/interaction variants that look like custom prefixes.
const NATIVE_TAILWIND_VARIANTS = new Set(['pointer-fine', 'hover-none']);

// Extracts variant tokens like `data-horizontal:`, `group-data-vertical/tabs:`, `has-data-horizontal/field:`
// inside className strings and CSS, skipping object-key syntax (`data-horizontal: ...`).
const VARIANT_TOKEN_RE =
  /(?:^|[\s"'`])(?:(?:group-|peer-|has-|not-|in-)*)((?:data-[a-z0-9-]+|state-[a-z0-9-]+|orientation-[a-z0-9-]+|sidebar-[a-z0-9-]+|shell-[a-z0-9-]+|tablet-[a-z0-9-]+|pointer-[a-z0-9-]+|hover-[a-z0-9-]+|keyboard-[a-z0-9-]+))(?:\/[a-z0-9-]+)?:/g;

function walkSourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walkSourceFiles(full, out);
    } else if (
      /\.(ts|tsx|css)$/.test(entry) &&
      !entry.endsWith('.test.ts') &&
      !entry.endsWith('.test.tsx')
    ) {
      out.push(full);
    }
  }
  return out;
}

function readDefinedCustomVariants(cssText: string): Set<string> {
  const defined = new Set<string>();
  for (const match of cssText.matchAll(/@custom-variant\s+([a-z0-9-]+)\b/g)) {
    if (match[1]) defined.add(match[1]);
  }
  return defined;
}

function findMissingCustomVariants(
  filePath: string,
  text: string,
  defined: ReadonlySet<string>,
): { file: string; line: number; variant: string }[] {
  const issues: { file: string; line: number; variant: string }[] = [];
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? '';
    // Skip TypeScript object property declarations or CSS custom property declarations (`--sidebar-accent:`).
    if (line.includes('--')) {
      // Still scan tokens that aren't CSS custom properties.
    }
    for (const match of line.matchAll(VARIANT_TOKEN_RE)) {
      const variant = match[1];
      if (!variant) continue;
      const idx = match.index ?? 0;
      const prefix = line.slice(Math.max(0, idx - 2), idx + 2);
      if (prefix.includes('--')) continue;
      // Ignore `sidebar-accent: '...'` or `shell-header-height:` CSS vars / JS object keys
      const afterColon = line.slice(idx + match[0].length);
      if (/^\s/.test(afterColon) || afterColon.length === 0) continue;
      if (NATIVE_TAILWIND_VARIANTS.has(variant)) continue;
      if (!REQUIRES_CUSTOM_VARIANT.test(variant)) continue;
      if (!defined.has(variant)) {
        issues.push({ file: filePath, line: i + 1, variant });
      }
    }
  }
  return issues;
}

describe('custom Tailwind variants in globals.css (FIX-1 A)', () => {
  it('defines every required shadcn / Base UI custom variant in packages/ui/src/styles/globals.css', () => {
    const css = readFileSync(GLOBALS_CSS, 'utf8');
    const defined = readDefinedCustomVariants(css);
    for (const required of [
      'dark',
      'pointer-coarse',
      'hover-hover',
      'keyboard-open',
      'shell-phone',
      'shell-tablet',
      'shell-desktop',
      'tablet-rail',
      'sidebar-collapsed',
      'state-active',
      'state-completed',
      'state-inactive',
      'orientation-vertical',
      'data-size-default',
      'data-horizontal',
      'data-vertical',
    ]) {
      expect(defined.has(required), `Missing @custom-variant ${required} in globals.css`).toBe(
        true,
      );
    }
  });

  it('catches undefined custom variants in synthetic class strings', () => {
    const defined = new Set(['data-horizontal']);
    expect(
      findMissingCustomVariants(
        'test.tsx',
        '<div className="data-vertical:flex-col state-active:bg-primary orientation-vertical:w-px" />',
        defined,
      ).map((issue) => issue.variant),
    ).toEqual(['data-vertical', 'state-active', 'orientation-vertical']);
  });

  it('finds no undefined custom variant in packages/ui, apps/dashboard, or apps/storefront', () => {
    const css = readFileSync(GLOBALS_CSS, 'utf8');
    const defined = readDefinedCustomVariants(css);
    const missing: { file: string; line: number; variant: string }[] = [];

    for (const root of SCAN_ROOTS) {
      for (const file of walkSourceFiles(root)) {
        const text = readFileSync(file, 'utf8');
        missing.push(...findMissingCustomVariants(relative(repoRoot, file), text, defined));
      }
    }

    expect(
      missing,
      missing
        .map((m) => `${m.file}:${m.line} uses undefined custom variant "${m.variant}"`)
        .join('\n'),
    ).toEqual([]);
  });
});
