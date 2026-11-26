import type { PropertyView } from '@smartapp/core';
import { CalendarClockIcon, Clock3Icon, EyeIcon } from 'lucide-react';

import { formatSpecialDays, formatWeeklyHoursSummary } from '../property-rules';

export interface TimesSectionProps {
  readonly property: PropertyView['property'];
  /** Upcoming special days (R-2b): holidays, events, days off. */
  readonly specialDays?: PropertyView['special_days'] | undefined;
}

/** Times (part 12): reply hours, viewing hours and special days in plain words. */
export function TimesSection({ property, specialDays = [] }: TimesSectionProps) {
  const replySummary = formatWeeklyHoursSummary(property.reply_hours, 'reply');
  const viewingSummary = formatWeeklyHoursSummary(property.viewing_hours, 'viewing');
  const special = formatSpecialDays(specialDays);

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
        {special.length > 0 ? (
          <div className="flex items-start gap-3 border-t border-border pt-3">
            <CalendarClockIcon
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-[var(--card-link,var(--property-10-text))]"
            />
            <div className="min-w-0 flex-1 space-y-1.5">
              <p className="font-medium">Special days</p>
              <ul className="space-y-1">
                {special.map((day) => (
                  <li key={day.key} className="tabular">
                    <span className="font-medium">{day.when}</span>
                    <span className="text-muted-foreground"> · {day.what}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
