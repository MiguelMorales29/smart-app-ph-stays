import type { PublicUnitCardView } from '@smartapp/core';
import { Button } from '@smartapp/ui/components/button';
import { EmptyState } from '@smartapp/ui/compositions/empty-state';
import { BedDoubleIcon, HomeIcon, MessageSquareIcon, UsersIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { normalizeMediaSrc } from '../media-src';
import {
  formatBedCount,
  formatGuestCount,
  formatUnitCardPrice,
  formatUnitType,
  groupUnitsByMode,
} from '../property-rules';

export interface UnitsSectionProps {
  readonly slug: string;
  readonly units: readonly PublicUnitCardView[];
}

function UnitCard({ slug, unit }: { readonly slug: string; readonly unit: PublicUnitCardView }) {
  const cover = unit.photos[0] ?? null;
  const priceText = formatUnitCardPrice(unit);

  return (
    <Link
      href={`/${slug}/units/${unit.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm transition-colors duration-fast outline-none focus-visible:ring-3 focus-visible:ring-ring hover-hover:hover:border-primary/40"
    >
      <div className="relative aspect-4/3 w-full overflow-hidden bg-muted">
        {cover ? (
          <Image
            src={normalizeMediaSrc(cover.url)}
            alt={cover.alt_text.trim() || unit.name}
            fill
            sizes="(min-width: 1280px) 320px, (min-width: 768px) 46vw, 100vw"
            className="object-cover transition-transform duration-base ease-enter hover-hover:group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <HomeIcon aria-hidden="true" className="size-8 opacity-50" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between gap-3 p-4">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">
            {formatUnitType(unit.unit_type)}
          </p>
          <h3 className="font-heading text-lg font-semibold leading-snug tracking-tight text-card-foreground">
            {unit.name}
          </h3>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <UsersIcon aria-hidden="true" className="size-3.5" />
              {formatGuestCount(unit.max_guests)}
            </span>
            <span className="inline-flex items-center gap-1">
              <BedDoubleIcon aria-hidden="true" className="size-3.5" />
              {formatBedCount(unit.beds)}
            </span>
          </div>
        </div>

        {priceText ? (
          <p className="font-heading text-base font-semibold text-[var(--card-link,var(--property-10-text))] tabular">
            {priceText}
          </p>
        ) : null}
      </div>
    </Link>
  );
}

function UnitGrid({
  slug,
  units,
}: {
  readonly slug: string;
  readonly units: readonly PublicUnitCardView[];
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {units.map((unit) => (
        <UnitCard key={unit.id} slug={slug} unit={unit} />
      ))}
    </div>
  );
}

/** Units section (part 8): featured first, grouped Stays & Monthly rentals when both exist, 1/2/3 columns. */
export function UnitsSection({ slug, units }: UnitsSectionProps) {
  if (units.length === 0) {
    return (
      <section
        id="units"
        aria-labelledby="units-heading"
        data-slot="units-section"
        className="space-y-4"
      >
        <h2 id="units-heading" className="font-heading text-xl font-semibold tracking-tight">
          Units
        </h2>
        <EmptyState
          icon={<HomeIcon aria-hidden="true" />}
          title="No units listed yet"
          description="Send the host a message if you want to ask about availability."
          action={
            <Button
              nativeButton={false}
              render={<Link href={`/${slug}/inquire`} />}
              className="min-h-12 gap-2 px-5"
            >
              <MessageSquareIcon aria-hidden="true" className="size-4" />
              Message
            </Button>
          }
        />
      </section>
    );
  }

  const grouped = groupUnitsByMode(units);

  return (
    <section
      id="units"
      aria-labelledby="units-heading"
      data-slot="units-section"
      className="scroll-mt-20 space-y-5"
    >
      <h2 id="units-heading" className="font-heading text-xl font-semibold tracking-tight">
        Units
      </h2>

      {grouped.grouped ? (
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="font-heading text-base font-semibold text-muted-foreground">Stays</h3>
            <UnitGrid slug={slug} units={grouped.stays} />
          </div>
          <div className="space-y-3">
            <h3 className="font-heading text-base font-semibold text-muted-foreground">
              Monthly rentals
            </h3>
            <UnitGrid slug={slug} units={grouped.rentals} />
          </div>
        </div>
      ) : (
        <UnitGrid slug={slug} units={grouped.units} />
      )}
    </section>
  );
}
