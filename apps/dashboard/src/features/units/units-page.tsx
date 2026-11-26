import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  EyeIcon,
  EyeOffIcon,
  GripVerticalIcon,
  LayoutGridIcon,
  ListChecksIcon,
  MoreHorizontalIcon,
  PlusIcon,
  Rows3Icon,
  TagIcon,
  XIcon,
} from 'lucide-react';
import {
  countPlanUnits,
  readErrorDetails,
  type OwnerUnitListItemView,
  type UnitStatus,
} from '@smartapp/core';
import { Button } from '@smartapp/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@smartapp/ui/components/dropdown-menu';
import { Field, FieldLabel } from '@smartapp/ui/components/field';
import { Skeleton } from '@smartapp/ui/components/skeleton';
import { Sortable, SortableItem, SortableItemHandle } from '@smartapp/ui/components/sortable';
import { AppSheet } from '@smartapp/ui/compositions/app-sheet';
import { AsyncButton } from '@smartapp/ui/compositions/async-button';
import { EmptyState } from '@smartapp/ui/compositions/empty-state';
import { ErrorState } from '@smartapp/ui/compositions/error-state';
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
import { MilestonePicture } from '@smartapp/ui/compositions/milestone-picture';
import { MoneyInput } from '@smartapp/ui/compositions/money-input';
import { PageHeader } from '@smartapp/ui/compositions/page-header';
import { SegmentedControl } from '@smartapp/ui/compositions/segmented-control';
import { notify } from '@smartapp/ui/lib/notify';
import { cn } from '@smartapp/ui/lib/utils';
import { useDashboard } from '@/app/dashboard-context';
import { useMyAccountQuery } from '@/data/auth/reads';
import { useOwnerPropertyQuery } from '@/data/property/reads';
import { extractAppError } from '@/data/shared';
import {
  useBulkArchiveMutation,
  useBulkUnitPriceMutation,
  useBulkUnitStatusMutation,
} from '@/data/units/bulk';
import { useOwnerUnitsQuery } from '@/data/units/reads';
import {
  useDeleteUnitMutation,
  useDuplicateUnitMutation,
  useReorderUnitsMutation,
} from '@/data/units/writes';
import { AddUnitSheet } from './add-unit-sheet';
import { UnitNotReadySheet, type NotReadyState } from './unit-not-ready-sheet';
import { UNIT_STATUS_META } from './unit-words';
import {
  RoomCard,
  UnitCard,
  UnitsTable,
  entryUnitIds,
  toEntries,
  type UnitEntry,
  type UnitListActions,
} from './units-list';

export type UnitsFilter = 'listed' | 'hidden' | 'drafts' | 'archived';

export interface UnitsSearch {
  readonly filter?: UnitsFilter;
  readonly add?: 'unit' | 'beds';
  readonly room?: string;
}

type UnitsView = 'cards' | 'table';

const FILTER_STATUS: Record<Exclude<UnitsFilter, 'archived'>, UnitStatus> = {
  listed: 'listed',
  hidden: 'unlisted',
  drafts: 'draft',
};

const FILTERS: readonly {
  readonly value: UnitsFilter | 'all';
  readonly label: string;
  readonly status?: UnitStatus;
}[] = [
  { value: 'all', label: 'All' },
  { value: 'listed', label: 'Listed', status: 'listed' },
  { value: 'hidden', label: 'Hidden', status: 'unlisted' },
  { value: 'drafts', label: 'Drafts', status: 'draft' },
  { value: 'archived', label: 'Archived' },
];

const VIEW_KEY = 'smartapp:units-view';
/** Above this many units the table is the default (pattern guide §3.8); the owner's own pick wins. */
const TABLE_DEFAULT_ABOVE = 8;

function readSavedView(): UnitsView | null {
  try {
    const saved = window.localStorage.getItem(VIEW_KEY);
    return saved === 'cards' || saved === 'table' ? saved : null;
  } catch {
    return null;
  }
}

function saveView(view: UnitsView) {
  try {
    window.localStorage.setItem(VIEW_KEY, view);
  } catch {
    // Private mode or storage off: the switch still works for this visit.
  }
}

function matchesFilter(item: OwnerUnitListItemView, filter: UnitsFilter | null): boolean {
  const archived = item.unit.archived_at !== null;
  if (filter === 'archived') return archived;
  if (archived) return false;
  return filter === null || item.unit.status === FILTER_STATUS[filter];
}

