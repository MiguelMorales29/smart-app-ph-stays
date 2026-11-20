import { Link, Outlet } from '@tanstack/react-router';
import { ArrowLeftIcon } from 'lucide-react';
import { Button } from '@smartapp/ui/components/button';
import { OfflineBanner } from '@smartapp/ui/compositions/offline-banner';
import { PausedAccountBanner } from '@smartapp/ui/compositions/paused-account-banner';
import { useDashboard } from '@/app/dashboard-context';
import { useDocumentTitle, usePageMeta } from '@/app/page-meta';
import { DashboardSwitchGate } from '@/components/DashboardSwitchGate';
import { PreviewRibbon } from '@/components/PreviewRibbon';
import { AccountMenu } from './AccountMenu';
import { useSwipeBack } from './use-swipe-back';

export function FocusFrame() {
  const { client, forcedOffline } = useDashboard();
  useSwipeBack();
  const page = usePageMeta();
  useDocumentTitle(page.title);

  return (
    <div data-frame="focus" className="flex min-h-dvh flex-col bg-background text-foreground">
      <OfflineBanner forceOffline={forcedOffline} />
      <DashboardSwitchGate />
      <PreviewRibbon />

      <header className="sticky top-0 z-20 border-b border-border frost pt-safe">
        <div className="mx-auto flex min-h-14 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="min-h-11 gap-1.5 px-2.5 sm:min-h-9"
              nativeButton={false}
              render={<Link to="/home" />}
            >
              <ArrowLeftIcon className="size-4" aria-hidden="true" />
              <span>Dashboard</span>
            </Button>
            <span aria-hidden="true" className="text-muted-foreground">
              /
            </span>
            <span className="truncate font-heading text-sm font-semibold sm:text-base">
              {page.title}
            </span>
          </div>
          <AccountMenu placement="top-bar" />
        </div>
      </header>

      {client?.isPausedOwner ? (
        <PausedAccountBanner
          propertyName={client.propertyName}
          action={
            <Button
              size="sm"
              variant="outline"
              className="min-h-11 sm:min-h-9"
              nativeButton={false}
              render={<Link to="/settings/plan" />}
            >
              Review plan
            </Button>
          }
        />
      ) : null}

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-safe sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
