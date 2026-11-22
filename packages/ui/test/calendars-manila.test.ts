import { describe, expect, it } from 'vitest';

import { calendarDate, fixedClock } from '@smartapp/core';

import {
  evaluateCheckoutOnlyCandidate,
  formatManilaStayRange,
  manilaCalendarDateToDate,
  manilaTodayDate,
  resolveManilaBookingSpan,
  toManilaCalendarDate,
} from '../src/lib/manila-calendar';
import { zonedStartOfDay } from '../src/components/reui/event-calendar/event-calendar-lib';

describe('Asia/Manila calendars & D75 check-out-only rule', () => {
  it.each(['UTC', 'America/Los_Angeles', 'Asia/Manila'])(
    'handles a booking that crosses midnight Manila time consistently under TZ=%s',
    (tz) => {
      const prevTz = process.env['TZ'];
      process.env['TZ'] = tz;

      try {
        // 2026-12-10 23:59 +08:00 (still 15:59 UTC / 07:59 LA on Dec 10)
        // -> 2026-12-11 00:01 +08:00 (still 16:01 UTC / 08:01 LA on Dec 10!)
        const lateCheckIn = new Date('2026-12-10T23:59:00+08:00');
        const pastMidnight = new Date('2026-12-11T00:01:00+08:00');

        const span = resolveManilaBookingSpan(lateCheckIn, pastMidnight);
        expect(span.checkInDate).toBe('2026-12-10');
        expect(span.checkOutDate).toBe('2026-12-11');
        expect(span.nights).toBe(1);
        expect(span.crossesMidnight).toBe(true);

        // Typical overnight stay crossing midnight: 10 Dec 23:30 +08:00 -> 11 Dec 12:00 +08:00
        const overnight = resolveManilaBookingSpan(
          new Date('2026-12-10T23:30:00+08:00'),
          new Date('2026-12-11T12:00:00+08:00'),
        );
        expect(overnight.checkInDate).toBe('2026-12-10');
        expect(overnight.checkOutDate).toBe('2026-12-11');
        expect(overnight.nights).toBe(1);
        expect(overnight.crossesMidnight).toBe(true);

        // EventCalendar / Gantt zonedStartOfDay in Asia/Manila places them on different Manila days
        const dayA = toManilaCalendarDate(zonedStartOfDay(lateCheckIn, 'Asia/Manila'));
        const dayB = toManilaCalendarDate(zonedStartOfDay(pastMidnight, 'Asia/Manila'));
        expect(dayA).toBe('2026-12-10');
        expect(dayB).toBe('2026-12-11');

        // manilaTodayDate aligns with the golden Manila clock even across midnight
        const beforeMidnight = manilaTodayDate(fixedClock('2026-12-10T23:59:00+08:00'));
        const afterMidnight = manilaTodayDate(fixedClock('2026-12-11T00:01:00+08:00'));
        expect(toManilaCalendarDate(beforeMidnight)).toBe('2026-12-10');
        expect(toManilaCalendarDate(afterMidnight)).toBe('2026-12-11');
      } finally {
        if (prevTz === undefined) {
          delete process.env['TZ'];
        } else {
          process.env['TZ'] = prevTz;
        }
      }
    },
  );

  it('round-trips Manila calendar dates without day drift', () => {
    const dec15 = calendarDate('2026-12-15');
    const dec18 = calendarDate('2026-12-18');
    expect(toManilaCalendarDate(manilaCalendarDateToDate(dec15))).toBe('2026-12-15');
    expect(formatManilaStayRange(dec15, dec18)).toContain('3 nights');
  });

  it('enforces D75 check-out-only days and min/max night rules', () => {
    const today = calendarDate('2026-12-10');
    const takenNights = new Set<string>(['2026-12-14', '2026-12-15']);

    // Taken night cannot be selected as check-in
    const blockedCheckIn = evaluateCheckoutOnlyCandidate({
      candidate: calendarDate('2026-12-14'),
      today,
      takenNights,
      checkIn: null,
      minNights: 2,
    });
    expect(blockedCheckIn.allowed).toBe(false);
    expect(blockedCheckIn.isCheckoutOnly).toBe(false);

    // Once check-in is Dec 12, Dec 14 (taken night) opens as check-out-only (2 free nights: 12 & 13)
    const allowedCheckoutOnly = evaluateCheckoutOnlyCandidate({
      candidate: calendarDate('2026-12-14'),
      today,
      takenNights,
      checkIn: calendarDate('2026-12-12'),
      minNights: 2,
      maxNights: 5,
    });
    expect(allowedCheckoutOnly).toEqual({
      allowed: true,
      isCheckoutOnly: true,
      nights: 2,
      reason: null,
    });

    // Dec 15 cannot be check-out because night of Dec 14 is taken
    const blockedAcrossTaken = evaluateCheckoutOnlyCandidate({
      candidate: calendarDate('2026-12-15'),
      today,
      takenNights,
      checkIn: calendarDate('2026-12-12'),
      minNights: 2,
    });
    expect(blockedAcrossTaken.allowed).toBe(false);
    expect(blockedAcrossTaken.reason).toContain('already taken');

    // Minimum night violation returns a plain-English reason
    const tooShort = evaluateCheckoutOnlyCandidate({
      candidate: calendarDate('2026-12-13'),
      today,
      takenNights,
      checkIn: calendarDate('2026-12-12'),
      minNights: 2,
    });
    expect(tooShort.allowed).toBe(false);
    expect(tooShort.reason).toBe('Minimum stay is 2 nights.');

    // Maximum night violation returns a plain-English reason
    const tooLong = evaluateCheckoutOnlyCandidate({
      candidate: calendarDate('2026-12-23'),
      today,
      takenNights,
      checkIn: calendarDate('2026-12-16'),
      minNights: 1,
      maxNights: 5,
    });
    expect(tooLong.allowed).toBe(false);
    expect(tooLong.reason).toBe('Maximum stay is 5 nights.');
  });
});
