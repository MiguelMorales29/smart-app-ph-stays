export const setupKeys = {
  all: ['setup'] as const,
  checklist: (accountId: string | null, propertyId: string | null) =>
    ['setup', 'checklist', accountId, propertyId] as const,
};
