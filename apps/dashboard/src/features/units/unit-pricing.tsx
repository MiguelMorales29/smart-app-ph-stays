import { useId, useState } from 'react';
import {
  centavos,
  formatPesos,
  percentOf,
  type DownPaymentKind,
  type OwnerUnitDetailView,
} from '@smartapp/core';
import { TriangleAlertIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@smartapp/ui/components/alert';
import { Button } from '@smartapp/ui/components/button';
import { Field, FieldDescription, FieldError, FieldLabel } from '@smartapp/ui/components/field';
import { AppSheet } from '@smartapp/ui/compositions/app-sheet';
import { ChoiceChip } from '@smartapp/ui/compositions/choice-chip';
import {
  RowButton,
  RowControl,
  RowGroup,
  RowNumberPicker,
} from '@smartapp/ui/compositions/grouped-rows';
import { InlineStepper } from '@smartapp/ui/compositions/inline-stepper';
import { MoneyInput } from '@smartapp/ui/compositions/money-input';
import { SegmentedControl } from '@smartapp/ui/compositions/segmented-control';
import type { PriceDraft } from '@smartapp/ui/compositions/price-editor';

// ——— Drafts ————————————————————————————————————————————————

export interface RulesDraft {
  readonly minNights: number;
  readonly maxNights: number;
  readonly downPaymentPercent: number;
  /** D93: a share of the total or a fixed peso amount. */
  readonly downPaymentKind: DownPaymentKind;
  /** Centavos, used when `downPaymentKind` is `fixed`. */
  readonly downPaymentFixed: number | null;
  readonly holdMinutes: number;
  readonly prepNights: number;
  readonly advanceNoticeDays: number;
  readonly bookingWindowDays: number;
}

export interface LeaseDraft {
  readonly monthlyRent: number | null;
  readonly minLeaseMonths: number;
  readonly advanceMonths: number;
  readonly depositMonths: number;
}

export type RulesErrors = Partial<Record<keyof RulesDraft, string>>;

export function priceDraftFrom(detail: OwnerUnitDetailView): PriceDraft {
  const stay = detail.stay_terms;
  const first = detail.weekday_rates[0];
  const cleaning = detail.fees.find((fee) => fee.code === 'cleaning' && fee.is_active);
  const extra = detail.fees.find((fee) => fee.code === 'extra_guest' && fee.is_active);
  return {
    baseNightly: stay?.base_nightly_centavos ?? null,
    baseGuests: stay?.base_guests ?? Math.min(2, detail.unit.max_guests),
    weekdayOn: detail.weekday_rates.length > 0,
    weekdays:
      detail.weekday_rates.length > 0
        ? detail.weekday_rates.map((rate) => rate.iso_weekday)
        : [5, 6],
    weekdayPrice: first?.nightly_centavos ?? null,
    specialDates: detail.rate_overrides.map((override) => ({
      id: override.id,
      start: override.during.start,
      end: override.during.end,
      price: override.nightly_centavos,
      label: override.label,
    })),
    cleaningFee: cleaning?.amount_centavos ?? null,
    extraGuestFee: extra?.amount_centavos ?? null,
    weeklyDiscount: stay?.weekly_discount_percent ?? 0,
    monthlyDiscount: stay?.monthly_discount_percent ?? 0,
  };
}

export function rulesDraftFrom(detail: OwnerUnitDetailView): RulesDraft {
  const stay = detail.stay_terms;
  return {
    minNights: stay?.min_nights ?? 1,
    maxNights: stay?.max_nights ?? 30,
    downPaymentPercent: stay?.down_payment_percent ?? 50,
    downPaymentKind: stay?.down_payment_kind ?? 'percent',
    downPaymentFixed: stay?.down_payment_centavos ?? null,
    holdMinutes: stay?.hold_minutes ?? 60,
    prepNights: stay?.prep_nights ?? 0,
    advanceNoticeDays: stay?.advance_notice_days ?? 0,
    bookingWindowDays: stay?.booking_window_days ?? 365,
  };
}

export function leaseDraftFrom(detail: OwnerUnitDetailView): LeaseDraft {
  const lease = detail.lease_terms;
  return {
    monthlyRent: lease?.monthly_rent_centavos ?? null,
    minLeaseMonths: lease?.min_lease_months ?? 1,
    advanceMonths: lease?.advance_months ?? 1,
    depositMonths: lease?.deposit_months ?? 1,
  };
}

export function sameDraft(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

// ——— Fields ————————————————————————————————————————————————

const HOLD_OPTIONS: readonly { minutes: number; label: string }[] = [
  { minutes: 30, label: '30 minutes' },
  { minutes: 60, label: '1 hour' },
  { minutes: 120, label: '2 hours' },
  { minutes: 360, label: '6 hours' },
  { minutes: 720, label: '12 hours' },
  { minutes: 1440, label: '24 hours' },
];

/** Picker choices that always include the saved value, even an unusual one. */
function choices(
  values: readonly number[],
  current: number,
  label: (value: number) => string,
): { value: number; label: string }[] {
  const all = values.includes(current) ? [...values] : [...values, current].sort((a, b) => a - b);
  return all.map((value) => ({ value, label: label(value) }));
}

const nights = (count: number) => `${count} ${count === 1 ? 'night' : 'nights'}`;
const daysAhead = (count: number) =>
  count === 0 ? 'Same day' : `${count} ${count === 1 ? 'day' : 'days'} ahead`;
const windowLabel = (days: number) =>
  days === 365 ? '1 year' : days === 730 ? '2 years' : `${days} days`;

/** "30% of the total", "Full payment" or "₱1,000". */
export function downPaymentText(value: RulesDraft): string {
  if (value.downPaymentKind === 'fixed') {
    return value.downPaymentFixed === null ? 'Set an amount' : formatPesos(value.downPaymentFixed);
  }
  return value.downPaymentPercent === 100
    ? 'Full payment'
    : `${value.downPaymentPercent}% of the total`;
}

/** Short text for the Booking rules section header. */
export function rulesSummary(value: RulesDraft): string {
  return `${value.minNights}–${value.maxNights} nights · ${downPaymentText(value)} to confirm`;
}

const PERCENT_PRESETS = [20, 30, 50, 100] as const;

/**
 * Down payment (R-3, D93, AUDIT-1 A13): a share of the total or a fixed peso amount, with a live
 * example from the unit's nightly price so the owner sees what a guest will pay.
 */
function DownPaymentRow({
  value,
  onChange,
  nightlyPrice,
  error,
}: {
  readonly value: RulesDraft;
  readonly onChange: (change: Partial<RulesDraft>) => void;
  readonly nightlyPrice: number | null;
  readonly error?: string | undefined;
}) {
  const ids = useId();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<DownPaymentKind>(value.downPaymentKind);
  const [percent, setPercent] = useState(value.downPaymentPercent);
  const [fixed, setFixed] = useState<number | null>(value.downPaymentFixed);
  const [sheetError, setSheetError] = useState<string | null>(null);

  function openSheet(next: boolean) {
    setOpen(next);
    if (next) {
      setKind(value.downPaymentKind);
      setPercent(value.downPaymentPercent);
      setFixed(value.downPaymentFixed);
      setSheetError(null);
    }
  }

  const example =
    nightlyPrice === null || nightlyPrice <= 0
      ? null
      : kind === 'percent'
        ? percentOf(centavos(nightlyPrice), percent)
        : fixed === null
          ? null
          : Math.min(fixed, nightlyPrice);

  function apply() {
    if (kind === 'fixed' && (fixed === null || fixed <= 0)) {
      setSheetError('Enter an amount above ₱0.');
      return;
    }
    onChange({ downPaymentKind: kind, downPaymentPercent: percent, downPaymentFixed: fixed });
    setOpen(false);
  }

  return (
    <>
      <RowButton
        label="Down payment"
        hint={
          error ? <span className="text-destructive">{error}</span> : 'What guests pay to confirm'
        }
        value={downPaymentText(value)}
        onClick={() => openSheet(true)}
      />
      <AppSheet
        open={open}
        onOpenChange={openSheet}
        size="sm"
        title="Down payment"
        description="Guests pay this to confirm, and the rest when they arrive or as you agree."
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
            <Button className="min-h-11" onClick={apply}>
              Done
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-5">
          <SegmentedControl
            aria-label="How the down payment is set"
            value={kind}
            onValueChange={(next) => {
              setKind(next);
              setSheetError(null);
            }}
            options={[
              { value: 'percent', label: 'Percent of total' },
              { value: 'fixed', label: 'Fixed amount' },
            ]}
          />
          {kind === 'percent' ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2" role="group" aria-label="Common choices">
                {PERCENT_PRESETS.map((preset) => (
                  <ChoiceChip
                    key={preset}
                    pressed={percent === preset}
                    onPressedChange={(on) => (on ? setPercent(preset) : undefined)}
                  >
                    {preset === 100 ? 'Full payment' : `${preset}%`}
                  </ChoiceChip>
                ))}
              </div>
              <RowGroup>
                <RowControl label="Or set your own" hint="10% to 100%" labelFor={`${ids}-pct`}>
                  <InlineStepper
                    id={`${ids}-pct`}
                    label="Down payment percent"
                    value={percent}
                    onValueChange={setPercent}
                    min={10}
                    max={100}
                    step={5}
                    unit="%"
                  />
                </RowControl>
              </RowGroup>
            </div>
          ) : (
            <Field data-invalid={sheetError ? true : undefined}>
              <FieldLabel htmlFor={`${ids}-fixed`}>Amount to confirm</FieldLabel>
              <MoneyInput
                id={`${ids}-fixed`}
                value={fixed}
                per="per booking"
                invalid={sheetError !== null}
                onValueChange={(next) => {
                  setFixed(next);
                  setSheetError(null);
                }}
              />
              <FieldDescription>If a stay costs less, guests pay the full stay.</FieldDescription>
              <FieldError>{sheetError}</FieldError>
            </Field>
          )}
          <p className="rounded-xl bg-muted px-4 py-3 text-sm tabular" aria-live="polite">
            {example === null || nightlyPrice === null
              ? 'Set a nightly price to see an example.'
              : `For 1 night at ${formatPesos(nightlyPrice)}, guests pay ${formatPesos(example)} to confirm (before fees).`}
          </p>
        </div>
      </AppSheet>
    </>
  );
}

/** Booking rules for nightly units (OW-09) as grouped rows (Pattern Guide §3.2–3.4). */
export function BookingRulesFields({
  value,
  onChange,
  errors,
  nightlyPrice = null,
}: {
  readonly value: RulesDraft;
  readonly onChange: (next: RulesDraft) => void;
  readonly errors: RulesErrors;
  /** The unit's nightly price in centavos, for the down payment example. */
  readonly nightlyPrice?: number | null;
}) {
  const ids = useId();
  const set = (change: Partial<RulesDraft>) => onChange({ ...value, ...change });
  const holdOptions = HOLD_OPTIONS.some((option) => option.minutes === value.holdMinutes)
    ? HOLD_OPTIONS
    : [...HOLD_OPTIONS, { minutes: value.holdMinutes, label: `${value.holdMinutes} minutes` }];
  const stayError = errors.minNights ?? errors.maxNights;
  return (
    <div className="flex flex-col gap-6">
      <RowGroup
        title="Length of stay"
        footer={
          stayError ? (
            <span className="text-destructive">{stayError}</span>
          ) : (
            'Longer stays ask you first by message.'
          )
        }
      >
        <RowControl label="Shortest stay" hint="Nights" labelFor={`${ids}-min`}>
          <InlineStepper
            id={`${ids}-min`}
            label="Shortest stay"
            value={value.minNights}
            onValueChange={(minNights) => set({ minNights })}
            min={1}
            max={30}
            unit="nights"
          />
        </RowControl>
        <RowNumberPicker
          label="Longest stay"
          value={value.maxNights}
          options={choices([7, 14, 30, 60, 90, 180, 365], value.maxNights, nights)}
          onValueChange={(maxNights) => set({ maxNights })}
          custom={{ min: 1, max: 365, unit: 'nights', inputLabel: 'Longest stay' }}
        />
        <RowControl
          label="Nights to prepare"
          hint="Kept free after each stay for cleaning"
          labelFor={`${ids}-prep`}
        >
          <InlineStepper
            id={`${ids}-prep`}
            label="Nights to prepare"
            value={value.prepNights}
            onValueChange={(prepNights) => set({ prepNights })}
            min={0}
            max={2}
            unit="nights"
          />
        </RowControl>
      </RowGroup>

      <RowGroup title="Payment" footer="We hold the dates while the guest sends the down payment.">
        <DownPaymentRow
          value={value}
          onChange={set}
          nightlyPrice={nightlyPrice}
          error={errors.downPaymentFixed}
        />
        <RowNumberPicker
          label="Time to send payment"
          value={value.holdMinutes}
          options={holdOptions.map((option) => ({ value: option.minutes, label: option.label }))}
          onValueChange={(holdMinutes) => set({ holdMinutes })}
          custom={{ min: 15, max: 1440, unit: 'minutes', inputLabel: 'Minutes to send payment' }}
        />
      </RowGroup>

      <RowGroup title="Calendar">
        <RowNumberPicker
          label="Book at least"
          hint="Same day lets guests book for tonight"
          value={value.advanceNoticeDays}
          options={choices([0, 1, 2, 3, 7, 14, 30], value.advanceNoticeDays, daysAhead)}
          onValueChange={(advanceNoticeDays) => set({ advanceNoticeDays })}
          custom={{ min: 0, max: 365, unit: 'days ahead', inputLabel: 'Days ahead' }}
        />
        <RowNumberPicker
          label="Book up to"
          hint="How far ahead your calendar is open"
          value={value.bookingWindowDays}
          options={choices([30, 60, 90, 180, 365, 730], value.bookingWindowDays, windowLabel)}
          onValueChange={(bookingWindowDays) => set({ bookingWindowDays })}
          custom={{ min: 1, max: 730, unit: 'days', inputLabel: 'Days ahead' }}
        />
      </RowGroup>
    </div>
  );
}

/** Monthly units: rent and lease rules (saved with saveUnit's lease terms). */
export function LeaseFields({
  value,
  onChange,
  error,
}: {
  readonly value: LeaseDraft;
  readonly onChange: (next: LeaseDraft) => void;
  readonly error?: string | undefined;
}) {
  const ids = useId();
  const set = (change: Partial<LeaseDraft>) => onChange({ ...value, ...change });
  return (
    <div className="flex flex-col gap-6">
      <Field data-invalid={error ? true : undefined}>
        <FieldLabel htmlFor={`${ids}-rent`}>Monthly rent</FieldLabel>
        <MoneyInput
          id={`${ids}-rent`}
          value={value.monthlyRent}
          per="a month"
          invalid={error !== undefined}
          onValueChange={(monthlyRent) => set({ monthlyRent })}
        />
        <FieldError>{error}</FieldError>
      </Field>
      <RowGroup title="Lease" footer="The deposit is returned when the tenant moves out.">
        <RowControl label="Shortest lease" hint="Months" labelFor={`${ids}-min`}>
          <InlineStepper
            id={`${ids}-min`}
            label="Shortest lease"
            value={value.minLeaseMonths}
            onValueChange={(minLeaseMonths) => set({ minLeaseMonths })}
            min={1}
            max={24}
            unit="months"
          />
        </RowControl>
        <RowControl label="Advance" hint="Months paid before moving in" labelFor={`${ids}-adv`}>
          <InlineStepper
            id={`${ids}-adv`}
            label="Advance"
            value={value.advanceMonths}
            onValueChange={(advanceMonths) => set({ advanceMonths })}
            min={0}
            max={6}
            unit="months"
          />
        </RowControl>
        <RowControl label="Deposit" hint="Months" labelFor={`${ids}-dep`}>
          <InlineStepper
            id={`${ids}-dep`}
            label="Deposit"
            value={value.depositMonths}
            onValueChange={(depositMonths) => set({ depositMonths })}
            min={0}
            max={6}
            unit="months"
          />
        </RowControl>
      </RowGroup>
      {value.advanceMonths > 1 || value.depositMonths > 2 ? (
        // Database blueprint: RA 9653 (Rent Control Act) warns, never blocks (AUDIT-1 A10).
        <Alert role="status" className="border-warning/40 bg-warning-tint">
          <TriangleAlertIcon aria-hidden="true" className="text-warning" />
          <AlertTitle>Check the Rent Control Act</AlertTitle>
          <AlertDescription>
            For rents it covers, RA 9653 allows at most 1 month advance and 2 months deposit. If
            this unit is covered, lower the{' '}
            {value.advanceMonths > 1 && value.depositMonths > 2
              ? 'advance and deposit'
              : value.advanceMonths > 1
                ? 'advance'
                : 'deposit'}
            .
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
