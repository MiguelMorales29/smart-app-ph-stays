import { systemClock, type Clock, type ErrorCode } from '@smartapp/core';
import type { DataSource, Session } from '@smartapp/data';
import { getHttpDataSource } from '@smartapp/data/http';

import { env } from '@/env';

export interface DashboardClientState {
  readonly mode: 'memory' | 'http';
  readonly appEnv: 'development' | 'preview' | 'production';
  readonly source: DataSource;
  readonly session: Session;
  readonly clock: Clock;
  readonly accountId: string | null;
  readonly isPendingOwner: boolean;
  readonly pack: string;
  readonly as: string;
  readonly errorCode: ErrorCode;
}

export async function loadDashboardClient(search: string): Promise<DashboardClientState> {
  if (
    import.meta.env.VITE_DATA_SOURCE === 'memory' &&
    import.meta.env.VITE_APP_ENV !== 'production'
  ) {
    const switches = await import('@smartapp/data/switches');
    const state = switches.resolveInitialSwitchState(search, window.sessionStorage, {
      as: 'owner_ulap',
    });
    const bundle = await switches.createSwitchClientBundle(state, {
      storefrontOrigin: env.STOREFRONT_ORIGIN,
    });

    return {
      mode: 'memory',
      appEnv: env.APP_ENV,
      source: bundle.source,
      session: bundle.session,
      clock: bundle.clock,
      accountId: bundle.accountId,
      isPendingOwner: bundle.isPendingOwner,
      pack: state.pack,
      as: state.as,
      errorCode: state.errorCode,
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
    accountId: null,
    isPendingOwner: false,
    pack: 'http',
    as: 'guest',
    errorCode: 'not_allowed',
  };
}
