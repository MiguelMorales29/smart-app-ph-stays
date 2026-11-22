import { Suspense, lazy } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { LaptopIcon, MoonIcon, SunIcon } from 'lucide-react';
import { Badge } from '@smartapp/ui/components/badge';
import { Button } from '@smartapp/ui/components/button';
import { useDashboard } from '@/app/dashboard-context';
import type { RouteFrameKind } from '@/app/nav-config';
import { useDocumentTitle } from '@/app/page-meta';
import { THEME_MODES, useTheme, type ThemeMode } from '@/app/theme';
import { DashboardSwitchGate } from '@/components/DashboardSwitchGate';
import { PreviewRibbon } from '@/components/PreviewRibbon';
import { env } from '@/env';
import { DASHBOARD_ROUTE_CATALOG } from './route-catalog';

const KitBaseTab = lazy(() => import('./kit-base-tab').then((m) => ({ default: m.KitBaseTab })));
const KitDashboardTab = lazy(() =>
  import('./kit-dashboard-tab').then((m) => ({ default: m.KitDashboardTab })),
);
const KitFormsTab = lazy(() => import('./kit-forms-tab').then((m) => ({ default: m.KitFormsTab })));
const KitPatternsTab = lazy(() =>
  import('./kit-patterns-tab').then((m) => ({ default: m.KitPatternsTab })),
);
const KitTokensTab = lazy(() =>
  import('./kit-tokens-tab').then((m) => ({ default: m.KitTokensTab })),
);

type KitTabKey = 'base' | 'forms' | 'patterns' | 'dashboard' | 'tokens';

function parseKitTab(searchStr: string): KitTabKey {
  const params = new URLSearchParams(searchStr);
  const raw = params.get('tab');
  if (raw === 'dashboard' || raw === 'tokens' || raw === 'forms' || raw === 'patterns') return raw;
  return 'base';
}

interface StorefrontRouteTemplate {
  readonly path: string;
  readonly label: string;
  readonly frame: RouteFrameKind;
  readonly phase: number;
}

const STOREFRONT_ROUTE_TEMPLATES: readonly StorefrontRouteTemplate[] = [
  { path: '/', label: 'Owner landing page', frame: 'LandingFrame', phase: 9 },
  { path: '/<slug>', label: 'Property home', frame: 'PropertyFrame', phase: 4 },
  { path: '/<slug>/units/<unit>', label: 'Unit details', frame: 'PropertyFrame', phase: 4 },
  { path: '/<slug>/book', label: 'Book a stay', frame: 'PropertyFrame', phase: 6 },
  { path: '/<slug>/inquire', label: 'Send an inquiry', frame: 'PropertyFrame', phase: 6 },
  { path: '/<slug>/t/<token>', label: 'Guest conversation', frame: 'ConversationFrame', phase: 7 },
  { path: '/<slug>/find', label: 'Find my booking', frame: 'PropertyFrame', phase: 7 },
  { path: '/<slug>/join', label: 'Guest sign-in', frame: 'PropertyFrame', phase: 8 },
  { path: '/<slug>/account', label: 'Guest account', frame: 'PropertyFrame', phase: 8 },
  { path: '/<slug>/privacy', label: 'Privacy notice', frame: 'PropertyFrame', phase: 4 },
  { path: '/<slug>/install', label: 'Install app', frame: 'PropertyFrame', phase: 9 },
  { path: '/kit', label: 'Storefront UI Kit', frame: 'PropertyFrame', phase: 3 },
];

const DEMO_BRANDS = [
  { slug: 'ulap-suites', name: 'Ulap Suites', unitSlug: 'cloud-loft' },
  { slug: 'bahay-batis', name: 'Bahay Batis', unitSlug: 'river-villa' },
  { slug: 'ilaw-residences', name: 'Ilaw Residences', unitSlug: 'studio-2a' },
  { slug: 'tita-lorna-dorm', name: "Tita Lorna's Dorm", unitSlug: 'room-101' },
] as const;

function expandStorefrontPath(template: string, slug: string, unitSlug: string): string {
  return template
    .replace('<slug>', slug)
    .replace('<unit>', unitSlug)
    .replace('<token>', 'demo-token');
}

function ThemeModeIcon({ mode }: { readonly mode: ThemeMode }) {
  if (mode === 'light') return <SunIcon className="size-4" aria-hidden="true" />;
  if (mode === 'dark') return <MoonIcon className="size-4" aria-hidden="true" />;
  return <LaptopIcon className="size-4" aria-hidden="true" />;
}

