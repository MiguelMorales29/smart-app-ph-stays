import type { RouteFrameKind } from '@/app/nav-config';

export interface RouteCatalogEntry {
  readonly app: 'dashboard' | 'storefront';
  readonly path: string;
  readonly label: string;
  readonly frame: RouteFrameKind;
  readonly phase: number;
}

export const DASHBOARD_ROUTE_CATALOG: readonly RouteCatalogEntry[] = [
  { app: 'dashboard', path: '/signup', label: 'Owner sign-up', frame: 'AuthFrame', phase: 4 },
  { app: 'dashboard', path: '/login', label: 'Owner sign-in', frame: 'AuthFrame', phase: 4 },
  {
    app: 'dashboard',
    path: '/onboarding',
    label: 'Onboarding checklist',
    frame: 'FocusFrame',
    phase: 4,
  },
  { app: 'dashboard', path: '/editor', label: 'Page editor', frame: 'FocusFrame', phase: 5 },
  { app: 'dashboard', path: '/home', label: 'Dashboard home', frame: 'AppFrame', phase: 8 },
  { app: 'dashboard', path: '/calendar', label: 'Calendar', frame: 'AppFrame', phase: 6 },
  { app: 'dashboard', path: '/bookings', label: 'Bookings', frame: 'AppFrame', phase: 8 },
  { app: 'dashboard', path: '/payments', label: 'Payments', frame: 'AppFrame', phase: 7 },
  { app: 'dashboard', path: '/inbox', label: 'Inbox', frame: 'AppFrame', phase: 7 },
  { app: 'dashboard', path: '/units', label: 'Units', frame: 'AppFrame', phase: 4 },
  { app: 'dashboard', path: '/guests', label: 'Guests', frame: 'AppFrame', phase: 8 },
  { app: 'dashboard', path: '/settings', label: 'Settings', frame: 'AppFrame', phase: 4 },
  {
    app: 'dashboard',
    path: '/settings/payments',
    label: 'Payment accounts',
    frame: 'AppFrame',
    phase: 4,
  },
  {
    app: 'dashboard',
    path: '/settings/policies',
    label: 'Policies & rules',
    frame: 'AppFrame',
    phase: 4,
  },
  {
    app: 'dashboard',
    path: '/settings/notices',
    label: 'Notices & alerts',
    frame: 'AppFrame',
    phase: 7,
  },
  {
    app: 'dashboard',
    path: '/settings/plan',
    label: 'Plan & billing',
    frame: 'AppFrame',
    phase: 9,
  },
  {
    app: 'dashboard',
    path: '/settings/activity',
    label: 'Activity log',
    frame: 'AppFrame',
    phase: 8,
  },
  {
    app: 'dashboard',
    path: '/settings/property',
    label: 'Property details',
    frame: 'AppFrame',
    phase: 4,
  },
  {
    app: 'dashboard',
    path: '/settings/hours',
    label: 'Reply & viewing hours',
    frame: 'AppFrame',
    phase: 4,
  },
  {
    app: 'dashboard',
    path: '/settings/account',
    label: 'My account',
    frame: 'AppFrame',
    phase: 4,
  },
  {
    app: 'dashboard',
    path: '/settings/storage',
    label: 'Storage & export',
    frame: 'AppFrame',
    phase: 9,
  },
  {
    app: 'dashboard',
    path: '/admin',
    label: 'Super admin overview',
    frame: 'AdminFrame',
    phase: 9,
  },
  { app: 'dashboard', path: '/admin/owners', label: 'Owners', frame: 'AdminFrame', phase: 9 },
  {
    app: 'dashboard',
    path: '/admin/plans',
    label: 'Plans & payments',
    frame: 'AdminFrame',
    phase: 9,
  },
  { app: 'dashboard', path: '/admin/usage', label: 'Usage metrics', frame: 'AdminFrame', phase: 9 },
  { app: 'dashboard', path: '/admin/audit', label: 'Audit log', frame: 'AdminFrame', phase: 9 },
  { app: 'dashboard', path: '/admin/health', label: 'Job health', frame: 'AdminFrame', phase: 9 },
  { app: 'dashboard', path: '/admin/flags', label: 'Feature flags', frame: 'AdminFrame', phase: 9 },
  {
    app: 'dashboard',
    path: '/admin/pixels',
    label: 'Tracking pixels',
    frame: 'AdminFrame',
    phase: 9,
  },
  {
    app: 'dashboard',
    path: '/kit',
    label: 'UI Kit (Base, Dashboard, Tokens)',
    frame: 'DevKit',
    phase: 3,
  },
  { app: 'dashboard', path: '/kit/routes', label: 'Route index', frame: 'DevKit', phase: 3 },
];
