import { useState } from 'react';
import { useBlocker } from '@tanstack/react-router';
import { CopyIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import {
  formatWallTime12h,
  hoursFormSchema,
  isCalendarDate,
  manilaToday,
  type WeeklyHours,
} from '@smartapp/core';
import { Alert, AlertDescription } from '@smartapp/ui/components/alert';
import { Button } from '@smartapp/ui/components/button';
import { AppSheet } from '@smartapp/ui/compositions/app-sheet';
import { EmptyState } from '@smartapp/ui/compositions/empty-state';
import { RowButton, RowGroup, RowSwitch } from '@smartapp/ui/compositions/grouped-rows';
import { LeaveGuardDialog, SaveBar } from '@smartapp/ui/compositions/save-bar';
import { SegmentedControl } from '@smartapp/ui/compositions/segmented-control';
import { TimeSelect } from '@smartapp/ui/compositions/time-select';
import { useLastDefined } from '@smartapp/ui/hooks/use-last-defined';
import { notify } from '@smartapp/ui/lib/notify';
import { useHoursQuery } from '@/data/settings/reads';
import { useSaveHoursMutation, useSetSpecialDaysMutation } from '@/data/settings/writes';
import { extractAppError } from '@/data/shared';
import { useDashboard } from '@/app/dashboard-context';
import { SpecialDaysEditor, type SpecialDayDraft } from './special-days-editor';
import { SettingsPane } from './settings-nav';
import {
  same,
  SettingsError,
  SettingsSkeleton,
  useOfflineSave,
  useSaveState,
} from './settings-shared';

const DAYS = [
  { key: 'mon', label: 'Monday' },
  { key: 'tue', label: 'Tuesday' },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' },
  { key: 'fri', label: 'Friday' },
  { key: 'sat', label: 'Saturday' },
  { key: 'sun', label: 'Sunday' },
] as const;
type DayKey = (typeof DAYS)[number]['key'];
type Kind = 'reply' | 'viewing';
type Range = { readonly start: string; readonly end: string };

const EMPTY_WEEK: WeeklyHours = {
  mon: [{ start: '09:00', end: '18:00' }],
  tue: [{ start: '09:00', end: '18:00' }],
  wed: [{ start: '09:00', end: '18:00' }],
  thu: [{ start: '09:00', end: '18:00' }],
  fri: [{ start: '09:00', end: '18:00' }],
  sat: [{ start: '09:00', end: '18:00' }],
  sun: [],
};

const time = (value: string) => formatWallTime12h(value) ?? value;
const rangeText = (ranges: readonly Range[]) =>
  ranges.length === 0
    ? 'Closed'
    : ranges.map((range) => `${time(range.start)}–${time(range.end)}`).join(', ');

interface HoursDraft {
  readonly reply: WeeklyHours | null;
  readonly viewing: WeeklyHours | null;
  /** R-2b (D95): one list for the page, each day says if it is for replies, viewings or both. */
  readonly special: readonly SpecialDayDraft[];
}

/** /settings/hours (OW-24): reply and viewing hours, up to 4 ranges a day, and special days. */
export function HoursSettingsPage() {
  const hours = useHoursQuery();
  return (
    <SettingsPane title="Hours">
      {hours.isPending ? (
        <SettingsSkeleton />
      ) : hours.isError ? (
        <SettingsError error={hours.error} onRetry={() => void hours.refetch()} />
      ) : hours.data === null ? (
        <EmptyState title="No place yet" description="Add your place first." />
      ) : (
        <HoursForm
          key={hours.data.propertyId}
          propertyId={hours.data.propertyId}
          updatedAt={hours.data.updatedAt}
          initial={{
            reply: hours.data.replyHours,
            viewing: hours.data.viewingHours,
            special: hours.data.specialDays.map((day) => ({
              starts_on: day.starts_on,
              ends_on: day.ends_on,
              kind: day.kind,
              ranges: day.ranges,
              applies_to: day.applies_to,
              reason: day.reason,
            })),
          }}
        />
      )}
    </SettingsPane>
  );
}

function HoursForm({
  propertyId,
  updatedAt,
  initial,
}: {
  readonly propertyId: string;
  readonly updatedAt: string;
  readonly initial: HoursDraft;
}) {
  const save = useSaveHoursMutation();
  const saveSpecial = useSetSpecialDaysMutation();
  const [state, setState] = useSaveState();
  const { offline, message } = useOfflineSave();
  const [saved, setSaved] = useState(initial);
  const [draft, setDraft] = useState(initial);
  const [kind, setKind] = useState<Kind>('reply');
  const [editing, setEditing] = useState<DayKey | null>(null);
  const shared = useDashboard().today;
  const today = shared && isCalendarDate(shared) ? shared : manilaToday();
  const [error, setError] = useState<string | null>(null);
  const dirty = !same(draft, saved);
  const week = draft[kind];
  const blocker = useBlocker({
    shouldBlockFn: () => dirty,
    enableBeforeUnload: false,
    withResolver: true,
  });

  const setWeek = (next: WeeklyHours | null) =>
    setDraft((current) => ({ ...current, [kind]: next }));
  const setDay = (day: DayKey, ranges: Range[]) => {
    if (week) setWeek({ ...week, [day]: ranges });
  };

  async function onSave() {
    setError(null);
    const parsed = hoursFormSchema.safeParse({
      reply_hours: draft.reply,
      viewing_hours: draft.viewing,
    });
    if (!parsed.success) {
      setError('Some hours overlap or end before they start. Check each day, then save.');
      return;
    }
    setState('busy');
    const hoursChanged = !same(
      { reply: draft.reply, viewing: draft.viewing },
      { reply: saved.reply, viewing: saved.viewing },
    );
    try {
      if (hoursChanged) {
        await save.mutateAsync({
          propertyId,
          expectedUpdatedAt: updatedAt,
          replyHours: draft.reply,
          viewingHours: draft.viewing,
        });
      }
      if (!same(draft.special, saved.special)) {
        // The server drops past days, so the list stays short (AUDIT-1 A16).
        await saveSpecial.mutateAsync({
          propertyId,
          days: draft.special.map((day) => ({ ...day, ranges: [...day.ranges] })),
        });
      }
      setSaved(draft);
      setState('done');
    } catch (caught) {
      setState('idle');
      setError(extractAppError(caught).message);
    }
  }

  const shownDay = useLastDefined(editing);
  const dayLabel = DAYS.find((day) => day.key === shownDay)?.label ?? '';
  const dayRanges: Range[] = shownDay && week ? [...week[shownDay]] : [];
  const kindWord = kind === 'reply' ? 'reply' : 'viewing';

  return (
    <div className="flex flex-col gap-6">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <SegmentedControl
        aria-label="Which hours"
        value={kind}
        onValueChange={setKind}
        options={[
          { value: 'reply', label: 'Reply hours' },
          { value: 'viewing', label: 'Viewing hours' },
        ]}
      />
      <RowGroup
        footer={
          kind === 'reply'
            ? 'Guests see when to expect your reply.'
            : 'When people can come to see a unit before renting.'
        }
      >
        <RowSwitch
          label={kind === 'reply' ? 'Set reply hours' : 'Set viewing hours'}
          hint={week ? undefined : kind === 'reply' ? 'Replies any time.' : 'Viewings any time.'}
          checked={week !== null}
          onCheckedChange={(on) => setWeek(on ? EMPTY_WEEK : null)}
        />
      </RowGroup>

      {week ? (
        <>
          <RowGroup title="Each day">
            {DAYS.map((day) => (
              <RowButton
                key={day.key}
                label={day.label}
                value={<span className="tabular">{rangeText(week[day.key])}</span>}
                onClick={() => setEditing(day.key)}
              />
            ))}
          </RowGroup>
          <Button
            variant="outline"
            className="min-h-11 self-start"
            onClick={() => {
              const monday = week.mon;
              setWeek({
                ...week,
                tue: monday,
                wed: monday,
                thu: monday,
                fri: monday,
                sat: monday,
                sun: monday,
              });
              notify.info('Monday copied to all days');
            }}
          >
            <CopyIcon aria-hidden="true" />
            Copy Monday to all days
          </Button>
        </>
      ) : null}

      <SpecialDaysEditor
        days={draft.special}
        today={today}
        onChange={(special) => setDraft((current) => ({ ...current, special }))}
      />

      <AppSheet
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        size="sm"
        title={`${dayLabel} ${kindWord} hours`}
        description="Up to 4 times a day. No times means closed."
        footer={
          <Button className="min-h-11" onClick={() => setEditing(null)}>
            Done
          </Button>
        }
      >
        <div className="flex flex-col gap-3">
          {dayRanges.length === 0 ? (
            <p className="text-sm text-muted-foreground">Closed on {dayLabel}.</p>
          ) : null}
          {dayRanges.map((range, index) => (
            <div key={index} className="flex items-center gap-2">
              <TimeSelect
                aria-label={`From, time ${index + 1}`}
                className="flex-1"
                value={range.start}
                onValueChange={(start) =>
                  shownDay &&
                  setDay(
                    shownDay,
                    dayRanges.map((item, i) => (i === index ? { ...item, start } : item)),
                  )
                }
              />
              <span aria-hidden="true">–</span>
              <TimeSelect
                aria-label={`Until, time ${index + 1}`}
                className="flex-1"
                value={range.end}
                onValueChange={(end) =>
                  shownDay &&
                  setDay(
                    shownDay,
                    dayRanges.map((item, i) => (i === index ? { ...item, end } : item)),
                  )
                }
              />
              <Button
                variant="ghost"
                size="icon"
                className="size-11 shrink-0 pointer-fine:size-9"
                aria-label={`Remove time ${index + 1}`}
                onClick={() =>
                  shownDay &&
                  setDay(
                    shownDay,
                    dayRanges.filter((_, i) => i !== index),
                  )
                }
              >
                <Trash2Icon aria-hidden="true" />
              </Button>
            </div>
          ))}
          {dayRanges.length < 4 ? (
            <Button
              variant="outline"
              className="min-h-11 self-start"
              onClick={() =>
                shownDay && setDay(shownDay, [...dayRanges, { start: '13:00', end: '17:00' }])
              }
            >
              <PlusIcon aria-hidden="true" />
              Add a time
            </Button>
          ) : null}
        </div>
      </AppSheet>

      <SaveBar
        dirty={dirty}
        state={state}
        canSave={!offline}
        message={message}
        onSave={() => void onSave()}
        onDiscard={() => {
          setDraft(saved);
          setError(null);
          notify.info('Changes discarded');
        }}
      />
      <LeaveGuardDialog
        open={blocker.status === 'blocked'}
        onStay={() => blocker.reset?.()}
        onLeave={() => blocker.proceed?.()}
      />
    </div>
  );
}
