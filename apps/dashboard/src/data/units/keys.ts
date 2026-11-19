export const unitsKeys = {
  all: ['units'] as const,
  list: (accountId: string | null, propertyId: string | null, includeArchived: boolean) =>
    ['units', 'list', accountId, propertyId, includeArchived] as const,
  detail: (accountId: string | null, unitId: string | null) =>
    ['units', 'detail', accountId, unitId] as const,
  amenities: (accountId: string | null) => ['units', 'amenities', accountId] as const,
};
