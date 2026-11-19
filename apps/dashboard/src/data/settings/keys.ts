export const settingsKeys = {
  all: ['settings'] as const,
  policies: (accountId: string | null, propertyId: string | null) =>
    ['settings', 'policies', accountId, propertyId] as const,
  hours: (accountId: string | null, propertyId: string | null) =>
    ['settings', 'hours', accountId, propertyId] as const,
  profile: (accountId: string | null) => ['settings', 'profile', accountId] as const,
};
