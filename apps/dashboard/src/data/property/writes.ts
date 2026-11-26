import type { OperationInput } from '@smartapp/data';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { authKeys } from '../auth/keys';
import { setupKeys } from '../setup/keys';
import {
  createIdempotencyKey,
  requireOwnerClient,
  unwrapResult,
  useActiveDataClient,
} from '../shared';
import { propertyKeys } from './keys';

export type SavePropertyVariables = Omit<
  OperationInput<'saveProperty'>,
  'accountId' | 'idempotencyKey'
> & {
  readonly idempotencyKey?: string;
};

export function useSavePropertyMutation() {
  const active = useActiveDataClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SavePropertyVariables) => {
      const { source, session, accountId } = requireOwnerClient(active);
      return unwrapResult(
        await source.saveProperty(
          {
            ...input,
            accountId,
            idempotencyKey: input.idempotencyKey ?? createIdempotencyKey('save-property'),
          },
          session,
        ),
      );
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: propertyKeys.all }),
        queryClient.invalidateQueries({ queryKey: setupKeys.all }),
        queryClient.invalidateQueries({ queryKey: authKeys.all }),
      ]);
    },
  });
}

export function useChangeSlugMutation() {
  const active = useActiveDataClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      readonly propertyId: string;
      readonly newSlug: string;
      readonly idempotencyKey?: string;
    }) => {
      const { source, session, accountId } = requireOwnerClient(active);
      return unwrapResult(
        await source.changeSlug(
          {
            idempotencyKey: input.idempotencyKey ?? createIdempotencyKey('change-slug'),
            accountId,
            propertyId: input.propertyId,
            newSlug: input.newSlug,
          },
          session,
        ),
      );
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: propertyKeys.all }),
        queryClient.invalidateQueries({ queryKey: authKeys.all }),
      ]);
    },
  });
}

/** "At the property" amenities, set once for every unit (R-3, D93). */
export function useSetPropertyAmenitiesMutation() {
  const active = useActiveDataClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      readonly propertyId: string;
      readonly amenityIds: readonly string[];
    }) => {
      const { source, session, accountId } = requireOwnerClient(active);
      return unwrapResult(
        await source.setPropertyAmenities(
          {
            accountId,
            idempotencyKey: createIdempotencyKey('property-amenities'),
            propertyId: input.propertyId,
            amenityIds: [...input.amenityIds],
          },
          session,
        ),
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: propertyKeys.all });
    },
  });
}
