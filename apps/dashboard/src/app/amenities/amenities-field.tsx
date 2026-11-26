import { lazy, Suspense, useId, useState } from 'react';
import { PencilIcon, Trash2Icon } from 'lucide-react';
import { AMENITY_GROUPS, readErrorDetails, type AmenitiesRow } from '@smartapp/core';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@smartapp/ui/components/alert-dialog';
import { Button } from '@smartapp/ui/components/button';
import { Field, FieldDescription, FieldError, FieldLabel } from '@smartapp/ui/components/field';
import { Input } from '@smartapp/ui/components/input';
import { NativeSelect, NativeSelectOption } from '@smartapp/ui/components/native-select';
import { Skeleton } from '@smartapp/ui/components/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@smartapp/ui/components/tabs';
import { AmenityChips } from '@smartapp/ui/compositions/amenity-chips';
import { AmenityGlyph, amenityEmoji } from '@smartapp/ui/compositions/amenity-glyph';
import { AppSheet } from '@smartapp/ui/compositions/app-sheet';
import { RowButton, RowGroup } from '@smartapp/ui/compositions/grouped-rows';
import { AMENITY_ICONS } from '@smartapp/ui/lib/amenity-icons';
import { notify } from '@smartapp/ui/lib/notify';
import { cn } from '@smartapp/ui/lib/utils';
import { extractAppError } from '@/data/shared';
import { useRemoveAmenityMutation, useSaveAmenityMutation } from '@/data/units/writes';

/** Loaded only when the owner opens the Emoji tab, to keep the first load light (D88). */
const EmojiTab = lazy(() => import('./emoji-tab'));

/** Shown under the chips when some come from the property. */
export const PROPERTY_AMENITIES_NOTE =
  'Amenities with a building icon are set once for the whole property, in Settings → Property details.';

export const AMENITY_GROUP_LABEL: Record<AmenitiesRow['grp'], string> = {
  essentials: 'Essentials',
  comfort: 'Comfort',
  kitchen: 'Kitchen',
  bathroom: 'Bathroom',
  safety: 'Safety',
  outdoor: 'Outdoor',
  other: 'Other',
};

// One button per icon (a few names share an icon, such as "hot-tub" and "waves").
const ICON_CHOICES = Object.entries(AMENITY_ICONS)
  .filter(([, icon], index, all) => all.findIndex(([, other]) => other === icon) === index)
  .map(([name]) => name);

const iconName = (name: string) => name.replace(/-/g, ' ');

interface Draft {
  readonly id: string | null;
  readonly label: string;
  readonly grp: AmenitiesRow['grp'];
  readonly icon: string;
}

/**
 * Amenity picker for a unit, a room or the property (R-3, D93): the catalogue as chips, plus the
 * owner's own amenities with an icon or emoji they pick. `locked` amenities come from the property
 * ("At the property") and show ticked.
 */
