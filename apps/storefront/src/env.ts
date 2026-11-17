import { storefrontEnvSchema, type StorefrontEnv } from './env-config';

/**
 * Validated runtime environment for browser and server components.
 * Each `process.env.NEXT_PUBLIC_*` lookup is written statically so Next.js
 * inlines literal values at compile time and eliminates dead branches.
 */
export const env: StorefrontEnv = storefrontEnvSchema.parse({
  APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
  DATA_SOURCE: process.env.NEXT_PUBLIC_DATA_SOURCE,
  STOREFRONT_ORIGIN: process.env.NEXT_PUBLIC_STOREFRONT_ORIGIN ?? '',
  API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
});
