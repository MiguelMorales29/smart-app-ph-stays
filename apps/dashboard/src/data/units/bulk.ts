import { readErrorDetails, type OwnerUnitDetailView, type UnitStatus } from '@smartapp/core';
import type { OperationInput } from '@smartapp/data';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { setupKeys } from '../setup/keys';
import {
  createIdempotencyKey,
  requireOwnerClient,
  unwrapResult,
  useActiveDataClient,
} from '../shared';
import { unitsKeys } from './keys';

/** Builds a saveUnit input that keeps everything the detail view already has. */
export function saveUnitInputFromDetail(
  detail: OwnerUnitDetailView,
): Omit<OperationInput<'saveUnit'>, 'accountId' | 'idempotencyKey'> {
  const { unit, stay_terms: stay, lease_terms: lease } = detail;
  return {
    propertyId: unit.property_id,
    unitId: unit.id,
    expectedUpdatedAt: unit.updated_at,
    name: unit.name,
    slug: unit.slug,
    mode: unit.mode,
    unitType: unit.unit_type,
    groupLabel: unit.group_label,
    description: unit.description,
    maxGuests: unit.max_guests,
    bedrooms: unit.bedrooms,
    beds: unit.beds,
    bathrooms: unit.bathrooms,
    floorAreaSqm: unit.floor_area_sqm,
    arrivalInfo: unit.arrival_info,
    amenityIds: [...detail.amenity_ids],
    stayTerms: stay
      ? {
          base_nightly_centavos: stay.base_nightly_centavos,
          base_guests: stay.base_guests,
          min_nights: stay.min_nights,
          max_nights: stay.max_nights,
          prep_nights: stay.prep_nights,
          weekly_discount_percent: stay.weekly_discount_percent,
          monthly_discount_percent: stay.monthly_discount_percent,
          down_payment_percent: stay.down_payment_percent,
          hold_minutes: stay.hold_minutes,
          advance_notice_days: stay.advance_notice_days,
          booking_window_days: stay.booking_window_days,
        }
      : null,
    leaseTerms: lease
      ? {
          monthly_rent_centavos: lease.monthly_rent_centavos,
          min_lease_months: lease.min_lease_months,
          advance_months: lease.advance_months,
          deposit_months: lease.deposit_months,
          reservation_fee_centavos: lease.reservation_fee_centavos,
          available_from: lease.available_from,
          inclusions: lease.inclusions,
        }
      : null,
  };
}

export interface BulkStatusResult {
  /** Units that changed, with the status they had before (for Undo). */
  readonly changed: readonly { readonly unitId: string; readonly previous: UnitStatus }[];
  /** Units that couldn't be listed, with what they still need. */
  readonly notReady: readonly { readonly unitId: string; readonly missing: readonly string[] }[];
  readonly otherErrors: number;
}

/** Hide, show or list several units one after another (OW-27). */
export function useBulkUnitStatusMutation() {
  const active = useActiveDataClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      readonly units: readonly {
        readonly unitId: string;
        readonly from: UnitStatus;
        readonly to: UnitStatus;
      }[];
    }): Promise<BulkStatusResult> => {
      const { source, session, accountId } = requireOwnerClient(active);
      const changed: { unitId: string; previous: UnitStatus }[] = [];
      const notReady: { unitId: string; missing: string[] }[] = [];
      let otherErrors = 0;
      for (const unit of input.units) {
        if (unit.from === unit.to) continue;
        const result = await source.setUnitStatus(
          {
            idempotencyKey: createIdempotencyKey('unit-status'),
            accountId,
            unitId: unit.unitId,
            status: unit.to,
            expectedUpdatedAt: null,
          },
          session,
        );
        if (result.ok) {
          changed.push({ unitId: unit.unitId, previous: unit.from });
        } else {
          const details = readErrorDetails(result.error);
          if (details.reason === 'unit_not_ready') {
            notReady.push({ unitId: unit.unitId, missing: [...details.missing] });
          } else {
            otherErrors += 1;
          }
        }
      }
      return { changed, notReady, otherErrors };
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: unitsKeys.all }),
        queryClient.invalidateQueries({ queryKey: setupKeys.all }),
      ]);
    },
  });
}

export interface BulkPriceResult {
  /** Units whose price changed, with the price they had (null when they had none yet). */
  readonly changed: readonly {
    readonly unitId: string;
    readonly mode: 'short_stay' | 'long_term';
    readonly previous: number | null;
  }[];
  readonly failed: number;
}

/**
 * One price for several units (OW-27). Nightly and monthly units get their own amount, never the
 * same number (AUDIT-1 A2). Keeps going after a failure, so Undo still covers every unit that
 * changed (A9).
 */