export function AmenitiesField({
  catalogue,
  value,
  onChange,
  locked,
  lockedNote,
}: {
  readonly catalogue: readonly AmenitiesRow[];
  readonly value: readonly string[];
  readonly onChange: (ids: string[]) => void;
  readonly locked?: readonly string[] | undefined;
  readonly lockedNote?: string | undefined;
}) {
  const ids = useId();
  const save = useSaveAmenityMutation();
  const remove = useRemoveAmenityMutation();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [labelError, setLabelError] = useState<string | null>(null);
  const [manageOpen, setManageOpen] = useState(false);
  const [removing, setRemoving] = useState<AmenitiesRow | null>(null);
  const own = catalogue.filter((item) => item.is_active && item.account_id !== null);

  function openEditor(next: Draft) {
    setDraft(next);
    setLabelError(null);
  }

  async function onSave() {
    if (!draft) return;
    const label = draft.label.trim();
    if (label.length === 0) {
      setLabelError('Enter the amenity name.');
      return;
    }
    try {
      const saved = await save.mutateAsync({
        amenityId: draft.id,
        label,
        grp: draft.grp,
        icon: draft.icon,
      });
      if (draft.id === null) {
        onChange([...new Set([...value, saved.id])]);
        notify.success(`${saved.label} added`);
      } else {
        notify.success(`${saved.label} saved`);
      }
      setDraft(null);
    } catch (caught) {
      const error = extractAppError(caught);
      setLabelError(readErrorDetails(error).fields?.label ?? error.message);
    }
  }

  async function onRemove() {
    if (!removing) return;
    try {
      await remove.mutateAsync({ amenityId: removing.id });
      onChange(value.filter((id) => id !== removing.id));
      notify.success(`${removing.label} removed`);
    } catch (caught) {
      notify.error(extractAppError(caught).message);
    }
    setRemoving(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <AmenityChips
        options={catalogue
          .filter((item) => item.is_active)
          .sort(
            (a, b) =>
              AMENITY_GROUPS.indexOf(a.grp) - AMENITY_GROUPS.indexOf(b.grp) ||
              a.sort_order - b.sort_order,
          )
          .map((item) => ({
            id: item.id,
            label: item.label,
            icon: item.icon,
            group: AMENITY_GROUP_LABEL[item.grp],
            own: item.account_id !== null,
          }))}
        value={value}
        onValueChange={onChange}
        locked={locked}
        lockedNote={lockedNote}
        onAddOwn={(label) => openEditor({ id: null, label, grp: 'other', icon: 'sparkles' })}
      />
      {own.length > 0 ? (
        <RowGroup>
          <RowButton
            label="Your own amenities"
            value={String(own.length)}
            onClick={() => setManageOpen(true)}
          />
        </RowGroup>
      ) : null}

      <AppSheet
        open={manageOpen}
        onOpenChange={setManageOpen}
        size="sm"
        title="Your own amenities"
        description="Changes reach every unit that has them."
      >
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {own.map((item) => (
            <li key={item.id} className="flex min-h-13 items-center gap-3 py-1.5 pr-1.5 pl-4">
              <AmenityGlyph icon={item.icon} className="text-muted-foreground" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{item.label}</span>
                <span className="block text-sm text-muted-foreground">
                  {AMENITY_GROUP_LABEL[item.grp]}
                </span>
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="size-11 pointer-fine:size-9"
                aria-label={`Edit ${item.label}`}
                onClick={() => {
                  setManageOpen(false);
                  openEditor({ id: item.id, label: item.label, grp: item.grp, icon: item.icon });
                }}
              >
                <PencilIcon aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-11 pointer-fine:size-9"
                aria-label={`Remove ${item.label}`}
                onClick={() => setRemoving(item)}
              >
                <Trash2Icon aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      </AppSheet>

      <AppSheet
        open={draft !== null}
        onOpenChange={(open) => (open ? undefined : setDraft(null))}
        size="sm"
        title={draft?.id ? 'Edit amenity' : 'Add your own amenity'}
        footer={
          <>
            <Button
              data-sheet-cancel=""
              variant="outline"
              className="min-h-11"
              onClick={() => setDraft(null)}
            >
              Cancel
            </Button>
            <Button className="min-h-11" disabled={save.isPending} onClick={() => void onSave()}>
              {draft?.id ? 'Save amenity' : 'Add amenity'}
            </Button>
          </>
        }
      >
        {draft ? (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3 rounded-xl bg-muted px-4 py-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-card">
                <AmenityGlyph icon={draft.icon} className="size-5 text-base" />
              </span>
              <span className="min-w-0 flex-1 truncate font-medium">
                {draft.label.trim() || 'Your amenity'}
              </span>
            </div>
            <Field data-invalid={labelError ? true : undefined}>
              <FieldLabel htmlFor={`${ids}-label`}>Name</FieldLabel>
              <Input
                id={`${ids}-label`}
                maxLength={80}
                value={draft.label}
                aria-invalid={labelError ? true : undefined}
                onChange={(event) => {
                  setDraft({ ...draft, label: event.target.value });
                  setLabelError(null);
                }}
              />
              <FieldError>{labelError}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor={`${ids}-group`}>Group</FieldLabel>
              <NativeSelect
                id={`${ids}-group`}
                value={draft.grp}
                onChange={(event) => {
                  const grp = AMENITY_GROUPS.find((item) => item === event.target.value);
                  if (grp) setDraft({ ...draft, grp });
                }}
              >
                {AMENITY_GROUPS.map((grp) => (
                  <NativeSelectOption key={grp} value={grp}>
                    {AMENITY_GROUP_LABEL[grp]}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <FieldDescription>Guests see it under this heading.</FieldDescription>
            </Field>
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium" id={`${ids}-icon`}>
                Icon
              </p>
              <Tabs defaultValue={amenityEmoji(draft.icon) ? 'emoji' : 'icons'}>
                <TabsList aria-labelledby={`${ids}-icon`}>
                  <TabsTrigger value="icons">Icons</TabsTrigger>
                  <TabsTrigger value="emoji">Emoji</TabsTrigger>
                </TabsList>
                <TabsContent value="icons" className="pt-3">
                  <div
                    role="group"
                    aria-labelledby={`${ids}-icon`}
                    className="grid grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] gap-1.5"
                  >
                    {ICON_CHOICES.map((name) => {
                      const picked = draft.icon === name;
                      return (
                        <button
                          key={name}
                          type="button"
                          aria-pressed={picked}
                          aria-label={iconName(name)}
                          title={iconName(name)}
                          onClick={() => setDraft({ ...draft, icon: name })}
                          className={cn(
                            'press flex size-11 items-center justify-center rounded-lg border outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                            picked
                              ? 'border-primary bg-primary-tint text-foreground'
                              : 'border-input bg-card text-muted-foreground hover-hover:hover:bg-muted',
                          )}
                        >
                          <AmenityGlyph icon={name} className="size-5" />
                        </button>
                      );
                    })}
                  </div>
                </TabsContent>
                <TabsContent value="emoji" className="pt-3">
                  <Suspense fallback={<Skeleton className="h-80 w-full" />}>
                    <EmojiTab onPick={(emoji) => setDraft({ ...draft, icon: `emoji:${emoji}` })} />
                  </Suspense>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        ) : null}
      </AppSheet>

      <AlertDialog
        open={removing !== null}
        onOpenChange={(open) => (open ? undefined : setRemoving(null))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {removing?.label}?</AlertDialogTitle>
            <AlertDialogDescription>
              It comes off the list and off every unit that has it. Guests stop seeing it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => void onRemove()}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
