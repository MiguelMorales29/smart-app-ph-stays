import { useEffect, useState, type ReactNode } from 'react';
import { useBlocker, useParams, useSearch } from '@tanstack/react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import type { z } from 'zod';
import {
  centavos,
  calendarDateSchema,
  formatPesos,
  readErrorDetails,
  unitFormSchema,
  type OwnerUnitDetailView,
} from '@smartapp/core';
import { Alert, AlertDescription, AlertTitle } from '@smartapp/ui/components/alert';
import { Button } from '@smartapp/ui/components/button';
import { Field, FieldDescription, FieldError, FieldLabel } from '@smartapp/ui/components/field';
import { Input } from '@smartapp/ui/components/input';
import { Skeleton } from '@smartapp/ui/components/skeleton';
import { Textarea } from '@smartapp/ui/components/textarea';
import { DraftNotice } from '@smartapp/ui/compositions/draft-notice';
import { EditorSections } from '@smartapp/ui/compositions/editor-sections';
import { ErrorState } from '@smartapp/ui/compositions/error-state';
import { RowControl, RowGroup } from '@smartapp/ui/compositions/grouped-rows';
import { InlineStepper } from '@smartapp/ui/compositions/inline-stepper';
import { PhotoManager } from '@smartapp/ui/compositions/photo-manager';
import {
  PriceEditor,
  priceSummary,
  type PriceDraft,
  type PriceDraftErrors,
} from '@smartapp/ui/compositions/price-editor';
import { LeaveGuardDialog, SaveBar } from '@smartapp/ui/compositions/save-bar';
import { useFormDraft } from '@smartapp/ui/hooks/use-form-draft';
import { notify } from '@smartapp/ui/lib/notify';
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
  rulesSummary,
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

/** /units/$unitId (OW-08): Basics and Photos now; Price, Amenities and Booking rules in P4-6. */
export function UnitEditPage() {
  const { unitId } = useParams({ from: '/app-frame/units/$unitId' });
  const search = useSearch({ from: '/app-frame/units/$unitId' });
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
      initialSection={search.section ?? 'basics'}
    />
  );
}

