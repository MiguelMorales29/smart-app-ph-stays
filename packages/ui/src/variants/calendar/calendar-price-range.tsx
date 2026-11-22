'use client';

// Adapted from ReUI base-nova c-calendar-17 (MIT) for Smart App PH range stays with ₱ nightly rates in Asia/Manila time.
import { useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';

import {
  MANILA_TIME_ZONE,
  addDays,
  eachNight,
  formatPesos,
  manilaToday,
  type CalendarDate,
} from '@smartapp/core';
import { Calendar, CalendarDayButton } from '@smartapp/ui/components/calendar';
import { cn } from 'cn';

import {
  formatManilaCalendarDate,
  formatManilaStayRange,
  manilaCalendarDateToDate,
  toManilaCalendarDate,
} from '../../lib/manila-calendar';

export interface CalendarPriceRangeProps {
  /** Returns the nightly price in whole centavos for a given Asia/Manila date, or null if closed. */
  readonly getNightlyCentavos: (date: CalendarDate) => number | null;
  /** Optional highlight threshold in centavos (rates at or below this show a quiet success tone). */
  readonly lowRateCentavos?: number | undefined;
  readonly todayDate?: CalendarDate | undefined;
  readonly defaultRange?: { readonly from: CalendarDate; readonly to?: CalendarDate } | undefined;
  readonly onRangeChange?:
    | ((range: { readonly from: CalendarDate; readonly to?: CalendarDate } | null) => void)
    | undefined;
  readonly className?: string | undefined;
}

function compactPesos(centavos: number): string {
  const pesos = Math.round(centavos / 100);
  if (pesos >= 10_000) {
    return `₱${(pesos / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return `₱${pesos.toLocaleString('en-PH')}`;
}

/**
 * Stay date range calendar showing each night's ₱ rate beneath the day number (Asia/Manila dates).
 */
export function CalendarPriceRange({
  getNightlyCentavos,
  lowRateCentavos,
  todayDate,
  defaultRange,
  onRangeChange,
  className,
}: CalendarPriceRangeProps) {
  const todayIso = useMemo(() => todayDate ?? manilaToday(), [todayDate]);
  const todayObj = useMemo(() => manilaCalendarDateToDate(todayIso), [todayIso]);

  const [range, setRange] = useState<DateRange | undefined>(() => {
    const startIso = defaultRange?.from ?? addDays(todayIso, 2);
    const endIso = defaultRange?.to ?? addDays(todayIso, 4);
    return {
      from: manilaCalendarDateToDate(startIso),
      to: manilaCalendarDateToDate(endIso),
    };
  });

  const summary = useMemo(() => {
    if (!range?.from || !range.to) return null;
    const fromIso = toManilaCalendarDate(range.from);
    const toIso = toManilaCalendarDate(range.to);
    const nights = eachNight(fromIso, toIso);
    if (nights.length === 0) return null;
    let total = 0;
    for (const night of nights) {
      const rate = getNightlyCentavos(night);
      if (rate !== null) total += rate;
    }
    return {
      label: formatManilaStayRange(fromIso, toIso),
      totalLabel: formatPesos(total),
    };
  }, [range, getNightlyCentavos]);

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
    <div data-slot="calendar-price-range" className={cn('w-full max-w-sm space-y-2', className)}>
      <Calendar
        mode="range"
        timeZone={MANILA_TIME_ZONE}
        selected={range}
        onSelect={handleSelect}
        defaultMonth={range?.from ?? todayObj}
        disabled={{ before: todayObj }}
        showOutsideDays={false}
        className="w-full rounded-xl border border-border bg-card p-2 [--cell-size:--spacing(9)] sm:p-3 sm:[--cell-size:--spacing(11)]"
        classNames={{
          root: 'w-full',
          month: 'flex w-full flex-col gap-3',
        }}
        components={{
          DayButton: ({ children, modifiers, day, className: dayClassName, ...props }) => {
            const iso = toManilaCalendarDate(day.date);
            const rate = modifiers.outside ? null : getNightlyCentavos(iso);
            const isLow = rate !== null && lowRateCentavos !== undefined && rate <= lowRateCentavos;
            const isEndpoint = Boolean(modifiers.range_start || modifiers.range_end);
            const isMiddle = Boolean(modifiers.range_middle);
            const showPrice = rate !== null && !modifiers.disabled;
            const priceText = showPrice ? compactPesos(rate) : null;
            const dayNum = String(Number(iso.slice(8, 10)));
            const fullDate = formatManilaCalendarDate(iso, {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            });

            return (
              <CalendarDayButton
                day={day}
                modifiers={modifiers}
                {...props}
                aria-label={priceText ? `${dayNum} ${priceText}, ${fullDate}` : fullDate}
                className={cn('gap-0.5 px-0.5 [&>span]:opacity-100', dayClassName)}
              >
                <span className="text-xs leading-none font-medium tabular-nums sm:text-sm">
                  {children}
                </span>
                {priceText !== null ? (
                  <span
                    className={cn(
                      'text-[9px] leading-none font-normal tabular-nums sm:text-[10px]',
                      isEndpoint
                        ? 'text-primary-foreground'
                        : isMiddle
                          ? 'text-foreground'
                          : isLow
                            ? 'font-medium text-success'
                            : 'text-foreground/80',
                    )}
                  >
                    {priceText}
                  </span>
                ) : null}
              </CalendarDayButton>
            );
          },
        }}
      />
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs">
        {summary ? (
          <>
            <span className="text-muted-foreground">{summary.label}</span>
            <span className="font-semibold text-foreground tabular-nums">
              {summary.totalLabel} total
            </span>
          </>
        ) : (
          <span className="text-muted-foreground">
            Pick check-in and check-out dates (Manila time).
          </span>
        )}
      </div>
    </div>
  );
}
