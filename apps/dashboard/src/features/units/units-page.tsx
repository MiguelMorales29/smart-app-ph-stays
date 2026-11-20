import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ArchiveIcon,
  BedDoubleIcon,
  CopyIcon,
  EyeIcon,
  EyeOffIcon,
  GripVerticalIcon,
  ImageIcon,
  ListChecksIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  XIcon,
} from 'lucide-react';
import type { OwnerUnitListItemView, UnitStatus } from '@smartapp/core';
import { Button } from '@smartapp/ui/components/button';
import { Checkbox } from '@smartapp/ui/components/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@smartapp/ui/components/dropdown-menu';
import { Field, FieldLabel } from '@smartapp/ui/components/field';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@smartapp/ui/components/responsive-dialog';
import { Skeleton } from '@smartapp/ui/components/skeleton';
import { Sortable, SortableItem, SortableItemHandle } from '@smartapp/ui/components/sortable';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@smartapp/ui/components/table';
import { AsyncButton } from '@smartapp/ui/compositions/async-button';
import { EmptyState } from '@smartapp/ui/compositions/empty-state';
import { ErrorState } from '@smartapp/ui/compositions/error-state';
import { MilestonePicture } from '@smartapp/ui/compositions/milestone-picture';
import { MoneyInput } from '@smartapp/ui/compositions/money-input';
import { useKeyboardInset } from '@smartapp/ui/hooks/use-keyboard-inset';
import { notify } from '@smartapp/ui/lib/notify';
import { cn } from '@smartapp/ui/lib/utils';
import { useDashboard } from '@/app/dashboard-context';
import { useOwnerPropertyQuery } from '@/data/property/reads';
import { extractAppError } from '@/data/shared';
import { useBulkUnitPriceMutation, useBulkUnitStatusMutation } from '@/data/units/bulk';
import { useOwnerUnitsQuery } from '@/data/units/reads';
import {
  useArchiveUnitMutation,
  useDuplicateUnitMutation,
  useReorderUnitsMutation,
} from '@/data/units/writes';
import { AddUnitSheet } from './add-unit-sheet';
import { MISSING_LABEL, UNIT_TYPE_LABEL, UnitStatusBadge, unitPriceText } from './unit-words';

export type UnitsFilter = 'listed' | 'hidden' | 'drafts';

export interface UnitsSearch {
  readonly filter?: UnitsFilter;
  readonly add?: 'unit' | 'beds';
}

const FILTERS: readonly { value: UnitsFilter | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'listed', label: 'Listed' },
  { value: 'hidden', label: 'Hidden' },
  { value: 'drafts', label: 'Drafts' },
];

const FILTER_STATUS: Record<UnitsFilter, UnitStatus> = {
  listed: 'listed',
  hidden: 'unlisted',
  drafts: 'draft',
};

type Entry =
  | { readonly kind: 'unit'; readonly key: string; readonly item: OwnerUnitListItemView }
  | {
      readonly kind: 'room';
      readonly key: string;
      readonly label: string;
      readonly beds: readonly OwnerUnitListItemView[];
    };

/** Keeps the list order and puts bed spaces together under their room. */
function toEntries(units: readonly OwnerUnitListItemView[]): Entry[] {
  const entries: Entry[] = [];
  const rooms = new Map<string, OwnerUnitListItemView[]>();
  for (const item of units) {
    const label = item.unit.group_label;
    if (label === null) {
      entries.push({ kind: 'unit', key: item.unit.id, item });
      continue;
    }
    const beds = rooms.get(label);
    if (beds) {
      beds.push(item);
    } else {
      const list = [item];
      rooms.set(label, list);
      entries.push({ kind: 'room', key: `room:${label}`, label, beds: list });
    }
  }
  return entries;
}

function entryUnitIds(entry: Entry): string[] {
  return entry.kind === 'unit' ? [entry.item.unit.id] : entry.beds.map((bed) => bed.unit.id);
}

interface NotReady {
  readonly units: readonly {
    readonly id: string;
    readonly name: string;
    readonly missing: readonly string[];
  }[];
}

