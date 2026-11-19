import { rmSync } from 'node:fs';
import { resolve } from 'node:path';

/** Clears the previous run's UI scan results so report.md only lists this run (globalSetup). */
export default function setup(): void {
  rmSync(resolve(import.meta.dirname, 'test-results/ui-scan/results.jsonl'), { force: true });
}
