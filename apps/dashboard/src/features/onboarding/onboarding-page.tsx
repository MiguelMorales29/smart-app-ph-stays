import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  ArrowLeftIcon,
  BedDoubleIcon,
  CheckIcon,
  DoorClosedIcon,
  HomeIcon,
  ImagePlusIcon,
  PencilIcon,
} from 'lucide-react';
import {
  BANKS,
  CANCELLATION_PRESET_COPY,
  PH_PROVINCES,
  formatPesos,
  isValidBankAccount,
  isValidPhMobile,
  normalizeBankAccount,
  normalizePhMobile,
  regionForProvince,
  slugifyPropertyName,
  words,
  type Bank,
  type CancellationPreset,
  type OwnerUnitListItemView,
  type PaymentAccountMethod,
  type SetupChecklistItemView,
  type SetupStepKey,
  type UnitType,
} from '@smartapp/core';
import { Alert, AlertDescription } from '@smartapp/ui/components/alert';
import { Button } from '@smartapp/ui/components/button';
import { Field, FieldDescription, FieldError, FieldLabel } from '@smartapp/ui/components/field';
import { Input } from '@smartapp/ui/components/input';
import { NativeSelect, NativeSelectOption } from '@smartapp/ui/components/native-select';
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from '@smartapp/ui/components/number-field';
import { Skeleton } from '@smartapp/ui/components/skeleton';
import { Switch } from '@smartapp/ui/components/switch';
import { Toggle } from '@smartapp/ui/components/toggle';
import { AsyncButton } from '@smartapp/ui/compositions/async-button';
import { DraftNotice } from '@smartapp/ui/compositions/draft-notice';
import { ErrorState } from '@smartapp/ui/compositions/error-state';
import { MilestonePicture } from '@smartapp/ui/compositions/milestone-picture';
import { MoneyInput } from '@smartapp/ui/compositions/money-input';
import { PasswordInput } from '@smartapp/ui/compositions/password-input';
import { PhoneInput } from '@smartapp/ui/compositions/phone-input';
import { RadioCards } from '@smartapp/ui/compositions/radio-cards';
import { SlugField } from '@smartapp/ui/compositions/slug-field';
import { TimeSelect } from '@smartapp/ui/compositions/time-select';
import { useFormDraft } from '@smartapp/ui/hooks/use-form-draft';
import { cn } from '@smartapp/ui/lib/utils';
import { ApprovalBanner } from '@/app/auth/approval-banner';
import { useDashboard } from '@/app/dashboard-context';
import { useMyAccountQuery } from '@/data/auth/reads';
import { usePaymentAccountsQuery } from '@/data/payments/reads';
import { useSavePaymentAccountMutation } from '@/data/payments/writes';
import { useUploadPhotoMutation, useSetUnitPhotosMutation } from '@/data/photos/upload';
import { useSaveUnitPricesMutation } from '@/data/prices/writes';
import { useOwnerPropertyQuery, useSlugChecker } from '@/data/property/reads';
import { useSavePropertyMutation } from '@/data/property/writes';
import { useSavePoliciesMutation } from '@/data/settings/writes';
import { extractAppError } from '@/data/shared';
import { useSetupChecklistQuery } from '@/data/setup/reads';
import { useOwnerUnitsQuery } from '@/data/units/reads';
import { useCreateBedSpacesMutation, useSaveUnitMutation } from '@/data/units/writes';
import { applyAppErrorToForm } from '@/data/use-form-errors';

export type OnboardingStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

const STEPS: readonly { readonly title: string; readonly next: string }[] = [
  { title: 'Your place', next: 'First unit' },
  { title: 'First unit', next: 'Photos' },
  { title: 'Photos', next: 'Price' },
  { title: 'Price', next: 'How guests pay' },
  { title: 'How guests pay', next: 'Rules' },
  { title: 'Rules', next: 'Review' },
];

const HOUSE_RULE_CHIPS = ['No smoking', 'No pets', 'No parties', 'Quiet hours 10 PM–7 AM'] as const;

const UNIT_TYPE_OPTIONS: readonly {
  value: UnitType;
  label: string;
  description: string;
  icon: ReactNode;
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
    label: 'Bed in a shared room',
    description: 'Each bed is booked',
    icon: <BedDoubleIcon />,
  },
];

const PRESET_ORDER: readonly CancellationPreset[] = [
  'dp_rebook',
  'flexible',
  'moderate',
  'firm',
  'non_refundable',
];

const STEP_FOR_ITEM: Partial<Record<SetupStepKey, OnboardingStep>> = {
  property: 1,
  unit: 2,
  photos: 3,
  price: 4,
  payment_accounts: 5,
  rules: 6,
};

/** The first step whose checklist item is still to do, or Review when only publishing is left. */
function firstUnfinishedStep(items: readonly SetupChecklistItemView[]): OnboardingStep {
  for (const item of items) {
    const step = STEP_FOR_ITEM[item.key];
    if (step !== undefined && item.status === 'todo') return step;
  }
  return 7;
}

/** Units that still need what this step adds: the first unit, or every bed in its room. */
function firstGroup(units: readonly OwnerUnitListItemView[]): OwnerUnitListItemView[] {
  const first = units[0];
  if (!first) return [];
  if (first.unit.group_label)
    return units.filter((item) => item.unit.group_label === first.unit.group_label);
  return [first];
}

