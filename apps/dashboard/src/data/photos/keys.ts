export const photosKeys = {
  all: ['photos'] as const,
  listing: (accountId: string | null, propertyId: string | null, unitId: string | null) =>
    ['photos', 'listing', accountId, propertyId, unitId] as const,
};
