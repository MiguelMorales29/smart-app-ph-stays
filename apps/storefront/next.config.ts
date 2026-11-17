import type { NextConfig } from 'next';
import { PHASE_DEVELOPMENT_SERVER, PHASE_TEST } from 'next/constants.js';

import { resolveStorefrontBuildEnv } from './src/env-config';

export function createStorefrontNextConfig(
  phase: string,
  context?: {
    readonly env?: Readonly<Record<string, string | undefined>>;
    readonly argv?: readonly string[];
  },
): NextConfig {
  const argv = context?.argv ?? process.argv;
  const rawEnv = context?.env ?? process.env;
  const isTypegen = argv.some((arg) => arg === 'typegen' || arg.endsWith('/typegen'));
  const isDevServer = phase === PHASE_DEVELOPMENT_SERVER || phase === PHASE_TEST || isTypegen;

  const resolved = resolveStorefrontBuildEnv(rawEnv, { isDevServer });

  return {
    agentRules: false,
    cacheComponents: true,
    allowedDevOrigins: ['192.168.*.*', '10.*.*.*'],
    transpilePackages: ['@smartapp/ui', '@smartapp/data'],
    env: {
      NEXT_PUBLIC_APP_ENV: resolved.APP_ENV,
      NEXT_PUBLIC_DATA_SOURCE: resolved.DATA_SOURCE,
      NEXT_PUBLIC_STOREFRONT_ORIGIN: resolved.STOREFRONT_ORIGIN,
      ...(resolved.API_BASE_URL !== undefined
        ? { NEXT_PUBLIC_API_BASE_URL: resolved.API_BASE_URL }
        : {}),
    },
  };
}

export default createStorefrontNextConfig;
