import type { PropertyView } from '@smartapp/core';
import { CalendarX2Icon, ClockIcon, IdCardIcon, ListChecksIcon } from 'lucide-react';

import { formatWallTime12h, guestCancellationCopy } from '../property-rules';

export interface RulesSectionProps {
  readonly property: PropertyView['property'];
  readonly houseRules: PropertyView['house_rules'];
}

/**
 * Rules and policies (part 10): check-in/out times, plain-word cancellation preset, house rules,
 * and guest ID requirement when enabled.
 */
export function RulesSection({ property, houseRules }: RulesSectionProps) {
  const cancellation = guestCancellationCopy(property);

  return (
    <section aria-labelledby="rules-heading" data-slot="rules-section" className="space-y-4">
      <h2 id="rules-heading" className="font-heading text-xl font-semibold tracking-tight">
        Rules and policies
      </h2>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-border bg-card p-5 text-card-foreground">
          <div className="flex items-start gap-3">
            <ClockIcon
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-[var(--card-link,var(--property-10-text))]"
            />
            <div className="space-y-1 text-sm">
              <p className="font-semibold">Check-in and check-out</p>
              <p className="text-muted-foreground tabular">
                Check-in from {formatWallTime12h(property.checkin_time)} · Check-out by{' '}
                {formatWallTime12h(property.checkout_time)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 border-t border-border pt-4">
            <CalendarX2Icon
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-[var(--card-link,var(--property-10-text))]"
            />
            <div className="space-y-1 text-sm">
              <p className="font-semibold">Cancellation · {cancellation.label}</p>
              <p className="text-muted-foreground">{cancellation.summary}</p>
            </div>
          </div>

          {property.guest_ids_required ? (
            <div className="flex items-start gap-3 border-t border-border pt-4">
              <IdCardIcon
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-[var(--card-link,var(--property-10-text))]"
              />
              <div className="space-y-1 text-sm">
                <p className="font-semibold">IDs are asked before arrival</p>
                <p className="text-muted-foreground">
                  Send your guest list and valid IDs at least {property.guest_list_due_hours} hours
                  before check-in.
                </p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-3 rounded-2xl border border-border bg-card p-5 text-card-foreground">
          <div className="flex items-center gap-2">
            <ListChecksIcon
              aria-hidden="true"
              className="size-4 shrink-0 text-[var(--card-link,var(--property-10-text))]"
            />
            <h3 className="font-heading text-base font-semibold">House rules</h3>
          </div>
          {houseRules.length > 0 ? (
            <ul className="space-y-2 text-sm text-muted-foreground">
              {houseRules.map((rule) => (
                <li key={rule.id} className="flex items-start gap-2.5">
                  <span
                    aria-hidden="true"
                    className="mt-2 size-1.5 shrink-0 rounded-full bg-muted-foreground/60"
                  />
                  <span>{rule.body}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Follow standard building rules and keep noise low at night.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
