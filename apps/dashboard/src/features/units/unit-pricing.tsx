import { useId } from 'react';
import { AMENITY_GROUPS, type AmenitiesRow, type OwnerUnitDetailView } from '@smartapp/core';
import { Field, FieldError, FieldLabel } from '@smartapp/ui/components/field';
import { AmenityChips } from '@smartapp/ui/compositions/amenity-chips';
import { RowControl, RowGroup, RowPicker } from '@smartapp/ui/compositions/grouped-rows';
import { InlineStepper } from '@smartapp/ui/compositions/inline-stepper';
import { MoneyInput } from '@smartapp/ui/compositions/money-input';
import type { PriceDraft } from '@smartapp/ui/compositions/price-editor';

// ——— Drafts ————————————————————————————————————————————————

export interface RulesDraft {
  readonly minNights: number;
  readonly maxNights: number;
  readonly downPaymentPercent: number;
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
    holdMinutes: stay?.hold_minutes ?? 120,
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

/** Short text for the Booking rules section header. */
export function rulesSummary(value: RulesDraft): string {
  return `${value.minNights}–${value.maxNights} nights · ${value.downPaymentPercent}% down payment`;
}

/** Booking rules for nightly units (OW-09) as grouped rows (Pattern Guide §3.2–3.4). */
export function BookingRulesFields({
  value,
  onChange,
  errors,
}: {
  readonly value: RulesDraft;
  readonly onChange: (next: RulesDraft) => void;
  readonly errors: RulesErrors;
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
        <RowPicker
          label="Longest stay"
          value={value.maxNights}
          options={choices([7, 14, 30, 60, 90, 180, 365], value.maxNights, nights)}
          onValueChange={(maxNights) => set({ maxNights })}
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
        <RowPicker
          label="Down payment"
          hint="What guests pay to confirm"
          value={value.downPaymentPercent}
          options={choices([10, 20, 30, 50, 100], value.downPaymentPercent, (pct) =>
            pct === 100 ? 'Full payment' : `${pct}% of the total`,
          )}
          onValueChange={(downPaymentPercent) => set({ downPaymentPercent })}
        />
        <RowPicker
          label="Time to send payment"
          value={value.holdMinutes}
          options={holdOptions.map((option) => ({ value: option.minutes, label: option.label }))}
          onValueChange={(holdMinutes) => set({ holdMinutes })}
        />
      </RowGroup>

      <RowGroup title="Calendar">
        <RowPicker
          label="Book at least"
          hint="Same day lets guests book for tonight"
          value={value.advanceNoticeDays}
          options={choices([0, 1, 2, 3, 7, 14, 30], value.advanceNoticeDays, daysAhead)}
          onValueChange={(advanceNoticeDays) => set({ advanceNoticeDays })}
        />
        <RowPicker
          label="Book up to"
          hint="How far ahead your calendar is open"
          value={value.bookingWindowDays}
          options={choices([30, 60, 90, 180, 365, 730], value.bookingWindowDays, windowLabel)}
          onValueChange={(bookingWindowDays) => set({ bookingWindowDays })}
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
    </div>
  );
}

const GROUP_LABEL: Record<AmenitiesRow['grp'], string> = {
  essentials: 'Essentials',
  comfort: 'Comfort',
  kitchen: 'Kitchen',
  bathroom: 'Bathroom',
  safety: 'Safety',
  outdoor: 'Outdoor',
  other: 'Other',
};

export function AmenitiesField({
  catalogue,
  value,
  onChange,
}: {
  readonly catalogue: readonly AmenitiesRow[];
  readonly value: readonly string[];
  readonly onChange: (ids: string[]) => void;
}) {
  return (
    <AmenityChips
      options={catalogue
        .filter((item) => item.is_active)
        .sort(
          (a, b) =>
            AMENITY_GROUPS.indexOf(a.grp) - AMENITY_GROUPS.indexOf(b.grp) ||
            a.sort_order - b.sort_order,
        )
        .map((item) => ({
          id: item.id,
          label: item.label,
          icon: item.icon,
          group: GROUP_LABEL[item.grp],
        }))}
      value={value}
      onValueChange={onChange}
    />
  );
}
