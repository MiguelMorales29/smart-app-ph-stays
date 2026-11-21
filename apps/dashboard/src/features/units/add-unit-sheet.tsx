import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { BedDoubleIcon, DoorClosedIcon, HomeIcon } from 'lucide-react';
import {
  readErrorDetails,
  slugifyPropertyName,
  type UnitMode,
  type UnitType,
} from '@smartapp/core';
import { Alert, AlertDescription } from '@smartapp/ui/components/alert';
import { Button } from '@smartapp/ui/components/button';
import { Field, FieldDescription, FieldError, FieldLabel } from '@smartapp/ui/components/field';
import { Input } from '@smartapp/ui/components/input';
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
 * The short "Add unit" and "Add bed spaces" sheet (P4-5, D72). It lives in the address
 * (`?add=unit` or `?add=beds`), asks one question ("What do guests get?") at the top, and saving
 * replaces that history entry with the new unit's page.
 */
export function AddUnitSheet({
  open,
  kind,
  propertyId,
  unitCount,
  onKindChange,
  onClose,
}: {
  readonly open: boolean;
  readonly kind: 'unit' | 'beds';
  readonly propertyId: string | null;
  readonly unitCount: number;
  readonly onKindChange: (kind: 'unit' | 'beds') => void;
  readonly onClose: () => void;
}) {
  const navigate = useNavigate();
  const { today } = useDashboard();
  const saveUnit = useSaveUnitMutation();
  const createBeds = useCreateBedSpacesMutation();
  const [unitType, setUnitType] = useState<Exclude<UnitType, 'bed_space'>>('entire_place');
  const [mode, setMode] = useState<UnitMode>('short_stay');
  const [name, setName] = useState('');
  const [guests, setGuests] = useState(2);
  const [room, setRoom] = useState(`Room ${unitCount + 1}`);
  const [beds, setBeds] = useState(4);
  const [price, setPrice] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [limit, setLimit] = useState<{ limit: number; used: number } | null>(null);
  const busy = saveUnit.isPending || createBeds.isPending;
  const per = mode === 'long_term' ? 'a month' : 'a night';
  const selectedType: UnitType = kind === 'beds' ? 'bed_space' : unitType;

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
    if (kind === 'beds' && !room.trim()) next.room = 'Enter the room name.';
    if (price === null || price <= 0) next.price = 'Enter a price above ₱0.';
    setErrors(next);
    setLimit(null);
    if (Object.keys(next).length > 0 || propertyId === null || price === null) return;
    try {
      if (kind === 'beds') {
        const created = await createBeds.mutateAsync({
          propertyId,
          groupLabel: room.trim().slice(0, 40),
          namePrefix: 'Bed',
          count: beds,
          startNumber: 1,
          mode,
          bathrooms: 1,
          description: null,
          amenityIds: [],
          monthlyRentCentavos: mode === 'long_term' ? price : null,
          baseNightlyCentavos: mode === 'short_stay' ? price : null,
        });
        const first = created[0];
        if (first) done(first.id);
        else onClose();
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
        groupLabel: null,
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
                hold_minutes: 120,
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
        {kind === 'beds' ? `Create ${beds} ${beds === 1 ? 'bed' : 'beds'}` : 'Save and add photos'}
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
              You're using {limit.used} of {limit.limit} units.{' '}
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
            <Field data-invalid={errors.room ? true : undefined}>
              <FieldLabel htmlFor="add-room">Room name</FieldLabel>
              <Input
                id="add-room"
                value={room}
                maxLength={40}
                aria-invalid={errors.room ? true : undefined}
                onChange={(event) => setRoom(event.target.value)}
              />
              <FieldError>{errors.room}</FieldError>
            </Field>
            <RowGroup
              footer={
                <span aria-live="polite">
                  Bed 1{beds > 1 ? ` … Bed ${beds}` : ''} in {room.trim() || 'this room'}
                </span>
              }
            >
              <RowControl label="Beds in this room">
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
              { value: 'short_stay', label: 'By the night' },
              { value: 'long_term', label: 'By the month' },
            ]}
          />
        </Field>
        <Field data-invalid={errors.price ? true : undefined}>
          <FieldLabel htmlFor="add-price">
            {kind === 'beds' ? 'Price for each bed' : 'Price'}
          </FieldLabel>
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
    </AppSheet>
  );
}
