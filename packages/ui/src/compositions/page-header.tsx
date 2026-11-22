import { Badge } from '@smartapp/ui/components/badge';
import { Tabs, TabsList, TabsTrigger } from '@smartapp/ui/components/tabs';
import type { ReactNode } from 'react';

import { countLabel, type NavItem } from '../lib/nav';

export interface PageHeaderProps {
  readonly title: string;
  readonly actions?: ReactNode | undefined;
  /** Link-backed tabs where the URL decides which tab is active. */
  readonly tabs?: readonly NavItem[] | undefined;
  readonly tabsLabel?: string | undefined;
}

/**
 * Consistent page header for dashboard sections (ported from food app): keeps `h1` for screen
 * readers while the shell shows the breadcrumb/top-bar title, plus actions and link tabs.
 */
export function PageHeader({ title, actions, tabs, tabsLabel }: PageHeaderProps) {
  const activeTab = tabs?.find((tab) => tab.active)?.id ?? null;
  const hasTabs = tabs !== undefined && tabs.length > 0;

  if (!hasTabs && !actions) {
    return <h1 className="sr-only">{title}</h1>;
  }

  return (
    <header data-slot="page-header" className="flex flex-col gap-3">
      <h1 className="sr-only">{title}</h1>
      {actions ? (
        <div className="flex min-h-11 flex-wrap items-center justify-end gap-2">{actions}</div>
      ) : null}
      {hasTabs ? (
        <Tabs value={activeTab}>
          <TabsList
            variant="line"
            aria-label={tabsLabel ?? title}
            className="scrollbar-none w-full justify-start overflow-x-auto py-1 group-data-horizontal/tabs:h-auto"
          >
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                nativeButton={false}
                render={tab.link}
                aria-current={tab.active ? 'page' : undefined}
                className="h-11 flex-none px-3"
              >
                {tab.icon}
                {tab.label}
                {tab.count !== undefined && tab.count > 0 ? (
                  <Badge variant="secondary" className="tabular">
                    {countLabel(tab.count)}
                  </Badge>
                ) : null}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      ) : null}
    </header>
  );
}