export function KitPage() {
  useDocumentTitle('UI Kit · Dev');
  const { client } = useDashboard();
  const { theme, setTheme } = useTheme();
  const searchStr = useRouterState({ select: (state) => state.location.searchStr });
  const activeTab = parseKitTab(searchStr);
  const storefrontOrigin = env.STOREFRONT_ORIGIN.replace(/\/$/, '');

  const tabs: readonly { readonly id: KitTabKey; readonly label: string }[] = [
    { id: 'base', label: 'Base' },
    { id: 'forms', label: 'Forms' },
    { id: 'patterns', label: 'Patterns' },
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'tokens', label: 'Tokens' },
  ];

  return (
    <div data-kit-marker="__SMARTAPP_DEV_KIT__" className="min-h-dvh bg-background text-foreground">
      <DashboardSwitchGate />
      <PreviewRibbon />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <header className="space-y-4 border-b border-border pb-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Dev &amp; preview only</Badge>
              <a
                href="/kit/routes"
                className="inline-flex min-h-11 items-center text-sm text-primary underline underline-offset-4 sm:min-h-8"
              >
                Route index
              </a>
              <a
                href={`${storefrontOrigin}/kit`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center text-sm text-primary underline underline-offset-4 sm:min-h-8"
              >
                Storefront kit
              </a>
              <Link
                to="/home"
                className="inline-flex min-h-11 items-center text-sm text-primary underline underline-offset-4 sm:min-h-8"
              >
                Dashboard home
              </Link>
            </div>

            <div className="flex items-center gap-1" role="group" aria-label="Theme mode">
              {THEME_MODES.map((mode) => (
                <Button
                  key={mode}
                  size="sm"
                  variant={theme === mode ? 'default' : 'outline'}
                  className="min-h-11 gap-1.5 capitalize sm:min-h-9"
                  onClick={() => setTheme(mode)}
                >
                  <ThemeModeIcon mode={mode} />
                  <span>{mode}</span>
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Smart App PH · UI Kit
            </h1>
            <p className="text-sm text-muted-foreground">
              Kits showing every installed component, dashboard composition, status colour, and
              platform token.
              {client ? ` Scenario: ${client.pack}.` : ''}
            </p>
          </div>

          <nav aria-label="Kit sections" role="tablist" className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <Button
                  key={tab.id}
                  role="tab"
                  aria-selected={isSelected}
                  variant={isSelected ? 'default' : 'outline'}
                  className="min-h-11 px-4 sm:min-h-9"
                  nativeButton={false}
                  render={<a href={`/kit?tab=${tab.id}`} />}
                >
                  {tab.label}
                </Button>
              );
            })}
          </nav>
        </header>

        <Suspense fallback={null}>
          {activeTab === 'base' ? <KitBaseTab /> : null}
          {activeTab === 'forms' ? <KitFormsTab /> : null}
          {activeTab === 'patterns' ? <KitPatternsTab /> : null}
          {activeTab === 'dashboard' ? <KitDashboardTab /> : null}
          {activeTab === 'tokens' ? <KitTokensTab /> : null}
        </Suspense>
      </main>
    </div>
  );
}

export function KitRoutesPage() {
  useDocumentTitle('Route index · Dev');
  const storefrontOrigin = env.STOREFRONT_ORIGIN.replace(/\/$/, '');

  return (
    <div data-kit-marker="__SMARTAPP_DEV_KIT__" className="min-h-dvh bg-background text-foreground">
      <DashboardSwitchGate />
      <PreviewRibbon />
      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
        <header className="space-y-2 border-b border-border pb-4">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline">Dev &amp; preview only</Badge>
            <a
              href="/kit"
              className="inline-flex min-h-11 items-center text-sm text-primary underline underline-offset-4 sm:min-h-8"
            >
              Open UI Kit
            </a>
            <Link
              to="/home"
              className="inline-flex min-h-11 items-center text-sm text-primary underline underline-offset-4 sm:min-h-8"
            >
              Back to /home
            </Link>
          </div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Route index</h1>
          <p className="text-sm text-muted-foreground">
            Every Wave 1 route across dashboard, super admin, and storefront, with its frame and
            target phase.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold">Dashboard &amp; Super admin routes</h2>
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Route</th>
                  <th className="px-4 py-2.5 font-medium">Page</th>
                  <th className="px-4 py-2.5 font-medium">Frame</th>
                  <th className="px-4 py-2.5 font-medium">Phase</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {DASHBOARD_ROUTE_CATALOG.map((entry) => (
                  <tr key={entry.path}>
                    <td className="px-4 py-2.5">
                      <a
                        href={entry.path}
                        className="inline-flex min-h-11 items-center font-mono text-xs text-primary underline underline-offset-4 sm:min-h-8"
                      >
                        {entry.path}
                      </a>
                    </td>
                    <td className="px-4 py-2.5">{entry.label}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant="secondary">{entry.frame}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">Phase {entry.phase}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="font-heading text-lg font-semibold">Storefront routes (by demo slug)</h2>
            <p className="text-xs text-muted-foreground">
              Origin: <code>{storefrontOrigin || '(relative / same-origin)'}</code>
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {DEMO_BRANDS.map((brand) => (
              <div
                key={brand.slug}
                className="space-y-3 rounded-xl border border-border bg-card p-4 text-card-foreground"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-heading text-base font-semibold">{brand.name}</h3>
                  <Badge variant="outline">{brand.slug}</Badge>
                </div>
                <ul className="space-y-1.5 text-xs">
                  {STOREFRONT_ROUTE_TEMPLATES.map((tpl) => {
                    const resolvedPath =
                      tpl.path === '/' || tpl.path === '/kit'
                        ? tpl.path === '/kit'
                          ? `/kit?look=${brand.slug}`
                          : '/'
                        : expandStorefrontPath(tpl.path, brand.slug, brand.unitSlug);
                    const href = `${storefrontOrigin}${resolvedPath}`;
                    return (
                      <li
                        key={`${brand.slug}-${tpl.path}`}
                        className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 py-1.5 last:border-b-0"
                      >
                        <a
                          href={href}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex min-h-11 items-center font-mono text-primary underline underline-offset-4 sm:min-h-8"
                        >
                          {resolvedPath}
                        </a>
                        <span className="text-muted-foreground">
                          {tpl.frame} · Phase {tpl.phase}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
