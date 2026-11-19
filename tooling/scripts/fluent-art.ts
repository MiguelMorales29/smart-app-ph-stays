// Downloads Microsoft Fluent Emoji 3D pictures (MIT) once and saves them as 192 px WebP files for
// the dashboard's milestone screens (D54). Ported from the food app's script, but encodes with
// Playwright's Chromium (already installed) instead of adding `sharp`.
// Run: pnpm --filter @smartapp/tooling art   (or `... art live` for only the named keys)
// Set PLAYWRIGHT_CHROMIUM_PATH to use a system Chrome instead of Playwright's download.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const root = path.resolve(import.meta.dirname, '../..');
const TARGET_DIR = path.join(root, 'apps/dashboard/public/art');
const RAW = 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main';
// Shown at up to 96 CSS px, so 192 px covers 2x screens.
const SIZE = 192;
const QUALITY = 0.82;

// Milestone key (packages/ui/src/lib/milestone-art.ts) -> Fluent Emoji folder name.
const ART: Record<string, string> = {
  welcome: 'House with garden',
  no_units: 'Bed',
  no_payment_accounts: 'Money bag',
  waiting_approval: 'Hourglass not done',
  needs_changes: 'Memo',
  code_sent: 'Envelope with arrow',
  live: 'Party popper',
  offline: 'Cloud',
  error: 'Warning',
  not_found: 'Compass',
};

function pngPath(folder: string): string {
  const file = folder.toLowerCase().replace(/[\s-]+/g, '_') + '_3d.png';
  return `assets/${folder}/3D/${file}`;
}

async function main(): Promise<void> {
  fs.mkdirSync(TARGET_DIR, { recursive: true });
  const licence = await fetch(`${RAW}/LICENSE`);
  if (!licence.ok) throw new Error(`LICENSE: HTTP ${licence.status}`);
  fs.writeFileSync(path.join(TARGET_DIR, 'LICENSE'), await licence.text(), 'utf8');

  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH;
  const browser = await chromium.launch(executablePath ? { executablePath } : {});
  const page = await browser.newPage();
  const only = process.argv.slice(2);
  try {
    for (const [key, folder] of Object.entries(ART)) {
      if (only.length > 0 && !only.includes(key)) continue;
      const url = `${RAW}/${encodeURI(pngPath(folder))}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${key}: HTTP ${res.status} for ${url}`);
      const png = Buffer.from(await res.arrayBuffer()).toString('base64');
      const dataUrl: string = await page.evaluate(
        async ({ source, size, quality }) => {
          const image = new Image();
          image.src = `data:image/png;base64,${source}`;
          await image.decode();
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const context = canvas.getContext('2d');
          if (!context) throw new Error('No 2D canvas');
          const scale = Math.min(size / image.width, size / image.height);
          const width = image.width * scale;
          const height = image.height * scale;
          context.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);
          return canvas.toDataURL('image/webp', quality);
        },
        { source: png, size: SIZE, quality: QUALITY },
      );
      const dest = path.join(TARGET_DIR, `${key}.webp`);
      fs.writeFileSync(dest, Buffer.from(dataUrl.split(',')[1] ?? '', 'base64'));
      console.log(`${key}.webp  ${(fs.statSync(dest).size / 1024).toFixed(1)} KB  (${folder})`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
