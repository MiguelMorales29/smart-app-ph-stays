import { dashboardEnvSchema, type DashboardEnv } from './env-config';

/**
 * Validated runtime environment for the Vite dashboard app.
 * Each `import.meta.env.VITE_*` read is static so Vite's `define` inlines literals
 * and tree-shakes dev/demo code from production builds.
 */
export const env: DashboardEnv = dashboardEnvSchema.parse({
  APP_ENV: import.meta.env.VITE_APP_ENV,
  DATA_SOURCE: import.meta.env.VITE_DATA_SOURCE,
  STOREFRONT_ORIGIN: import.meta.env.VITE_STOREFRONT_ORIGIN ?? '',
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
});
