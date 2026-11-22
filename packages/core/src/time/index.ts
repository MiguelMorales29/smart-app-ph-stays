import { z } from 'zod';

import {
  MANILA_TIME_ZONE,
  MANILA_UTC_OFFSET,
  addDays,
  eachNight,
  fixedClock,
  formatManila,
  isCalendarDate,
  manilaToday,
  manilaWallTime,
  nightsBetween,
  parseCalendarDateParts,
  systemClock,
  weekdayOf,
  type Clock,
  type Weekday,
} from './runtime.js';

export {
  MANILA_TIME_ZONE,
  MANILA_UTC_OFFSET,
  addDays,
  eachNight,
  fixedClock,
  formatManila,
  isCalendarDate,
  manilaToday,
  manilaWallTime,
  nightsBetween,
  systemClock,
  weekdayOf,
  type Clock,
  type Weekday,
};

export const calendarDateSchema = z
  .string()
  .refine((value) => parseCalendarDateParts(value) !== null, {
    message: 'Expected a valid calendar date in YYYY-MM-DD format.',
  })
  .brand<'CalendarDate'>();

export type CalendarDate = z.infer<typeof calendarDateSchema>;

export function calendarDate(value: string): CalendarDate {
  return calendarDateSchema.parse(value);
}
