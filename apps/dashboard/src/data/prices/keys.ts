export const pricesKeys = {
  all: ['prices'] as const,
  unit: (accountId: string | null, unitId: string | null) =>
    ['prices', 'unit', accountId, unitId] as const,
};
