import { useQuery } from '@tanstack/react-query';

import { requireOwnerClient, unwrapResult, useActiveDataClient } from '../shared';
import { pricesKeys } from './keys';

export function useUnitPricesQuery(unitId: string | null) {
  const active = useActiveDataClient();
  return useQuery({
    queryKey: pricesKeys.unit(active.accountId, unitId),
    enabled: active.isOwnerReady && unitId !== null,
    queryFn: async () => {
      const { source, session, accountId } = requireOwnerClient(active);
      if (unitId === null) {
        throw new Error('unitId is required.');
      }
      const detail = unwrapResult(await source.getOwnerUnit({ accountId, unitId }, session));
      return {
        unit: detail.unit,
        stayTerms: detail.stay_terms,
        leaseTerms: detail.lease_terms,
        weekdayRates: detail.weekday_rates,
        rateOverrides: detail.rate_overrides,
        fees: detail.fees,
      };
    },
  });
}
