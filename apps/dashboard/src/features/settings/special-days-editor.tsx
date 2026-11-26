import { useId, useState } from 'react';
import {
  CalendarClockIcon,
  CalendarPlusIcon,
  CalendarXIcon,
  FlagIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react';
import {
  addDays,
  calendarDateSchema,
  formatWallTime12h,
  nightsBetween,
  upcomingPhHolidays,
  type CalendarDate,
  type SpecialDayKind,
  type SpecialDayScope,
} from '@smartapp/core';
import { Button } from '@smartapp/ui/components/button';
import { Calendar } from '@smartapp/ui/components/calendar';
import { Checkbox } from '@smartapp/ui/components/checkbox';
import { Field, FieldDescription, FieldError, FieldLabel } from '@smartapp/ui/components/field';
import { Input } from '@smartapp/ui/components/input';
import { AppSheet } from '@smartapp/ui/compositions/app-sheet';
import { RowButton, RowGroup } from '@smartapp/ui/compositions/grouped-rows';
import { SegmentedControl } from '@smartapp/ui/compositions/segmented-control';
import { TimeSelect } from '@smartapp/ui/compositions/time-select';
import { notify } from '@smartapp/ui/lib/notify';

const MAX_DAYS = 60;
const MAX_SPAN = 31;
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export interface SpecialDayDraft {
  readonly starts_on: CalendarDate;
  readonly ends_on: CalendarDate;
  readonly kind: SpecialDayKind;
  readonly ranges: readonly { readonly start: string; readonly end: string }[];
  readonly applies_to: SpecialDayScope;
  readonly reason: string | null;
}

const SCOPE_LABEL: Record<SpecialDayScope, string> = {
  replies: 'Replies',
  viewings: 'Viewings',
  both: 'Replies and viewings',
};

const utc = (date: CalendarDate) => new Date(`${date}T00:00:00Z`);
function toLocalDate(date: CalendarDate): Date {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}
function fromLocalDate(date: Date): CalendarDate {
  const pad = (value: number) => String(value).padStart(2, '0');
  return calendarDateSchema.parse(
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
  );
}
function dayText(date: CalendarDate, withMonth = true): string {
  const d = utc(date);
  const base = `${WEEKDAYS[d.getUTCDay()] ?? ''}, ${d.getUTCDate()}`;
  return withMonth ? `${base} ${MONTHS[d.getUTCMonth()] ?? ''}` : base;
}
/** "Fri, 12 Dec" or "Wed, 24 – Fri, 26 Dec" */
export function dateRangeText(from: CalendarDate, to: CalendarDate): string {
  if (from === to) return dayText(from);
  const sameMonth = from.slice(0, 7) === to.slice(0, 7);
  return `${dayText(from, !sameMonth)} – ${dayText(to)}`;
}
const time = (value: string) => formatWallTime12h(value) ?? value;

/** "Closed" or "9:00 AM–12:00 PM", then who it is for and the reason. */
export function specialDaySummary(day: SpecialDayDraft): string {
  const hours =
    day.kind === 'closed'
      ? 'Closed'
      : day.ranges.map((range) => `${time(range.start)}–${time(range.end)}`).join(', ');
  return [hours, SCOPE_LABEL[day.applies_to], day.reason].filter(Boolean).join(' · ');
}

const NEW_DAY = (today: CalendarDate): SpecialDayDraft => ({
  starts_on: today,
  ends_on: today,
  kind: 'closed',
  ranges: [],
  applies_to: 'both',
  reason: null,
});

/**
 * Special days (R-2b, D95, verdict 4): a day or a range that is closed all day or open at
 * different hours, for replies, viewings or both, with an optional reason. "Add PH holidays" adds
 * the year's holidays in one tap. Up to 60; past days drop off when saved. They don't stop
 * bookings: blocking dates is a Calendar job (Phase 6).
 */
export function SpecialDaysEditor({
  days,
  today,
  onChange,
}: {
  readonly days: readonly SpecialDayDraft[];
  readonly today: CalendarDate;
  readonly onChange: (next: SpecialDayDraft[]) => void;
}) {
  const ids = useId();
  const upcoming = days.filter((day) => day.ends_on >= today);
  const [editing, setEditing] = useState<{ index: number | null; day: SpecialDayDraft } | null>(
    null,
  );
  const [editError, setEditError] = useState<string | null>(null);
  const [holidaysOpen, setHolidaysOpen] = useState(false);
  const covered = (date: CalendarDate) =>
    upcoming.some((day) => day.starts_on <= date && date <= day.ends_on);
  const holidays = upcomingPhHolidays(today).filter((holiday) => !covered(holiday.date));
  const [picked, setPicked] = useState<ReadonlySet<string>>(new Set());
  const room = MAX_DAYS - upcoming.length;

  const sorted = (list: SpecialDayDraft[]) =>
    [...list].sort((a, b) => a.starts_on.localeCompare(b.starts_on));

  function openNew() {
    if (room <= 0) {
      notify.error(`You have ${MAX_DAYS} special days, the most we keep. Remove one first.`);
      return;
    }
    setEditing({ index: null, day: NEW_DAY(today) });
    setEditError(null);
  }

  function saveEdit() {
    if (!editing) return;
    const { day, index } = editing;
    if (nightsBetween(day.starts_on, day.ends_on) + 1 > MAX_SPAN) {
      setEditError(`Pick up to ${MAX_SPAN} days at a time.`);
      return;
    }
    if (day.kind === 'hours' && day.ranges.some((range) => range.end <= range.start)) {
      setEditError('Each time must end after it starts.');
      return;
    }
    const clean: SpecialDayDraft = {
      ...day,
      ranges: day.kind === 'closed' ? [] : day.ranges,
      reason: day.reason?.trim() ? day.reason.trim().slice(0, 80) : null,
    };
    const next =
      index === null
        ? [...upcoming, clean]
        : upcoming.map((item, i) => (i === index ? clean : item));
    onChange(sorted(next));
    setEditing(null);
  }

  function remove(index: number) {
    const before = [...upcoming];
    const gone = upcoming[index];
    onChange(upcoming.filter((_, i) => i !== index));
    if (gone) {
      notify.success(`${dateRangeText(gone.starts_on, gone.ends_on)} removed`, {
        onUndo: () => onChange(before),
      });
    }
    setEditing(null);
  }

  function addHolidays() {
    const chosen = holidays.filter((holiday) => picked.has(holiday.date)).slice(0, room);
    const added: SpecialDayDraft[] = chosen.map((holiday) => ({
      starts_on: holiday.date,
      ends_on: holiday.date,
      kind: 'closed',
      ranges: [],
      applies_to: 'both',
      reason: holiday.name.slice(0, 80),
    }));
    onChange(sorted([...upcoming, ...added]));
    setHolidaysOpen(false);
    if (added.length > 0) {
      notify.success(`${added.length} ${added.length === 1 ? 'holiday' : 'holidays'} added`);
    }
  }

  const day = editing?.day;
  const setDay = (change: Partial<SpecialDayDraft>) => {
    setEditing((current) =>
      current ? { ...current, day: { ...current.day, ...change } } : current,
    );
    setEditError(null);
  };

  return (
    <>
      <RowGroup
        title="Special days"
        footer="Holidays, events or days off. Guests see them under Times. They don't stop bookings."
      >
        {upcoming.map((item, index) => (
          <div
            key={`${item.starts_on}-${index}`}
            className="flex min-h-13 items-center gap-3 py-1.5 pr-1.5 pl-4"
          >
            {item.kind === 'closed' ? (
              <CalendarXIcon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
            ) : (
              <CalendarClockIcon
                aria-hidden="true"
                className="size-4 shrink-0 text-muted-foreground"
              />
            )}
            <button
              type="button"
              className="press min-w-0 flex-1 rounded-md py-1 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              onClick={() => {
                setEditing({ index, day: item });
                setEditError(null);
              }}
            >
              <span className="block font-medium tabular">
                {dateRangeText(item.starts_on, item.ends_on)}
              </span>
              <span className="block text-sm text-muted-foreground tabular">
                {specialDaySummary(item)}
              </span>
            </button>
            <Button
              variant="ghost"
              size="icon"
              className="size-11 shrink-0 pointer-fine:size-9"
              aria-label={`Remove ${dateRangeText(item.starts_on, item.ends_on)}`}
              onClick={() => remove(index)}
            >
              <Trash2Icon aria-hidden="true" />
            </Button>
          </div>
        ))}
        <RowButton
          label="Add a special day"
          icon={<CalendarPlusIcon className="text-primary-hover" />}
          onClick={openNew}
        />
        <RowButton
          label="Add PH holidays"
          hint={
            holidays.length === 0
              ? 'Every holiday this coming year is already on your list.'
              : `${holidays.length} holidays in the next 12 months`
          }
          icon={<FlagIcon className="text-primary-hover" />}
          onClick={() => {
            if (holidays.length === 0) return;
            setPicked(new Set(holidays.map((holiday) => holiday.date)));
            setHolidaysOpen(true);
          }}
        />
      </RowGroup>
      {upcoming.length >= 3 ? (
        <Button
          variant="ghost"
          className="-mt-3 min-h-11 self-start text-muted-foreground"
          onClick={() => {
            const before = [...upcoming];
            onChange([]);
            notify.success(`${before.length} special days removed`, {
              onUndo: () => onChange(before),
            });
          }}
        >
          <Trash2Icon aria-hidden="true" />
          Remove all special days
        </Button>
      ) : null}

      <AppSheet
        open={editing !== null}
        onOpenChange={(open) => (open ? undefined : setEditing(null))}
        size="sm"
        title={editing?.index === null ? 'Add a special day' : 'Edit special day'}
        footer={
          <>
            {editing && editing.index !== null ? (
              <Button
                variant="outline"
                className="min-h-11 sm:mr-auto"
                onClick={() => editing.index !== null && remove(editing.index)}
              >
                <Trash2Icon aria-hidden="true" />
                Remove
              </Button>
            ) : (
              <Button
                data-sheet-cancel=""
                variant="outline"
                className="min-h-11"
                onClick={() => setEditing(null)}
              >
                Cancel
              </Button>
            )}
            <Button className="min-h-11" onClick={saveEdit}>
              Done
            </Button>
          </>
        }
      >
        {day ? (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Calendar
                mode="range"
                className="mx-auto rounded-lg border border-border"
                disabled={{ before: toLocalDate(today) }}
                defaultMonth={toLocalDate(day.starts_on)}
                selected={{ from: toLocalDate(day.starts_on), to: toLocalDate(day.ends_on) }}
                onSelect={(next) => {
                  if (!next?.from) return;
                  const from = fromLocalDate(next.from);
                  setDay({ starts_on: from, ends_on: next.to ? fromLocalDate(next.to) : from });
                }}
              />
              <p className="text-sm text-muted-foreground tabular" aria-live="polite">
                {dateRangeText(day.starts_on, day.ends_on)} ·{' '}
                {nightsBetween(day.starts_on, addDays(day.ends_on, 1))}{' '}
                {day.starts_on === day.ends_on ? 'day' : 'days'}
              </p>
            </div>

            <Field>
              <FieldLabel id={`${ids}-kind`}>On these days</FieldLabel>
              <SegmentedControl
                aria-labelledby={`${ids}-kind`}
                value={day.kind}
                onValueChange={(kind) =>
                  setDay({
                    kind,
                    ranges:
                      kind === 'hours' && day.ranges.length === 0
                        ? [{ start: '09:00', end: '12:00' }]
                        : day.ranges,
                  })
                }
                options={[
                  { value: 'closed', label: 'Closed all day' },
                  { value: 'hours', label: 'Different hours' },
                ]}
              />
            </Field>

            {day.kind === 'hours' ? (
              <div className="flex flex-col gap-2">
                {day.ranges.map((range, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <TimeSelect
                      aria-label={`From, time ${index + 1}`}
                      className="flex-1"
                      value={range.start}
                      onValueChange={(start) =>
                        setDay({
                          ranges: day.ranges.map((item, i) =>
                            i === index ? { ...item, start } : item,
                          ),
                        })
                      }
                    />
                    <span aria-hidden="true">–</span>
                    <TimeSelect
                      aria-label={`Until, time ${index + 1}`}
                      className="flex-1"
                      value={range.end}
                      onValueChange={(end) =>
                        setDay({
                          ranges: day.ranges.map((item, i) =>
                            i === index ? { ...item, end } : item,
                          ),
                        })
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-11 shrink-0 pointer-fine:size-9"
                      aria-label={`Remove time ${index + 1}`}
                      disabled={day.ranges.length === 1}
                      onClick={() => setDay({ ranges: day.ranges.filter((_, i) => i !== index) })}
                    >
                      <Trash2Icon aria-hidden="true" />
                    </Button>
                  </div>
                ))}
                {day.ranges.length < 3 ? (
                  <Button
                    variant="outline"
                    className="min-h-11 self-start"
                    onClick={() =>
                      setDay({ ranges: [...day.ranges, { start: '13:00', end: '17:00' }] })
                    }
                  >
                    <PlusIcon aria-hidden="true" />
                    Add a time
                  </Button>
                ) : null}
              </div>
            ) : null}

            <Field>
              <FieldLabel id={`${ids}-scope`}>For</FieldLabel>
              <SegmentedControl
                aria-labelledby={`${ids}-scope`}
                value={day.applies_to}
                onValueChange={(applies_to) => setDay({ applies_to })}
                options={[
                  { value: 'both', label: 'Both' },
                  { value: 'replies', label: 'Replies' },
                  { value: 'viewings', label: 'Viewings' },
                ]}
              />
            </Field>

            <Field data-invalid={editError ? true : undefined}>
              <FieldLabel htmlFor={`${ids}-reason`}>Reason (optional)</FieldLabel>
              <Input
                id={`${ids}-reason`}
                maxLength={80}
                placeholder="Christmas, family event, repairs"
                value={day.reason ?? ''}
                onChange={(event) => setDay({ reason: event.target.value })}
              />
              <FieldDescription>Guests see it next to the date.</FieldDescription>
              <FieldError>{editError}</FieldError>
            </Field>
          </div>
        ) : null}
      </AppSheet>

      <AppSheet
        open={holidaysOpen}
        onOpenChange={setHolidaysOpen}
        size="sm"
        title="Add PH holidays"
        description="Closed for replies and viewings on each. You can change any of them after."
        footer={
          <>
            <Button
              data-sheet-cancel=""
              variant="outline"
              className="min-h-11"
              onClick={() => setHolidaysOpen(false)}
            >
              Cancel
            </Button>
            <Button className="min-h-11" disabled={picked.size === 0} onClick={addHolidays}>
              {picked.size === 1 ? 'Add 1 holiday' : `Add ${picked.size} holidays`}
            </Button>
          </>
        }
      >
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {holidays.map((holiday) => {
            const id = `${ids}-h-${holiday.date}`;
            return (
              <li key={holiday.date}>
                <label
                  htmlFor={id}
                  className="flex min-h-13 cursor-pointer items-center gap-3 px-4 py-2"
                >
                  <Checkbox
                    id={id}
                    checked={picked.has(holiday.date)}
                    onCheckedChange={(on) =>
                      setPicked((current) => {
                        const next = new Set(current);
                        if (on) next.add(holiday.date);
                        else next.delete(holiday.date);
                        return next;
                      })
                    }
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{holiday.name}</span>
                    <span className="block text-sm text-muted-foreground tabular">
                      {dayText(holiday.date)} {holiday.date.slice(0, 4)}
                      {holiday.proclaimed ? '' : ' · until proclaimed'}
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
        {room < holidays.length ? (
          <p className="mt-3 text-sm text-muted-foreground">
            You have room for {room} more special days.
          </p>
        ) : null}
      </AppSheet>
    </>
  );
}
