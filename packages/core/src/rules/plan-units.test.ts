import { describe, expect, it } from 'vitest';

import { countPlanUnits, type PlanCountableUnit } from './plan-units.js';

const PROP_A = '00000000-0000-4000-8000-000000000001';
const PROP_B = '00000000-0000-4000-8000-000000000002';

function makeUnit(overrides: Partial<PlanCountableUnit> = {}): PlanCountableUnit {
  return {
    property_id: PROP_A,
    unit_type: 'entire_place',
    group_label: null,
    archived_at: null,
    ...overrides,
  };
}

function makeBeds(count: number, groupLabel: string, propertyId = PROP_A): PlanCountableUnit[] {
  return Array.from({ length: count }, () =>
    makeUnit({ property_id: propertyId, unit_type: 'bed_space', group_label: groupLabel }),
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
    expect(countPlanUnits(makeBeds(1, 'Room 2A'))).toBe(1);
    expect(countPlanUnits(makeBeds(6, 'Room 2A'))).toBe(1);
    expect(countPlanUnits(makeBeds(12, 'Room 2A'))).toBe(1);
  });

  it('counts 13–24 bed spaces in one room as 2 plan units and 25 as 3', () => {
    expect(countPlanUnits(makeBeds(13, 'Room 2A'))).toBe(2);
    expect(countPlanUnits(makeBeds(24, 'Room 2A'))).toBe(2);
    expect(countPlanUnits(makeBeds(25, 'Room 2A'))).toBe(3);
  });

  it('groups room labels case-insensitively within the same property, separately across properties', () => {
    const units: PlanCountableUnit[] = [
      ...makeBeds(6, 'Room 3B', PROP_A),
      ...makeBeds(6, ' room 3b ', PROP_A),
      ...makeBeds(4, 'Room 3B', PROP_B),
    ];
    expect(countPlanUnits(units)).toBe(2);
  });

  it('counts ungrouped bed spaces as standalone units', () => {
    const units: PlanCountableUnit[] = [
      makeUnit({ unit_type: 'bed_space', group_label: null }),
      makeUnit({ unit_type: 'bed_space', group_label: '   ' }),
    ];
    expect(countPlanUnits(units)).toBe(2);
  });
});
