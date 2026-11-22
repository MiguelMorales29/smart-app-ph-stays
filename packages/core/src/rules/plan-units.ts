import type { UnitsRow } from '../schemas/tables/index.js';

/** O4 decided: each room of bed spaces counts as 1 plan unit per 12 beds, rounded up. */
export const PLAN_BEDS_PER_UNIT = 12;

export type PlanCountableUnit = Pick<
  UnitsRow,
  'property_id' | 'unit_type' | 'group_label' | 'archived_at'
>;

/**
 * Counts active units against an owner's plan limit (O4):
 * - Archived units do not count.
 * - Each standalone unit (or bed space without a room label) counts as 1 unit.
 * - Bed spaces sharing a room (`property_id` + normalised `group_label`) count as
 *   `Math.ceil(beds / 12)` units (1–12 beds = 1, 13–24 beds = 2, and so on).
 */
export function countPlanUnits(units: readonly PlanCountableUnit[]): number {
  let total = 0;
  const bedsPerRoom = new Map<string, number>();

  for (const unit of units) {
    if (unit.archived_at !== null) continue;
    const roomLabel = unit.group_label?.trim() ?? '';
    if (unit.unit_type === 'bed_space' && roomLabel.length > 0) {
      const key = `${unit.property_id}\0${roomLabel.toLowerCase()}`;
      bedsPerRoom.set(key, (bedsPerRoom.get(key) ?? 0) + 1);
    } else {
      total += 1;
    }
  }

  for (const bedCount of bedsPerRoom.values()) {
    total += Math.ceil(bedCount / PLAN_BEDS_PER_UNIT);
  }

  return total;
}
