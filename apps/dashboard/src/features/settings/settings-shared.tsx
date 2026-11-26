import { ErrorState } from '@smartapp/ui/compositions/error-state';
import { Skeleton } from '@smartapp/ui/components/skeleton';
import { extractAppError } from '@/data/shared';

export { useOfflineSave, useSaveState } from '@/app/save-state';

export function SettingsSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-40 w-full rounded-2xl" />
      <Skeleton className="h-28 w-full rounded-2xl" />
    </div>
  );
}

export function SettingsError({
  error,
  onRetry,
}: {
  readonly error: unknown;
  readonly onRetry: () => void;
}) {
  return (
    <ErrorState
      title="We couldn't load this page"
      message={extractAppError(error).message}
      onRetry={onRetry}
    />
  );
}

/** Same value, compared as JSON (drafts are plain objects). */
export function same(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
