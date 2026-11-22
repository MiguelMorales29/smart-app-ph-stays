import type { OwnerUnitListItemView, UnitMode, UnitsRow } from '@smartapp/core';

export interface BedSpaceRoomSummary {
  readonly label: string;
  readonly count: number;
  readonly maxBedNumber: number;
}

const TRAILING_BED_NUM_RE = /(\d+)\s*$/;

/** Extracts the trailing bed number from a bed name like "Room 3B · Bed 6" or "Bed 12". */
export function parseBedNumber(name: string): number | null {
  const match = TRAILING_BED_NUM_RE.exec(name.trim());
  if (!match?.[1]) return null;
  const parsed = Number.parseInt(match[1], 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

/**
 * Summarizes existing active bed-space rooms (preserving list order) with each room's bed count
 * and highest bed number so new beds continue numbering without duplicates (FIX-1 C).
 */
export function summarizeBedSpaceRooms(
  units: readonly Pick<OwnerUnitListItemView, 'unit'>[],
): BedSpaceRoomSummary[] {
  const byKey = new Map<string, { label: string; count: number; maxBedNumber: number }>();
  const orderedKeys: string[] = [];

  for (const item of units) {
    const unit: Pick<UnitsRow, 'archived_at' | 'unit_type' | 'group_label' | 'name'> = item.unit;
    if (unit.archived_at !== null) continue;
    if (unit.unit_type !== 'bed_space') continue;
    const label = unit.group_label?.trim() ?? '';
    if (!label) continue;
    const key = label.toLowerCase();
    const parsedNum = parseBedNumber(unit.name);
    const existing = byKey.get(key);
    if (existing) {
      existing.count += 1;
      existing.maxBedNumber = Math.max(existing.maxBedNumber, parsedNum ?? existing.count);
    } else {
      orderedKeys.push(key);
      byKey.set(key, {
        label,
        count: 1,
        maxBedNumber: parsedNum ?? 1,
      });
    }
  }

  return orderedKeys.flatMap((key) => {
    const entry = byKey.get(key);
    return entry ? [entry] : [];
  });
}

/**
 * Returns the next bed number for the given room label (highest existing bed number + 1, or 1
 * when creating a new room).
 */
export function nextBedNumberForRoom(
  rooms: readonly BedSpaceRoomSummary[],
  roomLabel: string,
): number {
  const normalized = roomLabel.trim().toLowerCase();
  if (!normalized) return 1;
  const match = rooms.find((room) => room.label.toLowerCase() === normalized);
  return match ? match.maxBedNumber + 1 : 1;
}

/**
 * Default name for a new bed-space room based on the number of existing bed-space rooms
 * (not total units or beds), avoiding collisions with any existing room label.
 */
export function nextNewRoomName(units: readonly Pick<OwnerUnitListItemView, 'unit'>[]): string {
  const rooms = summarizeBedSpaceRooms(units);
  const used = new Set(rooms.map((room) => room.label.toLowerCase()));
  let num = rooms.length + 1;
  while (used.has(`room ${num}`)) {
    num += 1;
  }
  return `Room ${num}`;
}

/**
 * Picks the default mode for a new unit from the property's existing active units (FIX-1 D):
 * `'long_term'` when strictly more units are monthly rent, otherwise `'short_stay'`.
 */
export function deriveDefaultUnitMode(
  units: readonly Pick<OwnerUnitListItemView, 'unit'>[],
): UnitMode {
  let shortCount = 0;
  let longCount = 0;
  for (const item of units) {
    if (item.unit.archived_at !== null) continue;
    if (item.unit.mode === 'long_term') longCount += 1;
    else shortCount += 1;
  }
  return longCount > shortCount ? 'long_term' : 'short_stay';
}
