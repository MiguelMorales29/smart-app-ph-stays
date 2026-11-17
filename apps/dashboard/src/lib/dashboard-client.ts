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
  readonly isPausedOwner: boolean;
  readonly ownerLabel: string;
  readonly propertyName: string;
  readonly pack: string;
  readonly as: string;
  readonly errorCode: ErrorCode;
}

function propertyNameFromAs(asKey: string, label: string): string {
  if (asKey === 'super-admin') return 'Super admin';
  const match = /\(([^)]+)\)/.exec(label);
  if (match?.[1]) return match[1];
  return label;
}

export async function loadDashboardClient(search: string): Promise<DashboardClientState> {
  if (
    import.meta.env.VITE_DATA_SOURCE === 'memory' &&
    import.meta.env.VITE_APP_ENV !== 'production'
  ) {
    const switches = await import('@smartapp/data/switches');
    const state = switches.resolveInitialSwitchState(search, window.sessionStorage, {
      as: 'owner:ulap-suites',
    });
    const bundle = await switches.createSwitchClientBundle(state, {
      storefrontOrigin: env.STOREFRONT_ORIGIN,
    });
    const options = switches.getSwitchViewAsOptions(bundle.clock);
    const activeOption = options.find((opt) => opt.key === state.as);
    const ownerLabel = activeOption?.label ?? 'Owner';
    const propertyName = propertyNameFromAs(state.as, ownerLabel);

    let isPausedOwner = false;
    if (bundle.session.role === 'owner' && state.as.startsWith('owner:')) {
      const candidateSlug = state.as.slice('owner:'.length);
      if (candidateSlug && candidateSlug !== 'pending') {
        const propRes = await bundle.source.getProperty({ slug: candidateSlug }, bundle.session);
        if (propRes.ok && propRes.data) {
          isPausedOwner = propRes.data.account.is_paused;
        }
      }
    }

    return {
      mode: 'memory',
      appEnv: env.APP_ENV,
      source: bundle.source,
      session: bundle.session,
      clock: bundle.clock,
      accountId: bundle.accountId,
      isPendingOwner: bundle.isPendingOwner,
      isPausedOwner,
      ownerLabel,
      propertyName,
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
    isPausedOwner: false,
    ownerLabel: 'Account',
    propertyName: 'My Property',
    pack: 'http',
    as: 'guest',
    errorCode: 'not_allowed',
  };
}
