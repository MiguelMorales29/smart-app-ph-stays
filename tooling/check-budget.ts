import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

/**
 * Dashboard bundle budget (P4-8), measured on the preview build in CI:
 * - the entry chunk stays at most 210 KB gzipped;
 * - everything loaded before the first page (entry + modulepreloads) stays at most 260 KB;
 * - each page chunk (`*-page-*.js`) stays at most 40 KB;
 * - DiceBear, confetti, dnd-kit and the calendar never load with the first page.
 */
export const BUDGET = {
  entryKb: 210,
  initialKb: 260,
  pageKb: 40,
} as const;

const HEAVY: readonly { readonly label: string; readonly pattern: RegExp }[] = [
  { label: 'DiceBear avatars', pattern: /variant01:\(|notionists/i },
  { label: 'confetti', pattern: /canvas-confetti|confetti\.module/ },
  { label: 'dnd-kit', pattern: /useSortable|@dnd-kit/ },
  { label: 'calendar (react-day-picker)', pattern: /rdp-|react-day-picker/ },
  { label: '@date-fns/tz', pattern: /TZDate|@date-fns\/tz/ },
  {
    label: 'event-calendar (ReUI)',
    pattern: /event-calendar-month-view|data-slot="event-calendar/,
  },
  { label: 'gantt (ReUI)', pattern: /data-slot="gantt|gantt-bar/ },
  { label: 'date-selector (ReUI)', pattern: /data-slot="date-selector/ },
  { label: 'booking-slot-calendar', pattern: /data-slot="booking-slot-calendar/ },
  { label: 'week-strip-calendar', pattern: /data-slot="week-strip-calendar/ },
];

export interface BudgetReport {
  readonly entry: { readonly file: string; readonly kb: number };
  readonly initialKb: number;
  readonly pages: readonly { readonly file: string; readonly kb: number }[];
  readonly problems: readonly string[];
}

const kb = (bytes: number) => Math.round((bytes / 1024) * 10) / 10;

export function checkBudget(distDir: string): BudgetReport {
  const html = readFileSync(join(distDir, 'index.html'), 'utf8');
  const entryFile = /<script[^>]+src="\/(assets\/[^"]+\.js)"/.exec(html)?.[1];
  if (!entryFile) throw new Error('No entry script in index.html');
  const preloads = [...html.matchAll(/rel="modulepreload"[^>]*href="\/(assets\/[^"]+\.js)"/g)].map(
    (match) => match[1] ?? '',
  );
  const gz = (file: string) => gzipSync(readFileSync(join(distDir, file))).length;
  const problems: string[] = [];

  const entryKb = kb(gz(entryFile));
  if (entryKb > BUDGET.entryKb) {
    problems.push(`Entry chunk ${entryFile} is ${entryKb} KB gzipped (budget ${BUDGET.entryKb}).`);
  }
  const initial = [entryFile, ...preloads];
  const initialKb = kb(initial.reduce((sum, file) => sum + gz(file), 0));
  if (initialKb > BUDGET.initialKb) {
    problems.push(`First load is ${initialKb} KB gzipped (budget ${BUDGET.initialKb}).`);
  }
  for (const file of initial) {
    const text = readFileSync(join(distDir, file), 'utf8');
    for (const heavy of HEAVY) {
      if (heavy.pattern.test(text) || heavy.pattern.test(file)) {
        problems.push(`${heavy.label} loads with the first page (${file}).`);
      }
    }
  }
  const pages = readdirSync(join(distDir, 'assets'))
    .filter((file) => /-page-[\w-]+\.js$/.test(file))
    .map((file) => ({ file, kb: kb(gz(join('assets', file))) }))
    .sort((a, b) => b.kb - a.kb);
  for (const page of pages) {
    if (page.kb > BUDGET.pageKb) {
      problems.push(`Page chunk ${page.file} is ${page.kb} KB gzipped (budget ${BUDGET.pageKb}).`);
    }
  }
  return { entry: { file: entryFile, kb: entryKb }, initialKb, pages, problems };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dist = resolve(import.meta.dirname, '../apps/dashboard/dist');
  if (!existsSync(join(dist, 'index.html'))) {
    console.error('Build the dashboard first (apps/dashboard/dist/index.html is missing).');
    process.exit(1);
  }
  const report = checkBudget(dist);
  console.log(`Entry: ${report.entry.kb} KB gzipped (budget ${BUDGET.entryKb})`);
  console.log(`First load: ${report.initialKb} KB gzipped (budget ${BUDGET.initialKb})`);
  console.log(`Largest page: ${report.pages[0]?.file ?? '-'} ${report.pages[0]?.kb ?? 0} KB`);
  if (report.problems.length > 0) {
    console.error(`Budget check failed:\n- ${report.problems.join('\n- ')}`);
    process.exit(1);
  }
  console.log('Budget check passed.');
}
