import { Link } from '@tanstack/react-router';
import { Badge } from '@smartapp/ui/components/badge';
import { DASHBOARD_ROUTE_CATALOG, type RouteFrameKind } from '@/app/nav-config';
import { useDashboard } from '@/app/dashboard-context';
import { useDocumentTitle } from '@/app/page-meta';
import { DashboardSwitchGate } from '@/components/DashboardSwitchGate';
import { PreviewRibbon } from '@/components/PreviewRibbon';
import { env } from '@/env';

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

export function KitPage() {
  useDocumentTitle('UI Kit · Dev');
  const { client } = useDashboard();
  void client;

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <DashboardSwitchGate />
      <PreviewRibbon />
      <main className="mx-auto max-w-5xl space-y-4 px-4 py-8 sm:px-6">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">UI Kit</h1>
        <p className="text-sm text-muted-foreground">Coming in P3-E.</p>
        <p>
          <Link to="/kit/routes" className="text-sm text-primary underline underline-offset-4">
            Open route index
          </Link>
        </p>
      </main>
    </div>
  );
}

export function KitRoutesPage() {
  useDocumentTitle('Route index · Dev');
  const storefrontOrigin = env.STOREFRONT_ORIGIN.replace(/\/$/, '');

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <DashboardSwitchGate />
      <PreviewRibbon />
      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
        <header className="space-y-2 border-b border-border pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">Dev & preview only</Badge>
            <Link to="/home" className="text-sm text-primary underline underline-offset-4">
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
          <h2 className="font-heading text-lg font-semibold">Dashboard & Super admin routes</h2>
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
                      <Link
                        to={entry.path}
                        className="inline-flex min-h-11 items-center font-mono text-xs text-primary underline underline-offset-4 sm:min-h-8"
                      >
                        {entry.path}
                      </Link>
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
                      tpl.path === '/'
                        ? '/'
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
