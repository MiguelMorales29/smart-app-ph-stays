export const authKeys = {
  all: ['auth'] as const,
  plans: ['auth', 'plans'] as const,
  myAccount: (accountId: string | null) => ['auth', 'myAccount', accountId] as const,
};
