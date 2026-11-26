import type { OperationInput } from '@smartapp/data';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { authKeys } from '../auth/keys';
import { propertyKeys } from '../property/keys';
import { setupKeys } from '../setup/keys';
import {
  createIdempotencyKey,
  requireOwnerClient,
  unwrapResult,
  useActiveDataClient,
} from '../shared';
import { settingsKeys } from './keys';

export function useSavePoliciesMutation() {
  const active = useActiveDataClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: Omit<OperationInput<'savePolicies'>, 'accountId' | 'idempotencyKey'> & {
        readonly idempotencyKey?: string;
      },
    ) => {
      const { source, session, accountId } = requireOwnerClient(active);
      return unwrapResult(
        await source.savePolicies(
          {
            ...input,
            accountId,
            idempotencyKey: input.idempotencyKey ?? createIdempotencyKey('save-policies'),
          },
          session,
        ),
      );
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: settingsKeys.all }),
        queryClient.invalidateQueries({ queryKey: propertyKeys.all }),
        queryClient.invalidateQueries({ queryKey: setupKeys.all }),
      ]);
    },
  });
}

export function useSaveHoursMutation() {
  const active = useActiveDataClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: Omit<OperationInput<'saveHours'>, 'accountId' | 'idempotencyKey'> & {
        readonly idempotencyKey?: string;
      },
    ) => {
      const { source, session, accountId } = requireOwnerClient(active);
      return unwrapResult(
        await source.saveHours(
          {
            ...input,
            accountId,
            idempotencyKey: input.idempotencyKey ?? createIdempotencyKey('save-hours'),
          },
          session,
        ),
      );
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: settingsKeys.all }),
        queryClient.invalidateQueries({ queryKey: propertyKeys.all }),
      ]);
    },
  });
}

export function useUpdateProfileMutation() {
  const active = useActiveDataClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: Omit<OperationInput<'updateProfile'>, 'accountId' | 'idempotencyKey'> & {
        readonly idempotencyKey?: string;
      },
    ) => {
      const { source, session, accountId } = requireOwnerClient(active);
      return unwrapResult(
        await source.updateProfile(
          {
            ...input,
            accountId,
            idempotencyKey: input.idempotencyKey ?? createIdempotencyKey('update-profile'),
          },
          session,
        ),
      );
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: settingsKeys.all }),
        queryClient.invalidateQueries({ queryKey: authKeys.all }),
      ]);
    },
  });
}

export function useChangePasswordMutation() {
  const active = useActiveDataClient();

  return useMutation({
    mutationFn: async (
      input: Omit<OperationInput<'changePassword'>, 'accountId' | 'idempotencyKey'> & {
        readonly idempotencyKey?: string;
      },
    ) => {
      const { source, session, accountId } = requireOwnerClient(active);
      return unwrapResult(
        await source.changePassword(
          {
            ...input,
            accountId,
            idempotencyKey: input.idempotencyKey ?? createIdempotencyKey('change-password'),
          },
          session,
        ),
      );
    },
  });
}

export function useSignOutEverywhereMutation() {
  const active = useActiveDataClient();

  return useMutation({
    mutationFn: async (input: { readonly idempotencyKey?: string } = {}) => {
      const { source, session, accountId } = requireOwnerClient(active);
      return unwrapResult(
        await source.signOutEverywhere(
          {
            idempotencyKey: input.idempotencyKey ?? createIdempotencyKey('sign-out-all'),
            accountId,
          },
          session,
        ),
      );
    },
  });
}

export function useRequestAccountDeletionMutation() {
  const active = useActiveDataClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: Omit<OperationInput<'requestAccountDeletion'>, 'accountId' | 'idempotencyKey'> & {
        readonly idempotencyKey?: string;
      },
    ) => {
      const { source, session, accountId } = requireOwnerClient(active);
      return unwrapResult(
        await source.requestAccountDeletion(
          {
            ...input,
            accountId,
            idempotencyKey: input.idempotencyKey ?? createIdempotencyKey('account-deletion'),
          },
          session,
        ),
      );
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: settingsKeys.all }),
        queryClient.invalidateQueries({ queryKey: authKeys.all }),
      ]);
    },
  });
}

export function useSetProfilePictureMutation() {
  const active = useActiveDataClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: Omit<OperationInput<'setProfilePicture'>, 'accountId' | 'idempotencyKey'> & {
        readonly idempotencyKey?: string;
      },
    ) => {
      const { source, session, accountId } = requireOwnerClient(active);
      return unwrapResult(
        await source.setProfilePicture(
          {
            ...input,
            accountId,
            idempotencyKey: input.idempotencyKey ?? createIdempotencyKey('set-profile-picture'),
          },
          session,
        ),
      );
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: settingsKeys.all }),
        queryClient.invalidateQueries({ queryKey: authKeys.all }),
      ]);
    },
  });
}

/** Special days for the reply and viewing hours, saved as the whole list (R-2b, D95). */
export function useSetSpecialDaysMutation() {
  const active = useActiveDataClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Omit<OperationInput<'setSpecialDays'>, 'accountId' | 'idempotencyKey'>,
    ) => {
      const { source, session, accountId } = requireOwnerClient(active);
      return unwrapResult(
        await source.setSpecialDays(
          { ...input, accountId, idempotencyKey: createIdempotencyKey('special-days') },
          session,
        ),
      );
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: settingsKeys.all }),
        queryClient.invalidateQueries({ queryKey: propertyKeys.all }),
      ]);
    },
  });
}