/** /units (OW-08, OW-27, F24, R-1): every unit and bed space, grouped, with filters and bulk actions. */
export function UnitsPage() {
  const search = useSearch({ from: '/app-frame/units' });
  const navigate = useNavigate();
  const { today, client } = useDashboard();
  const account = useMyAccountQuery();
  const property = useOwnerPropertyQuery();
  // Archived units are read too, so they can be found and restored (AUDIT-1 A1).
  const units = useOwnerUnitsQuery(null, true);
  const bulkStatus = useBulkUnitStatusMutation();
  const bulkPrice = useBulkUnitPriceMutation();
  const bulkArchive = useBulkArchiveMutation();
  const deleteUnit = useDeleteUnitMutation();
  const duplicate = useDuplicateUnitMutation();
  const reorder = useReorderUnitsMutation();

  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [reordering, setReordering] = useState(false);
  const [notReady, setNotReady] = useState<NotReadyState | null>(null);
  const [limitSheetOpen, setLimitSheetOpen] = useState(false);
  const [priceOpen, setPriceOpen] = useState(false);
  const [nightlyPrice, setNightlyPrice] = useState<number | null>(null);
  const [monthlyPrice, setMonthlyPrice] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<readonly string[] | null>(null);
  const [savedView, setSavedView] = useState<UnitsView | null>(readSavedView);
  const listRef = useRef<HTMLDivElement>(null);

  const everything = useMemo(() => units.data ?? [], [units.data]);
  const all = useMemo(
    () => everything.filter((item) => item.unit.archived_at === null),
    [everything],
  );
  const archivedCount = everything.length - all.length;
  const byId = useMemo(() => new Map(everything.map((item) => [item.unit.id, item])), [everything]);
  const filter = search.filter ?? null;
  const showingArchived = filter === 'archived';
  const visible = everything.filter((item) => matchesFilter(item, filter));
  const entries = toEntries(visible);
  const propertyId = property.data?.property.id ?? null;
  const view: UnitsView = savedView ?? (all.length > TABLE_DEFAULT_ABOVE ? 'table' : 'cards');

  const planUnitsUsed = useMemo(() => countPlanUnits(all.map((item) => item.unit)), [all]);
  const planLimitTotal =
    (account.data?.plan?.included_units ?? 5) + (account.data?.subscription?.extra_units ?? 0);
  const planLimitEnforced = client?.planLimit !== 'off';
  const atPlanLimit = planLimitEnforced && planUnitsUsed >= planLimitTotal;

  function go(
    change: { filter?: UnitsFilter | null; add?: 'unit' | 'beds' | null; room?: string | null },
    replace = false,
  ) {
    const filterValue = change.filter === undefined ? search.filter : change.filter;
    const addValue = change.add === undefined ? search.add : change.add;
    const roomValue =
      change.room !== undefined ? change.room : addValue === 'beds' ? search.room : null;
    void navigate({
      to: '/units',
      search: {
        ...(filterValue ? { filter: filterValue } : {}),
        ...(addValue ? { add: addValue } : {}),
        ...(roomValue ? { room: roomValue } : {}),
      },
      replace,
    });
  }

  function setFilter(next: UnitsFilter | 'all') {
    setSelected(new Set());
    go({ filter: next === 'all' ? null : next });
  }

  function openAdd(kind: 'unit' | 'beds', roomId?: string) {
    if (planLimitEnforced) {
      if (kind === 'beds' && roomId && propertyId) {
        const afterAddingOneBed = countPlanUnits([
          ...all.map((item) => item.unit),
          {
            property_id: propertyId,
            unit_type: 'bed_space',
            room_id: roomId,
            archived_at: null,
          },
        ]);
        if (afterAddingOneBed > planLimitTotal) {
          setLimitSheetOpen(true);
          return;
        }
      } else if (atPlanLimit) {
        setLimitSheetOpen(true);
        return;
      }
    }
    go({ add: kind, room: roomId ?? null });
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

  function stopSelecting() {
    setSelecting(false);
    setSelected(new Set());
  }

  function nameOf(id: string) {
    return byId.get(id)?.unit.name ?? 'This unit';
  }

  function countWord(ids: readonly string[]) {
    const beds = ids.every((id) => byId.get(id)?.unit.unit_type === 'bed_space');
    const noun = beds ? (ids.length === 1 ? 'bed' : 'beds') : ids.length === 1 ? 'unit' : 'units';
    return `${ids.length} ${noun}`;
  }

  function doneWord(ids: readonly string[], word: string) {
    return ids.length === 1 ? `${nameOf(ids[0] ?? '')} ${word}` : `${countWord(ids)} ${word}`;
  }

  async function changeStatus(ids: readonly string[], to: UnitStatus) {
    const targets = ids.flatMap((id) => {
      const item = byId.get(id);
      return item && item.unit.status !== to ? [{ unitId: id, from: item.unit.status, to }] : [];
    });
    if (targets.length === 0) return;
    try {
      const result = await bulkStatus.mutateAsync({ units: targets });
      if (result.changed.length > 0) {
        const word = to === 'unlisted' ? 'hidden' : 'shown on your page';
        notify.success(
          doneWord(
            result.changed.map((change) => change.unitId),
            word,
          ),
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
      stopSelecting();
    } catch (caught) {
      notify.error(extractAppError(caught).message);
    }
  }

  async function setArchived(ids: readonly string[], archived: boolean) {
    const targets = ids.filter((id) => {
      const item = byId.get(id);
      return item !== undefined && (item.unit.archived_at !== null) !== archived;
    });
    if (targets.length === 0) return;
    try {
      const result = await bulkArchive.mutateAsync({ unitIds: targets, archived });
      if (result.changed.length > 0) {
        notify.success(doneWord(result.changed, archived ? 'archived' : 'restored as hidden'), {
          onUndo: () =>
            void bulkArchive.mutateAsync({ unitIds: result.changed, archived: !archived }),
        });
      }
      if (result.failed > 0) {
        const details = readErrorDetails(extractAppError(result.firstError));
        if (!archived && details.reason === 'unit_limit') {
          setLimitSheetOpen(true);
        } else {
          notify.error(
            `${result.failed} couldn't be ${archived ? 'archived' : 'restored'}. ${extractAppError(result.firstError).message}`,
          );
        }
      }
      stopSelecting();
    } catch (caught) {
      notify.error(extractAppError(caught).message);
    }
  }

  async function duplicateUnit(id: string) {
    try {
      const copy = await duplicate.mutateAsync({ unitId: id });
      notify.success(`Added ${copy.name}, hidden for now`, {
        onUndo: () => void bulkArchive.mutateAsync({ unitIds: [copy.id], archived: true }),
      });
    } catch (caught) {
      const error = extractAppError(caught);
      if (readErrorDetails(error).reason === 'unit_limit') {
        setLimitSheetOpen(true);
        return;
      }
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

  /** Deletes never-booked units (AUDIT-1 A20) after the owner confirms; there is no Undo. */
  async function confirmDelete() {
    if (!deleting) return;
    const ids = deleting;
    let removed = 0;
    for (const unitId of ids) {
      try {
        await deleteUnit.mutateAsync({ unitId });
        removed += 1;
      } catch (caught) {
        notify.error(extractAppError(caught).message);
        break;
      }
    }
    setDeleting(null);
    stopSelecting();
    if (removed > 0)
      notify.success(
        removed === 1 && ids.length === 1
          ? `${nameOf(ids[0] ?? '')} deleted`
          : `${removed} deleted`,
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
  const selectedItems = selectedIds.flatMap((id) => {
    const item = byId.get(id);
    return item ? [item] : [];
  });
  const selectedNightly = selectedItems.filter((item) => item.unit.mode === 'short_stay');
  const selectedMonthly = selectedItems.filter((item) => item.unit.mode === 'long_term');
  // TopBar already shows "Units" at every size (D73).
  const srTitle = <PageHeader title="Units" />;

  const actions: UnitListActions = {
    selecting,
    selected,
    onToggle: toggle,
    onStartSelecting: (ids) => {
      setReordering(false);
      setSelecting(true);
      setSelected(new Set(ids));
    },
    onShow: (ids) => void changeStatus(ids, 'listed'),
    onHide: (ids) => void changeStatus(ids, 'unlisted'),
    onArchive: (ids) => void setArchived(ids, true),
    onRestore: (ids) => void setArchived(ids, false),
    onDuplicate: (id) => void duplicateUnit(id),
    onAddBed: (roomId) => openAdd('beds', roomId),
    onDelete: (ids) => setDeleting(ids),
  };

  const sheet = (
    <AddUnitSheet
      open={search.add !== undefined}
      kind={search.add ?? 'unit'}
      propertyId={propertyId}
      units={all}
      initialRoom={search.room ?? null}
      onKindChange={(kind) =>
        go({ add: kind, room: kind === 'beds' ? (search.room ?? null) : null }, true)
      }
      onClose={() => go({ add: null, room: null })}
    />
  );

  const planLimitSheet = (
    <AppSheet
      open={limitSheetOpen}
      onOpenChange={setLimitSheetOpen}
      size="sm"
      title={`You've used all ${planLimitTotal} units on your plan`}
      description="Add more units to your plan, or archive a unit you're not renting right now."
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            onClick={() => {
              setLimitSheetOpen(false);
              if (showingArchived) setFilter('all');
              listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          >
            Archive a unit
          </Button>
          <Button
            className="min-h-11"
            render={<Link to="/settings/plan" />}
            onClick={() => setLimitSheetOpen(false)}
          >
            See plans
          </Button>
        </>
      }
    >
      <p className="text-sm text-muted-foreground tabular">
        Currently using {planUnitsUsed} of {planLimitTotal} units on your plan. A room of up to 12
        bed spaces counts as 1 unit.
      </p>
    </AppSheet>
  );

  if (everything.length === 0) {
    return (
      <section className="space-y-6">
        {srTitle}
        <EmptyState
          icon={<MilestonePicture art="no_units" size="sm" />}
          title="No units yet"
          description="Add your first room, suite or bed to start taking bookings."
          action={
            <Button
              className="min-h-11"
              disabled={propertyId === null}
              onClick={() => openAdd('unit')}
            >
              <PlusIcon aria-hidden="true" />
              Add unit
            </Button>
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

  const filtersShown = FILTERS.filter(
    (item) => item.value !== 'archived' || archivedCount > 0 || showingArchived,
  );

  return (
    <section className={cn('space-y-4', selecting && selectedIds.length > 0 && 'pb-24 lg:pb-0')}>
      {srTitle}

      {/* D73: phones put [+ Add unit] (left) and the view switch and ⋯ (right) above the chips; desktop puts them right of the chips. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="order-1 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 sm:order-2 sm:shrink-0 sm:flex-nowrap sm:justify-end">
          <Button
            className="min-h-11 sm:min-h-9"
            disabled={propertyId === null}
            onClick={() => openAdd('unit')}
          >
            <PlusIcon aria-hidden="true" />
            Add unit
          </Button>
          {/* Phones: this line wraps under the buttons; from 640px it sits beside Add unit. */}
          <span className="order-3 basis-full text-xs text-muted-foreground tabular sm:order-none sm:mr-auto sm:basis-auto">
            {planUnitsUsed} of {planLimitTotal} units on your plan
          </span>
          <div className="flex items-center gap-2">
            {reordering ? (
              <Button
                variant="outline"
                className="min-h-11 sm:min-h-9"
                onClick={() => setReordering(false)}
              >
                Done
              </Button>
            ) : null}
            {selecting ? (
              <Button variant="outline" className="min-h-11 sm:min-h-9" onClick={stopSelecting}>
                <XIcon aria-hidden="true" />
                Cancel
              </Button>
            ) : null}
            {reordering ? null : (
              <SegmentedControl<UnitsView>
                aria-label="View"
                size="sm"
                value={view}
                onValueChange={(next) => {
                  setSavedView(next);
                  saveView(next);
                }}
                options={[
                  {
                    value: 'cards',
                    label: <span className="sr-only">Cards</span>,
                    icon: <LayoutGridIcon aria-hidden="true" />,
                  },
                  {
                    value: 'table',
                    label: <span className="sr-only">Table</span>,
                    icon: <Rows3Icon aria-hidden="true" />,
                  },
                ]}
              />
            )}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-11 sm:size-9"
                    aria-label="More unit actions"
                  />
                }
              >
                <MoreHorizontalIcon aria-hidden="true" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  disabled={showingArchived}
                  onClick={() => {
                    setReordering((on) => !on);
                    stopSelecting();
                  }}
                >
                  <GripVerticalIcon aria-hidden="true" />
                  {reordering ? 'Done reordering' : 'Reorder'}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    if (selecting) {
                      stopSelecting();
                    } else {
                      setSelecting(true);
                      setReordering(false);
                    }
                  }}
                >
                  <ListChecksIcon aria-hidden="true" />
                  {selecting ? 'Cancel selection' : 'Select'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div
          role="group"
          aria-label="Show"
          className="order-2 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:order-1 sm:pb-0"
        >
          {filtersShown.map((item) => {
            const active = (filter ?? 'all') === item.value;
            const value = item.value;
            const count =
              value === 'all'
                ? all.length
                : value === 'archived'
                  ? archivedCount
                  : all.filter((unit) => unit.unit.status === FILTER_STATUS[value]).length;
            const statusMeta = item.status ? UNIT_STATUS_META[item.status] : null;
            const StatusIcon = statusMeta?.icon ?? null;
            return (
              <Button
                key={item.value}
                variant="outline"
                aria-pressed={active}
                className={cn(
                  'min-h-11 shrink-0 rounded-full sm:min-h-9',
                  count === 0 && !active && 'text-muted-foreground',
                  active &&
                    'border-primary bg-primary-tint text-foreground hover-hover:hover:bg-primary-tint',
                )}
                onClick={() => setFilter(item.value)}
              >
                {StatusIcon && statusMeta ? (
                  <StatusIcon aria-hidden="true" className={cn('size-3.5', statusMeta.iconTone)} />
                ) : null}
                {value === 'archived' ? (
                  <ArchiveIcon aria-hidden="true" className="size-3.5" />
                ) : null}
                {item.label}
                <span className="text-muted-foreground tabular">{count}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {selecting && selectedIds.length === 0 ? (
        <p className="text-sm text-muted-foreground" role="status">
          Tap units to select them.
        </p>
      ) : null}

      {showingArchived && !selecting ? (
        <p className="text-sm text-muted-foreground">
          Archived units are off your page and don&rsquo;t count toward your plan. Restore one to
          bring it back hidden, then show it when it&rsquo;s ready.
        </p>
      ) : null}

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
      ) : visible.length === 0 ? (
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
      ) : view === 'table' ? (
        <div ref={listRef}>
          <UnitsTable entries={entries} actions={actions} />
        </div>
      ) : (
        <div ref={listRef}>
          {/* Cards: rows on phones (< 640px), auto-fill grid from 640px up; rooms span the full row. */}
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(260px,1fr))]">
            {entries.map((entry) =>
              entry.kind === 'unit' ? (
                <li key={entry.key} className="flex">
                  <UnitCard item={entry.item} actions={actions} />
                </li>
              ) : (
                <li key={entry.key} className="sm:col-span-full">
                  <RoomCard room={entry.room} beds={entry.beds} actions={actions} />
                </li>
              ),
            )}
          </ul>
        </div>
      )}

      {selecting && selectedIds.length > 0 ? (
        <div
          role="region"
          aria-label="Selected units"
          className="dock-pill fixed inset-x-3 z-40 mx-auto flex -translate-y-[calc(100%+0.75rem)] flex-wrap items-center gap-2 rounded-2xl border border-border bg-popover px-3 py-2 shadow-lg lg:sticky lg:bottom-4 lg:h-auto lg:max-w-none lg:translate-y-0 lg:rounded-xl lg:shadow-lg"
        >
          <span className="flex-1 text-sm font-medium tabular">{selectedIds.length} selected</span>
          {showingArchived ? (
            <Button
              className="min-h-11 lg:min-h-9"
              onClick={() => void setArchived(selectedIds, false)}
            >
              <ArchiveRestoreIcon aria-hidden="true" />
              Restore
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                size="icon"
                className="size-11 lg:size-9"
                aria-label="Hide from page"
                onClick={() => void changeStatus(selectedIds, 'unlisted')}
              >
                <EyeOffIcon aria-hidden="true" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-11 lg:size-9"
                aria-label="Show on page"
                onClick={() => void changeStatus(selectedIds, 'listed')}
              >
                <EyeIcon aria-hidden="true" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-11 lg:size-9"
                aria-label="Archive"
                onClick={() => void setArchived(selectedIds, true)}
              >
                <ArchiveIcon aria-hidden="true" />
              </Button>
              <Button
                className="min-h-11 lg:min-h-9"
                onClick={() => {
                  setNightlyPrice(null);
                  setMonthlyPrice(null);
                  setPriceOpen(true);
                }}
              >
                <TagIcon aria-hidden="true" />
                Price
              </Button>
            </>
          )}
        </div>
      ) : null}

      <AppSheet
        open={priceOpen}
        onOpenChange={setPriceOpen}
        size="sm"
        title={`Change price for ${countWord(selectedIds)}`}
        description={
          selectedNightly.length > 0 && selectedMonthly.length > 0
            ? 'Nightly and monthly units get their own price. Leave one empty to keep those prices.'
            : undefined
        }
        footer={
          <>
            <Button
              data-sheet-cancel=""
              variant="outline"
              className="min-h-11"
              onClick={() => setPriceOpen(false)}
            >
              Cancel
            </Button>
            <AsyncButton
              className="min-h-11"
              state={bulkPrice.isPending ? 'busy' : 'idle'}
              disabled={
                !((nightlyPrice ?? 0) > 0 && selectedNightly.length > 0) &&
                !((monthlyPrice ?? 0) > 0 && selectedMonthly.length > 0)
              }
              onClick={() => {
                if (!today) return;
                const targets = [
                  ...((nightlyPrice ?? 0) > 0
                    ? selectedNightly.map((item) => ({
                        unitId: item.unit.id,
                        centavos: nightlyPrice ?? 0,
                      }))
                    : []),
                  ...((monthlyPrice ?? 0) > 0
                    ? selectedMonthly.map((item) => ({
                        unitId: item.unit.id,
                        centavos: monthlyPrice ?? 0,
                      }))
                    : []),
                ];
                void bulkPrice
                  .mutateAsync({ units: targets, today })
                  .then((result) => {
                    setPriceOpen(false);
                    stopSelecting();
                    const ids = result.changed.map((item) => item.unitId);
                    const undoable = result.changed.filter((item) => item.previous !== null);
                    if (ids.length > 0) {
                      notify.success(
                        `Price changed for ${countWord(ids)}`,
                        undoable.length > 0
                          ? {
                              onUndo: () =>
                                void bulkPrice.mutateAsync({
                                  units: undoable.map((item) => ({
                                    unitId: item.unitId,
                                    centavos: item.previous ?? 0,
                                  })),
                                  today,
                                }),
                            }
                          : undefined,
                      );
                    }
                    if (result.failed > 0) {
                      notify.error(`${result.failed} couldn't be changed. Try again.`);
                    }
                  })
                  .catch((caught: unknown) => notify.error(extractAppError(caught).message));
              }}
            >
              Change price
            </AsyncButton>
          </>
        }
      >
        <div className="flex flex-col gap-5">
          {selectedNightly.length > 0 ? (
            <Field>
              <FieldLabel htmlFor="bulk-price-nightly">
                Nightly price · {selectedNightly.length}{' '}
                {selectedNightly.length === 1 ? 'unit' : 'units'}
              </FieldLabel>
              <MoneyInput
                id="bulk-price-nightly"
                value={nightlyPrice}
                onValueChange={setNightlyPrice}
                per="a night"
              />
            </Field>
          ) : null}
          {selectedMonthly.length > 0 ? (
            <Field>
              <FieldLabel htmlFor="bulk-price-monthly">
                Monthly rent · {selectedMonthly.length}{' '}
                {selectedMonthly.length === 1 ? 'unit' : 'units'}
              </FieldLabel>
              <MoneyInput
                id="bulk-price-monthly"
                value={monthlyPrice}
                onValueChange={setMonthlyPrice}
                per="a month"
              />
            </Field>
          ) : null}
        </div>
      </AppSheet>

      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => (open ? undefined : setDeleting(null))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleting && deleting.length === 1
                ? `Delete ${nameOf(deleting[0] ?? '')}?`
                : `Delete ${deleting?.length ?? 0} beds?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              It was never booked, so nothing else changes. Its photos, prices and rules are removed
              too. This can&rsquo;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteUnit.isPending}
              onClick={() => void confirmDelete()}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <UnitNotReadySheet notReady={notReady} onClose={() => setNotReady(null)} />

      {planLimitSheet}
      {sheet}
    </section>
  );
}

function ReorderList({
  entries,
  onChange,
  onMove,
}: {
  readonly entries: readonly UnitEntry[];
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
              : `${entry.room.name} · ${entry.beds.length} beds`;
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
