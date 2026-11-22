import type { PublicAmenityView } from '@smartapp/core';
import { amenityIcon } from '@smartapp/ui/lib/amenity-icons';

export interface HighlightsSectionProps {
  readonly highlights: readonly PublicAmenityView[];
}

/** Highlights (part 9): up to 6 chosen amenities with icons in one wrapping row. */
export function HighlightsSection({ highlights }: HighlightsSectionProps) {
  if (highlights.length === 0) return null;

  return (
    <section
      aria-labelledby="highlights-heading"
      data-slot="highlights-section"
      className="space-y-3"
    >
      <h2 id="highlights-heading" className="font-heading text-xl font-semibold tracking-tight">
        Highlights
      </h2>
      <ul className="flex flex-wrap gap-2">
        {highlights.map((amenity) => {
          const Icon = amenityIcon(amenity.icon);
          return (
            <li
              key={amenity.id}
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 text-sm font-medium text-card-foreground"
            >
              <Icon
                aria-hidden="true"
                className="size-4 shrink-0 text-[var(--card-link,var(--property-10-text))]"
              />
              <span>{amenity.label}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