function UnitEditor({
  detail,
  roomBeds,
  initialSection,
}: {
  readonly detail: OwnerUnitDetailView;
  readonly roomBeds: readonly { readonly unitId: string; readonly name: string }[];
  readonly initialSection: UnitSection;
}) {
  // The open section is local state: writing it to the address re-rendered the page on every tap
  // and made the accordion jump (Phase 4 audit). `?section=` still opens a section on arrival.
  const [section, setSection] = useState<UnitSection | null>(initialSection);
  const onSection = (next: UnitSection) => setSection(next);
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
  const changeCount = [
    form.formState.isDirty,
    photos.dirty,
    priceDirty,
    rulesDirty,
    leaseDirty,
    amenitiesDirty,
  ].filter(Boolean).length;
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

  const errors = form.formState.errors;
  const bedrooms = watched.bedrooms;
  const basicsSummary = [
    `${watched.max_guests} ${watched.max_guests === 1 ? 'guest' : 'guests'}`,
    ...(isBed
      ? []
      : [bedrooms === 0 ? 'Studio' : `${bedrooms} ${bedrooms === 1 ? 'bedroom' : 'bedrooms'}`]),
    `${watched.beds} ${watched.beds === 1 ? 'bed' : 'beds'}`,
    `${watched.bathrooms} ${watched.bathrooms === 1 ? 'bath' : 'baths'}`,
  ].join(' · ');

  const basics = (
    <div className="flex flex-col gap-5">
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
      <RowGroup
        title="The space"
        footer={
          errors.floor_area_sqm ? (
            <span className="text-destructive">{errors.floor_area_sqm.message}</span>
          ) : undefined
        }
      >
        <RowControl label="Guests" labelFor="unit-guests">
          <Controller
            control={form.control}
            name="max_guests"
            render={({ field }) => (
              <InlineStepper
                id="unit-guests"
                label="Guests"
                value={field.value}
                onValueChange={field.onChange}
                min={1}
                max={30}
              />
            )}
          />
        </RowControl>
        {!isBed ? (
          <RowControl
            label="Bedrooms"
            hint={bedrooms === 0 ? 'Studio' : undefined}
            labelFor="unit-bedrooms"
          >
            <Controller
              control={form.control}
              name="bedrooms"
              render={({ field }) => (
                <InlineStepper
                  id="unit-bedrooms"
                  label="Bedrooms"
                  value={field.value}
                  onValueChange={field.onChange}
                  min={0}
                  max={20}
                />
              )}
            />
          </RowControl>
        ) : null}
        <RowControl label="Beds" labelFor="unit-beds">
          <Controller
            control={form.control}
            name="beds"
            render={({ field }) => (
              <InlineStepper
                id="unit-beds"
                label="Beds"
                value={field.value}
                onValueChange={field.onChange}
                min={0}
                max={40}
              />
            )}
          />
        </RowControl>
        <RowControl label="Bathrooms" hint="Half for a toilet only" labelFor="unit-baths">
          <Controller
            control={form.control}
            name="bathrooms"
            render={({ field }) => (
              <InlineStepper
                id="unit-baths"
                label="Bathrooms"
                value={field.value}
                onValueChange={field.onChange}
                min={0}
                max={20}
                step={0.5}
              />
            )}
          />
        </RowControl>
        <RowControl label="Floor area" hint="Optional" labelFor="unit-area">
          <Controller
            control={form.control}
            name="floor_area_sqm"
            render={({ field }) => (
              <span className="flex items-center gap-1.5">
                <Input
                  id="unit-area"
                  inputMode="decimal"
                  className="w-20 text-right tabular"
                  aria-invalid={errors.floor_area_sqm ? true : undefined}
                  value={field.value === null ? '' : String(field.value)}
                  onChange={(event) => {
                    const raw = event.target.value.replace(/[^\d.]/g, '');
                    field.onChange(raw === '' ? null : Number(raw));
                  }}
                  onBlur={field.onBlur}
                />
                <span className="text-sm text-muted-foreground">m²</span>
              </span>
            )}
          />
        </RowControl>
      </RowGroup>
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

  const photoCount = photos.tiles.length;
  const amenityLabels = (amenities.data ?? [])
    .filter((item) => amenityIds.includes(item.id))
    .map((item) => item.label);
  const summaries: Record<UnitSection, string> = {
    basics: basicsSummary,
    photos:
      photoCount === 0
        ? 'Add at least 3 photos'
        : `${photoCount} ${photoCount === 1 ? 'photo' : 'photos'}${photoCount < 3 ? ' · add at least 3' : ''}`,
    price: isLong
      ? lease.monthlyRent === null
        ? 'No rent yet'
        : `${formatPesos(lease.monthlyRent)} a month · ${lease.depositMonths} months deposit`
      : priceSummary(price),
    amenities:
      amenityLabels.length === 0
        ? 'None picked yet'
        : amenityLabels.length <= 3
          ? amenityLabels.join(', ')
          : `${amenityLabels.slice(0, 2).join(', ')} and ${amenityLabels.length - 2} more`,
    rules: isLong ? 'Set under Price' : rulesSummary(rules),
  };
  const needsYou: Record<UnitSection, boolean> = {
    basics: false,
    photos: photoCount < 3,
    price: isLong ? lease.monthlyRent === null : price.baseNightly === null,
    amenities: amenityIds.length === 0,
    rules: false,
  };

  return (
    <section className="space-y-5 pb-24 lg:pb-20">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h1 className="line-clamp-2 font-heading text-2xl font-semibold">{unit.name}</h1>
        <UnitStatusBadge status={unit.status} />
        <p className="w-full text-sm text-muted-foreground">{UNIT_TYPE_LABEL[unit.unit_type]}</p>
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

      <EditorSections
        label="Unit sections"
        value={section}
        onValueChange={setSection}
        sections={SECTIONS.map((item) => ({
          value: item.value,
          label: item.label,
          summary: summaries[item.value],
          needsYou: needsYou[item.value],
          content: content[item.value],
        }))}
      />

      <SaveBar
        dirty={dirty}
        state={state}
        canSave={!photos.busy}
        changes={changeCount}
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
