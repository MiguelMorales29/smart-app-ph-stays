import { useEffect, useState, type ReactNode } from 'react';
import { Link, useBlocker, useNavigate, useParams, useSearch } from '@tanstack/react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import type { z } from 'zod';
import { ArrowLeftIcon, CheckIcon, CircleIcon } from 'lucide-react';
import {
  centavos,
  calendarDateSchema,
  readErrorDetails,
  unitFormSchema,
  type OwnerUnitDetailView,
} from '@smartapp/core';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@smartapp/ui/components/accordion';
import { Alert, AlertDescription, AlertTitle } from '@smartapp/ui/components/alert';
import { Button } from '@smartapp/ui/components/button';
import { Field, FieldDescription, FieldError, FieldLabel } from '@smartapp/ui/components/field';
import { Input } from '@smartapp/ui/components/input';
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from '@smartapp/ui/components/number-field';
import { Skeleton } from '@smartapp/ui/components/skeleton';
import { Textarea } from '@smartapp/ui/components/textarea';
import { DraftNotice } from '@smartapp/ui/compositions/draft-notice';
import { ErrorState } from '@smartapp/ui/compositions/error-state';
import { PhotoManager } from '@smartapp/ui/compositions/photo-manager';
import {
  PriceEditor,
  type PriceDraft,
  type PriceDraftErrors,
} from '@smartapp/ui/compositions/price-editor';
import { LeaveGuardDialog, SaveBar } from '@smartapp/ui/compositions/save-bar';
import { useFormDraft } from '@smartapp/ui/hooks/use-form-draft';
import { useFormFactor } from '@smartapp/ui/hooks/use-form-factor';
import { notify } from '@smartapp/ui/lib/notify';
import { cn } from '@smartapp/ui/lib/utils';
import { useDashboard } from '@/app/dashboard-context';
import { usePhotoPipeline } from '@/app/photos/use-photo-pipeline';
import { useSetUnitPhotosMutation } from '@/data/photos/upload';
import { useSaveUnitPricesMutation } from '@/data/prices/writes';
import { extractAppError } from '@/data/shared';
import { saveUnitInputFromDetail } from '@/data/units/bulk';
import { useAmenitiesQuery, useOwnerUnitQuery, useOwnerUnitsQuery } from '@/data/units/reads';
import { useSaveUnitMutation } from '@/data/units/writes';
import { applyAppErrorToForm } from '@/data/use-form-errors';
import {
  AmenitiesField,
  BookingRulesFields,
  LeaseFields,
  leaseDraftFrom,
  priceDraftFrom,
  rulesDraftFrom,
  sameDraft,
  type LeaseDraft,
  type RulesDraft,
  type RulesErrors,
} from './unit-pricing';
import { UNIT_TYPE_LABEL, UnitStatusBadge } from './unit-words';

export type UnitSection = 'basics' | 'photos' | 'price' | 'amenities' | 'rules';

export interface UnitEditSearch {
  readonly section?: UnitSection;
}

const SECTIONS: readonly { value: UnitSection; label: string }[] = [
  { value: 'basics', label: 'Basics' },
  { value: 'photos', label: 'Photos' },
  { value: 'price', label: 'Price' },
  { value: 'amenities', label: 'Amenities' },
  { value: 'rules', label: 'Booking rules' },
];

const basicsSchema = unitFormSchema
  .pick({
    name: true,
    group_label: true,
    description: true,
    max_guests: true,
    bedrooms: true,
    beds: true,
    bathrooms: true,
    floor_area_sqm: true,
    arrival_info: true,
  })
  .extend({
    name: unitFormSchema.shape.name.refine(
      (value) => value.trim().length > 0,
      'Enter the unit name.',
    ),
  });
type BasicsForm = z.infer<typeof basicsSchema>;

function basicsFrom(detail: OwnerUnitDetailView): BasicsForm {
  const { unit } = detail;
  return {
    name: unit.name,
    group_label: unit.group_label,
    description: unit.description,
    max_guests: unit.max_guests,
    bedrooms: unit.bedrooms,
    beds: unit.beds,
    bathrooms: unit.bathrooms,
    floor_area_sqm: unit.floor_area_sqm,
    arrival_info: unit.arrival_info,
  };
}

const emptyToNull = (value: string) => (value.trim() === '' ? null : value);

