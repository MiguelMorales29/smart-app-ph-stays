import type { OperationInput } from '@smartapp/data';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  createIdempotencyKey,
  requireSourceClient,
  unwrapResult,
  useActiveDataClient,
} from '../shared';
import { authKeys } from './keys';

export type ApplyAsOwnerVariables =
  | (Omit<Extract<OperationInput<'applyAsOwner'>, { method: 'password' }>, 'idempotencyKey'> & {
      readonly idempotencyKey?: string;
    })
  | (Omit<Extract<OperationInput<'applyAsOwner'>, { method: 'google' }>, 'idempotencyKey'> & {
      readonly idempotencyKey?: string;
    });

export function useApplyAsOwnerMutation() {
  const active = useActiveDataClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ApplyAsOwnerVariables) => {
      const { source, session } = requireSourceClient(active);
      const idempotencyKey = input.idempotencyKey ?? createIdempotencyKey('apply-owner');
      const payload: OperationInput<'applyAsOwner'> =
        input.method === 'google' ? { ...input, idempotencyKey } : { ...input, idempotencyKey };
      return unwrapResult(await source.applyAsOwner(payload, session));
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
  });
}

export function useSignInMutation() {
  const active = useActiveDataClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: OperationInput<'signIn'>) => {
      const { source, session } = requireSourceClient(active);
      return unwrapResult(await source.signIn(input, session));
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
  });
}

export function useSignInWithGoogleMutation() {
  const active = useActiveDataClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: OperationInput<'signInWithGoogle'>) => {
      const { source, session } = requireSourceClient(active);
      return unwrapResult(await source.signInWithGoogle(input, session));
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
  });
}

export function useRequestPasswordCodeMutation() {
  const active = useActiveDataClient();

  return useMutation({
    mutationFn: async (input: { readonly email: string; readonly idempotencyKey?: string }) => {
      const { source, session } = requireSourceClient(active);
      return unwrapResult(
        await source.requestPasswordCode(
          {
            idempotencyKey: input.idempotencyKey ?? createIdempotencyKey('pw-code'),
            email: input.email,
          },
          session,
        ),
      );
    },
  });
}

export function useResetPasswordMutation() {
  const active = useActiveDataClient();

  return useMutation({
    mutationFn: async (
      input: Omit<OperationInput<'resetPassword'>, 'idempotencyKey'> & {
        readonly idempotencyKey?: string;
      },
    ) => {
      const { source, session } = requireSourceClient(active);
      return unwrapResult(
        await source.resetPassword(
          {
            ...input,
            idempotencyKey: input.idempotencyKey ?? createIdempotencyKey('pw-reset'),
          },
          session,
        ),
      );
    },
  });
}
