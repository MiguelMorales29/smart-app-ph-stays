import { useQuery } from '@tanstack/react-query';

import { requireOwnerClient, unwrapResult, useActiveDataClient } from '../shared';
import { propertyKeys } from './keys';

export function useOwnerPropertyQuery(propertyId: string | null = null) {
  const active = useActiveDataClient();
  return useQuery({
    queryKey: propertyKeys.detail(active.accountId, propertyId),
    enabled: active.isOwnerReady,
    queryFn: async () => {
      const { source, session, accountId } = requireOwnerClient(active);
      return unwrapResult(await source.getOwnerProperty({ accountId, propertyId }, session));
    },
  });
}

export function useCheckSlugQuery(slug: string, excludePropertyId: string | null = null) {
  const active = useActiveDataClient();
  const trimmed = slug.trim();
  return useQuery({
    queryKey: propertyKeys.slugCheck(active.accountId, trimmed, excludePropertyId),
    enabled: active.isOwnerReady && trimmed.length > 0,
    queryFn: async () => {
      const { source, session, accountId } = requireOwnerClient(active);
      return unwrapResult(
        await source.checkSlug({ accountId, slug: trimmed, excludePropertyId }, session),
      );
    },
  });
}

/** Returns a function SlugField can call to check a web address (checkSlug), 400 ms after typing. */
export function useSlugChecker(excludePropertyId: string | null = null) {
  const active = useActiveDataClient();
  return async (slug: string) => {
    const { source, session, accountId } = requireOwnerClient(active);
    const result = unwrapResult(
      await source.checkSlug({ accountId, slug, excludePropertyId }, session),
    );
    return { status: result.status, suggestions: result.suggestions };
  };
}
