import { useState } from 'react';
import { Link, useBlocker } from '@tanstack/react-router';
import { LinkIcon } from 'lucide-react';
import {
  isValidPhMobile,
  PH_PROVINCES,
  readErrorDetails,
  regionForProvince,
  type OwnerPropertyView,
  type PropertyContact,
} from '@smartapp/core';
import { Alert, AlertDescription } from '@smartapp/ui/components/alert';
import { Button } from '@smartapp/ui/components/button';
import { Field, FieldDescription, FieldError, FieldLabel } from '@smartapp/ui/components/field';
import { Input } from '@smartapp/ui/components/input';
import { NativeSelect, NativeSelectOption } from '@smartapp/ui/components/native-select';
import { AppSheet } from '@smartapp/ui/compositions/app-sheet';
import { AsyncButton } from '@smartapp/ui/compositions/async-button';
import { CopyButton } from '@smartapp/ui/compositions/copy-button';
import { EmptyState } from '@smartapp/ui/compositions/empty-state';
import { RowButton, RowGroup, RowSwitch } from '@smartapp/ui/compositions/grouped-rows';
import { InfoList } from '@smartapp/ui/compositions/info-list';
import { PhoneInput } from '@smartapp/ui/compositions/phone-input';
import { LeaveGuardDialog, SaveBar } from '@smartapp/ui/compositions/save-bar';
import { SlugField } from '@smartapp/ui/compositions/slug-field';
import { notify } from '@smartapp/ui/lib/notify';
import { useOwnerPropertyQuery, useSlugChecker } from '@/data/property/reads';
import { useChangeSlugMutation, useSavePropertyMutation } from '@/data/property/writes';
import { extractAppError } from '@/data/shared';
import { SettingsPane } from './settings-nav';
import {
  same,
  SettingsError,
  SettingsSkeleton,
  useOfflineSave,
  useSaveState,
} from './settings-shared';

interface PropertyDraft {
  readonly name: string;
  readonly phone: string;
  readonly messenger: string;
  readonly facebook: string;
  readonly reviewUrl: string;
  readonly addressLine: string;
  readonly barangay: string;
  readonly city: string;
  readonly province: string;
  readonly showExactLocation: boolean;
}

function draftFrom(view: OwnerPropertyView): PropertyDraft {
  const { property } = view;
  return {
    name: property.name,
    phone: property.contact.phone ?? '',
    messenger: property.contact.messenger ?? '',
    facebook: property.contact.facebook ?? '',
    reviewUrl: property.contact.google_review_url ?? '',
    addressLine: property.address_line,
    barangay: property.barangay ?? '',
    city: property.city,
    province: property.province,
    showExactLocation: property.show_exact_location,
  };
}

const orNull = (value: string) => (value.trim() === '' ? null : value.trim());

/** /settings/property (OW-23): name, contacts, address and the web address. */
export function PropertySettingsPage() {
  const property = useOwnerPropertyQuery();
  return (
    <SettingsPane title="Property details">
      {property.isPending ? (
        <SettingsSkeleton />
      ) : property.isError ? (
        <SettingsError error={property.error} onRetry={() => void property.refetch()} />
      ) : property.data === null ? (
        <EmptyState
          title="No place yet"
          description="Add your place first. Its name and address show here after."
          action={
            <Button
              className="min-h-11"
              nativeButton={false}
              render={<Link to="/onboarding" search={{ step: 1 }} />}
            >
              Set up your place
            </Button>
          }
        />
      ) : (
        <PropertyForm key={property.data.property.id} view={property.data} />
      )}
    </SettingsPane>
  );
}

