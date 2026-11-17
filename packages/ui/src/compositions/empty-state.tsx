import type { ReactNode } from 'react';
import { InboxIcon } from 'lucide-react';
import { cn } from 'cn';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@smartapp/ui/components/empty';

export interface EmptyStateProps {
  readonly icon?: ReactNode;
  readonly art?: string | undefined;
  readonly title: string;
  readonly description?: string | undefined;
  readonly action?: ReactNode;
  readonly children?: ReactNode;
  readonly variant?: 'box' | 'plain' | undefined;
  readonly className?: string | undefined;
  readonly id?: string | undefined;
}

/** Shared empty state built on shadcn Empty: icon or picture, title, description, one action. */
export function EmptyState({
  icon,
  art,
  title,
  description,
  action,
  children,
  variant = 'box',
  className,
  id,
}: EmptyStateProps) {
  return (
    <Empty
      id={id}
      data-slot="empty-state"
      className={cn(
        'gap-5 py-10',
        variant === 'box' && 'border border-dashed border-border bg-muted/40',
        className,
      )}
    >
      <EmptyHeader className="gap-3">
        {art ? (
          <EmptyMedia>
            <img
              src={art}
              alt=""
              width={96}
              height={96}
              loading="lazy"
              decoding="async"
              className="size-24 object-contain drop-shadow-md"
            />
          </EmptyMedia>
        ) : (
          <EmptyMedia variant="icon">{icon ?? <InboxIcon />}</EmptyMedia>
        )}
        <EmptyTitle className="text-lg font-semibold text-balance">{title}</EmptyTitle>
        {description ? (
          <EmptyDescription className="text-balance">{description}</EmptyDescription>
        ) : null}
      </EmptyHeader>
      {action || children ? (
        <EmptyContent className="gap-4">
          {action}
          {children}
        </EmptyContent>
      ) : null}
    </Empty>
  );
}
