import { Suspense, createElement, lazy, useEffect, useState } from 'react';
import { Link, Outlet, useRouterState } from '@tanstack/react-router';
import { cn } from '@smartapp/ui/lib/utils';
import { Button } from '@smartapp/ui/components/button';
import { SidebarInset, SidebarProvider } from '@smartapp/ui/components/sidebar';
import { BottomDock } from '@smartapp/ui/compositions/bottom-dock';
import { OfflineBanner } from '@smartapp/ui/compositions/offline-banner';
import { PausedAccountBanner } from '@smartapp/ui/compositions/paused-account-banner';
import { useFormFactor } from '@smartapp/ui/hooks/use-form-factor';
import type { NavItem } from '@smartapp/ui/lib/nav';
import { useDashboard } from '@/app/dashboard-context';
import {
  ACTIVE_WAVE,
  DASHBOARD_NAV_ITEMS,
  isActiveRoutePath,
  resolveNavCount,
} from '@/app/nav-config';
import { useDocumentTitle, usePageMeta } from '@/app/page-meta';
import { DashboardSwitchGate } from '@/components/DashboardSwitchGate';
import { PreviewRibbon } from '@/components/PreviewRibbon';
import { AppSidebar } from './AppSidebar';
import { TopBar } from './TopBar';
import { useResponsiveSidebarOpen } from './use-sidebar-open';
import { useSwipeBack } from './use-swipe-back';

const loadQuickAddSheet = () =>
  import('./QuickAddSheet').then((mod) => ({ default: mod.QuickAddSheet }));

const QuickAddSheet = lazy(loadQuickAddSheet);

function preloadQuickAddSheet(): void {
  void loadQuickAddSheet();
}

export function AppFrame() {
  const formFactor = useFormFactor();
  useSwipeBack();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { client, counts, forcedOffline } = useDashboard();
  const page = usePageMeta();
  useDocumentTitle(page.title);
  const { sidebarOpen, onSidebarOpenChange } = useResponsiveSidebarOpen(formFactor);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const visibleItems = DASHBOARD_NAV_ITEMS.filter((item) => item.wave <= ACTIVE_WAVE);

  function toNavItem(item: (typeof visibleItems)[number]): NavItem {
    const count = resolveNavCount(item.countKey, counts);
    return {
      id: item.id,
      label: item.label,
      icon: createElement(item.icon),
      link: createElement(Link, { to: item.path }),
      active: isActiveRoutePath(pathname, item.path),
      ...(count !== undefined ? { count } : {}),
    };
  }

  const dockItems = visibleItems.filter((item) => item.mobileSlot === 'dock').map(toNavItem);
  const moreItems = visibleItems.filter((item) => item.mobileSlot === 'more').map(toNavItem);
  const showDock = formFactor === 'phone';

  // Preload the Quick Add sheet chunk on idle when the phone dock is visible so first tap opens immediately.
  useEffect(() => {
    if (!showDock) return;
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(() => {
        preloadQuickAddSheet();
      });
      return () => {
        window.cancelIdleCallback(id);
      };
    }
    const timer = window.setTimeout(preloadQuickAddSheet, 1200);
    return () => {
      window.clearTimeout(timer);
    };
  }, [showDock]);

  return (
    <div
      data-frame="app"
      data-shell={formFactor}
      className="min-h-dvh bg-background text-foreground"
    >
      <DashboardSwitchGate />

      <SidebarProvider open={sidebarOpen} onOpenChange={onSidebarOpenChange}>
        {formFactor !== 'phone' ? <AppSidebar /> : null}
        <SidebarInset className="min-w-0">
          <OfflineBanner forceOffline={forcedOffline} />
          <PreviewRibbon />
          <TopBar formFactor={formFactor} page={page} />
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
          <main
            id="main"
            tabIndex={-1}
            className={cn(
              'mx-auto w-full flex-1 px-4 py-6 outline-none sm:px-6',
              page.wide ? 'max-w-7xl' : 'max-w-5xl',
              showDock && 'pb-dock',
            )}
          >
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>

      {showDock ? (
        <>
          <BottomDock
            label="Owner dashboard navigation"
            items={dockItems}
            action={{
              label: 'Add',
              onPointerDown: preloadQuickAddSheet,
              onClick: () => setQuickAddOpen(true),
            }}
            more={{ label: 'More', items: moreItems }}
          />
          {quickAddOpen ? (
            <Suspense fallback={null}>
              <QuickAddSheet open={quickAddOpen} onOpenChange={setQuickAddOpen} />
            </Suspense>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