function StepFrame({
  step,
  title,
  description,
  children,
  onBack,
  onSkip,
  primary,
}: {
  readonly step: OnboardingStep;
  readonly title: string;
  readonly description?: string | undefined;
  readonly children: ReactNode;
  readonly onBack?: (() => void) | undefined;
  readonly onSkip?: (() => void) | undefined;
  readonly primary: ReactNode;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);
  return (
    <div
      key={step}
      className="flex flex-col gap-5 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-right-2 duration-base ease-enter"
    >
      <div className="space-y-1">
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="font-heading text-2xl font-semibold outline-none"
        >
          {title}
        </h1>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children}
      <div
        data-slot="onboarding-actions"
        className="sticky bottom-0 -mx-4 mt-2 flex items-center gap-2 border-t border-border bg-background/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:pb-0 sm:backdrop-blur-none"
      >
        {onBack ? (
          <Button type="button" variant="outline" className="min-h-11" onClick={onBack}>
            <ArrowLeftIcon aria-hidden="true" />
            Back
          </Button>
        ) : null}
        {onSkip ? (
          <Button type="button" variant="ghost" className="min-h-11" onClick={onSkip}>
            Do this later
          </Button>
        ) : null}
        <div className="flex-1" />
        {primary}
      </div>
    </div>
  );
}

function ProgressBar({ step }: { readonly step: OnboardingStep }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <p className="font-medium" aria-live="polite">
          {step <= 6 ? (
            <>
              Step {step} of 6{' '}
              <span className="text-muted-foreground">· {STEPS[step - 1]?.title}</span>
            </>
          ) : (
            'Review'
          )}
        </p>
        <Link
          to="/home"
          className="inline-flex min-h-11 items-center font-medium text-primary-hover underline-offset-4 hover-hover:hover:underline"
        >
          Finish later
        </Link>
      </div>
      <div className="grid grid-cols-6 gap-1" aria-hidden="true">
        {STEPS.map((item, index) => (
          <span
            key={item.title}
            className={cn(
              'h-1.5 rounded-full transition-colors duration-slow ease-enter',
              index < step ? 'bg-primary' : 'bg-muted',
            )}
          />
        ))}
      </div>
    </div>
  );
}

function PreviewCard({
  name,
  place,
  price,
  units,
}: {
  readonly name: string;
  readonly place: string;
  readonly price: string | null;
  readonly units: number;
}) {
  return (
    <aside aria-label="What guests will see" className="hidden lg:block">
      <div className="sticky top-24 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="flex aspect-[4/3] items-center justify-center bg-muted text-muted-foreground">
          <ImagePlusIcon aria-hidden="true" className="size-8" />
        </div>
        <div className="space-y-1 p-4">
          <p className="font-heading text-lg font-semibold">{name || 'Your place'}</p>
          <p className="text-sm text-muted-foreground">{place || 'Town, province'}</p>
          <p className="pt-2 text-sm">
            {price ? (
              <>
                <span className="font-semibold tabular">{price}</span> / night
              </>
            ) : (
              <span className="text-muted-foreground">Price not set yet</span>
            )}
            {units > 0 ? (
              <span className="text-muted-foreground">
                {' '}
                · {units} {units === 1 ? 'unit' : 'units'}
              </span>
            ) : null}
          </p>
        </div>
        <p className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
          Preview of your guest page
        </p>
      </div>
    </aside>
  );
}

