import { Suspense, lazy } from 'react';
import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from '@tanstack/react-router';
import { NotFoundPage } from '@/app/not-found';
import { AdminFrame } from '@/app/shell/AdminFrame';
import { AppFrame } from '@/app/shell/AppFrame';
import { AuthFrame } from '@/app/shell/AuthFrame';
import { FocusFrame } from '@/app/shell/FocusFrame';
import { PlaceholderScreen } from '@/app/shell/PlaceholderScreen';
import { ForgotPasswordPage } from '@/features/auth/forgot-password-page';
import { LoginPage } from '@/features/auth/login-page';
import { SignupPage } from '@/features/auth/signup-page';
import { HomePage } from '@/features/home/home-page';
import { OnboardingPage } from '@/features/onboarding/onboarding-page';
import { UnitEditPage, type UnitEditSearch } from '@/features/units/unit-edit-page';
import { UnitsPage, type UnitsSearch } from '@/features/units/units-page';
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
  component: SignupPage,
});

const loginRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/login',
  staticData: { page: { title: 'Sign in' } },
  component: LoginPage,
});

const forgotPasswordRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/forgot-password',
  staticData: { page: { title: 'Reset your password' } },
  component: ForgotPasswordPage,
});

// Focus frame routes (/onboarding, /editor)
const focusLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'focus-frame',
  component: FocusFrame,
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
  component: OnboardingPage,
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

const UNITS_FILTERS = ['listed', 'hidden', 'drafts'] as const;

function parseUnitsSearch(search: Record<string, unknown>): UnitsSearch {
  const filter = UNITS_FILTERS.find((value) => value === search.filter);
  const add = search.add === 'unit' || search.add === 'beds' ? search.add : undefined;
  return {
    ...(filter ? { filter } : {}),
    ...(add ? { add } : {}),
  };
}

const unitsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/units',
  validateSearch: parseUnitsSearch,
  staticData: { page: { title: 'Units' } },
  component: UnitsPage,
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
  staticData: { page: { title: 'Edit unit' } },
  component: UnitEditPage,
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
    unitEditRoute,
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
