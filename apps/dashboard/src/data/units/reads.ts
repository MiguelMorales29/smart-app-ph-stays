import { useQuery } from '@tanstack/react-query';

import { requireOwnerClient, unwrapResult, useActiveDataClient } from '../shared';
import { unitsKeys } from './keys';

export function useOwnerUnitsQuery(propertyId: string | null = null, includeArchived = false) {
  const active = useActiveDataClient();
  return useQuery({
    queryKey: unitsKeys.list(active.accountId, propertyId, includeArchived),
    enabled: active.isOwnerReady,
    queryFn: async () => {
      const { source, session, accountId } = requireOwnerClient(active);
      return unwrapResult(
        await source.listOwnerUnits({ accountId, propertyId, includeArchived }, session),
      );
    },
  });
}

export function useOwnerUnitQuery(unitId: string | null) {
  const active = useActiveDataClient();
  return useQuery({
    queryKey: unitsKeys.detail(active.accountId, unitId),
    enabled: active.isOwnerReady && unitId !== null,
    queryFn: async () => {
      const { source, session, accountId } = requireOwnerClient(active);
      if (unitId === null) {
        throw new Error('unitId is required.');
      }
      return unwrapResult(await source.getOwnerUnit({ accountId, unitId }, session));
    },
  });
}

export function useAmenitiesQuery() {
  const active = useActiveDataClient();
  return useQuery({
    queryKey: unitsKeys.amenities(active.accountId),
    enabled: active.isOwnerReady,
    queryFn: async () => {
      const { source, session, accountId } = requireOwnerClient(active);
      return unwrapResult(await source.listAmenities({ accountId }, session));
    },
  });
}
