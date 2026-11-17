import { systemClock, type Clock } from '@smartapp/core';
import type { DataSource, Session } from '@smartapp/data';
import { getHttpDataSource } from '@smartapp/data/http';
import type { ErrorCode } from '@smartapp/core';

import { env } from '@/env';

export interface StorefrontClientState {
  readonly mode: 'memory' | 'http';
  readonly appEnv: 'development' | 'preview' | 'production';
  readonly source: DataSource;
  readonly session: Session;
  readonly clock: Clock;
  readonly propertySlugs: readonly string[];
  readonly pack: string;
  readonly as: string;
  readonly errorCode: ErrorCode;
  readonly hasBookingLink: boolean;
}

export async function loadStorefrontClient(search: string): Promise<StorefrontClientState> {
  if (
    process.env.NEXT_PUBLIC_DATA_SOURCE === 'memory' &&
    process.env.NEXT_PUBLIC_APP_ENV !== 'production'
  ) {
    const switches = await import('@smartapp/data/switches');
    const storage = typeof window !== 'undefined' ? window.sessionStorage : null;
    const state = switches.resolveInitialSwitchState(search, storage);
    const bundle = await switches.createSwitchClientBundle(state, {
      storefrontOrigin: env.STOREFRONT_ORIGIN,
    });

    return {
      mode: 'memory',
      appEnv: env.APP_ENV,
      source: bundle.source,
      session: bundle.session,
      clock: bundle.clock,
      propertySlugs: bundle.propertySlugs,
      pack: state.pack,
      as: state.as,
      errorCode: state.errorCode,
      hasBookingLink: bundle.hasBookingLink,
    };
  }

  const source = await getHttpDataSource({
    apiBaseUrl: env.API_BASE_URL ?? '',
  });

  return {
    mode: 'http',
    appEnv: env.APP_ENV,
    source,
    session: { role: 'guest' },
    clock: systemClock,
    propertySlugs: [],
    pack: 'http',
    as: 'guest',
    errorCode: 'not_allowed',
    hasBookingLink: false,
  };
}