/** /onboarding: six short steps plus Review (D48, OW-02). Each step saves on Continue. */
export function OnboardingPage() {
  const search = useSearch({ from: '/focus-frame/onboarding' });
  const navigate = useNavigate();
  const { client } = useDashboard();
  const account = useMyAccountQuery();
  const property = useOwnerPropertyQuery();
  const propertyId = property.data?.property.id ?? null;
  const units = useOwnerUnitsQuery(propertyId);
  const payments = usePaymentAccountsQuery();
  const checklist = useSetupChecklistQuery(propertyId);
  const resumeStep = checklist.data ? firstUnfinishedStep(checklist.data.items) : null;
  const step: OnboardingStep = search.step ?? resumeStep ?? 1;

  function goTo(next: OnboardingStep) {
    void navigate({ to: '/onboarding', search: { step: next } });
  }

  // Coming back without a step opens the first unfinished one (in the address, so Back works).
  useEffect(() => {
    if (search.step === undefined && resumeStep !== null) {
      void navigate({ to: '/onboarding', search: { step: resumeStep }, replace: true });
    }
  }, [navigate, resumeStep, search.step]);

  if (!client || account.isPending || property.isPending) {
    return (
      <div className="mx-auto max-w-xl space-y-4" aria-busy="true">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  if (account.isError || property.isError || !account.data) {
    return (
      <ErrorState
        title="We couldn't open your setup"
        message={extractAppError(account.error ?? property.error).message}
        onRetry={() => {
          void account.refetch();
          void property.refetch();
        }}
      />
    );
  }

  const prop = property.data?.property ?? null;
  const unitList = units.data ?? [];
  const firstUnitPrice =
    unitList.find((item) => item.stay_terms)?.stay_terms?.base_nightly_centavos ?? null;

  return (
    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[minmax(0,560px)_minmax(0,1fr)]">
      <div className="flex min-w-0 flex-col gap-6">
        <ApprovalBanner onboarding />
        <ProgressBar step={step} />
        {step === 1 ? (
          <PlaceStep account={account.data} property={prop} onDone={() => goTo(2)} />
        ) : null}
        {step === 2 ? (
          <UnitStep
            propertyId={propertyId}
            units={unitList}
            onBack={() => goTo(1)}
            onDone={() => goTo(3)}
          />
        ) : null}
        {step === 3 ? (
          <PhotosStep
            propertyId={propertyId}
            units={unitList}
            onBack={() => goTo(2)}
            onDone={() => goTo(4)}
          />
        ) : null}
        {step === 4 ? (
          <PriceStep units={unitList} onBack={() => goTo(3)} onDone={() => goTo(5)} />
        ) : null}
        {step === 5 ? (
          <PayStep
            hasAccounts={(payments.data ?? []).length > 0}
            ownerName={account.data.profile.full_name}
            onBack={() => goTo(4)}
            onDone={() => goTo(6)}
          />
        ) : null}
        {step === 6 ? (
          <RulesStep propertyId={propertyId} onBack={() => goTo(5)} onDone={() => goTo(7)} />
        ) : null}
        {step === 7 ? (
          <ReviewStep
            pending={account.data.account.status === 'pending'}
            propertyName={prop?.name ?? null}
            place={prop ? `${prop.city}, ${prop.province}` : null}
            unitCount={unitList.length}
            price={firstUnitPrice}
            photos={unitList[0]?.photo_count ?? 0}
            payments={(payments.data ?? []).length}
            preset={prop?.cancellation_preset ?? null}
            onEdit={goTo}
          />
        ) : null}
      </div>
      <PreviewCard
        name={prop?.name ?? account.data.account.name}
        place={prop ? `${prop.city}, ${prop.province}` : ''}
        price={firstUnitPrice !== null ? formatPesos(firstUnitPrice) : null}
        units={unitList.length}
      />
    </div>
  );
}

// ——— Step 1: Your place ————————————————————————————————————————————————

const placeSchema = z.object({
  name: z.string().trim().min(1, 'Enter the name guests will see.').max(80),
  slug: z
    .string()
    .min(3, 'Use 3 to 40 letters or numbers.')
    .max(40, 'Use 3 to 40 letters or numbers.'),
  province: z.string().min(1, 'Pick the province.'),
  city: z.string().trim().min(1, 'Enter the town or city.').max(80),
  addressLine: z.string().trim().min(1, 'Enter the street and number.').max(200),
});
type PlaceForm = z.infer<typeof placeSchema>;

function PlaceStep({
  account,
  property,
  onDone,
}: {
  readonly account: NonNullable<ReturnType<typeof useMyAccountQuery>['data']>;
  readonly property:
    NonNullable<ReturnType<typeof useOwnerPropertyQuery>['data']>['property'] | null;
  readonly onDone: () => void;
}) {
  const save = useSavePropertyMutation();
  const check = useSlugChecker(property?.id ?? null);
  const [slugTouched, setSlugTouched] = useState(property !== null);
  const [slugBlocked, setSlugBlocked] = useState(false);
  const [topError, setTopError] = useState<string | null>(null);
  const form = useForm<PlaceForm>({
    resolver: zodResolver(placeSchema),
    defaultValues: {
      name: property?.name ?? account.account.name,
      slug: property?.slug ?? slugifyPropertyName(account.account.name),
      province: property?.province ?? '',
      city: property?.city ?? account.application?.city ?? '',
      addressLine: property?.address_line ?? '',
    },
  });
  const draft = useFormDraft<PlaceForm>({
    key: `onboarding-place:${property?.id ?? 'new'}`,
    values: form.watch(),
    dirty: form.formState.isDirty,
    parse: (value) => {
      const parsed = placeSchema.safeParse(value);
      return parsed.success ? parsed.data : null;
    },
  });

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit(async (values) => {
        setTopError(null);
        if (slugBlocked) {
          form.setFocus('slug');
          return;
        }
        try {
          await save.mutateAsync({
            propertyId: property?.id ?? null,
            expectedUpdatedAt: property?.updated_at ?? null,
            name: values.name.trim(),
            slug: values.slug,
            tagline: property?.tagline ?? null,
            description: property?.description ?? null,
            addressLine: values.addressLine.trim(),
            barangay: property?.barangay ?? null,
            city: values.city.trim(),
            province: values.province,
            region: regionForProvince(values.province) ?? values.province,
            latitude: property?.latitude ?? null,
            longitude: property?.longitude ?? null,
            mapUrl: property?.map_url ?? null,
            showExactLocation: property?.show_exact_location ?? false,
            contact: property?.contact ?? {
              phone: account.account.contact_mobile,
              messenger: null,
              facebook: account.application?.facebook_page ?? null,
              instagram: null,
              tiktok: null,
              viber: null,
              whatsapp: null,
              google_review_url: null,
            },
            privacyContact: property?.privacy_contact ?? account.account.contact_email,
            logoFileId: property?.logo_file_id ?? null,
          });
          draft.clear();
          onDone();
        } catch (caught) {
          const applied = applyAppErrorToForm(caught, form, {
            knownFields: ['name', 'slug', 'province', 'city', 'addressLine'],
          });
          setTopError(applied.topError);
        }
      })}
    >
      <StepFrame
        step={1}
        title="Your place"
        description="Guests see this name and town on your page."
        primary={
          <AsyncButton type="submit" className="min-h-11" state={save.isPending ? 'busy' : 'idle'}>
            Continue to First unit
          </AsyncButton>
        }
      >
        {draft.saved ? (
          <DraftNotice
            onKeep={() => {
              const kept = draft.keep();
              if (kept) {
                setSlugTouched(true);
                form.reset(kept, { keepDefaultValues: true });
              }
            }}
            onDiscard={draft.discard}
          />
        ) : null}
        {topError ? (
          <Alert variant="destructive">
            <AlertDescription>{topError}</AlertDescription>
          </Alert>
        ) : null}
        <Field data-invalid={form.formState.errors.name ? true : undefined}>
          <FieldLabel htmlFor="ob-name">Place name</FieldLabel>
          <Input
            id="ob-name"
            autoComplete="organization"
            enterKeyHint="next"
            aria-invalid={form.formState.errors.name ? true : undefined}
            {...form.register('name', {
              onChange: (event: { target: { value: string } }) => {
                if (!slugTouched) form.setValue('slug', slugifyPropertyName(event.target.value));
              },
            })}
          />
          <FieldError>{form.formState.errors.name?.message}</FieldError>
        </Field>
        <Field data-invalid={form.formState.errors.slug ? true : undefined}>
          <FieldLabel htmlFor="ob-slug">Web address</FieldLabel>
          <Controller
            control={form.control}
            name="slug"
            render={({ field }) => (
              <SlugField
                id="ob-slug"
                host="smartapp.ph"
                value={field.value}
                savedValue={property?.slug}
                onValueChange={(next) => {
                  setSlugTouched(true);
                  field.onChange(next);
                }}
                onStatusChange={(status) =>
                  setSlugBlocked(
                    status === 'taken' || status === 'reserved' || status === 'invalid',
                  )
                }
                check={check}
              />
            )}
          />
          <FieldError>{form.formState.errors.slug?.message}</FieldError>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={form.formState.errors.province ? true : undefined}>
            <FieldLabel htmlFor="ob-province">Province</FieldLabel>
            <NativeSelect
              id="ob-province"
              className="w-full"
              autoComplete="address-level1"
              aria-invalid={form.formState.errors.province ? true : undefined}
              {...form.register('province')}
            >
              <NativeSelectOption value="">Pick a province</NativeSelectOption>
              {PH_PROVINCES.map((item) => (
                <NativeSelectOption key={item.name} value={item.name}>
                  {item.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <FieldError>{form.formState.errors.province?.message}</FieldError>
          </Field>
          <Field data-invalid={form.formState.errors.city ? true : undefined}>
            <FieldLabel htmlFor="ob-city">Town or city</FieldLabel>
            <Input
              id="ob-city"
              autoComplete="address-level2"
              aria-invalid={form.formState.errors.city ? true : undefined}
              {...form.register('city')}
            />
            <FieldError>{form.formState.errors.city?.message}</FieldError>
          </Field>
        </div>
        <Field data-invalid={form.formState.errors.addressLine ? true : undefined}>
          <FieldLabel htmlFor="ob-street">Street and number</FieldLabel>
          <Input
            id="ob-street"
            autoComplete="street-address"
            aria-invalid={form.formState.errors.addressLine ? true : undefined}
            {...form.register('addressLine')}
          />
          <FieldDescription>
            Guests see the exact address only after they pay, unless you change it later.
          </FieldDescription>
          <FieldError>{form.formState.errors.addressLine?.message}</FieldError>
        </Field>
      </StepFrame>
    </form>
  );
}

// ——— Step 2: First unit ————————————————————————————————————————————————

function CountField({
  id,
  label,
  value,
  onChange,
  min,
  max,
}: {
  readonly id: string;
  readonly label: string;
  readonly value: number;
  readonly onChange: (value: number) => void;
  readonly min: number;
  readonly max: number;
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <NumberField
        value={value}
        min={min}
        max={max}
        onValueChange={(next) => onChange(next ?? min)}
      >
        <NumberFieldGroup className="w-40">
          <NumberFieldDecrement aria-label={`Fewer: ${label}`} />
          <NumberFieldInput id={id} />
          <NumberFieldIncrement aria-label={`More: ${label}`} />
        </NumberFieldGroup>
      </NumberField>
    </Field>
  );
}

function UnitStep({
  propertyId,
  units,
  onBack,
  onDone,
}: {
  readonly propertyId: string | null;
  readonly units: readonly OwnerUnitListItemView[];
  readonly onBack: () => void;
  readonly onDone: () => void;
}) {
  const saveUnit = useSaveUnitMutation();
  const createBeds = useCreateBedSpacesMutation();
  const [type, setType] = useState<UnitType>('entire_place');
  const [name, setName] = useState('');
  const [guests, setGuests] = useState(2);
  const [rooms, setRooms] = useState(1);
  const [room, setRoom] = useState('Room 1');
  const [beds, setBeds] = useState(4);
  const [error, setError] = useState<string | null>(null);
  const busy = saveUnit.isPending || createBeds.isPending;

  if (propertyId === null) {
    return (
      <StepFrame step={2} title="First unit" onBack={onBack} primary={null}>
        <Alert>
          <AlertDescription>Save your place first, then add its first unit.</AlertDescription>
        </Alert>
      </StepFrame>
    );
  }

  if (units.length > 0) {
    return (
      <StepFrame
        step={2}
        title="First unit"
        description="You already have units. You can add more on the Units page any time."
        onBack={onBack}
        primary={
          <Button className="min-h-11" onClick={onDone}>
            Continue to Photos
          </Button>
        }
      >
        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {units.slice(0, 5).map((item) => (
            <li
              key={item.unit.id}
              className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
            >
              <span className="truncate font-medium">{item.unit.name}</span>
              <span className="text-muted-foreground">{item.unit.group_label ?? ''}</span>
            </li>
          ))}
        </ul>
      </StepFrame>
    );
  }

  const nameValue = type === 'bed_space' ? room : name;

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        if (!nameValue.trim()) {
          setError(type === 'bed_space' ? 'Enter the room name.' : 'Enter the unit name.');
          return;
        }
        void (async () => {
          try {
            if (type === 'bed_space') {
              await createBeds.mutateAsync({
                propertyId,
                groupLabel: room.trim().slice(0, 40),
                namePrefix: 'Bed',
                count: beds,
                startNumber: 1,
                mode: 'short_stay',
                bathrooms: 1,
                description: null,
                amenityIds: [],
                monthlyRentCentavos: null,
                baseNightlyCentavos: null,
              });
            } else {
              await saveUnit.mutateAsync({
                propertyId,
                unitId: null,
                expectedUpdatedAt: null,
                name: name.trim(),
                slug: slugifyPropertyName(name) || 'unit',
                mode: 'short_stay',
                unitType: type,
                groupLabel: null,
                description: null,
                maxGuests: guests,
                bedrooms: rooms,
                beds: Math.max(1, rooms),
                bathrooms: 1,
                floorAreaSqm: null,
                arrivalInfo: null,
                amenityIds: [],
                stayTerms: null,
                leaseTerms: null,
              });
            }
            onDone();
          } catch (caught) {
            setError(extractAppError(caught).message);
          }
        })();
      }}
    >
      <StepFrame
        step={2}
        title="First unit"
        description="Start with one. You can add the rest later."
        onBack={onBack}
        primary={
          <AsyncButton type="submit" className="min-h-11" state={busy ? 'busy' : 'idle'}>
            {type === 'bed_space' ? `Create ${beds} beds` : 'Continue to Photos'}
          </AsyncButton>
        }
      >
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <Field>
          <FieldLabel id="ob-type-label">What is it?</FieldLabel>
          <RadioCards
            aria-labelledby="ob-type-label"
            columns={1}
            options={UNIT_TYPE_OPTIONS}
            value={type}
            onValueChange={setType}
          />
        </Field>
        {type === 'bed_space' ? (
          <>
            <Field>
              <FieldLabel htmlFor="ob-room">Room name</FieldLabel>
              <Input
                id="ob-room"
                value={room}
                maxLength={40}
                onChange={(event) => setRoom(event.target.value)}
              />
              <FieldDescription>
                Beds are grouped by room, like "Room 2A · 6 beds".
              </FieldDescription>
            </Field>
            <CountField
              id="ob-beds"
              label="How many beds in this room?"
              value={beds}
              onChange={setBeds}
              min={1}
              max={20}
            />
            <p className="text-sm text-muted-foreground">
              We'll create Bed 1 to Bed {beds} in {room.trim() || 'this room'}.
            </p>
          </>
        ) : (
          <>
            <Field>
              <FieldLabel htmlFor="ob-unit-name">Unit name</FieldLabel>
              <Input
                id="ob-unit-name"
                value={name}
                maxLength={80}
                placeholder={type === 'private_room' ? 'e.g. Garden Room' : 'e.g. Suite A'}
                onChange={(event) => setName(event.target.value)}
              />
            </Field>
            <div className="flex flex-wrap gap-6">
              <CountField
                id="ob-guests"
                label="Guests"
                value={guests}
                onChange={setGuests}
                min={1}
                max={30}
              />
              <CountField
                id="ob-rooms"
                label="Bedrooms"
                value={rooms}
                onChange={setRooms}
                min={0}
                max={20}
              />
            </div>
          </>
        )}
      </StepFrame>
    </form>
  );
}

// ——— Step 3: Photos (simple picker; the full photo manager arrives in P4-5) ————————————

interface PickedPhoto {
  readonly id: string;
  readonly file: File;
  readonly url: string;
}

function PhotosStep({
  propertyId,
  units,
  onBack,
  onDone,
}: {
  readonly propertyId: string | null;
  readonly units: readonly OwnerUnitListItemView[];
  readonly onBack: () => void;
  readonly onDone: () => void;
}) {
  const upload = useUploadPhotoMutation();
  const setPhotos = useSetUnitPhotosMutation();
  const [picked, setPicked] = useState<PickedPhoto[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const group = firstGroup(units);
  const target = group[0];
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(
    () => () => {
      for (const photo of picked) URL.revokeObjectURL(photo.url);
    },
    [picked],
  );

  if (!target || propertyId === null) {
    return (
      <StepFrame step={3} title="Photos" onBack={onBack} onSkip={onDone} primary={null}>
        <Alert>
          <AlertDescription>Add your first unit, then its photos.</AlertDescription>
        </Alert>
      </StepFrame>
    );
  }

  const existing = target.photo_count;
  const label = target.unit.group_label
    ? `${target.unit.group_label} (shared by ${group.length} beds)`
    : target.unit.name;

  return (
    <StepFrame
      step={3}
      title="Photos"
      description={`Add at least 3 photos of ${label} to list it. We suggest 5 or more.`}
      onBack={onBack}
      onSkip={onDone}
      primary={
        <AsyncButton
          className="min-h-11"
          state={busy ? 'busy' : 'idle'}
          busyLabel="Uploading…"
          disabled={picked.length === 0}
          onClick={() => {
            setError(null);
            setBusy(true);
            void (async () => {
              try {
                const fileIds: string[] = [];
                for (const photo of picked) {
                  const uploaded = await upload.mutateAsync({
                    file: photo.file,
                    filename: photo.file.name,
                    purpose: 'unit_photo',
                  });
                  fileIds.push(uploaded.fileId);
                }
                await setPhotos.mutateAsync({
                  propertyId,
                  units: group.map((item) => ({ unitId: item.unit.id, name: item.unit.name })),
                  fileIds,
                });
                onDone();
              } catch (caught) {
                setError(extractAppError(caught).message);
              } finally {
                setBusy(false);
              }
            })();
          }}
        >
          Continue to Price
        </AsyncButton>
      }
    >
      {existing > 0 ? (
        <p className="text-sm text-muted-foreground">{existing} photos are already saved.</p>
      ) : null}
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          const files = [...(event.target.files ?? [])].filter((file) =>
            ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
          );
          setPicked((current) =>
            [
              ...current,
              ...files.map((file) => ({
                id: `${file.name}-${file.size}-${Math.random()}`,
                file,
                url: URL.createObjectURL(file),
              })),
            ].slice(0, 20),
          );
          event.target.value = '';
        }}
      />
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {picked.map((photo, index) => (
          <figure
            key={photo.id}
            className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-muted"
          >
            <img src={photo.url} alt={`Photo ${index + 1}`} className="size-full object-cover" />
            {index === 0 ? (
              <figcaption className="absolute top-1 left-1 rounded bg-background/90 px-1.5 py-0.5 text-xs font-medium">
                Cover
              </figcaption>
            ) : null}
          </figure>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex aspect-[4/3] min-h-11 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border bg-card text-sm text-muted-foreground outline-none hover-hover:hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <ImagePlusIcon aria-hidden="true" className="size-5" />
          Add photos
        </button>
      </div>
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {picked.length} picked. The first one is the cover.
      </p>
    </StepFrame>
  );
}

// ——— Step 4: Price ————————————————————————————————————————————————

function PriceStep({
  units,
  onBack,
  onDone,
}: {
  readonly units: readonly OwnerUnitListItemView[];
  readonly onBack: () => void;
  readonly onDone: () => void;
}) {
  const save = useSaveUnitPricesMutation();
  const group = firstGroup(units);
  const target = group[0];
  const [base, setBase] = useState<number | null>(
    target?.stay_terms?.base_nightly_centavos ?? null,
  );
  const [guests, setGuests] = useState(
    target?.stay_terms?.base_guests ?? target?.unit.max_guests ?? 2,
  );
  const [weekend, setWeekend] = useState(false);
  const [weekendPrice, setWeekendPrice] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!target) {
    return (
      <StepFrame step={4} title="Price" onBack={onBack} primary={null}>
        <Alert>
          <AlertDescription>Add your first unit, then its price.</AlertDescription>
        </Alert>
      </StepFrame>
    );
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        if (base === null || base <= 0) {
          setError('Enter a nightly price above ₱0.');
          return;
        }
        if (weekend && (weekendPrice === null || weekendPrice <= 0)) {
          setError('Enter the Friday and Saturday price, or turn it off.');
          return;
        }
        setBusy(true);
        void (async () => {
          try {
            for (const item of group) {
              const terms = item.stay_terms;
              await save.mutateAsync({
                unitId: item.unit.id,
                expectedUpdatedAt: null,
                baseNightlyCentavos: base,
                baseGuests: Math.min(guests, item.unit.max_guests),
                minNights: terms?.min_nights ?? 1,
                maxNights: terms?.max_nights ?? 30,
                prepNights: terms?.prep_nights ?? 0,
                weeklyDiscountPercent: terms?.weekly_discount_percent ?? 0,
                monthlyDiscountPercent: terms?.monthly_discount_percent ?? 0,
                downPaymentPercent: terms?.down_payment_percent ?? 50,
                holdMinutes: terms?.hold_minutes ?? 120,
                advanceNoticeDays: terms?.advance_notice_days ?? 0,
                bookingWindowDays: terms?.booking_window_days ?? 365,
                weekdayRates:
                  weekend && weekendPrice !== null
                    ? [
                        { iso_weekday: 5, nightly_centavos: weekendPrice },
                        { iso_weekday: 6, nightly_centavos: weekendPrice },
                      ]
                    : [],
                rateOverrides: [],
                fees: [],
              });
            }
            onDone();
          } catch (caught) {
            setError(extractAppError(caught).message);
          } finally {
            setBusy(false);
          }
        })();
      }}
    >
      <StepFrame
        step={4}
        title="Price"
        description={
          group.length > 1
            ? `One price for all ${group.length} beds in ${target.unit.group_label ?? 'this room'}.`
            : `For ${target.unit.name}.`
        }
        onBack={onBack}
        primary={
          <AsyncButton type="submit" className="min-h-11" state={busy ? 'busy' : 'idle'}>
            Continue to How guests pay
          </AsyncButton>
        }
      >
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <Field>
          <FieldLabel htmlFor="ob-base">Price per night</FieldLabel>
          <MoneyInput id="ob-base" value={base} onValueChange={setBase} />
        </Field>
        {group.length === 1 ? (
          <CountField
            id="ob-base-guests"
            label="Guests included"
            value={guests}
            onChange={setGuests}
            min={1}
            max={target.unit.max_guests}
          />
        ) : null}
        <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-card p-3">
          <div className="space-y-0.5">
            <label htmlFor="ob-weekend" className="text-sm font-medium">
              Charge more on some days?
            </label>
            <p className="text-sm text-muted-foreground">
              Friday and Saturday nights. A Friday night means checking in on Friday.
            </p>
          </div>
          <Switch id="ob-weekend" checked={weekend} onCheckedChange={setWeekend} />
        </div>
        {weekend ? (
          <Field>
            <FieldLabel htmlFor="ob-weekend-price">Friday and Saturday price</FieldLabel>
            <MoneyInput
              id="ob-weekend-price"
              value={weekendPrice}
              onValueChange={setWeekendPrice}
            />
          </Field>
        ) : null}
        <p className="text-sm text-muted-foreground">
          Special dates, fees and discounts are on the unit's page later.
        </p>
      </StepFrame>
    </form>
  );
}

