import { cpSync, createReadStream, existsSync, statSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type ConfigEnv, type Plugin, type UserConfig } from 'vite';

import { resolveDashboardBuildEnv } from './src/env-config.js';

const DEMO_MEDIA_DIR = resolve(import.meta.dirname, '../storefront/public/demo-media');
const MEDIA_TYPES: Record<string, string> = {
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

/**
 * D64: serve the demo photos from the dashboard itself (dev and preview servers), and copy them
 * into the build when the build runs on sample data, so they load on any deploy.
 */
function demoMedia(enabled: boolean): Plugin {
  const serve = (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const url = (req.url ?? '').split('?')[0] ?? '';
    if (!url.startsWith('/demo-media/')) return next();
    const file = normalize(
      join(DEMO_MEDIA_DIR, decodeURIComponent(url.slice('/demo-media/'.length))),
    );
    if (!file.startsWith(DEMO_MEDIA_DIR) || !existsSync(file) || !statSync(file).isFile())
      return next();
    res.setHeader(
      'Content-Type',
      MEDIA_TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream',
    );
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.statusCode = 200;
    createReadStream(file).pipe(res);
  };
  return {
    name: 'smartapp-demo-media',
    configureServer(server) {
      if (enabled) server.middlewares.use(serve);
    },
    configurePreviewServer(server) {
      if (enabled) server.middlewares.use(serve);
    },
    writeBundle(options) {
      if (!enabled || !existsSync(DEMO_MEDIA_DIR)) return;
      cpSync(DEMO_MEDIA_DIR, join(options.dir ?? 'dist', 'demo-media'), { recursive: true });
    },
  };
}

export function createDashboardViteConfig(
  configEnv: Pick<ConfigEnv, 'command' | 'mode'>,
  rawEnv: Readonly<Record<string, string | undefined>> = process.env,
): UserConfig {
  const isDevServer = configEnv.command === 'serve';
  const resolved = resolveDashboardBuildEnv(rawEnv, { isDevServer });

  return {
    plugins: [
      react(),
      tailwindcss(),
      demoMedia(resolved.DATA_SOURCE === 'memory' && resolved.APP_ENV !== 'production'),
    ],
    define: {
      'import.meta.env.VITE_APP_ENV': JSON.stringify(resolved.APP_ENV),
      'import.meta.env.VITE_DATA_SOURCE': JSON.stringify(resolved.DATA_SOURCE),
      'import.meta.env.VITE_STOREFRONT_ORIGIN': JSON.stringify(resolved.STOREFRONT_ORIGIN),
      ...(resolved.API_BASE_URL !== undefined
        ? { 'import.meta.env.VITE_API_BASE_URL': JSON.stringify(resolved.API_BASE_URL) }
        : {}),
    },
    resolve: {
      alias: {
        '@': resolve(import.meta.dirname, './src'),
      },
    },
    build: {
      rolldownOptions: {
        output: {
          // Group only always-initial framework runtime (React and TanStack Router/Query) so
          // Rolldown never sweeps lazy-route or kit-only packages (Zod, @floating-ui/react-dom,
          // lazy @base-ui primitives) into the preloaded shell chunk.
          codeSplitting: {
            minSize: 20_000,
            groups: [
              {
                name: 'vendor-shell',
                test: /[\\/]node_modules[\\/](react|react-dom|scheduler|@tanstack[\\/](react-router|router-core|react-query|query-core))[\\/]/,
              },
            ],
          },
        },
      },
    },
    server: {
      port: 5174,
      strictPort: true,
      host: true,
    },
    preview: {
      port: 5174,
      strictPort: true,
      host: true,
    },
  };
}

export default defineConfig((configEnv) => createDashboardViteConfig(configEnv, process.env));
