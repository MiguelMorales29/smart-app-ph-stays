'use client';

import { ErrorState } from '@smartapp/ui/compositions/error-state';
import { LoadingState } from '@smartapp/ui/compositions/loading-state';
import { Skeleton } from '@smartapp/ui/components/skeleton';
import { useRouter } from 'next/navigation';

export interface PropertyErrorViewProps {
  readonly kind: 'offline' | 'error';
  readonly message: string;
  readonly code?: string | undefined;
}

/** Shared client retry wrapper for server-resolved error and offline property states. */
export function PropertyErrorView({ kind, message, code }: PropertyErrorViewProps) {
  const router = useRouter();
  const title = kind === 'offline' ? 'You appear to be offline' : 'Could not load this property';
  const body =
    kind === 'offline'
      ? 'Check your connection and try again.'
      : message || 'Something went wrong while loading this page. Try again in a moment.';

  return (
    <main className="mx-auto flex min-h-[60dvh] w-full max-w-2xl flex-col items-center justify-center px-4 py-12">
      <div className="w-full space-y-2">
        <ErrorState
          title={title}
          message={body}
          retryLabel="Try again"
          onRetry={() => router.refresh()}
        />
        {code ? (
          <p className="text-center text-xs text-muted-foreground">Support code: {code}</p>
        ) : null}
      </div>
    </main>
  );
}

/** Property-shaped skeleton fallback shown during SSR streaming (`?pack=slow`). */
export function PropertyLoadingSkeleton() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6">
      <Skeleton className="aspect-4/3 w-full rounded-2xl md:aspect-21/9" />
      <LoadingState label="Loading property…" layout="page" />
    </div>
  );
}
