import type { OwnerHomeCountsView } from '@smartapp/core';
import {
  ActivityIcon,
  AwardIcon,
  BarChart3Icon,
  BedDoubleIcon,
  BellIcon,
  Building2Icon,
  CalendarDaysIcon,
  CalendarOffIcon,
  CalendarPlusIcon,
  ClipboardCheckIcon,
  ClockIcon,
  CreditCardIcon,
  FlagIcon,
  FileTextIcon,
  HardDriveIcon,
  HomeIcon,
  KeyRoundIcon,
  LayoutDashboardIcon,
  MessageSquareIcon,
  PaletteIcon,
  ReceiptTextIcon,
  ScrollTextIcon,
  SettingsIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserCheckIcon,
  UserIcon,
  UsersIcon,
  WalletIcon,
  type LucideIcon,
} from 'lucide-react';

/**
 * Current released wave for navigation visibility.
 * Wave 2 (Tenants, Reports, Settings > Team) and Wave 3 (Rewards) keep their
 * fixed menu positions in `DASHBOARD_NAV_ITEMS` and stay hidden until enabled.
 */
export const ACTIVE_WAVE = 1 as const;

export type DashboardMenuPlacement = 'dock' | 'more' | 'hidden';
export type RouteFrameKind =
  | 'AuthFrame'
  | 'FocusFrame'
  | 'AppFrame'
  | 'AdminFrame'
  | 'DevKit'
  | 'LandingFrame'
  | 'PropertyFrame'
  | 'ConversationFrame';

export interface DashboardNavDef {
  readonly id: string;
  readonly label: string;
  readonly path: string;
  readonly icon: LucideIcon;
  readonly wave: 1 | 2 | 3;
  readonly mobileSlot: DashboardMenuPlacement;
  readonly countKey?: 'home_total' | 'holds' | 'unread' | 'proofs' | undefined;
  readonly dotKey?: 'editor_draft' | 'setup_incomplete' | undefined;
}

/** Fixed menu order from Feature blueprint §6 (items 1–12). */
export const DASHBOARD_NAV_ITEMS: readonly DashboardNavDef[] = [
  {
    id: 'home',
    label: 'Home',
    path: '/home',
    icon: HomeIcon,
    wave: 1,
    mobileSlot: 'dock',
    countKey: 'home_total',
  },
  {
    id: 'calendar',
    label: 'Calendar',
    path: '/calendar',
    icon: CalendarDaysIcon,
    wave: 1,
    mobileSlot: 'dock',
  },
  {
    id: 'bookings',
    label: 'Bookings',
    path: '/bookings',
    icon: ClipboardCheckIcon,
    wave: 1,
    mobileSlot: 'more',
    countKey: 'holds',
  },
  {
    id: 'inbox',
    label: 'Inbox',
    path: '/inbox',
    icon: MessageSquareIcon,
    wave: 1,
    mobileSlot: 'dock',
    countKey: 'unread',
  },
  {
    id: 'payments',
    label: 'Payments',
    path: '/payments',
    icon: CreditCardIcon,
    wave: 1,
    mobileSlot: 'more',
    countKey: 'proofs',
  },
  {
    id: 'units',
    label: 'Units',
    path: '/units',
    icon: BedDoubleIcon,
    wave: 1,
    mobileSlot: 'more',
  },
  {
    id: 'guests',
    label: 'Guests',
    path: '/guests',
    icon: UsersIcon,
    wave: 1,
    mobileSlot: 'more',
  },
  {
    id: 'tenants',
    label: 'Tenants',
    path: '/tenants',
    icon: KeyRoundIcon,
    wave: 2,
    mobileSlot: 'hidden',
  },
  {
    id: 'reports',
    label: 'Reports',
    path: '/reports',
    icon: BarChart3Icon,
    wave: 2,
    mobileSlot: 'hidden',
  },
  {
    id: 'rewards',
    label: 'Rewards',
    path: '/rewards',
    icon: AwardIcon,
    wave: 3,
    mobileSlot: 'hidden',
  },
  {
    id: 'editor',
    label: 'Editor',
    path: '/editor',
    icon: PaletteIcon,
    wave: 1,
    mobileSlot: 'more',
    dotKey: 'editor_draft',
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/settings',
    icon: SettingsIcon,
    wave: 1,
    mobileSlot: 'more',
    dotKey: 'setup_incomplete',
  },
];

