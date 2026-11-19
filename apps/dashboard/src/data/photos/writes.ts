import type { OperationInput } from '@smartapp/data';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { propertyKeys } from '../property/keys';
import { setupKeys } from '../setup/keys';
import {
  createIdempotencyKey,
  requireOwnerClient,
  unwrapResult,
  useActiveDataClient,
} from '../shared';
import { unitsKeys } from '../units/keys';
import { photosKeys } from './keys';

export function useRequestUploadMutation() {
  const active = useActiveDataClient();

  return useMutation({
    mutationFn: async (
      input: Omit<OperationInput<'requestUpload'>, 'accountId' | 'idempotencyKey'> & {
        readonly idempotencyKey?: string;
      },
    ) => {
      const { source, session, accountId } = requireOwnerClient(active);
      return unwrapResult(
        await source.requestUpload(
          {
            ...input,
            accountId,
            idempotencyKey: input.idempotencyKey ?? createIdempotencyKey('req-upload'),
          },
          session,
        ),
      );
    },
  });
}

export function useConfirmUploadMutation() {
  const active = useActiveDataClient();

  return useMutation({
    mutationFn: async (
      input: Omit<OperationInput<'confirmUpload'>, 'accountId' | 'idempotencyKey'> & {
        readonly idempotencyKey?: string;
      },
    ) => {
      const { source, session, accountId } = requireOwnerClient(active);
      return unwrapResult(
        await source.confirmUpload(
          {
            ...input,
            accountId,
            idempotencyKey: input.idempotencyKey ?? createIdempotencyKey('confirm-upload'),
          },
          session,
        ),
      );
    },
  });
}

export function useSaveListingPhotosMutation() {
  const active = useActiveDataClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: Omit<OperationInput<'saveListingPhotos'>, 'accountId' | 'idempotencyKey'> & {
        readonly idempotencyKey?: string;
      },
    ) => {
      const { source, session, accountId } = requireOwnerClient(active);
      return unwrapResult(
        await source.saveListingPhotos(
          {
            ...input,
            accountId,
            idempotencyKey: input.idempotencyKey ?? createIdempotencyKey('save-photos'),
          },
          session,
        ),
      );
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: photosKeys.all }),
        queryClient.invalidateQueries({ queryKey: propertyKeys.all }),
        queryClient.invalidateQueries({ queryKey: unitsKeys.all }),
        queryClient.invalidateQueries({ queryKey: setupKeys.all }),
      ]);
    },
  });
}
