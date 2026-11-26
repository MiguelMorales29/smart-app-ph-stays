import { deflateSync } from 'node:zlib';

import { expect, test } from '@playwright/test';

const DASHBOARD_ORIGIN = 'http://127.0.0.1:5174';

/** Builds a valid RGB PNG buffer in memory for Playwright file-upload tests (zero external files). */
function makeSolidPng(
  width: number,
  height: number,
  rgb: readonly [number, number, number],
): Buffer {
  const [r, g, b] = rgb;
  const rows: Buffer[] = [];
  for (let y = 0; y < height; y += 1) {
    const row = Buffer.alloc(1 + width * 3);
    row[0] = 0;
    for (let x = 0; x < width; x += 1) {
      const offset = 1 + x * 3;
      row[offset] = r;
      row[offset + 1] = g;
      row[offset + 2] = b;
    }
    rows.push(row);
  }
  const raw = Buffer.concat(rows);
  const crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[n] = c >>> 0;
  }
  function crc32(buf: Buffer): number {
    let c = 0xffffffff;
    for (const byte of buf) {
      c = (crcTable[(c ^ byte) & 0xff] ?? 0) ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }
  function chunk(tag: string, data: Buffer): Buffer {
    const tagBuf = Buffer.from(tag, 'ascii');
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(Buffer.concat([tagBuf, data])), 0);
    return Buffer.concat([len, tagBuf, data, crcBuf]);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const SAMPLE_PHOTO_1 = {
  name: 'room-1.png',
  mimeType: 'image/png',
  buffer: makeSolidPng(640, 480, [48, 104, 212]),
};
const SAMPLE_PHOTO_2 = {
  name: 'room-2.png',
  mimeType: 'image/png',
  buffer: makeSolidPng(640, 480, [24, 152, 112]),
};
const SAMPLE_PHOTO_3 = {
  name: 'room-3.png',
  mimeType: 'image/png',
  buffer: makeSolidPng(640, 480, [218, 130, 42]),
};
const SAMPLE_SQUARE = {
  name: 'avatar-qr.png',
  mimeType: 'image/png',
  buffer: makeSolidPng(400, 400, [34, 88, 186]),
};

test.describe('Owner journeys (FIX-1 J)', () => {
  test('add a unit -> add 3 photos -> List this unit -> photos load on unit page and units list', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    // Marketing pack starts Ulap Suites at 8 of 8 units -> verify plan limit sheet first!
    await page.goto(`${DASHBOARD_ORIGIN}/units?clock=golden`, { waitUntil: 'networkidle' });
    await expect(page.getByText('8 of 8 units on your plan')).toBeVisible();
    await page.getByRole('button', { name: 'Add unit' }).click();
    await expect(page.getByText("You've used all 8 units on your plan")).toBeVisible();
    await expect(page.getByRole('link', { name: 'See plans' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Archive a unit' })).toBeVisible();
    await page.getByRole('button', { name: 'Archive a unit' }).click();

    // Switch to QA pack (2 of 5 units) and run the full create -> 3 photos -> list journey.
    await page.goto(`${DASHBOARD_ORIGIN}/units?pack=qa&clock=golden`, { waitUntil: 'networkidle' });
    await expect(page.getByText('2 of 5 units on your plan')).toBeVisible();
    await page.getByRole('button', { name: 'Add unit' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByLabel('Unit name').fill('Ridge View Loft');
    await page.getByLabel('Nightly price').fill('3200');
    await page.getByRole('button', { name: 'Save and add photos' }).click();

    // Lands on Photos section and sees the readiness card.
    await expect(page).toHaveURL(/\/units\/.+\/photos/);
    const readiness = page.locator('[data-slot="unit-readiness-card"]').first();
    await expect(readiness).toBeVisible();
    await expect(readiness).toContainText('At least 3 photos (0 of 3)');

    // Upload 3 photos in one batch.
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles([SAMPLE_PHOTO_1, SAMPLE_PHOTO_2, SAMPLE_PHOTO_3]);

    // Wait for all 3 tiles to finish uploading and the readiness card to enable "List this unit".
    const listBtn = readiness.getByRole('button', { name: 'List this unit' });
    await expect(listBtn).toBeVisible({ timeout: 15_000 });
    await listBtn.click();

    // Status updates to Listed in place and uploaded photos render with naturalWidth > 0.
    await expect(page.getByText('Listed').first()).toBeVisible({ timeout: 10_000 });
    await expect(readiness).toBeHidden();
    const imgs = page.locator('img[src^="blob:"], img[src^="data:image/"]');
    await expect(imgs).toHaveCount(3);
    for (let i = 0; i < 3; i += 1) {
      const ok = await imgs
        .nth(i)
        .evaluate((el) => el instanceof HTMLImageElement && el.naturalWidth > 0);
      expect(ok, `uploaded photo ${i + 1} loaded`).toBe(true);
    }

    // Navigate back to /units and verify the new unit and its uploaded cover photo show up.
    await page.getByRole('link', { name: 'Units' }).first().click();
    await expect(page.getByRole('link', { name: 'Ridge View Loft' }).first()).toBeVisible();
    const listCardImg = page
      .locator('article:visible, tr:visible')
      .filter({ hasText: 'Ridge View Loft' })
      .locator('img')
      .first();
    await expect(listCardImg).toBeVisible();
    const coverLoaded = await listCardImg.evaluate(
      (el) => el instanceof HTMLImageElement && el.naturalWidth > 0,
    );
    expect(coverLoaded).toBe(true);
  });

  test('monthly property preselects Monthly rent and adding 2 beds to an existing room continues numbering', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${DASHBOARD_ORIGIN}/units?as=owner:tita-lorna-dorm&clock=golden`, {
      waitUntil: 'networkidle',
    });

    // 1. Monthly property preselects Monthly rent in Add unit.
    await page.getByRole('button', { name: 'Add unit' }).click();
    const dialog = page.getByRole('dialog', { name: 'Add a unit' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Monthly rent' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(dialog.getByLabel('Monthly rent')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();

    // 2. Click "Add a bed" on Room 3B (which already has Beds 1..6) and add 2 beds -> Bed 7 & Bed 8.
    const room3bHeader = page
      .locator('tr:visible, article:visible')
      .filter({ hasText: 'Room 3B' })
      .filter({ has: page.getByRole('button', { name: 'Add a bed' }) })
      .first();
    await room3bHeader.getByRole('button', { name: 'Add a bed' }).click();
    const bedsDialog = page.getByRole('dialog', { name: 'Add bed spaces' });
    await expect(bedsDialog).toBeVisible();
    await expect(bedsDialog).toContainText('Bed 7 in Room 3B');

    // Increment beds from 1 to 2.
    await bedsDialog.getByRole('button', { name: 'More beds' }).click();
    await expect(bedsDialog).toContainText('Bed 7 … Bed 8 in Room 3B');

    await bedsDialog.getByLabel('Monthly rent for each bed').fill('3500');
    await bedsDialog.getByRole('button', { name: 'Add 2 beds' }).click();
    await expect(page).toHaveURL(/\/units\/.+\/photos/);

    // Return to /units and verify Bed 7 and Bed 8 appear under Room 3B without a duplicate Bed 1.
    await page.getByRole('link', { name: 'Units' }).first().click();
    const visibleRows = page.locator('tr:visible, article:visible');
    await expect(visibleRows.filter({ hasText: /Bed 7/ }).first()).toBeVisible();
    await expect(visibleRows.filter({ hasText: /Bed 8/ }).first()).toBeVisible();
    await expect(
      visibleRows.filter({ hasText: 'Room 3B' }).filter({ hasText: '8 beds' }).first(),
    ).toBeVisible();
  });

  test('R-1 units: archive -> Archived filter -> Restore, rename a room, table view remembered', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${DASHBOARD_ORIGIN}/units?clock=golden`, { waitUntil: 'networkidle' });

    // Archive one unit; it leaves the list and the Archived filter appears.
    await page.getByRole('button', { name: 'More for Studio Fog', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Archive' }).click();
    await expect(page.getByText('Studio Fog archived')).toBeVisible();
    await page.getByRole('button', { name: /^Archived/ }).click();
    await expect(page).toHaveURL(/filter=archived/);
    await expect(page.getByRole('link', { name: 'Studio Fog' })).toBeVisible();

    // Restore brings it back hidden.
    await page.getByRole('button', { name: 'More for Studio Fog', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Restore' }).click();
    await expect(page.getByText('Studio Fog restored as hidden')).toBeVisible();
    await page.getByRole('button', { name: /^Hidden/ }).click();
    await expect(page.getByRole('link', { name: 'Studio Fog' })).toBeVisible();

    // Table view is remembered after a reload.
    await page.getByRole('button', { name: 'Table' }).click();
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.locator('table:visible')).toBeVisible();

    // Rename a room in the dorm: every bed follows.
    await page.goto(`${DASHBOARD_ORIGIN}/units?as=owner:tita-lorna-dorm&clock=golden`, {
      waitUntil: 'networkidle',
    });
    await page.getByRole('button', { name: 'More for Room 2A', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Rename room' }).click();
    await page.getByLabel('Room name').fill('Ladies dorm');
    await page.getByRole('dialog').getByRole('button', { name: 'Rename room' }).click();
    await expect(page.getByText('Renamed to Ladies dorm')).toBeVisible();
    await expect(page.getByRole('button', { name: 'More for Ladies dorm · Bed 1' })).toBeVisible();
  });

  test('upload a profile photo -> shows in Settings > Account, sidebar and account menu, survives navigation', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${DASHBOARD_ORIGIN}/settings/account?clock=golden`, {
      waitUntil: 'networkidle',
    });

    await page.getByRole('button', { name: 'Change picture' }).first().click();
    const dialog = page.getByRole('dialog', { name: 'Your picture' });
    await expect(dialog).toBeVisible();

    await dialog.getByRole('tab', { name: 'Photo' }).click();
    await dialog.locator('input[type="file"]').setInputFiles(SAMPLE_SQUARE);
    await expect(dialog.getByRole('button', { name: 'Zoom in' })).toBeVisible();
    await dialog.getByRole('button', { name: 'Zoom in' }).click();
    await expect(dialog.getByText('1.3×')).toBeVisible();

    await dialog.getByRole('button', { name: 'Use this photo' }).click();
    await expect(dialog.getByRole('button', { name: 'Use this picture' })).toBeEnabled();
    await dialog.getByRole('button', { name: 'Use this picture' }).click();
    await expect(dialog).toBeHidden();

    // Verify new photo renders in Settings > Account and sidebar.
    const accountAvatarImg = page
      .locator('main img[src^="blob:"], main img[src^="data:image/"]')
      .first();
    await expect(accountAvatarImg).toBeVisible();
    expect(
      await accountAvatarImg.evaluate(
        (el) => el instanceof HTMLImageElement && el.naturalWidth > 0,
      ),
    ).toBe(true);

    const sidebarAvatarImg = page
      .locator(
        '[data-slot="sidebar"] img[src^="blob:"], [data-slot="sidebar"] img[src^="data:image/"]',
      )
      .first();
    await expect(sidebarAvatarImg).toBeVisible();
    expect(
      await sidebarAvatarImg.evaluate(
        (el) => el instanceof HTMLImageElement && el.naturalWidth > 0,
      ),
    ).toBe(true);

    // Open account menu and verify avatar renders inside menu too.
    await page.locator('[data-slot="sidebar"] [data-dev-panel-menu]').click();
    const menuAvatarImg = page
      .locator('[role="menu"] img[src^="blob:"], [role="menu"] img[src^="data:image/"]')
      .first();
    await expect(menuAvatarImg).toBeVisible();
    expect(
      await menuAvatarImg.evaluate((el) => el instanceof HTMLImageElement && el.naturalWidth > 0),
    ).toBe(true);
    await page.keyboard.press('Escape');

    // Navigate away and back to confirm profile photo survives a page change.
    await page.getByRole('link', { name: 'Home' }).first().click();
    await page.getByRole('link', { name: 'Settings' }).first().click();
    await page.getByRole('link', { name: 'Account' }).first().click();
    await expect(accountAvatarImg).toBeVisible();
  });

  test('upload a payment QR -> survives a page change', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${DASHBOARD_ORIGIN}/settings/payments?clock=golden`, {
      waitUntil: 'networkidle',
    });

    // Open edit sheet on the first existing payment method via its row menu.
    await page
      .getByRole('button', { name: /^More for /i })
      .first()
      .click();
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    const sheet = page.getByRole('dialog', { name: /^Edit /i });
    await expect(sheet).toBeVisible();

    await sheet.locator('#pay-qr').setInputFiles(SAMPLE_SQUARE);
    const cropDialog = page.getByRole('dialog', { name: 'Crop QR code' });
    const cropBtn = cropDialog.getByRole('button', { name: 'Use this QR' });
    await expect(cropBtn).toBeVisible();
    await cropBtn.click();

    await expect(sheet.getByAltText('Your QR code')).toBeVisible({ timeout: 10_000 });
    await sheet.getByLabel('Your password').fill('demo-owner-pass');
    await sheet.getByRole('button', { name: 'Save changes' }).click();
    await expect(sheet).toBeHidden();

    // Navigate away and back, reopen the same payment method, and confirm the QR image survives.
    await page
      .locator('main')
      .getByRole('link', { name: /Account/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/settings\/account/);
    await page
      .locator('main')
      .getByRole('link', { name: /Payments/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/settings\/payments/);

    await page
      .getByRole('button', { name: /^More for /i })
      .first()
      .click();
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    const qrImg = page.getByRole('dialog', { name: /^Edit /i }).getByAltText('Your QR code');
    await expect(qrImg).toBeVisible();
    expect(
      await qrImg.evaluate((el) => el instanceof HTMLImageElement && el.naturalWidth > 0),
    ).toBe(true);
  });

  test('house rules long custom chip wraps cleanly at 360 px (FIX-1 F)', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto(`${DASHBOARD_ORIGIN}/settings/policies?clock=golden`, {
      waitUntil: 'networkidle',
    });

    const longRule =
      'Please remember to turn off all air conditioners, lights, and water heaters before leaving the studio.';
    const input = page.locator('#pol-own-rule');
    await input.fill(longRule);
    const addBtn = page.locator('main').getByRole('button', { name: 'Add', exact: true });
    await addBtn.click();

    await expect(page.getByRole('button', { name: longRule })).toBeVisible();
    const layout = await page.evaluate(() => {
      const root = document.documentElement;
      const btn = [...document.querySelectorAll('button')].find(
        (b) => b.textContent?.trim() === 'Add',
      );
      const box = btn?.getBoundingClientRect();
      return {
        scrollWidth: root.scrollWidth,
        clientWidth: root.clientWidth,
        addRight: box ? box.right : -1,
      };
    });
    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth + 1);
    expect(layout.addRight).toBeGreaterThan(0);
    expect(layout.addRight).toBeLessThanOrEqual(360);
  });

  test('calendar prices and check-out-only labels do not touch neighbours at 360 px (FIX-1 I)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto(`${DASHBOARD_ORIGIN}/kit?tab=forms&clock=golden`, {
      waitUntil: 'networkidle',
    });

    const priceCal = page.locator('[data-slot="calendar-price-range"]').first();
    await priceCal.scrollIntoViewIfNeeded();
    await expect(priceCal).toBeVisible();

    const priceTouch = await priceCal.evaluate((el) => {
      const touches: string[] = [];
      for (const row of el.querySelectorAll('tbody tr')) {
        const labels = [...row.querySelectorAll('[data-slot="calendar-price-short"]')]
          .map((node) => ({
            text: node.textContent?.trim() ?? '',
            box: node.getBoundingClientRect(),
          }))
          .filter((item) => item.box.width > 0);
        for (let i = 1; i < labels.length; i += 1) {
          const prev = labels[i - 1];
          const curr = labels[i];
          if (prev && curr && prev.box.right >= curr.box.left) {
            touches.push(
              `"${prev.text}" (right=${prev.box.right.toFixed(1)}) touches "${curr.text}" (left=${curr.box.left.toFixed(1)})`,
            );
          }
        }
      }
      return touches;
    });
    expect(priceTouch).toEqual([]);

    const checkoutCal = page.locator('[data-slot="calendar-checkout-only"]').first();
    await checkoutCal.scrollIntoViewIfNeeded();
    await expect(checkoutCal).toBeVisible();
    const checkoutTouch = await checkoutCal.evaluate((el) => {
      const touches: string[] = [];
      for (const row of el.querySelectorAll('tbody tr')) {
        const buttons = [...row.querySelectorAll('button')]
          .map((btn) => btn.getBoundingClientRect())
          .filter((box) => box.width > 0);
        for (let i = 1; i < buttons.length; i += 1) {
          const prev = buttons[i - 1];
          const curr = buttons[i];
          if (prev && curr && prev.right > curr.left + 0.5) {
            touches.push(`button ${i - 1} overlaps button ${i}`);
          }
        }
      }
      return touches;
    });
    expect(checkoutTouch).toEqual([]);
  });
});
