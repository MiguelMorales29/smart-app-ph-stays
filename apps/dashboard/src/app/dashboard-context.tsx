import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { manilaToday, type OwnerHomeCountsView } from '@smartapp/core';
import type { Session } from '@smartapp/data';
import { loadDashboardClient, type DashboardClientState } from '@/lib/dashboard-client';

/**
 * A session the person started on a screen (sign-in, apply, Google), kept on top of the
 * Preview pill's "view as" choice. It reuses the same data source, so an account created by
 * applying stays in the memory data until the page reloads or the Preview pill changes.
 */
export type ScreenSession =
  | { readonly kind: 'signed_out' }
  | {
      readonly kind: 'owner';
      readonly session: Session;
      readonly accountId: string;
      readonly isPendingOwner: boolean;
      readonly ownerLabel: string;
      readonly propertyName: string;
    };

export type DashboardHomeLoadState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'offline'; readonly message: string }
  | { readonly kind: 'error'; readonly code: string; readonly message: string }
  | { readonly kind: 'not_allowed'; readonly role: string }
  | { readonly kind: 'ready'; readonly counts: OwnerHomeCountsView };

export interface DashboardContextValue {
  readonly client: DashboardClientState | null;
  readonly clientLoading: boolean;
  readonly homeState: DashboardHomeLoadState;
  readonly today: string | null;
  readonly counts: OwnerHomeCountsView | null;
  readonly forcedOffline: boolean;
  readonly reload: () => void;
  /** Use a session returned by sign-in, apply or Google (same data source). */
  readonly adoptSession: (next: ScreenSession) => void;
}

function applyScreenSession(
  base: DashboardClientState | null,
  screen: ScreenSession | null,
): DashboardClientState | null {
  if (base === null || screen === null) return base;
  if (screen.kind === 'signed_out') {
    return { ...base, session: { role: 'guest' }, accountId: null, isPendingOwner: false };
  }
  return {
    ...base,
    session: screen.session,
    accountId: screen.accountId,
    isPendingOwner: screen.isPendingOwner,
    isPausedOwner: false,
    ownerLabel: screen.ownerLabel,
    propertyName: screen.propertyName,
  };
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { readonly children: ReactNode }) {
  const [baseClient, setClient] = useState<DashboardClientState | null>(null);
  const [screenSession, setScreenSession] = useState<ScreenSession | null>(null);
  const client = useMemo(
    () => applyScreenSession(baseClient, screenSession),
    [baseClient, screenSession],
  );
  const [clientLoading, setClientLoading] = useState(true);
  const [homeState, setHomeState] = useState<DashboardHomeLoadState>({ kind: 'loading' });
  const [reloadNonce, setReloadNonce] = useState(0);

  const reload = useCallback(() => {
    setClientLoading(true);
    setHomeState({ kind: 'loading' });
    setReloadNonce((prev) => prev + 1);
  }, []);

  useEffect(() => {
    const onSwitchChange = () => {
      setScreenSession(null);
      reload();
    };
    window.addEventListener('smartapp:switch-change', onSwitchChange);
    return () => {
      window.removeEventListener('smartapp:switch-change', onSwitchChange);
    };
  }, [reload]);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const nextClient = await loadDashboardClient(window.location.search);
        if (!active) return;
        setClient(nextClient);
        setClientLoading(false);
      } catch (caught: unknown) {
        if (!active) return;
        setClientLoading(false);
        const message = caught instanceof Error ? caught.message : String(caught);
        setHomeState({ kind: 'error', code: 'unavailable', message });
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [reloadNonce]);

  useEffect(() => {
    if (client === null) return;
    let active = true;
    const current = client;

    async function loadHome() {
      if (current.session.role === 'owner' && current.accountId) {
        setHomeState({ kind: 'loading' });
        const res = await current.source.ownerHome(
          { accountId: current.accountId },
          current.session,
        );
        if (!active) return;
        if (!res.ok) {
          if (res.error.details?.offline === true) {
            setHomeState({ kind: 'offline', message: res.error.message });
          } else {
            setHomeState({ kind: 'error', code: res.error.code, message: res.error.message });
          }
          return;
        }
        setHomeState({ kind: 'ready', counts: res.data });
        return;
      }

      if (current.session.role === 'super_admin') {
        setHomeState({
          kind: 'ready',
          counts: {
            arrivals_today: 0,
            departures_today: 0,
            proofs_to_check: 0,
            holds_expiring_soon: 0,
            unread_threads: 0,
          },
        });
        return;
      }

      setHomeState({ kind: 'not_allowed', role: current.session.role });
    }

    void loadHome().catch((caught: unknown) => {
      if (!active) return;
      const message = caught instanceof Error ? caught.message : String(caught);
      setHomeState({ kind: 'error', code: 'unavailable', message });
    });
    return () => {
      active = false;
    };
  }, [client]);

  const counts = homeState.kind === 'ready' ? homeState.counts : null;
  const today = client ? manilaToday(client.clock) : null;
  const forcedOffline = homeState.kind === 'offline' || client?.pack === 'offline';

  const value = useMemo<DashboardContextValue>(
    () => ({
      client,
      clientLoading,
      homeState,
      today,
      counts,
      forcedOffline,
      reload,
      adoptSession: setScreenSession,
    }),
    [client, clientLoading, homeState, today, counts, forcedOffline, reload],
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard(): DashboardContextValue {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error('useDashboard must be used inside DashboardProvider');
  }
  return ctx;
}
