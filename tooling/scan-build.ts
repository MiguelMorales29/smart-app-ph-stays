import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

export interface BuildScanRule {
  readonly id: string;
  readonly label: string;
  readonly pattern: RegExp;
}

export const BUILD_SCAN_RULES: readonly BuildScanRule[] = [
  {
    id: 'dev-address',
    label: 'Development server address',
    pattern: /localhost:3100|localhost:5174|localhost:4100|127\.0\.0\.1/,
  },
  {
    id: 'demo-id',
    label: 'Demo UUID prefix (dec0de)',
    pattern: /dec0de/i,
  },
  {
    id: 'demo-customer-email',
    label: 'Demo customer email domain (@example.com)',
    pattern: /@example\.com/i,
  },
  {
    id: 'demo-owner-email',
    label: 'Demo owner email domain (@demo.invalid)',
    pattern: /@demo\.invalid/i,
  },
  {
    id: 'switch-bar-marker',
    label: 'Developer switch bar marker',
    pattern: /__SMARTAPP_DEV_SWITCH_BAR__/,
  },
];

export interface BuildScanViolation {
  readonly ruleId: string;
  readonly label: string;
  readonly filePath: string;
  readonly lineNumber: number;
  readonly matchText: string;
}

export interface BuildScanResult {
  readonly filesScanned: number;
  readonly violations: readonly BuildScanViolation[];
}

function collectScannableFiles(rootDir: string): string[] {
  const collected: string[] = [];
  const entries = readdirSync(rootDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (entry.name === 'cache') {
        continue;
      }
      collected.push(...collectScannableFiles(join(rootDir, entry.name)));
      continue;
    }

    if (!entry.isFile() || entry.name.endsWith('.map')) {
      continue;
    }

    collected.push(join(rootDir, entry.name));
  }

  return collected;
}

/**
 * Scans production build output directories for dev addresses, demo identifiers,
 * demo email domains, and the developer switch bar marker.
 * Excludes `*.map` files and `cache/` directories.
 */
export function scanBuildDirectories(
  directories: readonly string[],
  baseDir: string = process.cwd(),
): BuildScanResult {
  const violations: BuildScanViolation[] = [];
  let filesScanned = 0;

  for (const dir of directories) {
    const absDir = resolve(baseDir, dir);
    if (!existsSync(absDir)) {
      throw new Error(`Build output directory does not exist: ${absDir}`);
    }

    const files = collectScannableFiles(absDir);
    for (const filePath of files) {
      filesScanned += 1;
      const content = readFileSync(filePath, 'utf8');
      const lines = content.split(/\r?\n/);

      for (let lineIdx = 0; lineIdx < lines.length; lineIdx += 1) {
        const line = lines[lineIdx];
        if (line === undefined) continue;

        for (const rule of BUILD_SCAN_RULES) {
          const match = rule.pattern.exec(line);
          if (match) {
            violations.push({
              ruleId: rule.id,
              label: rule.label,
              filePath: relative(baseDir, filePath),
              lineNumber: lineIdx + 1,
              matchText: match[0],
            });
          }
        }
      }
    }
  }

  return { filesScanned, violations };
}

function main(): void {
  const repoRoot = resolve(import.meta.dirname, '..');
  const targets = process.argv.slice(2);
  const dirs =
    targets.length > 0 ? targets : ['apps/dashboard/dist', 'apps/storefront/.next'];

  const result = scanBuildDirectories(dirs, repoRoot);

  if (result.violations.length > 0) {
    console.error(
      `Build scan failed with ${String(result.violations.length)} violation(s) across ${String(result.filesScanned)} file(s):`,
    );
    for (const violation of result.violations) {
      console.error(
        `  [${violation.ruleId}] ${violation.filePath}:${String(violation.lineNumber)} matched "${violation.matchText}" (${violation.label})`,
      );
    }
    process.exitCode = 1;
    return;
  }

  console.log(
    `Build scan passed (${String(result.filesScanned)} file(s) scanned across ${dirs.join(', ')}).`,
  );
}

if (process.argv[1] && resolve(process.argv[1]) === import.meta.filename) {
  main();
}