export interface QuickAddItem {
  readonly id: 'manual_booking' | 'block_dates' | 'add_unit' | 'record_cash';
  readonly label: string;
  readonly hint: string;
  readonly to: '/calendar' | '/units' | '/payments';
  readonly search: { readonly add: 'booking' | 'block' | 'unit' | 'cash' };
  readonly icon: LucideIcon;
  readonly wave: 1 | 2 | 3;
}

/**
 * Quick-add actions opened by the phone dock + button and the desktop sidebar "+ New" button (D65).
 * Kept in one place so Phase 7 (Send notice) and Phase 15 (Add tenant) add rows here without
 * touching the dock.
 */
export const QUICK_ADD_ITEMS: readonly QuickAddItem[] = [
  {
    id: 'manual_booking',
    label: 'Manual booking',
    hint: 'Walk-in, phone or Messenger guest',
    to: '/calendar',
    search: { add: 'booking' },
    icon: CalendarPlusIcon,
    wave: 1,
  },
  {
    id: 'block_dates',
    label: 'Block dates',
    hint: 'Close nights for family or repairs',
    to: '/calendar',
    search: { add: 'block' },
    icon: CalendarOffIcon,
    wave: 1,
  },
  {
    id: 'add_unit',
    label: 'Add unit',
    hint: 'Room, suite, apartment or bed spaces',
    to: '/units',
    search: { add: 'unit' },
    icon: BedDoubleIcon,
    wave: 1,
  },
  {
    id: 'record_cash',
    label: 'Record cash payment',
    hint: 'Mark cash received for a booking',
    to: '/payments',
    search: { add: 'cash' },
    icon: WalletIcon,
    wave: 1,
  },
];

export interface SettingsNavDef {
  readonly id: string;
  readonly label: string;
  readonly path: string;
  readonly icon: LucideIcon;
  readonly phase: number;
  readonly wave: 1 | 2;
}

export const SETTINGS_NAV_ITEMS: readonly SettingsNavDef[] = [
  {
    id: 'payments',
    label: 'Payment accounts',
    path: '/settings/payments',
    icon: CreditCardIcon,
    phase: 4,
    wave: 1,
  },
  {
    id: 'policies',
    label: 'Policies & rules',
    path: '/settings/policies',
    icon: FileTextIcon,
    phase: 4,
    wave: 1,
  },
  {
    id: 'notices',
    label: 'Notices & alerts',
    path: '/settings/notices',
    icon: BellIcon,
    phase: 7,
    wave: 1,
  },
  {
    id: 'plan',
    label: 'Plan & billing',
    path: '/settings/plan',
    icon: ReceiptTextIcon,
    phase: 9,
    wave: 1,
  },
  {
    id: 'activity',
    label: 'Activity log',
    path: '/settings/activity',
    icon: ActivityIcon,
    phase: 8,
    wave: 1,
  },
  {
    id: 'property',
    label: 'Property details',
    path: '/settings/property',
    icon: Building2Icon,
    phase: 4,
    wave: 1,
  },
  {
    id: 'hours',
    label: 'Reply & viewing hours',
    path: '/settings/hours',
    icon: ClockIcon,
    phase: 4,
    wave: 1,
  },
  {
    id: 'account',
    label: 'My account',
    path: '/settings/account',
    icon: UserIcon,
    phase: 4,
    wave: 1,
  },
  {
    id: 'storage',
    label: 'Storage & export',
    path: '/settings/storage',
    icon: HardDriveIcon,
    phase: 9,
    wave: 1,
  },
  {
    id: 'team',
    label: 'Team members',
    path: '/settings/team',
    icon: UsersIcon,
    phase: 15,
    wave: 2,
  },
];

export interface AdminNavDef {
  readonly id: string;
  readonly label: string;
  readonly path: string;
  readonly icon: LucideIcon;
  readonly mobileSlot: 'dock' | 'more';
}

