'use client';

// Source: https://opensourceui.in/components/week-strip-calendar · copied 2026-11-03 · MIT, Opensource UI by Bidyut Kundu
// Changes: our cn, token classes instead of raw neutral palette, dark mode support,
// customizable day states (closed, full), controlled/uncontrolled selection, motion tokens,
// 44 px touch targets, and Asia/Manila calendar date helpers (D22).
import { forwardRef, useMemo, useState, type ComponentPropsWithoutRef } from 'react';

import { addDays, manilaToday, type CalendarDate } from '@smartapp/core';
import { cn } from 'cn';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import {
  formatManilaCalendarDate,
  manilaCalendarDateToDate,
  manilaStartOfWeek,
  toManilaCalendarDate,
} from '../../lib/manila-calendar';

export type WeekStripDayState = 'open' | 'closed' | 'full';

export type WeekStripCalendarProps = Readonly<
  {
    selected?: Date | undefined;
    defaultDate?: Date | undefined;
    todayDate?: CalendarDate | undefined;
    onSelect?: ((date: Date) => void) | undefined;
    dayStates?: Readonly<Record<string, WeekStripDayState>> | undefined;
    getDayState?: ((date: Date) => WeekStripDayState | undefined) | undefined;
  } & Omit<ComponentPropsWithoutRef<'div'>, 'onSelect'>
>;

// Week strip — swipe weeks with arrows, tap a day to select it (Asia/Manila calendar dates).
export const WeekStripCalendar = forwardRef<HTMLDivElement, WeekStripCalendarProps>(
  (
    {
      className,
      selected: controlledSelected,
      defaultDate,
      todayDate,
      onSelect,
      dayStates,
      getDayState,
      ...props
    },
    ref,
  ) => {
    const todayIso = useMemo(() => todayDate ?? manilaToday(), [todayDate]);
    const initialIso = useMemo(
      () => (defaultDate ? toManilaCalendarDate(defaultDate) : todayIso),
      [defaultDate, todayIso],
    );
    const [weekStartIso, setWeekStartIso] = useState<CalendarDate>(() =>
      manilaStartOfWeek(initialIso),
    );
    const [internalSelectedIso, setInternalSelectedIso] = useState<CalendarDate>(initialIso);
    const [slideDirection, setSlideDirection] = useState(0);

    const selectedIso =
      controlledSelected !== undefined
        ? toManilaCalendarDate(controlledSelected)
        : internalSelectedIso;

    const days = useMemo(
      () =>
        Array.from({ length: 7 }, (_, index) => {
          const iso = addDays(weekStartIso, index);
          return { iso, date: manilaCalendarDateToDate(iso) };
        }),
      [weekStartIso],
    );

    const midDay = days[3];
    const firstDay = days[0];
    const lastDay = days[6];

    const monthLabel = midDay
      ? formatManilaCalendarDate(midDay.iso, { month: 'long', year: 'numeric' })
      : '';

    const rangeLabel =
      firstDay && lastDay
        ? `${formatManilaCalendarDate(firstDay.iso, { month: 'short', day: 'numeric' })} – ${formatManilaCalendarDate(lastDay.iso, { month: 'short', day: 'numeric' })}`
        : '';

    const selectDay = (iso: CalendarDate, date: Date) => {
      if (controlledSelected === undefined) {
        setInternalSelectedIso(iso);
      }
      onSelect?.(date);
    };

    const goPrevWeek = () => {
      setSlideDirection(-1);
      setWeekStartIso((prev) => addDays(prev, -7));
    };

    const goNextWeek = () => {
      setSlideDirection(1);
      setWeekStartIso((prev) => addDays(prev, 7));
    };

    const resolveState = (iso: CalendarDate, date: Date): WeekStripDayState | undefined => {
      if (getDayState) return getDayState(date);
      if (dayStates) return dayStates[iso];
      return undefined;
    };

    return (
      <div
        ref={ref}
        data-slot="week-strip-calendar"
        className={cn(
          'w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-card px-4 py-4 font-sans text-card-foreground shadow-sm select-none sm:px-5',
          className,
        )}
        {...props}
      >
        <div className="mb-1 flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">{monthLabel}</p>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              aria-label="Previous week"
              onClick={goPrevWeek}
              className="flex size-9 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors duration-fast ease-enter outline-none pointer-coarse:size-11 hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
            >
              <ChevronLeft size={16} strokeWidth={2} aria-hidden />
            </button>
            <button
              type="button"
              aria-label="Next week"
              onClick={goNextWeek}
              className="flex size-9 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors duration-fast ease-enter outline-none pointer-coarse:size-11 hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
            >
              <ChevronRight size={16} strokeWidth={2} aria-hidden />
            </button>
          </div>
        </div>

        <p
          key={rangeLabel}
          className="mb-4 text-xs font-medium text-muted-foreground opacity-100 transition-opacity duration-slow ease-enter"
        >
          {rangeLabel}
        </p>

        <div
          key={weekStartIso}
          className={cn(
            'grid grid-cols-7 opacity-100 transition-all duration-slow ease-enter',
            slideDirection >= 0 ? 'starting:translate-x-2' : 'starting:-translate-x-2',
          )}
        >
          {days.map(({ iso, date }) => {
            const isSelected = iso === selectedIso;
            const isToday = iso === todayIso;
            const state = resolveState(iso, date);
            const isClosed = state === 'closed';
            const isFull = state === 'full';
            const dayNum = Number(iso.slice(8, 10));

            return (
              <button
                key={iso}
                type="button"
                aria-pressed={isSelected}
                disabled={isClosed}
                onClick={() => selectDay(iso, date)}
                className={cn(
                  'group flex min-h-11 flex-col items-center justify-center gap-1 outline-none',
                  isClosed ? 'cursor-not-allowed opacity-40' : 'cursor-pointer',
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'text-[10px] font-medium tracking-wide uppercase',
                    isSelected ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {formatManilaCalendarDate(iso, { weekday: 'narrow' })}
                </span>
                <span className="sr-only">
                  {formatManilaCalendarDate(iso, { weekday: 'long', month: 'short' })}{' '}
                </span>
                <span
                  className={cn(
                    'relative flex size-9 items-center justify-center rounded-full text-sm font-medium tabular-nums',
                    'transition-colors duration-fast ease-enter',
                    'group-focus-visible:outline-2 group-focus-visible:outline-offset-1 group-focus-visible:outline-ring',
                    isSelected && 'bg-primary font-semibold text-primary-foreground',
                    !isSelected &&
                      isToday &&
                      'bg-muted font-semibold text-foreground group-hover:bg-accent',
                    !isSelected && !isToday && 'text-foreground group-hover:bg-muted',
                    isFull && !isSelected && 'text-warning ring-1 ring-warning',
                  )}
                >
                  {dayNum}
                  {isToday && !isSelected && (
                    <span
                      aria-hidden
                      className="absolute -bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-primary"
                    />
                  )}
                </span>
                {state && (
                  <span
                    className={cn(
                      'text-[9px] leading-none font-medium',
                      isClosed && 'text-muted-foreground line-through',
                      isFull && 'font-semibold text-warning',
                      state === 'open' && 'text-success',
                    )}
                  >
                    {isClosed ? ' Closed' : isFull ? ' Full' : ''}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  },
);

WeekStripCalendar.displayName = 'WeekStripCalendar';
