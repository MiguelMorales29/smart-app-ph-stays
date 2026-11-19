/**
 * Writes test-results/ui-scan/report.md from the JSON-lines results of ui-scan.e2e.ts.
 * Runs once after all workers finish (Playwright globalTeardown); ui-scan-setup.ts clears old
 * results before a run.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const OUT_DIR = resolve(import.meta.dirname, 'test-results/ui-scan');
const RESULTS_FILE = resolve(OUT_DIR, 'results.jsonl');

interface ScanResult {
  readonly app: string;
  readonly path: string;
  readonly size: string;
  readonly theme: string;
  readonly hard: string[];
  readonly soft: string[];
  readonly screenshot: string;
}

function isScanResult(value: unknown): value is ScanResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    'app' in value &&
    'path' in value &&
    'hard' in value &&
    Array.isArray(value.hard)
  );
}

function readResults(): ScanResult[] {
  if (!existsSync(RESULTS_FILE)) return [];
  const byKey = new Map<string, ScanResult>();
  for (const line of readFileSync(RESULTS_FILE, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    const parsed: unknown = JSON.parse(line);
    if (!isScanResult(parsed)) continue;
    byKey.set(`${parsed.app} ${parsed.path} ${parsed.size} ${parsed.theme}`, parsed);
  }
  return [...byKey.values()];
}

export default function writeUiScanReport(): void {
  if (!existsSync(RESULTS_FILE)) return;
  mkdirSync(OUT_DIR, { recursive: true });
  const results = readResults();
  const withHard = results.filter((result) => result.hard.length > 0);
  const withSoft = results.filter((result) => result.soft.length > 0);
  const lines = [
    '# UI scan report',
    '',
    `Pages scanned: ${results.length}. Hard problems: ${withHard.length}. Soft findings to review: ${withSoft.length}.`,
    '',
    '## Hard problems (these fail CI)',
    '',
    ...(withHard.length === 0
      ? ['None.']
      : withHard.map(
          (r) => `- ${r.app} \`${r.path}\` ${r.size} ${r.theme}: ${r.hard.join(' | ')}`,
        )),
    '',
    '## Soft findings (review the screenshot; fix if a real person would be blocked)',
    '',
    ...(withSoft.length === 0
      ? ['None.']
      : withSoft.map(
          (r) =>
            `- ${r.app} \`${r.path}\` ${r.size} ${r.theme}: ${r.soft.join(' | ')} (${r.screenshot})`,
        )),
    '',
  ];
  writeFileSync(resolve(OUT_DIR, 'report.md'), lines.join('\n'));
}