function PropertyForm({ view }: { readonly view: OwnerPropertyView }) {
  const save = useSavePropertyMutation();
  const [state, setState] = useSaveState();
  const { offline, message } = useOfflineSave();
  const [saved, setSaved] = useState(() => draftFrom(view));
  const [draft, setDraft] = useState(saved);
  const [errors, setErrors] = useState<Partial<Record<keyof PropertyDraft | 'form', string>>>({});
  const [linkOpen, setLinkOpen] = useState(false);
  const { property } = view;
  const dirty = !same(draft, saved);
  const set = (change: Partial<PropertyDraft>) =>
    setDraft((current) => ({ ...current, ...change }));
  const blocker = useBlocker({
    shouldBlockFn: () => dirty,
    enableBeforeUnload: false,
    withResolver: true,
  });

  async function onSave() {
    const next: typeof errors = {};
    if (!draft.name.trim()) next.name = 'Enter the name guests see.';
    if (draft.phone.trim() && !isValidPhMobile(draft.phone)) {
      next.phone = 'Enter a mobile number like 0917 123 4567.';
    }
    if (!draft.addressLine.trim()) next.addressLine = 'Enter the street and number.';
    if (!draft.city.trim()) next.city = 'Enter the town or city.';
    if (!draft.province) next.province = 'Pick a province.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setState('busy');
    const contact: PropertyContact = {
      ...property.contact,
      phone: orNull(draft.phone),
      messenger: orNull(draft.messenger),
      facebook: orNull(draft.facebook),
      google_review_url: orNull(draft.reviewUrl),
    };
    try {
      await save.mutateAsync({
        propertyId: property.id,
        expectedUpdatedAt: property.updated_at,
        name: draft.name.trim(),
        slug: property.slug,
        tagline: property.tagline,
        description: property.description,
        addressLine: draft.addressLine.trim(),
        barangay: orNull(draft.barangay),
        city: draft.city.trim(),
        province: draft.province,
        region: regionForProvince(draft.province) ?? property.region,
        latitude: property.latitude,
        longitude: property.longitude,
        mapUrl: property.map_url,
        showExactLocation: draft.showExactLocation,
        contact,
        privacyContact: property.privacy_contact,
        logoFileId: property.logo_file_id,
      });
      setSaved(draft);
      setState('done');
    } catch (caught) {
      setState('idle');
      const error = extractAppError(caught);
      const fields = readErrorDetails(error).fields;
      setErrors({ form: Object.values(fields)[0] ?? error.message });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {errors.form ? (
        <Alert variant="destructive">
          <AlertDescription>{errors.form}</AlertDescription>
        </Alert>
      ) : null}

      <Field data-invalid={errors.name ? true : undefined}>
        <FieldLabel htmlFor="prop-name">Place name</FieldLabel>
        <Input
          id="prop-name"
          value={draft.name}
          maxLength={80}
          aria-invalid={errors.name ? true : undefined}
          onChange={(event) => set({ name: event.target.value })}
        />
        <FieldError>{errors.name}</FieldError>
      </Field>

      <div className="flex flex-col gap-2">
        <RowGroup title="Web address">
          <RowButton
            label={<span className="tabular">smartapp.webserbisyo.com/{property.slug}</span>}
            hint="Old links and printed QR codes keep working"
            value="Change"
            icon={<LinkIcon />}
            onClick={() => setLinkOpen(true)}
          />
        </RowGroup>
        <CopyButton
          value={`https://smartapp.webserbisyo.com/${property.slug}`}
          label="Copy web address"
          copiedLabel="Link copied"
          className="min-h-11 self-start"
        />
      </div>

      <section className="flex flex-col gap-4" aria-labelledby="prop-contacts">
        <h2 id="prop-contacts" className="text-sm font-medium text-muted-foreground">
          How guests reach you
        </h2>
        <Field data-invalid={errors.phone ? true : undefined}>
          <FieldLabel htmlFor="prop-phone">Mobile number</FieldLabel>
          <PhoneInput
            id="prop-phone"
            value={draft.phone}
            onValueChange={(phone) => set({ phone })}
            invalid={errors.phone !== undefined}
          />
          <FieldError>{errors.phone}</FieldError>
        </Field>
        <Field>
          <FieldLabel htmlFor="prop-messenger">Messenger link</FieldLabel>
          <Input
            id="prop-messenger"
            inputMode="url"
            placeholder="m.me/yourpage"
            value={draft.messenger}
            maxLength={200}
            onChange={(event) => set({ messenger: event.target.value })}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="prop-facebook">Facebook page</FieldLabel>
          <Input
            id="prop-facebook"
            inputMode="url"
            placeholder="facebook.com/yourpage"
            value={draft.facebook}
            maxLength={200}
            onChange={(event) => set({ facebook: event.target.value })}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="prop-review">Google review link</FieldLabel>
          <Input
            id="prop-review"
            inputMode="url"
            value={draft.reviewUrl}
            maxLength={500}
            onChange={(event) => set({ reviewUrl: event.target.value })}
          />
          <FieldDescription>We share it with guests after they check out.</FieldDescription>
        </Field>
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="prop-address">
        <h2 id="prop-address" className="text-sm font-medium text-muted-foreground">
          Address
        </h2>
        <Field data-invalid={errors.addressLine ? true : undefined}>
          <FieldLabel htmlFor="prop-street">Street and number</FieldLabel>
          <Input
            id="prop-street"
            autoComplete="street-address"
            value={draft.addressLine}
            maxLength={200}
            aria-invalid={errors.addressLine ? true : undefined}
            onChange={(event) => set({ addressLine: event.target.value })}
          />
          <FieldError>{errors.addressLine}</FieldError>
        </Field>
        <Field>
          <FieldLabel htmlFor="prop-barangay">Barangay (optional)</FieldLabel>
          <Input
            id="prop-barangay"
            value={draft.barangay}
            maxLength={120}
            onChange={(event) => set({ barangay: event.target.value })}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={errors.city ? true : undefined}>
            <FieldLabel htmlFor="prop-city">Town or city</FieldLabel>
            <Input
              id="prop-city"
              autoComplete="address-level2"
              value={draft.city}
              maxLength={80}
              aria-invalid={errors.city ? true : undefined}
              onChange={(event) => set({ city: event.target.value })}
            />
            <FieldError>{errors.city}</FieldError>
          </Field>
          <Field data-invalid={errors.province ? true : undefined}>
            <FieldLabel htmlFor="prop-province">Province</FieldLabel>
            <NativeSelect
              id="prop-province"
              className="w-full"
              value={draft.province}
              aria-invalid={errors.province ? true : undefined}
              onChange={(event) => set({ province: event.target.value })}
            >
              {PH_PROVINCES.map((item) => (
                <NativeSelectOption key={item.name} value={item.name}>
                  {item.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <FieldError>{errors.province}</FieldError>
          </Field>
        </div>
        <RowGroup>
          <RowSwitch
            label="Show exact location only after payment"
            hint="Before that, guests see the town and a nearby area."
            checked={!draft.showExactLocation}
            onCheckedChange={(hidden) => set({ showExactLocation: !hidden })}
          />
        </RowGroup>
      </section>

      <ChangeLinkSheet
        open={linkOpen}
        onOpenChange={setLinkOpen}
        propertyId={property.id}
        slug={property.slug}
        oldSlugs={property.old_slugs}
      />
      <SaveBar
        dirty={dirty}
        state={state}
        canSave={!offline}
        message={message}
        onSave={() => void onSave()}
        onDiscard={() => {
          setDraft(saved);
          setErrors({});
          notify.info('Changes discarded');
        }}
      />
      <LeaveGuardDialog
        open={blocker.status === 'blocked'}
        onStay={() => blocker.reset?.()}
        onLeave={() => blocker.proceed?.()}
      />
    </div>
  );
}

function ChangeLinkSheet({
  open,
  onOpenChange,
  propertyId,
  slug,
  oldSlugs,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly propertyId: string;
  readonly slug: string;
  readonly oldSlugs: readonly string[];
}) {
  const change = useChangeSlugMutation();
  const check = useSlugChecker(propertyId);
  const [value, setValue] = useState(slug);
  const [blocked, setBlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (value === slug) {
      onOpenChange(false);
      return;
    }
    if (blocked) return;
    try {
      await change.mutateAsync({ propertyId, newSlug: value });
      notify.success('Web address changed');
      onOpenChange(false);
    } catch (caught) {
      const appError = extractAppError(caught);
      const details = readErrorDetails(appError);
      setError(
        details.reason === 'slug_change_limit'
          ? 'You reached the limit of 3 web address changes this year.'
          : appError.message,
      );
    }
  }

  return (
    <AppSheet
      open={open}
      onOpenChange={(next) => {
        if (next) setValue(slug);
        onOpenChange(next);
      }}
      height="full"
      size="sm"
      title="Change web address"
      description="Old links and printed QR codes keep working. You can change it 3 times a year."
      footer={
        <>
          <Button
            data-sheet-cancel=""
            variant="outline"
            className="min-h-11"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <AsyncButton
            className="min-h-11"
            state={change.isPending ? 'busy' : 'idle'}
            disabled={blocked || value === slug}
            onClick={() => void submit()}
          >
            Change web address
          </AsyncButton>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <Field>
          <FieldLabel htmlFor="change-slug">New web address</FieldLabel>
          <SlugField
            id="change-slug"
            host="smartapp.ph"
            value={value}
            savedValue={slug}
            onValueChange={setValue}
            onStatusChange={(status) =>
              setBlocked(status === 'taken' || status === 'reserved' || status === 'invalid')
            }
            check={check}
          />
        </Field>
        {oldSlugs.length > 0 ? (
          <InfoList
            rows={oldSlugs.map((old) => ({
              id: old,
              icon: <LinkIcon aria-hidden="true" />,
              label: `smartapp.webserbisyo.com/${old}`,
              value: 'Still works',
            }))}
          />
        ) : null}
      </div>
    </AppSheet>
  );
}
