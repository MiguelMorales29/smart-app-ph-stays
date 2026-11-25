// Copies the emoji data the ReUI emoji picker needs into both apps' public folders, so the picker
// loads from our own origin (works offline in the installed app, no third-party CDN). Re-run after
// bumping emojibase-data: pnpm --filter @smartapp/tooling emojibase
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const pkgDir = path.dirname(require.resolve('emojibase-data/package.json'));
const manifest: unknown = JSON.parse(fs.readFileSync(path.join(pkgDir, 'package.json'), 'utf8'));
const version =
  typeof manifest === 'object' && manifest !== null && 'version' in manifest
    ? String(manifest.version)
    : 'unknown';
const files = ['en/data.json', 'en/messages.json', 'en/shortcodes/github.json'];
const root = path.resolve(import.meta.dirname, '../..');

for (const app of ['apps/dashboard', 'apps/storefront']) {
  for (const file of files) {
    const target = path.join(root, app, 'public/emojibase', version, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(pkgDir, file), target);
  }
}
console.log(`Copied emojibase-data ${version} to both apps.`);
