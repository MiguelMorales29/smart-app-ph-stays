import { useQuery } from '@tanstack/react-query';

import { requireOwnerClient, unwrapResult, useActiveDataClient } from '../shared';
import { authKeys } from './keys';

export function useMyAccountQuery() {
  const active = useActiveDataClient();
  return useQuery({
    queryKey: authKeys.myAccount(active.accountId),
    enabled: active.isOwnerReady,
    queryFn: async () => {
      const { source, session, accountId } = requireOwnerClient(active);
      return unwrapResult(await source.getMyAccount({ accountId }, session));
    },
  });
}