/** /units (OW-08, OW-27): every unit and bed space, filters, bulk actions and reorder. */
export function UnitsPage() {
  const search = useSearch({ from: '/app-frame/units' });
  const navigate = useNavigate();
  const { today } = useDashboard();
  const property = useOwnerPropertyQuery();
  const units = useOwnerUnitsQuery();
  const bulkStatus = useBulkUnitStatusMutation();
  const bulkPrice = useBulkUnitPriceMutation();
  const archive = useArchiveUnitMutation();
  const duplicate = useDuplicateUnitMutation();
  const reorder = useReorderUnitsMutation();
  const keyboard = useKeyboardInset();

  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [reordering, setReordering] = useState(false);
  const [notReady, setNotReady] = useState<NotReady | null>(null);
  const [priceOpen, setPriceOpen] = useState(false);
  const [price, setPrice] = useState<number | null>(null);

  const all = useMemo(() => units.data ?? [], [units.data]);
  const byId = useMemo(() => new Map(all.map((item) => [item.unit.id, item])), [all]);
  const filter = search.filter ?? null;
  const visible = filter ? all.filter((item) => item.unit.status === FILTER_STATUS[filter]) : all;
  const entries = toEntries(visible);
  const propertyId = property.data?.property.id ?? null;

  function go(
    change: { filter?: UnitsFilter | null; add?: 'unit' | 'beds' | null },
    replace = false,
  ) {
    const filterValue = change.filter === undefined ? search.filter : change.filter;
    const addValue = change.add === undefined ? search.add : change.add;
    void navigate({
      to: '/units',
      search: {
        ...(filterValue ? { filter: filterValue } : {}),
        ...(addValue ? { add: addValue } : {}),
      },
      replace,
    });
  }

  function setFilter(next: UnitsFilter | 'all') {
    go({ filter: next === 'all' ? null : next });
  }

  function openAdd(kind: 'unit' | 'beds') {
    go({ add: kind });
  }

  function toggle(ids: readonly string[], on: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      for (const id of ids) {
        if (on) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }

  function nameOf(id: string) {
    return byId.get(id)?.unit.name ?? 'This unit';
  }

  function countWord(ids: readonly string[]) {
    const beds = ids.every((id) => byId.get(id)?.unit.unit_type === 'bed_space');
    const noun = beds ? (ids.length === 1 ? 'bed' : 'beds') : ids.length === 1 ? 'unit' : 'units';
    return `${ids.length} ${noun}`;
  }

  async function changeStatus(ids: readonly string[], to: UnitStatus) {
    const targets = ids.flatMap((id) => {
      const item = byId.get(id);
      return item ? [{ unitId: id, from: item.unit.status, to }] : [];
    });
    try {
      const result = await bulkStatus.mutateAsync({ units: targets });
      if (result.changed.length > 0) {
        const word = to === 'unlisted' ? 'hidden' : 'shown on your page';
        const ids2 = result.changed.map((change) => change.unitId);
        notify.success(
          result.changed.length === 1
            ? `${nameOf(ids2[0] ?? '')} ${word}`
            : `${countWord(ids2)} ${word}`,
          {
            onUndo: () => {
              void bulkStatus.mutateAsync({
                units: result.changed.map((change) => ({
                  unitId: change.unitId,
                  from: to,
                  to: change.previous,
                })),
              });
            },
          },
        );
      }
      if (result.notReady.length > 0) {
        setNotReady({
          units: result.notReady.map((item) => ({
            id: item.unitId,
            name: nameOf(item.unitId),
            missing: item.missing,
          })),
        });
      }
      if (result.otherErrors > 0) {
        notify.error(`${result.otherErrors} couldn't be changed. Try again.`);
      }
      setSelected(new Set());
    } catch (caught) {
      notify.error(extractAppError(caught).message);
    }
  }

  async function archiveUnits(ids: readonly string[]) {
    try {
      for (const id of ids) {
        await archive.mutateAsync({ unitId: id, archived: true, expectedUpdatedAt: null });
      }
      notify.success(
        ids.length === 1 ? `${nameOf(ids[0] ?? '')} archived` : `${countWord(ids)} archived`,
        {
          onUndo: () => {
            void (async () => {
              for (const id of ids) {
                await archive.mutateAsync({ unitId: id, archived: false, expectedUpdatedAt: null });
              }
            })();
          },
        },
      );
    } catch (caught) {
      notify.error(extractAppError(caught).message);
    }
  }

  async function duplicateUnit(id: string) {
    try {
      const copy = await duplicate.mutateAsync({ unitId: id });
      notify.success(`Copied as ${copy.name}`, {
        onUndo: () =>
          void archive.mutateAsync({ unitId: copy.id, archived: true, expectedUpdatedAt: null }),
      });
    } catch (caught) {
      const error = extractAppError(caught);
      notify.error(error.message);
    }
  }

  async function saveOrder(ids: string[], previous: string[]) {
    if (!propertyId) return;
    try {
      await reorder.mutateAsync({ propertyId, unitIds: ids });
      notify.success('Order saved', {
        onUndo: () => void reorder.mutateAsync({ propertyId, unitIds: previous }),
      });
    } catch (caught) {
      notify.error(extractAppError(caught).message);
    }
  }

  function moveEntry(index: number, by: -1 | 1) {
    const order = toEntries(all);
    const target = index + by;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    const [moved] = next.splice(index, 1);
    if (!moved) return;
    next.splice(target, 0, moved);
    void saveOrder(
      next.flatMap(entryUnitIds),
      all.map((item) => item.unit.id),
    );
  }

  if (units.isPending || property.isPending) {
    return (
      <section className="space-y-4" aria-busy="true">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-full max-w-sm" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="aspect-[4/3] w-full" />
          <Skeleton className="aspect-[4/3] w-full" />
        </div>
      </section>
    );
  }

  if (units.isError || property.isError) {
    return (
      <ErrorState
        title="We couldn't load your units"
        message={extractAppError(units.error ?? property.error).message}
        onRetry={() => {
          void units.refetch();
          void property.refetch();
        }}
      />
    );
  }

  const selectedIds = [...selected].filter((id) => byId.has(id));
  const header = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="font-heading text-2xl font-semibold">Units</h1>
      {all.length > 0 ? (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="min-h-11 sm:min-h-9"
            aria-pressed={reordering}
            onClick={() => {
              setReordering((on) => !on);
              setSelecting(false);
            }}
          >
            <GripVerticalIcon aria-hidden="true" />
            {reordering ? 'Done' : 'Reorder'}
          </Button>
          <Button
            variant="outline"
            className="min-h-11 sm:min-h-9"
            aria-pressed={selecting}
            onClick={() => {
              setSelecting((on) => !on);
              setReordering(false);
              setSelected(new Set());
            }}
          >
            {selecting ? <XIcon aria-hidden="true" /> : <ListChecksIcon aria-hidden="true" />}
            {selecting ? 'Cancel' : 'Select'}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button className="hidden min-h-9 lg:inline-flex" disabled={propertyId === null}>
                  <PlusIcon aria-hidden="true" />
                  Add
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openAdd('unit')}>Add a unit</DropdownMenuItem>
              <DropdownMenuItem onClick={() => openAdd('beds')}>Add bed spaces</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : null}
    </div>
  );

  const sheet = (
    <AddUnitSheet
      open={search.add !== undefined}
      kind={search.add ?? 'unit'}
      propertyId={propertyId}
      unitCount={all.length}
      onKindChange={(kind) => go({ add: kind }, true)}
      onClose={() => go({ add: null })}
    />
  );

  if (all.length === 0) {
    return (
      <section className="space-y-6">
        {header}
        <EmptyState
          icon={<MilestonePicture art="no_units" size="sm" />}
          title="No units yet"
          description="Add your first room, suite or bed to start taking bookings."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                className="min-h-11"
                disabled={propertyId === null}
                onClick={() => openAdd('unit')}
              >
                <PlusIcon aria-hidden="true" />
                Add unit
              </Button>
              <Button
                variant="outline"
                className="min-h-11"
                disabled={propertyId === null}
                onClick={() => openAdd('beds')}
              >
                <BedDoubleIcon aria-hidden="true" />
                Add bed spaces
              </Button>
            </div>
          }
        />
        {propertyId === null ? (
          <p className="text-center text-sm text-muted-foreground">
            Add your place first.{' '}
            <Link
              to="/onboarding"
              search={{ step: 1 }}
              className="font-medium text-primary-hover underline"
            >
              Set up your place
            </Link>
          </p>
        ) : null}
        {sheet}
      </section>
    );
  }

  const menuFor = (item: OwnerUnitListItemView) => (
    <UnitMenu
      item={item}
      onShow={() => void changeStatus([item.unit.id], 'listed')}
      onHide={() => void changeStatus([item.unit.id], 'unlisted')}
      onDuplicate={() => void duplicateUnit(item.unit.id)}
      onArchive={() => void archiveUnits([item.unit.id])}
    />
  );

  return (
    <section className="space-y-5 pb-24 lg:pb-0">
      {header}

      <div role="group" aria-label="Show" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {FILTERS.map((item) => {
          const active = (filter ?? 'all') === item.value;
          const value = item.value;
          const count =
            value === 'all'
              ? all.length
              : all.filter((unit) => unit.unit.status === FILTER_STATUS[value]).length;
          return (
            <Button
              key={item.value}
              variant="outline"
              aria-pressed={active}
              className={cn(
                'min-h-11 shrink-0 rounded-full sm:min-h-9',
                active &&
                  'border-primary bg-primary-tint text-foreground hover-hover:hover:bg-primary-tint',
              )}
              onClick={() => setFilter(item.value)}
            >
              {item.label}
              <span className="text-muted-foreground tabular">{count}</span>
            </Button>
          );
        })}
      </div>

      {reordering ? (
        <ReorderList
          entries={toEntries(all)}
          onChange={(ids) =>
            void saveOrder(
              ids,
              all.map((item) => item.unit.id),
            )
          }
          onMove={moveEntry}
        />
      ) : entries.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No units here.{' '}
          <button
            type="button"
            className="font-medium text-primary-hover underline"
            onClick={() => setFilter('all')}
          >
            Show all
          </button>
        </p>
      ) : (
        <>
          {/* Phones and tablets: cards */}
          <ul className="grid gap-3 sm:grid-cols-2 lg:hidden">
            {entries.map((entry) =>
              entry.kind === 'unit' ? (
                <li key={entry.key}>
                  <UnitCard
                    item={entry.item}
                    selecting={selecting}
                    checked={selected.has(entry.item.unit.id)}
                    onCheck={(on) => toggle([entry.item.unit.id], on)}
                    menu={menuFor(entry.item)}
                  />
                </li>
              ) : (
                <li key={entry.key} className="sm:col-span-2">
                  <RoomCard
                    label={entry.label}
                    beds={entry.beds}
                    selecting={selecting}
                    selected={selected}
                    onCheck={toggle}
                    menuFor={menuFor}
                  />
                </li>
              ),
            )}
          </ul>
          {/* Desktop: a plain table */}
          <div className="hidden overflow-hidden rounded-xl border border-border bg-card lg:block">
            <Table>
              <TableHeader>
                <TableRow>
                  {selecting ? (
                    <TableHead className="w-10">
                      <span className="sr-only">Select</span>
                    </TableHead>
                  ) : null}
                  <TableHead>Unit</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.flatMap((entry) => {
                  const rows: React.ReactNode[] = [];
                  if (entry.kind === 'room') {
                    const ids = entry.beds.map((bed) => bed.unit.id);
                    const listed = entry.beds.filter((bed) => bed.unit.status === 'listed').length;
                    rows.push(
                      <TableRow key={entry.key} className="bg-muted/50 hover:bg-muted/50">
                        {selecting ? (
                          <TableCell>
                            <Checkbox
                              aria-label={`Select every bed in ${entry.label}`}
                              checked={ids.every((id) => selected.has(id))}
                              onCheckedChange={(on) => toggle(ids, on)}
                            />
                          </TableCell>
                        ) : null}
                        <TableCell colSpan={5} className="font-medium">
                          {entry.label}
                          <span className="text-muted-foreground">
                            {' '}
                            · {entry.beds.length} beds · {listed} listed
                          </span>
                        </TableCell>
                      </TableRow>,
                    );
                  }
                  const items = entry.kind === 'unit' ? [entry.item] : entry.beds;
                  for (const item of items) {
                    rows.push(
                      <TableRow key={item.unit.id}>
                        {selecting ? (
                          <TableCell>
                            <Checkbox
                              aria-label={`Select ${item.unit.name}`}
                              checked={selected.has(item.unit.id)}
                              onCheckedChange={(on) => toggle([item.unit.id], on)}
                            />
                          </TableCell>
                        ) : null}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Cover item={item} className="w-16 shrink-0 rounded-md" />
                            <Link
                              to="/units/$unitId"
                              params={{ unitId: item.unit.id }}
                              className="line-clamp-2 font-medium underline-offset-4 hover-hover:hover:underline"
                            >
                              {item.unit.name}
                            </Link>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {UNIT_TYPE_LABEL[item.unit.unit_type]}
                        </TableCell>
                        <TableCell className="tabular">
                          {unitPriceText(item) ?? (
                            <span className="text-muted-foreground">No price yet</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <UnitStatusBadge status={item.unit.status} />
                        </TableCell>
                        <TableCell>{menuFor(item)}</TableCell>
                      </TableRow>,
                    );
                  }
                  return rows;
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {selecting && selectedIds.length > 0 ? (
        <div
          role="region"
          aria-label="Selected units"
          className="dock-pill fixed inset-x-3 z-40 mx-auto flex -translate-y-[calc(100%+0.75rem)] items-center gap-2 rounded-2xl border border-border bg-popover px-3 shadow-lg lg:static lg:h-auto lg:max-w-none lg:translate-y-0 lg:rounded-xl lg:py-2 lg:shadow-none"
        >
          <span className="flex-1 text-sm font-medium tabular">{selectedIds.length} selected</span>
          <Button
            variant="outline"
            className="min-h-11 lg:min-h-9"
            onClick={() => void changeStatus(selectedIds, 'unlisted')}
          >
            <EyeOffIcon aria-hidden="true" />
            Hide
          </Button>
          <Button
            variant="outline"
            className="min-h-11 lg:min-h-9"
            onClick={() => void changeStatus(selectedIds, 'listed')}
          >
            <EyeIcon aria-hidden="true" />
            Show
          </Button>
          <Button
            className="min-h-11 lg:min-h-9"
            onClick={() => {
              setPrice(null);
              setPriceOpen(true);
            }}
          >
            Change price
          </Button>
        </div>
      ) : null}

      {!selecting && !reordering && keyboard === 0 ? (
        <div className="dock-pill fixed inset-x-0 z-20 mx-auto flex h-auto! -translate-y-[calc(100%+0.75rem)] justify-center lg:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button className="h-12 rounded-full px-5 shadow-lg" disabled={propertyId === null}>
                  <PlusIcon aria-hidden="true" />
                  Add unit
                </Button>
              }
            />
            <DropdownMenuContent align="center" side="top">
              <DropdownMenuItem onClick={() => openAdd('unit')}>Add a unit</DropdownMenuItem>
              <DropdownMenuItem onClick={() => openAdd('beds')}>Add bed spaces</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : null}

      <ResponsiveDialog open={priceOpen} onOpenChange={setPriceOpen}>
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Change price for {countWord(selectedIds)}</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              Nightly units get this price a night; monthly units get it a month.
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <Field>
            <FieldLabel htmlFor="bulk-price">New price</FieldLabel>
            <MoneyInput id="bulk-price" value={price} onValueChange={setPrice} per="each" />
          </Field>
          <ResponsiveDialogFooter>
            <Button variant="outline" className="min-h-11" onClick={() => setPriceOpen(false)}>
              Cancel
            </Button>
            <AsyncButton
              className="min-h-11"
              state={bulkPrice.isPending ? 'busy' : 'idle'}
              disabled={price === null || price <= 0}
              onClick={() => {
                if (price === null || !today) return;
                void bulkPrice
                  .mutateAsync({
                    units: selectedIds.map((unitId) => ({ unitId, centavos: price })),
                    today,
                  })
                  .then((result) => {
                    setPriceOpen(false);
                    setSelected(new Set());
                    notify.success(`Price changed for ${countWord(selectedIds)}`, {
                      onUndo: () =>
                        void bulkPrice.mutateAsync({
                          units: result.previous.map((item) => ({
                            unitId: item.unitId,
                            centavos: item.centavos,
                          })),
                          today,
                        }),
                    });
                  })
                  .catch((caught: unknown) => notify.error(extractAppError(caught).message));
              }}
            >
              Change price
            </AsyncButton>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      <ResponsiveDialog
        open={notReady !== null}
        onOpenChange={(open) => !open && setNotReady(null)}
      >
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>
              {notReady?.units.length === 1
                ? `${notReady.units[0]?.name ?? 'This unit'} can't be listed yet`
                : `${notReady?.units.length ?? 0} units can't be listed yet`}
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              Finish these first, then show it on your page.
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <ul className="space-y-3">
            {notReady?.units.map((unit) => (
              <li key={unit.id} className="space-y-1">
                {notReady.units.length > 1 ? (
                  <p className="text-sm font-medium">{unit.name}</p>
                ) : null}
                <ul className="space-y-1">
                  {unit.missing.map((missing) => (
                    <li key={missing}>
                      <Link
                        to="/units/$unitId"
                        params={{ unitId: unit.id }}
                        search={{ section: missing === 'photos' ? 'photos' : 'price' }}
                        className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary-hover underline-offset-4 hover-hover:hover:underline"
                      >
                        {missing === 'photos' ? (
                          <ImageIcon aria-hidden="true" className="size-4" />
                        ) : null}
                        {MISSING_LABEL[missing] ?? missing}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
          <ResponsiveDialogFooter>
            <Button variant="outline" className="min-h-11" onClick={() => setNotReady(null)}>
              Close
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      {sheet}
    </section>
  );
}

function Cover({
  item,
  className,
}: {
  readonly item: OwnerUnitListItemView;
  readonly className?: string;
}) {
  return (
    <div className={cn('aspect-[4/3] overflow-hidden bg-muted', className)}>
      {item.cover_photo ? (
        <img src={item.cover_photo.url} alt="" loading="lazy" className="size-full object-cover" />
      ) : (
        <div className="flex size-full items-center justify-center text-muted-foreground">
          <ImageIcon aria-hidden="true" className="size-5" />
        </div>
      )}
    </div>
  );
}

function UnitMenu({
  item,
  onShow,
  onHide,
  onDuplicate,
  onArchive,
}: {
  readonly item: OwnerUnitListItemView;
  readonly onShow: () => void;
  readonly onHide: () => void;
  readonly onDuplicate: () => void;
  readonly onArchive: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="size-11 sm:size-9"
            aria-label={`More for ${item.unit.name}`}
          />
        }
      >
        <MoreHorizontalIcon aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem render={<Link to="/units/$unitId" params={{ unitId: item.unit.id }} />}>
          <PencilIcon aria-hidden="true" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDuplicate}>
          <CopyIcon aria-hidden="true" />
          Duplicate
        </DropdownMenuItem>
        {item.unit.status === 'listed' ? (
          <DropdownMenuItem onClick={onHide}>
            <EyeOffIcon aria-hidden="true" />
            Hide from page
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={onShow}>
            <EyeIcon aria-hidden="true" />
            Show on page
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onArchive}>
          <ArchiveIcon aria-hidden="true" />
          Archive
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UnitCard({
  item,
  selecting,
  checked,
  onCheck,
  menu,
}: {
  readonly item: OwnerUnitListItemView;
  readonly selecting: boolean;
  readonly checked: boolean;
  readonly onCheck: (on: boolean) => void;
  readonly menu: React.ReactNode;
}) {
  const price = unitPriceText(item);
  return (
    <article className="relative overflow-hidden rounded-xl border border-border bg-card">
      <Cover item={item} />
      {selecting ? (
        <div className="absolute top-2 left-2 z-10 flex size-11 items-center justify-center rounded-lg bg-background/90">
          <Checkbox
            aria-label={`Select ${item.unit.name}`}
            checked={checked}
            onCheckedChange={onCheck}
          />
        </div>
      ) : null}
      <div className="flex items-start gap-2 p-3">
        <div className="min-w-0 flex-1 space-y-1">
          <Link
            to="/units/$unitId"
            params={{ unitId: item.unit.id }}
            className="line-clamp-2 font-medium after:absolute after:inset-0 after:content-['']"
          >
            {item.unit.name}
          </Link>
          <p className="text-sm text-muted-foreground">
            {UNIT_TYPE_LABEL[item.unit.unit_type]}
            {price ? (
              <>
                {' · '}
                <span className="text-foreground tabular">{price}</span>
              </>
            ) : null}
          </p>
          <UnitStatusBadge status={item.unit.status} />
        </div>
        <div className="relative z-10">{menu}</div>
      </div>
    </article>
  );
}

function RoomCard({
  label,
  beds,
  selecting,
  selected,
  onCheck,
  menuFor,
}: {
  readonly label: string;
  readonly beds: readonly OwnerUnitListItemView[];
  readonly selecting: boolean;
  readonly selected: ReadonlySet<string>;
  readonly onCheck: (ids: readonly string[], on: boolean) => void;
  readonly menuFor: (item: OwnerUnitListItemView) => React.ReactNode;
}) {
  const listed = beds.filter((bed) => bed.unit.status === 'listed').length;
  const ids = beds.map((bed) => bed.unit.id);
  const first = beds[0];
  const price = first ? unitPriceText(first) : null;
  return (
    <article className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center gap-3 border-b border-border p-3">
        {first ? <Cover item={first} className="w-20 shrink-0 rounded-md" /> : null}
        <div className="min-w-0 flex-1">
          <h2 className="line-clamp-2 font-medium">{label}</h2>
          <p className="text-sm text-muted-foreground tabular">
            {beds.length} beds · {listed} listed{price ? ` · ${price}` : ''}
          </p>
        </div>
        {selecting ? (
          <div className="flex size-11 items-center justify-center">
            <Checkbox
              aria-label={`Select every bed in ${label}`}
              checked={ids.every((id) => selected.has(id))}
              onCheckedChange={(on) => onCheck(ids, on)}
            />
          </div>
        ) : null}
      </div>
      <ul className="divide-y divide-border">
        {beds.map((bed) => (
          <li key={bed.unit.id} className="flex items-center gap-2 px-3 py-1">
            {selecting ? (
              <div className="flex size-11 items-center justify-center">
                <Checkbox
                  aria-label={`Select ${bed.unit.name}`}
                  checked={selected.has(bed.unit.id)}
                  onCheckedChange={(on) => onCheck([bed.unit.id], on)}
                />
              </div>
            ) : null}
            <Link
              to="/units/$unitId"
              params={{ unitId: bed.unit.id }}
              className="flex min-h-11 min-w-0 flex-1 items-center text-sm font-medium"
            >
              <span className="truncate">{bed.unit.name.replace(`${label} · `, '')}</span>
            </Link>
            <UnitStatusBadge status={bed.unit.status} />
            {menuFor(bed)}
          </li>
        ))}
      </ul>
    </article>
  );
}

function ReorderList({
  entries,
  onChange,
  onMove,
}: {
  readonly entries: readonly Entry[];
  readonly onChange: (unitIds: string[]) => void;
  readonly onMove: (index: number, by: -1 | 1) => void;
}) {
  const keys = entries.map((entry) => entry.key);
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        Drag the handle, or use the arrows. Guests see your units in this order. Beds move with
        their room.
      </p>
      <Sortable
        value={keys}
        getItemValue={(key) => key}
        onValueChange={(nextKeys) => {
          const ordered = nextKeys.flatMap((key) => {
            const entry = entries.find((item) => item.key === key);
            return entry ? entryUnitIds(entry) : [];
          });
          onChange(ordered);
        }}
        className="flex flex-col gap-2"
      >
        {entries.map((entry, index) => {
          const name =
            entry.kind === 'unit'
              ? entry.item.unit.name
              : `${entry.label} · ${entry.beds.length} beds`;
          return (
            <SortableItem
              key={entry.key}
              value={entry.key}
              role="group"
              tabIndex={-1}
              className="flex items-center gap-2 rounded-lg border border-border bg-card p-1.5"
            >
              <SortableItemHandle
                render={<button type="button" />}
                aria-label={`Drag ${name}`}
                className="flex size-11 cursor-grab items-center justify-center rounded-md text-muted-foreground"
              >
                <GripVerticalIcon aria-hidden="true" className="size-4" />
              </SortableItemHandle>
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="size-11"
                aria-label={`Move ${name} up`}
                disabled={index === 0}
                onClick={() => onMove(index, -1)}
              >
                <ArrowUpIcon aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-11"
                aria-label={`Move ${name} down`}
                disabled={index === entries.length - 1}
                onClick={() => onMove(index, 1)}
              >
                <ArrowDownIcon aria-hidden="true" />
              </Button>
            </SortableItem>
          );
        })}
      </Sortable>
    </div>
  );
}