// ——— Step 5: How guests pay ————————————————————————————————————————————————

const METHOD_OPTIONS: readonly {
  value: Exclude<PaymentAccountMethod, 'qr_ph'>;
  label: string;
  description: string;
}[] = [
  { value: 'gcash', label: 'GCash', description: 'Your GCash number' },
  { value: 'maya', label: 'Maya', description: 'Your Maya number' },
  { value: 'bank', label: 'Bank', description: 'A bank account' },
];

function PayStep({
  hasAccounts,
  ownerName,
  onBack,
  onDone,
}: {
  readonly hasAccounts: boolean;
  readonly ownerName: string;
  readonly onBack: () => void;
  readonly onDone: () => void;
}) {
  const save = useSavePaymentAccountMutation();
  const [method, setMethod] = useState<Exclude<PaymentAccountMethod, 'qr_ph'>>('gcash');
  const [accountName, setAccountName] = useState(ownerName);
  const [mobile, setMobile] = useState('');
  const [bank, setBank] = useState<Bank>('bdo');
  const [bankNumber, setBankNumber] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (hasAccounts) {
    return (
      <StepFrame
        step={5}
        title="How guests pay"
        description="You already have a way to pay. Manage it in Settings any time."
        onBack={onBack}
        primary={
          <Button className="min-h-11" onClick={onDone}>
            Continue to Rules
          </Button>
        }
      >
        <p className="flex items-center gap-2 text-sm">
          <CheckIcon aria-hidden="true" className="size-4 text-success" />
          Payment account added
        </p>
      </StepFrame>
    );
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const next: Record<string, string> = {};
        if (!accountName.trim())
          next.accountName = 'Type the name exactly as your account shows it.';
        const number =
          method === 'bank' ? normalizeBankAccount(bankNumber) : normalizePhMobile(mobile);
        if (method === 'bank' ? !isValidBankAccount(bankNumber) : !isValidPhMobile(mobile)) {
          next.accountNumber =
            method === 'bank'
              ? 'Enter 8 to 20 digits.'
              : 'Enter the mobile number of this account, like 0917 123 4567.';
        }
        if (!password) next.password = 'Enter your password to protect your payment details.';
        setErrors(next);
        if (Object.keys(next).length > 0 || number === null) return;
        void (async () => {
          try {
            await save.mutateAsync({
              paymentAccountId: null,
              expectedUpdatedAt: null,
              password,
              method,
              bank: method === 'bank' ? bank : null,
              bankName: null,
              accountName: accountName.trim(),
              accountNumber: number,
              qrFileId: null,
              instructions: null,
              isActive: true,
            });
            onDone();
          } catch (caught) {
            const error = extractAppError(caught);
            const reason = error.details?.reason;
            setErrors(
              reason === 'wrong_password' ? { password: error.message } : { form: error.message },
            );
          }
        })();
      }}
    >
      <StepFrame
        step={5}
        title="How guests pay"
        description="Guests pay you directly. Add one now; you can add more in Settings."
        onBack={onBack}
        onSkip={onDone}
        primary={
          <AsyncButton type="submit" className="min-h-11" state={save.isPending ? 'busy' : 'idle'}>
            Continue to Rules
          </AsyncButton>
        }
      >
        {errors.form ? (
          <Alert variant="destructive">
            <AlertDescription>{errors.form}</AlertDescription>
          </Alert>
        ) : null}
        <RadioCards
          aria-label="Payment method"
          columns={3}
          options={METHOD_OPTIONS}
          value={method}
          onValueChange={setMethod}
        />
        <Field data-invalid={errors.accountName ? true : undefined}>
          <FieldLabel htmlFor="ob-acct-name">Account name</FieldLabel>
          <Input
            id="ob-acct-name"
            value={accountName}
            maxLength={80}
            onChange={(event) => setAccountName(event.target.value)}
            aria-invalid={errors.accountName ? true : undefined}
          />
          <FieldDescription>
            Type it exactly as your{' '}
            {method === 'bank' ? 'bank' : method === 'gcash' ? 'GCash' : 'Maya'} shows it.
          </FieldDescription>
          <FieldError>{errors.accountName}</FieldError>
        </Field>
        {method === 'bank' ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="ob-bank">Bank</FieldLabel>
              <NativeSelect
                id="ob-bank"
                className="w-full"
                value={bank}
                onChange={(event) => {
                  const next = BANKS.find((item) => item === event.target.value);
                  if (next) setBank(next);
                }}
              >
                {BANKS.filter((item) => item !== 'other').map((item) => (
                  <NativeSelectOption key={item} value={item}>
                    {words.banks[item]}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            <Field data-invalid={errors.accountNumber ? true : undefined}>
              <FieldLabel htmlFor="ob-bank-number">Account number</FieldLabel>
              <Input
                id="ob-bank-number"
                inputMode="numeric"
                value={bankNumber}
                onChange={(event) => setBankNumber(event.target.value)}
                aria-invalid={errors.accountNumber ? true : undefined}
              />
              <FieldError>{errors.accountNumber}</FieldError>
            </Field>
          </div>
        ) : (
          <Field data-invalid={errors.accountNumber ? true : undefined}>
            <FieldLabel htmlFor="ob-wallet">
              {method === 'gcash' ? 'GCash number' : 'Maya number'}
            </FieldLabel>
            <PhoneInput
              id="ob-wallet"
              value={mobile}
              onValueChange={setMobile}
              invalid={errors.accountNumber !== undefined}
            />
            <FieldError>{errors.accountNumber}</FieldError>
          </Field>
        )}
        <Field data-invalid={errors.password ? true : undefined}>
          <FieldLabel htmlFor="ob-pay-password">Your password</FieldLabel>
          <PasswordInput
            id="ob-pay-password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            invalid={errors.password !== undefined}
          />
          <FieldDescription>
            We ask for it whenever payment details change, so nobody else can change where guests
            pay.
          </FieldDescription>
          <FieldError>{errors.password}</FieldError>
        </Field>
      </StepFrame>
    </form>
  );
}

