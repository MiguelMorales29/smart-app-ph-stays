import {
  formatPesos,
  type OwnerUnitListItemView,
  type RoomBathroom,
  type RoomGuests,
  type RoomsRow,
  type UnitStatus,
  type UnitType,
  type UnitsRow,
} from '@smartapp/core';
import { UNIT_STATUS_META, UnitStatusBadge } from '@smartapp/ui/compositions/status-badge';

export { UNIT_STATUS_META, UnitStatusBadge };

export const UNIT_TYPE_LABEL: Record<UnitType, string> = {
  entire_place: 'Whole place',
  private_room: 'Private room',
  bed_space: 'Bed space',
};

export function unitStatusLabel(status: UnitStatus): string {
  return UNIT_STATUS_META[status].label;
}

export const ROOM_GUESTS_LABEL: Record<RoomGuests, string> = {
  anyone: 'Anyone',
  ladies: 'Ladies only',
  gents: 'Gents only',
};

export const ROOM_BATHROOM_LABEL: Record<RoomBathroom, string> = {
  shared: 'Shared bathroom',
  in_room: 'Bathroom in the room',
};

/** "Shared room · 4 beds · Shared bathroom" */
export function roomFactsText(room: Pick<RoomsRow, 'bathroom'>, bedCount: number): string {
  return `Shared room · ${bedCount} ${bedCount === 1 ? 'bed' : 'beds'} · ${ROOM_BATHROOM_LABEL[room.bathroom]}`;
}

/** "Whole place · 2 guests · 1 bed", or "Bed space · Room 3" for bed spaces. */
export function unitSummaryText(
  unit: Pick<UnitsRow, 'unit_type' | 'max_guests' | 'beds'>,
  roomName?: string | null,
): string {
  const typeLabel = UNIT_TYPE_LABEL[unit.unit_type];
  if (unit.unit_type === 'bed_space') {
    return roomName ? `${typeLabel} · ${roomName}` : typeLabel;
  }
  const guestsLabel = `${unit.max_guests} ${unit.max_guests === 1 ? 'guest' : 'guests'}`;
  const bedsLabel = `${unit.beds} ${unit.beds === 1 ? 'bed' : 'beds'}`;
  return `${typeLabel} · ${guestsLabel} · ${bedsLabel}`;
}

/** "₱2,600 a night", "₱8,500 a month" or null when no price is set. */
export function unitPriceText(
  item: Pick<OwnerUnitListItemView, 'unit' | 'stay_terms' | 'lease_terms'>,
): string | null {
  if (item.unit.mode === 'long_term') {
    return item.lease_terms
      ? `${formatPesos(item.lease_terms.monthly_rent_centavos)} a month`
      : null;
  }
  return item.stay_terms ? `${formatPesos(item.stay_terms.base_nightly_centavos)} a night` : null;
}

export const MISSING_LABEL: Record<string, string> = {
  photos: 'Add at least 3 photos',
  price: 'Set a price',
};
