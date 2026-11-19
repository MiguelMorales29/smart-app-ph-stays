import { useMutation, useQueryClient } from '@tanstack/react-query';

import { authKeys } from '../auth/keys';
import { propertyKeys } from '../property/keys';
import {
  createIdempotencyKey,
  requireOwnerClient,
  unwrapResult,
  useActiveDataClient,
} from '../shared';
import { setupKeys } from './keys';

export function usePublishPropertyPageMutation() {
  const active = useActiveDataClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      readonly propertyId: string;
      readonly expectedVersion: number;
      readonly idempotencyKey?: string;
    }) => {
      const { source, session, accountId } = requireOwnerClient(active);
      return unwrapResult(
        await source.publishPropertyPage(
          {
            idempotencyKey: input.idempotencyKey ?? createIdempotencyKey('publish-page'),
            accountId,
            propertyId: input.propertyId,
            expectedVersion: input.expectedVersion,
          },
          session,
        ),
      );
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: setupKeys.all }),
        queryClient.invalidateQueries({ queryKey: propertyKeys.all }),
        queryClient.invalidateQueries({ queryKey: authKeys.all }),
      ]);
    },
  });
}
