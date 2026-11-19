export const propertyKeys = {
  all: ['property'] as const,
  detail: (accountId: string | null, propertyId: string | null) =>
    ['property', 'detail', accountId, propertyId] as const,
  slugCheck: (accountId: string | null, slug: string, excludePropertyId: string | null) =>
    ['property', 'slugCheck', accountId, slug, excludePropertyId] as const,
};
