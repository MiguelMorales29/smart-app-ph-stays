import type { OperationInput } from '@smartapp/data';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { setupKeys } from '../setup/keys';
import {
  createIdempotencyKey,
  requireOwnerClient,
  unwrapResult,
  useActiveDataClient,
} from '../shared';
import { unitsKeys } from '../units/keys';
import { pricesKeys } from './keys';

export type SaveUnitPricesVariables = Omit<
  OperationInput<'saveUnitPrices'>,
  'accountId' | 'idempotencyKey'
> & {
  readonly idempotencyKey?: string;
};

export function useSaveUnitPricesMutation() {
  const active = useActiveDataClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SaveUnitPricesVariables) => {
      const { source, session, accountId } = requireOwnerClient(active);
      return unwrapResult(
        await source.saveUnitPrices(
          {
            ...input,
            accountId,
            idempotencyKey: input.idempotencyKey ?? createIdempotencyKey('save-prices'),
          },
          session,
        ),
      );
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: pricesKeys.all }),
        queryClient.invalidateQueries({ queryKey: unitsKeys.all }),
        queryClient.invalidateQueries({ queryKey: setupKeys.all }),
      ]);
    },
  });
}
