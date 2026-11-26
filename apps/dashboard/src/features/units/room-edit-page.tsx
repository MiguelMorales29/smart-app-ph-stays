import { useEffect, useState } from 'react';
import { Link, useBlocker, useParams } from '@tanstack/react-router';
import { BedSingleIcon, ChevronRightIcon, PlusIcon } from 'lucide-react';
import {
  ROOM_BATHROOMS,
  ROOM_GUESTS,
  readErrorDetails,
  roomFormSchema,
  type OwnerUnitDetailView,
  type OwnerUnitListItemView,
  type RoomForm,
  type RoomsRow,
} from '@smartapp/core';
import { Alert, AlertDescription } from '@smartapp/ui/components/alert';
import { Button } from '@smartapp/ui/components/button';
import { Field, FieldDescription, FieldError, FieldLabel } from '@smartapp/ui/components/field';
import { Input } from '@smartapp/ui/components/input';
import { Skeleton } from '@smartapp/ui/components/skeleton';
import { Textarea } from '@smartapp/ui/components/textarea';
import { EmptyState } from '@smartapp/ui/compositions/empty-state';
import { ErrorState } from '@smartapp/ui/compositions/error-state';
import { PhotoCropSheet } from '@smartapp/ui/compositions/photo-crop-sheet';
import { PhotoManager } from '@smartapp/ui/compositions/photo-manager';
import { LeaveGuardDialog, SaveBar } from '@smartapp/ui/compositions/save-bar';
import { SegmentedControl } from '@smartapp/ui/compositions/segmented-control';
import { notify } from '@smartapp/ui/lib/notify';
import { usePhotoPipeline } from '@/app/photos/use-photo-pipeline';
import { useOfflineSave, useSaveState } from '@/app/save-state';
import { useSetUnitPhotosMutation } from '@/data/photos/upload';
import { extractAppError } from '@/data/shared';
import { bedPartOfName } from '@/data/units/bulk';
import { useAmenitiesQuery, useOwnerUnitQuery, useOwnerUnitsQuery } from '@/data/units/reads';
import { useSaveRoomMutation, useSetRoomAmenitiesMutation } from '@/data/units/writes';
import { AmenitiesField, sameDraft } from './unit-pricing';
import {
  ROOM_BATHROOM_LABEL,
  ROOM_GUESTS_LABEL,
  UnitStatusBadge,
  roomFactsText,
  unitPriceText,
} from './unit-words';

const formFrom = (room: RoomsRow): RoomForm => ({
  name: room.name,
  guests: room.guests,
  bathroom: room.bathroom,
  description: room.description ?? '',
});

const sameForm = (a: RoomForm, b: RoomForm) =>
  a.name === b.name &&
  a.guests === b.guests &&
  a.bathroom === b.bathroom &&
  a.description === b.description;

/**
 * /units/rooms/$roomId (R-1b, D92): a shared room is edited once, for every bed in it: its name,
 * who may stay, the bathroom, the description, the photos and the amenities. Each bed keeps its
 * own price, rules and status on its own page.
 */
export function RoomEditPage() {
  const { roomId } = useParams({ from: '/app-frame/units/rooms/$roomId' });
  const units = useOwnerUnitsQuery(null, true);
  const beds = (units.data ?? []).filter((item) => item.unit.room_id === roomId);
  const firstBed = beds[0] ?? null;
  const detail = useOwnerUnitQuery(firstBed?.unit.id ?? null);

  if (units.isPending || (firstBed && detail.isPending)) {
    return (
      <section className="space-y-4" aria-busy="true">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </section>
    );
  }
  if (units.isError || detail.isError) {
    return (
      <ErrorState
        title="We couldn't open this room"
        message={extractAppError(units.error ?? detail.error).message}
        onRetry={() => {
          void units.refetch();
          void detail.refetch();
        }}
      />
    );
  }
  if (!firstBed?.room || !detail.data) {
    return (
      <EmptyState
        title="This room isn't here anymore"
        description="Its beds may have been deleted. Your other units are on the Units page."
        action={
          <Button nativeButton={false} render={<Link to="/units" />}>
            Open units
          </Button>
        }
      />
    );
  }
  return (
    <RoomEditor key={firstBed.room.id} room={firstBed.room} beds={beds} shared={detail.data} />
  );
}

