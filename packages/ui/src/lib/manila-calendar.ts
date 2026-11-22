import { TZDate } from '@date-fns/tz';
import {
  MANILA_TIME_ZONE,
  addDays,
  eachNight,
  formatManila,
  isCalendarDate,
  manilaToday,
  nightsBetween,
  type CalendarDate,
  type Clock,
} from '@smartapp/core';

const manilaPartsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: MANILA_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Converts any Date instant to its `YYYY-MM-DD` CalendarDate in `Asia/Manila`. */
export function toManilaCalendarDate(date: Date): CalendarDate {
  const parts = manilaPartsFormatter.formatToParts(date);
  let year = '';
  let month = '';
  let day = '';
  for (const part of parts) {
    if (part.type === 'year') year = part.value;
    else if (part.type === 'month') month = part.value;
    else if (part.type === 'day') day = part.value;
  }
  const iso = `${year}-${month}-${day}`;
  if (!isCalendarDate(iso)) {
    throw new RangeError(`Could not derive Manila calendar date from ${String(date)}`);
  }
  return iso;
}

/** Converts a `YYYY-MM-DD` CalendarDate to midnight `00:00:00+08:00` as a `TZDate` in `Asia/Manila`. */
export function manilaCalendarDateToDate(iso: CalendarDate): Date {
  const [yStr, mStr, dStr] = iso.split('-');
  const year = Number(yStr);
  const month = Number(mStr);
  const day = Number(dStr);
  return new TZDate(year, month - 1, day, 0, 0, 0, 0, MANILA_TIME_ZONE);
}

/** Returns today's `Asia/Manila` date as a `TZDate` at Manila midnight. */
export function manilaTodayDate(clock?: Clock): Date {
  return manilaCalendarDateToDate(manilaToday(clock));
}

/** Returns the Sunday starting the Manila calendar week containing `iso`. */
export function manilaStartOfWeek(iso: CalendarDate): CalendarDate {
  const [yStr, mStr, dStr] = iso.split('-');
  const dow = new Date(Date.UTC(Number(yStr), Number(mStr) - 1, Number(dStr))).getUTCDay();
  return addDays(iso, -dow);
}

/** Formats a Manila calendar date (e.g. "Fri, 12 Dec" or "12 Dec 2026"). */
export function formatManilaCalendarDate(
  iso: CalendarDate,
  options: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' },
): string {
  return formatManila(manilaCalendarDateToDate(iso), options);
}

/** Formats a check-in → check-out stay range in Manila calendar dates. */
export function formatManilaStayRange(checkIn: CalendarDate, checkOut: CalendarDate): string {
  const nights = nightsBetween(checkIn, checkOut);
  const startLabel = formatManilaCalendarDate(checkIn, { day: 'numeric', month: 'short' });
  const endLabel = formatManilaCalendarDate(checkOut, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return `${startLabel} – ${endLabel} · ${nights} ${nights === 1 ? 'night' : 'nights'}`;
}

export interface MidnightCrossingCheck {
  readonly checkInDate: CalendarDate;
  readonly checkOutDate: CalendarDate;
  readonly nights: number;
  readonly crossesMidnight: boolean;
}

/**
 * Evaluates two timestamps strictly in `Asia/Manila`, ensuring bookings or slots that cross
 * midnight Manila time (e.g. 23:59 +08:00 to 00:01 +08:00) map to the exact Manila dates
 * regardless of the device or server timezone.
 */
export function resolveManilaBookingSpan(checkInAt: Date, checkOutAt: Date): MidnightCrossingCheck {
  const checkInDate = toManilaCalendarDate(checkInAt);
  const checkOutDate = toManilaCalendarDate(checkOutAt);
  const nights = Math.max(0, nightsBetween(checkInDate, checkOutDate));
  return {
    checkInDate,
    checkOutDate,
    nights,
    crossesMidnight: checkInDate !== checkOutDate,
  };
}

export interface CheckoutOnlyEvaluation {
  readonly allowed: boolean;
  readonly isCheckoutOnly: boolean;
  readonly nights: number;
  readonly reason: string | null;
}

/**
 * D75 check-out-only day rule in `Asia/Manila`:
 * - A taken night cannot be picked as check-in.
 * - Once check-in is picked, the next taken night CAN be picked as check-out when every night
 *   between check-in (inclusive) and check-out (exclusive) is free.
 * - Minimum and maximum nights are enforced with a plain-English reason string.
 */
export function evaluateCheckoutOnlyCandidate({
  candidate,
  today,
  takenNights,
  checkIn,
  minNights = 1,
  maxNights,
}: {
  readonly candidate: CalendarDate;
  readonly today: CalendarDate;
  readonly takenNights: ReadonlySet<string>;
  readonly checkIn: CalendarDate | null;
  readonly minNights?: number | undefined;
  readonly maxNights?: number | undefined;
}): CheckoutOnlyEvaluation {
  if (candidate < today) {
    return { allowed: false, isCheckoutOnly: false, nights: 0, reason: 'Past dates are closed.' };
  }

  // No check-in chosen yet (or picking a new check-in on/before current check-in)
  if (checkIn === null || candidate <= checkIn) {
    if (takenNights.has(candidate)) {
      return {
        allowed: false,
        isCheckoutOnly: false,
        nights: 0,
        reason: 'That night is already taken.',
      };
    }
    return { allowed: true, isCheckoutOnly: false, nights: 0, reason: null };
  }

  const stayNights = eachNight(checkIn, candidate);
  const nights = stayNights.length;
  const blockedInsideStay = stayNights.some((night) => takenNights.has(night));
  if (blockedInsideStay) {
    return {
      allowed: false,
      isCheckoutOnly: false,
      nights,
      reason: 'Includes a night that is already taken.',
    };
  }

  const isCheckoutOnly = takenNights.has(candidate);
  if (nights < minNights) {
    return {
      allowed: false,
      isCheckoutOnly,
      nights,
      reason: `Minimum stay is ${minNights} ${minNights === 1 ? 'night' : 'nights'}.`,
    };
  }
  if (maxNights !== undefined && nights > maxNights) {
    return {
      allowed: false,
      isCheckoutOnly,
      nights,
      reason: `Maximum stay is ${maxNights} ${maxNights === 1 ? 'night' : 'nights'}.`,
    };
  }

  return { allowed: true, isCheckoutOnly, nights, reason: null };
}
