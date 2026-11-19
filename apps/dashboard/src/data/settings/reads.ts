import { useQuery } from '@tanstack/react-query';

import { requireOwnerClient, unwrapResult, useActiveDataClient } from '../shared';
import { settingsKeys } from './keys';

export function usePoliciesQuery(propertyId: string | null = null) {
  const active = useActiveDataClient();
  return useQuery({
    queryKey: settingsKeys.policies(active.accountId, propertyId),
    enabled: active.isOwnerReady,
    queryFn: async () => {
      const { source, session, accountId } = requireOwnerClient(active);
      const data = unwrapResult(await source.getOwnerProperty({ accountId, propertyId }, session));
      if (data === null) return null;
      return {
        property: data.property,
        houseRules: data.house_rules,
      };
    },
  });
}

export function useHoursQuery(propertyId: string | null = null) {
  const active = useActiveDataClient();
  return useQuery({
    queryKey: settingsKeys.hours(active.accountId, propertyId),
    enabled: active.isOwnerReady,
    queryFn: async () => {
      const { source, session, accountId } = requireOwnerClient(active);
      const data = unwrapResult(await source.getOwnerProperty({ accountId, propertyId }, session));
      if (data === null) return null;
      return {
        propertyId: data.property.id,
        updatedAt: data.property.updated_at,
        replyHours: data.property.reply_hours,
        viewingHours: data.property.viewing_hours,
      };
    },
  });
}

export function useProfileQuery() {
  const active = useActiveDataClient();
  return useQuery({
    queryKey: settingsKeys.profile(active.accountId),
    enabled: active.isOwnerReady,
    queryFn: async () => {
      const { source, session, accountId } = requireOwnerClient(active);
      return unwrapResult(await source.getMyAccount({ accountId }, session));
    },
  });
}
