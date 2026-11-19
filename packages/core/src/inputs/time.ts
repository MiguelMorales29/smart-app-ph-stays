export const HALF_HOUR_TIMES = [
  '00:00',
  '00:30',
  '01:00',
  '01:30',
  '02:00',
  '02:30',
  '03:00',
  '03:30',
  '04:00',
  '04:30',
  '05:00',
  '05:30',
  '06:00',
  '06:30',
  '07:00',
  '07:30',
  '08:00',
  '08:30',
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '12:30',
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
  '17:30',
  '18:00',
  '18:30',
  '19:00',
  '19:30',
  '20:00',
  '20:30',
  '21:00',
  '21:30',
  '22:00',
  '22:30',
  '23:00',
  '23:30',
] as const;

export type HalfHourTime = (typeof HALF_HOUR_TIMES)[number];

const halfHourSet: ReadonlySet<string> = new Set(HALF_HOUR_TIMES);

export function isHalfHourTime(value: string): value is HalfHourTime {
  return halfHourSet.has(value);
}

const WALL_TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/;
const TWELVE_HOUR_RE = /^(1[0-2]|0?[1-9]):([0-5]\d)\s*(AM|PM)$/i;

/**
 * Formats a 24-hour wall time (`14:00` or `14:00:00`) as 12-hour Philippine display time (`2:00 PM`).
 */
export function formatWallTime12h(wallTime: string): string | null {
  const match = WALL_TIME_RE.exec(wallTime.trim());
  if (!match) return null;
  const hour24 = Number(match[1]);
  const minute = match[2];
  if (minute === undefined) return null;
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${minute} ${period}`;
}

/**
 * Parses `2:00 PM` (or `14:00`) into stored `HH:MM` format (`14:00`),
 * restricting to 30-minute increments when `requireHalfHour` is true (default).
 */
export function parseWallTime12h(raw: string, requireHalfHour = true): string | null {
  const trimmed = raw.trim();
  const match24 = WALL_TIME_RE.exec(trimmed);
  if (match24) {
    const normalized = `${match24[1]}:${match24[2]}`;
    if (requireHalfHour && !isHalfHourTime(normalized)) return null;
    return normalized;
  }

  const match12 = TWELVE_HOUR_RE.exec(trimmed);
  if (!match12) return null;
  const rawHour = Number(match12[1]);
  const minute = match12[2];
  const period = match12[3]?.toUpperCase();
  if (minute === undefined || period === undefined) return null;

  let hour24 = rawHour % 12;
  if (period === 'PM') hour24 += 12;
  const normalized = `${String(hour24).padStart(2, '0')}:${minute}`;
  if (requireHalfHour && !isHalfHourTime(normalized)) return null;
  return normalized;
}

export interface HalfHourTimeOption {
  readonly value: HalfHourTime;
  readonly label: string;
}

export const HALF_HOUR_TIME_OPTIONS: readonly HalfHourTimeOption[] = HALF_HOUR_TIMES.map(
  (value) => ({
    value,
    label: formatWallTime12h(value) ?? value,
  }),
);
