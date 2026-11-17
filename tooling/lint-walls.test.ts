import { resolve } from 'node:path';

import { ESLint } from 'eslint';
import { beforeAll, describe, expect, it } from 'vitest';

const repoRoot = resolve(import.meta.dirname, '..');
const eslint = new ESLint({ cwd: repoRoot });

beforeAll(async () => {
  await eslint.calculateConfigForFile(resolve(repoRoot, 'packages/core/src/index.ts'));
}, 20000);

async function lintSnippet(relativePath: string, code: string): Promise<string[]> {
  const results = await eslint.lintText(code, {
    filePath: resolve(repoRoot, relativePath),
  });
  return results.flatMap((result) =>
    result.messages
      .map((message) => message.ruleId)
      .filter((ruleId): ruleId is string => ruleId !== null),
  );
}

describe('ESLint import walls and type rules', () => {
  it('blocks apps/dashboard from importing @smartapp/storefront', async () => {
    const rules = await lintSnippet(
      'apps/dashboard/src/x.tsx',
      "import { x } from '@smartapp/storefront';\nexport const y = x;\n",
    );
    expect(rules).toContain('no-restricted-imports');
  });

  it('blocks apps/storefront from importing @smartapp/dashboard', async () => {
    const rules = await lintSnippet(
      'apps/storefront/src/app/x.tsx',
      "import { x } from '@smartapp/dashboard';\nexport const y = x;\n",
    );
    expect(rules).toContain('no-restricted-imports');
  });

  it('blocks apps/api from importing @smartapp/storefront', async () => {
    const rules = await lintSnippet(
      'apps/api/src/x.ts',
      "import { x } from '@smartapp/storefront';\nexport const y = x;\n",
    );
    expect(rules).toContain('no-restricted-imports');
  });

  it('blocks apps/dashboard from importing @supabase/supabase-js', async () => {
    const rules = await lintSnippet(
      'apps/dashboard/src/x.tsx',
      "import { createClient } from '@supabase/supabase-js';\nexport const y = createClient;\n",
    );
    expect(rules).toContain('no-restricted-imports');
  });

  it('blocks packages/core from importing react', async () => {
    const rules = await lintSnippet(
      'packages/core/src/x.ts',
      "import { useState } from 'react';\nexport const y = useState;\n",
    );
    expect(rules).toContain('no-restricted-imports');
  });

  it('blocks packages/core from importing @smartapp/data', async () => {
    const rules = await lintSnippet(
      'packages/core/src/x.ts',
      "import { x } from '@smartapp/data';\nexport const y = x;\n",
    );
    expect(rules).toContain('no-restricted-imports');
  });

  it('blocks packages/ui from importing @smartapp/data', async () => {
    const rules = await lintSnippet(
      'packages/ui/src/x.tsx',
      "import { x } from '@smartapp/data';\nexport const y = x;\n",
    );
    expect(rules).toContain('no-restricted-imports');
  });

  it('blocks apps/storefront from importing @smartapp/data/mocks/bookings', async () => {
    const rules = await lintSnippet(
      'apps/storefront/src/app/x.tsx',
      "import { x } from '@smartapp/data/mocks/bookings';\nexport const y = x;\n",
    );
    expect(rules).toContain('no-restricted-imports');
  });

  it('blocks apps/dashboard features from importing another feature', async () => {
    const rules = await lintSnippet(
      'apps/dashboard/src/features/a/x.tsx',
      "import { x } from '../b/y';\nexport const y = x;\n",
    );
    expect(rules).toContain('no-restricted-imports');
  });

  it('blocks type assertions in packages/core', async () => {
    const rules = await lintSnippet(
      'packages/core/src/x.ts',
      'const value: unknown = 1;\nconst n = value as number;\nexport { n };\n',
    );
    expect(rules).toContain('@typescript-eslint/consistent-type-assertions');
  });

  it('blocks // @ts-ignore comments in packages/core', async () => {
    const rules = await lintSnippet(
      'packages/core/src/x.ts',
      '// @ts-ignore\nexport const x = 1;\n',
    );
    expect(rules).toContain('@typescript-eslint/ban-ts-comment');
  });

  it('blocks explicit any in packages/core', async () => {
    const rules = await lintSnippet('packages/core/src/x.ts', 'let v: any;\nexport { v };\n');
    expect(rules).toContain('@typescript-eslint/no-explicit-any');
  });

  it('allows apps/api to import @supabase/supabase-js', async () => {
    const rules = await lintSnippet(
      'apps/api/src/x.ts',
      "import { createClient } from '@supabase/supabase-js';\nexport const y = createClient;\n",
    );
    expect(rules).toEqual([]);
  });

  it('allows apps/dashboard/src/app to import @smartapp/core', async () => {
    const rules = await lintSnippet(
      'apps/dashboard/src/app/x.tsx',
      "import { words } from '@smartapp/core';\nexport const y = words;\n",
    );
    expect(rules).toEqual([]);
  });

  it('allows type assertions only in packages/ui/src/components (D39)', async () => {
    const componentRules = await lintSnippet(
      'packages/ui/src/components/x.tsx',
      'const value: unknown = 1;\nexport const n = value as number;\n',
    );
    expect(componentRules).toEqual([]);
  });

  it('keeps type assertions blocked in packages/ui lib, hooks, and compositions (D39)', async () => {
    for (const filePath of [
      'packages/ui/src/lib/x.ts',
      'packages/ui/src/hooks/x.ts',
      'packages/ui/src/compositions/x.tsx',
    ]) {
      const rules = await lintSnippet(
        filePath,
        'const value: unknown = 1;\nexport const n = value as number;\n',
      );
      expect(rules).toContain('@typescript-eslint/consistent-type-assertions');
    }
  });
});
