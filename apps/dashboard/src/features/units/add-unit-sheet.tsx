import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { BedDoubleIcon, DoorClosedIcon, HomeIcon } from 'lucide-react';
import {
  ROOM_GUESTS,
  readErrorDetails,
  slugifyPropertyName,
  type OwnerUnitListItemView,
  type RoomGuests,
  type UnitMode,
  type UnitType,
} from '@smartapp/core';
import { Alert, AlertDescription } from '@smartapp/ui/components/alert';
import { Button } from '@smartapp/ui/components/button';
import { Field, FieldDescription, FieldError, FieldLabel } from '@smartapp/ui/components/field';
import { Input } from '@smartapp/ui/components/input';
import { NativeSelect, NativeSelectOption } from '@smartapp/ui/components/native-select';
import { AppSheet } from '@smartapp/ui/compositions/app-sheet';
import { AsyncButton } from '@smartapp/ui/compositions/async-button';
import { RowControl, RowGroup } from '@smartapp/ui/compositions/grouped-rows';
import { InlineStepper } from '@smartapp/ui/compositions/inline-stepper';
import { MoneyInput } from '@smartapp/ui/compositions/money-input';
import { RadioCards } from '@smartapp/ui/compositions/radio-cards';
import { SegmentedControl } from '@smartapp/ui/compositions/segmented-control';
import { useDashboard } from '@/app/dashboard-context';
import { extractAppError } from '@/data/shared';
import { useCreateBedSpacesMutation, useSaveUnitMutation } from '@/data/units/writes';
import {
  deriveDefaultUnitMode,
  nextBedNumberForRoom,
  nextNewRoomName,
  summarizeBedSpaceRooms,
} from './bed-space-helpers';
import { ROOM_GUESTS_LABEL } from './unit-words';

const NEW_ROOM_VALUE = '__new__';

const TYPE_OPTIONS: readonly {
  value: UnitType;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    value: 'entire_place',
    label: 'Whole place',
    description: 'Guests have it to themselves',
    icon: <HomeIcon />,
  },
  {
    value: 'private_room',
    label: 'Private room',
    description: 'A room in a shared place',
    icon: <DoorClosedIcon />,
  },
  {
    value: 'bed_space',
    label: 'Bed space',
    description: 'A bed in a shared room, like a dorm',
    icon: <BedDoubleIcon />,
  },
];

/**
 * The short "Add unit" and "Add bed spaces" sheet (P4-5, D72, FIX-1 C & D). It lives in the
 * address (`?add=unit` or `?add=beds&room=...`), preselects the property's majority mode, lets
 * owners pick an existing room or type a new one while continuing bed numbering after that room's
 * highest bed, and saving replaces that history entry with the new unit's page.
 */
export function AddUnitSheet({
  open,
  kind,
  propertyId,
  units,
  initialRoom,
  onKindChange,
  onClose,
}: {
  readonly open: boolean;
  readonly kind: 'unit' | 'beds';
  readonly propertyId: string | null;
  readonly units: readonly OwnerUnitListItemView[];
  readonly initialRoom?: string | null | undefined;
  readonly onKindChange: (kind: 'unit' | 'beds') => void;
  readonly onClose: () => void;
}) {
  const [submitLabel, setSubmitLabel] = useState(
    kind === 'beds' ? 'Create 4 beds' : 'Save and add photos',
  );
  const [busy, setBusy] = useState(false);
  const handleFooterSync = useCallback((label: string, isBusy: boolean) => {
    setSubmitLabel(label);
    setBusy(isBusy);
  }, []);

  const footer = (
    <>
      <Button
        data-sheet-cancel=""
        type="button"
        variant="outline"
        className="min-h-11"
        onClick={onClose}
      >
        Cancel
      </Button>
      <AsyncButton
        type="submit"
        form="add-unit-form"
        className="min-h-11"
        state={busy ? 'busy' : 'idle'}
      >
        {submitLabel}
      </AsyncButton>
    </>
  );

  return (
    <AppSheet
      open={open}
      onOpenChange={(next) => !next && onClose()}
      height="full"
      title={kind === 'beds' ? 'Add bed spaces' : 'Add a unit'}
      description={
        kind === 'beds'
          ? 'Beds in one room share their photos and price. You can change each bed later.'
          : 'Start with the basics. Photos come next.'
      }
      footer={footer}
    >
      {open ? (
        <AddUnitForm
          key={`${initialRoom ?? ''}`}
          kind={kind}
          propertyId={propertyId}
          units={units}
          initialRoom={initialRoom}
          onKindChange={onKindChange}
          onClose={onClose}
          onFooterSync={handleFooterSync}
        />
      ) : null}
    </AppSheet>
  );
}

