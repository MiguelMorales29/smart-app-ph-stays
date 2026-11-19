import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import type { AccountsRow, ProfilesRow } from '@smartapp/core';
import type { Session } from '@smartapp/data';
import { useDashboard } from '@/app/dashboard-context';

export interface OwnerSessionResult {
  readonly account: AccountsRow;
  readonly profile: ProfilesRow;
  readonly session: Session;
}

/**
 * Starts the owner's session after sign-in, Google or applying, then sends pending owners to
 * set up their page and everyone else to Home (D47). Uses the dashboard's existing session layer.
 */
export function useStartOwnerSession() {
  const { adoptSession } = useDashboard();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return async (result: OwnerSessionResult, options: { readonly go?: boolean } = {}) => {
    queryClient.clear();
    adoptSession({
      kind: 'owner',
      session: result.session,
      accountId: result.account.id,
      isPendingOwner: result.account.status === 'pending',
      ownerLabel: `${result.profile.full_name} (${result.account.name})`,
      propertyName: result.account.name,
    });
    if (options.go === false) return;
    await navigate({ to: result.account.status === 'pending' ? '/onboarding' : '/home' });
  };
}

/** Signs out of the screen session and goes to the sign-in page. */
export function useSignOut() {
  const { adoptSession } = useDashboard();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return async () => {
    queryClient.clear();
    adoptSession({ kind: 'signed_out' });
    await navigate({ to: '/login' });
  };
}
