export const paymentsKeys = {
  all: ['payments'] as const,
  accounts: (accountId: string | null) => ['payments', 'accounts', accountId] as const,
};
