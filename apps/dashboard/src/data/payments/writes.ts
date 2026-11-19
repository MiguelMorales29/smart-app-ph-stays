import type { OperationInput } from '@smartapp/data';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { setupKeys } from '../setup/keys';
import {
  createIdempotencyKey,
  requireOwnerClient,
  unwrapResult,
  useActiveDataClient,
} from '../shared';
import { paymentsKeys } from './keys';

export function useSavePaymentAccountMutation() {
  const active = useActiveDataClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: Omit<OperationInput<'savePaymentAccount'>, 'accountId' | 'idempotencyKey'> & {
        readonly idempotencyKey?: string;
      },
    ) => {
      const { source, session, accountId } = requireOwnerClient(active);
      return unwrapResult(
        await source.savePaymentAccount(
          {
            ...input,
            accountId,
            idempotencyKey: input.idempotencyKey ?? createIdempotencyKey('save-payment-account'),
          },
          session,
        ),
      );
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: paymentsKeys.all }),
        queryClient.invalidateQueries({ queryKey: setupKeys.all }),
      ]);
    },
  });
}

export function useSetPaymentAccountActiveMutation() {
  const active = useActiveDataClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: Omit<OperationInput<'setPaymentAccountActive'>, 'accountId' | 'idempotencyKey'> & {
        readonly idempotencyKey?: string;
      },
    ) => {
      const { source, session, accountId } = requireOwnerClient(active);
      return unwrapResult(
        await source.setPaymentAccountActive(
          {
            ...input,
            accountId,
            idempotencyKey: input.idempotencyKey ?? createIdempotencyKey('toggle-payment-account'),
          },
          session,
        ),
      );
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: paymentsKeys.all }),
        queryClient.invalidateQueries({ queryKey: setupKeys.all }),
      ]);
    },
  });
}

export function useReorderPaymentAccountsMutation() {
  const active = useActiveDataClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      readonly paymentAccountIds: string[];
      readonly idempotencyKey?: string;
    }) => {
      const { source, session, accountId } = requireOwnerClient(active);
      return unwrapResult(
        await source.reorderPaymentAccounts(
          {
            idempotencyKey: input.idempotencyKey ?? createIdempotencyKey('reorder-payments'),
            accountId,
            paymentAccountIds: input.paymentAccountIds,
          },
          session,
        ),
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: paymentsKeys.all });
    },
  });
}
