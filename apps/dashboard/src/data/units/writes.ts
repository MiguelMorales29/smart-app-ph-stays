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

export type SaveUnitVariables = Omit<OperationInput<'saveUnit'>, 'accountId' | 'idempotencyKey'> & {
  readonly idempotencyKey?: string;
};

export function useSaveUnitMutation() {
  const active = useActiveDataClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SaveUnitVariables) => {
      const { source, session, accountId } = requireOwnerClient(active);
      return unwrapResult(
        await source.saveUnit(
          {
            ...input,
            accountId,
            idempotencyKey: input.idempotencyKey ?? createIdempotencyKey('save-unit'),
          },
          session,
        ),
      );
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: unitsKeys.all }),
        queryClient.invalidateQueries({ queryKey: setupKeys.all }),
      ]);
    },
  });
}

export type CreateBedSpacesVariables = Omit<
  OperationInput<'createBedSpaces'>,
  'accountId' | 'idempotencyKey'
> & {
  readonly idempotencyKey?: string;
};

export function useCreateBedSpacesMutation() {
  const active = useActiveDataClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateBedSpacesVariables) => {
      const { source, session, accountId } = requireOwnerClient(active);
      return unwrapResult(
        await source.createBedSpaces(
          {
            ...input,
            accountId,
            idempotencyKey: input.idempotencyKey ?? createIdempotencyKey('bed-spaces'),
          },
          session,
        ),
      );
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: unitsKeys.all }),
        queryClient.invalidateQueries({ queryKey: setupKeys.all }),
      ]);
    },
  });
}

export function useSetUnitStatusMutation() {
  const active = useActiveDataClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: Omit<OperationInput<'setUnitStatus'>, 'accountId' | 'idempotencyKey'> & {
        readonly idempotencyKey?: string;
      },
    ) => {
      const { source, session, accountId } = requireOwnerClient(active);
      return unwrapResult(
        await source.setUnitStatus(
          {
            ...input,
            accountId,
            idempotencyKey: input.idempotencyKey ?? createIdempotencyKey('unit-status'),
          },
          session,
        ),
      );
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: unitsKeys.all }),
        queryClient.invalidateQueries({ queryKey: setupKeys.all }),
      ]);
    },
  });
}

export function useReorderUnitsMutation() {
  const active = useActiveDataClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      readonly propertyId: string;
      readonly unitIds: string[];
      readonly idempotencyKey?: string;
    }) => {
      const { source, session, accountId } = requireOwnerClient(active);
      return unwrapResult(
        await source.reorderUnits(
          {
            idempotencyKey: input.idempotencyKey ?? createIdempotencyKey('reorder-units'),
            accountId,
            propertyId: input.propertyId,
            unitIds: input.unitIds,
          },
          session,
        ),
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: unitsKeys.all });
    },
  });
}

export function useArchiveUnitMutation() {
  const active = useActiveDataClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: Omit<OperationInput<'archiveUnit'>, 'accountId' | 'idempotencyKey'> & {
        readonly idempotencyKey?: string;
      },
    ) => {
      const { source, session, accountId } = requireOwnerClient(active);
      return unwrapResult(
        await source.archiveUnit(
          {
            ...input,
            accountId,
            idempotencyKey: input.idempotencyKey ?? createIdempotencyKey('archive-unit'),
          },
          session,
        ),
      );
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: unitsKeys.all }),
        queryClient.invalidateQueries({ queryKey: setupKeys.all }),
      ]);
    },
  });
}

export function useDuplicateUnitMutation() {
  const active = useActiveDataClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { readonly unitId: string; readonly idempotencyKey?: string }) => {
      const { source, session, accountId } = requireOwnerClient(active);
      return unwrapResult(
        await source.duplicateUnit(
          {
            idempotencyKey: input.idempotencyKey ?? createIdempotencyKey('duplicate-unit'),
            accountId,
            unitId: input.unitId,
          },
          session,
        ),
      );
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: unitsKeys.all }),
        queryClient.invalidateQueries({ queryKey: setupKeys.all }),
      ]);
    },
  });
}

export type SaveRoomVariables = Omit<OperationInput<'saveRoom'>, 'accountId' | 'idempotencyKey'>;

/** Edit room (R-1b): name, who may stay, bathroom, description. Renaming renames the beds too. */
export function useSaveRoomMutation() {
  const active = useActiveDataClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: SaveRoomVariables) => {
      const { source, session, accountId } = requireOwnerClient(active);
      return unwrapResult(
        await source.saveRoom(
          { ...input, accountId, idempotencyKey: createIdempotencyKey('save-room') },
          session,
        ),
      );
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: unitsKeys.all });
    },
  });
}

/** Gives every bed of a room the same amenities (R-1b). */
export function useSetRoomAmenitiesMutation() {
  const active = useActiveDataClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      readonly roomId: string;
      readonly amenityIds: readonly string[];
    }) => {
      const { source, session, accountId } = requireOwnerClient(active);
      return unwrapResult(
        await source.setRoomAmenities(
          {
            accountId,
            idempotencyKey: createIdempotencyKey('room-amenities'),
            roomId: input.roomId,
            amenityIds: [...input.amenityIds],
          },
          session,
        ),
      );
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: unitsKeys.all });
    },
  });
}

/** Deletes a unit that never had a booking or lease (F24, AUDIT-1 A20). */
export function useDeleteUnitMutation() {
  const active = useActiveDataClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { readonly unitId: string }) => {
      const { source, session, accountId } = requireOwnerClient(active);
      return unwrapResult(
        await source.deleteUnit(
          { accountId, idempotencyKey: createIdempotencyKey('delete-unit'), unitId: input.unitId },
          session,
        ),
      );
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: unitsKeys.all }),
        queryClient.invalidateQueries({ queryKey: setupKeys.all }),
      ]);
    },
  });
}

/** Adds or edits one of the owner's own amenities (R-3, D93). */
export function useSaveAmenityMutation() {
  const active = useActiveDataClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Omit<OperationInput<'saveAmenity'>, 'accountId' | 'idempotencyKey'>,
    ) => {
      const { source, session, accountId } = requireOwnerClient(active);
      return unwrapResult(
        await source.saveAmenity(
          { ...input, accountId, idempotencyKey: createIdempotencyKey('save-amenity') },
          session,
        ),
      );
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: unitsKeys.all });
    },
  });
}

/** Removes one of the owner's own amenities from the list, every unit and the property. */
export function useRemoveAmenityMutation() {
  const active = useActiveDataClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { readonly amenityId: string }) => {
      const { source, session, accountId } = requireOwnerClient(active);
      return unwrapResult(
        await source.removeAmenity(
          {
            accountId,
            idempotencyKey: createIdempotencyKey('remove-amenity'),
            amenityId: input.amenityId,
          },
          session,
        ),
      );
    },
    onSettled: async () => {
      await queryClient.invalidateQueries();
    },
  });
}
