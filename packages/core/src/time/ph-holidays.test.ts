import { describe, expect, it } from 'vitest';

import { calendarDateSchema } from './index.js';
import { easterSunday, phHolidayChips, phHolidays } from './ph-holidays.js';

const d = (value: string) => calendarDateSchema.parse(value);

describe('phHolidays', () => {
  it('uses Proclamation 1006 for 2026, regular holidays included', () => {
    const year = phHolidays(2026);
    expect(year.proclaimed).toBe(true);
    expect(year.holidays).toContainEqual({
      date: '2026-08-31',
      name: 'National Heroes Day',
      kind: 'regular',
    });
  });

  it('keeps special and additional special days apart', () => {
    const holidays = phHolidays(2027).holidays;
    expect(holidays).toContainEqual({
      date: '2027-08-21',
      name: 'Ninoy Aquino Day',
      kind: 'special',
    });
    expect(holidays).toContainEqual({
      date: '2027-02-06',
      name: 'Chinese New Year',
      kind: 'additional_special',
    });
  });

  it('computes an unproclaimed year from fixed dates and Easter, marked as such', () => {
    const year = phHolidays(2028);
    expect(year.proclaimed).toBe(false);
    // Easter 2028 is 16 April.
    expect(year.holidays).toContainEqual({
      date: '2028-04-13',
      name: 'Maundy Thursday',
      kind: 'regular',
    });
    expect(year.holidays).toContainEqual({
      date: '2028-08-28',
      name: 'National Heroes Day',
      kind: 'regular',
    });
  });
});

describe('easterSunday', () => {
  it('matches the proclaimed Holy Weeks', () => {
    expect(easterSunday(2026)).toBe('2026-04-05');
    expect(easterSunday(2027)).toBe('2027-03-28');
  });
});

describe('phHolidayChips', () => {
  const chips = phHolidayChips(d('2026-11-20'));

  it('covers Holy Week from Wednesday night to Easter Sunday', () => {
    expect(chips.find((chip) => chip.key === 'holy-week-2027')).toMatchObject({
      start: '2027-03-24',
      end: '2027-03-28',
    });
  });

  it('covers Christmas and New Year', () => {
    expect(chips.find((chip) => chip.key === 'christmas-2026')).toMatchObject({
      start: '2026-12-23',
      end: '2026-12-27',
    });
    expect(chips.find((chip) => chip.key === 'new-year-2027')).toMatchObject({
      start: '2026-12-30',
      end: '2027-01-02',
    });
  });

  it('makes long weekends from Friday and Monday holidays', () => {
    // Bonifacio Day 2026 is a Monday: Saturday and Sunday nights.
    expect(chips.find((chip) => chip.key === 'long-2026-11-30')).toMatchObject({
      start: '2026-11-28',
      end: '2026-11-30',
    });
    // Araw ng Kagitingan 2027 is a Friday: Thursday to Saturday nights.
    expect(chips.find((chip) => chip.key === 'long-2027-04-09')).toMatchObject({
      start: '2027-04-08',
      end: '2027-04-11',
    });
  });

  it('leaves out chips that have already passed', () => {
    expect(chips.some((chip) => chip.key === 'holy-week-2026')).toBe(false);
  });
});
