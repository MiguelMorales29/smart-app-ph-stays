import { useQuery } from '@tanstack/react-query';

import { requireOwnerClient, unwrapResult, useActiveDataClient } from '../shared';
import { setupKeys } from './keys';

export function useSetupChecklistQuery(propertyId: string | null = null) {
  const active = useActiveDataClient();
  return useQuery({
    queryKey: setupKeys.checklist(active.accountId, propertyId),
    enabled: active.isOwnerReady,
    queryFn: async () => {
      const { source, session, accountId } = requireOwnerClient(active);
      return unwrapResult(await source.getSetupChecklist({ accountId, propertyId }, session));
    },
  });
}
