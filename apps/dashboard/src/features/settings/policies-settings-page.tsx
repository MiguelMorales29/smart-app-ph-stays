import { useState } from 'react';
import { useBlocker } from '@tanstack/react-router';
import { Link } from '@tanstack/react-router';
import { CalendarRangeIcon } from 'lucide-react';
import {
  CANCELLATION_PRESET_COPY,
  cancellationRefund,
  formatPesos,
  formatWallTime12h,
  readErrorDetails,
  type CancellationPreset,
  type HouseRulesRow,
  type PropertiesRow,
} from '@smartapp/core';
import { Alert, AlertDescription } from '@smartapp/ui/components/alert';
import { Button } from '@smartapp/ui/components/button';
import { Field, FieldDescription, FieldError, FieldLabel } from '@smartapp/ui/components/field';
import { Input } from '@smartapp/ui/components/input';
import { Textarea } from '@smartapp/ui/components/textarea';
import { EmptyState } from '@smartapp/ui/compositions/empty-state';
import { RowControl, RowGroup, RowPicker, RowSwitch } from '@smartapp/ui/compositions/grouped-rows';
import { RadioCards } from '@smartapp/ui/compositions/radio-cards';
import { LeaveGuardDialog, SaveBar } from '@smartapp/ui/compositions/save-bar';
import { TimeSelect } from '@smartapp/ui/compositions/time-select';
import { notify } from '@smartapp/ui/lib/notify';
import { usePoliciesQuery } from '@/data/settings/reads';
import { useSavePoliciesMutation } from '@/data/settings/writes';
import { useOwnerUnitsQuery } from '@/data/units/reads';
import { HouseRulesEditor } from './house-rules-editor';
import { extractAppError } from '@/data/shared';
import { SettingsPane } from './settings-nav';
import {
  same,
  SettingsError,
  SettingsSkeleton,
  useOfflineSave,
  useSaveState,
} from './settings-shared';

const PRESETS: readonly Exclude<CancellationPreset, 'custom'>[] = [
  'dp_rebook',
  'flexible',
  'moderate',
  'firm',
  'non_refundable',
];

/** The worked example under each preset, computed (₱3,000 paid, ₱1,500 down, 3 days before). */
function workedExample(preset: Exclude<CancellationPreset, 'custom'>): string {
  const outcome = cancellationRefund(preset, {
    paidCentavos: 300_000,
    downPaymentCentavos: 150_000,
    daysBeforeCheckIn: 3,
  });
  const back = `gets back ${formatPesos(outcome.refundCentavos)}`;
  return `Guest paid ₱3,000, cancels 3 days before → ${back}${
    outcome.canRebook ? ', or moves the dates once' : ''
  }.`;
}

interface PoliciesDraft {
  readonly checkin: string;
  readonly checkout: string;
  readonly preset: CancellationPreset;
  readonly note: string;
  readonly rebookMinDays: number;
  readonly rebookWithinMonths: number;
  readonly guestIds: boolean;
  readonly guestListDue: number;
  readonly arrival: string;
  readonly privacy: string;
  readonly rules: readonly string[];
}

function draftFrom(property: PropertiesRow, houseRules: readonly HouseRulesRow[]): PoliciesDraft {
  return {
    checkin: property.checkin_time,
    checkout: property.checkout_time,
    preset: property.cancellation_preset,
    note: property.cancellation_note ?? '',
    rebookMinDays: property.rebook_min_days,
    rebookWithinMonths: property.rebook_within_months,
    guestIds: property.guest_ids_required,
    guestListDue: property.guest_list_due_hours,
    arrival: property.arrival_info ?? '',
    privacy: property.privacy_contact,
    rules: [...houseRules].sort((a, b) => a.sort_order - b.sort_order).map((rule) => rule.body),
  };
}

function withCurrent(values: readonly number[], current: number): number[] {
  return values.includes(current) ? [...values] : [...values, current].sort((a, b) => a - b);
}

/** /settings/policies (OW-12): cancellation, times, guests and house rules. */
export function PoliciesSettingsPage() {
  const policies = usePoliciesQuery();
  return (
    <SettingsPane title="Policies">
      {policies.isPending ? (
        <SettingsSkeleton />
      ) : policies.isError ? (
        <SettingsError error={policies.error} onRetry={() => void policies.refetch()} />
      ) : policies.data === null ? (
        <EmptyState
          title="No place yet"
          description="Add your place first. Its rules show here after."
        />
      ) : (
        <PoliciesForm
          key={policies.data.property.id}
          property={policies.data.property}
          houseRules={policies.data.houseRules}
        />
      )}
    </SettingsPane>
  );
}

