'use client';

import { calendarDate, type CalendarDate } from '@smartapp/core';
import { CalendarCheckoutOnly } from '@smartapp/ui/variants/calendar/calendar-checkout-only';
import { CalendarPriceRange } from '@smartapp/ui/variants/calendar/calendar-price-range';
import { BookingSlotCalendar } from '@smartapp/ui/vendor/opensource-ui/booking-slot-calendar';
import {
  WeekStripCalendar,
  type WeekStripDayState,
} from '@smartapp/ui/vendor/opensource-ui/week-strip-calendar';

const GOLDEN_TODAY = calendarDate('2026-12-10');
const TAKEN_NIGHTS: readonly CalendarDate[] = [
  calendarDate('2026-12-15'),
  calendarDate('2026-12-16'),
];

const WEEK_STATES: Readonly<Record<string, WeekStripDayState>> = {
  '2026-12-10': 'open',
  '2026-12-11': 'open',
  '2026-12-12': 'full',
  '2026-12-13': 'full',
  '2026-12-14': 'closed',
};

function guestNightlyRate(date: CalendarDate): number {
  const day = Number(date.slice(8, 10));
  return day % 7 === 5 || day % 7 === 6 ? 340_000 : 260_000;
}

/** Guest-facing UI-4 calendars rendered inside the active PropertyTheme on storefront `/kit`. */
export function StorefrontKitUi4Section({ propertyName }: { readonly propertyName: string }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Stay range with nightly ₱ prices (CalendarPriceRange · Asia/Manila)
          </p>
          <CalendarPriceRange
            todayDate={GOLDEN_TODAY}
            getNightlyCentavos={guestNightlyRate}
            lowRateCentavos={260_000}
            defaultRange={{
              from: calendarDate('2026-12-12'),
              to: calendarDate('2026-12-14'),
            }}
          />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Check-out-only taken nights (CalendarCheckoutOnly · D75)
          </p>
          <CalendarCheckoutOnly
            todayDate={GOLDEN_TODAY}
            takenNights={TAKEN_NIGHTS}
            minNights={2}
            maxNights={5}
            defaultCheckIn={calendarDate('2026-12-13')}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Quick week availability strip (WeekStripCalendar)
          </p>
          <WeekStripCalendar todayDate={GOLDEN_TODAY} dayStates={WEEK_STATES} />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Viewing &amp; arrival time slots (BookingSlotCalendar)
          </p>
          <BookingSlotCalendar
            todayDate={GOLDEN_TODAY}
            title={`Book a viewing · ${propertyName}`}
            subtitle="30 min · Manila time"
          />
        </div>
      </div>
    </div>
  );
}
