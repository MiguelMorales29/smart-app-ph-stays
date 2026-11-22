import type { CalendarDate } from './index.js';

export const MANILA_TIME_ZONE = 'Asia/Manila' as const;
export const MANILA_UTC_OFFSET = '+08:00' as const;

const MS_PER_DAY = 86_400_000;
const CALENDAR_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const WALL_TIME_PATTERN = /^(\d{2}):(\d{2})(?::(\d{2}))?$/;
const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const;

export type Weekday = (typeof WEEKDAYS)[number];

const manilaDatePartsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: MANILA_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const defaultManilaFormatOptions: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
};

export function parseCalendarDateParts(
  value: string,
): { readonly year: number; readonly month: number; readonly day: number } | null {
  const match = CALENDAR_DATE_PATTERN.exec(value);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  const check = new Date(Date.UTC(year, month - 1, day));
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

export function isCalendarDate(value: string): value is CalendarDate {
  return parseCalendarDateParts(value) !== null;
}

function assertCalendarDate(value: string): CalendarDate {
  if (!isCalendarDate(value)) {
    throw new RangeError(`Invalid CalendarDate: ${value}`);
  }
  return value;
}

function toUtcMs(date: CalendarDate): number {
  const parts = parseCalendarDateParts(date);
  if (!parts) {
    throw new RangeError(`Invalid CalendarDate: ${date}`);
  }
  return Date.UTC(parts.year, parts.month - 1, parts.day);
}

function fromUtcDate(utcDate: Date): CalendarDate {
  const year = String(utcDate.getUTCFullYear()).padStart(4, '0');
  const month = String(utcDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(utcDate.getUTCDate()).padStart(2, '0');
  return assertCalendarDate(`${year}-${month}-${day}`);
}

export interface Clock {
  now(): Date;
}

export const systemClock: Clock = {
  now: () => new Date(),
};

export function fixedClock(iso: string): Clock {
  const instant = new Date(iso);
  const ms = instant.getTime();
  if (Number.isNaN(ms)) {
    throw new RangeError(`Invalid ISO timestamp: ${iso}`);
  }
  return {
    now: () => new Date(ms),
  };
}

export function manilaToday(clock: Clock = systemClock): CalendarDate {
  const instant = clock.now();
  if (Number.isNaN(instant.getTime())) {
    throw new RangeError('Clock returned an invalid Date.');
  }

  const parts = manilaDatePartsFormatter.formatToParts(instant);
  let year = '';
  let month = '';
  let day = '';

  for (const part of parts) {
    if (part.type === 'year') {
      year = part.value;
    } else if (part.type === 'month') {
      month = part.value;
    } else if (part.type === 'day') {
      day = part.value;
    }
  }

  return assertCalendarDate(`${year}-${month}-${day}`);
}

export function addDays(date: CalendarDate, days: number): CalendarDate {
  if (!Number.isInteger(days)) {
    throw new RangeError('Days offset must be an integer.');
  }

  const parts = parseCalendarDateParts(date);
  if (!parts) {
    throw new RangeError(`Invalid CalendarDate: ${date}`);
  }

  return fromUtcDate(new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days)));
}

export function nightsBetween(checkIn: CalendarDate, checkOut: CalendarDate): number {
  return (toUtcMs(checkOut) - toUtcMs(checkIn)) / MS_PER_DAY;
}

export function eachNight(checkIn: CalendarDate, checkOut: CalendarDate): CalendarDate[] {
  const nights = nightsBetween(checkIn, checkOut);
  if (nights <= 0) {
    return [];
  }

  const result: CalendarDate[] = [];
  for (let offset = 0; offset < nights; offset += 1) {
    result.push(addDays(checkIn, offset));
  }
  return result;
}

export function weekdayOf(date: CalendarDate): Weekday {
  const index = new Date(toUtcMs(date)).getUTCDay();
  const weekday = WEEKDAYS[index];
  if (weekday === undefined) {
    throw new RangeError(`Unexpected weekday index: ${index}`);
  }
  return weekday;
}

export function manilaWallTime(date: CalendarDate, time: string): Date {
  const validDate = assertCalendarDate(date);
  const match = WALL_TIME_PATTERN.exec(time);
  if (!match) {
    throw new RangeError(`Expected wall time in HH:MM or HH:MM:SS format, received: ${time}`);
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = match[3] === undefined ? 0 : Number(match[3]);

  if (hours > 23 || minutes > 59 || seconds > 59) {
    throw new RangeError(`Out-of-range wall time: ${time}`);
  }

  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');

  return new Date(`${validDate}T${hh}:${mm}:${ss}${MANILA_UTC_OFFSET}`);
}

export function formatManila(date: Date, options?: Intl.DateTimeFormatOptions): string {
  if (Number.isNaN(date.getTime())) {
    throw new RangeError('Cannot format an invalid Date.');
  }

  const formatter = new Intl.DateTimeFormat('en-PH', {
    ...(options ?? defaultManilaFormatOptions),
    timeZone: MANILA_TIME_ZONE,
  });

  return formatter.format(date);
}
