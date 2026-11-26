import { useRef, type ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  BedSingleIcon,
  CopyIcon,
  EyeIcon,
  EyeOffIcon,
  ImageIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react';
import { formatPesos, type OwnerUnitListItemView, type RoomsRow } from '@smartapp/core';
import { Badge } from '@smartapp/ui/components/badge';
import { Button } from '@smartapp/ui/components/button';
import { Checkbox } from '@smartapp/ui/components/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@smartapp/ui/components/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@smartapp/ui/components/table';
import { cn } from '@smartapp/ui/lib/utils';
import { bedPartOfName } from '@/data/units/bulk';
import {
  ROOM_GUESTS_LABEL,
  UNIT_TYPE_LABEL,
  UnitStatusBadge,
  roomFactsText,
  unitPriceText,
  unitSummaryText,
} from './unit-words';

export type UnitEntry =
  | { readonly kind: 'unit'; readonly key: string; readonly item: OwnerUnitListItemView }
  | {
      readonly kind: 'room';
      readonly key: string;
      readonly room: RoomsRow;
      readonly beds: readonly OwnerUnitListItemView[];
    };

/**
 * Keeps the owner's order. Every whole place and private room is its own entry; only beds are
 * grouped, under their shared room (R-1b, D92). No category titles: a title over separate units
 * read as one category (Lex, 26 Nov).
 */
export function toEntries(units: readonly OwnerUnitListItemView[]): UnitEntry[] {
  const entries: UnitEntry[] = [];
  const rooms = new Map<string, OwnerUnitListItemView[]>();
  for (const item of units) {
    const room = item.unit.unit_type === 'bed_space' ? item.room : null;
    if (room === null) {
      entries.push({ kind: 'unit', key: item.unit.id, item });
      continue;
    }
    const beds = rooms.get(room.id);
    if (beds) {
      beds.push(item);
    } else {
      const list = [item];
      rooms.set(room.id, list);
      entries.push({ kind: 'room', key: `room:${room.id}`, room, beds: list });
    }
  }
  return entries;
}

export function entryUnitIds(entry: UnitEntry): string[] {
  return entry.kind === 'unit' ? [entry.item.unit.id] : entry.beds.map((bed) => bed.unit.id);
}

/** What the list needs from the page: selection state and the actions behind each menu. */
export interface UnitListActions {
  readonly selecting: boolean;
  readonly selected: ReadonlySet<string>;
  readonly onToggle: (ids: readonly string[], on: boolean) => void;
  /** Long-press on a phone: start selecting with these units ticked. */
  readonly onStartSelecting: (ids: readonly string[]) => void;
  readonly onShow: (ids: readonly string[]) => void;
  readonly onHide: (ids: readonly string[]) => void;
  readonly onArchive: (ids: readonly string[]) => void;
  readonly onRestore: (ids: readonly string[]) => void;
  readonly onDuplicate: (id: string) => void;
  /** Never-booked units only (AUDIT-1 A20); the page asks before deleting. */
  readonly onDelete: (ids: readonly string[]) => void;
  readonly onAddBed: (roomId: string) => void;
}

const LONG_PRESS_MS = 450;
const MOVE_TOLERANCE_PX = 10;

/**
 * Long-press on touch screens starts selection mode (verdict 4). The click that follows a long
 * press is swallowed, so the card doesn't also open. Mouse and pen keep their normal clicks.
 */
function useLongPress(onLongPress: () => void) {
  const timer = useRef<number | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const fired = useRef(false);

  const cancel = () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
    start.current = null;
  };

  return {
    onPointerDown: (event: React.PointerEvent) => {
      fired.current = false;
      if (event.pointerType !== 'touch') return;
      start.current = { x: event.clientX, y: event.clientY };
      timer.current = window.setTimeout(() => {
        fired.current = true;
        timer.current = null;
        navigator.vibrate?.(10);
        onLongPress();
      }, LONG_PRESS_MS);
    },
    onPointerMove: (event: React.PointerEvent) => {
      if (!start.current) return;
      const dx = Math.abs(event.clientX - start.current.x);
      const dy = Math.abs(event.clientY - start.current.y);
      if (dx > MOVE_TOLERANCE_PX || dy > MOVE_TOLERANCE_PX) cancel();
    },
    onPointerUp: cancel,
    onPointerCancel: cancel,
    onPointerLeave: cancel,
    onClickCapture: (event: React.MouseEvent) => {
      if (fired.current) {
        event.preventDefault();
        event.stopPropagation();
        fired.current = false;
      }
    },
    onContextMenu: (event: React.MouseEvent) => {
      if (fired.current || timer.current !== null) event.preventDefault();
    },
  };
}

