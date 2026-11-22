'use client';

// Smart App PH D75 calendar variant: taken nights remain selectable as check-out dates when
// all nights before them are free, with min/max night validation shown inline (Asia/Manila time).
import { useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';

import { MANILA_TIME_ZONE, manilaToday, type CalendarDate } from '@smartapp/core';
import { Calendar, CalendarDayButton } from '@smartapp/ui/components/calendar';
import { cn } from 'cn';

import {
  evaluateCheckoutOnlyCandidate,
  formatManilaCalendarDate,
  formatManilaStayRange,
  manilaCalendarDateToDate,
  toManilaCalendarDate,
} from '../../lib/manila-calendar';

export interface CalendarCheckoutOnlyProps {
  /** Occupied nights as `YYYY-MM-DD` Asia/Manila dates. */
  readonly takenNights: readonly CalendarDate[];
  readonly todayDate?: CalendarDate | undefined;
  readonly minNights?: number | undefined;
  readonly maxNights?: number | undefined;
  readonly defaultCheckIn?: CalendarDate | undefined;
  readonly defaultCheckOut?: CalendarDate | undefined;
  readonly onRangeChange?:
    | ((range: { readonly from: CalendarDate; readonly to?: CalendarDate } | null) => void)
    | undefined;
  readonly className?: string | undefined;
}

/**
 * Stay calendar implementing D75: a taken night cannot be a check-in date, but once a guest picks
 * check-in, the first taken night after it opens as a check-out-only day.
 */
export function CalendarCheckoutOnly({
  takenNights,
  todayDate,
  minNights = 1,
  maxNights,
  defaultCheckIn,
  defaultCheckOut,
  onRangeChange,
  className,
}: CalendarCheckoutOnlyProps) {
  const todayIso = useMemo(() => todayDate ?? manilaToday(), [todayDate]);
  const todayObj = useMemo(() => manilaCalendarDateToDate(todayIso), [todayIso]);
  const takenSet = useMemo(() => new Set<string>(takenNights), [takenNights]);

  const [checkInIso, setCheckInIso] = useState<CalendarDate | null>(defaultCheckIn ?? null);
  const [checkOutIso, setCheckOutIso] = useState<CalendarDate | null>(defaultCheckOut ?? null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const selectedRange: DateRange | undefined = useMemo(() => {
    if (!checkInIso) return undefined;
    return {
      from: manilaCalendarDateToDate(checkInIso),
      ...(checkOutIso ? { to: manilaCalendarDateToDate(checkOutIso) } : {}),
    };
  }, [checkInIso, checkOutIso]);

  const activeCheckIn = checkInIso && !checkOutIso ? checkInIso : null;

  const isDayDisabled = (date: Date): boolean => {
    const iso = toManilaCalendarDate(date);
    if (iso < todayIso) return true;
    if (activeCheckIn === null) {
      return takenSet.has(iso);
    }
    if (iso <= activeCheckIn) {
      return takenSet.has(iso);
    }
    const result = evaluateCheckoutOnlyCandidate({
      candidate: iso,
      today: todayIso,
      takenNights: takenSet,
      checkIn: activeCheckIn,
      minNights: 1,
      maxNights,
    });
    return !result.allowed;
  };

  const isCheckoutOnlyDay = (date: Date): boolean => {
    if (!activeCheckIn) return false;
    const iso = toManilaCalendarDate(date);
    if (iso <= activeCheckIn) return false;
    const result = evaluateCheckoutOnlyCandidate({
      candidate: iso,
      today: todayIso,
      takenNights: takenSet,
      checkIn: activeCheckIn,
      minNights: 1,
      maxNights,
    });
    return result.allowed && result.isCheckoutOnly;
  };

  const handleDayClick = (day: Date) => {
    const iso = toManilaCalendarDate(day);
    // Start a fresh stay when no check-in is active or a complete range is already picked
    if (!checkInIso || checkOutIso || iso <= checkInIso) {
      if (iso < todayIso || takenSet.has(iso)) {
        setFeedback('That night is already taken. Pick an open check-in date.');
        return;
      }
      setCheckInIso(iso);
      setCheckOutIso(null);
      setFeedback(null);
      onRangeChange?.({ from: iso });
      return;
    }

    const verdict = evaluateCheckoutOnlyCandidate({
      candidate: iso,
      today: todayIso,
      takenNights: takenSet,
      checkIn: checkInIso,
      minNights,
      maxNights,
    });
    if (!verdict.allowed) {
      setFeedback(verdict.reason);
      return;
    }

    setCheckOutIso(iso);
    setFeedback(
      verdict.isCheckoutOnly
        ? `Check-out only on ${formatManilaCalendarDate(iso, { day: 'numeric', month: 'short' })} — next guest checks in that afternoon.`
        : null,
    );
    onRangeChange?.({ from: checkInIso, to: iso });
  };

  return (
    <div data-slot="calendar-checkout-only" className={cn('w-full max-w-sm space-y-2', className)}>
      <Calendar
        mode="range"
        timeZone={MANILA_TIME_ZONE}
        selected={selectedRange}
        onDayClick={handleDayClick}
        defaultMonth={checkInIso ? manilaCalendarDateToDate(checkInIso) : todayObj}
        disabled={isDayDisabled}
        showOutsideDays={false}
        modifiers={{
          checkoutOnly: isCheckoutOnlyDay,
          taken: (date) => {
            const iso = toManilaCalendarDate(date);
            return takenSet.has(iso) && !isCheckoutOnlyDay(date);
          },
        }}
        className="w-full rounded-xl border border-border bg-card p-1.5 [--cell-size:--spacing(8)] sm:p-3 sm:[--cell-size:--spacing(11)]"
        classNames={{
          root: 'w-full',
          month: 'flex w-full flex-col gap-3',
          month_grid: 'w-full table-fixed border-collapse',
          week: 'mt-1.5 flex w-full gap-0.5',
        }}
        components={{
          DayButton: ({ children, modifiers, day, className: dayClassName, ...props }) => {
            const isOutOnly = Boolean(modifiers['checkoutOnly']);
            const isTaken = Boolean(modifiers['taken']);
            const iso = toManilaCalendarDate(day.date);
            const weekdayMonth = formatManilaCalendarDate(iso, {
              weekday: 'long',
              month: 'long',
            });
            const yearText = iso.slice(0, 4);
            return (
              <CalendarDayButton
                day={day}
                modifiers={modifiers}
                {...props}
                aria-label={undefined}
                className={cn(
                  'min-w-0 gap-0.5 px-0.5 [&>span]:opacity-100',
                  isOutOnly &&
                    !modifiers.range_end &&
                    'border border-dashed border-warning bg-warning-tint/60 text-foreground',
                  isTaken && 'line-through',
                  dayClassName,
                )}
              >
                <span className="sr-only">{weekdayMonth} </span>
                <span className="text-xs leading-none font-medium tabular-nums sm:text-sm">
                  {children}
                </span>
                <span className="sr-only">
                  , {yearText}
                  {isOutOnly ? ', check-out only' : ''}
                </span>
                {isOutOnly ? (
                  <span className="text-[9px] leading-none font-medium text-foreground">Out</span>
                ) : null}
              </CalendarDayButton>
            );
          },
        }}
      />
      <div className="space-y-1 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs">
        <p className="font-medium text-foreground tabular-nums">
          {checkInIso && checkOutIso
            ? formatManilaStayRange(checkInIso, checkOutIso)
            : checkInIso
              ? `Check-in ${formatManilaCalendarDate(checkInIso)} — pick check-out (${minNights}+ ${minNights === 1 ? 'night' : 'nights'})`
              : `Pick a check-in date (${minNights}+ ${minNights === 1 ? 'night' : 'nights'} · Manila time)`}
        </p>
        {feedback ? <p className="text-muted-foreground">{feedback}</p> : null}
        <div className="flex flex-wrap items-center gap-3 pt-0.5 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="inline-block size-3 rounded-xs border border-dashed border-warning bg-warning-tint/60"
            />
            Check-out only
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="line-through">
              15
            </span>
            Taken night
          </span>
        </div>
      </div>
    </div>
  );
}
