/**
 * Responsive UI scan (skill: .agents/skills/smartapp-ui-check).
 *
 * Opens every dashboard route (from the route catalog, so new routes are scanned automatically)
 * and every storefront route. Each page fails on HARD problems:
 *   - JavaScript errors or console errors
 *   - failed requests (4xx/5xx), apart from the deliberate not-found pages
 *   - the page scrolling sideways (horizontal overflow)
 *   - touch inputs under 16 px at phone size, and serious or critical axe violations
 * and records SOFT findings (text covered by another layer, tap targets under 24 px) in
 * `test-results/ui-scan/report.md` for a human to review. Viewport screenshots are saved next to
 * the report so the founder or an agent can look at every page without running the apps.
 *
 * Two depths (UI_SCAN env):
 *   - quick (default, every pull request): dashboard at phone (light and dark) and desktop
 *     (light); storefront at phone and desktop; axe at phone size only.
 *   - full (on demand: the "Full UI scan" workflow, or at the end of a phase): phone, tablet and
 *     desktop, dashboard in light and dark, axe everywhere.
 * UI_SCAN_PATHS (optional, comma-separated path prefixes) limits the scan to some routes, for
 * example "/signup,/login,/onboarding,/units,/settings" for one phase's pages.
 */
import { appendFileSync, mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { AxeBuilder } from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const DASHBOARD_ORIGIN = 'http://127.0.0.1:5174';
const STOREFRONT_ORIGIN = 'http://127.0.0.1:3100';
const OUT_DIR = resolve(import.meta.dirname, 'test-results/ui-scan');

const ALL_SIZES = [
  { name: 'phone', width: 360, height: 800 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 },
] as const;

type Size = (typeof ALL_SIZES)[number];

const FULL = process.env.UI_SCAN === 'full';
const SIZES: readonly Size[] = FULL
  ? ALL_SIZES
  : ALL_SIZES.filter((size) => size.name !== 'tablet');
const PATH_FILTER = (process.env.UI_SCAN_PATHS ?? '')
  .split(',')
  .map((prefix) => prefix.trim())
  .filter(Boolean);

function wanted(path: string): boolean {
  if (PATH_FILTER.length === 0) return true;
  return PATH_FILTER.some((prefix) => path === prefix || path.startsWith(prefix));
}

/** Which colour schemes a dashboard page is scanned in at this size. */
function themesFor(size: Size): readonly ('light' | 'dark')[] {
  if (FULL || size.name === 'phone') return ['light', 'dark'];
  return ['light'];
}

/** axe is slow (about 1-2 s a page), so the quick scan runs it at phone size only. */
function runsAxe(size: Size): boolean {
  return FULL || size.name === 'phone';
}

const NOT_FOUND_PATHS = ['/this-page-does-not-exist', '/no-such-place'];

function dashboardPaths(): string[] {
  const catalog = readFileSync(
    resolve(import.meta.dirname, '../../apps/dashboard/src/features/kit/route-catalog.ts'),
    'utf8',
  );
  const paths = [...catalog.matchAll(/app:\s*'dashboard',\s*path:\s*'([^']+)'/g)].map(
    (match) => match[1] ?? '',
  );
  return [
    ...paths.filter(Boolean),
    '/kit?tab=dashboard',
    '/kit?tab=tokens',
    NOT_FOUND_PATHS[0] ?? '',
  ].filter(wanted);
}

/** Storefront routes: every page under app/[slug] for one property, the other demo brands, and edge cases. */
const STOREFRONT_PATHS = [
  '/',
  '/kit',
  '/ulap-suites',
  '/ulap-suites/find',
  '/ulap-suites/book',
  '/ulap-suites/inquire',
  '/ulap-suites/account',
  '/ulap-suites/install',
  '/ulap-suites/join',
  '/ulap-suites/privacy',
  '/ulap-suites/units/studio-fog',
  '/ulap-suites/t/sample-token',
  '/bahay-batis',
  '/ilaw-residences',
  '/tita-lorna-dorm',
  '/no-such-place',
  '/favicon.ico',
].filter(wanted);

