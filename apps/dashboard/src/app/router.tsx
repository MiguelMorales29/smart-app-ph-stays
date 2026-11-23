import { Suspense, lazy } from 'react';
import {
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
  Outlet,
  redirect,
} from '@tanstack/react-router';
import { NotFoundPage } from '@/app/not-found';
import { AppFrame } from '@/app/shell/AppFrame';
import { PlaceholderScreen } from '@/app/shell/PlaceholderScreen';
import type { UnitEditSearch } from '@/features/units/unit-edit-page';
import type { UnitsSearch } from '@/features/units/units-page';

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
  component: lazyRouteComponent(() => import('@/app/shell/AuthFrame'), 'AuthFrame'),
});

export interface SignupSearch {
  readonly step?: 2 | 3;
}

function parseSignupSearch(search: Record<string, unknown>): SignupSearch {
  const raw = Number(search.step);
  return raw === 2 || raw === 3 ? { step: raw } : {};
}

const signupRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/signup',
  validateSearch: parseSignupSearch,
  staticData: { page: { title: 'Apply as an owner', wide: true } },
  component: lazyRouteComponent(() => import('@/features/auth/signup-page'), 'SignupPage'),
});

const loginRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/login',
  staticData: { page: { title: 'Sign in' } },
  component: lazyRouteComponent(() => import('@/features/auth/login-page'), 'LoginPage'),
});

const forgotPasswordRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/forgot-password',
  staticData: { page: { title: 'Reset your password' } },
  component: lazyRouteComponent(
    () => import('@/features/auth/forgot-password-page'),
    'ForgotPasswordPage',
  ),
});

// Focus frame routes (/onboarding, /editor)
const focusLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'focus-frame',
  component: lazyRouteComponent(() => import('@/app/shell/FocusFrame'), 'FocusFrame'),
});

export interface OnboardingSearch {
  readonly step?: 1 | 2 | 3 | 4 | 5 | 6 | 7;
}

const ONBOARDING_STEPS = [1, 2, 3, 4, 5, 6, 7] as const;

function parseOnboardingSearch(search: Record<string, unknown>): OnboardingSearch {
  const raw = Number(search.step);
  const step = ONBOARDING_STEPS.find((value) => value === raw);
  return step === undefined ? {} : { step };
}

const onboardingRoute = createRoute({
  getParentRoute: () => focusLayoutRoute,
  path: '/onboarding',
  validateSearch: parseOnboardingSearch,
  staticData: { page: { title: 'Set up your place' } },
  component: lazyRouteComponent(
    () => import('@/features/onboarding/onboarding-page'),
    'OnboardingPage',
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
  component: lazyRouteComponent(() => import('@/features/home/home-page'), 'HomePage'),
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

const UNITS_FILTERS = ['listed', 'hidden', 'drafts'] as const;

function parseUnitsSearch(search: Record<string, unknown>): UnitsSearch {
  const filter = UNITS_FILTERS.find((value) => value === search.filter);
  const add = search.add === 'unit' || search.add === 'beds' ? search.add : undefined;
  const room =
    typeof search.room === 'string' && search.room.trim().length > 0
      ? search.room.trim().slice(0, 40)
      : undefined;
  return {
    ...(filter ? { filter } : {}),
    ...(add ? { add } : {}),
    ...(room ? { room } : {}),
  };
}

const unitsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/units',
  validateSearch: parseUnitsSearch,
  staticData: { page: { title: 'Units', wide: true } },
  component: lazyRouteComponent(() => import('@/features/units/units-page'), 'UnitsPage'),
});

const UNIT_SECTIONS = ['basics', 'photos', 'price', 'amenities', 'rules'] as const;

function parseUnitEditSearch(search: Record<string, unknown>): UnitEditSearch {
  const section = UNIT_SECTIONS.find((value) => value === search.section);
  return section ? { section } : {};
}

const unitEditRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/units/$unitId',
  validateSearch: parseUnitEditSearch,
  staticData: { page: { title: 'Edit unit', parent: { to: '/units', title: 'Units' } } },
  component: lazyRouteComponent(() => import('@/features/units/unit-edit-page'), 'UnitEditPage'),
});

const unitEditSectionRoute = createRoute({
  getParentRoute: () => unitEditRoute,
  path: '$section',
  staticData: { page: { title: 'Edit unit', parent: { to: '/units', title: 'Units' } } },
  component: () => null,
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
  component: lazyRouteComponent(
    () => import('@/features/settings/settings-index-page'),
    'SettingsIndexPage',
  ),
});

const settingsParent = { to: '/settings', title: 'Settings' } as const;

const settingsPaymentsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/settings/payments',
  staticData: { page: { title: 'Payments', parent: settingsParent } },
  component: lazyRouteComponent(
    () => import('@/features/settings/payments-settings-page'),
    'PaymentsSettingsPage',
  ),
});

const settingsPoliciesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/settings/policies',
  staticData: { page: { title: 'Policies', parent: settingsParent } },
  component: lazyRouteComponent(
    () => import('@/features/settings/policies-settings-page'),
    'PoliciesSettingsPage',
  ),
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
  component: lazyRouteComponent(
    () => import('@/features/settings/property-settings-page'),
    'PropertySettingsPage',
  ),
});

const settingsHoursRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/settings/hours',
  staticData: { page: { title: 'Hours', parent: settingsParent } },
  component: lazyRouteComponent(
    () => import('@/features/settings/hours-settings-page'),
    'HoursSettingsPage',
  ),
});

const settingsAccountRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/settings/account',
  staticData: { page: { title: 'Account', parent: settingsParent } },
  component: lazyRouteComponent(
    () => import('@/features/settings/account-settings-page'),
    'AccountSettingsPage',
  ),
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
  component: lazyRouteComponent(() => import('@/app/shell/AdminFrame'), 'AdminFrame'),
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

// Dev & preview only routes (/kit, /kit/routes): omitted from routeTree in production so Vite
// tree-shakes every kit module and direct hits resolve to NotFoundPage.
const devOnlyKitRoutes =
  import.meta.env.VITE_APP_ENV !== 'production'
    ? (() => {
        const LazyKitPage = lazy(() =>
          import('../features/kit/routes-index').then((mod) => ({ default: mod.KitPage })),
        );
        const LazyKitRoutesPage = lazy(() =>
          import('../features/kit/routes-index').then((mod) => ({ default: mod.KitRoutesPage })),
        );
        const kitRoute = createRoute({
          getParentRoute: () => rootRoute,
          path: '/kit',
          component: () => (
            <Suspense fallback={null}>
              <LazyKitPage />
            </Suspense>
          ),
        });
        const kitRoutesIndexRoute = createRoute({
          getParentRoute: () => rootRoute,
          path: '/kit/routes',
          component: () => (
            <Suspense fallback={null}>
              <LazyKitRoutesPage />
            </Suspense>
          ),
        });
        return [kitRoute, kitRoutesIndexRoute];
      })()
    : [];

const routeTree = rootRoute.addChildren([
  rootIndexRoute,
  authLayoutRoute.addChildren([signupRoute, loginRoute, forgotPasswordRoute]),
  focusLayoutRoute.addChildren([onboardingRoute, editorRoute]),
  appLayoutRoute.addChildren([
    homeRoute,
    calendarRoute,
    bookingsRoute,
    paymentsRoute,
    inboxRoute,
    unitsRoute,
    unitEditRoute.addChildren([unitEditSectionRoute]),
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
  ...devOnlyKitRoutes,
]);

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  scrollRestoration: true,
});

declare module '@tanstack/react-router' {
  interface Register {
    readonly router: typeof router;
  }
}
