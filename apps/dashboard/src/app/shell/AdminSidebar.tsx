import { createElement } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { ShieldCheckIcon } from 'lucide-react';
import { Badge } from '@smartapp/ui/components/badge';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@smartapp/ui/components/sidebar';
import { ADMIN_NAV_ITEMS, isActiveRoutePath } from '@/app/nav-config';
import { AccountMenu } from './AccountMenu';

export function AdminSidebar() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="Super admin · Smart App PH"
              className="pointer-coarse:min-h-11 tablet-rail:size-11! tablet-rail:p-1.5!"
              render={<Link to="/admin" />}
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <ShieldCheckIcon className="size-4" aria-hidden="true" />
              </span>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Smart App PH</span>
                <span className="truncate text-xs font-medium text-primary">Super admin</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Super admin</SidebarGroupLabel>
          <SidebarMenu aria-label="Super admin navigation" className="gap-1">
            {ADMIN_NAV_ITEMS.map((item) => {
              const active = isActiveRoutePath(pathname, item.path);
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
            <AccountMenu placement="sidebar" admin />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