// ——— Step 6: Rules ————————————————————————————————————————————————

function RulesStep({
  propertyId,
  onBack,
  onDone,
}: {
  readonly propertyId: string | null;
  readonly onBack: () => void;
  readonly onDone: () => void;
}) {
  const property = useOwnerPropertyQuery();
  const save = useSavePoliciesMutation();
  const current = property.data?.property ?? null;
  const currentRules = useMemo(
    () => (property.data?.house_rules ?? []).map((rule) => rule.body),
    [property.data],
  );
  const [preset, setPreset] = useState<CancellationPreset>(
    current && current.cancellation_preset !== 'custom' ? current.cancellation_preset : 'dp_rebook',
  );
  const [checkin, setCheckin] = useState(current?.checkin_time.slice(0, 5) ?? '14:00');
  const [checkout, setCheckout] = useState(current?.checkout_time.slice(0, 5) ?? '12:00');
  const [rules, setRules] = useState<string[]>(
    currentRules.length > 0 ? currentRules : ['No smoking', 'No parties'],
  );
  const [error, setError] = useState<string | null>(null);

  if (propertyId === null || current === null) {
    return (
      <StepFrame step={6} title="Rules" onBack={onBack} primary={null}>
        <Alert>
          <AlertDescription>Save your place first.</AlertDescription>
        </Alert>
      </StepFrame>
    );
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        void (async () => {
          try {
            await save.mutateAsync({
              propertyId,
              expectedUpdatedAt: current.updated_at,
              checkinTime: checkin,
              checkoutTime: checkout,
              cancellationPreset: preset,
              cancellationNote: null,
              rebookMinDays: current.rebook_min_days,
              rebookWithinMonths: current.rebook_within_months,
              guestIdsRequired: current.guest_ids_required,
              guestListDueHours: current.guest_list_due_hours,
              arrivalInfo: current.arrival_info,
              privacyContact: current.privacy_contact,
              houseRules: rules,
            });
            onDone();
          } catch (caught) {
            setError(extractAppError(caught).message);
          }
        })();
      }}
    >
      <StepFrame
        step={6}
        title="Rules"
        description="Guests see these before they pay. We picked common choices; change anything."
        onBack={onBack}
        primary={
          <AsyncButton type="submit" className="min-h-11" state={save.isPending ? 'busy' : 'idle'}>
            Continue to Review
          </AsyncButton>
        }
      >
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <Field>
          <FieldLabel id="ob-preset-label">If a guest cancels</FieldLabel>
          <RadioCards
            aria-labelledby="ob-preset-label"
            columns={1}
            options={PRESET_ORDER.map((value) => ({
              value,
              label: CANCELLATION_PRESET_COPY[value].label,
              description: CANCELLATION_PRESET_COPY[value].summary,
            }))}
            value={preset}
            onValueChange={setPreset}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="ob-checkin">Check-in from</FieldLabel>
            <TimeSelect
              id="ob-checkin"
              className="w-full"
              value={checkin}
              onValueChange={setCheckin}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="ob-checkout">Check-out by</FieldLabel>
            <TimeSelect
              id="ob-checkout"
              className="w-full"
              value={checkout}
              onValueChange={setCheckout}
            />
          </Field>
        </div>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">House rules</legend>
          <div className="flex flex-wrap gap-2">
            {HOUSE_RULE_CHIPS.map((rule) => (
              <Toggle
                key={rule}
                variant="outline"
                className="min-h-11 rounded-full px-3 aria-pressed:border-primary aria-pressed:bg-primary-tint sm:min-h-9"
                pressed={rules.includes(rule)}
                onPressedChange={(pressed) =>
                  setRules((list) =>
                    pressed ? [...list, rule] : list.filter((item) => item !== rule),
                  )
                }
              >
                {rules.includes(rule) ? <CheckIcon aria-hidden="true" /> : null}
                {rule}
              </Toggle>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Add your own rules in Settings → Policies.
          </p>
        </fieldset>
      </StepFrame>
    </form>
  );
}

// ——— Review ————————————————————————————————————————————————

function ReviewStep({
  pending,
  propertyName,
  place,
  unitCount,
  price,
  photos,
  payments,
  preset,
  onEdit,
}: {
  readonly pending: boolean;
  readonly propertyName: string | null;
  readonly place: string | null;
  readonly unitCount: number;
  readonly price: number | null;
  readonly photos: number;
  readonly payments: number;
  readonly preset: CancellationPreset | null;
  readonly onEdit: (step: OnboardingStep) => void;
}) {
  const rows: readonly { step: OnboardingStep; label: string; value: string; done: boolean }[] = [
    {
      step: 1,
      label: 'Your place',
      value: propertyName ? `${propertyName} · ${place ?? ''}` : 'Not saved yet',
      done: propertyName !== null,
    },
    {
      step: 2,
      label: 'Units',
      value: unitCount > 0 ? `${unitCount} ${unitCount === 1 ? 'unit' : 'units'}` : 'None yet',
      done: unitCount > 0,
    },
    {
      step: 3,
      label: 'Photos',
      value: photos > 0 ? `${photos} photos` : 'Not yet',
      done: photos >= 3,
    },
    {
      step: 4,
      label: 'Price',
      value: price !== null ? `${formatPesos(price)} a night` : 'Not set',
      done: price !== null,
    },
    {
      step: 5,
      label: 'How guests pay',
      value: payments > 0 ? `${payments} ${payments === 1 ? 'way' : 'ways'} to pay` : 'Not yet',
      done: payments > 0,
    },
    {
      step: 6,
      label: 'Rules',
      value: preset ? CANCELLATION_PRESET_COPY[preset].label : 'Not set',
      done: preset !== null,
    },
  ];
  const ready = rows.every((row) => row.done);
  return (
    <StepFrame
      step={7}
      title="Review"
      onBack={() => onEdit(6)}
      primary={
        <Button className="min-h-11" nativeButton={false} render={<Link to="/editor" />}>
          Open the page editor
        </Button>
      }
    >
      <ul className="divide-y divide-border rounded-lg border border-border bg-card">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center gap-3 px-3 py-2.5">
            <span
              className={cn(
                'flex size-6 shrink-0 items-center justify-center rounded-full',
                row.done ? 'bg-success-tint text-success' : 'bg-muted text-muted-foreground',
              )}
            >
              {row.done ? (
                <CheckIcon aria-hidden="true" className="size-3.5" />
              ) : (
                <span className="size-1.5 rounded-full bg-current" />
              )}
              <span className="sr-only">{row.done ? 'Done' : 'Not done'}</span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">{row.label}</span>
              <span className="block truncate text-sm text-muted-foreground">{row.value}</span>
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="min-h-11 sm:min-h-8"
              onClick={() => onEdit(row.step)}
            >
              <PencilIcon aria-hidden="true" />
              Edit<span className="sr-only"> {row.label}</span>
            </Button>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-4 rounded-lg bg-primary-tint p-4">
        <MilestonePicture
          art={ready ? 'live' : 'welcome'}
          size="sm"
          tone={ready ? 'celebrate' : 'primary'}
        />
        <p className="text-sm text-foreground">
          {pending
            ? 'Ready. You can publish once we approve you.'
            : ready
              ? 'Your page is ready to publish. Publishing arrives with the page editor.'
              : 'Finish the steps above, then publish your page.'}
        </p>
      </div>
    </StepFrame>
  );
}
