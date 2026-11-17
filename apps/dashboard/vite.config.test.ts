import { describe, expect, it } from 'vitest';

import { dashboardEnvSchema, resolveDashboardBuildEnv } from './src/env-config';
import { createDashboardViteConfig } from './vite.config';

describe('dashboard environment validation', () => {
  it('applies memory + development defaults only for vite dev', () => {
    const dev = resolveDashboardBuildEnv({}, { isDevServer: true });
    expect(dev).toEqual({
      APP_ENV: 'development',
      DATA_SOURCE: 'memory',
      STOREFRONT_ORIGIN: '',
    });

    const viteDev = createDashboardViteConfig({ command: 'serve', mode: 'development' }, {});
    expect(viteDev.define?.['import.meta.env.VITE_APP_ENV']).toBe(JSON.stringify('development'));
    expect(viteDev.define?.['import.meta.env.VITE_DATA_SOURCE']).toBe(JSON.stringify('memory'));
  });

  it('fails vite build with no settings instead of falling back to silent demo defaults', () => {
    expect(() => resolveDashboardBuildEnv({}, { isDevServer: false })).toThrow(/APP_ENV/);

    expect(() => createDashboardViteConfig({ command: 'build', mode: 'production' }, {})).toThrow(
      /APP_ENV/,
    );
  });

  it('requires DATA_SOURCE=http when APP_ENV=production', () => {
    expect(() =>
      createDashboardViteConfig(
        { command: 'build', mode: 'production' },
        { APP_ENV: 'production' },
      ),
    ).toThrow(/DATA_SOURCE=http/);

    expect(() =>
      createDashboardViteConfig(
        { command: 'build', mode: 'production' },
        { APP_ENV: 'production', DATA_SOURCE: 'memory' },
      ),
    ).toThrow(/DATA_SOURCE=http/);

    expect(() =>
      dashboardEnvSchema.parse({
        APP_ENV: 'production',
        DATA_SOURCE: 'memory',
        STOREFRONT_ORIGIN: '',
      }),
    ).toThrow();
  });

  it('accepts explicit production + http and preview + memory build configurations', () => {
    const prod = createDashboardViteConfig(
      { command: 'build', mode: 'production' },
      { APP_ENV: 'production', DATA_SOURCE: 'http' },
    );
    expect(prod.define?.['import.meta.env.VITE_APP_ENV']).toBe(JSON.stringify('production'));
    expect(prod.define?.['import.meta.env.VITE_DATA_SOURCE']).toBe(JSON.stringify('http'));

    const preview = createDashboardViteConfig(
      { command: 'build', mode: 'production' },
      { APP_ENV: 'preview', DATA_SOURCE: 'memory' },
    );
    expect(preview.define?.['import.meta.env.VITE_APP_ENV']).toBe(JSON.stringify('preview'));
    expect(preview.define?.['import.meta.env.VITE_DATA_SOURCE']).toBe(JSON.stringify('memory'));
  });
});
