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
