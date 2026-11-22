'use client';

// Source: https://opensourceui.in/components/booking-slot-calendar · copied 2026-11-03 · MIT, Opensource UI by Bidyut Kundu
// Changes: our cn, token classes instead of raw neutral palette, dark mode support,
// stays/viewing slot copy, motion tokens, 44 px touch targets, flexible slot groups,
// configurable taken slots, and Asia/Manila calendar date helpers (D22).
import {
  forwardRef,
  useMemo,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react';

import { addDays, manilaToday, type CalendarDate } from '@smartapp/core';
import { cn } from 'cn';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

import {
  formatManilaCalendarDate,
  manilaCalendarDateToDate,
  manilaStartOfWeek,
} from '../../lib/manila-calendar';

export interface BookingSlotGroup {
  readonly name: string;
  readonly slots: readonly string[];
}

const DEFAULT_SLOTS = [
  '9:00 AM',
  '9:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '2:00 PM',
  '2:30 PM',
  '3:00 PM',
] as const;

export type BookingSlotCalendarProps = Readonly<
  {
    title?: string | undefined;
    subtitle?: string | undefined;
    icon?: ReactNode;
    todayDate?: CalendarDate | undefined;
    slots?: readonly string[] | readonly BookingSlotGroup[] | undefined;
    takenSlots?: readonly string[] | undefined;
    onBook?: ((date: Date, slot: string) => void) | undefined;
  } & ComponentPropsWithoutRef<'div'>
>;

function isRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null;
}

function isStringArray(val: unknown): val is readonly string[] {
  return Array.isArray(val) && val.every((item) => typeof item === 'string');
}

function isBookingSlotGroup(val: unknown): val is BookingSlotGroup {
  return isRecord(val) && typeof val['name'] === 'string' && isStringArray(val['slots']);
}

function isBookingSlotGroupArray(
  val: readonly (string | BookingSlotGroup)[],
): val is readonly BookingSlotGroup[] {
  return val.every(isBookingSlotGroup);
}

function isStringSlotsArray(val: readonly (string | BookingSlotGroup)[]): val is readonly string[] {
  return val.every((item) => typeof item === 'string');
}

