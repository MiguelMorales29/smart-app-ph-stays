import { resolve } from 'node:path';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type ConfigEnv, type UserConfig } from 'vite';

import { resolveDashboardBuildEnv } from './src/env-config.js';

export function createDashboardViteConfig(
  configEnv: Pick<ConfigEnv, 'command' | 'mode'>,
  rawEnv: Readonly<Record<string, string | undefined>> = process.env,
): UserConfig {
  const isDevServer = configEnv.command === 'serve';
  const resolved = resolveDashboardBuildEnv(rawEnv, { isDevServer });

  return {
    plugins: [react(), tailwindcss()],
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
