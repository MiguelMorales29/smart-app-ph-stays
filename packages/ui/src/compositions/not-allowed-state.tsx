import type { ReactNode } from 'react';
import { ShieldAlertIcon } from 'lucide-react';
import { cn } from 'cn';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@smartapp/ui/components/empty';

export interface NotAllowedStateProps {
  readonly title?: string | undefined;
  readonly message?: string | undefined;
  readonly action?: ReactNode;
  readonly className?: string | undefined;
}

/** Shared access-restricted state built from shadcn Empty. */
export function NotAllowedState({
  title = 'Access not allowed',
  message = 'You do not have permission to view this page with the current account.',
  action,
  className,
}: NotAllowedStateProps) {
  return (
    <Empty
      role="alert"
      data-slot="not-allowed-state"
      className={cn('border border-border bg-card py-12', className)}
    >
      <EmptyHeader>
        <EmptyMedia variant="icon" className="bg-warning-tint text-warning">
          <ShieldAlertIcon />
        </EmptyMedia>
        <EmptyTitle className="text-lg font-semibold">{title}</EmptyTitle>
        <EmptyDescription className="text-balance">{message}</EmptyDescription>
      </EmptyHeader>
      {action ? <EmptyContent>{action}</EmptyContent> : null}
    </Empty>
  );
}