// Booking calendar — viewing and arrival slot picker in Asia/Manila time: pick a day, then tap a slot.
export const BookingSlotCalendar = forwardRef<HTMLDivElement, BookingSlotCalendarProps>(
  (
    {
      className,
      title = 'Book a viewing',
      subtitle = '30 min · Property viewing or arrival window (Manila time)',
      icon,
      todayDate,
      slots = DEFAULT_SLOTS,
      takenSlots = ['10:30 AM', '2:30 PM'],
      onBook,
      ...props
    },
    ref,
  ) => {
    const todayIso = useMemo(() => todayDate ?? manilaToday(), [todayDate]);
    const [weekStartIso, setWeekStartIso] = useState<CalendarDate>(() =>
      manilaStartOfWeek(todayIso),
    );
    const [selectedDayIso, setSelectedDayIso] = useState<CalendarDate>(todayIso);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [slideDirection, setSlideDirection] = useState(0);

    const days = useMemo(
      () =>
        Array.from({ length: 7 }, (_, index) => {
          const iso = addDays(weekStartIso, index);
          return { iso, date: manilaCalendarDateToDate(iso) };
        }),
      [weekStartIso],
    );

    const canGoPrev = addDays(weekStartIso, -1) >= todayIso;
    const midDay = days[3];

    const monthLabel = midDay
      ? formatManilaCalendarDate(midDay.iso, { month: 'long', year: 'numeric' })
      : '';

    const dayLabel = formatManilaCalendarDate(selectedDayIso, {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });

    const pickDay = (iso: CalendarDate) => {
      if (iso < todayIso) return;
      setSelectedDayIso(iso);
      setSelectedSlot(null);
    };

    const pickSlot = (slot: string) => {
      if (selectedDayIso < todayIso) return;
      setSelectedSlot(slot);
      onBook?.(manilaCalendarDateToDate(selectedDayIso), slot);
    };

    const goPrevWeek = () => {
      if (!canGoPrev) return;
      setSlideDirection(-1);
      setWeekStartIso((prev) => addDays(prev, -7));
    };

    const goNextWeek = () => {
      setSlideDirection(1);
      setWeekStartIso((prev) => addDays(prev, 7));
    };

    const slotGroups: readonly BookingSlotGroup[] = useMemo(() => {
      if (slots.length === 0) return [];
      if (isBookingSlotGroupArray(slots)) {
        return slots;
      }
      if (isStringSlotsArray(slots)) {
        return [{ name: '', slots }];
      }
      return [];
    }, [slots]);

    return (
      <div
        ref={ref}
        data-slot="booking-slot-calendar"
        className={cn(
          'w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-card font-sans text-card-foreground shadow-sm select-none',
          className,
        )}
        {...props}
      >
        <div className="flex items-center gap-3 border-b border-border px-4 py-4 sm:px-5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-tint text-primary-hover">
            {icon ?? <CalendarIcon className="size-5" aria-hidden />}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </div>

        <div className="px-4 py-4 sm:px-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">{monthLabel}</p>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                aria-label="Previous week"
                disabled={!canGoPrev}
                onClick={goPrevWeek}
                className={cn(
                  'flex size-9 items-center justify-center rounded-full transition-colors duration-fast ease-enter outline-none pointer-coarse:size-11',
                  'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring',
                  canGoPrev
                    ? 'cursor-pointer text-muted-foreground hover:bg-muted hover:text-foreground'
                    : 'cursor-not-allowed text-muted-foreground/30',
                )}
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

          <div
            key={weekStartIso}
            className={cn(
              'mb-4 grid grid-cols-7 opacity-100 transition-all duration-slow ease-enter',
              slideDirection >= 0 ? 'starting:translate-x-2' : 'starting:-translate-x-2',
            )}
          >
            {days.map(({ iso }) => {
              const active = iso === selectedDayIso;
              const isToday = iso === todayIso;
              const past = iso < todayIso;
              const dayNum = Number(iso.slice(8, 10));

              return (
                <button
                  key={iso}
                  type="button"
                  aria-pressed={active}
                  aria-disabled={past || undefined}
                  disabled={past}
                  onClick={() => pickDay(iso)}
                  className={cn(
                    'group flex min-h-11 flex-col items-center justify-center gap-1 outline-none',
                    past ? 'cursor-not-allowed' : 'cursor-pointer',
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'text-[10px] font-medium tracking-wide uppercase',
                      past ? 'text-muted-foreground/40' : 'text-muted-foreground',
                    )}
                  >
                    {formatManilaCalendarDate(iso, { weekday: 'narrow' })}
                  </span>
                  <span className="sr-only">
                    {formatManilaCalendarDate(iso, { weekday: 'long', month: 'short' })}{' '}
                  </span>
                  <span
                    className={cn(
                      'flex size-8 items-center justify-center rounded-full text-xs font-medium tabular-nums',
                      'transition-colors duration-fast ease-enter',
                      !past &&
                        'group-focus-visible:outline-2 group-focus-visible:outline-offset-1 group-focus-visible:outline-ring',
                      past && 'text-muted-foreground/40',
                      !past && active && 'bg-primary font-semibold text-primary-foreground',
                      !past &&
                        !active &&
                        isToday &&
                        'bg-muted font-semibold text-foreground group-hover:bg-accent',
                      !past && !active && !isToday && 'text-foreground group-hover:bg-muted',
                    )}
                  >
                    {dayNum}
                  </span>
                </button>
              );
            })}
          </div>

          <p
            key={dayLabel}
            className="mb-2.5 text-xs font-medium text-muted-foreground opacity-100 transition-all duration-slow ease-enter"
          >
            {dayLabel}
          </p>

          <div className="space-y-3">
            {slotGroups.map((group) => (
              <div key={group.name || 'default'} className="space-y-1.5">
                {group.name && (
                  <p className="text-xs font-medium text-muted-foreground">{group.name}</p>
                )}
                <div className="grid grid-cols-2 gap-2">
                  {group.slots.map((slot) => {
                    const taken = takenSlots.includes(slot);
                    const active = selectedSlot === slot;

                    return (
                      <button
                        key={slot}
                        type="button"
                        disabled={taken}
                        aria-pressed={active}
                        onClick={() => pickSlot(slot)}
                        className={cn(
                          'min-h-11 rounded-lg px-2 text-xs font-medium tabular-nums outline-none sm:min-h-9',
                          'transition-colors duration-fast ease-enter',
                          'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring',
                          taken &&
                            'cursor-not-allowed bg-muted/40 text-muted-foreground/50 line-through',
                          !taken && active && 'cursor-pointer bg-primary text-primary-foreground',
                          !taken &&
                            !active &&
                            'cursor-pointer bg-muted text-foreground hover:bg-accent',
                        )}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  },
);

BookingSlotCalendar.displayName = 'BookingSlotCalendar';
