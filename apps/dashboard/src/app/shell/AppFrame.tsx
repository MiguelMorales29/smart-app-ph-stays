import { createElement, useState } from 'react';
import { Link, Outlet, useNavigate, useRouterState } from '@tanstack/react-router';
import { cn } from '@smartapp/ui/lib/utils';
import { Button } from '@smartapp/ui/components/button';
import { SidebarInset, SidebarProvider } from '@smartapp/ui/components/sidebar';
import { AppSheet } from '@smartapp/ui/compositions/app-sheet';
import { BottomDock } from '@smartapp/ui/compositions/bottom-dock';
import { RowButton, RowGroup } from '@smartapp/ui/compositions/grouped-rows';
import { OfflineBanner } from '@smartapp/ui/compositions/offline-banner';
import { PausedAccountBanner } from '@smartapp/ui/compositions/paused-account-banner';
import { useFormFactor } from '@smartapp/ui/hooks/use-form-factor';
import type { NavItem } from '@smartapp/ui/lib/nav';
import { useDashboard } from '@/app/dashboard-context';
import {
  ACTIVE_WAVE,
  DASHBOARD_NAV_ITEMS,
  QUICK_ADD_ITEMS,
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

export function AppFrame() {
  const formFactor = useFormFactor();
  useSwipeBack();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { client, counts, forcedOffline } = useDashboard();
  const page = usePageMeta();
  useDocumentTitle(page.title);
  const { sidebarOpen, onSidebarOpenChange } = useResponsiveSidebarOpen(formFactor);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const visibleItems = DASHBOARD_NAV_ITEMS.filter((item) => item.wave <= ACTIVE_WAVE);
  const quickAddItems = QUICK_ADD_ITEMS.filter((item) => item.wave <= ACTIVE_WAVE);

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
              'mx-auto w-full max-w-5xl flex-1 px-4 py-6 outline-none sm:px-6',
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
            action={{ label: 'Add', onClick: () => setQuickAddOpen(true) }}
            more={{ label: 'More', items: moreItems }}
          />
          <AppSheet
            open={quickAddOpen}
            onOpenChange={setQuickAddOpen}
            title="Add"
            height="half"
            size="sm"
          >
            <RowGroup>
              {quickAddItems.map((item) => (
                <RowButton
                  key={item.id}
                  label={item.label}
                  hint={item.hint}
                  icon={createElement(item.icon)}
                  onClick={() => {
                    setQuickAddOpen(false);
                    void navigate({ to: item.to, search: item.search });
                  }}
                />
              ))}
            </RowGroup>
          </AppSheet>
        </>
      ) : null}
    </div>
  );
}