/** First photo of the unit, or of the first bed in a room that has one. */
export function Cover({
  items,
  className,
}: {
  readonly items: readonly OwnerUnitListItemView[];
  readonly className?: string;
}) {
  const photo = items.find((item) => item.cover_photo)?.cover_photo ?? null;
  return (
    <div className={cn('aspect-[4/3] overflow-hidden bg-muted', className)}>
      {photo ? (
        <img src={photo.url} alt="" loading="lazy" className="size-full object-cover" />
      ) : (
        <div className="flex size-full items-center justify-center text-muted-foreground">
          <ImageIcon aria-hidden="true" className="size-5" />
        </div>
      )}
    </div>
  );
}

/** "₱500 a night", or "₱450–₱600 a night" when the beds differ (AUDIT-1 A21). */
export function roomPriceText(beds: readonly OwnerUnitListItemView[]): string | null {
  const prices = beds.flatMap((bed) => {
    const value =
      bed.unit.mode === 'long_term'
        ? bed.lease_terms?.monthly_rent_centavos
        : bed.stay_terms?.base_nightly_centavos;
    return value === undefined ? [] : [{ value, long: bed.unit.mode === 'long_term' }];
  });
  if (prices.length === 0) return null;
  const per = prices.every((price) => price.long)
    ? 'a month'
    : prices.every((price) => !price.long)
      ? 'a night'
      : null;
  if (per === null) return 'Nightly and monthly beds';
  const low = Math.min(...prices.map((price) => price.value));
  const high = Math.max(...prices.map((price) => price.value));
  return low === high
    ? `${formatPesos(low)} ${per}`
    : `${formatPesos(low)}–${formatPesos(high)} ${per}`;
}

function ArchivedBadge({ className }: { readonly className?: string }) {
  return (
    <Badge variant="secondary" className={className}>
      <ArchiveIcon aria-hidden="true" />
      Archived
    </Badge>
  );
}

