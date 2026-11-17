import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { scanBuildDirectories } from './scan-build.js';

function withTempBuildDir(run: (rootDir: string) => void): void {
  const tempRoot = mkdtempSync(join(tmpdir(), 'smartapp-scan-test-'));
  try {
    run(tempRoot);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
}

describe('production build output scan', () => {
  it('fails when a fake build folder contains dec0de', () => {
    withTempBuildDir((rootDir) => {
      const assetsDir = join(rootDir, 'dist', 'assets');
      mkdirSync(assetsDir, { recursive: true });
      writeFileSync(
        join(assetsDir, 'index.js'),
        'export const id = "dec0de10-0001-4000-8000-000000000001";\n',
        'utf8',
      );

      const result = scanBuildDirectories(['dist'], rootDir);
      expect(result.filesScanned).toBe(1);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0]?.ruleId).toBe('demo-id');
      expect(result.violations[0]?.matchText).toBe('dec0de');
    });
  });

  it('catches dev addresses, demo emails, and the switch bar marker', () => {
    withTempBuildDir((rootDir) => {
      const distDir = join(rootDir, 'dist');
      mkdirSync(distDir, { recursive: true });
      writeFileSync(
        join(distDir, 'bundle.js'),
        [
          'const api = "http://localhost:4100/health";',
          'const guest = "bea.santos@example.com";',
          'const owner = "owner.pending@demo.invalid";',
          'const marker = "__SMARTAPP_DEV_SWITCH_BAR__";',
          'const kitMarker = "__SMARTAPP_DEV_KIT__";',
        ].join('\n'),
        'utf8',
      );

      const result = scanBuildDirectories(['dist'], rootDir);
      const ids = result.violations.map((v) => v.ruleId);
      expect(ids).toContain('dev-address');
      expect(ids).toContain('demo-customer-email');
      expect(ids).toContain('demo-owner-email');
      expect(ids).toContain('switch-bar-marker');
      expect(ids).toContain('kit-marker');
    });
  });

  it('ignores *.map files, cache/ folders, and .next/build/ worker chunks while scanning .next/server', () => {
    withTempBuildDir((rootDir) => {
      const nextDir = join(rootDir, '.next');
      const cacheDir = join(nextDir, 'cache');
      const buildDir = join(nextDir, 'build', 'chunks');
      const serverDir = join(nextDir, 'server');
      mkdirSync(cacheDir, { recursive: true });
      mkdirSync(buildDir, { recursive: true });
      mkdirSync(serverDir, { recursive: true });
      writeFileSync(join(serverDir, 'app.js'), 'console.log("Smart App PH production");\n', 'utf8');
      writeFileSync(join(serverDir, 'app.js.map'), 'dec0de @demo.invalid\n', 'utf8');
      writeFileSync(join(cacheDir, 'cached.js'), 'localhost:3100 @example.com\n', 'utf8');
      writeFileSync(
        join(buildDir, '[root-of-the-server]__worker.js'),
        "host: '127.0.0.1'\n",
        'utf8',
      );

      const result = scanBuildDirectories(['.next'], rootDir);
      expect(result.filesScanned).toBe(1);
      expect(result.violations).toEqual([]);
    });
  });

  it('keeps packages/data/src/http-client.ts isolated from mocks, demo ids, and switches', () => {
    const repoRoot = resolve(import.meta.dirname, '..');
    const source = readFileSync(resolve(repoRoot, 'packages/data/src/http-client.ts'), 'utf8');
    expect(source).not.toMatch(/from\s+['"][^'"]*(mocks|switches)|dec0de|resolveDemoWorld/);
  });
});