export function useBulkUnitPriceMutation() {
  const active = useActiveDataClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      readonly units: readonly {
        readonly unitId: string;
        /** Nightly price for short stays, monthly rent for long-term units. */
        readonly centavos: number;
      }[];
      /** Manila date for a new long-term "available from". */
      readonly today: string;
    }): Promise<BulkPriceResult> => {
      const { source, session, accountId } = requireOwnerClient(active);
      const changed: {
        unitId: string;
        mode: 'short_stay' | 'long_term';
        previous: number | null;
      }[] = [];
      let failed = 0;
      for (const target of input.units) {
        const read = await source.getOwnerUnit({ accountId, unitId: target.unitId }, session);
        if (!read.ok) {
          failed += 1;
          continue;
        }
        const detail = read.data;
        const base = saveUnitInputFromDetail(detail);
        const long = detail.unit.mode === 'long_term';
        const old = long
          ? (detail.lease_terms?.monthly_rent_centavos ?? null)
          : (detail.stay_terms?.base_nightly_centavos ?? null);
        if (old === target.centavos) continue;
        const saved = await source.saveUnit(
          {
            ...base,
            accountId,
            idempotencyKey: createIdempotencyKey('bulk-price'),
            stayTerms: long
              ? base.stayTerms
              : {
                  base_nightly_centavos: target.centavos,
                  base_guests: base.stayTerms?.base_guests ?? Math.min(2, detail.unit.max_guests),
                  min_nights: base.stayTerms?.min_nights ?? 1,
                  max_nights: base.stayTerms?.max_nights ?? 30,
                  prep_nights: base.stayTerms?.prep_nights ?? 0,
                  weekly_discount_percent: base.stayTerms?.weekly_discount_percent ?? 0,
                  monthly_discount_percent: base.stayTerms?.monthly_discount_percent ?? 0,
                  down_payment_percent: base.stayTerms?.down_payment_percent ?? 50,
                  hold_minutes: base.stayTerms?.hold_minutes ?? 60,
                  advance_notice_days: base.stayTerms?.advance_notice_days ?? 0,
                  booking_window_days: base.stayTerms?.booking_window_days ?? 365,
                },
            leaseTerms: long
              ? {
                  monthly_rent_centavos: target.centavos,
                  min_lease_months: base.leaseTerms?.min_lease_months ?? 1,
                  advance_months: base.leaseTerms?.advance_months ?? 1,
                  deposit_months: base.leaseTerms?.deposit_months ?? 1,
                  reservation_fee_centavos: base.leaseTerms?.reservation_fee_centavos ?? 0,
                  available_from: base.leaseTerms?.available_from ?? input.today,
                  inclusions: base.leaseTerms?.inclusions ?? null,
                }
              : base.leaseTerms,
          },
          session,
        );
        if (saved.ok) {
          changed.push({ unitId: target.unitId, mode: detail.unit.mode, previous: old });
        } else {
          failed += 1;
        }
      }
      return { changed, failed };
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: unitsKeys.all }),
        queryClient.invalidateQueries({ queryKey: setupKeys.all }),
      ]);
    },
  });
}

/** Archive or restore several units (F24); keeps going after a failure. */
export function useBulkArchiveMutation() {
  const active = useActiveDataClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      readonly unitIds: readonly string[];
      readonly archived: boolean;
    }): Promise<{
      readonly changed: readonly string[];
      readonly failed: number;
      readonly firstError: unknown;
    }> => {
      const { source, session, accountId } = requireOwnerClient(active);
      const changed: string[] = [];
      let failed = 0;
      let firstError: unknown = null;
      for (const unitId of input.unitIds) {
        const result = await source.archiveUnit(
          {
            idempotencyKey: createIdempotencyKey('archive-unit'),
            accountId,
            unitId,
            archived: input.archived,
            expectedUpdatedAt: null,
          },
          session,
        );
        if (result.ok) {
          changed.push(unitId);
        } else {
          failed += 1;
          firstError ??= result.error;
        }
      }
      return { changed, failed, firstError };
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: unitsKeys.all }),
        queryClient.invalidateQueries({ queryKey: setupKeys.all }),
      ]);
    },
  });
}

/** The bed's own part of its name: "Room 2 · Bed 3" in room "Room 2" gives "Bed 3". */
export function bedPartOfName(name: string, roomLabel: string): string {
  const prefix = `${roomLabel} · `;
  return name.startsWith(prefix) ? name.slice(prefix.length) : name;
}

/** Renames a room: every bed's room label and the room part of its name (verdict 4, A6). */
export function useRenameRoomMutation() {
  const active = useActiveDataClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      readonly unitIds: readonly string[];
      readonly from: string;
      readonly to: string;
    }) => {
      const { source, session, accountId } = requireOwnerClient(active);
      for (const unitId of input.unitIds) {
        const detail = unwrapResult(await source.getOwnerUnit({ accountId, unitId }, session));
        const base = saveUnitInputFromDetail(detail);
        unwrapResult(
          await source.saveUnit(
            {
              ...base,
              accountId,
              idempotencyKey: createIdempotencyKey('rename-room'),
              groupLabel: input.to,
              name: `${input.to} · ${bedPartOfName(detail.unit.name, input.from)}`.slice(0, 80),
            },
            session,
          ),
        );
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: unitsKeys.all });
    },
  });
}
