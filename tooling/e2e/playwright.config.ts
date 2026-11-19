import { resolve } from 'node:path';
import { defineConfig, devices } from '@playwright/test';

const repoRoot = resolve(import.meta.dirname, '../..');

export default defineConfig({
  testDir: import.meta.dirname,
  testMatch: /.*\.e2e\.ts/,
  snapshotPathTemplate: '{testDir}/__screenshots__/{arg}{ext}',
  outputDir: resolve(import.meta.dirname, 'test-results'),
  reporter: [
    ['list'],
    ['html', { outputFolder: resolve(import.meta.dirname, 'playwright-report'), open: 'never' }],
  ],
  fullyParallel: false,
  // The UI scan runs its pages in parallel (see ui-scan.e2e.ts); screenshot tests stay serial.
  workers: process.env.CI ? 3 : 1,
  globalSetup: resolve(import.meta.dirname, 'ui-scan-setup.ts'),
  globalTeardown: resolve(import.meta.dirname, 'ui-scan-report.ts'),
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      maxDiffPixelRatio: 0.01,
    },
  },
  use: {
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
  webServer: [
    {
      command:
        'pnpm --filter @smartapp/storefront build && pnpm --filter @smartapp/storefront start',
      cwd: repoRoot,
      url: 'http://127.0.0.1:3100',
      timeout: 240_000,
      reuseExistingServer: !process.env.CI,
      env: {
        APP_ENV: 'preview',
        DATA_SOURCE: 'memory',
        NEXT_PUBLIC_APP_ENV: 'preview',
        NEXT_PUBLIC_DATA_SOURCE: 'memory',
        NEXT_PUBLIC_STOREFRONT_ORIGIN: 'http://127.0.0.1:3100',
      },
    },
    {
      command:
        'pnpm --filter @smartapp/dashboard build && pnpm --filter @smartapp/dashboard preview',
      cwd: repoRoot,
      url: 'http://127.0.0.1:5174',
      timeout: 240_000,
      reuseExistingServer: !process.env.CI,
      env: {
        APP_ENV: 'preview',
        DATA_SOURCE: 'memory',
        VITE_APP_ENV: 'preview',
        VITE_DATA_SOURCE: 'memory',
        VITE_STOREFRONT_ORIGIN: 'http://127.0.0.1:3100',
      },
    },
  ],
});
