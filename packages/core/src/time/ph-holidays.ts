// Philippine national holidays for the price editor's "Special dates" chips (P4-6, D50).
//
// Sources:
// - 2026: Proclamation No. 1006, s. 2025 (signed 3 September 2025).
// - 2027: Proclamation No. 1427, s. 2026 (signed 8 September 2026).
// Eid'l Fitr and Eid'l Adha are proclaimed separately each year and are not listed here.
// For a year with no proclamation yet, `phHolidays` returns the fixed-date holidays plus Holy
// Week computed from Easter, marked `proclaimed: false` ("until proclaimed").

import {
  addDays,
  calendarDateSchema,
  nightsBetween,
  weekdayOf,
  type CalendarDate,
} from './index.js';

export type PhHolidayKind = 'regular' | 'special' | 'additional_special';

export interface PhHoliday {
  readonly date: CalendarDate;
  readonly name: string;
  readonly kind: PhHolidayKind;
}

export interface PhHolidayYear {
  readonly year: number;
  /** False when the dates are computed because the proclamation is not out yet. */
  readonly proclaimed: boolean;
  readonly source: string;
  readonly holidays: readonly PhHoliday[];
}

const d = (value: string) => calendarDateSchema.parse(value);

function list(rows: readonly (readonly [string, string, PhHolidayKind])[]): PhHoliday[] {
  return rows.map(([date, name, kind]) => ({ date: d(date), name, kind }));
}

/** Proclamation No. 1006, s. 2025. */
const Y2026: PhHolidayYear = {
  year: 2026,
  proclaimed: true,
  source: 'Proclamation No. 1006, s. 2025',
  holidays: list([
    ['2026-01-01', "New Year's Day", 'regular'],
    ['2026-02-17', 'Chinese New Year', 'additional_special'],
    ['2026-04-02', 'Maundy Thursday', 'regular'],
    ['2026-04-03', 'Good Friday', 'regular'],
    ['2026-04-04', 'Black Saturday', 'additional_special'],
    ['2026-04-09', 'Araw ng Kagitingan', 'regular'],
    ['2026-05-01', 'Labor Day', 'regular'],
    ['2026-06-12', 'Independence Day', 'regular'],
    ['2026-08-21', 'Ninoy Aquino Day', 'special'],
    ['2026-08-31', 'National Heroes Day', 'regular'],
    ['2026-11-01', "All Saints' Day", 'special'],
    ['2026-11-02', "All Souls' Day", 'additional_special'],
    ['2026-11-30', 'Bonifacio Day', 'regular'],
    ['2026-12-08', 'Feast of the Immaculate Conception of Mary', 'special'],
    ['2026-12-24', 'Christmas Eve', 'additional_special'],
    ['2026-12-25', 'Christmas Day', 'regular'],
    ['2026-12-30', 'Rizal Day', 'regular'],
    ['2026-12-31', 'Last Day of the Year', 'special'],
  ]),
};

/** Proclamation No. 1427, s. 2026. */
const Y2027: PhHolidayYear = {
  year: 2027,
  proclaimed: true,
  source: 'Proclamation No. 1427, s. 2026',
  holidays: list([
    ['2027-01-01', "New Year's Day", 'regular'],
    ['2027-02-06', 'Chinese New Year', 'additional_special'],
    ['2027-03-25', 'Maundy Thursday', 'regular'],
    ['2027-03-26', 'Good Friday', 'regular'],
    ['2027-03-27', 'Black Saturday', 'additional_special'],
    ['2027-04-09', 'Araw ng Kagitingan', 'regular'],
    ['2027-05-01', 'Labor Day', 'regular'],
    ['2027-06-12', 'Independence Day', 'regular'],
    ['2027-08-21', 'Ninoy Aquino Day', 'special'],
    ['2027-08-30', 'National Heroes Day', 'regular'],
    ['2027-11-01', "All Saints' Day", 'special'],
    ['2027-11-02', "All Souls' Day", 'additional_special'],
    ['2027-11-30', 'Bonifacio Day', 'regular'],
    ['2027-12-08', 'Feast of the Immaculate Conception of Mary', 'special'],
    ['2027-12-24', 'Christmas Eve', 'additional_special'],
    ['2027-12-25', 'Christmas Day', 'regular'],
    ['2027-12-30', 'Rizal Day', 'regular'],
    ['2027-12-31', 'Last Day of the Year', 'special'],
  ]),
};

const PROCLAIMED: ReadonlyMap<number, PhHolidayYear> = new Map([
  [2026, Y2026],
  [2027, Y2027],
]);

const pad = (value: number) => String(value).padStart(2, '0');

/** Easter Sunday (Gregorian, anonymous algorithm). */
export function easterSunday(year: number): CalendarDate {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const dd = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - dd - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return d(`${year}-${pad(month)}-${pad(day)}`);
}

