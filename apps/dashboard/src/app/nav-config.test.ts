import { describe, expect, it } from 'vitest';
import {
  ACTIVE_WAVE,
  ADMIN_NAV_ITEMS,
  DASHBOARD_NAV_ITEMS,
  DASHBOARD_ROUTE_CATALOG,
  SETTINGS_NAV_ITEMS,
  resolveNavCount,
} from './nav-config';

describe('dashboard navigation & route catalog', () => {
  it('keeps the Feature blueprint §6 menu order and hides Wave 2-3 items', () => {
    const visible = DASHBOARD_NAV_ITEMS.filter((item) => item.wave <= ACTIVE_WAVE);
    expect(visible.map((item) => item.id)).toEqual([
      'home',
      'calendar',
      'bookings',
      'inbox',
      'payments',
      'units',
      'guests',
      'editor',
      'settings',
    ]);

    const hidden = DASHBOARD_NAV_ITEMS.filter((item) => item.wave > ACTIVE_WAVE);
    expect(hidden.map((item) => item.id)).toEqual(['tenants', 'reports', 'rewards']);
    expect(SETTINGS_NAV_ITEMS.find((item) => item.id === 'team')?.wave).toBe(2);
  });

  it('places Home, Calendar, Bookings, and Inbox on the phone dock and the rest in More', () => {
    const visible = DASHBOARD_NAV_ITEMS.filter((item) => item.wave <= ACTIVE_WAVE);
    expect(visible.filter((i) => i.mobileSlot === 'dock').map((i) => i.id)).toEqual([
      'home',
      'calendar',
      'bookings',
      'inbox',
    ]);
    expect(visible.filter((i) => i.mobileSlot === 'more').map((i) => i.id)).toEqual([
      'payments',
      'units',
      'guests',
      'editor',
      'settings',
    ]);
  });

  it('derives menu count badges strictly from ownerHome counts', () => {
    const counts = {
      arrivals_today: 2,
      departures_today: 1,
      proofs_to_check: 3,
      holds_expiring_soon: 4,
      unread_threads: 5,
    };

    expect(resolveNavCount('home_total', counts)).toBe(15);
    expect(resolveNavCount('holds', counts)).toBe(4);
    expect(resolveNavCount('unread', counts)).toBe(5);
    expect(resolveNavCount('proofs', counts)).toBe(3);
    expect(resolveNavCount('home_total', null)).toBeUndefined();
  });

  it('includes all Wave 1 dashboard, admin, and kit routes with expected frames and phases', () => {
    const byPath = new Map(DASHBOARD_ROUTE_CATALOG.map((entry) => [entry.path, entry]));

    expect(byPath.get('/signup')).toMatchObject({ frame: 'AuthFrame', phase: 4 });
    expect(byPath.get('/login')).toMatchObject({ frame: 'AuthFrame', phase: 4 });
    expect(byPath.get('/onboarding')).toMatchObject({ frame: 'FocusFrame', phase: 4 });
    expect(byPath.get('/editor')).toMatchObject({ frame: 'FocusFrame', phase: 5 });
    expect(byPath.get('/calendar')).toMatchObject({ frame: 'AppFrame', phase: 6 });
    expect(byPath.get('/settings/payments')).toMatchObject({ frame: 'AppFrame', phase: 4 });
    expect(byPath.get('/settings/activity')).toMatchObject({ frame: 'AppFrame', phase: 8 });
    expect(byPath.get('/admin')).toMatchObject({ frame: 'AdminFrame', phase: 9 });
    expect(ADMIN_NAV_ITEMS).toHaveLength(8);
  });
});
