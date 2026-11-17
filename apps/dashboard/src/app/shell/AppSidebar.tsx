import { createElement } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { Building2Icon, ChevronsUpDownIcon } from 'lucide-react';
import { Badge } from '@smartapp/ui/components/badge';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@smartapp/ui/components/sidebar';
import { useDashboard } from '@/app/dashboard-context';
import {
  ACTIVE_WAVE,
  DASHBOARD_NAV_ITEMS,
  isActiveRoutePath,
  resolveNavCount,
} from '@/app/nav-config';
import { AccountMenu } from './AccountMenu';

export function AppSidebar() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { client, counts } = useDashboard();
  const visibleItems = DASHBOARD_NAV_ITEMS.filter((item) => item.wave <= ACTIVE_WAVE);
  const propertyName = client?.propertyName ?? 'My Property';

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip={`${propertyName} · Property switcher (coming soon)`}
              className="pointer-coarse:min-h-11 tablet-rail:size-11! tablet-rail:p-1.5!"
              render={<Link to="/settings/property" />}
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Building2Icon className="size-4" aria-hidden="true" />
              </span>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{propertyName}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {client?.isPausedOwner ? 'Paused' : 'Property switcher'}
                </span>
              </div>
              <ChevronsUpDownIcon
                className="ml-auto size-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu aria-label="Owner dashboard navigation" className="gap-1">
            {visibleItems.map((item) => {
              const active = isActiveRoutePath(pathname, item.path);
              const count = resolveNavCount(item.countKey, counts);
              return (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={active}
                    tooltip={item.label}
                    render={<Link to={item.path} />}
                    className="pointer-coarse:min-h-11 tablet-rail:size-11! tablet-rail:p-3.5!"
                  >
                    {createElement(item.icon, { 'aria-hidden': true })}
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                  {count !== undefined ? (
                    <SidebarMenuBadge className="tabular">{count}</SidebarMenuBadge>
                  ) : null}
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu className="gap-1">
          {import.meta.env.VITE_APP_ENV !== 'production' ? (
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={isActiveRoutePath(pathname, '/kit')}
                tooltip="UI Kit & route index"
                render={<a href="/kit" />}
                className="pointer-coarse:min-h-11 tablet-rail:size-11! tablet-rail:p-3.5!"
              >
                <Badge variant="outline" className="px-1.5 text-[10px]">
                  DEV
                </Badge>
                <span>UI Kit</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ) : null}
          <SidebarMenuItem>
            <AccountMenu placement="sidebar" />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
