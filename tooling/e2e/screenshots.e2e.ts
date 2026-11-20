import { expect, test, type Page } from '@playwright/test';

const DASHBOARD_ORIGIN = 'http://127.0.0.1:5174';
const STOREFRONT_ORIGIN = 'http://127.0.0.1:3100';

const VIEWPORTS = [
  { name: '360', width: 360, height: 800 },
  { name: '1280', width: 1280, height: 800 },
] as const;

const DASHBOARD_KIT_TABS = ['base', 'dashboard'] as const;
const DASHBOARD_THEMES = ['light', 'dark'] as const;

const STOREFRONT_LOOKS = [
  'ulap-suites',
  'bahay-batis',
  'ilaw-residences',
  'tita-lorna-dorm',
  'worst-case',
] as const;

async function waitForPageReady(page: Page, waitForLoading = true): Promise<void> {
  await page.waitForLoadState('networkidle');
  await page.locator('h1').first().waitFor({ state: 'visible', timeout: 20_000 });
  if (waitForLoading) {
    await expect(page.locator('[data-slot="loading-state"]')).toHaveCount(0, { timeout: 20_000 });
  }
  // The Preview switches load lazily; wait for them so every baseline is stable. On phones with an
  // account menu the pill is hidden (D63: it moves into that menu), so wait for it to be attached.
  await page
    .locator('[data-slot="dev-switch-panel"]')
    .waitFor({ state: 'attached', timeout: 20_000 });
  await page.evaluate(() => document.fonts.ready);
}

test.describe('Phase 3 visual baselines', () => {
  for (const tab of DASHBOARD_KIT_TABS) {
    for (const theme of DASHBOARD_THEMES) {
      for (const vp of VIEWPORTS) {
        test(`dashboard kit ${tab} (${theme}, ${vp.name}px)`, async ({ page }) => {
          await page.setViewportSize({ width: vp.width, height: vp.height });
          await page.addInitScript((mode) => {
            window.localStorage.setItem('smartapp-dashboard-theme', mode);
          }, theme);

          await page.goto(`${DASHBOARD_ORIGIN}/kit?tab=${tab}&pack=marketing&clock=golden`);
          await waitForPageReady(page, false);
          await expect(page).toHaveScreenshot(`dashboard-kit-${tab}-${theme}-${vp.name}.png`, {
            fullPage: true,
            animations: 'disabled',
            maxDiffPixelRatio: 0.01,
          });
        });
      }
    }
  }

  for (const look of STOREFRONT_LOOKS) {
    for (const vp of VIEWPORTS) {
      test(`storefront kit ${look} (${vp.name}px)`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(`${STOREFRONT_ORIGIN}/kit?look=${look}&pack=marketing&clock=golden`);
        await waitForPageReady(page, false);
        await expect(page).toHaveScreenshot(`storefront-kit-${look}-${vp.name}.png`, {
          fullPage: true,
          animations: 'disabled',
          maxDiffPixelRatio: 0.01,
        });
      });
    }
  }

  for (const vp of VIEWPORTS) {
    test(`dashboard /home (${vp.name}px)`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.addInitScript(() => {
        window.localStorage.setItem('smartapp-dashboard-theme', 'light');
      });
      await page.goto(`${DASHBOARD_ORIGIN}/home?pack=marketing&clock=golden&as=owner:ulap-suites`);
      await waitForPageReady(page);
      await expect(page).toHaveScreenshot(`dashboard-home-${vp.name}.png`, {
        fullPage: true,
        animations: 'disabled',
        maxDiffPixelRatio: 0.01,
      });
    });

    test(`storefront /ulap-suites (${vp.name}px)`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(`${STOREFRONT_ORIGIN}/ulap-suites?pack=marketing&clock=golden`);
      await waitForPageReady(page);
      await expect(page).toHaveScreenshot(`storefront-ulap-suites-${vp.name}.png`, {
        fullPage: true,
        animations: 'disabled',
        maxDiffPixelRatio: 0.01,
      });
    });

    test(`dashboard /admin (${vp.name}px)`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.addInitScript(() => {
        window.localStorage.setItem('smartapp-dashboard-theme', 'light');
      });
      await page.goto(`${DASHBOARD_ORIGIN}/admin?pack=marketing&clock=golden&as=super-admin`);
      await waitForPageReady(page);
      await expect(page).toHaveScreenshot(`dashboard-admin-${vp.name}.png`, {
        fullPage: true,
        animations: 'disabled',
        maxDiffPixelRatio: 0.01,
      });
    });
  }
});
