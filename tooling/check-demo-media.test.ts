import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { isValidDemoMediaPath, validateDemoMedia } from './check-demo-media.js';

describe('demo media and manifest check', () => {
  it('passes on the repository demo-media folder and manifest', () => {
    const issues = validateDemoMedia();
    expect(issues).toEqual([]);
  });

  it('accepts valid raster and vector master paths and rejects invalid names', () => {
    expect(isValidDemoMediaPath('ulap-suites/banners/hero-1-1376.webp')).toBe(true);
    expect(isValidDemoMediaPath('ulap-suites/photos/studio-fog-1-800.webp')).toBe(true);
    expect(isValidDemoMediaPath('ulap-suites/brand/icon-512.png')).toBe(true);
    expect(isValidDemoMediaPath('ulap-suites/brand/logo-symbol.svg')).toBe(true);

    expect(isValidDemoMediaPath('ulap-suites/photos/studio-fog-1.webp')).toBe(false);
    expect(isValidDemoMediaPath('ulap-suites/photos/logo-symbol.svg')).toBe(false);
    expect(isValidDemoMediaPath('ulap-suites/brand/logo-symbol-512.svg')).toBe(false);
    expect(isValidDemoMediaPath('ulap-suites/other/hero-1-800.webp')).toBe(false);
  });

  it('detects missing files, unlisted files, oversized rasters, and bad alt text', () => {
    const tempRoot = mkdtempSync(join(tmpdir(), 'demo-media-check-'));
    try {
      const mediaDir = join(tempRoot, 'demo-media');
      mkdirSync(join(mediaDir, 'ulap-suites/photos'), { recursive: true });
      mkdirSync(join(mediaDir, 'ulap-suites/brand'), { recursive: true });

      writeFileSync(
        join(mediaDir, 'ulap-suites/photos/room-1-800.webp'),
        Buffer.alloc(601 * 1024, 1),
      );
      writeFileSync(join(mediaDir, 'ulap-suites/brand/unlisted-128.webp'), Buffer.alloc(16, 1));

      const manifestPath = join(tempRoot, 'manifest.csv');
      const longAlt = 'A'.repeat(161);
      const csv = [
        'brand,folder,name,source size,files,picked from (Flow file),hero description,alt text',
        'ulap-suites,photos,room-1,1200x896,photos/room-1-800.webp;photos/missing-400.webp,src.jpg,,',
        `ulap-suites,brand,logo-symbol,vector,brand/logo-symbol.svg,built in vector,,${longAlt}`,
      ].join('\n');
      writeFileSync(manifestPath, csv);

      const issues = validateDemoMedia({ mediaDir, manifestPath });
      const kinds = issues.map((issue) => issue.kind);

      expect(kinds).toContain('empty-alt');
      expect(kinds).toContain('long-alt');
      expect(kinds).toContain('missing-on-disk');
      expect(kinds).toContain('unlisted-on-disk');
      expect(kinds).toContain('oversized-file');
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });
});
