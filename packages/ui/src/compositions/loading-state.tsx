import { cn } from 'cn';
import { Skeleton } from '@smartapp/ui/components/skeleton';

export interface LoadingStateProps {
  readonly label?: string | undefined;
  readonly layout?: 'page' | 'cards' | 'list' | undefined;
  readonly className?: string | undefined;
}

/** Shared skeleton loading state with polite status announcement for screen readers. */
export function LoadingState({
  label = 'Loading…',
  layout = 'page',
  className,
}: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={label}
      data-slot="loading-state"
      className={cn('space-y-4', className)}
    >
      <span className="sr-only">{label}</span>
      {layout === 'cards' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      ) : layout === 'list' ? (
        <div className="space-y-3">
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
        </div>
      ) : (
        <div className="space-y-4">
          <Skeleton className="h-8 w-52 rounded-lg" />
          <Skeleton className="h-4 w-72 rounded-md" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      )}
    </div>
  );
}