export const ADMIN_NAV_ITEMS: readonly AdminNavDef[] = [
  {
    id: 'overview',
    label: 'Overview',
    path: '/admin',
    icon: LayoutDashboardIcon,
    mobileSlot: 'dock',
  },
  { id: 'owners', label: 'Owners', path: '/admin/owners', icon: UserCheckIcon, mobileSlot: 'dock' },
  { id: 'plans', label: 'Plans', path: '/admin/plans', icon: CreditCardIcon, mobileSlot: 'dock' },
  { id: 'usage', label: 'Usage', path: '/admin/usage', icon: BarChart3Icon, mobileSlot: 'more' },
  {
    id: 'audit',
    label: 'Audit log',
    path: '/admin/audit',
    icon: ScrollTextIcon,
    mobileSlot: 'dock',
  },
  {
    id: 'health',
    label: 'Job health',
    path: '/admin/health',
    icon: ShieldCheckIcon,
    mobileSlot: 'more',
  },
  { id: 'flags', label: 'Feature flags', path: '/admin/flags', icon: FlagIcon, mobileSlot: 'more' },
  {
    id: 'pixels',
    label: 'Tracking pixels',
    path: '/admin/pixels',
    icon: SparklesIcon,
    mobileSlot: 'more',
  },
];

export interface HomeNeedsYouItem {
  readonly id:
    | 'arrivals_today'
    | 'departures_today'
    | 'proofs_to_check'
    | 'holds_expiring_soon'
    | 'unread_threads';
  readonly label: string;
  readonly count: number;
  readonly to: '/calendar' | '/payments' | '/bookings' | '/inbox';
  readonly icon: LucideIcon;
}

/**
 * Shared by the Home nav badge (`resolveNavCount('home_total', counts)`) and the Home "Needs you"
 * list (D67, D73) so the badge number always equals the sum of rows shown on Home.
 */
export function buildHomeNeedsYouItems(
  counts: OwnerHomeCountsView | null,
): readonly HomeNeedsYouItem[] {
  if (!counts) return [];
  const all: readonly HomeNeedsYouItem[] = [
    {
      id: 'arrivals_today',
      label: 'Arrivals today',
      count: counts.arrivals_today,
      to: '/calendar',
      icon: CalendarDaysIcon,
    },
    {
      id: 'departures_today',
      label: 'Departures today',
      count: counts.departures_today,
      to: '/calendar',
      icon: KeyRoundIcon,
    },
    {
      id: 'proofs_to_check',
      label: 'Payment proofs to check',
      count: counts.proofs_to_check,
      to: '/payments',
      icon: CreditCardIcon,
    },
    {
      id: 'holds_expiring_soon',
      label: 'Holds ending soon',
      count: counts.holds_expiring_soon,
      to: '/bookings',
      icon: ClipboardCheckIcon,
    },
    {
      id: 'unread_threads',
      label: 'Unread messages',
      count: counts.unread_threads,
      to: '/inbox',
      icon: MessageSquareIcon,
    },
  ];
  return all.filter((item) => item.count > 0);
}

export function resolveNavCount(
  countKey: DashboardNavDef['countKey'],
  counts: OwnerHomeCountsView | null,
): number | undefined {
  if (!countKey || !counts) return undefined;
  switch (countKey) {
    case 'home_total': {
      const total = buildHomeNeedsYouItems(counts).reduce((sum, item) => sum + item.count, 0);
      return total > 0 ? total : undefined;
    }
    case 'holds':
      return counts.holds_expiring_soon > 0 ? counts.holds_expiring_soon : undefined;
    case 'unread':
      return counts.unread_threads > 0 ? counts.unread_threads : undefined;
    case 'proofs':
      return counts.proofs_to_check > 0 ? counts.proofs_to_check : undefined;
  }
}

export function isActiveRoutePath(pathname: string, targetPath: string): boolean {
  if (targetPath === '/home') return pathname === '/home' || pathname === '/';
  if (targetPath === '/admin') return pathname === '/admin' || pathname === '/admin/';
  return pathname === targetPath || pathname.startsWith(`${targetPath}/`);
}