function CountInput({
  id,
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
}: {
  readonly id: string;
  readonly value: number | null;
  readonly onChange: (value: number | null) => void;
  readonly min: number;
  readonly max: number;
  readonly step?: number;
  readonly label: string;
}) {
  return (
    <NumberField id={id} value={value} min={min} max={max} step={step} onValueChange={onChange}>
      <NumberFieldGroup className="w-40">
        <NumberFieldDecrement aria-label={`Fewer: ${label}`} />
        <NumberFieldInput />
        <NumberFieldIncrement aria-label={`More: ${label}`} />
      </NumberFieldGroup>
    </NumberField>
  );
}

/** /units/$unitId (OW-08): Basics and Photos now; Price, Amenities and Booking rules in P4-6. */
export function UnitEditPage() {
  const { unitId } = useParams({ from: '/app-frame/units/$unitId' });
  const search = useSearch({ from: '/app-frame/units/$unitId' });
  const navigate = useNavigate();
  const detail = useOwnerUnitQuery(unitId);
  const units = useOwnerUnitsQuery();

  if (detail.isPending) {
    return (
      <section className="space-y-4" aria-busy="true">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-8 w-60" />
        <Skeleton className="h-64 w-full" />
      </section>
    );
  }
  if (detail.isError) {
    return (
      <ErrorState
        title="We couldn't open this unit"
        message={extractAppError(detail.error).message}
        onRetry={() => void detail.refetch()}
      />
    );
  }

  const roomBeds =
    detail.data.unit.group_label === null
      ? []
      : (units.data ?? []).filter((item) => item.unit.group_label === detail.data.unit.group_label);

  return (
    <UnitEditor
      key={detail.data.unit.id}
      detail={detail.data}
      roomBeds={roomBeds.map((item) => ({ unitId: item.unit.id, name: item.unit.name }))}
      section={search.section ?? 'basics'}
      onSection={(section) =>
        void navigate({
          to: '/units/$unitId',
          params: { unitId },
          search: { section },
          replace: true,
        })
      }
    />
  );
}

