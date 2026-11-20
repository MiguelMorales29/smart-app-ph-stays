import { useId, useMemo, useState } from 'react';
import { CalendarPlusIcon, PencilIcon, Trash2Icon } from 'lucide-react';
import {
  addDays,
  calendarDateSchema,
  centavos,
  formatPesos,
  nightsBetween,
  phHolidayChips,
  quoteStay,
  weekdayOf,
  type CalendarDate,
} from '@smartapp/core';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@smartapp/ui/components/accordion';
import { Alert, AlertDescription } from '@smartapp/ui/components/alert';
import { Button } from '@smartapp/ui/components/button';
import { Calendar } from '@smartapp/ui/components/calendar';
import { Field, FieldDescription, FieldError, FieldLabel } from '@smartapp/ui/components/field';
import { Input } from '@smartapp/ui/components/input';
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from '@smartapp/ui/components/number-field';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@smartapp/ui/components/responsive-dialog';
import { Switch } from '@smartapp/ui/components/switch';
import { ToggleGroup, ToggleGroupItem } from '@smartapp/ui/components/toggle-group';
import { MoneyInput } from '@smartapp/ui/compositions/money-input';
import { cn } from '@smartapp/ui/lib/utils';

export interface SpecialDate {
  readonly id: string;
  /** First night. */
  readonly start: CalendarDate;
  /** Check-out day: the night before it is the last special night. */
  readonly end: CalendarDate;
  readonly price: number;
  readonly label: string | null;
}

export interface PriceDraft {
  readonly baseNightly: number | null;
  readonly baseGuests: number;
  readonly weekdayOn: boolean;
  /** ISO weekdays, 1 = Monday … 7 = Sunday. */
  readonly weekdays: readonly number[];
  readonly weekdayPrice: number | null;
  readonly specialDates: readonly SpecialDate[];
  readonly cleaningFee: number | null;
  readonly extraGuestFee: number | null;
  readonly weeklyDiscount: number;
  readonly monthlyDiscount: number;
}

export type PriceDraftErrors = Partial<
  Record<'baseNightly' | 'weekdayPrice' | 'specialDates', string>
>;

