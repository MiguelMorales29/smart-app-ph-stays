import {
  ACCOUNT_STATUSES,
  SUBSCRIPTION_DERIVED_STATES,
  manilaToday,
  type AdminOwnerItemView,
  type OwnerHomeCountsView,
} from '@smartapp/core';
import { useCallback, useEffect, useState } from 'react';

import { DashboardSwitchGate } from '@/components/DashboardSwitchGate';
import { PreviewRibbon } from '@/components/PreviewRibbon';
import { loadDashboardClient } from '@/lib/dashboard-client';

type DashboardLoadState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'empty'; readonly message: string }
  | { readonly kind: 'offline'; readonly message: string }
  | { readonly kind: 'error'; readonly code: string; readonly message: string }
  | {
      readonly kind: 'signed_out';
      readonly pack: string;
      readonly as: string;
      readonly role: string;
    }
  | {
      readonly kind: 'owner';
      readonly pack: string;
      readonly as: string;
      readonly today: string;
      readonly isPendingOwner: boolean;
      readonly counts: OwnerHomeCountsView;
    }
  | {
      readonly kind: 'super_admin';
      readonly pack: string;
      readonly as: string;
      readonly today: string;
      readonly owners: readonly AdminOwnerItemView[];
    };

export function App() {
  const [state, setState] = useState<DashboardLoadState>({ kind: 'loading' });
  const [reloadNonce, setReloadNonce] = useState(0);

  const refresh = useCallback(() => {
    setState({ kind: 'loading' });
    setReloadNonce((prev) => prev + 1);
  }, []);

  useEffect(() => {
    const onSwitchChange = () => {
      refresh();
    };
    window.addEventListener('smartapp:switch-change', onSwitchChange);
    return () => {
      window.removeEventListener('smartapp:switch-change', onSwitchChange);
    };
  }, [refresh]);

  useEffect(() => {
    let active = true;

    async function fetchDashboard() {
      try {
        const client = await loadDashboardClient(window.location.search);
        if (!active) return;

        const today = manilaToday(client.clock);

        if (client.session.role === 'owner' && client.accountId) {
          const homeRes = await client.source.ownerHome(
            { accountId: client.accountId },
            client.session,
          );
          if (!active) return;

          if (!homeRes.ok) {
            if (homeRes.error.details?.offline === true) {
              setState({ kind: 'offline', message: homeRes.error.message });
            } else {
              setState({
                kind: 'error',
                code: homeRes.error.code,
                message: homeRes.error.message,
              });
            }
            return;
          }

          setState({
            kind: 'owner',
            pack: client.pack,
            as: client.as,
            today,
            isPendingOwner: client.isPendingOwner,
            counts: homeRes.data,
          });
          return;
        }

        if (client.session.role === 'super_admin') {
          const ownersRes = await client.source.listOwnerAccounts(
            { status: null },
            client.session,
          );
          if (!active) return;

          if (!ownersRes.ok) {
            if (ownersRes.error.details?.offline === true) {
              setState({ kind: 'offline', message: ownersRes.error.message });
            } else {
              setState({
                kind: 'error',
                code: ownersRes.error.code,
                message: ownersRes.error.message,
              });
            }
            return;
          }

          if (ownersRes.data.length === 0) {
            setState({
              kind: 'empty',
              message: `No owner accounts in scenario "${client.pack}".`,
            });
            return;
          }

          setState({
            kind: 'super_admin',
            pack: client.pack,
            as: client.as,
            today,
            owners: ownersRes.data,
          });
          return;
        }

        setState({
          kind: 'signed_out',
          pack: client.pack,
          as: client.as,
          role: client.session.role,
        });
      } catch (caught: unknown) {
        if (!active) return;
        const message = caught instanceof Error ? caught.message : String(caught);
        setState({ kind: 'error', code: 'unavailable', message });
      }
    }

    void fetchDashboard();
    return () => {
      active = false;
    };
  }, [reloadNonce]);

  return (
    <div>
      <DashboardSwitchGate />
      <main>
        <h1>Smart App PH · Owner Dashboard & Super Admin</h1>

        {state.kind === 'loading' ? <p role="status">Loading dashboard…</p> : null}

        {state.kind === 'offline' ? (
          <section role="alert">
            <h2>Offline</h2>
            <p>{state.message}</p>
            <button type="button" onClick={refresh}>
              Retry
            </button>
          </section>
        ) : null}

        {state.kind === 'error' ? (
          <section role="alert">
            <h2>Something went wrong ({state.code})</h2>
            <p>{state.message}</p>
            <button type="button" onClick={refresh}>
              Retry
            </button>
          </section>
        ) : null}

        {state.kind === 'empty' ? (
          <section>
            <h2>Nothing here yet</h2>
            <p>{state.message}</p>
          </section>
        ) : null}

        {state.kind === 'signed_out' ? (
          <section>
            <h2>Dashboard requires an owner or super admin</h2>
            <p>
              Currently viewing as <strong>{state.as}</strong> (role: {state.role}, scenario:{' '}
              {state.pack}). Choose an owner or super admin in View as.
            </p>
          </section>
        ) : null}

        {state.kind === 'owner' ? (
          <section>
            <h2>Owner home counts</h2>
            <p>
              Scenario: <strong>{state.pack}</strong> · Viewing as: <strong>{state.as}</strong> ·
              Manila date: <strong>{state.today}</strong>
            </p>
            {state.isPendingOwner ? (
              <p role="status">
                Account status: pending super admin approval (counts stay empty until approved).
              </p>
            ) : null}
            <ul>
              <li>Proofs to check: {state.counts.proofs_to_check}</li>
              <li>Holds expiring soon: {state.counts.holds_expiring_soon}</li>
              <li>Arrivals today: {state.counts.arrivals_today}</li>
              <li>Departures today: {state.counts.departures_today}</li>
              <li>Unread threads: {state.counts.unread_threads}</li>
            </ul>
            {state.counts.proofs_to_check === 0 &&
            state.counts.holds_expiring_soon === 0 &&
            state.counts.arrivals_today === 0 &&
            state.counts.departures_today === 0 &&
            state.counts.unread_threads === 0 ? (
              <p>Empty state: all queues are zero for this owner in scenario “{state.pack}”.</p>
            ) : null}
          </section>
        ) : null}

        {state.kind === 'super_admin' ? (
          <section>
            <h2>Super admin · Owners by state ({state.owners.length})</h2>
            <p>
              Scenario: <strong>{state.pack}</strong> · Viewing as: <strong>{state.as}</strong> ·
              Manila date: <strong>{state.today}</strong>
            </p>
            <h3>Account status counts</h3>
            <ul>
              {ACCOUNT_STATUSES.map((accountStatus) => (
                <li key={accountStatus}>
                  {accountStatus}:{' '}
                  {state.owners.filter((owner) => owner.status === accountStatus).length}
                </li>
              ))}
            </ul>
            <h3>Subscription state counts</h3>
            <ul>
              {SUBSCRIPTION_DERIVED_STATES.map((subState) => (
                <li key={subState}>
                  {subState}:{' '}
                  {
                    state.owners.filter((owner) => owner.subscription_derived_state === subState)
                      .length
                  }
                </li>
              ))}
            </ul>
            <h3>Owner accounts</h3>
            <ul>
              {state.owners.map((owner) => (
                <li key={owner.id}>
                  <strong>{owner.name}</strong> — account: {owner.status} · subscription:{' '}
                  {owner.subscription_derived_state} · units: {owner.unit_count} · pending plan
                  payments: {owner.pending_plan_payments}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>
      <PreviewRibbon />
    </div>
  );
}

export default App;