function UnitEditor({
  detail,
  roomBeds,
  section,
  onSection,
}: {
  readonly detail: OwnerUnitDetailView;
  readonly roomBeds: readonly { readonly unitId: string; readonly name: string }[];
  readonly section: UnitSection;
  readonly onSection: (section: UnitSection) => void;
}) {
  const formFactor = useFormFactor();
  const save = useSaveUnitMutation();
  const savePhotos = useSetUnitPhotosMutation();
  const savePrices = useSaveUnitPricesMutation();
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle');
  const [stale, setStale] = useState(false);
  const [topError, setTopError] = useState<string | null>(null);
  const [current, setCurrent] = useState(detail);
  const unit = current.unit;
  const isBed = unit.unit_type === 'bed_space';
  const photoLabel = unit.group_label ?? unit.name;

  const form = useForm<BasicsForm>({
    resolver: zodResolver(basicsSchema),
    defaultValues: basicsFrom(detail),
  });
  const watched = form.watch();
  const draft = useFormDraft<BasicsForm>({
    key: `unit:${unit.id}`,
    values: watched,
    dirty: form.formState.isDirty,
    parse: (value) => {
      const parsed = basicsSchema.safeParse(value);
      return parsed.success ? parsed.data : null;
    },
  });
  const photos = usePhotoPipeline({ saved: detail.photos, altPrefix: photoLabel });
  const amenities = useAmenitiesQuery();
  const { today } = useDashboard();
  const isLong = unit.mode === 'long_term';
  const [price, setPrice] = useState<PriceDraft>(() => priceDraftFrom(detail));
  const [rules, setRules] = useState<RulesDraft>(() => rulesDraftFrom(detail));
  const [lease, setLease] = useState<LeaseDraft>(() => leaseDraftFrom(detail));
  const [amenityIds, setAmenityIds] = useState<string[]>(() => [...detail.amenity_ids]);
  const [priceErrors, setPriceErrors] = useState<PriceDraftErrors>({});
  const [rulesErrors, setRulesErrors] = useState<RulesErrors>({});
  const [leaseError, setLeaseError] = useState<string | undefined>(undefined);
  const priceDirty = !isLong && !sameDraft(price, priceDraftFrom(current));
  const rulesDirty = !isLong && !sameDraft(rules, rulesDraftFrom(current));
  const leaseDirty = isLong && !sameDraft(lease, leaseDraftFrom(current));
  const amenitiesDirty = !sameDraft([...amenityIds].sort(), [...current.amenity_ids].sort());
  const dirty =
    form.formState.isDirty ||
    photos.dirty ||
    priceDirty ||
    rulesDirty ||
    leaseDirty ||
    amenitiesDirty;

  /** Checks the price, rules and rent before saving; returns the section to open, or null. */
  function checkPrices(): UnitSection | null {
    const nextPrice: PriceDraftErrors = {};
    const nextRules: RulesErrors = {};
    let nextLease: string | undefined;
    if (isLong) {
      if (leaseDirty && (lease.monthlyRent === null || lease.monthlyRent <= 0)) {
        nextLease = 'Enter a monthly rent above ₱0.';
      }
    } else if (priceDirty || rulesDirty) {
      if (price.baseNightly === null || price.baseNightly <= 0) {
        nextPrice.baseNightly = 'Enter a price above ₱0.';
      }
      if (
        price.weekdayOn &&
        (price.weekdays.length === 0 || price.weekdayPrice === null || price.weekdayPrice <= 0)
      ) {
        nextPrice.weekdayPrice =
          price.weekdays.length === 0
            ? 'Pick at least one day, or turn this off.'
            : 'Enter the price for the picked days.';
      }
      if (rules.minNights > rules.maxNights) {
        nextRules.maxNights = 'Make the longest stay at least the shortest stay.';
      }
    }
    setPriceErrors(nextPrice);
    setRulesErrors(nextRules);
    setLeaseError(nextLease);
    if (Object.keys(nextPrice).length > 0 || nextLease) return 'price';
    if (Object.keys(nextRules).length > 0) return 'rules';
    return null;
  }

  const blocker = useBlocker({
    shouldBlockFn: ({ next }) => dirty && !next.pathname.startsWith(`/units/${unit.id}`),
    enableBeforeUnload: false,
    withResolver: true,
  });

  useEffect(() => {
    if (state !== 'done') return;
    const timer = window.setTimeout(() => setState('idle'), 1500);
    return () => window.clearTimeout(timer);
  }, [state]);

  async function onSave() {
    setTopError(null);
    if (photos.busy) {
      setTopError('Wait for the photos to finish uploading, then save.');
      return;
    }
    const basicsOk = form.formState.isDirty ? await form.trigger() : true;
    if (!basicsOk) {
      onSection('basics');
      return;
    }
    const priceProblem = checkPrices();
    if (priceProblem) {
      onSection(priceProblem);
      return;
    }
    setState('busy');
    try {
      let latest = current;
      if (form.formState.isDirty || amenitiesDirty || leaseDirty) {
        const base = saveUnitInputFromDetail(current);
        const values = form.getValues();
        const basicsChange = form.formState.isDirty
          ? {
              name: values.name.trim(),
              groupLabel: isBed ? emptyToNull(values.group_label ?? '') : null,
              description: values.description ? emptyToNull(values.description) : null,
              maxGuests: values.max_guests,
              bedrooms: values.bedrooms,
              beds: values.beds,
              bathrooms: values.bathrooms,
              floorAreaSqm: values.floor_area_sqm,
              arrivalInfo: values.arrival_info ? emptyToNull(values.arrival_info) : null,
            }
          : {};
        const saved = await save.mutateAsync({
          ...base,
          ...basicsChange,
          amenityIds,
          leaseTerms:
            leaseDirty && lease.monthlyRent !== null
              ? {
                  monthly_rent_centavos: lease.monthlyRent,
                  min_lease_months: lease.minLeaseMonths,
                  advance_months: lease.advanceMonths,
                  deposit_months: lease.depositMonths,
                  reservation_fee_centavos: current.lease_terms?.reservation_fee_centavos ?? 0,
                  available_from:
                    current.lease_terms?.available_from ?? today ?? unit.created_at.slice(0, 10),
                  inclusions: current.lease_terms?.inclusions ?? null,
                }
              : base.leaseTerms,
        });
        latest = saved;
        setCurrent(saved);
        form.reset(basicsFrom(saved));
        setAmenityIds([...saved.amenity_ids]);
        setLease(leaseDraftFrom(saved));
        draft.clear();
      }
      if ((priceDirty || rulesDirty) && price.baseNightly !== null) {
        const otherFees = latest.fees
          .filter((fee) => fee.code === 'other')
          .map((fee) => ({
            code: fee.code,
            label: fee.label,
            amount_centavos: fee.amount_centavos,
            basis: fee.basis,
            is_active: fee.is_active,
          }));
        const feeLabel = (code: 'cleaning' | 'extra_guest', fallback: string) =>
          latest.fees.find((fee) => fee.code === code)?.label ?? fallback;
        const result = await savePrices.mutateAsync({
          unitId: unit.id,
          expectedUpdatedAt: null,
          baseNightlyCentavos: centavos(price.baseNightly),
          baseGuests: Math.min(price.baseGuests, unit.max_guests),
          minNights: rules.minNights,
          maxNights: rules.maxNights,
          prepNights: rules.prepNights,
          weeklyDiscountPercent: price.weeklyDiscount,
          monthlyDiscountPercent: price.monthlyDiscount,
          downPaymentPercent: rules.downPaymentPercent,
          holdMinutes: rules.holdMinutes,
          advanceNoticeDays: rules.advanceNoticeDays,
          bookingWindowDays: rules.bookingWindowDays,
          weekdayRates:
            price.weekdayOn && price.weekdayPrice !== null
              ? price.weekdays.map((iso) => ({
                  iso_weekday: iso,
                  nightly_centavos: centavos(price.weekdayPrice ?? 0),
                }))
              : [],
          rateOverrides: price.specialDates.map((item) => ({
            during: { start: item.start, end: item.end },
            nightly_centavos: centavos(item.price),
            label: item.label,
          })),
          fees: [
            ...(price.cleaningFee !== null && price.cleaningFee > 0
              ? [
                  {
                    code: 'cleaning' as const,
                    label: feeLabel('cleaning', 'Cleaning fee'),
                    amount_centavos: centavos(price.cleaningFee),
                    basis: 'per_stay' as const,
                    is_active: true,
                  },
                ]
              : []),
            ...(price.extraGuestFee !== null && price.extraGuestFee > 0
              ? [
                  {
                    code: 'extra_guest' as const,
                    label: feeLabel('extra_guest', 'Extra guest fee'),
                    amount_centavos: centavos(price.extraGuestFee),
                    basis: 'per_extra_guest_per_night' as const,
                    is_active: true,
                  },
                ]
              : []),
            ...otherFees,
          ],
        });
        const next: OwnerUnitDetailView = {
          ...latest,
          stay_terms: result.stayTerms,
          weekday_rates: result.weekdayRates,
          rate_overrides: result.rateOverrides,
          fees: result.fees,
        };
        setCurrent(next);
        setPrice(priceDraftFrom(next));
        setRules(rulesDraftFrom(next));
      }
      if (photos.dirty) {
        await savePhotos.mutateAsync({
          propertyId: unit.property_id,
          units: roomBeds.length > 0 ? roomBeds : [{ unitId: unit.id, name: unit.name }],
          photos: photos.photosToSave,
        });
        photos.markSaved();
      }
      setState('done');
    } catch (caught) {
      setState('idle');
      const error = extractAppError(caught);
      if (readErrorDetails(error).reason === 'changed_elsewhere') {
        setStale(true);
        return;
      }
      const applied = applyAppErrorToForm(caught, form, {
        knownFields: [
          'name',
          'description',
          'max_guests',
          'bedrooms',
          'beds',
          'bathrooms',
          'floor_area_sqm',
          'arrival_info',
        ],
      });
      setTopError(applied.topError);
      if (!applied.topError) onSection('basics');
    }
  }

  function discard() {
    form.reset(basicsFrom(current));
    photos.reset(current.photos);
    setPrice(priceDraftFrom(current));
    setRules(rulesDraftFrom(current));
    setLease(leaseDraftFrom(current));
    setAmenityIds([...current.amenity_ids]);
    setPriceErrors({});
    setRulesErrors({});
    setLeaseError(undefined);
    draft.discard();
    notify.info('Changes discarded');
  }

  const doneMarks: Record<UnitSection, boolean> = {
    basics: true,
    photos: photos.photosToSave.length >= 3,
    price: unit.mode === 'long_term' ? current.lease_terms !== null : current.stay_terms !== null,
    amenities: current.amenity_ids.length > 0,
    rules: isLong ? current.lease_terms !== null : current.stay_terms !== null,
  };

  const errors = form.formState.errors;
  const basics = (
    <div className="flex flex-col gap-4">
      {draft.saved ? (
        <DraftNotice
          onKeep={() => {
            const kept = draft.keep();
            if (kept) form.reset(kept, { keepDefaultValues: true });
          }}
          onDiscard={draft.discard}
        />
      ) : null}
      <Field data-invalid={errors.name ? true : undefined}>
        <FieldLabel htmlFor="unit-name">Name</FieldLabel>
        <Input
          id="unit-name"
          maxLength={80}
          aria-invalid={errors.name ? true : undefined}
          {...form.register('name')}
        />
        <FieldError>{errors.name?.message}</FieldError>
      </Field>
      {isBed ? (
        <Field>
          <FieldLabel htmlFor="unit-room">Room</FieldLabel>
          <Input
            id="unit-room"
            maxLength={40}
            {...form.register('group_label', { setValueAs: (value: string) => value })}
          />
          <FieldDescription>
            Beds with the same room name are grouped and share photos.
          </FieldDescription>
        </Field>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="unit-guests">Guests</FieldLabel>
          <Controller
            control={form.control}
            name="max_guests"
            render={({ field }) => (
              <CountInput
                id="unit-guests"
                label="Guests"
                value={field.value}
                onChange={(v) => field.onChange(v ?? 1)}
                min={1}
                max={30}
              />
            )}
          />
        </Field>
        {!isBed ? (
          <Field>
            <FieldLabel htmlFor="unit-bedrooms">Bedrooms</FieldLabel>
            <Controller
              control={form.control}
              name="bedrooms"
              render={({ field }) => (
                <CountInput
                  id="unit-bedrooms"
                  label="Bedrooms"
                  value={field.value}
                  onChange={(v) => field.onChange(v ?? 0)}
                  min={0}
                  max={20}
                />
              )}
            />
          </Field>
        ) : null}
        <Field>
          <FieldLabel htmlFor="unit-beds">Beds</FieldLabel>
          <Controller
            control={form.control}
            name="beds"
            render={({ field }) => (
              <CountInput
                id="unit-beds"
                label="Beds"
                value={field.value}
                onChange={(v) => field.onChange(v ?? 0)}
                min={0}
                max={40}
              />
            )}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="unit-baths">Bathrooms</FieldLabel>
          <Controller
            control={form.control}
            name="bathrooms"
            render={({ field }) => (
              <CountInput
                id="unit-baths"
                label="Bathrooms"
                value={field.value}
                onChange={(v) => field.onChange(v ?? 0)}
                min={0}
                max={20}
                step={0.5}
              />
            )}
          />
        </Field>
        <Field data-invalid={errors.floor_area_sqm ? true : undefined}>
          <FieldLabel htmlFor="unit-area">Floor area (m²)</FieldLabel>
          <Controller
            control={form.control}
            name="floor_area_sqm"
            render={({ field }) => (
              <Input
                id="unit-area"
                inputMode="decimal"
                value={field.value === null ? '' : String(field.value)}
                onChange={(event) => {
                  const raw = event.target.value.replace(/[^\d.]/g, '');
                  field.onChange(raw === '' ? null : Number(raw));
                }}
                onBlur={field.onBlur}
              />
            )}
          />
          <FieldError>{errors.floor_area_sqm?.message}</FieldError>
        </Field>
      </div>
      <Field>
        <FieldLabel htmlFor="unit-description">Description</FieldLabel>
        <Textarea
          id="unit-description"
          rows={4}
          maxLength={4000}
          {...form.register('description')}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="unit-arrival">Arrival details</FieldLabel>
        <Textarea
          id="unit-arrival"
          rows={3}
          maxLength={2000}
          placeholder="Gate code, parking, where to get the key"
          {...form.register('arrival_info')}
        />
        <FieldDescription>Only guests with a confirmed booking see this.</FieldDescription>
      </Field>
    </div>
  );

  const photoSection = (
    <div className="flex flex-col gap-3">
      {roomBeds.length > 1 ? (
        <p className="text-sm text-muted-foreground">
          These photos are shared by the {roomBeds.length} beds in {unit.group_label}.
        </p>
      ) : null}
      <PhotoManager
        tiles={photos.tiles}
        max={20}
        onAdd={photos.add}
        onReorder={photos.reorder}
        onAltChange={photos.setAlt}
        onRemove={photos.remove}
        onRetry={photos.retry}
      />
    </div>
  );

  const content: Record<UnitSection, ReactNode> = {
    basics,
    photos: photoSection,
    price: isLong ? (
      <LeaseFields value={lease} onChange={setLease} error={leaseError} />
    ) : today ? (
      <PriceEditor
        value={price}
        onChange={setPrice}
        maxGuests={unit.max_guests}
        today={calendarDateSchema.parse(today)}
        errors={priceErrors}
      />
    ) : null,
    amenities: amenities.isPending ? (
      <Skeleton className="h-32 w-full" />
    ) : amenities.isError ? (
      <ErrorState
        title="We couldn't load the amenities"
        message={extractAppError(amenities.error).message}
        onRetry={() => void amenities.refetch()}
      />
    ) : (
      <AmenitiesField catalogue={amenities.data} value={amenityIds} onChange={setAmenityIds} />
    ),
    rules: isLong ? (
      <p className="text-sm text-muted-foreground">
        Monthly units use the lease rules under Price.
      </p>
    ) : (
      <BookingRulesFields value={rules} onChange={setRules} errors={rulesErrors} />
    ),
  };

  const mark = (value: UnitSection) =>
    doneMarks[value] ? (
      <CheckIcon aria-label="Done" className="size-4 text-success" />
    ) : (
      <CircleIcon aria-label="Not done" className="size-4 text-muted-foreground" />
    );

  return (
    <section className="space-y-5">
      <div className="space-y-2">
        <Link
          to="/units"
          className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-muted-foreground hover-hover:hover:text-foreground"
        >
          <ArrowLeftIcon aria-hidden="true" className="size-4" />
          Units
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="line-clamp-2 font-heading text-2xl font-semibold">{unit.name}</h1>
          <UnitStatusBadge status={unit.status} />
        </div>
        <p className="text-sm text-muted-foreground">{UNIT_TYPE_LABEL[unit.unit_type]}</p>
      </div>

      {stale ? (
        <Alert>
          <AlertTitle>Someone else changed this unit</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-2">
            Reload to see the latest, then make your change again.
            <Button
              size="sm"
              variant="outline"
              className="min-h-11 sm:min-h-8"
              onClick={() => window.location.reload()}
            >
              Reload
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}
      {topError ? (
        <Alert variant="destructive">
          <AlertDescription>{topError}</AlertDescription>
        </Alert>
      ) : null}

      {/* Phones and tablets: an accordion. Desktop: sections on the left, the form on the right. */}
      {formFactor !== 'desktop' ? (
        <Accordion
          className="rounded-xl border border-border bg-card px-4"
          value={[section]}
          onValueChange={(value) => {
            const next = SECTIONS.find((item) => item.value === value[0]);
            if (next) onSection(next.value);
          }}
        >
          {SECTIONS.map((item) => (
            <AccordionItem key={item.value} value={item.value}>
              <AccordionTrigger className="min-h-12 items-center text-base hover:no-underline">
                <span className="flex items-center gap-2">
                  {mark(item.value)}
                  {item.label}
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                {section === item.value ? content[item.value] : null}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <div className="grid grid-cols-[200px_minmax(0,1fr)] gap-8">
          <nav aria-label="Unit sections">
            <ul className="sticky top-20 space-y-1">
              {SECTIONS.map((item) => (
                <li key={item.value}>
                  <button
                    type="button"
                    aria-current={section === item.value ? 'page' : undefined}
                    onClick={() => onSection(item.value)}
                    className={cn(
                      'flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                      section === item.value
                        ? 'bg-primary-tint text-foreground'
                        : 'text-muted-foreground hover-hover:hover:bg-muted',
                    )}
                  >
                    {mark(item.value)}
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          <div className="min-w-0 rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 font-heading text-lg font-semibold">
              {SECTIONS.find((item) => item.value === section)?.label}
            </h2>
            {content[section]}
          </div>
        </div>
      )}

      <SaveBar
        dirty={dirty}
        state={state}
        canSave={!photos.busy}
        onSave={() => void onSave()}
        onDiscard={discard}
      />
      <LeaveGuardDialog
        open={blocker.status === 'blocked'}
        onStay={() => blocker.reset?.()}
        onLeave={() => blocker.proceed?.()}
      />
    </section>
  );
}
