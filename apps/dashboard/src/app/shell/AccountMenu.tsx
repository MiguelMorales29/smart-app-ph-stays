import { Link } from '@tanstack/react-router';
import {
  ChevronsUpDownIcon,
  FlaskConicalIcon,
  LaptopIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MoonIcon,
  SettingsIcon,
  ShieldCheckIcon,
  SunIcon,
  UserIcon,
  WifiIcon,
  WifiOffIcon,
} from 'lucide-react';
import { Button } from '@smartapp/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@smartapp/ui/components/dropdown-menu';
import { SidebarMenuButton } from '@smartapp/ui/components/sidebar';
import { openDevPanel } from '@smartapp/ui/lib/dev-panel';
import { useDashboard } from '@/app/dashboard-context';
import { DashboardOwnerAvatar } from '@/app/owner-avatar';
import { useSignOut } from '@/app/auth/owner-session';
import { THEME_MODES, useTheme, type ThemeMode } from '@/app/theme';

function isThemeMode(value: string): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system';
}

const THEME_LABELS: Readonly<Record<ThemeMode, string>> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
};

function ThemeIcon({ mode }: { readonly mode: ThemeMode }) {
  if (mode === 'light') return <SunIcon className="size-4" aria-hidden="true" />;
  if (mode === 'dark') return <MoonIcon className="size-4" aria-hidden="true" />;
  return <LaptopIcon className="size-4" aria-hidden="true" />;
}

export function AccountMenu({
  placement,
  admin = false,
}: {
  readonly placement: 'sidebar' | 'top-bar';
  readonly admin?: boolean | undefined;
}) {
  const signOut = useSignOut();
  // D63: in preview builds the phone account menu holds the Preview switches (the pill hides).
  const previewSwitches =
    import.meta.env.VITE_DATA_SOURCE === 'memory' && import.meta.env.VITE_APP_ENV !== 'production';
  const { client, forcedOffline } = useDashboard();
  const { theme, setTheme } = useTheme();
  const online = !forcedOffline && (typeof window === 'undefined' ? true : window.navigator.onLine);
  const displayName = client?.ownerLabel ?? 'Account';
  const roleLabel =
    client?.session.role === 'super_admin'
      ? 'Super admin'
      : client?.session.role === 'owner'
        ? 'Property owner'
        : 'Signed out';

  const avatar = <DashboardOwnerAvatar name={displayName} className="size-8 shrink-0 text-xs" />;

  return (
    <DropdownMenu>
      {placement === 'sidebar' ? (
        <DropdownMenuTrigger
          render={
            <SidebarMenuButton
              size="lg"
              className="aria-expanded:bg-muted pointer-coarse:min-h-11 tablet-rail:size-11! tablet-rail:p-1.5!"
              data-dev-panel-menu={previewSwitches ? '' : undefined}
            />
          }
        >
          {avatar}
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">{displayName}</span>
            <span className="truncate text-xs text-muted-foreground">{roleLabel}</span>
          </div>
          <ChevronsUpDownIcon className="ml-auto size-4 shrink-0" aria-hidden="true" />
        </DropdownMenuTrigger>
      ) : (
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="size-11 rounded-full"
              data-dev-panel-menu={previewSwitches ? '' : undefined}
            />
          }
        >
          {avatar}
          <span className="sr-only">Account menu</span>
        </DropdownMenuTrigger>
      )}
      <DropdownMenuContent
        side={placement === 'sidebar' ? 'right' : 'bottom'}
        align="end"
        sideOffset={6}
        className="min-w-60"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-2.5 px-2 py-2 text-left text-sm">
              {avatar}
              <div className="grid min-w-0 flex-1 leading-tight">
                <span className="truncate font-medium text-foreground">{displayName}</span>
                <span className="truncate text-xs text-muted-foreground">{roleLabel}</span>
              </div>
            </div>
            <p
              role="status"
              className="flex items-center gap-1.5 px-2 pb-2 text-xs text-muted-foreground"
            >
              {online ? (
                <WifiIcon aria-hidden="true" className="size-3.5 text-success" />
              ) : (
                <WifiOffIcon aria-hidden="true" className="size-3.5 text-warning" />
              )}
              {online ? 'Online' : 'Offline'}
            </p>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Appearance</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={theme}
            onValueChange={(nextValue) => {
              if (isThemeMode(nextValue)) {
                setTheme(nextValue);
              }
            }}
          >
            {THEME_MODES.map((mode) => (
              <DropdownMenuRadioItem key={mode} value={mode} className="min-h-10">
                <ThemeIcon mode={mode} />
                <span>{THEME_LABELS[mode]}</span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        {previewSwitches ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="min-h-10" onClick={openDevPanel}>
              <FlaskConicalIcon aria-hidden="true" className="text-warning" />
              <span>Preview · sample data</span>
            </DropdownMenuItem>
          </>
        ) : null}
        <DropdownMenuSeparator />
        {!admin ? (
          <>
            <DropdownMenuItem className="min-h-10" render={<Link to="/settings/account" />}>
              <UserIcon aria-hidden="true" />
              <span>My account</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="min-h-10" render={<Link to="/settings" />}>
              <SettingsIcon aria-hidden="true" />
              <span>Settings</span>
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem className="min-h-10" render={<Link to="/home" />}>
            <LayoutDashboardIcon aria-hidden="true" />
            <span>Owner dashboard</span>
          </DropdownMenuItem>
        )}
        {client?.session.role === 'super_admin' && !admin ? (
          <DropdownMenuItem className="min-h-10" render={<Link to="/admin" />}>
            <ShieldCheckIcon aria-hidden="true" />
            <span>Super admin</span>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="min-h-10"
          onClick={() => {
            void signOut();
          }}
        >
          <LogOutIcon aria-hidden="true" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
