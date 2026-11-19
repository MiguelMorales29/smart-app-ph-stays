import { useQuery } from '@tanstack/react-query';

import { requireOwnerClient, unwrapResult, useActiveDataClient } from '../shared';
import { paymentsKeys } from './keys';

export function usePaymentAccountsQuery() {
  const active = useActiveDataClient();
  return useQuery({
    queryKey: paymentsKeys.accounts(active.accountId),
    enabled: active.isOwnerReady,
    queryFn: async () => {
      const { source, session, accountId } = requireOwnerClient(active);
      return unwrapResult(await source.listPaymentAccounts({ accountId }, session));
    },
  });
}
