import { rmSync } from 'node:fs';
import { resolve } from 'node:path';

/** Pages worth compiling once before a local run against `pnpm dev` (the kit tabs are the heaviest). */
const WARM_PAGES = [
  'http://127.0.0.1:5174/kit',
  'http://127.0.0.1:5174/kit?tab=forms',
  'http://127.0.0.1:5174/kit?tab=patterns',
  'http://127.0.0.1:3100/kit',
  'http://127.0.0.1:3100/ulap-suites',
];

/**
 * Clears the previous run's UI scan results so report.md only lists this run (globalSetup), then opens
 * each heavy page once, one at a time. A dev server compiles a page on its first visit; when several
 * tests asked for the same new page at once it could serve half-written files (a false failure, as in
 * the food app's T110). Against the CI builds this is a few quick requests.
 */
export default async function setup(): Promise<void> {
  rmSync(resolve(import.meta.dirname, 'test-results/ui-scan/results.jsonl'), { force: true });
  for (const page of WARM_PAGES) {
    try {
      await fetch(page, { signal: AbortSignal.timeout(120_000) });
    } catch {
      // A page that fails here fails again in its own test, with a clear message there.
    }
  }
}
