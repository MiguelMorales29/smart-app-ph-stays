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
import { loadDashboardClient, type DashboardClientState } from '@/lib/dashboard-client';

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
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { readonly children: ReactNode }) {
  const [client, setClient] = useState<DashboardClientState | null>(null);
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

        if (nextClient.session.role === 'owner' && nextClient.accountId) {
          setHomeState({ kind: 'loading' });
          const res = await nextClient.source.ownerHome(
            { accountId: nextClient.accountId },
            nextClient.session,
          );
          if (!active) return;

          if (!res.ok) {
            if (res.error.details?.offline === true) {
              setHomeState({ kind: 'offline', message: res.error.message });
            } else {
              setHomeState({
                kind: 'error',
                code: res.error.code,
                message: res.error.message,
              });
            }
            return;
          }

          setHomeState({ kind: 'ready', counts: res.data });
          return;
        }

        if (nextClient.session.role === 'super_admin') {
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

        setHomeState({ kind: 'not_allowed', role: nextClient.session.role });
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
