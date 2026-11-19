import { useQuery } from '@tanstack/react-query';

import {
  requireOwnerClient,
  requireSourceClient,
  unwrapResult,
  useActiveDataClient,
} from '../shared';
import { authKeys } from './keys';

export function useMyAccountQuery() {
  const active = useActiveDataClient();
  return useQuery({
    queryKey: authKeys.myAccount(active.accountId),
    enabled: active.isOwnerReady,
    // The approval status is checked again every 30 seconds and when the tab comes back (F20).
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const { source, session, accountId } = requireOwnerClient(active);
      return unwrapResult(await source.getMyAccount({ accountId }, session));
    },
  });
}

export function usePlansQuery() {
  const active = useActiveDataClient();
  return useQuery({
    queryKey: authKeys.plans,
    enabled: active.source !== null,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { source, session } = requireSourceClient(active);
      return unwrapResult(await source.listPlans({}, session));
    },
  });
}
