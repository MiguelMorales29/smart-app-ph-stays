import { useId } from 'react';
import type { AmenitiesRow, OwnerUnitDetailView } from '@smartapp/core';
import { Field, FieldDescription, FieldError, FieldLabel } from '@smartapp/ui/components/field';
import { NativeSelect, NativeSelectOption } from '@smartapp/ui/components/native-select';
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from '@smartapp/ui/components/number-field';
import { AmenityChips } from '@smartapp/ui/compositions/amenity-chips';
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

function Count({
  id,
  label,
  value,
  onChange,
  min,
  max,
  suffix,
  invalid,
}: {
  readonly id: string;
  readonly label: string;
  readonly value: number;
  readonly onChange: (value: number) => void;
  readonly min: number;
  readonly max: number;
  readonly suffix?: string | undefined;
  readonly invalid?: boolean | undefined;
}) {
  return (
    <div className="flex items-center gap-2">
      <NumberField
        id={id}
        value={value}
        min={min}
        max={max}
        onValueChange={(next) => onChange(next ?? min)}
      >
        <NumberFieldGroup className="w-36" aria-invalid={invalid ? true : undefined}>
          <NumberFieldDecrement aria-label={`Less: ${label}`} />
          <NumberFieldInput />
          <NumberFieldIncrement aria-label={`More: ${label}`} />
        </NumberFieldGroup>
      </NumberField>
      {suffix ? <span className="text-sm text-muted-foreground">{suffix}</span> : null}
    </div>
  );
}

const HOLD_OPTIONS: readonly { minutes: number; label: string }[] = [
  { minutes: 30, label: '30 minutes' },
  { minutes: 60, label: '1 hour' },
  { minutes: 120, label: '2 hours' },
  { minutes: 360, label: '6 hours' },
  { minutes: 720, label: '12 hours' },
  { minutes: 1440, label: '24 hours' },
];

/** Booking rules for nightly units (OW-09). Each field has a one-line hint. */
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
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field data-invalid={errors.minNights ? true : undefined}>
          <FieldLabel htmlFor={`${ids}-min`}>Shortest stay</FieldLabel>
          <Count
            id={`${ids}-min`}
            label="Shortest stay"
            value={value.minNights}
            onChange={(minNights) => set({ minNights })}
            min={1}
            max={365}
            suffix="nights"
            invalid={errors.minNights !== undefined}
          />
          <FieldDescription>Guests can't book fewer nights than this.</FieldDescription>
          <FieldError>{errors.minNights}</FieldError>
        </Field>
        <Field data-invalid={errors.maxNights ? true : undefined}>
          <FieldLabel htmlFor={`${ids}-max`}>Longest stay</FieldLabel>
          <Count
            id={`${ids}-max`}
            label="Longest stay"
            value={value.maxNights}
            onChange={(maxNights) => set({ maxNights })}
            min={1}
            max={365}
            suffix="nights"
            invalid={errors.maxNights !== undefined}
          />
          <FieldDescription>Longer stays ask you first by message.</FieldDescription>
          <FieldError>{errors.maxNights}</FieldError>
        </Field>
      </div>
      <Field>
        <FieldLabel htmlFor={`${ids}-dp`}>Down payment</FieldLabel>
        <Count
          id={`${ids}-dp`}
          label="Down payment"
          value={value.downPaymentPercent}
          onChange={(downPaymentPercent) => set({ downPaymentPercent })}
          min={10}
          max={100}
          suffix="% of the total"
        />
        <FieldDescription>
          What guests pay to confirm. They pay the rest as you agree.
        </FieldDescription>
      </Field>
      <Field>
        <FieldLabel htmlFor={`${ids}-hold`}>Time to send payment</FieldLabel>
        <NativeSelect
          id={`${ids}-hold`}
          className="w-full sm:w-60"
          value={String(value.holdMinutes)}
          onChange={(event) => set({ holdMinutes: Number(event.target.value) })}
        >
          {holdOptions.map((option) => (
            <NativeSelectOption key={option.minutes} value={String(option.minutes)}>
              {option.label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <FieldDescription>
          We hold the dates this long while the guest sends the down payment.
        </FieldDescription>
      </Field>
      <Field>
        <FieldLabel htmlFor={`${ids}-prep`}>Nights to prepare between stays</FieldLabel>
        <Count
          id={`${ids}-prep`}
          label="Nights to prepare"
          value={value.prepNights}
          onChange={(prepNights) => set({ prepNights })}
          min={0}
          max={2}
          suffix="nights"
        />
        <FieldDescription>We keep these nights free after each stay for cleaning.</FieldDescription>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor={`${ids}-notice`}>Book at least</FieldLabel>
          <Count
            id={`${ids}-notice`}
            label="Advance notice"
            value={value.advanceNoticeDays}
            onChange={(advanceNoticeDays) => set({ advanceNoticeDays })}
            min={0}
            max={60}
            suffix="days ahead"
          />
          <FieldDescription>0 lets guests book for tonight.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor={`${ids}-window`}>Book up to</FieldLabel>
          <Count
            id={`${ids}-window`}
            label="Booking window"
            value={value.bookingWindowDays}
            onChange={(bookingWindowDays) => set({ bookingWindowDays })}
            min={1}
            max={730}
            suffix="days ahead"
          />
          <FieldDescription>How far ahead your calendar is open.</FieldDescription>
        </Field>
      </div>
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
    <div className="flex flex-col gap-4">
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
      <Field>
        <FieldLabel htmlFor={`${ids}-min`}>Shortest lease</FieldLabel>
        <Count
          id={`${ids}-min`}
          label="Shortest lease"
          value={value.minLeaseMonths}
          onChange={(minLeaseMonths) => set({ minLeaseMonths })}
          min={1}
          max={24}
          suffix="months"
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor={`${ids}-advance`}>Advance</FieldLabel>
          <Count
            id={`${ids}-advance`}
            label="Advance"
            value={value.advanceMonths}
            onChange={(advanceMonths) => set({ advanceMonths })}
            min={0}
            max={6}
            suffix="months"
          />
          <FieldDescription>Months of rent paid before moving in.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor={`${ids}-deposit`}>Deposit</FieldLabel>
          <Count
            id={`${ids}-deposit`}
            label="Deposit"
            value={value.depositMonths}
            onChange={(depositMonths) => set({ depositMonths })}
            min={0}
            max={6}
            suffix="months"
          />
          <FieldDescription>Returned when the tenant moves out.</FieldDescription>
        </Field>
      </div>
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
        .sort((a, b) => a.sort_order - b.sort_order)
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
