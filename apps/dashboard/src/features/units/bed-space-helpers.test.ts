import { describe, expect, it } from 'vitest';
import type { OwnerUnitListItemView } from '@smartapp/core';

import {
  deriveDefaultUnitMode,
  nextBedNumberForRoom,
  nextNewRoomName,
  parseBedNumber,
  summarizeBedSpaceRooms,
} from './bed-space-helpers';

type StubUnit = Pick<OwnerUnitListItemView, 'unit' | 'room'>;

const ROOM_IDS: Record<string, string> = {
  'Room 2A': '00000000-0000-4000-8000-0000000002a0',
  'Room 3B': '00000000-0000-4000-8000-0000000003b0',
  'Room 2': '00000000-0000-4000-8000-000000000020',
};

function stub(
  overrides: Partial<OwnerUnitListItemView['unit']> & { readonly roomName?: string },
): StubUnit {
  const { roomName, ...unitOverrides } = overrides;
  const roomId = roomName ? (ROOM_IDS[roomName] ?? null) : null;
  return {
    room:
      roomName && roomId
        ? {
            id: roomId,
            account_id: '00000000-0000-4000-8000-000000000002',
            property_id: '00000000-0000-4000-8000-000000000003',
            name: roomName,
            guests: 'anyone',
            bathroom: 'shared',
            description: null,
            created_at: '2026-12-01T00:00:00Z',
            updated_at: '2026-12-01T00:00:00Z',
          }
        : null,
    unit: {
      id: '00000000-0000-4000-8000-000000000001',
      account_id: '00000000-0000-4000-8000-000000000002',
      property_id: '00000000-0000-4000-8000-000000000003',
      slug: 'unit-1',
      name: 'Unit 1',
      mode: 'short_stay',
      unit_type: 'entire_place',
      room_id: roomId,
      description: null,
      max_guests: 2,
      bedrooms: 1,
      beds: 1,
      bathrooms: 1,
      floor_area_sqm: null,
      arrival_info: null,
      sort_order: 0,
      status: 'listed',
      archived_at: null,
      created_at: '2026-12-01T00:00:00Z',
      updated_at: '2026-12-01T00:00:00Z',
      ...unitOverrides,
    },
  };
}

describe('bed-space-helpers (FIX-1 C & D)', () => {
  it('parses trailing bed numbers from names', () => {
    expect(parseBedNumber('Room 3B · Bed 6')).toBe(6);
    expect(parseBedNumber('Bed 12')).toBe(12);
    expect(parseBedNumber('Window bunk')).toBeNull();
  });

  it('summarizes existing rooms and continues after the highest bed number (even with gaps)', () => {
    const units: StubUnit[] = [
      stub({
        unit_type: 'bed_space',
        mode: 'long_term',
        roomName: 'Room 2A',
        name: 'Room 2A · Bed 1',
      }),
      stub({
        unit_type: 'bed_space',
        mode: 'long_term',
        roomName: 'Room 2A',
        name: 'Room 2A · Bed 4',
      }),
      stub({
        unit_type: 'bed_space',
        mode: 'long_term',
        roomName: 'Room 3B',
        name: 'Room 3B · Bed 1',
      }),
      stub({
        unit_type: 'bed_space',
        mode: 'long_term',
        roomName: 'Room 3B',
        name: 'Room 3B · Bed 2',
      }),
      stub({
        unit_type: 'bed_space',
        mode: 'long_term',
        roomName: 'Room 3B',
        name: 'Room 3B · Bed 6',
      }),
      stub({ unit_type: 'entire_place', mode: 'short_stay', name: 'Studio A' }),
    ];

    const rooms = summarizeBedSpaceRooms(units);
    expect(rooms).toEqual([
      { id: ROOM_IDS['Room 2A'], label: 'Room 2A', count: 2, maxBedNumber: 4 },
      { id: ROOM_IDS['Room 3B'], label: 'Room 3B', count: 3, maxBedNumber: 6 },
    ]);
    expect(nextBedNumberForRoom(rooms, ROOM_IDS['Room 2A'] ?? null)).toBe(5);
    expect(nextBedNumberForRoom(rooms, ROOM_IDS['Room 3B'] ?? null)).toBe(7);
    expect(nextBedNumberForRoom(rooms, null)).toBe(1);
    // Counts rooms (2), not beds (5) or total units (6)
    expect(nextNewRoomName(units)).toBe('Room 3');
  });

  it('avoids colliding with an existing Room N label', () => {
    const units: StubUnit[] = [
      stub({
        unit_type: 'bed_space',
        mode: 'long_term',
        roomName: 'Room 2',
        name: 'Room 2 · Bed 1',
      }),
    ];
    expect(nextNewRoomName(units)).toBe('Room 3');
  });

  it('derives default unit mode from majority of active units (short_stay on empty or tie)', () => {
    expect(deriveDefaultUnitMode([])).toBe('short_stay');
    expect(deriveDefaultUnitMode([stub({ mode: 'short_stay' }), stub({ mode: 'long_term' })])).toBe(
      'short_stay',
    );
    expect(
      deriveDefaultUnitMode([
        stub({ mode: 'long_term' }),
        stub({ mode: 'long_term' }),
        stub({ mode: 'short_stay' }),
      ]),
    ).toBe('long_term');
    expect(
      deriveDefaultUnitMode([
        stub({ mode: 'long_term', archived_at: '2026-12-02T00:00:00Z' }),
        stub({ mode: 'long_term', archived_at: '2026-12-02T00:00:00Z' }),
        stub({ mode: 'short_stay' }),
      ]),
    ).toBe('short_stay');
  });
});