interface ScanResult {
  readonly app: string;
  readonly path: string;
  readonly size: string;
  readonly theme: string;
  readonly hard: string[];
  readonly soft: string[];
  readonly screenshot: string;
}

// Results are appended to a JSON-lines file as each page finishes (pages run in several workers,
// and a failed test restarts its worker); ui-scan-report.ts turns the file into report.md after
// the run (Playwright globalTeardown).
const RESULTS_FILE = resolve(OUT_DIR, 'results.jsonl');

function fileName(app: string, path: string, size: string, theme: string): string {
  const slug = path.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'root';
  return `${app}-${slug}-${size}-${theme}.png`;
}

async function inspect(
  page: Page,
  isPhone: boolean,
): Promise<{ overflow: string | null; smallInputs: string[]; soft: string[] }> {
  return page.evaluate((checkPhoneInputs) => {
    const soft: string[] = [];
    const root = document.documentElement;
    const overflow =
      root.scrollWidth > root.clientWidth + 1
        ? `page scrolls sideways: ${root.scrollWidth}px wide in a ${root.clientWidth}px window`
        : null;

    const smallInputs = checkPhoneInputs
      ? [...document.querySelectorAll('input, textarea, select')]
          .filter((element) => {
            const style = getComputedStyle(element);
            if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0')
              return false;
            const box = element.getBoundingClientRect();
            if (box.width === 0 || box.height === 0) return false;
            return Number.parseFloat(style.fontSize) < 16;
          })
          .map((element) => {
            const fontSize = getComputedStyle(element).fontSize;
            const label =
              element.getAttribute('aria-label') ||
              element.getAttribute('name') ||
              element.tagName.toLowerCase();
            return `${label} (${fontSize})`;
          })
      : [];

    // Text hidden under another layer (ignores the floating Preview pill and the phone dock,
    // which float over scrolled content by design).
    const floating = '[data-slot="dev-switch-panel"], [data-slot="bottom-dock"]';
    const covered = new Set<string>();
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = (node.textContent ?? '').trim();
      const parent = node.parentElement;
      if (text.length < 3 || !parent) continue;
      if (parent.closest('[aria-hidden="true"], .sr-only, [data-collapsible="icon"]')) continue;
      const style = getComputedStyle(parent);
      if (style.visibility === 'hidden' || style.display === 'none' || style.opacity === '0')
        continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      const box = range.getBoundingClientRect();
      if (box.width < 2 || box.height < 2 || box.top < 0 || box.bottom > innerHeight) continue;
      if (box.left < 0 || box.left > innerWidth - 2) continue;
      const top = document.elementFromPoint(
        Math.min(box.left + 3, innerWidth - 1),
        box.top + box.height / 2,
      );
      if (!top || top === parent || parent.contains(top) || top.contains(parent)) continue;
      if (top.closest(floating)) continue;
      covered.add(`"${text.slice(0, 30)}" covered by <${top.tagName.toLowerCase()}>`);
    }
    if (covered.size > 0) soft.push(`text covered: ${[...covered].slice(0, 3).join('; ')}`);

    const tiny = [...document.querySelectorAll('a, button, [role="button"], input, select')]
      .filter((element) => {
        const box = element.getBoundingClientRect();
        return (
          box.width > 0 &&
          box.height > 0 &&
          box.top < innerHeight &&
          (box.width < 24 || box.height < 24)
        );
      })
      .filter((element) => !element.closest('[data-sidebar="rail"], p, li > a'))
      .slice(0, 3)
      .map((element) => {
        const box = element.getBoundingClientRect();
        const label = (element.textContent || element.getAttribute('aria-label') || '')
          .trim()
          .slice(0, 20);
        return `${element.tagName.toLowerCase()} "${label}" ${Math.round(box.width)}x${Math.round(box.height)}`;
      });
    if (tiny.length > 0) soft.push(`tap targets under 24px: ${tiny.join('; ')}`);

    return { overflow, smallInputs, soft };
  }, isPhone);
}