const DAY_CHIPS: readonly { iso: number; short: string; long: string }[] = [
  { iso: 1, short: 'Mon', long: 'Monday' },
  { iso: 2, short: 'Tue', long: 'Tuesday' },
  { iso: 3, short: 'Wed', long: 'Wednesday' },
  { iso: 4, short: 'Thu', long: 'Thursday' },
  { iso: 5, short: 'Fri', long: 'Friday' },
  { iso: 6, short: 'Sat', long: 'Saturday' },
  { iso: 7, short: 'Sun', long: 'Sunday' },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** "Fri 11" */
function formatDay(date: Date): string {
  return `${WEEKDAYS[date.getUTCDay()] ?? ''} ${date.getUTCDate()}`;
}

/** "11 Dec" */
function formatShort(date: Date): string {
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()] ?? ''}`;
}

function toDate(date: CalendarDate): Date {
  return new Date(`${date}T00:00:00Z`);
}

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

/** "23–26 Dec" (the nights, not the check-out day). */
export function formatNights(start: CalendarDate, end: CalendarDate): string {
  const last = addDays(end, -1);
  if (last === start) return formatShort(toDate(start));
  const a = toDate(start);
  const b = toDate(last);
  if (a.getUTCMonth() === b.getUTCMonth()) {
    return `${a.getUTCDate()}–${formatShort(b)}`;
  }
  return `${formatShort(a)} – ${formatShort(b)}`;
}

function overlaps(
  a: { start: CalendarDate; end: CalendarDate },
  b: { start: CalendarDate; end: CalendarDate },
) {
  return nightsBetween(a.start, b.end) > 0 && nightsBetween(b.start, a.end) > 0;
}

export interface PreviewNight {
  readonly date: CalendarDate;
  readonly price: number;
  readonly source: string;
  readonly kind: 'special' | 'weekday' | 'base';
}

/**
 * What each of the next `count` nights costs and which rule set it, using `quoteStay` (the same
 * calculator guests' quotes use) one night at a time.
 */
export function previewNights(
  draft: PriceDraft,
  maxGuests: number,
  today: CalendarDate,
  count = 14,
): PreviewNight[] {
  if (draft.baseNightly === null || draft.baseNightly <= 0) return [];
  const weekdayRates =
    draft.weekdayOn && draft.weekdayPrice !== null && draft.weekdayPrice > 0
      ? draft.weekdays.map((iso) => ({
          iso_weekday: iso,
          nightly_centavos: centavos(draft.weekdayPrice ?? 0),
        }))
      : [];
  const nights: PreviewNight[] = [];
  for (let offset = 0; offset < count; offset += 1) {
    const date = addDays(today, offset);
    const outcome = quoteStay({
      terms: {
        base_nightly_centavos: centavos(draft.baseNightly),
        base_guests: Math.max(1, Math.min(draft.baseGuests, maxGuests)),
        min_nights: 1,
        max_nights: 365,
        weekly_discount_percent: 0,
        monthly_discount_percent: 0,
        down_payment_percent: 100,
        advance_notice_days: 0,
        booking_window_days: 730,
        max_guests: maxGuests,
      },
      weekdayRates,
      rateOverrides: draft.specialDates.map((item) => ({
        during: { start: item.start, end: item.end },
        nightly_centavos: centavos(item.price),
        label: item.label,
      })),
      fees: [],
      checkIn: date,
      checkOut: addDays(date, 1),
      adults: 1,
      children: 0,
      today,
    });
    const line = outcome.ok ? outcome.data.lines.find((item) => item.kind === 'night') : undefined;
    if (!line) continue;
    const special = draft.specialDates.find((item) =>
      overlaps(item, { start: date, end: addDays(date, 1) }),
    );
    const weekday = weekdayOf(date);
    const iso = weekday === 0 ? 7 : weekday;
    const kind: PreviewNight['kind'] = special
      ? 'special'
      : weekdayRates.some((rate) => rate.iso_weekday === iso)
        ? 'weekday'
        : 'base';
    nights.push({
      date,
      price: line.unit_centavos,
      kind,
      source: special
        ? (special.label ?? 'Special date')
        : kind === 'weekday'
          ? 'Day price'
          : 'Base',
    });
  }
  return nights;
}

function Count({
  id,
  label,
  value,
  onChange,
  min,
  max,
  suffix,
}: {
  readonly id: string;
  readonly label: string;
  readonly value: number;
  readonly onChange: (value: number) => void;
  readonly min: number;
  readonly max: number;
  readonly suffix?: string | undefined;
}) {
  return (
    <div className="flex items-center gap-2">
      <NumberField
        id={id}
        className="w-auto"
        value={value}
        min={min}
        max={max}
        onValueChange={(next) => onChange(next ?? min)}
      >
        <NumberFieldGroup className="w-36">
          <NumberFieldDecrement aria-label={`Less: ${label}`} />
          <NumberFieldInput />
          <NumberFieldIncrement aria-label={`More: ${label}`} />
        </NumberFieldGroup>
      </NumberField>
      {suffix ? (
        <span className="text-sm whitespace-nowrap text-muted-foreground">{suffix}</span>
      ) : null}
    </div>
  );
}

let specialCounter = 0;

/**
 * The unit price editor (P4-6, D50): base price, day prices, special dates with holiday chips,
 * a 14-night preview and the folded fees and discounts. Prices are in pesos only.
 */
export function PriceEditor({
  value,
  onChange,
  maxGuests,
  today,
  errors,
}: {
  readonly value: PriceDraft;
  readonly onChange: (next: PriceDraft) => void;
  readonly maxGuests: number;
  readonly today: CalendarDate;
  readonly errors?: PriceDraftErrors | undefined;
}) {
  const ids = useId();
  const [editing, setEditing] = useState<SpecialDate | 'new' | null>(null);
  const preview = useMemo(() => previewNights(value, maxGuests, today), [value, maxGuests, today]);
  const set = (change: Partial<PriceDraft>) => onChange({ ...value, ...change });
  const pickedLong = DAY_CHIPS.filter((day) => value.weekdays.includes(day.iso)).map(
    (day) => day.long,
  );

  return (
    <div data-slot="price-editor" className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field data-invalid={errors?.baseNightly ? true : undefined}>
          <FieldLabel htmlFor={`${ids}-base`}>Price per night</FieldLabel>
          <MoneyInput
            id={`${ids}-base`}
            value={value.baseNightly}
            per="a night"
            invalid={errors?.baseNightly !== undefined}
            onValueChange={(baseNightly) => set({ baseNightly })}
          />
          <FieldError>{errors?.baseNightly}</FieldError>
        </Field>
        <Field>
          <FieldLabel htmlFor={`${ids}-guests`}>Guests included</FieldLabel>
          <Count
            id={`${ids}-guests`}
            label="Guests included"
            value={Math.min(value.baseGuests, maxGuests)}
            onChange={(baseGuests) => set({ baseGuests })}
            min={1}
            max={maxGuests}
            suffix={`of ${maxGuests}`}
          />
        </Field>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-border p-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            <label id={`${ids}-days-label`} htmlFor={`${ids}-days`} className="text-sm font-medium">
              Charge more on some days?
            </label>
            <p id={`${ids}-days-hint`} className="text-sm text-muted-foreground">
              A Friday night means checking in on Friday.
            </p>
          </div>
          <Switch
            id={`${ids}-days`}
            aria-labelledby={`${ids}-days-label`}
            aria-describedby={`${ids}-days-hint`}
            checked={value.weekdayOn}
            onCheckedChange={(weekdayOn) => set({ weekdayOn })}
          />
        </div>
        {value.weekdayOn ? (
          <>
            <ToggleGroup
              multiple
              aria-label="Days with a different price"
              value={value.weekdays.map(String)}
              onValueChange={(next) => set({ weekdays: next.map(Number).sort((a, b) => a - b) })}
              variant="outline"
              className="flex-wrap"
            >
              {DAY_CHIPS.map((day) => (
                <ToggleGroupItem
                  key={day.iso}
                  value={String(day.iso)}

                  className="min-h-11 min-w-12 sm:min-h-9"
                >
                  {day.short}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <Field data-invalid={errors?.weekdayPrice ? true : undefined}>
              <FieldLabel htmlFor={`${ids}-day-price`}>
                Price on {pickedLong.length > 0 ? pickedLong.join(', ') : 'the picked days'}
              </FieldLabel>
              <MoneyInput
                id={`${ids}-day-price`}
                value={value.weekdayPrice}
                per="a night"
                invalid={errors?.weekdayPrice !== undefined}
                onValueChange={(weekdayPrice) => set({ weekdayPrice })}
              />
              <FieldError>{errors?.weekdayPrice}</FieldError>
            </Field>
          </>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium">Special dates</h3>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 sm:min-h-9"
            onClick={() => setEditing('new')}
          >
            <CalendarPlusIcon aria-hidden="true" />
            Add special date
          </Button>
        </div>
        {value.specialDates.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Holidays and peak weeks can have their own price.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {[...value.specialDates]
              .sort((a, b) => a.start.localeCompare(b.start))
              .map((item) => (
                <li key={item.id} className="flex items-center gap-2 px-3 py-1.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.label ?? 'Special date'}</p>
                    <p className="text-sm text-muted-foreground tabular">
                      {formatNights(item.start, item.end)} · {formatPesos(item.price)} a night
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-11 sm:size-9"
                    aria-label={`Edit ${item.label ?? 'special date'}`}
                    onClick={() => setEditing(item)}
                  >
                    <PencilIcon aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-11 sm:size-9"
                    aria-label={`Remove ${item.label ?? 'special date'}`}
                    onClick={() =>
                      set({
                        specialDates: value.specialDates.filter((other) => other.id !== item.id),
                      })
                    }
                  >
                    <Trash2Icon aria-hidden="true" />
                  </Button>
                </li>
              ))}
          </ul>
        )}
        {errors?.specialDates ? (
          <p className="text-sm text-destructive">{errors.specialDates}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">The next 14 nights</h3>
        {preview.length === 0 ? (
          <p className="text-sm text-muted-foreground">Enter a price per night to see them.</p>
        ) : (
          <ol
            tabIndex={0}
            className="-mx-1 flex snap-x gap-2 overflow-x-auto rounded-lg px-1 pb-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            aria-label="Price for each of the next 14 nights"
          >
            {preview.map((night) => (
              <li
                key={night.date}
                className={cn(
                  'flex w-24 shrink-0 snap-start flex-col gap-0.5 rounded-lg border p-2 text-xs',
                  night.kind === 'special'
                    ? 'border-primary bg-primary-tint'
                    : night.kind === 'weekday'
                      ? 'border-border bg-muted'
                      : 'border-border bg-card',
                )}
              >
                <span className="text-muted-foreground">{formatDay(toDate(night.date))}</span>
                <span className="text-sm font-semibold text-foreground tabular">
                  {formatPesos(night.price)}
                </span>
                <span className="truncate text-muted-foreground">{night.source}</span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <Accordion className="rounded-lg border border-border px-3">
        <AccordionItem value="more">
          <AccordionTrigger className="min-h-11 items-center hover:no-underline">
            More fees and discounts
          </AccordionTrigger>
          <AccordionContent className="flex flex-col gap-4 pb-4">
            <Field>
              <FieldLabel htmlFor={`${ids}-cleaning`}>Cleaning fee</FieldLabel>
              <MoneyInput
                id={`${ids}-cleaning`}
                value={value.cleaningFee}
                per="a stay"
                onValueChange={(cleaningFee) => set({ cleaningFee })}
              />
              <FieldDescription>
                Added once to every booking. Leave empty for none.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor={`${ids}-extra`}>Extra guest fee</FieldLabel>
              <MoneyInput
                id={`${ids}-extra`}
                value={value.extraGuestFee}
                per="a guest a night"
                onValueChange={(extraGuestFee) => set({ extraGuestFee })}
              />
              <FieldDescription>
                For each guest above the {value.baseGuests} included.
              </FieldDescription>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor={`${ids}-weekly`}>Weekly discount</FieldLabel>
                <Count
                  id={`${ids}-weekly`}
                  label="Weekly discount"
                  value={value.weeklyDiscount}
                  onChange={(weeklyDiscount) => set({ weeklyDiscount })}
                  min={0}
                  max={90}
                  suffix="%"
                />
                <FieldDescription>Stays of 7 nights or more.</FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor={`${ids}-monthly`}>Monthly discount</FieldLabel>
                <Count
                  id={`${ids}-monthly`}
                  label="Monthly discount"
                  value={value.monthlyDiscount}
                  onChange={(monthlyDiscount) => set({ monthlyDiscount })}
                  min={0}
                  max={90}
                  suffix="%"
                />
                <FieldDescription>
                  Stays of 28 nights or more. Only the larger discount applies.
                </FieldDescription>
              </Field>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <SpecialDateDialog
        editing={editing}
        existing={value.specialDates}
        today={today}
        onClose={() => setEditing(null)}
        onEditOther={(other) => setEditing(other)}
        onSave={(item) => {
          const rest = value.specialDates.filter((other) => other.id !== item.id);
          set({ specialDates: [...rest, item] });
          setEditing(null);
        }}
      />
    </div>
  );
}

function SpecialDateDialog({
  editing,
  existing,
  today,
  onClose,
  onEditOther,
  onSave,
}: {
  readonly editing: SpecialDate | 'new' | null;
  readonly existing: readonly SpecialDate[];
  readonly today: CalendarDate;
  readonly onClose: () => void;
  readonly onEditOther: (other: SpecialDate) => void;
  readonly onSave: (item: SpecialDate) => void;
}) {
  const open = editing !== null;
  const current = editing === 'new' || editing === null ? null : editing;
  return (
    <ResponsiveDialog open={open} onOpenChange={(next) => !next && onClose()}>
      <ResponsiveDialogContent>
        {open ? (
          <SpecialDateForm
            key={current?.id ?? 'new'}
            current={current}
            existing={existing}
            today={today}
            onClose={onClose}
            onEditOther={onEditOther}
            onSave={onSave}
          />
        ) : null}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

function SpecialDateForm({
  current,
  existing,
  today,
  onClose,
  onEditOther,
  onSave,
}: {
  readonly current: SpecialDate | null;
  readonly existing: readonly SpecialDate[];
  readonly today: CalendarDate;
  readonly onClose: () => void;
  readonly onEditOther: (other: SpecialDate) => void;
  readonly onSave: (item: SpecialDate) => void;
}) {
  const ids = useId();
  const [range, setRange] = useState<{ from: CalendarDate; to: CalendarDate } | null>(
    current ? { from: current.start, to: addDays(current.end, -1) } : null,
  );
  const [price, setPrice] = useState<number | null>(current?.price ?? null);
  const [label, setLabel] = useState(current?.label ?? '');
  const [error, setError] = useState<string | null>(null);
  const [clash, setClash] = useState<SpecialDate | null>(null);
  const chips = useMemo(() => phHolidayChips(today).slice(0, 8), [today]);

  function save() {
    setError(null);
    setClash(null);
    if (!range) {
      setError('Pick the first and last night.');
      return;
    }
    if (price === null || price <= 0) {
      setError('Enter a price above ₱0.');
      return;
    }
    const item: SpecialDate = {
      id: current?.id ?? `special-${(specialCounter += 1)}`,
      start: range.from,
      end: addDays(range.to, 1),
      price,
      label: label.trim() ? label.trim().slice(0, 80) : null,
    };
    const other = existing.find((entry) => entry.id !== item.id && overlaps(entry, item));
    if (other) {
      setClash(other);
      return;
    }
    onSave(item);
  }

  return (
    <>
      <ResponsiveDialogHeader>
        <ResponsiveDialogTitle>
          {current ? 'Edit special date' : 'Add special date'}
        </ResponsiveDialogTitle>
        <ResponsiveDialogDescription>
          Pick the nights, or tap a holiday to fill them in.
        </ResponsiveDialogDescription>
      </ResponsiveDialogHeader>
      <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Holidays">
          {chips.map((chip) => (
            <Button
              key={chip.key}
              type="button"
              variant="outline"
              size="sm"
              className="min-h-11 rounded-full sm:min-h-8"
              onClick={() => {
                setRange({ from: chip.start, to: addDays(chip.end, -1) });
                if (!label.trim()) setLabel(chip.label);
              }}
            >
              {chip.label}
            </Button>
          ))}
        </div>
        <Calendar
          mode="range"
          className="mx-auto rounded-lg border border-border"
          disabled={{ before: toLocalDate(today) }}
          defaultMonth={range ? toLocalDate(range.from) : toLocalDate(today)}
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
          {range
            ? `${formatNights(range.from, addDays(range.to, 1))} · ${nightsBetween(range.from, range.to) + 1} nights`
            : 'No nights picked yet'}
        </p>
        <Field>
          <FieldLabel htmlFor={`${ids}-price`}>Price for these nights</FieldLabel>
          <MoneyInput id={`${ids}-price`} value={price} per="a night" onValueChange={setPrice} />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${ids}-label`}>Label (optional)</FieldLabel>
          <Input
            id={`${ids}-label`}
            value={label}
            maxLength={80}
            placeholder="e.g. Christmas"
            onChange={(event) => setLabel(event.target.value)}
          />
        </Field>
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        {clash ? (
          <Alert variant="destructive">
            <AlertDescription className="flex flex-wrap items-center gap-2">
              These nights overlap {clash.label ?? 'another special date'} (
              {formatNights(clash.start, clash.end)}).
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="min-h-11 sm:min-h-8"
                onClick={() => onEditOther(clash)}
              >
                Edit the other date
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}
      </div>
      <ResponsiveDialogFooter>
        <Button type="button" variant="outline" className="min-h-11" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" className="min-h-11" onClick={save}>
          {current ? 'Save special date' : 'Add special date'}
        </Button>
      </ResponsiveDialogFooter>
    </>
  );
}
