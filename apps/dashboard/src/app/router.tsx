import { Suspense, lazy } from 'react';
import {
  createRootRoute,
  createRoute,
  createRouter,
  notFound,
  Outlet,
  redirect,
} from '@tanstack/react-router';
import { NotFoundPage } from '@/app/not-found';
import { AdminFrame } from '@/app/shell/AdminFrame';
import { AppFrame } from '@/app/shell/AppFrame';
import { AuthFrame } from '@/app/shell/AuthFrame';
import { FocusFrame } from '@/app/shell/FocusFrame';
import { PlaceholderScreen } from '@/app/shell/PlaceholderScreen';
import { HomePage } from '@/features/home/home-page';
import { SettingsIndexPage } from '@/features/settings/settings-index-page';

const rootRoute = createRootRoute({
  component: Outlet,
  notFoundComponent: NotFoundPage,
});

const rootIndexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/home' });
  },
  component: () => null,
});

// Auth frame routes (/signup, /login)
const authLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'auth-frame',
  component: AuthFrame,
});

const signupRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/signup',
  staticData: { page: { title: 'Apply as an owner' } },
  component: () => (
    <PlaceholderScreen
      title="Apply as an owner"
      phase={4}
      secondaryLink={{ to: '/login', label: 'Already have an account? Sign in' }}
    />
  ),
});

const loginRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/login',
  staticData: { page: { title: 'Sign in' } },
  component: () => (
    <PlaceholderScreen
      title="Sign in"
      phase={4}
      secondaryLink={{ to: '/signup', label: 'Apply as a property owner' }}
    />
  ),
});

// Focus frame routes (/onboarding, /editor)
const focusLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'focus-frame',
  component: FocusFrame,
});

const onboardingRoute = createRoute({
  getParentRoute: () => focusLayoutRoute,
  path: '/onboarding',
  staticData: { page: { title: 'Onboarding checklist' } },
  component: () => (
    <PlaceholderScreen
      title="Onboarding checklist"
      phase={4}
      secondaryLink={{ to: '/home', label: 'Continue to dashboard home' }}
    />
  ),
});

const editorRoute = createRoute({
  getParentRoute: () => focusLayoutRoute,
  path: '/editor',
  staticData: { page: { title: 'Page editor' } },
  component: () => (
    <PlaceholderScreen
      title="Page editor"
      phase={5}
      secondaryLink={{ to: '/home', label: 'Return to dashboard' }}
    />
  ),
});

// App frame routes (/home .. /settings/*)
const appLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'app-frame',
  component: AppFrame,
});

const homeRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/home',
  staticData: { page: { title: 'Home' } },
  component: HomePage,
});

const calendarRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/calendar',
  staticData: { page: { title: 'Calendar' } },
  component: () => <PlaceholderScreen title="Calendar" phase={6} />,
});

const bookingsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/bookings',
  staticData: { page: { title: 'Bookings' } },
  component: () => <PlaceholderScreen title="Bookings" phase={8} />,
});

const paymentsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/payments',
  staticData: { page: { title: 'Payments' } },
  component: () => <PlaceholderScreen title="Payments" phase={7} />,
});

const inboxRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/inbox',
  staticData: { page: { title: 'Inbox' } },
  component: () => <PlaceholderScreen title="Inbox" phase={7} />,
});

const unitsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/units',
  staticData: { page: { title: 'Units' } },
  component: () => <PlaceholderScreen title="Units" phase={4} />,
});

const guestsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/guests',
  staticData: { page: { title: 'Guests' } },
  component: () => <PlaceholderScreen title="Guests" phase={8} />,
});

const settingsIndexRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/settings',
  staticData: { page: { title: 'Settings' } },
  component: SettingsIndexPage,
});

const settingsParent = { to: '/settings', title: 'Settings' } as const;

const settingsPaymentsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/settings/payments',
  staticData: { page: { title: 'Payment accounts', parent: settingsParent } },
  component: () => <PlaceholderScreen title="Payment accounts" phase={4} />,
});

const settingsPoliciesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/settings/policies',
  staticData: { page: { title: 'Policies & rules', parent: settingsParent } },
  component: () => <PlaceholderScreen title="Policies & rules" phase={4} />,
});

const settingsNoticesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/settings/notices',
  staticData: { page: { title: 'Notices & alerts', parent: settingsParent } },
  component: () => <PlaceholderScreen title="Notices & alerts" phase={7} />,
});

const settingsPlanRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/settings/plan',
  staticData: { page: { title: 'Plan & billing', parent: settingsParent } },
  component: () => <PlaceholderScreen title="Plan & billing" phase={9} />,
});

const settingsActivityRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/settings/activity',
  staticData: { page: { title: 'Activity log', parent: settingsParent } },
  component: () => <PlaceholderScreen title="Activity log" phase={8} />,
});

const settingsPropertyRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/settings/property',
  staticData: { page: { title: 'Property details', parent: settingsParent } },
  component: () => <PlaceholderScreen title="Property details" phase={4} />,
});

const settingsHoursRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/settings/hours',
  staticData: { page: { title: 'Reply & viewing hours', parent: settingsParent } },
  component: () => <PlaceholderScreen title="Reply & viewing hours" phase={4} />,
});

const settingsAccountRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/settings/account',
  staticData: { page: { title: 'My account', parent: settingsParent } },
  component: () => <PlaceholderScreen title="My account" phase={4} />,
});

const settingsStorageRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/settings/storage',
  staticData: { page: { title: 'Storage & export', parent: settingsParent } },
  component: () => <PlaceholderScreen title="Storage & export" phase={9} />,
});

// Admin frame routes (/admin/*)
const adminLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'admin-frame',
  component: AdminFrame,
});

const adminParent = { to: '/admin', title: 'Super admin' } as const;

const adminOverviewRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin',
  staticData: { page: { title: 'Overview' } },
  component: () => <PlaceholderScreen title="Super admin overview" phase={9} />,
});

const adminOwnersRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin/owners',
  staticData: { page: { title: 'Owners', parent: adminParent } },
  component: () => <PlaceholderScreen title="Owners" phase={9} />,
});

const adminPlansRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin/plans',
  staticData: { page: { title: 'Plans & payments', parent: adminParent } },
  component: () => <PlaceholderScreen title="Plans & payments" phase={9} />,
});

const adminUsageRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin/usage',
  staticData: { page: { title: 'Usage', parent: adminParent } },
  component: () => <PlaceholderScreen title="Usage metrics" phase={9} />,
});

const adminAuditRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin/audit',
  staticData: { page: { title: 'Audit log', parent: adminParent } },
  component: () => <PlaceholderScreen title="Audit log" phase={9} />,
});

const adminHealthRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin/health',
  staticData: { page: { title: 'Job health', parent: adminParent } },
  component: () => <PlaceholderScreen title="Job health" phase={9} />,
});

const adminFlagsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin/flags',
  staticData: { page: { title: 'Feature flags', parent: adminParent } },
  component: () => <PlaceholderScreen title="Feature flags" phase={9} />,
});

const adminPixelsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin/pixels',
  staticData: { page: { title: 'Tracking pixels', parent: adminParent } },
  component: () => <PlaceholderScreen title="Tracking pixels" phase={9} />,
});

// Dev & preview only routes (/kit, /kit/routes) loaded via dynamic import so production tree-shakes them.
const LazyKitPage =
  import.meta.env.VITE_APP_ENV !== 'production'
    ? lazy(() => import('../features/kit/routes-index').then((mod) => ({ default: mod.KitPage })))
    : null;

const LazyKitRoutesPage =
  import.meta.env.VITE_APP_ENV !== 'production'
    ? lazy(() =>
        import('../features/kit/routes-index').then((mod) => ({ default: mod.KitRoutesPage })),
      )
    : null;

const kitRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/kit',
  beforeLoad: () => {
    if (import.meta.env.VITE_APP_ENV === 'production') {
      throw notFound();
    }
  },
  component: () =>
    LazyKitPage ? (
      <Suspense fallback={null}>
        <LazyKitPage />
      </Suspense>
    ) : null,
});

const kitRoutesIndexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/kit/routes',
  beforeLoad: () => {
    if (import.meta.env.VITE_APP_ENV === 'production') {
      throw notFound();
    }
  },
  component: () =>
    LazyKitRoutesPage ? (
      <Suspense fallback={null}>
        <LazyKitRoutesPage />
      </Suspense>
    ) : null,
});

const routeTree = rootRoute.addChildren([
  rootIndexRoute,
  authLayoutRoute.addChildren([signupRoute, loginRoute]),
  focusLayoutRoute.addChildren([onboardingRoute, editorRoute]),
  appLayoutRoute.addChildren([
    homeRoute,
    calendarRoute,
    bookingsRoute,
    paymentsRoute,
    inboxRoute,
    unitsRoute,
    guestsRoute,
    settingsIndexRoute,
    settingsPaymentsRoute,
    settingsPoliciesRoute,
    settingsNoticesRoute,
    settingsPlanRoute,
    settingsActivityRoute,
    settingsPropertyRoute,
    settingsHoursRoute,
    settingsAccountRoute,
    settingsStorageRoute,
  ]),
  adminLayoutRoute.addChildren([
    adminOverviewRoute,
    adminOwnersRoute,
    adminPlansRoute,
    adminUsageRoute,
    adminAuditRoute,
    adminHealthRoute,
    adminFlagsRoute,
    adminPixelsRoute,
  ]),
  kitRoute,
  kitRoutesIndexRoute,
]);

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
});

declare module '@tanstack/react-router' {
  interface Register {
    readonly router: typeof router;
  }
}
