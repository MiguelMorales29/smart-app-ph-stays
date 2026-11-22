'use client';

import { Button } from '@smartapp/ui/components/button';
import { CalendarIcon, DownloadIcon, UserRoundIcon } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { InstallGuideSheet } from '@/features/install/InstallGuideSheet';
import { useInstallPlatform } from '@/features/install/install-store';

import type { UnitDisplayCard } from '../property-rules';
import { UnitChooserSheet } from './UnitChooserSheet';

export interface PropertyTopActionsProps {
  readonly slug: string;
  readonly propertyName: string;
  readonly logoSrc: string | null;
  readonly unitCards?: readonly UnitDisplayCard[] | undefined;
}

/**
 * Top-bar right actions (D79):
 * - Phone: Install (hidden when installed) + Your booking (person icon → `/<slug>/find`), alongside
 *   the Menu trigger so the phone bar holds at most three controls.
 * - Desktop (≥1024 px): Install + Your booking + filled "Check dates" button.
 */
export function PropertyTopActions({
  slug,
  propertyName,
  logoSrc,
  unitCards = [],
}: PropertyTopActionsProps) {
  const installPlatform = useInstallPlatform();
  const [installOpen, setInstallOpen] = useState(false);
  const [chooserOpen, setChooserOpen] = useState(false);

  const singleCard = unitCards.length === 1 ? unitCards[0] : null;
  const hasMultipleCards = unitCards.length > 1;

  return (
    <>
      <div className="flex shrink-0 items-center gap-1.5">
        {installPlatform !== 'installed' ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setInstallOpen(true)}
            aria-label={`Install ${propertyName} app`}
            className="min-h-11 min-w-11 gap-1.5 rounded-full px-2.5 sm:px-3.5"
          >
            <DownloadIcon aria-hidden="true" className="size-4" />
            <span className="hidden text-sm sm:inline">Install</span>
          </Button>
        ) : null}

        <Button
          variant="ghost"
          size="icon"
          nativeButton={false}
          render={<Link href={`/${slug}/find`} />}
          aria-label="Your booking"
          className="size-11 shrink-0 rounded-full"
        >
          <UserRoundIcon aria-hidden="true" className="size-5" />
        </Button>

        {singleCard ? (
          <Button
            size="sm"
            nativeButton={false}
            render={<Link href={`/${slug}/units/${singleCard.targetUnitSlug}`} />}
            className="hidden min-h-11 gap-1.5 rounded-full px-4 font-semibold lg:inline-flex"
          >
            <CalendarIcon aria-hidden="true" className="size-4" />
            Check dates
          </Button>
        ) : hasMultipleCards ? (
          <Button
            type="button"
            size="sm"
            onClick={() => setChooserOpen(true)}
            className="hidden min-h-11 gap-1.5 rounded-full px-4 font-semibold lg:inline-flex"
          >
            <CalendarIcon aria-hidden="true" className="size-4" />
            Check dates
          </Button>
        ) : null}
      </div>

      <InstallGuideSheet
        open={installOpen}
        onOpenChange={setInstallOpen}
        slug={slug}
        propertyName={propertyName}
        logoSrc={logoSrc}
      />

      {hasMultipleCards ? (
        <UnitChooserSheet
          open={chooserOpen}
          onOpenChange={setChooserOpen}
          slug={slug}
          propertyName={propertyName}
          cards={unitCards}
        />
      ) : null}
    </>
  );
}
