import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

export function createDashboardQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: 30_000,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

export function DashboardQueryProvider({ children }: { readonly children: ReactNode }) {
  const [queryClient] = useState(createDashboardQueryClient);
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
