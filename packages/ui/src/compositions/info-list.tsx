import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from '@smartapp/ui/components/item';
import { cn } from 'cn';
import { Fragment, type ReactNode } from 'react';

export interface InfoRow {
  readonly id: string;
  readonly icon?: ReactNode | undefined;
  readonly label: string;
  /** Optional badge beside the label (e.g. a Today pill). */
  readonly badge?: ReactNode | undefined;
  /** Optional secondary line under the label (address, handle, note). */
  readonly description?: string | null | undefined;
  /** Right-aligned value (hours, price, status). */
  readonly value?: ReactNode | undefined;
  /** Optional tappable link (phone, Messenger, map). */
  readonly href?: string | undefined;
  readonly external?: boolean | undefined;
  /** Highlights today's or the active row. */
  readonly highlight?: boolean | undefined;
}

/** Label and value rows in one bordered card group (hours, contact, booking summaries). */
export function InfoList({
  rows,
  className,
}: {
  readonly rows: readonly InfoRow[];
  readonly className?: string | undefined;
}) {
  if (rows.length === 0) return null;

  return (
    <ItemGroup
      data-slot="info-list"
      className={cn(
        'gap-0 overflow-hidden rounded-xl border border-border bg-card has-data-[size=sm]:gap-0',
        className,
      )}
    >
      {rows.map((row, index) => (
        <Fragment key={row.id}>
          {index > 0 ? <ItemSeparator className="my-0" /> : null}
          <Item
            size="sm"
            data-highlight={row.highlight ? '' : undefined}
            className="min-h-11 rounded-none data-highlight:bg-primary-tint data-highlight:font-semibold data-highlight:text-foreground"
            render={
              row.href ? (
                <a
                  href={row.href}
                  target={row.external ? '_blank' : undefined}
                  rel={row.external ? 'noopener noreferrer' : undefined}
                />
              ) : undefined
            }
          >
            {row.icon ? <ItemMedia variant="icon">{row.icon}</ItemMedia> : null}
            <ItemContent className="min-w-0">
              <ItemTitle>
                {row.label}
                {row.badge}
              </ItemTitle>
              {row.description ? (
                <ItemDescription className="truncate">{row.description}</ItemDescription>
              ) : null}
            </ItemContent>
            {row.value ? (
              <ItemActions className="text-right text-sm tabular">{row.value}</ItemActions>
            ) : null}
          </Item>
        </Fragment>
      ))}
    </ItemGroup>
  );
}
