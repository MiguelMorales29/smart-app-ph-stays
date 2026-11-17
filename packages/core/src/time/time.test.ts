import { describe, expect, it } from 'vitest';

import {
  MANILA_TIME_ZONE,
  MANILA_UTC_OFFSET,
  addDays,
  calendarDate,
  calendarDateSchema,
  eachNight,
  fixedClock,
  formatManila,
  manilaToday,
  manilaWallTime,
  nightsBetween,
  systemClock,
  weekdayOf,
} from './index.js';

describe('time', () => {
  describe('constants', () => {
    it('exports Asia/Manila timezone and +08:00 offset', () => {
      expect(MANILA_TIME_ZONE).toBe('Asia/Manila');
      expect(MANILA_UTC_OFFSET).toBe('+08:00');
    });
  });

  describe('calendarDateSchema and calendarDate', () => {
    it('accepts valid YYYY-MM-DD dates including leap day', () => {
      expect(calendarDateSchema.parse('2026-12-10')).toBe('2026-12-10');
      expect(calendarDate('2028-02-29')).toBe('2028-02-29');
    });

    it('rejects malformed or impossible dates', () => {
      expect(calendarDateSchema.safeParse('2026-2-5').success).toBe(false);
      expect(calendarDateSchema.safeParse('2026-02-29').success).toBe(false);
      expect(calendarDateSchema.safeParse('2026-04-31').success).toBe(false);
      expect(calendarDateSchema.safeParse('2026-13-01').success).toBe(false);
      expect(calendarDateSchema.safeParse('2026-12-10T10:00:00Z').success).toBe(false);
    });
  });

  describe('clocks', () => {
    it('systemClock returns a valid Date', () => {
      expect(Number.isNaN(systemClock.now().getTime())).toBe(false);
    });

    it('fixedClock returns a fresh Date at the fixed instant and rejects invalid ISO', () => {
      const clock = fixedClock('2026-12-10T10:00:00+08:00');
      const first = clock.now();
      first.setUTCFullYear(2000);
      expect(clock.now().toISOString()).toBe('2026-12-10T02:00:00.000Z');
      expect(() => fixedClock('not-a-date')).toThrow(RangeError);
    });
  });

  describe('manilaToday', () => {
    it('returns the Manila date for the golden clock', () => {
      const golden = fixedClock('2026-12-10T10:00:00+08:00');
      expect(manilaToday(golden)).toBe('2026-12-10');
    });

    it.each(['UTC', 'America/Los_Angeles', 'Pacific/Kiritimati', 'Asia/Manila'])(
      'is right at 23:59 and 00:01 Manila time when process.env.TZ is %s',
      (tz) => {
        const previousTz = process.env.TZ;
        process.env.TZ = tz;

        try {
          const beforeMidnight = fixedClock('2026-12-10T23:59:00+08:00');
          const afterMidnight = fixedClock('2026-12-11T00:01:00+08:00');

          expect(manilaToday(beforeMidnight)).toBe('2026-12-10');
          expect(manilaToday(afterMidnight)).toBe('2026-12-11');
        } finally {
          if (previousTz === undefined) {
            delete process.env.TZ;
          } else {
            process.env.TZ = previousTz;
          }
        }
      },
    );
  });

  describe('addDays', () => {
    it('adds and subtracts days across month and year boundaries', () => {
      expect(addDays(calendarDate('2026-12-30'), 3)).toBe('2027-01-02');
      expect(addDays(calendarDate('2028-02-28'), 1)).toBe('2028-02-29');
      expect(addDays(calendarDate('2026-03-01'), -1)).toBe('2026-02-28');
    });

    it('rejects non-integer day offsets', () => {
      expect(() => addDays(calendarDate('2026-12-10'), 1.5)).toThrow(RangeError);
    });
  });

  describe('nightsBetween and eachNight', () => {
    it('computes exact night counts and lists each night from checkIn up to checkOut', () => {
      const checkIn = calendarDate('2026-12-10');
      const checkOut = calendarDate('2026-12-13');

      expect(nightsBetween(checkIn, checkOut)).toBe(3);
      expect(nightsBetween(checkIn, checkIn)).toBe(0);
      expect(nightsBetween(checkOut, checkIn)).toBe(-3);

      expect(eachNight(checkIn, checkOut)).toEqual(['2026-12-10', '2026-12-11', '2026-12-12']);
      expect(eachNight(checkIn, checkIn)).toEqual([]);
      expect(eachNight(checkOut, checkIn)).toEqual([]);
    });
  });

  describe('weekdayOf', () => {
    it('returns 0 for Sunday through 6 for Saturday', () => {
      expect(weekdayOf(calendarDate('2026-12-06'))).toBe(0); // Sunday
      expect(weekdayOf(calendarDate('2026-12-07'))).toBe(1); // Monday
      expect(weekdayOf(calendarDate('2026-12-10'))).toBe(4); // Thursday
      expect(weekdayOf(calendarDate('2026-12-12'))).toBe(6); // Saturday
    });
  });

  describe('manilaWallTime', () => {
    it('returns a Date at +08:00 for HH:MM and HH:MM:SS', () => {
      const checkIn = manilaWallTime(calendarDate('2026-12-10'), '14:00');
      expect(checkIn.toISOString()).toBe('2026-12-10T06:00:00.000Z');

      const exact = manilaWallTime(calendarDate('2026-12-10'), '00:05:30');
      expect(exact.toISOString()).toBe('2026-12-09T16:05:30.000Z');
    });

    it('rejects malformed or out-of-range wall times', () => {
      expect(() => manilaWallTime(calendarDate('2026-12-10'), '24:00')).toThrow(RangeError);
      expect(() => manilaWallTime(calendarDate('2026-12-10'), '14:60')).toThrow(RangeError);
      expect(() => manilaWallTime(calendarDate('2026-12-10'), '2:00')).toThrow(RangeError);
    });
  });

  describe('formatManila', () => {
    it('formats instants in Manila time regardless of host timezone', () => {
      const instant = new Date('2026-12-10T16:30:00.000Z'); // 2026-12-11 00:30 Manila
      const formatted = formatManila(instant, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      expect(formatted).toContain('12');
      expect(formatted).toContain('11');
      expect(formatted).toContain('2026');
      expect(formatted).toContain('00:30');
    });

    it('uses default options when none are provided and rejects invalid Dates', () => {
      const instant = manilaWallTime(calendarDate('2026-12-10'), '14:00');
      const formatted = formatManila(instant);
      expect(formatted).toContain('2026');
      expect(formatted).toContain('10');
      expect(() => formatManila(new Date('invalid'))).toThrow(RangeError);
    });
  });
});