function UnitMenu({
  item,
  actions,
}: {
  readonly item: OwnerUnitListItemView;
  readonly actions: UnitListActions;
}) {
  const id = item.unit.id;
  const archived = item.unit.archived_at !== null;
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
      <DropdownMenuContent align="end" className="min-w-48">
        {archived ? (
          <>
            <DropdownMenuItem onClick={() => actions.onRestore([id])}>
              <ArchiveRestoreIcon aria-hidden="true" />
              Restore
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link to="/units/$unitId" params={{ unitId: id }} />}>
              <PencilIcon aria-hidden="true" />
              Edit
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem render={<Link to="/units/$unitId" params={{ unitId: id }} />}>
              <PencilIcon aria-hidden="true" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => actions.onDuplicate(id)}>
              {item.unit.unit_type === 'bed_space' ? (
                <BedSingleIcon aria-hidden="true" />
              ) : (
                <CopyIcon aria-hidden="true" />
              )}
              {item.unit.unit_type === 'bed_space' ? 'Copy as a new bed' : 'Duplicate'}
            </DropdownMenuItem>
            {item.unit.status === 'listed' ? (
              <DropdownMenuItem onClick={() => actions.onHide([id])}>
                <EyeOffIcon aria-hidden="true" />
                Hide from page
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => actions.onShow([id])}>
                <EyeIcon aria-hidden="true" />
                Show on page
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {item.can_delete ? (
              <DropdownMenuItem variant="destructive" onClick={() => actions.onDelete([id])}>
                <Trash2Icon aria-hidden="true" />
                Delete
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem variant="destructive" onClick={() => actions.onArchive([id])}>
                <ArchiveIcon aria-hidden="true" />
                Archive
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function RoomMenu({
  room,
  beds,
  actions,
}: {
  readonly room: RoomsRow;
  readonly beds: readonly OwnerUnitListItemView[];
  readonly actions: UnitListActions;
}) {
  const label = room.name;
  const ids = beds.map((bed) => bed.unit.id);
  const canDelete = beds.every((bed) => bed.can_delete);
  const archived = beds.every((bed) => bed.unit.archived_at !== null);
  const hidden = beds.filter((bed) => bed.unit.status !== 'listed').map((bed) => bed.unit.id);
  const listed = beds.filter((bed) => bed.unit.status === 'listed').map((bed) => bed.unit.id);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            className="size-11 shrink-0 sm:size-9"
            aria-label={`More for ${label}`}
          />
        }
      >
        <MoreHorizontalIcon aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        {archived ? (
          <DropdownMenuItem onClick={() => actions.onRestore(ids)}>
            <ArchiveRestoreIcon aria-hidden="true" />
            Restore every bed
          </DropdownMenuItem>
        ) : (
          <>
            <DropdownMenuItem
              render={<Link to="/units/rooms/$roomId" params={{ roomId: room.id }} />}
            >
              <PencilIcon aria-hidden="true" />
              Edit room
            </DropdownMenuItem>
            {hidden.length > 0 ? (
              <DropdownMenuItem onClick={() => actions.onShow(hidden)}>
                <EyeIcon aria-hidden="true" />
                Show every bed
              </DropdownMenuItem>
            ) : null}
            {listed.length > 0 ? (
              <DropdownMenuItem onClick={() => actions.onHide(listed)}>
                <EyeOffIcon aria-hidden="true" />
                Hide every bed
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuSeparator />
            {canDelete ? (
              <DropdownMenuItem variant="destructive" onClick={() => actions.onDelete(ids)}>
                <Trash2Icon aria-hidden="true" />
                Delete room
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem variant="destructive" onClick={() => actions.onArchive(ids)}>
                <ArchiveIcon aria-hidden="true" />
                Archive room
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Covers the whole card while selecting, so a tap anywhere ticks it (AUDIT-1 A5). It is hidden
 * from screen readers and the keyboard: the real checkbox stays the one control they use.
 */
function SelectOverlay({ onPress }: { readonly onPress: () => void }) {
  return (
    <button
      type="button"
      aria-hidden="true"
      tabIndex={-1}
      className="absolute inset-0 z-10 cursor-pointer"
      onClick={onPress}
    />
  );
}

export function UnitCard({
  item,
  actions,
}: {
  readonly item: OwnerUnitListItemView;
  readonly actions: UnitListActions;
}) {
  const id = item.unit.id;
  const checked = actions.selected.has(id);
  const archived = item.unit.archived_at !== null;
  const price = unitPriceText(item);
  const press = useLongPress(() => actions.onStartSelecting([id]));
  return (
    // D73: row card with an 88 px thumbnail on phones (< 640px), full-height photo card from 640px up.
    <article
      {...(actions.selecting ? {} : press)}
      data-selected={checked ? '' : undefined}
      className={cn(
        'relative flex h-full w-full touch-manipulation items-center gap-3 overflow-hidden rounded-xl border border-border bg-card p-2.5 transition-colors select-none sm:flex-col sm:items-stretch sm:gap-0 sm:p-0',
        checked && 'border-primary ring-2 ring-primary/40',
      )}
    >
      <div className="relative w-[88px] shrink-0 overflow-hidden rounded-lg sm:w-full sm:rounded-none">
        <Cover items={[item]} className={cn('w-full', archived && 'opacity-60 grayscale')} />
        {archived ? (
          <ArchivedBadge className="pointer-events-none absolute top-1 left-1 z-10 sm:top-2.5 sm:left-2.5" />
        ) : (
          <UnitStatusBadge
            status={item.unit.status}
            overlay
            className="pointer-events-none absolute top-1 left-1 z-10 max-sm:h-5 max-sm:px-1.5 max-sm:text-[11px] sm:top-2.5 sm:left-2.5"
          />
        )}
      </div>
      {actions.selecting ? (
        <>
          <SelectOverlay onPress={() => actions.onToggle([id], !checked)} />
          <div className="absolute top-2 right-2 z-20 flex size-11 items-center justify-center rounded-lg bg-card/90 shadow-xs">
            <Checkbox
              aria-label={`Select ${item.unit.name}`}
              checked={checked}
              onCheckedChange={(on) => actions.onToggle([id], on)}
            />
          </div>
        </>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-1 sm:p-3.5">
        <div className="flex items-center justify-between gap-2">
          {actions.selecting ? (
            <span className="min-w-0 flex-1 truncate font-medium">{item.unit.name}</span>
          ) : (
            <Link
              to="/units/$unitId"
              params={{ unitId: id }}
              className="min-w-0 flex-1 truncate font-medium after:absolute after:inset-0 after:content-['']"
            >
              {item.unit.name}
            </Link>
          )}
          {actions.selecting ? null : (
            <div className="relative z-10 -mr-1.5 shrink-0">
              <UnitMenu item={item} actions={actions} />
            </div>
          )}
        </div>
        <p className="truncate text-sm text-muted-foreground">
          {unitSummaryText(item.unit, item.room?.name)}
        </p>
        <p className="text-sm font-medium text-foreground tabular">
          {price ?? <span className="font-normal text-muted-foreground">No price yet</span>}
        </p>
      </div>
    </article>
  );
}

function BedRow({
  bed,
  label,
  actions,
}: {
  readonly bed: OwnerUnitListItemView;
  readonly label: string;
  readonly actions: UnitListActions;
}) {
  const id = bed.unit.id;
  const checked = actions.selected.has(id);
  const press = useLongPress(() => actions.onStartSelecting([id]));
  const bedName = bedPartOfName(bed.unit.name, label);
  const price = unitPriceText(bed);
  return (
    <li
      {...(actions.selecting ? {} : press)}
      className={cn(
        'relative flex touch-manipulation items-center gap-2 py-1 pr-1 pl-3 select-none',
        checked && 'bg-primary-tint',
      )}
    >
      {actions.selecting ? (
        <>
          <SelectOverlay onPress={() => actions.onToggle([id], !checked)} />
          <div className="relative z-20 flex size-11 items-center justify-center">
            <Checkbox
              aria-label={`Select ${bed.unit.name}`}
              checked={checked}
              onCheckedChange={(on) => actions.onToggle([id], on)}
            />
          </div>
          <span className="flex min-h-11 min-w-0 flex-1 items-center text-sm font-medium">
            <span className="truncate">{bedName}</span>
          </span>
        </>
      ) : (
        <Link
          to="/units/$unitId"
          params={{ unitId: id }}
          className="flex min-h-11 min-w-0 flex-1 items-center gap-2 text-sm font-medium after:absolute after:inset-0 after:content-['']"
        >
          <BedSingleIcon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{bedName}</span>
        </Link>
      )}
      {price ? (
        <span className="hidden text-sm text-muted-foreground tabular sm:inline">{price}</span>
      ) : null}
      {bed.unit.archived_at !== null ? (
        <ArchivedBadge />
      ) : (
        <UnitStatusBadge status={bed.unit.status} />
      )}
      {actions.selecting ? null : (
        <div className="relative z-10">
          <UnitMenu item={bed} actions={actions} />
        </div>
      )}
    </li>
  );
}

/** A room of bed spaces as one bounded group: room header with its own menu, beds indented under it. */
export function RoomCard({
  room,
  beds,
  actions,
}: {
  readonly room: RoomsRow;
  readonly beds: readonly OwnerUnitListItemView[];
  readonly actions: UnitListActions;
}) {
  const label = room.name;
  const ids = beds.map((bed) => bed.unit.id);
  const listed = beds.filter((bed) => bed.unit.status === 'listed').length;
  const price = roomPriceText(beds);
  const allChecked = ids.every((id) => actions.selected.has(id));
  const someChecked = !allChecked && ids.some((id) => actions.selected.has(id));
  const archived = beds.every((bed) => bed.unit.archived_at !== null);
  return (
    <article
      aria-label={`${label}, ${beds.length} ${beds.length === 1 ? 'bed' : 'beds'}`}
      className="overflow-hidden rounded-xl border border-border bg-card"
    >
      <div className="relative flex items-center gap-3 p-3">
        {actions.selecting ? (
          <SelectOverlay onPress={() => actions.onToggle(ids, !allChecked)} />
        ) : null}
        <Cover items={beds} className="w-20 shrink-0 rounded-md" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {actions.selecting ? (
              <h3 className="line-clamp-2 font-medium">{label}</h3>
            ) : (
              <h3 className="line-clamp-2 font-medium">
                <Link
                  to="/units/rooms/$roomId"
                  params={{ roomId: room.id }}
                  className="hover-hover:hover:underline"
                >
                  {label}
                </Link>
              </h3>
            )}
            {room.guests === 'anyone' ? null : (
              <Badge variant="secondary">{ROOM_GUESTS_LABEL[room.guests]}</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground tabular">
            {roomFactsText(room, beds.length)}
            {archived ? '' : ` · ${listed} listed`}
          </p>
          {price ? <p className="text-sm font-medium tabular">{price}</p> : null}
        </div>
        {actions.selecting ? (
          <div className="relative z-20 flex size-11 items-center justify-center">
            <Checkbox
              aria-label={`Select every bed in ${label}`}
              checked={allChecked}
              indeterminate={someChecked}
              onCheckedChange={(on) => actions.onToggle(ids, on)}
            />
          </div>
        ) : (
          <div className="flex shrink-0 items-center gap-1.5">
            {archived ? null : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-11 sm:min-h-9"
                onClick={() => actions.onAddBed(room.id)}
              >
                <PlusIcon aria-hidden="true" />
                <span className="max-sm:sr-only">Add a bed</span>
              </Button>
            )}
            <RoomMenu room={room} beds={beds} actions={actions} />
          </div>
        )}
      </div>
      {/* Beds sit inside the room: indented, with a rule down the left so the group reads as one. */}
      <ul className="mx-3 mb-3 divide-y divide-border rounded-lg border-l-2 border-primary/30 bg-muted/40">
        {beds.map((bed) => (
          <BedRow key={bed.unit.id} bed={bed} label={label} actions={actions} />
        ))}
      </ul>
    </article>
  );
}

function SelectCell({
  label,
  checked,
  indeterminate,
  onChange,
}: {
  readonly label: string;
  readonly checked: boolean;
  readonly indeterminate?: boolean;
  readonly onChange: (on: boolean) => void;
}) {
  return (
    <TableCell className="w-12">
      <div className="relative z-20 flex size-9 items-center justify-center">
        <Checkbox
          aria-label={label}
          checked={checked}
          indeterminate={indeterminate ?? false}
          onCheckedChange={onChange}
        />
      </div>
    </TableCell>
  );
}

function UnitRow({
  item,
  actions,
  inRoom,
}: {
  readonly item: OwnerUnitListItemView;
  readonly actions: UnitListActions;
  readonly inRoom?: string;
}) {
  const id = item.unit.id;
  const checked = actions.selected.has(id);
  const price = unitPriceText(item);
  const name = inRoom ? bedPartOfName(item.unit.name, inRoom) : item.unit.name;
  const press = useLongPress(() => actions.onStartSelecting([id]));
  return (
    <TableRow
      {...(actions.selecting ? {} : press)}
      data-state={checked ? 'selected' : undefined}
      className="relative touch-manipulation select-none"
    >
      {actions.selecting ? (
        <SelectCell
          label={`Select ${item.unit.name}`}
          checked={checked}
          onChange={(on) => actions.onToggle([id], on)}
        />
      ) : null}
      <TableCell className={cn(inRoom && 'pl-6')}>
        <div
          className={cn(
            'flex min-h-11 items-center gap-3',
            inRoom && 'border-l-2 border-primary/30 pl-3',
          )}
        >
          {inRoom ? (
            <BedSingleIcon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
          ) : (
            <Cover items={[item]} className="w-14 shrink-0 rounded-md" />
          )}
          <div className="min-w-0">
            {actions.selecting ? (
              <>
                <SelectOverlay onPress={() => actions.onToggle([id], !checked)} />
                <span className="line-clamp-2 font-medium">{name}</span>
              </>
            ) : (
              <Link
                to="/units/$unitId"
                params={{ unitId: id }}
                className="line-clamp-2 font-medium after:absolute after:inset-0 after:content-[''] hover-hover:hover:underline"
              >
                {name}
              </Link>
            )}
            {/* Phones: type and price under the name instead of their own columns. */}
            <p className="text-xs text-muted-foreground tabular sm:hidden">
              {inRoom ? null : `${UNIT_TYPE_LABEL[item.unit.unit_type]} · `}
              {price ?? 'No price yet'}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell className="hidden text-muted-foreground sm:table-cell">
        {UNIT_TYPE_LABEL[item.unit.unit_type]}
      </TableCell>
      <TableCell className="hidden tabular sm:table-cell">
        {price ?? <span className="text-muted-foreground">No price yet</span>}
      </TableCell>
      <TableCell>
        {item.unit.archived_at !== null ? (
          <ArchivedBadge />
        ) : (
          <UnitStatusBadge status={item.unit.status} />
        )}
      </TableCell>
      <TableCell className="w-12">
        {actions.selecting ? null : (
          <div className="relative z-10">
            <UnitMenu item={item} actions={actions} />
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}

/** The table view: one list like the cards; a shared room is a header row with its beds below. */
export function UnitsTable({
  entries,
  actions,
}: {
  readonly entries: readonly UnitEntry[];
  readonly actions: UnitListActions;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            {actions.selecting ? (
              <TableHead className="w-12">
                <span className="sr-only">Select</span>
              </TableHead>
            ) : null}
            <TableHead>Unit</TableHead>
            <TableHead className="hidden sm:table-cell">Type</TableHead>
            <TableHead className="hidden sm:table-cell">Price</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-12">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(() => {
            const rows: ReactNode[] = [];
            for (const entry of entries) {
              if (entry.kind === 'unit') {
                rows.push(<UnitRow key={entry.key} item={entry.item} actions={actions} />);
                continue;
              }
              const label = entry.room.name;
              const ids = entry.beds.map((bed) => bed.unit.id);
              const listed = entry.beds.filter((bed) => bed.unit.status === 'listed').length;
              const allChecked = ids.every((id) => actions.selected.has(id));
              const price = roomPriceText(entry.beds);
              rows.push(
                <TableRow key={entry.key} className="bg-muted/50 hover:bg-muted/50">
                  {actions.selecting ? (
                    <SelectCell
                      label={`Select every bed in ${label}`}
                      checked={allChecked}
                      indeterminate={!allChecked && ids.some((id) => actions.selected.has(id))}
                      onChange={(on) => actions.onToggle(ids, on)}
                    />
                  ) : null}
                  <TableCell colSpan={5} className="whitespace-normal">
                    <div className="flex min-h-11 items-center gap-3">
                      <Cover items={entry.beds} className="w-14 shrink-0 rounded-md" />
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-center gap-x-2 font-medium">
                          {actions.selecting ? (
                            label
                          ) : (
                            <Link
                              to="/units/rooms/$roomId"
                              params={{ roomId: entry.room.id }}
                              className="hover-hover:hover:underline"
                            >
                              {label}
                            </Link>
                          )}
                          {entry.room.guests === 'anyone' ? null : (
                            <Badge variant="secondary">
                              {ROOM_GUESTS_LABEL[entry.room.guests]}
                            </Badge>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground tabular">
                          {roomFactsText(entry.room, entry.beds.length)} · {listed} listed
                          {price ? ` · ${price}` : ''}
                        </p>
                      </div>
                      {actions.selecting ? null : (
                        <div className="flex shrink-0 items-center gap-1.5">
                          {entry.beds.every((bed) => bed.unit.archived_at !== null) ? null : (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="min-h-11 sm:min-h-9"
                              onClick={() => actions.onAddBed(entry.room.id)}
                            >
                              <PlusIcon aria-hidden="true" />
                              <span className="max-sm:sr-only">Add a bed</span>
                            </Button>
                          )}
                          <RoomMenu room={entry.room} beds={entry.beds} actions={actions} />
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>,
              );
              for (const bed of entry.beds) {
                rows.push(
                  <UnitRow key={bed.unit.id} item={bed} actions={actions} inRoom={label} />,
                );
              }
            }
            return rows;
          })()}
        </TableBody>
      </Table>
    </div>
  );
}
