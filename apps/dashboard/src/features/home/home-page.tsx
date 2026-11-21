import { Link } from '@tanstack/react-router';
import { ChevronRightIcon, WifiOffIcon } from 'lucide-react';
import { Button } from '@smartapp/ui/components/button';
import { EmptyState } from '@smartapp/ui/compositions/empty-state';
import { MilestonePicture } from '@smartapp/ui/compositions/milestone-picture';
import { ErrorState } from '@smartapp/ui/compositions/error-state';
import { LoadingState } from '@smartapp/ui/compositions/loading-state';
import { NotAllowedState } from '@smartapp/ui/compositions/not-allowed-state';
import { useDashboard } from '@/app/dashboard-context';
import { ApprovalBanner } from '@/app/auth/approval-banner';
import { SetupChecklistCard, useSetupComplete } from './setup-checklist-card';

export function HomePage() {
  const { homeState, reload } = useDashboard();
  const setupComplete = useSetupComplete();

  return (
    <section className="space-y-6 pb-8">
      <ApprovalBanner />
      {/* Phones show the title in the top bar; Pattern Guide §3.10: no developer text here. */}
      <h1 className="font-heading text-2xl font-semibold tracking-tight max-md:sr-only">Home</h1>

      {homeState.kind === 'loading' ? <LoadingState label="Loading dashboard home" /> : null}

      {homeState.kind === 'error' ? (
        <ErrorState
          title="We couldn't load your home page"
          message={homeState.message}
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
          title="Sign in as an owner"
          message="This page is for property owners. Sign in with your owner account to see it."
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

      {homeState.kind === 'ready' ? <SetupChecklistCard /> : null}

      {homeState.kind === 'ready' && setupComplete ? (
        <EmptyState
          icon={<MilestonePicture art="live" size="sm" />}
          title="Nothing needs you right now"
          description="New bookings, arrivals and payments to check will show up here."
          action={
            <Button
              variant="outline"
              className="min-h-11 sm:min-h-9"
              nativeButton={false}
              render={<Link to="/calendar" />}
            >
              Open your calendar
            </Button>
          }
        />
      ) : null}

      {homeState.kind === 'ready' ? (
        <div className="flex justify-center pt-1">
          <Link
            to="/bookings"
            className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-primary-hover underline-offset-4 hover-hover:hover:underline sm:min-h-9"
          >
            <span>See all bookings</span>
            <ChevronRightIcon aria-hidden="true" className="size-4" />
          </Link>
        </div>
      ) : null}
    </section>
  );
}