function RoomEditor({
  room,
  beds,
  shared,
}: {
  readonly room: RoomsRow;
  readonly beds: readonly OwnerUnitListItemView[];
  /** The first bed's detail: its photos and amenities are the room's. */
  readonly shared: OwnerUnitDetailView;
}) {
  const saveRoom = useSaveRoomMutation();
  const savePhotos = useSetUnitPhotosMutation();
  const saveAmenities = useSetRoomAmenitiesMutation();
  const amenities = useAmenitiesQuery();
  const [savedRoom, setSavedRoom] = useState(room);
  const [form, setForm] = useState<RoomForm>(() => formFrom(room));
  const [savedAmenities, setSavedAmenities] = useState<readonly string[]>(shared.amenity_ids);
  const [amenityIds, setAmenityIds] = useState<string[]>(() => [...shared.amenity_ids]);
  const [errors, setErrors] = useState<Partial<Record<keyof RoomForm | 'form', string>>>({});
  const [state, setState] = useSaveState();
  const { offline, message } = useOfflineSave();
  const photos = usePhotoPipeline({ saved: shared.photos, altPrefix: room.name });

  const detailsDirty = !sameForm(form, formFrom(savedRoom));
  const amenitiesDirty = !sameDraft([...amenityIds].sort(), [...savedAmenities].sort());
  const dirty = detailsDirty || amenitiesDirty || photos.dirty;
  const blocker = useBlocker({
    shouldBlockFn: () => dirty,
    enableBeforeUnload: false,
    withResolver: true,
  });

  // Opening "Change room photos" from a bed jumps to that part of the page.
  useEffect(() => {
    const target = window.location.hash.slice(1);
    if (target) document.getElementById(`room-${target}`)?.scrollIntoView({ block: 'start' });
  }, []);

  const set = (change: Partial<RoomForm>) => {
    setForm((current) => ({ ...current, ...change }));
    setErrors({});
  };

  async function onSave() {
    const parsed = roomFormSchema.safeParse(form);
    if (!parsed.success) {
      const next: typeof errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key === 'name' || key === 'description') next[key] = issue.message;
      }
      setErrors(next);
      document.getElementById('room-name')?.focus();
      return;
    }
    if (photos.busy) {
      setErrors({ form: 'Wait for the photos to finish uploading, then save.' });
      return;
    }
    setState('busy');
    const done: string[] = [];
    try {
      if (detailsDirty) {
        const result = await saveRoom.mutateAsync({
          roomId: savedRoom.id,
          expectedUpdatedAt: savedRoom.updated_at,
          name: parsed.data.name,
          guests: parsed.data.guests,
          bathroom: parsed.data.bathroom,
          description: parsed.data.description.trim() === '' ? null : parsed.data.description,
        });
        setSavedRoom(result.room);
        setForm(formFrom(result.room));
        done.push('details');
      }
      if (photos.dirty) {
        await savePhotos.mutateAsync({
          propertyId: savedRoom.property_id,
          units: beds.map((bed) => ({ unitId: bed.unit.id, name: bed.unit.name })),
          photos: photos.photosToSave,
        });
        photos.markSaved();
        done.push('photos');
      }
      if (amenitiesDirty) {
        const saved = await saveAmenities.mutateAsync({ roomId: savedRoom.id, amenityIds });
        setSavedAmenities(saved);
        done.push('amenities');
      }
      setState('done');
    } catch (caught) {
      setState('idle');
      const error = extractAppError(caught);
      const fields = readErrorDetails(error).fields;
      const kept = done.length > 0 ? ` Your ${done.join(' and ')} were saved.` : '';
      if (fields?.name) {
        setErrors({ name: fields.name });
      } else if (readErrorDetails(error).reason === 'changed_elsewhere') {
        setErrors({
          form: 'This room was changed in another tab. Reload the page to see the latest, then try again.',
        });
      } else {
        setErrors({ form: `${error.message}${kept}` });
      }
    }
  }

  const listedCount = beds.filter((bed) => bed.unit.status === 'listed').length;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 pb-24">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-balance">{savedRoom.name}</h1>
        <p className="text-sm text-muted-foreground tabular">
          {roomFactsText(savedRoom, beds.length)} · {listedCount} listed
        </p>
      </header>

      {errors.form ? (
        <Alert variant="destructive">
          <AlertDescription>{errors.form}</AlertDescription>
        </Alert>
      ) : null}

      <section aria-labelledby="room-details-title" className="flex flex-col gap-5">
        <h2 id="room-details-title" className="text-lg font-semibold">
          About the room
        </h2>
        <Field data-invalid={errors.name ? true : undefined}>
          <FieldLabel htmlFor="room-name">Room name</FieldLabel>
          <Input
            id="room-name"
            maxLength={40}
            autoComplete="off"
            value={form.name}
            aria-invalid={errors.name ? true : undefined}
            onChange={(event) => set({ name: event.target.value })}
          />
          <FieldDescription>
            Every bed is named after it, like &ldquo;{form.name.trim() || 'Room 2A'} · Bed 1&rdquo;.
          </FieldDescription>
          <FieldError>{errors.name}</FieldError>
        </Field>
        <Field>
          <FieldLabel id="room-guests-label">Who can stay</FieldLabel>
          <SegmentedControl
            aria-labelledby="room-guests-label"
            value={form.guests}
            onValueChange={(guests) => set({ guests })}
            options={ROOM_GUESTS.map((value) => ({ value, label: ROOM_GUESTS_LABEL[value] }))}
          />
          <FieldDescription>Guests see this on the room before they book.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel id="room-bathroom-label">Bathroom</FieldLabel>
          <SegmentedControl
            aria-labelledby="room-bathroom-label"
            value={form.bathroom}
            onValueChange={(bathroom) => set({ bathroom })}
            options={ROOM_BATHROOMS.map((value) => ({
              value,
              label: value === 'shared' ? 'Shared' : 'In the room',
            }))}
          />
          <FieldDescription>{ROOM_BATHROOM_LABEL[form.bathroom]}.</FieldDescription>
        </Field>
        <Field data-invalid={errors.description ? true : undefined}>
          <FieldLabel htmlFor="room-description">Description</FieldLabel>
          <Textarea
            id="room-description"
            rows={4}
            maxLength={2000}
            placeholder="Air-conditioned, curtains on every bed, lockers, study desks"
            value={form.description}
            onChange={(event) => set({ description: event.target.value })}
          />
          <FieldError>{errors.description}</FieldError>
        </Field>
      </section>

      <section
        id="room-photos"
        aria-labelledby="room-photos-title"
        className="flex scroll-mt-20 flex-col gap-3"
      >
        <div>
          <h2 id="room-photos-title" className="text-lg font-semibold">
            Photos
          </h2>
          <p className="text-sm text-muted-foreground">
            Every bed shows these. Add at least 3 to list a bed.
          </p>
        </div>
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
      </section>

      <section
        id="room-amenities"
        aria-labelledby="room-amenities-title"
        className="flex scroll-mt-20 flex-col gap-3"
      >
        <div>
          <h2 id="room-amenities-title" className="text-lg font-semibold">
            Amenities
          </h2>
          <p className="text-sm text-muted-foreground">Every bed in the room gets these.</p>
        </div>
        {amenities.isPending ? (
          <Skeleton className="h-32 w-full" />
        ) : amenities.isError ? (
          <ErrorState
            title="We couldn't load the amenities"
            message={extractAppError(amenities.error).message}
            onRetry={() => void amenities.refetch()}
          />
        ) : (
          <AmenitiesField catalogue={amenities.data} value={amenityIds} onChange={setAmenityIds} />
        )}
      </section>

      <section aria-labelledby="room-beds-title" className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 id="room-beds-title" className="text-lg font-semibold">
              Beds
            </h2>
            <p className="text-sm text-muted-foreground">
              Each bed has its own price, rules and status.
            </p>
          </div>
          <Button
            variant="outline"
            className="min-h-11 shrink-0 sm:min-h-9"
            nativeButton={false}
            render={<Link to="/units" search={{ add: 'beds', room: savedRoom.id }} />}
          >
            <PlusIcon aria-hidden="true" />
            Add a bed
          </Button>
        </div>
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {beds.map((bed) => {
            const price = unitPriceText(bed);
            return (
              <li key={bed.unit.id}>
                <Link
                  to="/units/$unitId"
                  params={{ unitId: bed.unit.id }}
                  className="press flex min-h-13 items-center gap-3 px-4 py-2.5 outline-none hover-hover:hover:bg-muted/60 focus-visible:bg-muted"
                >
                  <BedSingleIcon
                    aria-hidden="true"
                    className="size-4 shrink-0 text-muted-foreground"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">
                      {bedPartOfName(bed.unit.name, savedRoom.name)}
                    </span>
                    <span className="block text-sm text-muted-foreground tabular">
                      {price ?? 'No price yet'}
                    </span>
                  </span>
                  <UnitStatusBadge status={bed.unit.status} />
                  <ChevronRightIcon aria-hidden="true" className="size-4 text-muted-foreground" />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <SaveBar
        dirty={dirty}
        state={state}
        canSave={!offline}
        message={message}
        onSave={() => void onSave()}
        onDiscard={() => {
          setForm(formFrom(savedRoom));
          setAmenityIds([...savedAmenities]);
          photos.reset(shared.photos);
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