/** Last Monday of August (National Heroes Day). */
function lastMondayOfAugust(year: number): CalendarDate {
  let date = d(`${year}-08-31`);
  while (weekdayOf(date) !== 1) date = addDays(date, -1);
  return date;
}

function computedYear(year: number): PhHolidayYear {
  const easter = easterSunday(year);
  return {
    year,
    proclaimed: false,
    source: 'Until proclaimed: fixed dates and Holy Week from Easter',
    holidays: [
      ...list([
        [`${year}-01-01`, "New Year's Day", 'regular'],
        [`${year}-04-09`, 'Araw ng Kagitingan', 'regular'],
        [`${year}-05-01`, 'Labor Day', 'regular'],
        [`${year}-06-12`, 'Independence Day', 'regular'],
        [`${year}-08-21`, 'Ninoy Aquino Day', 'special'],
        [`${year}-11-01`, "All Saints' Day", 'special'],
        [`${year}-11-30`, 'Bonifacio Day', 'regular'],
        [`${year}-12-08`, 'Feast of the Immaculate Conception of Mary', 'special'],
        [`${year}-12-25`, 'Christmas Day', 'regular'],
        [`${year}-12-30`, 'Rizal Day', 'regular'],
        [`${year}-12-31`, 'Last Day of the Year', 'special'],
      ]),
      {
        date: lastMondayOfAugust(year),
        name: 'National Heroes Day',
        kind: 'regular',
      } satisfies PhHoliday,
      { date: addDays(easter, -3), name: 'Maundy Thursday', kind: 'regular' } satisfies PhHoliday,
      { date: addDays(easter, -2), name: 'Good Friday', kind: 'regular' } satisfies PhHoliday,
    ].sort((x, y) => x.date.localeCompare(y.date)),
  };
}

/** The holidays of one year: proclaimed when known, otherwise computed and marked. */
export function phHolidays(year: number): PhHolidayYear {
  return PROCLAIMED.get(year) ?? computedYear(year);
}

export interface HolidayChip {
  readonly key: string;
  /** "Holy Week 2027", "Christmas 2026", "Long weekend · Araw ng Kagitingan". */
  readonly label: string;
  /** Nights from `start` up to (not including) `end`, the check-out day. */
  readonly start: CalendarDate;
  readonly end: CalendarDate;
  readonly proclaimed: boolean;
}

const COVERED = new Set([
  'Maundy Thursday',
  'Good Friday',
  'Black Saturday',
  'Christmas Eve',
  'Christmas Day',
  'Rizal Day',
  'Last Day of the Year',
  "New Year's Day",
]);

/**
 * Chips that fill in a date range: Holy Week, Christmas, New Year and long weekends (a holiday on
 * a Friday or a Monday). Only chips whose last night is on or after `from` are returned, for the
 * next `years` years.
 */
export function phHolidayChips(from: CalendarDate, years = 2): HolidayChip[] {
  const firstYear = Number(from.slice(0, 4));
  const chips: HolidayChip[] = [];
  for (let year = firstYear; year < firstYear + years; year += 1) {
    const info = phHolidays(year);
    const easter = easterSunday(year);
    chips.push({
      key: `holy-week-${year}`,
      label: `Holy Week ${year}`,
      start: addDays(easter, -4),
      end: easter,
      proclaimed: info.proclaimed,
    });
    chips.push({
      key: `christmas-${year}`,
      label: `Christmas ${year}`,
      start: d(`${year}-12-23`),
      end: d(`${year}-12-27`),
      proclaimed: info.proclaimed,
    });
    chips.push({
      key: `new-year-${year + 1}`,
      label: `New Year ${year + 1}`,
      start: d(`${year}-12-30`),
      end: d(`${year + 1}-01-02`),
      proclaimed: info.proclaimed,
    });
    for (const holiday of info.holidays) {
      if (COVERED.has(holiday.name)) continue;
      const weekday = weekdayOf(holiday.date);
      if (weekday === 5) {
        chips.push({
          key: `long-${holiday.date}`,
          label: `Long weekend · ${holiday.name}`,
          start: addDays(holiday.date, -1),
          end: addDays(holiday.date, 2),
          proclaimed: info.proclaimed,
        });
      } else if (weekday === 1) {
        chips.push({
          key: `long-${holiday.date}`,
          label: `Long weekend · ${holiday.name}`,
          start: addDays(holiday.date, -2),
          end: holiday.date,
          proclaimed: info.proclaimed,
        });
      }
    }
  }
  return chips
    .filter((chip) => nightsBetween(from, chip.end) > 0)
    .sort((x, y) => x.start.localeCompare(y.start));
}