async function scan(
  page: Page,
  app: 'dashboard' | 'storefront',
  path: string,
  size: Size,
  theme: 'light' | 'dark',
): Promise<void> {
  const hard: string[] = [];
  const expectsNotFound = NOT_FOUND_PATHS.includes(path) || path === '/favicon.ico';
  page.on('pageerror', (error) => hard.push(`JavaScript error: ${error.message.slice(0, 200)}`));
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    if (expectsNotFound && /404|not found/i.test(message.text())) return;
    hard.push(`console error: ${message.text().slice(0, 200)}`);
  });
  page.on('response', (response) => {
    if (response.status() < 400) return;
    if (expectsNotFound && response.status() === 404) return;
    hard.push(`request failed ${response.status()}: ${response.url()}`);
  });

  await page.setViewportSize({ width: size.width, height: size.height });
  await page.emulateMedia({ colorScheme: theme });
  if (app === 'dashboard') {
    await page.addInitScript((value) => {
      window.localStorage.setItem('smartapp-dashboard-theme', value);
    }, theme);
  }
  const origin = app === 'dashboard' ? DASHBOARD_ORIGIN : STOREFRONT_ORIGIN;
  const separator = path.includes('?') ? '&' : '?';
  await page.goto(`${origin}${path}${separator}clock=golden`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);

  const { overflow, smallInputs, soft } = await inspect(page, size.name === 'phone');
  if (overflow) hard.push(overflow);
  if (smallInputs.length > 0) {
    hard.push(`touch input font-size under 16px: ${smallInputs.join(', ')}`);
  }

  const axeViolations = runsAxe(size)
    ? (await new AxeBuilder({ page }).exclude('[data-contrast-sample]').analyze()).violations
    : [];
  for (const violation of axeViolations) {
    if (violation.impact !== 'serious' && violation.impact !== 'critical') continue;
    const targets = violation.nodes
      .slice(0, 3)
      .map((node) => node.target.join(' '))
      .join(', ');
    hard.push(`axe ${violation.impact} (${violation.id}): ${violation.help} [${targets}]`);
  }

  const screenshot = fileName(app, path, size.name, theme);
  await page.screenshot({ path: resolve(OUT_DIR, screenshot) });
  const result: ScanResult = { app, path, size: size.name, theme, hard, soft, screenshot };
  appendFileSync(RESULTS_FILE, `${JSON.stringify(result)}\n`);

  expect(hard, `${app} ${path} at ${size.name} (${theme})`).toEqual([]);
}

mkdirSync(OUT_DIR, { recursive: true });

test.describe('UI scan', () => {
  // Pages are independent, so they run in parallel across workers; a failure is a real problem,
  // not flakiness, so it is not retried (a retry only doubled the time of a red run).
  test.describe.configure({ mode: 'parallel', retries: 0 });

  for (const size of SIZES) {
    const isPhone = size.name === 'phone';
    for (const theme of themesFor(size)) {
      for (const path of dashboardPaths()) {
        test(`dashboard ${path} (${size.name}, ${theme})`, async ({ browser }) => {
          const context = await browser.newContext({
            viewport: { width: size.width, height: size.height },
            colorScheme: theme,
            hasTouch: isPhone,
            isMobile: isPhone,
          });
          const page = await context.newPage();
          try {
            await scan(page, 'dashboard', path, size, theme);
          } finally {
            await context.close();
          }
        });
      }
    }
    for (const path of STOREFRONT_PATHS) {
      test(`storefront ${path} (${size.name})`, async ({ browser }) => {
        const context = await browser.newContext({
          viewport: { width: size.width, height: size.height },
          colorScheme: 'light',
          hasTouch: isPhone,
          isMobile: isPhone,
        });
        const page = await context.newPage();
        try {
          await scan(page, 'storefront', path, size, 'light');
        } finally {
          await context.close();
        }
      });
    }
  }
});
