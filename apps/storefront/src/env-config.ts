import { z } from 'zod';

export const APP_ENV_VALUES = ['development', 'preview', 'production'] as const;
export const appEnvSchema = z.enum(APP_ENV_VALUES);
export type AppEnv = z.infer<typeof appEnvSchema>;

export const DATA_SOURCE_VALUES = ['memory', 'http'] as const;
export const dataSourceSchema = z.enum(DATA_SOURCE_VALUES);
export type DataSourceMode = z.infer<typeof dataSourceSchema>;

export const storefrontEnvSchema = z
  .object({
    APP_ENV: appEnvSchema,
    DATA_SOURCE: dataSourceSchema,
    STOREFRONT_ORIGIN: z.string(),
    API_BASE_URL: z.string().optional(),
  })
  .refine((value) => !(value.APP_ENV === 'production' && value.DATA_SOURCE === 'memory'), {
    message: 'APP_ENV=production cannot use DATA_SOURCE=memory. Set DATA_SOURCE=http.',
  });

export type StorefrontEnv = z.infer<typeof storefrontEnvSchema>;

function normalizeNonEmpty(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Resolves storefront configuration for `next.config.ts`.
 * Dev defaults (`development` + `memory`) apply ONLY when running `next dev` (or `next typegen`);
 * builds fail loudly unless `APP_ENV` and `DATA_SOURCE` are set explicitly and production uses `http`.
 */
export function resolveStorefrontBuildEnv(
  rawEnv: Readonly<Record<string, string | undefined>>,
  options: { readonly isDevServer: boolean },
): StorefrontEnv {
  const rawAppEnv = normalizeNonEmpty(rawEnv.NEXT_PUBLIC_APP_ENV ?? rawEnv.APP_ENV);
  const rawDataSource = normalizeNonEmpty(rawEnv.NEXT_PUBLIC_DATA_SOURCE ?? rawEnv.DATA_SOURCE);
  const rawOrigin = normalizeNonEmpty(rawEnv.NEXT_PUBLIC_STOREFRONT_ORIGIN) ?? '';
  const rawApiBaseUrl = normalizeNonEmpty(rawEnv.NEXT_PUBLIC_API_BASE_URL);

  if (options.isDevServer) {
    return storefrontEnvSchema.parse({
      APP_ENV: rawAppEnv ?? 'development',
      DATA_SOURCE: rawDataSource ?? 'memory',
      STOREFRONT_ORIGIN: rawOrigin,
      ...(rawApiBaseUrl !== undefined ? { API_BASE_URL: rawApiBaseUrl } : {}),
    });
  }

  if (rawAppEnv === undefined) {
    throw new Error(
      'Storefront build failed: set APP_ENV (or NEXT_PUBLIC_APP_ENV) explicitly to development, preview, or production. Silent demo defaults apply only in `next dev`.',
    );
  }

  const parsedAppEnv = appEnvSchema.parse(rawAppEnv);

  if (parsedAppEnv === 'production' && rawDataSource !== 'http') {
    throw new Error(
      `Storefront build failed: APP_ENV=production requires DATA_SOURCE=http (received ${rawDataSource ?? 'unset'}).`,
    );
  }

  if (rawDataSource === undefined) {
    throw new Error(
      'Storefront build failed: set DATA_SOURCE (or NEXT_PUBLIC_DATA_SOURCE) explicitly to memory or http. Silent demo defaults apply only in `next dev`.',
    );
  }

  return storefrontEnvSchema.parse({
    APP_ENV: parsedAppEnv,
    DATA_SOURCE: rawDataSource,
    STOREFRONT_ORIGIN: rawOrigin,
    ...(rawApiBaseUrl !== undefined ? { API_BASE_URL: rawApiBaseUrl } : {}),
  });
}
