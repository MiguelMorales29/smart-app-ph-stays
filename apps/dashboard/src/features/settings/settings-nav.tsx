import { useEffect, useState, type ReactNode } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import {
  BellIcon,
  Building2Icon,
  ClockIcon,
  CreditCardIcon,
  HardDriveIcon,
  ListChecksIcon,
  ReceiptIcon,
  ScrollTextIcon,
  UserIcon,
} from 'lucide-react';
import { CANCELLATION_PRESET_COPY, type WeeklyHours } from '@smartapp/core';
import { SettingsList, type SettingsListGroup } from '@smartapp/ui/compositions/settings-list';
import { useMyAccountQuery } from '@/data/auth/reads';
import { usePaymentAccountsQuery } from '@/data/payments/reads';
import { useOwnerPropertyQuery } from '@/data/property/reads';

const WIDE_QUERY = '(min-width: 1024px)';

/** True from 1,024 px, where Settings shows the list and the page side by side. */
export function useWideSettings(): boolean {
  const [wide, setWide] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(WIDE_QUERY).matches,
  );
  useEffect(() => {
    const query = window.matchMedia(WIDE_QUERY);
    const onChange = () => setWide(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);
  return wide;
}

function hoursSummary(hours: WeeklyHours | null): string {
  if (!hours) return 'Any time';
  const days = (['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const).filter(
    (day) => hours[day].length > 0,
  ).length;
  if (days === 0) return 'Any time';
  return days === 7 ? 'Every day' : `${days} ${days === 1 ? 'day' : 'days'} a week`;
}

/** The settings groups with each row's current value (Pattern Guide §3.2). */
function useSettingsGroups(): SettingsListGroup[] {
  const property = useOwnerPropertyQuery();
  const payments = usePaymentAccountsQuery();
  const account = useMyAccountQuery();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const prop = property.data?.property ?? null;
  const active = (payments.data ?? []).filter((item) => item.is_active).length;

  const row = (
    id: string,
    label: string,
    to: string,
    icon: ReactNode,
    value: string | undefined,
    unfinished = false,
  ) => ({
    id,
    label,
    icon,
    value,
    unfinished,
    active: pathname === to,
    render: ({ className, children }: { className: string; children: ReactNode }) => (
      <Link to={to} className={className} aria-current={pathname === to ? 'page' : undefined}>
        {children}
      </Link>
    ),
  });

  return [
    {
      id: 'property',
      title: 'Property',
      rows: [
        row(
          'details',
          'Details',
          '/settings/property',
          <Building2Icon />,
          prop?.name ?? 'Not set up yet',
          prop === null,
        ),
        row(
          'policies',
          'Policies',
          '/settings/policies',
          <ScrollTextIcon />,
          prop ? CANCELLATION_PRESET_COPY[prop.cancellation_preset].label : undefined,
        ),
        row(
          'hours',
          'Hours',
          '/settings/hours',
          <ClockIcon />,
          prop ? hoursSummary(prop.reply_hours) : undefined,
        ),
      ],
    },
    {
      id: 'money',
      title: 'Money',
      rows: [
        row(
          'payments',
          'Payments',
          '/settings/payments',
          <CreditCardIcon />,
          payments.data
            ? active === 0
              ? 'None yet'
              : `${active} ${active === 1 ? 'way' : 'ways'} to pay`
            : undefined,
          payments.data !== undefined && active === 0,
        ),
        row(
          'plan',
          'Plan',
          '/settings/plan',
          <ReceiptIcon />,
          account.data?.plan?.name ?? undefined,
        ),
      ],
    },
    {
      id: 'you',
      title: 'You',
      rows: [
        row(
          'account',
          'Account',
          '/settings/account',
          <UserIcon />,
          account.data?.profile.full_name ?? undefined,
        ),
        row('notices', 'Notices', '/settings/notices', <BellIcon />, undefined),
      ],
    },
    {
      id: 'data',
      title: 'Data',
      rows: [
        row('storage', 'Storage', '/settings/storage', <HardDriveIcon />, undefined),
        row('activity', 'Activity', '/settings/activity', <ListChecksIcon />, undefined),
      ],
    },
  ];
}

export function SettingsHubList({ className }: { readonly className?: string | undefined }) {
  const groups = useSettingsGroups();
  return <SettingsList groups={groups} className={className} />;
}

/**
 * Every settings page sits in this pane: on phones and tablets the page alone (the top bar has
 * Back); from 1,024 px the list on the left (280 px) and the page on the right (up to 720 px).
 */
export function SettingsPane({
  title,
  children,
}: {
  readonly title: string;
  readonly children: ReactNode;
}) {
  return (
    <div className="lg:grid lg:grid-cols-[280px_minmax(0,720px)] lg:items-start lg:gap-8">
      <aside className="hidden lg:sticky lg:top-[calc(var(--shell-header-height)+1rem)] lg:block">
        <SettingsHubList />
      </aside>
      <section className="min-w-0 space-y-6 pb-24 lg:pb-20">
        <h1 className="font-heading text-2xl font-semibold tracking-tight max-md:sr-only">
          {title}
        </h1>
        {children}
      </section>
    </div>
  );
}
