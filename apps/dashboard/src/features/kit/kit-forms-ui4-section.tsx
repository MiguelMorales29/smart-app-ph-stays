import { useState, type ReactNode } from 'react';
import { calendarDate, type CalendarDate } from '@smartapp/core';
import { Badge } from '@smartapp/ui/components/badge';
import { DateSelector, type DateSelectorValue } from '@smartapp/ui/components/reui/date-selector';
import { CalendarCheckoutOnly } from '@smartapp/ui/variants/calendar/calendar-checkout-only';
import { CalendarPriceRange } from '@smartapp/ui/variants/calendar/calendar-price-range';
import { CalendarTwoMonths } from '@smartapp/ui/variants/calendar/calendar-two-months';
import { BookingSlotCalendar } from '@smartapp/ui/vendor/opensource-ui/booking-slot-calendar';
import {
  WeekStripCalendar,
  type WeekStripDayState,
} from '@smartapp/ui/vendor/opensource-ui/week-strip-calendar';

const GOLDEN_TODAY = calendarDate('2026-12-10');
const TAKEN_NIGHTS: readonly CalendarDate[] = [
  calendarDate('2026-12-15'),
  calendarDate('2026-12-16'),
  calendarDate('2026-12-22'),
];

const WEEK_STRIP_STATES: Readonly<Record<string, WeekStripDayState>> = {
  '2026-12-10': 'open',
  '2026-12-11': 'open',
  '2026-12-12': 'full',
  '2026-12-13': 'full',
  '2026-12-14': 'closed',
  '2026-12-15': 'open',
};

const VIEWING_SLOT_GROUPS = [
  { name: 'Morning', slots: ['9:00 AM', '9:30 AM', '10:30 AM', '11:00 AM'] },
  { name: 'Afternoon', slots: ['2:00 PM', '2:30 PM', '3:30 PM', '4:00 PM'] },
] as const;

function demoNightlyPrice(date: CalendarDate): number {
  const day = Number(date.slice(8, 10));
  // Weekend / holiday surge vs quiet weekday rate in centavos
  if (day % 7 === 5 || day % 7 === 6) return 340_000;
  if (day >= 24 && day <= 26) return 420_000;
  return 260_000;
}

function DualSection({
  title,
  source,
  useFor,
  dont,
  children,
}: {
  readonly title: string;
  readonly source: string;
  readonly useFor: string;
  readonly dont: string;
  readonly children: (surface: 'light' | 'dark') => ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-heading text-lg font-semibold">{title}</h2>
        <Badge variant="outline">{source}</Badge>
      </div>
      <div className="space-y-0.5 text-xs text-muted-foreground">
        <p>
          <strong className="font-medium text-foreground">Use for:</strong> {useFor}
        </p>
        <p>
          <strong className="font-medium text-foreground">Don&apos;t:</strong> {dont}
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {(['light', 'dark'] as const).map((surface) => (
          <div
            key={surface}
            className={`${surface} min-w-0 rounded-lg border border-border bg-background p-4 text-foreground`}
          >
            <p className="mb-3 text-xs font-medium text-muted-foreground">
              {surface === 'light' ? 'Light' : 'Dark'}
            </p>
            {children(surface)}
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Shown directly beneath the base Calendar section on `/kit?tab=forms` per Rule 5
 * ("Variants go as a 'Variants' row under their base component").
 */
export function KitCalendarVariantsRow() {
  return (
    <section className="space-y-4 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="space-y-0.5">
          <h3 className="font-heading text-base font-semibold">Calendar · Variants</h3>
          <p className="text-xs text-muted-foreground">
            Range with ₱ nightly prices, two-month range, and D75 check-out-only days (all
            Asia/Manila).
          </p>
        </div>
        <Badge variant="outline">shadcn Calendar variants (UI-4)</Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {(['light', 'dark'] as const).map((surface) => (
          <div
            key={surface}
            className={`${surface} min-w-0 space-y-5 rounded-lg border border-border bg-background p-4 text-foreground`}
          >
            <p className="text-xs font-medium text-muted-foreground">
              {surface === 'light' ? 'Light' : 'Dark'}
            </p>

            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-foreground">
                1. Range with nightly ₱ prices
              </p>
              <CalendarPriceRange
                todayDate={GOLDEN_TODAY}
                getNightlyCentavos={demoNightlyPrice}
                lowRateCentavos={260_000}
                defaultRange={{
                  from: calendarDate('2026-12-12'),
                  to: calendarDate('2026-12-14'),
                }}
              />
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-foreground">
                2. Check-out-only days (D75, min 2 nights)
              </p>
              <CalendarCheckoutOnly
                todayDate={GOLDEN_TODAY}
                takenNights={TAKEN_NIGHTS}
                minNights={2}
                maxNights={5}
                defaultCheckIn={calendarDate('2026-12-13')}
              />
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-foreground">3. Two-month stay range</p>
              <CalendarTwoMonths
                todayDate={GOLDEN_TODAY}
                defaultRange={{
                  from: calendarDate('2026-12-18'),
                  to: calendarDate('2026-12-21'),
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function DateSelectorDemo() {
  const [value, setValue] = useState<DateSelectorValue>({
    period: 'day',
    operator: 'between',
    startDate: new Date('2026-12-01T00:00:00+08:00'),
    endDate: new Date('2026-12-15T00:00:00+08:00'),
  });

  return (
    <DateSelector
      label="Report period"
      value={value}
      onChange={setValue}
      allowRange
      periodTypes={['day', 'month', 'quarter', 'year']}
      baseYear={2026}
    />
  );
}

function BookingSlotDemo() {
  const [picked, setPicked] = useState<string>('No viewing slot picked yet');

  return (
    <div className="space-y-2">
      <BookingSlotCalendar
        todayDate={GOLDEN_TODAY}
        title="Schedule a room viewing"
        subtitle="30 min · Ilaw Residences · Manila time"
        slots={VIEWING_SLOT_GROUPS}
        takenSlots={['10:30 AM', '2:30 PM']}
        onBook={(date, slot) => {
          const day = date.toLocaleDateString('en-PH', {
            timeZone: 'Asia/Manila',
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          });
          setPicked(`Booked ${day} at ${slot} (Manila time)`);
        }}
      />
      <p className="text-xs text-muted-foreground">{picked}</p>
    </div>
  );
}

/** UI-4 date pickers and vendored calendars shown on `/kit?tab=forms`. */
export function KitFormsUi4Section() {
  return (
    <div className="space-y-6">
      <DualSection
        title="DateSelector"
        source="@reui/date-selector · MIT (UI-4)"
        useFor="Report date ranges, monthly/quarterly payout filters, and period comparisons."
        dont="Use for guest stay check-in/check-out picking (use Calendar variants)."
      >
        {() => <DateSelectorDemo />}
      </DualSection>

      <DualSection
        title="WeekStripCalendar & BookingSlotCalendar"
        source="Food app / Opensource UI · MIT (UI-4)"
        useFor="Quick 7-day occupancy strips and 30-minute viewing or arrival slot picking (Asia/Manila)."
        dont="Use for multi-night stay ranges (use CalendarPriceRange or CalendarCheckoutOnly)."
      >
        {() => (
          <div className="space-y-5">
            <WeekStripCalendar todayDate={GOLDEN_TODAY} dayStates={WEEK_STRIP_STATES} />
            <BookingSlotDemo />
          </div>
        )}
      </DualSection>
    </div>
  );
}
