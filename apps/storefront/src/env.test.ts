import { PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_BUILD } from 'next/constants.js';
import { describe, expect, it } from 'vitest';

import { createStorefrontNextConfig } from '../next.config';
import { resolveStorefrontBuildEnv, storefrontEnvSchema } from './env-config';

describe('storefront environment validation', () => {
  it('applies memory + development defaults only for next dev', () => {
    const dev = resolveStorefrontBuildEnv({}, { isDevServer: true });
    expect(dev).toEqual({
      APP_ENV: 'development',
      DATA_SOURCE: 'memory',
      STOREFRONT_ORIGIN: '',
    });

    const nextDevConfig = createStorefrontNextConfig(PHASE_DEVELOPMENT_SERVER, {
      env: {},
      argv: ['node', 'next', 'dev'],
    });
    expect(nextDevConfig.env?.NEXT_PUBLIC_APP_ENV).toBe('development');
    expect(nextDevConfig.env?.NEXT_PUBLIC_DATA_SOURCE).toBe('memory');
  });

  it('fails next build with no settings instead of falling back to silent demo defaults', () => {
    expect(() => resolveStorefrontBuildEnv({}, { isDevServer: false })).toThrow(/APP_ENV/);

    expect(() =>
      createStorefrontNextConfig(PHASE_PRODUCTION_BUILD, {
        env: {},
        argv: ['node', 'next', 'build'],
      }),
    ).toThrow(/APP_ENV/);
  });

  it('requires DATA_SOURCE=http when APP_ENV=production', () => {
    expect(() =>
      createStorefrontNextConfig(PHASE_PRODUCTION_BUILD, {
        env: { APP_ENV: 'production' },
        argv: ['node', 'next', 'build'],
      }),
    ).toThrow(/DATA_SOURCE=http/);

    expect(() =>
      createStorefrontNextConfig(PHASE_PRODUCTION_BUILD, {
        env: { APP_ENV: 'production', DATA_SOURCE: 'memory' },
        argv: ['node', 'next', 'build'],
      }),
    ).toThrow(/DATA_SOURCE=http/);

    expect(() =>
      storefrontEnvSchema.parse({
        APP_ENV: 'production',
        DATA_SOURCE: 'memory',
        STOREFRONT_ORIGIN: '',
      }),
    ).toThrow();
  });

  it('accepts explicit production + http and preview + memory build configurations', () => {
    const prod = createStorefrontNextConfig(PHASE_PRODUCTION_BUILD, {
      env: { APP_ENV: 'production', DATA_SOURCE: 'http' },
      argv: ['node', 'next', 'build'],
    });
    expect(prod.env?.NEXT_PUBLIC_APP_ENV).toBe('production');
    expect(prod.env?.NEXT_PUBLIC_DATA_SOURCE).toBe('http');

    const preview = createStorefrontNextConfig(PHASE_PRODUCTION_BUILD, {
      env: { APP_ENV: 'preview', DATA_SOURCE: 'memory' },
      argv: ['node', 'next', 'build'],
    });
    expect(preview.env?.NEXT_PUBLIC_APP_ENV).toBe('preview');
    expect(preview.env?.NEXT_PUBLIC_DATA_SOURCE).toBe('memory');
  });
});
