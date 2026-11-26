import { describe, expect, it } from 'vitest';

import { countPlanUnits, type PlanCountableUnit } from './plan-units.js';

const PROP_A = '00000000-0000-4000-8000-000000000001';
const PROP_B = '00000000-0000-4000-8000-000000000002';

function makeUnit(overrides: Partial<PlanCountableUnit> = {}): PlanCountableUnit {
  return {
    property_id: PROP_A,
    unit_type: 'entire_place',
    room_id: null,
    archived_at: null,
    ...overrides,
  };
}

const ROOM_A = '00000000-0000-4000-8000-0000000000a1';
const ROOM_B = '00000000-0000-4000-8000-0000000000b1';
const ROOM_C = '00000000-0000-4000-8000-0000000000c1';

function makeBeds(count: number, roomId: string, propertyId = PROP_A): PlanCountableUnit[] {
  return Array.from({ length: count }, () =>
    makeUnit({ property_id: propertyId, unit_type: 'bed_space', room_id: roomId }),
  );
}

describe('countPlanUnits (O4)', () => {
  it('counts standalone units individually and ignores archived units', () => {
    const units: PlanCountableUnit[] = [
      makeUnit(),
      makeUnit({ unit_type: 'private_room' }),
      makeUnit({ archived_at: '2026-12-01T00:00:00Z' }),
    ];
    expect(countPlanUnits(units)).toBe(2);
  });

  it('counts 1–12 bed spaces in one room as 1 plan unit', () => {
    expect(countPlanUnits(makeBeds(1, ROOM_A))).toBe(1);
    expect(countPlanUnits(makeBeds(6, ROOM_A))).toBe(1);
    expect(countPlanUnits(makeBeds(12, ROOM_A))).toBe(1);
  });

  it('counts 13–24 bed spaces in one room as 2 plan units and 25 as 3', () => {
    expect(countPlanUnits(makeBeds(13, ROOM_A))).toBe(2);
    expect(countPlanUnits(makeBeds(24, ROOM_A))).toBe(2);
    expect(countPlanUnits(makeBeds(25, ROOM_A))).toBe(3);
  });

  it('counts each room on its own, across properties too (R-1b: rooms are records)', () => {
    const units: PlanCountableUnit[] = [
      ...makeBeds(12, ROOM_B, PROP_A),
      ...makeBeds(4, ROOM_C, PROP_B),
    ];
    expect(countPlanUnits(units)).toBe(2);
  });

  it('counts ungrouped bed spaces as standalone units', () => {
    const units: PlanCountableUnit[] = [
      makeUnit({ unit_type: 'bed_space', room_id: null }),
      makeUnit({ unit_type: 'bed_space', room_id: null }),
    ];
    expect(countPlanUnits(units)).toBe(2);
  });
});
