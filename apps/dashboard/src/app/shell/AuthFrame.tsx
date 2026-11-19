import { Outlet } from '@tanstack/react-router';
import { cn } from '@smartapp/ui/lib/utils';
import { Building2Icon, LaptopIcon, MoonIcon, SunIcon } from 'lucide-react';
import { Button } from '@smartapp/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@smartapp/ui/components/dropdown-menu';
import { OfflineBanner } from '@smartapp/ui/compositions/offline-banner';
import { useDashboard } from '@/app/dashboard-context';
import { useDocumentTitle, usePageMeta } from '@/app/page-meta';
import { THEME_MODES, useTheme, type ThemeMode } from '@/app/theme';
import { DashboardSwitchGate } from '@/components/DashboardSwitchGate';
import { PreviewRibbon } from '@/components/PreviewRibbon';

function isThemeMode(value: string): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system';
}

const THEME_LABELS: Readonly<Record<ThemeMode, string>> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
};

export function AuthFrame() {
  const { forcedOffline } = useDashboard();
  const page = usePageMeta();
  const { theme, setTheme } = useTheme();
  useDocumentTitle(page.title);

  return (
    <div data-frame="auth" className="flex min-h-dvh flex-col bg-background text-foreground">
      <OfflineBanner forceOffline={forcedOffline} />
      <DashboardSwitchGate />
      <PreviewRibbon />

      <header className="border-b border-border bg-card pt-safe">
        <div className="mx-auto flex min-h-14 w-full max-w-3xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2Icon className="size-4" aria-hidden="true" />
            </span>
            <div>
              <p className="font-heading text-sm font-semibold leading-tight">Smart App PH</p>
              <p className="text-xs text-muted-foreground">Owner portal</p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm" className="min-h-11 gap-2 sm:min-h-9">
                  {theme === 'light' ? (
                    <SunIcon className="size-4" aria-hidden="true" />
                  ) : theme === 'dark' ? (
                    <MoonIcon className="size-4" aria-hidden="true" />
                  ) : (
                    <LaptopIcon className="size-4" aria-hidden="true" />
                  )}
                  <span>{THEME_LABELS[theme]}</span>
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Theme</DropdownMenuLabel>
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
                    {THEME_LABELS[mode]}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main
        className={cn(
          'mx-auto flex w-full flex-1 items-center px-4 py-8 pb-safe sm:py-10',
          page.wide ? 'max-w-5xl' : 'max-w-md',
        )}
      >
        <div
          className={cn(
            'w-full rounded-xl border border-border bg-card text-card-foreground shadow-sm',
            page.wide ? 'overflow-hidden' : 'p-6',
          )}
        >
          <Outlet />
        </div>
      </main>
    </div>
  );
}
