import { Badge } from '@smartapp/ui/components/badge';
import { BadgeCheckIcon, MapPinIcon } from 'lucide-react';

import type { StartingPrice } from '../property-rules';

export interface PropertyNameBlockProps {
  readonly name: string;
  readonly tagline: string | null;
  readonly areaLabel: string;
  readonly isVerified: boolean;
  readonly startingPrice: StartingPrice | null;
}

/** Property name block: name, tagline, town and province only (E7), Verified owner badge, starting price. */
export function PropertyNameBlock({
  name,
  tagline,
  areaLabel,
  isVerified,
  startingPrice,
}: PropertyNameBlockProps) {
  return (
    <section data-slot="property-name-block" className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {isVerified ? (
          <Badge
            variant="secondary"
            className="gap-1.5 rounded-full border border-success/25 bg-success-tint px-2.5 py-1 text-xs font-medium text-foreground"
          >
            <BadgeCheckIcon aria-hidden="true" className="size-3.5 text-success" />
            Verified owner
          </Badge>
        ) : null}
        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPinIcon aria-hidden="true" className="size-4 shrink-0" />
          <span>{areaLabel}</span>
        </span>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            {name}
          </h1>
          {tagline ? (
            <p className="text-base text-muted-foreground text-pretty">{tagline}</p>
          ) : null}
        </div>

        {startingPrice ? (
          <p className="shrink-0 font-heading text-lg font-semibold text-[var(--page-link,var(--property-10-text))] tabular sm:text-xl">
            {startingPrice.formatted}
          </p>
        ) : null}
      </div>
    </section>
  );
}
