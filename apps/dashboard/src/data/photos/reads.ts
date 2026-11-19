import { useQuery } from '@tanstack/react-query';

import { requireOwnerClient, unwrapResult, useActiveDataClient } from '../shared';
import { photosKeys } from './keys';

export function useListingPhotosQuery(propertyId: string | null, unitId: string | null = null) {
  const active = useActiveDataClient();
  return useQuery({
    queryKey: photosKeys.listing(active.accountId, propertyId, unitId),
    enabled: active.isOwnerReady && (unitId !== null || propertyId !== null),
    queryFn: async () => {
      const { source, session, accountId } = requireOwnerClient(active);
      if (unitId !== null) {
        const detail = unwrapResult(await source.getOwnerUnit({ accountId, unitId }, session));
        return detail.photos;
      }
      const prop = unwrapResult(await source.getOwnerProperty({ accountId, propertyId }, session));
      return prop?.photos ?? [];
    },
  });
}
