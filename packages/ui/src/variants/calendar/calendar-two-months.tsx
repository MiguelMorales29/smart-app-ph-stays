'use client';

// Adapted from ReUI base-nova c-calendar-21 (MIT) for Smart App PH two-month stay range selection in Asia/Manila time.
import { useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';

import { MANILA_TIME_ZONE, addDays, manilaToday, type CalendarDate } from '@smartapp/core';
import { Calendar } from '@smartapp/ui/components/calendar';
import { useIsMobile } from '@smartapp/ui/hooks/use-mobile';
import { cn } from 'cn';

import {
  formatManilaStayRange,
  manilaCalendarDateToDate,
  toManilaCalendarDate,
} from '../../lib/manila-calendar';

export interface CalendarTwoMonthsProps {
  readonly todayDate?: CalendarDate | undefined;
  readonly defaultRange?: { readonly from: CalendarDate; readonly to?: CalendarDate } | undefined;
  readonly onRangeChange?:
    | ((range: { readonly from: CalendarDate; readonly to?: CalendarDate } | null) => void)
    | undefined;
  readonly className?: string | undefined;
}

/**
 * Two-month stay range calendar (stacks to 1 month on phones so 360 px screens never overflow).
 */
export function CalendarTwoMonths({
  todayDate,
  defaultRange,
  onRangeChange,
  className,
}: CalendarTwoMonthsProps) {
  const isMobile = useIsMobile();
  const todayIso = useMemo(() => todayDate ?? manilaToday(), [todayDate]);
  const todayObj = useMemo(() => manilaCalendarDateToDate(todayIso), [todayIso]);

  const [range, setRange] = useState<DateRange | undefined>(() => {
    const startIso = defaultRange?.from ?? addDays(todayIso, 3);
    const endIso = defaultRange?.to ?? addDays(todayIso, 7);
    return {
      from: manilaCalendarDateToDate(startIso),
      to: manilaCalendarDateToDate(endIso),
    };
  });

  const rangeSummary = useMemo(() => {
    if (!range?.from || !range.to) return null;
    const fromIso = toManilaCalendarDate(range.from);
    const toIso = toManilaCalendarDate(range.to);
    if (toIso <= fromIso) return null;
    return formatManilaStayRange(fromIso, toIso);
  }, [range]);

  const handleSelect = (next: DateRange | undefined) => {
    setRange(next);
    if (!onRangeChange) return;
    if (!next?.from) {
      onRangeChange(null);
      return;
    }
    const from = toManilaCalendarDate(next.from);
    const to = next.to ? toManilaCalendarDate(next.to) : undefined;
    onRangeChange(to ? { from, to } : { from });
  };

  return (
    <div data-slot="calendar-two-months" className={cn('w-fit max-w-full space-y-2', className)}>
      <div className="overflow-x-auto rounded-xl border border-border bg-card p-3">
        <Calendar
          mode="range"
          timeZone={MANILA_TIME_ZONE}
          numberOfMonths={isMobile ? 1 : 2}
          selected={range}
          onSelect={handleSelect}
          defaultMonth={range?.from ?? todayObj}
          disabled={{ before: todayObj }}
          className="bg-transparent p-0 [--cell-size:--spacing(9)]"
        />
      </div>
      <p className="text-xs text-muted-foreground tabular-nums">
        {rangeSummary ?? 'Select check-in and check-out dates (Asia/Manila).'}
      </p>
    </div>
  );
}
