'use client';

import { Button } from '@smartapp/ui/components/button';
import { AppSheet } from '@smartapp/ui/compositions/app-sheet';
import { ChevronRightIcon, HomeIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { normalizeMediaSrc } from '../media-src';
import type { UnitChooserOption } from '../property-rules';

export interface UnitChooserSheetProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly slug: string;
  readonly propertyName: string;
  readonly cards: readonly UnitChooserOption[];
}

/**
 * Unit chooser sheet (D80): opens from desktop "Check dates" when a property has multiple units
 * or rooms, sending the guest straight to that unit's date picker page.
 */
export function UnitChooserSheet({
  open,
  onOpenChange,
  slug,
  propertyName,
  cards,
}: UnitChooserSheetProps) {
  return (
    <AppSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Choose a unit"
      description={`Pick a room or unit at ${propertyName} to check dates.`}
      height="half"
      size="md"
      footer={
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          className="min-h-12"
        >
          Close
        </Button>
      }
    >
      <div className="flex flex-col gap-2.5 py-1">
        {cards.map((card) => (
          <Link
            key={card.id}
            href={`/${slug}/units/${card.targetUnitSlug}`}
            onClick={() => onOpenChange(false)}
            className="press flex min-h-16 items-center gap-3 rounded-xl border border-border bg-card p-2.5 text-card-foreground outline-none transition-colors duration-fast hover-hover:hover:border-primary/40 hover-hover:hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring"
          >
            <span className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
              {card.coverUrl ? (
                <Image
                  src={normalizeMediaSrc(card.coverUrl)}
                  alt={card.coverAlt}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              ) : (
                <HomeIcon aria-hidden="true" className="size-5 text-muted-foreground" />
              )}
            </span>
            <span className="min-w-0 flex-1 space-y-0.5">
              <span className="block truncate font-heading text-sm font-semibold text-foreground">
                {card.title}
              </span>
              <span className="block truncate text-xs text-muted-foreground">{card.factsLine}</span>
              {card.priceText ? (
                <span className="block text-sm font-semibold text-[var(--card-link,var(--property-10-text))] tabular">
                  {card.priceText}
                </span>
              ) : null}
            </span>
            <ChevronRightIcon
              aria-hidden="true"
              className="size-4 shrink-0 text-muted-foreground"
            />
          </Link>
        ))}
      </div>
    </AppSheet>
  );
}
