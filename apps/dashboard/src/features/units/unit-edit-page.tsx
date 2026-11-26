import { useEffect, useState, type ReactNode } from 'react';
import {
  Link,
  useBlocker,
  useNavigate,
  useParams,
  useRouterState,
  useSearch,
} from '@tanstack/react-router';
import {
  BedDoubleIcon,
  CalendarClockIcon,
  ChevronRightIcon,
  DoorOpenIcon,
  CheckCircle2Icon,
  CircleIcon,
  ImageIcon,
  SparklesIcon,
  TagIcon,
} from 'lucide-react';
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
  type RoomsRow,
} from '@smartapp/core';
import { Alert, AlertDescription, AlertTitle } from '@smartapp/ui/components/alert';
import { Button } from '@smartapp/ui/components/button';
import { Field, FieldDescription, FieldError, FieldLabel } from '@smartapp/ui/components/field';
import { Input } from '@smartapp/ui/components/input';
import { Skeleton } from '@smartapp/ui/components/skeleton';
import { Textarea } from '@smartapp/ui/components/textarea';
import { DraftNotice } from '@smartapp/ui/compositions/draft-notice';
import { AsyncButton } from '@smartapp/ui/compositions/async-button';
import { ErrorState } from '@smartapp/ui/compositions/error-state';
import { RowControl, RowGroup } from '@smartapp/ui/compositions/grouped-rows';
import { InlineStepper } from '@smartapp/ui/compositions/inline-stepper';
import { PhotoCropSheet } from '@smartapp/ui/compositions/photo-crop-sheet';
import { PhotoManager } from '@smartapp/ui/compositions/photo-manager';
import {
  PriceEditor,
  type PriceDraft,
  type PriceDraftErrors,
} from '@smartapp/ui/compositions/price-editor';
import { LeaveGuardDialog, SaveBar } from '@smartapp/ui/compositions/save-bar';
import { SettingsList, type SettingsListRow } from '@smartapp/ui/compositions/settings-list';
import { useFormDraft } from '@smartapp/ui/hooks/use-form-draft';
import { notify } from '@smartapp/ui/lib/notify';
import { useDashboard } from '@/app/dashboard-context';
import { AmenitiesField, PROPERTY_AMENITIES_NOTE } from '@/app/amenities/amenities-field';
import { usePhotoPipeline } from '@/app/photos/use-photo-pipeline';
import { useSetUnitPhotosMutation } from '@/data/photos/upload';
import { useOwnerPropertyQuery } from '@/data/property/reads';
import { useSaveUnitPricesMutation } from '@/data/prices/writes';
import { extractAppError } from '@/data/shared';
import { saveUnitInputFromDetail } from '@/data/units/bulk';
import { useAmenitiesQuery, useOwnerUnitQuery, useOwnerUnitsQuery } from '@/data/units/reads';
import { useSaveUnitMutation, useSetUnitStatusMutation } from '@/data/units/writes';
import { applyAppErrorToForm } from '@/data/use-form-errors';
import { UnitNotReadySheet, type NotReadyState } from './unit-not-ready-sheet';
import {
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
import {
  ROOM_BATHROOM_LABEL,
  ROOM_GUESTS_LABEL,
  UNIT_TYPE_LABEL,
  UnitStatusBadge,
} from './unit-words';

export type UnitSection = 'basics' | 'photos' | 'price' | 'amenities' | 'rules';

export interface UnitEditSearch {
  readonly section?: UnitSection;
}

const SECTIONS: readonly { value: UnitSection; label: string; icon: ReactNode }[] = [
  { value: 'basics', label: 'Basics', icon: <BedDoubleIcon /> },
  { value: 'photos', label: 'Photos', icon: <ImageIcon /> },
  { value: 'price', label: 'Price', icon: <TagIcon /> },
  { value: 'amenities', label: 'Amenities', icon: <SparklesIcon /> },
  { value: 'rules', label: 'Booking rules', icon: <CalendarClockIcon /> },
];

const WIDE_QUERY = '(min-width: 1024px)';

/** True from 1,024 px, where Edit unit shows the section list and the open section side by side. */
function useWideEditor(): boolean {
  const [wide, setWide] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(WIDE_QUERY).matches,
  );
  useEffect(() => {
    const query = window.matchMedia(WIDE_QUERY);
    const onChange = () => setWide(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);
  return wide;
}

function parseUnitSection(raw: string | undefined): UnitSection | null {
  const match = SECTIONS.find((item) => item.value === raw);
  return match ? match.value : null;
}

const basicsSchema = unitFormSchema
  .pick({
    name: true,
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

/** /units/$unitId and /units/$unitId/$section (OW-08, D66). */
export function UnitEditPage() {
  const { unitId } = useParams({ from: '/app-frame/units/$unitId' });
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

  const roomId = detail.data.unit.room_id;
  const roomBeds =
    roomId === null ? [] : (units.data ?? []).filter((item) => item.unit.room_id === roomId);

  return (
    <UnitEditor
      key={detail.data.unit.id}
      detail={detail.data}
      roomBeds={roomBeds.map((item) => ({ unitId: item.unit.id, name: item.unit.name }))}
    />
  );
}

function UnitEditor({
  detail,
  roomBeds,
}: {
  readonly detail: OwnerUnitDetailView;
  readonly roomBeds: readonly { readonly unitId: string; readonly name: string }[];
}) {
  const wide = useWideEditor();
  const navigate = useNavigate();
  const search = useSearch({ from: '/app-frame/units/$unitId' });
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const save = useSaveUnitMutation();
  const savePhotos = useSetUnitPhotosMutation();
  const savePrices = useSaveUnitPricesMutation();
  const setUnitStatus = useSetUnitStatusMutation();
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle');
  const [listing, setListing] = useState(false);
  const [notReady, setNotReady] = useState<NotReadyState | null>(null);
  const [stale, setStale] = useState(false);
  const [topError, setTopError] = useState<string | null>(null);
  const [current, setCurrent] = useState(detail);
  const unit = current.unit;
  const isBed = unit.unit_type === 'bed_space';
  const room = current.room;
  const photoLabel = room?.name ?? unit.name;

  const prefix = `/units/${unit.id}/`;
  const pathSection = pathname.startsWith(prefix)
    ? parseUnitSection(pathname.slice(prefix.length))
    : null;
  const activeSection: UnitSection | null =
    pathSection ?? search.section ?? (wide ? 'basics' : null);

  function onSection(next: UnitSection) {
    void navigate({
      to: '/units/$unitId/$section',
      params: { unitId: unit.id, section: next },
    });
  }

  // Keep `?section=` working by opening that section route directly.
  useEffect(() => {
    if (search.section && !pathSection) {
      void navigate({
        to: '/units/$unitId/$section',
        params: { unitId: unit.id, section: search.section },
        replace: true,
      });
    }
  }, [navigate, pathSection, search.section, unit.id]);

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
  const propertyAmenityIds = useOwnerPropertyQuery().data?.amenity_ids ?? [];
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
      if (rules.downPaymentKind === 'fixed' && (rules.downPaymentFixed ?? 0) <= 0) {
        nextRules.downPaymentFixed = 'Enter the down payment amount.';
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
    // Which write is running, so a failure is reported for that part only (AUDIT-1 A11).
    let step: 'details' | 'prices' | 'photos' = 'details';
    const savedParts: string[] = [];
    try {
      let latest = current;
      if (form.formState.isDirty || amenitiesDirty || leaseDirty) {
        const base = saveUnitInputFromDetail(current);
        const values = form.getValues();
        const basicsChange = form.formState.isDirty
          ? {
              name: values.name.trim(),
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
        savedParts.push('details');
      }
      if ((priceDirty || rulesDirty) && price.baseNightly !== null) {
        step = 'prices';
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
          // The prices as last read (after the details save above), so another tab's change isn't overwritten (A12).
          expectedUpdatedAt: latest.stay_terms?.updated_at ?? null,
          baseNightlyCentavos: centavos(price.baseNightly),
          baseGuests: Math.min(price.baseGuests, unit.max_guests),
          minNights: rules.minNights,
          maxNights: rules.maxNights,
          prepNights: rules.prepNights,
          weeklyDiscountPercent: price.weeklyDiscount,
          monthlyDiscountPercent: price.monthlyDiscount,
          downPaymentPercent: rules.downPaymentPercent,
          downPaymentKind: rules.downPaymentKind,
          downPaymentCentavos:
            rules.downPaymentKind === 'fixed' && rules.downPaymentFixed !== null
              ? centavos(rules.downPaymentFixed)
              : null,
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
        latest = next;
        setCurrent(next);
        setPrice(priceDraftFrom(next));
        setRules(rulesDraftFrom(next));
        savedParts.push('prices');
      }
      if (photos.dirty) {
        step = 'photos';
        const savedPhotosList = await savePhotos.mutateAsync({
          propertyId: unit.property_id,
          units: roomBeds.length > 0 ? roomBeds : [{ unitId: unit.id, name: unit.name }],
          photos: photos.photosToSave,
        });
        photos.markSaved();
        setCurrent((prev) => ({ ...prev, photos: savedPhotosList }));
      }
      setState('done');
      return true;
    } catch (caught) {
      setState('idle');
      const error = extractAppError(caught);
      if (readErrorDetails(error).reason === 'changed_elsewhere') {
        setStale(true);
        return false;
      }
      if (step !== 'details') {
        // Details (and prices) already saved stay saved; say what didn't, and keep the owner here.
        const part = step === 'prices' ? 'prices and booking rules' : 'photos';
        const kept = savedParts.length > 0 ? ` Your ${savedParts.join(' and ')} were saved.` : '';
        setTopError(`We couldn't save the ${part}: ${error.message}${kept}`);
        return false;
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
      return false;
    }
  }

  async function onListUnit() {
    setTopError(null);
    if (photos.busy) {
      setTopError('Wait for the photos to finish uploading, then list this unit.');
      return;
    }
    setListing(true);
    try {
      if (dirty) {
        const savedOk = await onSave();
        if (!savedOk) return;
      }
      const updated = await setUnitStatus.mutateAsync({
        unitId: unit.id,
        status: 'listed',
        expectedUpdatedAt: null,
      });
      setCurrent((prev) => ({ ...prev, unit: updated }));
      notify.success(`${updated.name} is now listed`);
    } catch (caught) {
      const error = extractAppError(caught);
      const details = readErrorDetails(error);
      if (details.reason === 'unit_not_ready') {
        setNotReady({
          units: [
            {
              id: unit.id,
              name: unit.name,
              missing: details.missing.length > 0 ? details.missing : ['photos', 'price'],
            },
          ],
        });
        return;
      }
      setTopError(error.message);
    } finally {
      setListing(false);
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
    isBed
      ? 'Bed space'
      : bedrooms === 0
        ? 'Studio'
        : `${bedrooms} ${bedrooms === 1 ? 'bedroom' : 'bedrooms'}`,
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
      {isBed && room ? <RoomLinkCard room={room} bedCount={roomBeds.length} /> : null}
      {isBed ? null : (
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
      )}
      {isBed ? null : (
        <Field>
          <FieldLabel htmlFor="unit-description">Description</FieldLabel>
          <Textarea
            id="unit-description"
            rows={4}
            maxLength={4000}
            {...form.register('description')}
          />
        </Field>
      )}
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

  const photoSection =
    isBed && room ? (
      <SetOnRoom room={room} what="photos" count={photos.tiles.length} />
    ) : (
      <div className="flex flex-col gap-3">
        <PhotoManager
          tiles={photos.tiles}
          max={20}
          onAdd={photos.add}
          onAdjust={photos.adjust}
          onReorder={photos.reorder}
          onAltChange={photos.setAlt}
          onRemove={photos.remove}
          onRetry={photos.retry}
        />
        <PhotoCropSheet {...photos.cropSheetProps} />
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
    ) : isBed && room ? (
      <SetOnRoom room={room} what="amenities" count={amenityIds.length} />
    ) : (
      <AmenitiesField
        catalogue={amenities.data}
        value={amenityIds}
        onChange={setAmenityIds}
        locked={propertyAmenityIds}
        lockedNote={PROPERTY_AMENITIES_NOTE}
      />
    ),
    rules: isLong ? (
      <p className="text-sm text-muted-foreground">
        Monthly units use the lease rules under Price.
      </p>
    ) : (
      <BookingRulesFields
        value={rules}
        onChange={setRules}
        errors={rulesErrors}
        nightlyPrice={price.baseNightly}
      />
    ),
  };

  const photoCount = photos.tiles.length;
  const summaries: Record<UnitSection, string> = {
    basics: basicsSummary,
    photos: `${photoCount} ${photoCount === 1 ? 'photo' : 'photos'}`,
    price: isLong
      ? lease.monthlyRent === null
        ? 'No rent yet'
        : `${formatPesos(lease.monthlyRent)} a month`
      : price.baseNightly === null
        ? 'No price yet'
        : `${formatPesos(price.baseNightly)} a night`,
    amenities: amenityIds.length === 0 ? 'None yet' : `${amenityIds.length} picked`,
    rules: isLong ? 'Set under Price' : `${rules.minNights}–${rules.maxNights} nights`,
  };
  const needsYou: Record<UnitSection, boolean> = {
    basics: false,
    photos: photoCount < 3,
    price: isLong ? lease.monthlyRent === null : price.baseNightly === null,
    amenities: amenityIds.length === 0,
    rules: false,
  };

  const rows: SettingsListRow[] = SECTIONS.map((item) => {
    const active = wide && activeSection === item.value;
    return {
      id: item.value,
      label: item.label,
      icon: item.icon,
      value: summaries[item.value],
      unfinished: needsYou[item.value],
      active,
      render: ({ className, children }) => (
        <Link
          to="/units/$unitId/$section"
          params={{ unitId: unit.id, section: item.value }}
          className={className}
          aria-current={activeSection === item.value ? 'page' : undefined}
        >
          {children}
        </Link>
      ),
    };
  });

  const unitHeader = (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <h1 className="line-clamp-2 font-heading text-2xl font-semibold">{unit.name}</h1>
      <UnitStatusBadge status={unit.status} />
      <p className="w-full text-sm text-muted-foreground">{UNIT_TYPE_LABEL[unit.unit_type]}</p>
    </div>
  );

  const savedPhotoCount = photos.tiles.filter((tile) => tile.status === 'saved').length;
  const hasEnoughPhotos = savedPhotoCount >= 3;
  const hasPrice = !needsYou.price;
  const isReadyToList = hasEnoughPhotos && hasPrice && !photos.busy;

  const readinessCard =
    unit.status !== 'listed' ? (
      <section
        aria-label="Listing readiness"
        data-slot="unit-readiness-card"
        className="space-y-3 rounded-xl border border-border bg-card p-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-0.5">
            <h2 className="text-sm font-semibold text-foreground">
              {isReadyToList ? 'Ready to list' : 'Before you list this unit'}
            </h2>
            <p className="text-xs text-muted-foreground">
              {isReadyToList
                ? 'Guests will be able to see and book this unit once listed.'
                : 'Add at least 3 photos and a price so guests can book.'}
            </p>
          </div>
          {!wide && activeSection !== null ? <UnitStatusBadge status={unit.status} /> : null}
        </div>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              {hasEnoughPhotos ? (
                <CheckCircle2Icon aria-hidden="true" className="size-4 shrink-0 text-success" />
              ) : (
                <CircleIcon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
              )}
              <span className="tabular">
                At least 3 photos ({Math.min(savedPhotoCount, 3)} of 3)
              </span>
            </span>
            {!hasEnoughPhotos && activeSection !== 'photos' ? (
              <Link
                to="/units/$unitId/$section"
                params={{ unitId: unit.id, section: 'photos' }}
                className="text-xs font-medium text-primary-hover underline-offset-4 hover-hover:hover:underline"
              >
                Add photos
              </Link>
            ) : null}
          </li>
          <li className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              {hasPrice ? (
                <CheckCircle2Icon aria-hidden="true" className="size-4 shrink-0 text-success" />
              ) : (
                <CircleIcon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
              )}
              <span>{isLong ? 'Monthly rent set' : 'Nightly price set'}</span>
            </span>
            {!hasPrice && activeSection !== 'price' ? (
              <Link
                to="/units/$unitId/$section"
                params={{ unitId: unit.id, section: 'price' }}
                className="text-xs font-medium text-primary-hover underline-offset-4 hover-hover:hover:underline"
              >
                Set price
              </Link>
            ) : null}
          </li>
        </ul>
        {isReadyToList ? (
          <AsyncButton
            type="button"
            className="min-h-11 w-full sm:min-h-9"
            state={listing ? 'busy' : 'idle'}
            onClick={() => void onListUnit()}
          >
            List this unit
          </AsyncButton>
        ) : null}
      </section>
    ) : null;

  const alerts = (
    <>
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
    </>
  );

  const openSectionMeta = SECTIONS.find((item) => item.value === activeSection);

  return (
    <div className="pb-24 lg:pb-20">
      <div className="lg:grid lg:grid-cols-[280px_minmax(0,560px)] lg:items-start lg:gap-8">
        {wide || activeSection === null ? (
          <aside className="space-y-5 lg:sticky lg:top-[calc(var(--shell-header-height)+1rem)]">
            {unitHeader}
            {readinessCard}
            {!wide ? alerts : null}
            <SettingsList label="Unit sections" groups={[{ id: 'sections', title: '', rows }]} />
          </aside>
        ) : null}

        {activeSection !== null ? (
          <section className="min-w-0 max-w-[560px] space-y-5">
            {!wide ? (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="truncate font-heading text-base font-semibold text-foreground">
                  {unit.name}
                </p>
                <UnitStatusBadge status={unit.status} />
              </div>
            ) : null}
            {!wide ? readinessCard : null}
            {alerts}
            {openSectionMeta ? (
              <h1 className="font-heading text-2xl font-semibold tracking-tight max-md:sr-only lg:text-xl">
                {openSectionMeta.label}
              </h1>
            ) : null}
            {content[activeSection]}
          </section>
        ) : null}
      </div>

      <UnitNotReadySheet
        notReady={notReady}
        onClose={() => setNotReady(null)}
        onPickSection={(_, section) => onSection(section)}
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
    </div>
  );
}

/** A bed's room, as a row that opens Edit room (R-1b). */
function RoomLinkCard({ room, bedCount }: { readonly room: RoomsRow; readonly bedCount: number }) {
  return (
    <RowGroup
      title="Room"
      footer="Name, who may stay, photos and amenities are set once for every bed."
    >
      <Link
        to="/units/rooms/$roomId"
        params={{ roomId: room.id }}
        className="press flex min-h-13 items-center gap-3 px-4 py-2.5 outline-none hover-hover:hover:bg-muted/60 focus-visible:bg-muted"
      >
        <DoorOpenIcon aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{room.name}</span>
          <span className="block truncate text-sm text-muted-foreground">
            {ROOM_GUESTS_LABEL[room.guests]} · {bedCount} {bedCount === 1 ? 'bed' : 'beds'} ·{' '}
            {ROOM_BATHROOM_LABEL[room.bathroom]}
          </span>
        </span>
        <span className="text-sm text-muted-foreground">Edit room</span>
        <ChevronRightIcon aria-hidden="true" className="size-4 text-muted-foreground" />
      </Link>
    </RowGroup>
  );
}

/** Photos and amenities of a bed come from its room (R-1b). */
function SetOnRoom({
  room,
  what,
  count,
}: {
  readonly room: RoomsRow;
  readonly what: 'photos' | 'amenities';
  readonly count: number;
}) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl border border-border bg-card p-4">
      <p className="text-sm">
        {what === 'photos'
          ? `Every bed in ${room.name} shows the room's photos (${count} now).`
          : `Every bed in ${room.name} has the room's amenities (${count} now).`}
      </p>
      <Button
        variant="outline"
        className="min-h-11 sm:min-h-9"
        nativeButton={false}
        render={<Link to="/units/rooms/$roomId" params={{ roomId: room.id }} hash={what} />}
      >
        {what === 'photos' ? <ImageIcon aria-hidden="true" /> : <SparklesIcon aria-hidden="true" />}
        {what === 'photos' ? 'Change room photos' : 'Change room amenities'}
      </Button>
    </div>
  );
}
