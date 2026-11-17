import { BOOKING_STATUSES, PAYMENT_STATUSES } from '@smartapp/core';
import { Link } from '@tanstack/react-router';
import { createElement, type ReactNode } from 'react';
import { InboxIcon, WifiOffIcon } from 'lucide-react';
import { Badge } from '@smartapp/ui/components/badge';
import { Button } from '@smartapp/ui/components/button';
import { Separator } from '@smartapp/ui/components/separator';
import { EmptyState } from '@smartapp/ui/compositions/empty-state';
import { ErrorState } from '@smartapp/ui/compositions/error-state';
import { LoadingState } from '@smartapp/ui/compositions/loading-state';
import { NotAllowedState } from '@smartapp/ui/compositions/not-allowed-state';
import { PausedAccountBanner } from '@smartapp/ui/compositions/paused-account-banner';
import { BookingStatusBadge, PaymentStatusBadge } from '@smartapp/ui/compositions/status-badge';
import { Banner, BannerIcon, BannerTitle } from '@smartapp/ui/components/banner';
import { ACTIVE_WAVE, ADMIN_NAV_ITEMS, DASHBOARD_NAV_ITEMS } from '@/app/nav-config';

function DashboardKitSection({
  title,
  useFor,
  dont,
  children,
}: {
  readonly title: string;
  readonly useFor: string;
  readonly dont: string;
  readonly children: ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm">
      <div className="space-y-1">
        <h2 className="font-heading text-lg font-semibold">{title}</h2>
        <div className="space-y-0.5 text-xs text-muted-foreground">
          <p>
            <strong className="font-medium text-foreground">Use for:</strong> {useFor}
          </p>
          <p>
            <strong className="font-medium text-foreground">Don&apos;t:</strong> {dont}
          </p>
        </div>
      </div>
      <Separator />
      {children}
    </section>
  );
}

const FRAME_EXAMPLES = [
  {
    name: 'AuthFrame',
    routes: '/login, /signup',
    sample: '/login',
    notes: 'Centered card + theme toggle',
  },
  {
    name: 'FocusFrame',
    routes: '/onboarding, /editor',
    sample: '/editor',
    notes: 'Minimal bar, no menu/dock',
  },
  {
    name: 'AppFrame',
    routes: '/home .. /settings/*',
    sample: '/home',
    notes: 'Sidebar + rail + phone dock',
  },
  {
    name: 'AdminFrame',
    routes: '/admin/*',
    sample: '/admin',
    notes: 'Super admin label + admin nav',
  },
] as const;

export function KitDashboardTab() {
  const wave1Items = DASHBOARD_NAV_ITEMS.filter((i) => i.wave <= ACTIVE_WAVE);

  return (
    <div className="space-y-6">
      <DashboardKitSection
        title="Booking & Payment Status Badges (D35)"
        useFor="Every booking card, table row, payment proof review, and conversation header."
        dont="Use colour without both an icon and a plain-word label, or use Growth Mint for status."
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Booking statuses</p>
            <div className="flex flex-wrap gap-2">
              {BOOKING_STATUSES.map((status) => (
                <BookingStatusBadge key={status} status={status} />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Payment statuses</p>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_STATUSES.map((status) => (
                <PaymentStatusBadge key={status} status={status} />
              ))}
            </div>
          </div>
        </div>
      </DashboardKitSection>

      <DashboardKitSection
        title="App Frames (4 shells)"
        useFor="Wrap every route in its assigned frame so top bar, dock, and banners behave consistently."
        dont="Build ad-hoc page chrome inside feature screens."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FRAME_EXAMPLES.map((frame) => (
            <div
              key={frame.name}
              className="space-y-2 rounded-lg border border-border bg-background p-3"
            >
              <p className="font-heading text-sm font-semibold">{frame.name}</p>
              <p className="text-xs text-muted-foreground">{frame.routes}</p>
              <p className="text-xs text-muted-foreground">{frame.notes}</p>
              <Button
                size="sm"
                variant="outline"
                className="min-h-11 w-full sm:min-h-9"
                nativeButton={false}
                render={<Link to={frame.sample} />}
              >
                Open sample
              </Button>
            </div>
          ))}
        </div>
      </DashboardKitSection>

      <DashboardKitSection
        title="Navigation Order & Responsive Tiers"
        useFor="Owner dashboard (< 768 px BottomDock + NavDrawer; 768–1279 px collapsible rail; >= 1280 px Sidebar) and Super Admin."
        dont="Reorder Wave 1 menu slots or unhide Wave 2–3 items (Tenants, Reports, Rewards, Team) prematurely."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Owner menu order (Blueprint §6)
            </p>
            <div className="flex flex-wrap gap-2">
              {wave1Items.map((item) => (
                <Badge key={item.id} variant="secondary" className="gap-1.5 py-1">
                  {createElement(item.icon, { className: 'size-3.5', 'aria-hidden': true })}
                  <span>{item.label}</span>
                  <span className="text-[10px] opacity-70">({item.mobileSlot})</span>
                </Badge>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Super admin menu</p>
            <div className="flex flex-wrap gap-2">
              {ADMIN_NAV_ITEMS.map((item) => (
                <Badge key={item.id} variant="outline" className="gap-1.5 py-1">
                  {createElement(item.icon, { className: 'size-3.5', 'aria-hidden': true })}
                  <span>{item.label}</span>
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </DashboardKitSection>

      <DashboardKitSection
        title="Shared States (LoadingState, EmptyState, ErrorState, OfflineBanner, PausedAccountBanner, NotAllowedState)"
        useFor="Every dashboard screen to handle slow loads, empty lists, errors with Try again, offline state, paused accounts, and role guards."
        dont="Write custom error boxes or omit the Try again recovery action."
      >
        <div className="space-y-4">
          <div className="overflow-hidden rounded-lg border border-border">
            <Banner
              variant="warning"
              dismissible={false}
              className="rounded-none border-x-0 border-t-0"
            >
              <BannerIcon>
                <WifiOffIcon className="size-4" />
              </BannerIcon>
              <BannerTitle>You appear to be offline. Some details may be out of date.</BannerTitle>
            </Banner>
            <PausedAccountBanner propertyName="Ulap Suites" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="mb-2 text-xs font-medium text-muted-foreground">LoadingState</p>
              <LoadingState layout="list" label="Loading sample rows" />
            </div>
            <EmptyState
              icon={<InboxIcon />}
              title="EmptyState"
              description="No bookings match this filter yet."
              action={<Button size="sm">Clear filters</Button>}
            />
            <ErrorState
              title="ErrorState"
              message="Could not reach the server (unavailable)."
              onRetry={() => undefined}
            />
            <NotAllowedState
              title="NotAllowedState"
              message="Super admin access is required for this workspace."
              action={
                <Button size="sm" variant="outline">
                  Back to home
                </Button>
              }
            />
          </div>
        </div>
      </DashboardKitSection>
    </div>
  );
}
