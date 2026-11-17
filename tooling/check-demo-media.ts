import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

export interface ManifestRow {
  lineNumber: number;
  brand: string;
  folder: string;
  name: string;
  sourceSize: string;
  files: string[];
  pickedFrom: string;
  heroDescription: string;
  altText: string;
}

export interface DemoMediaIssue {
  kind:
    | 'missing-on-disk'
    | 'unlisted-on-disk'
    | 'duplicate-in-manifest'
    | 'invalid-name'
    | 'oversized-file'
    | 'empty-alt'
    | 'long-alt';
  target: string;
  message: string;
}

const RASTER_PATTERN = /^[a-z0-9-]+\/(banners|photos|brand)\/[a-z0-9-]+-\d{3,4}\.(webp|png)$/;
const VECTOR_PATTERN = /^(?!.*-\d+\.svg$)[a-z0-9-]+\/brand\/[a-z0-9-]+\.svg$/;
const MAX_RASTER_BYTES = 600 * 1024;
const MAX_ALT_LENGTH = 160;

export function isValidDemoMediaPath(relativePath: string): boolean {
  return RASTER_PATTERN.test(relativePath) || VECTOR_PATTERN.test(relativePath);
}

export function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else if (ch !== undefined) {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

export function parseManifestCsv(csvContent: string): ManifestRow[] {
  const lines = csvContent
    .trim()
    .split(/\r?\n/)
    .filter((line) => line.length > 0);

  return lines.slice(1).map((line, index) => {
    const fields = parseCsvLine(line);
    const brand = fields[0] ?? '';
    const folder = fields[1] ?? '';
    const name = fields[2] ?? '';
    const sourceSize = fields[3] ?? '';
    const rawFiles = fields[4] ?? '';
    const pickedFrom = fields[5] ?? '';
    const heroDescription = fields[6] ?? '';
    const altText = fields[7] ?? '';

    const files = rawFiles
      .split(';')
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .map((item) => `${brand}/${item}`);

    return {
      lineNumber: index + 2,
      brand,
      folder,
      name,
      sourceSize,
      files,
      pickedFrom,
      heroDescription,
      altText,
    };
  });
}

function listFilesRecursive(rootDir: string, currentDir: string): string[] {
  const results: string[] = [];
  const entries = readdirSync(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(currentDir, entry.name);
    if (entry.isDirectory()) {
      results.push(...listFilesRecursive(rootDir, fullPath));
    } else if (entry.isFile()) {
      const rel = relative(rootDir, fullPath).split('\\').join('/');
      results.push(rel);
    }
  }

  return results.sort();
}

export function validateDemoMedia(options?: {
  mediaDir?: string;
  manifestPath?: string;
}): DemoMediaIssue[] {
  const repoRoot = resolve(import.meta.dirname, '..');
  const mediaDir = options?.mediaDir ?? resolve(repoRoot, 'apps/storefront/public/demo-media');
  const manifestPath = options?.manifestPath ?? resolve(repoRoot, 'docs/demo-media-manifest.csv');

  const csvContent = readFileSync(manifestPath, 'utf8');
  const rows = parseManifestCsv(csvContent);
  const diskFiles = listFilesRecursive(mediaDir, mediaDir);
  const diskFileSet = new Set(diskFiles);
  const manifestFileSet = new Set<string>();
  const issues: DemoMediaIssue[] = [];

  for (const row of rows) {
    const rowLabel = `line ${String(row.lineNumber)} (${row.brand}/${row.folder}/${row.name})`;
    if (row.altText.trim().length === 0) {
      issues.push({
        kind: 'empty-alt',
        target: rowLabel,
        message: `Empty alt text on ${rowLabel}`,
      });
    } else if (row.altText.length > MAX_ALT_LENGTH) {
      issues.push({
        kind: 'long-alt',
        target: rowLabel,
        message: `Alt text exceeds ${String(MAX_ALT_LENGTH)} characters (${String(row.altText.length)}) on ${rowLabel}`,
      });
    }

    for (const file of row.files) {
      if (manifestFileSet.has(file)) {
        issues.push({
          kind: 'duplicate-in-manifest',
          target: file,
          message: `File listed more than once in manifest: ${file}`,
        });
      }
      manifestFileSet.add(file);

      if (!isValidDemoMediaPath(file)) {
        issues.push({
          kind: 'invalid-name',
          target: file,
          message: `Manifest file breaks naming pattern: ${file}`,
        });
      }

      if (!diskFileSet.has(file)) {
        issues.push({
          kind: 'missing-on-disk',
          target: file,
          message: `Manifest file is missing on disk: ${file}`,
        });
      }
    }
  }

  for (const diskFile of diskFiles) {
    if (!manifestFileSet.has(diskFile)) {
      issues.push({
        kind: 'unlisted-on-disk',
        target: diskFile,
        message: `File on disk is not listed in manifest: ${diskFile}`,
      });
    }

    if (!isValidDemoMediaPath(diskFile)) {
      issues.push({
        kind: 'invalid-name',
        target: diskFile,
        message: `Disk file breaks naming pattern: ${diskFile}`,
      });
    }

    if (diskFile.endsWith('.webp') || diskFile.endsWith('.png')) {
      const sizeBytes = statSync(join(mediaDir, diskFile)).size;
      if (sizeBytes > MAX_RASTER_BYTES) {
        issues.push({
          kind: 'oversized-file',
          target: diskFile,
          message: `Raster file exceeds 600 KB (${String(sizeBytes)} bytes): ${diskFile}`,
        });
      }
    }
  }

  return issues;
}
