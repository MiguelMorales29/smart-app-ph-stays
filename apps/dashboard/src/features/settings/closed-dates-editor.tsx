import { useState } from 'react';
import { CalendarPlusIcon, CalendarXIcon, Trash2Icon } from 'lucide-react';
import {
  addDays,
  calendarDateSchema,
  eachNight,
  isCalendarDate,
  type CalendarDate,
} from '@smartapp/core';
import { Button } from '@smartapp/ui/components/button';
import { Calendar } from '@smartapp/ui/components/calendar';
import { AppSheet } from '@smartapp/ui/compositions/app-sheet';
import { RowButton, RowGroup } from '@smartapp/ui/compositions/grouped-rows';
import { notify } from '@smartapp/ui/lib/notify';

const MAX_DATES = 60;
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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
/** "Fri, 12 Dec" */
function dayText(date: CalendarDate, withMonth = true): string {
  const d = utc(date);
  const base = `${WEEKDAYS[d.getUTCDay()] ?? ''}, ${d.getUTCDate()}`;
  return withMonth ? `${base} ${MONTHS[d.getUTCMonth()] ?? ''}` : base;
}
/** "Wed, 24 – Fri, 26 Dec" or "Fri, 12 Dec" */
export function rangeText(from: CalendarDate, to: CalendarDate): string {
  if (from === to) return dayText(from);
  const sameMonth = from.slice(0, 7) === to.slice(0, 7);
  return `${dayText(from, !sameMonth)} – ${dayText(to)}`;
}

/** Groups sorted dates into runs of back-to-back days, so a week off reads as one row. */
export function groupRuns(
  dates: readonly CalendarDate[],
): { from: CalendarDate; to: CalendarDate }[] {
  const runs: { from: CalendarDate; to: CalendarDate }[] = [];
  for (const date of [...dates].sort()) {
    const last = runs.at(-1);
    if (last && addDays(last.to, 1) === date) last.to = date;
    else runs.push({ from: date, to: date });
  }
  return runs;
}

/**
 * Closed dates (R-2, AUDIT-1 A16): picked on our calendar, a range at a time, shown as
 * "Wed, 24 – Fri, 26 Dec". Past dates drop off on the next save. A reason and different hours on a
 * day need a new table (`special_days`), planned as R-2b.
 */
export function ClosedDatesEditor({
  dates,
  today,
  onChange,
}: {
  readonly dates: readonly string[];
  readonly today: CalendarDate;
  readonly onChange: (next: CalendarDate[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<{ from: CalendarDate; to: CalendarDate } | null>(null);
  const upcoming = dates.filter(isCalendarDate).filter((date) => date >= today);
  const runs = groupRuns(upcoming);
  const picked = range ? eachNight(range.from, addDays(range.to, 1)) : [];
  const adding = picked.filter((date) => !upcoming.includes(date));
  const room = MAX_DATES - upcoming.length;
  const tooMany = adding.length > room;

  function addRange() {
    if (!range || tooMany) return;
    onChange([...new Set([...upcoming, ...adding])].sort());
    setOpen(false);
    setRange(null);
  }

  return (
    <>
      <RowGroup title="Closed dates" footer="No replies or viewings on these days.">
        {runs.map((run) => {
          const label = rangeText(run.from, run.to);
          return (
            <div key={run.from} className="flex min-h-13 items-center gap-3 py-2 pr-2 pl-4">
              <CalendarXIcon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 tabular">{label}</span>
              <Button
                variant="ghost"
                size="icon"
                className="size-11 pointer-fine:size-9"
                aria-label={`Remove ${label}`}
                onClick={() => {
                  const before = [...upcoming];
                  onChange(upcoming.filter((date) => date < run.from || date > run.to));
                  notify.success('Closed dates removed', { onUndo: () => onChange(before) });
                }}
              >
                <Trash2Icon aria-hidden="true" />
              </Button>
            </div>
          );
        })}
        <RowButton
          label="Add closed dates"
          icon={<CalendarPlusIcon className="text-primary-hover" />}
          hint={room <= 0 ? `You have ${MAX_DATES} closed dates, the most we keep.` : undefined}
          onClick={() => {
            if (room <= 0) return;
            setRange(null);
            setOpen(true);
          }}
        />
      </RowGroup>

      <AppSheet
        open={open}
        onOpenChange={setOpen}
        size="sm"
        title="Add closed dates"
        description="Tap one day, or a first and last day."
        footer={
          <>
            <Button
              data-sheet-cancel=""
              variant="outline"
              className="min-h-11"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button className="min-h-11" disabled={!range || tooMany} onClick={addRange}>
              {adding.length > 1 ? `Close ${adding.length} days` : 'Close this day'}
            </Button>
          </>
        }
      >
        <Calendar
          mode="range"
          className="mx-auto rounded-lg border border-border"
          disabled={{ before: toLocalDate(today) }}
          defaultMonth={toLocalDate(range?.from ?? today)}
          selected={
            range ? { from: toLocalDate(range.from), to: toLocalDate(range.to) } : undefined
          }
          onSelect={(next) => {
            if (!next?.from) {
              setRange(null);
              return;
            }
            const from = fromLocalDate(next.from);
            setRange({ from, to: next.to ? fromLocalDate(next.to) : from });
          }}
        />
        <p className="text-sm text-muted-foreground tabular" aria-live="polite">
          {!range
            ? 'No days picked yet'
            : tooMany
              ? `That is ${adding.length} days. You can add ${room} more.`
              : `${rangeText(range.from, range.to)} · ${picked.length} ${picked.length === 1 ? 'day' : 'days'}`}
        </p>
      </AppSheet>
    </>
  );
}
