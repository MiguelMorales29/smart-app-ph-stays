import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Raw ReUI and Dice UI examples (files named `c-*.tsx` under packages/ui/src/variants) are kit
 * samples: real screens use our compositions or a named variant instead. Importing a raw example
 * from a screen would also pull kit-only code into the app's first load (see tooling/check-budget.ts).
 */
const repoRoot = resolve(import.meta.dirname, '..');
const KIT_FOLDERS = ['apps/dashboard/src/features/kit/', 'apps/storefront/src/components/kit/'];
const SCANNED = ['apps/dashboard/src', 'apps/storefront/src', 'packages/ui/src/compositions'];
const RAW_EXAMPLE = /@smartapp\/ui\/variants\/[\w-]+\/c-[\w-]+|\/variants\/[\w-]+\/c-[\w-]+/;

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      if (name !== 'node_modules' && name !== 'dist' && name !== '.next') walk(path, out);
    } else if (/\.(ts|tsx)$/.test(name)) out.push(path);
  }
  return out;
}

describe('kit examples stay in the kit', () => {
  it('no screen imports a raw c-* example', () => {
    const offenders = SCANNED.flatMap((dir) => walk(join(repoRoot, dir)))
      .map((file) => relative(repoRoot, file))
      .filter((file) => !KIT_FOLDERS.some((kit) => file.startsWith(kit)))
      .filter((file) => !file.endsWith('.test.ts') && !file.endsWith('.test.tsx'))
      .filter((file) => RAW_EXAMPLE.test(readFileSync(join(repoRoot, file), 'utf8')));
    expect(offenders).toEqual([]);
  });
});
