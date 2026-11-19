import { Link } from '@tanstack/react-router';
import { WifiOffIcon } from 'lucide-react';
import { Button } from '@smartapp/ui/components/button';
import { EmptyState } from '@smartapp/ui/compositions/empty-state';
import { ErrorState } from '@smartapp/ui/compositions/error-state';
import { LoadingState } from '@smartapp/ui/compositions/loading-state';
import { NotAllowedState } from '@smartapp/ui/compositions/not-allowed-state';
import { useDashboard } from '@/app/dashboard-context';
import { ApprovalBanner } from '@/app/auth/approval-banner';

export function HomePage() {
  const { client, homeState, today, reload } = useDashboard();

  return (
    <section className="space-y-6">
      <ApprovalBanner />
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Dashboard home</h1>
        <p className="text-sm text-muted-foreground">Coming in phase 8</p>
        {client ? (
          <p className="text-xs text-muted-foreground">
            Scenario: {client.pack} · Role: {client.session.role}
            {today ? ` · Manila date: ${today}` : ''}
          </p>
        ) : null}
      </div>

      {homeState.kind === 'loading' ? <LoadingState label="Loading dashboard home" /> : null}

      {homeState.kind === 'error' ? (
        <ErrorState
          title="Could not load dashboard home"
          message={`${homeState.message} (${homeState.code})`}
          onRetry={reload}
        />
      ) : null}

      {homeState.kind === 'offline' ? (
        <EmptyState
          icon={<WifiOffIcon />}
          title="Offline right now"
          description={homeState.message}
          action={
            <Button variant="outline" className="min-h-11 sm:min-h-9" onClick={reload}>
              Try again
            </Button>
          }
        />
      ) : null}

      {homeState.kind === 'not_allowed' ? (
        <NotAllowedState
          title="Owner sign-in required"
          message={`Current view-as role (${homeState.role}) cannot load an owner dashboard.`}
          action={
            <Button
              variant="outline"
              className="min-h-11 sm:min-h-9"
              nativeButton={false}
              render={<Link to="/login" />}
            >
              Go to sign in
            </Button>
          }
        />
      ) : null}

      {homeState.kind === 'ready' ? (
        <p className="text-sm text-muted-foreground">
          Sidebar and bottom dock counts are wired to <code>ownerHome</code> (
          {homeState.counts.arrivals_today} arrivals today · {homeState.counts.departures_today}{' '}
          departures · {homeState.counts.proofs_to_check} proofs to check ·{' '}
          {homeState.counts.holds_expiring_soon} holds expiring · {homeState.counts.unread_threads}{' '}
          unread threads).
        </p>
      ) : null}
    </section>
  );
}