function PoliciesForm({
  property,
  houseRules,
}: {
  readonly property: PropertiesRow;
  readonly houseRules: readonly HouseRulesRow[];
}) {
  const save = useSavePoliciesMutation();
  const units = useOwnerUnitsQuery();
  // Monthly units follow their lease terms, so nightly-only rules are labelled or hidden (AUDIT-1 A15).
  const modes = new Set((units.data ?? []).map((item) => item.unit.mode));
  const hasMonthly = modes.has('long_term');
  const hasNightly = modes.has('short_stay') || !hasMonthly;
  const mixed = hasNightly && hasMonthly;
  const [state, setState] = useSaveState();
  const { offline, message } = useOfflineSave();
  const [saved, setSaved] = useState(() => draftFrom(property, houseRules));
  const [draft, setDraft] = useState(saved);
  const [errors, setErrors] = useState<{ note?: string; privacy?: string; form?: string }>({});
  const dirty = !same(draft, saved);
  const set = (change: Partial<PoliciesDraft>) =>
    setDraft((current) => ({ ...current, ...change }));
  const blocker = useBlocker({
    shouldBlockFn: () => dirty,
    enableBeforeUnload: false,
    withResolver: true,
  });

  async function onSave() {
    const next: typeof errors = {};
    if (draft.preset === 'custom' && !draft.note.trim()) {
      next.note = 'Write your cancellation rule.';
    }
    if (!/^\S+@\S+\.\S+$/.test(draft.privacy.trim())) {
      next.privacy = 'Enter a working email address.';
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setState('busy');
    try {
      await save.mutateAsync({
        propertyId: property.id,
        expectedUpdatedAt: property.updated_at,
        checkinTime: draft.checkin,
        checkoutTime: draft.checkout,
        cancellationPreset: draft.preset,
        cancellationNote: draft.note.trim() ? draft.note.trim() : null,
        rebookMinDays: draft.rebookMinDays,
        rebookWithinMonths: draft.rebookWithinMonths,
        guestIdsRequired: draft.guestIds,
        guestListDueHours: draft.guestListDue,
        arrivalInfo: draft.arrival.trim() ? draft.arrival.trim() : null,
        privacyContact: draft.privacy.trim(),
        houseRules: [...draft.rules],
      });
      setSaved(draft);
      setState('done');
    } catch (caught) {
      setState('idle');
      const error = extractAppError(caught);
      const fields = readErrorDetails(error).fields;
      setErrors({ form: Object.values(fields)[0] ?? error.message });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {errors.form ? (
        <Alert variant="destructive">
          <AlertDescription>{errors.form}</AlertDescription>
        </Alert>
      ) : null}

      {hasMonthly ? (
        <section
          aria-labelledby="pol-monthly"
          className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4"
        >
          <h2 id="pol-monthly" className="flex items-center gap-2 font-medium">
            <CalendarRangeIcon aria-hidden="true" className="size-4 text-muted-foreground" />
            {mixed ? 'For monthly rentals' : 'Move-in rules'}
          </h2>
          <p className="text-sm text-muted-foreground">
            Monthly units follow their own lease terms: rent, advance, deposit and the shortest
            lease. Set them on each unit, under Price.
            {mixed ? ' The cancellation rule and times below are for nightly stays only.' : ''}
          </p>
          <Button
            variant="outline"
            className="min-h-11 self-start sm:min-h-9"
            nativeButton={false}
            render={<Link to="/units" />}
          >
            Open units
          </Button>
        </section>
      ) : null}

      {mixed ? <h2 className="-mb-2 text-base font-semibold">For nightly stays</h2> : null}

      {hasNightly ? (
        <>
          <Field>
            <FieldLabel id="pol-cancel-label">If a guest cancels</FieldLabel>
            <RadioCards
              aria-labelledby="pol-cancel-label"
              columns={1}
              value={draft.preset}
              onValueChange={(preset) => set({ preset })}
              options={[
                ...PRESETS.map((preset) => ({
                  value: preset,
                  label: CANCELLATION_PRESET_COPY[preset].label,
                  description: (
                    <>
                      {CANCELLATION_PRESET_COPY[preset].summary}
                      <span className="mt-1 block text-foreground tabular">
                        {workedExample(preset)}
                      </span>
                    </>
                  ),
                })),
                {
                  value: 'custom' as const,
                  label: CANCELLATION_PRESET_COPY.custom.label,
                  description: CANCELLATION_PRESET_COPY.custom.summary,
                },
              ]}
            />
          </Field>
          {draft.preset === 'custom' ? (
            <Field data-invalid={errors.note ? true : undefined}>
              <FieldLabel htmlFor="pol-note">Your cancellation rule</FieldLabel>
              <Textarea
                id="pol-note"
                rows={3}
                maxLength={1000}
                value={draft.note}
                aria-invalid={errors.note ? true : undefined}
                onChange={(event) => set({ note: event.target.value })}
              />
              <FieldError>{errors.note}</FieldError>
            </Field>
          ) : null}
          {draft.preset === 'dp_rebook' ? (
            <RowGroup title="Date changes">
              <RowPicker
                label="Ask at least"
                hint="Before check-in"
                value={draft.rebookMinDays}
                options={withCurrent([1, 3, 7, 14], draft.rebookMinDays).map((days) => ({
                  value: days,
                  label: `${days} ${days === 1 ? 'day' : 'days'}`,
                }))}
                onValueChange={(rebookMinDays) => set({ rebookMinDays })}
              />
              <RowPicker
                label="New dates within"
                value={draft.rebookWithinMonths}
                options={withCurrent([1, 3, 6, 12], draft.rebookWithinMonths).map((months) => ({
                  value: months,
                  label: `${months} ${months === 1 ? 'month' : 'months'}`,
                }))}
                onValueChange={(rebookWithinMonths) => set({ rebookWithinMonths })}
              />
            </RowGroup>
          ) : null}

          <RowGroup title="Times">
            <RowControl label="Check-in from" labelFor="pol-checkin">
              <TimeSelect
                id="pol-checkin"
                className="w-36"
                value={draft.checkin}
                onValueChange={(checkin) => set({ checkin })}
              />
            </RowControl>
            <RowControl label="Check-out by" labelFor="pol-checkout">
              <TimeSelect
                id="pol-checkout"
                className="w-36"
                value={draft.checkout}
                onValueChange={(checkout) => set({ checkout })}
              />
            </RowControl>
          </RowGroup>
          <Field>
            <FieldLabel htmlFor="pol-arrival">Arrival details</FieldLabel>
            <Textarea
              id="pol-arrival"
              rows={3}
              maxLength={2000}
              placeholder="Gate code, parking, where to get the key"
              value={draft.arrival}
              onChange={(event) => set({ arrival: event.target.value })}
            />
            <FieldDescription>Only guests with a confirmed booking see this.</FieldDescription>
          </Field>

          <RowGroup title="Guests">
            <RowSwitch
              label="Ask for a guest list and IDs"
              hint="Names and a valid ID of everyone staying"
              checked={draft.guestIds}
              onCheckedChange={(guestIds) => set({ guestIds })}
            />
            {draft.guestIds ? (
              <RowPicker
                label="Due before check-in"
                value={draft.guestListDue}
                options={withCurrent([12, 24, 48, 72], draft.guestListDue).map((hours) => ({
                  value: hours,
                  label: `${hours} hours`,
                }))}
                onValueChange={(guestListDue) => set({ guestListDue })}
              />
            ) : null}
          </RowGroup>
        </>
      ) : (
        <Field>
          <FieldLabel htmlFor="pol-arrival">Move-in details</FieldLabel>
          <Textarea
            id="pol-arrival"
            rows={3}
            maxLength={2000}
            placeholder="Where to get the keys, who to meet, parking"
            value={draft.arrival}
            onChange={(event) => set({ arrival: event.target.value })}
          />
          <FieldDescription>Only tenants with a confirmed lease see this.</FieldDescription>
        </Field>
      )}

      <HouseRulesEditor rules={draft.rules} onChange={(rules) => set({ rules })} />

      <Field data-invalid={errors.privacy ? true : undefined}>
        <FieldLabel htmlFor="pol-privacy">Privacy contact</FieldLabel>
        <Input
          id="pol-privacy"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={draft.privacy}
          maxLength={254}
          aria-invalid={errors.privacy ? true : undefined}
          onChange={(event) => set({ privacy: event.target.value })}
        />
        <FieldDescription>Guests write here to see or delete their details.</FieldDescription>
        <FieldError>{errors.privacy}</FieldError>
      </Field>

      <section aria-labelledby="pol-preview" className="flex flex-col gap-2">
        <h2 id="pol-preview" className="text-sm font-medium text-muted-foreground">
          How guests read it
        </h2>
        <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 text-sm">
          {hasNightly ? (
            <>
              <p>
                <span className="font-medium">Check-in</span> from{' '}
                {formatWallTime12h(draft.checkin) ?? draft.checkin} ·{' '}
                <span className="font-medium">Check-out</span> by{' '}
                {formatWallTime12h(draft.checkout) ?? draft.checkout}
              </p>
              <p>
                <span className="font-medium">Cancellation:</span>{' '}
                {draft.preset === 'custom'
                  ? draft.note.trim() || 'Your rule goes here.'
                  : CANCELLATION_PRESET_COPY[draft.preset].summary}
              </p>
            </>
          ) : null}
          {hasNightly && draft.guestIds ? (
            <p>Send the guest list and IDs {draft.guestListDue} hours before check-in.</p>
          ) : null}
          {draft.rules.length > 0 ? (
            <ul className="list-disc pl-5">
              {draft.rules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>

      <SaveBar
        dirty={dirty}
        state={state}
        canSave={!offline}
        message={message}
        onSave={() => void onSave()}
        onDiscard={() => {
          setDraft(saved);
          setErrors({});
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
