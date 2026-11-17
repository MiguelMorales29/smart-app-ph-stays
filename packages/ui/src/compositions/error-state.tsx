import { RefreshCwIcon } from 'lucide-react';
import { cn } from 'cn';
import { Button } from '@smartapp/ui/components/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@smartapp/ui/components/empty';

export interface ErrorStateProps {
  readonly title?: string | undefined;
  readonly message: string;
  readonly retryLabel?: string | undefined;
  readonly onRetry?: (() => void) | undefined;
  readonly className?: string | undefined;
}

/** Shared failure state with plain-word explanation and a "Try again" recovery button. */
export function ErrorState({
  title = 'Something went wrong',
  message,
  retryLabel = 'Try again',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <Empty
      role="alert"
      data-slot="error-state"
      className={cn('border border-border bg-card py-12', className)}
    >
      <EmptyHeader>
        <EmptyMedia variant="icon" className="bg-danger-tint text-destructive">
          <RefreshCwIcon />
        </EmptyMedia>
        <EmptyTitle className="text-lg font-semibold">{title}</EmptyTitle>
        <EmptyDescription>{message}</EmptyDescription>
      </EmptyHeader>
      {onRetry ? (
        <EmptyContent>
          <Button variant="outline" className="min-h-11 gap-2" onClick={onRetry}>
            <RefreshCwIcon className="size-4" />
            {retryLabel}
          </Button>
        </EmptyContent>
      ) : null}
    </Empty>
  );
}