function AddUnitForm({
  kind,
  propertyId,
  units,
  initialRoom,
  onKindChange,
  onClose,
  onFooterSync,
}: {
  readonly kind: 'unit' | 'beds';
  readonly propertyId: string | null;
  readonly units: readonly OwnerUnitListItemView[];
  readonly initialRoom?: string | null | undefined;
  readonly onKindChange: (kind: 'unit' | 'beds') => void;
  readonly onClose: () => void;
  readonly onFooterSync: (label: string, busy: boolean) => void;
}) {
  const navigate = useNavigate();
  const { today } = useDashboard();
  const saveUnit = useSaveUnitMutation();
  const createBeds = useCreateBedSpacesMutation();

  const existingRooms = useMemo(() => summarizeBedSpaceRooms(units), [units]);
  const defaultMode = useMemo(() => deriveDefaultUnitMode(units), [units]);
  const defaultNewRoom = useMemo(() => nextNewRoomName(units), [units]);

  // `?room=` carries the room's id (R-1b).
  const matchedInitialRoom = initialRoom
    ? existingRooms.find((r) => r.id === initialRoom)
    : undefined;

  const [unitType, setUnitType] = useState<Exclude<UnitType, 'bed_space'>>('entire_place');
  const [mode, setMode] = useState<UnitMode>(defaultMode);
  const [name, setName] = useState('');
  const [guests, setGuests] = useState(2);
  const [roomChoice, setRoomChoice] = useState<string>(() =>
    matchedInitialRoom ? matchedInitialRoom.id : NEW_ROOM_VALUE,
  );
  const [newRoomName, setNewRoomName] = useState<string>(defaultNewRoom);
  const [roomGuests, setRoomGuests] = useState<RoomGuests>('anyone');
  const [beds, setBeds] = useState(() => (matchedInitialRoom ? 1 : 4));
  const [price, setPrice] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [limit, setLimit] = useState<{ limit: number; used: number } | null>(null);

  const busy = saveUnit.isPending || createBeds.isPending;
  const per = mode === 'long_term' ? 'a month' : 'a night';
  const selectedType: UnitType = kind === 'beds' ? 'bed_space' : unitType;

  const chosenRoom =
    roomChoice === NEW_ROOM_VALUE ? undefined : existingRooms.find((r) => r.id === roomChoice);
  const isExistingRoomSelected = chosenRoom !== undefined;
  const effectiveRoom = chosenRoom ? chosenRoom.label : newRoomName;
  const startNumber = nextBedNumberForRoom(existingRooms, chosenRoom?.id ?? null);
  const endNumber = startNumber + beds - 1;

  const computedSubmitLabel =
    kind === 'beds'
      ? isExistingRoomSelected
        ? `Add ${beds} ${beds === 1 ? 'bed' : 'beds'}`
        : `Create ${beds} ${beds === 1 ? 'bed' : 'beds'}`
      : 'Save and add photos';

  useEffect(() => {
    onFooterSync(computedSubmitLabel, busy);
  }, [computedSubmitLabel, busy, onFooterSync]);

  function selectType(next: UnitType) {
    if (next === 'bed_space') {
      if (kind !== 'beds') onKindChange('beds');
    } else {
      setUnitType(next);
      if (kind !== 'unit') onKindChange('unit');
    }
  }

  function done(unitId: string) {
    void navigate({
      to: '/units/$unitId',
      params: { unitId },
      search: { section: 'photos' },
      replace: true,
    });
  }

  async function submit() {
    const next: Record<string, string> = {};
    if (kind === 'unit' && !name.trim()) next.name = 'Enter the unit name.';
    if (kind === 'beds' && !effectiveRoom.trim()) next.room = 'Enter the room name.';
    if (
      kind === 'beds' &&
      !chosenRoom &&
      existingRooms.some((r) => r.label.toLowerCase() === newRoomName.trim().toLowerCase())
    ) {
      next.room = 'You already have a room with this name. Pick it above, or use another name.';
    }
    if (price === null || price <= 0) next.price = 'Enter a price above ₱0.';
    setErrors(next);
    setLimit(null);
    if (Object.keys(next).length > 0 || propertyId === null || price === null) return;
    try {
      if (kind === 'beds') {
        const created = await createBeds.mutateAsync({
          propertyId,
          room: chosenRoom
            ? { kind: 'existing', roomId: chosenRoom.id }
            : {
                kind: 'new',
                name: newRoomName.trim().slice(0, 40),
                guests: roomGuests,
                bathroom: 'shared',
              },
          namePrefix: 'Bed',
          count: beds,
          startNumber,
          mode,
          bathrooms: 1,
          description: null,
          amenityIds: [],
          monthlyRentCentavos: mode === 'long_term' ? price : null,
          baseNightlyCentavos: mode === 'short_stay' ? price : null,
        });
        // Beds share the room's photos and amenities, so the room is the next stop (R-1b).
        const roomId = created[0]?.room_id ?? null;
        if (roomId) {
          void navigate({
            to: '/units/rooms/$roomId',
            params: { roomId },
            ...(chosenRoom ? {} : { hash: 'photos' }),
            replace: true,
          });
        } else {
          onClose();
        }
        return;
      }
      const saved = await saveUnit.mutateAsync({
        propertyId,
        unitId: null,
        expectedUpdatedAt: null,
        name: name.trim(),
        slug: slugifyPropertyName(name) || 'unit',
        mode,
        unitType,
        roomId: null,
        description: null,
        maxGuests: guests,
        bedrooms: unitType === 'entire_place' ? 1 : 0,
        beds: 1,
        bathrooms: 1,
        floorAreaSqm: null,
        arrivalInfo: null,
        amenityIds: [],
        stayTerms:
          mode === 'short_stay'
            ? {
                base_nightly_centavos: price,
                base_guests: Math.min(2, guests),
                min_nights: 1,
                max_nights: 30,
                prep_nights: 0,
                weekly_discount_percent: 0,
                monthly_discount_percent: 0,
                down_payment_percent: 50,
                hold_minutes: 60,
                advance_notice_days: 0,
                booking_window_days: 365,
              }
            : null,
        leaseTerms:
          mode === 'long_term' && today
            ? {
                monthly_rent_centavos: price,
                min_lease_months: 1,
                advance_months: 1,
                deposit_months: 1,
                reservation_fee_centavos: 0,
                available_from: today,
                inclusions: null,
              }
            : null,
      });
      done(saved.unit.id);
    } catch (caught) {
      const error = extractAppError(caught);
      const details = readErrorDetails(error);
      if (details.reason === 'unit_limit' && details.limit !== null) {
        setLimit({ limit: details.limit, used: details.used ?? details.limit });
        return;
      }
      if (details.fields.slug) {
        setErrors({ name: 'Another unit already uses this name. Try another.' });
        return;
      }
      setErrors({ form: error.message });
    }
  }

  const priceLabel =
    kind === 'beds'
      ? mode === 'long_term'
        ? 'Monthly rent for each bed'
        : 'Nightly price for each bed'
      : mode === 'long_term'
        ? 'Monthly rent'
        : 'Nightly price';

  return (
    <form
      id="add-unit-form"
      noValidate
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      {limit ? (
        <Alert>
          <AlertDescription>
            You&apos;re using {limit.used} of {limit.limit} units.{' '}
            <Link to="/settings/plan" className="font-medium text-primary-hover underline">
              More units come with your plan.
            </Link>
          </AlertDescription>
        </Alert>
      ) : null}
      {errors.form ? (
        <Alert variant="destructive">
          <AlertDescription>{errors.form}</AlertDescription>
        </Alert>
      ) : null}
      <Field>
        <FieldLabel id="add-type-label">What do guests get?</FieldLabel>
        <RadioCards
          aria-labelledby="add-type-label"
          columns={1}
          options={TYPE_OPTIONS}
          value={selectedType}
          onValueChange={selectType}
        />
      </Field>

      {kind === 'unit' ? (
        <>
          <Field data-invalid={errors.name ? true : undefined}>
            <FieldLabel htmlFor="add-name">Unit name</FieldLabel>
            <Input
              id="add-name"
              value={name}
              maxLength={80}
              placeholder="e.g. Suite A"
              aria-invalid={errors.name ? true : undefined}
              onChange={(event) => setName(event.target.value)}
            />
            <FieldError>{errors.name}</FieldError>
          </Field>
          <RowGroup>
            <RowControl label="Guests" hint="The most people who can stay">
              <InlineStepper
                id="add-guests"
                label="guests"
                value={guests}
                onValueChange={setGuests}
                min={1}
                max={30}
              />
            </RowControl>
          </RowGroup>
        </>
      ) : (
        <>
          {existingRooms.length > 0 ? (
            <Field>
              <FieldLabel htmlFor="add-room-select">Room</FieldLabel>
              <NativeSelect
                id="add-room-select"
                className="w-full"
                value={chosenRoom ? chosenRoom.id : NEW_ROOM_VALUE}
                onChange={(event) => {
                  const value = event.target.value;
                  setRoomChoice(value);
                  setErrors((prev) => ({ ...prev, room: '' }));
                }}
              >
                {existingRooms.map((r) => (
                  <NativeSelectOption key={r.id} value={r.id}>
                    {r.label} ({r.count} {r.count === 1 ? 'bed' : 'beds'})
                  </NativeSelectOption>
                ))}
                <NativeSelectOption value={NEW_ROOM_VALUE}>New room…</NativeSelectOption>
              </NativeSelect>
            </Field>
          ) : null}
          {!isExistingRoomSelected ? (
            <Field data-invalid={errors.room ? true : undefined}>
              <FieldLabel htmlFor="add-room">
                {existingRooms.length > 0 ? 'New room name' : 'Room name'}
              </FieldLabel>
              <Input
                id="add-room"
                value={newRoomName}
                maxLength={40}
                aria-invalid={errors.room ? true : undefined}
                onChange={(event) => setNewRoomName(event.target.value)}
              />
              <FieldError>{errors.room}</FieldError>
            </Field>
          ) : null}
          {!isExistingRoomSelected ? (
            <Field>
              <FieldLabel id="add-room-guests-label">Who can stay</FieldLabel>
              <SegmentedControl
                aria-labelledby="add-room-guests-label"
                value={roomGuests}
                onValueChange={setRoomGuests}
                options={ROOM_GUESTS.map((value) => ({ value, label: ROOM_GUESTS_LABEL[value] }))}
              />
            </Field>
          ) : null}
          <RowGroup
            footer={
              <span aria-live="polite">
                Bed {startNumber}
                {beds > 1 ? ` … Bed ${endNumber}` : ''} in {effectiveRoom.trim() || 'this room'}
              </span>
            }
          >
            <RowControl label={isExistingRoomSelected ? 'Beds to add' : 'Beds in this room'}>
              <InlineStepper
                id="add-beds"
                label="beds"
                value={beds}
                onValueChange={setBeds}
                min={1}
                max={20}
              />
            </RowControl>
          </RowGroup>
        </>
      )}

      <Field>
        <FieldLabel id="add-mode-label">How guests rent it</FieldLabel>
        <SegmentedControl
          aria-labelledby="add-mode-label"
          value={mode}
          onValueChange={setMode}
          options={[
            { value: 'short_stay', label: 'Nightly stays' },
            { value: 'long_term', label: 'Monthly rent' },
          ]}
        />
      </Field>
      <Field data-invalid={errors.price ? true : undefined}>
        <FieldLabel htmlFor="add-price">{priceLabel}</FieldLabel>
        <MoneyInput
          id="add-price"
          value={price}
          per={per}
          onValueChange={setPrice}
          invalid={errors.price !== undefined}
        />
        {kind === 'unit' && mode === 'short_stay' ? (
          <FieldDescription>For up to 2 guests. Change it any time.</FieldDescription>
        ) : null}
        <FieldError>{errors.price}</FieldError>
      </Field>
    </form>
  );
}
