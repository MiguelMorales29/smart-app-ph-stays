import type { ReactNode } from 'react';
import { ChevronRightIcon } from 'lucide-react';
import { cn } from 'cn';

export interface SettingsListRow {
  readonly id: string;
  readonly label: string;
  /** The current value, shown on the right ("2 ways to pay"). */
  readonly value?: string | undefined;
  readonly icon?: ReactNode;
  /** Shows a dot when something here still needs the owner. */
  readonly unfinished?: boolean | undefined;
  /** Renders the row as a link or button (TanStack Link, <a>, <button>), via the render prop. */
  readonly render: (props: { className: string; children: ReactNode }) => ReactNode;
  readonly active?: boolean | undefined;
}

export interface SettingsListGroup {
  readonly id: string;
  readonly title: string;
  readonly rows: readonly SettingsListRow[];
}

/**
 * iOS-style grouped settings list (Phase 4 plan, section 6): rows at least 52 px, label on the
 * left, value on the right, a chevron, and the whole row as the target.
 */
export function SettingsList({
  groups,
  className,
}: {
  readonly groups: readonly SettingsListGroup[];
  readonly className?: string | undefined;
}) {
  return (
    <nav
      data-slot="settings-list"
      aria-label="Settings"
      className={cn('flex flex-col gap-6', className)}
    >
      {groups.map((group) => (
        <section
          key={group.id}
          aria-labelledby={`settings-group-${group.id}`}
          className="flex flex-col gap-2"
        >
          <h2
            id={`settings-group-${group.id}`}
            className="px-3 text-sm font-medium text-muted-foreground"
          >
            {group.title}
          </h2>
          <ul className="overflow-hidden rounded-lg border border-border bg-card">
            {group.rows.map((row) => (
              <li key={row.id} className="border-b border-border last:border-b-0">
                {row.render({
                  className: cn(
                    'flex min-h-13 w-full items-center gap-3 px-3 py-2 text-left outline-none transition-colors duration-fast',
                    'hover-hover:hover:bg-muted focus-visible:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset',
                    row.active && 'bg-primary-tint text-foreground',
                  ),
                  children: (
                    <>
                      {row.icon ? (
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground [&_svg]:size-4">
                          {row.icon}
                        </span>
                      ) : null}
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                        {row.label}
                      </span>
                      {row.unfinished ? (
                        <span className="flex items-center gap-1.5 text-xs text-warning">
                          <span aria-hidden="true" className="size-2 rounded-full bg-warning" />
                          <span className="sr-only">Not finished</span>
                        </span>
                      ) : null}
                      {row.value ? (
                        <span className="max-w-[45%] truncate text-sm text-muted-foreground">
                          {row.value}
                        </span>
                      ) : null}
                      <ChevronRightIcon
                        aria-hidden="true"
                        className="size-4 shrink-0 text-muted-foreground"
                      />
                    </>
                  ),
                })}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </nav>
  );
}
