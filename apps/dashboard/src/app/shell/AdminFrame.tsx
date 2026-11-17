import { createElement } from 'react';
import { Link, Outlet, useRouterState } from '@tanstack/react-router';
import { cn } from '@smartapp/ui/lib/utils';
import { Badge } from '@smartapp/ui/components/badge';
import { Button } from '@smartapp/ui/components/button';
import { SidebarInset, SidebarProvider } from '@smartapp/ui/components/sidebar';
import { BottomDock } from '@smartapp/ui/compositions/bottom-dock';
import { LoadingState } from '@smartapp/ui/compositions/loading-state';
import { NotAllowedState } from '@smartapp/ui/compositions/not-allowed-state';
import { OfflineBanner } from '@smartapp/ui/compositions/offline-banner';
import { useFormFactor } from '@smartapp/ui/hooks/use-form-factor';
import type { NavItem } from '@smartapp/ui/lib/nav';
import { useDashboard } from '@/app/dashboard-context';
import { ADMIN_NAV_ITEMS, isActiveRoutePath } from '@/app/nav-config';
import { useDocumentTitle, usePageMeta } from '@/app/page-meta';
import { DashboardSwitchGate } from '@/components/DashboardSwitchGate';
import { PreviewRibbon } from '@/components/PreviewRibbon';
import { AdminSidebar } from './AdminSidebar';
import { TopBar } from './TopBar';
import { useResponsiveSidebarOpen } from './use-sidebar-open';

export function AdminFrame() {
  const formFactor = useFormFactor();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { client, clientLoading, forcedOffline } = useDashboard();
  const page = usePageMeta();
  useDocumentTitle(`${page.title} · Super admin`);
  const { sidebarOpen, onSidebarOpenChange } = useResponsiveSidebarOpen(formFactor);

  function toNavItem(item: (typeof ADMIN_NAV_ITEMS)[number]): NavItem {
    return {
      id: item.id,
      label: item.label,
      icon: createElement(item.icon),
      link: createElement(Link, { to: item.path }),
      active: isActiveRoutePath(pathname, item.path),
    };
  }

  const dockItems = ADMIN_NAV_ITEMS.filter((item) => item.mobileSlot === 'dock').map(toNavItem);
  const moreItems = ADMIN_NAV_ITEMS.filter((item) => item.mobileSlot === 'more').map(toNavItem);
  const showDock = formFactor === 'phone';
  const isSuperAdmin = client?.session.role === 'super_admin';

  return (
    <div
      data-frame="admin"
      data-shell={formFactor}
      className="min-h-dvh bg-background text-foreground"
    >
      <DashboardSwitchGate />

      <SidebarProvider open={sidebarOpen} onOpenChange={onSidebarOpenChange}>
        {formFactor !== 'phone' ? <AdminSidebar /> : null}
        <SidebarInset className="min-w-0">
          <OfflineBanner forceOffline={forcedOffline} />
          <PreviewRibbon />
          <div className="flex items-center justify-between border-b border-border bg-primary-tint/40 px-4 py-1.5 text-xs">
            <div className="flex items-center gap-2">
              <Badge variant="default">Super admin</Badge>
              <span className="text-muted-foreground">Platform management workspace</span>
            </div>
          </div>
          <TopBar formFactor={formFactor} page={page} admin />
          <main
            id="main"
            tabIndex={-1}
            className={cn(
              'mx-auto w-full max-w-5xl flex-1 px-4 py-6 outline-none sm:px-6',
              showDock && 'pb-dock',
            )}
          >
            {clientLoading ? (
              <LoadingState label="Loading super admin workspace" />
            ) : !isSuperAdmin ? (
              <NotAllowedState
                title="Super admin access required"
                message="Open the Preview pill, set View as to Super admin, or sign in with the founder account."
                action={
                  <Button
                    className="min-h-11 sm:min-h-9"
                    nativeButton={false}
                    render={<Link to="/home" />}
                  >
                    Back to owner dashboard
                  </Button>
                }
              />
            ) : (
              <Outlet />
            )}
          </main>
        </SidebarInset>
      </SidebarProvider>

      {showDock ? (
        <BottomDock
          label="Super admin navigation"
          items={dockItems}
          more={{ label: 'More', items: moreItems }}
        />
      ) : null}
    </div>
  );
}
