import type { PropertyView } from '@smartapp/core';
import { Clock3Icon, EyeIcon } from 'lucide-react';

import { formatWeeklyHoursSummary } from '../property-rules';

export interface TimesSectionProps {
  readonly property: PropertyView['property'];
}

/** Times (part 12): reply hours and viewing hours in plain words. */
export function TimesSection({ property }: TimesSectionProps) {
  const replySummary = formatWeeklyHoursSummary(property.reply_hours, 'reply');
  const viewingSummary = formatWeeklyHoursSummary(property.viewing_hours, 'viewing');

  return (
    <section aria-labelledby="times-heading" data-slot="times-section" className="space-y-4">
      <h2 id="times-heading" className="font-heading text-xl font-semibold tracking-tight">
        Times
      </h2>

      <div className="space-y-3 rounded-2xl border border-border bg-card p-5 text-sm text-card-foreground">
        {replySummary ? (
          <div className="flex items-start gap-3">
            <Clock3Icon
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-[var(--card-link,var(--property-10-text))]"
            />
            <p>{replySummary}</p>
          </div>
        ) : null}
        {viewingSummary ? (
          <div className="flex items-start gap-3 border-t border-border pt-3">
            <EyeIcon
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-[var(--card-link,var(--property-10-text))]"
            />
            <p>{viewingSummary}</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
