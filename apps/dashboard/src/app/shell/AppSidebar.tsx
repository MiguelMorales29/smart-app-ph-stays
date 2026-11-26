import { createElement } from 'react';
import { Link, useNavigate, useRouterState } from '@tanstack/react-router';
import { ChevronRightIcon, PlusIcon, ShapesIcon } from 'lucide-react';
import { Badge } from '@smartapp/ui/components/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@smartapp/ui/components/dropdown-menu';
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
import { StatusAvatar } from '@smartapp/ui/compositions/status-avatar';
import { useDashboard } from '@/app/dashboard-context';
import {
  ACTIVE_WAVE,
  DASHBOARD_NAV_ITEMS,
  QUICK_ADD_ITEMS,
  isActiveRoutePath,
  resolveNavCount,
} from '@/app/nav-config';
import { AccountMenu } from './AccountMenu';

export function AppSidebar() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { client, counts } = useDashboard();
  const visibleItems = DASHBOARD_NAV_ITEMS.filter((item) => item.wave <= ACTIVE_WAVE);
  const quickAddItems = QUICK_ADD_ITEMS.filter((item) => item.wave <= ACTIVE_WAVE);
  const propertyName = client?.propertyName ?? 'My Property';

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu className="gap-1">
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip={`${propertyName} · Property details`}
              className="pointer-coarse:min-h-11 tablet-rail:size-11! tablet-rail:p-1.5!"
              render={<Link to="/settings/property" />}
            >
              <StatusAvatar
                name={propertyName}
                shape="rounded"
                status={client?.isPausedOwner ? 'paused' : 'open'}
                statusLabel=""
              />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{propertyName}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {client?.isPausedOwner ? 'Paused · Property details' : 'Open · Property details'}
                </span>
              </div>
              <ChevronRightIcon
                className="ml-auto size-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    tooltip="New"
                    aria-label="New"
                    className="h-9 justify-center rounded-lg bg-primary font-medium text-primary-foreground hover:bg-primary-hover hover:text-primary-foreground active:bg-primary-hover active:text-primary-foreground data-open:hover:bg-primary-hover data-open:hover:text-primary-foreground group-data-[collapsible=icon]:rounded-full pointer-coarse:min-h-11 tablet-rail:size-11! tablet-rail:p-3.5!"
                  />
                }
              >
                <PlusIcon aria-hidden="true" />
                <span className="group-data-[collapsible=icon]:hidden">New</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="right"
                align="start"
                sideOffset={6}
                className="min-w-[280px]"
              >
                {quickAddItems.map((item) => (
                  <DropdownMenuItem
                    key={item.id}
                    className="min-h-10 items-start gap-2.5 py-2"
                    onClick={() => void navigate({ to: item.to, search: item.search })}
                  >
                    {createElement(item.icon, {
                      'aria-hidden': true,
                      className: 'mt-0.5 size-4 shrink-0 text-muted-foreground',
                    })}
                    <div className="grid min-w-0 flex-1 leading-tight">
                      <span className="font-medium text-foreground">{item.label}</span>
                      <span className="text-xs text-muted-foreground">{item.hint}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
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
                <ShapesIcon aria-hidden="true" />
                <span>UI Kit</span>
                <Badge variant="outline" className="ml-auto px-1.5 text-[10px]">
                  DEV
                </Badge>
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
