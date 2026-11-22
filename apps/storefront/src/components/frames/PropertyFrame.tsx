import type { PropertyView } from '@smartapp/core';
import { Separator } from '@smartapp/ui/components/separator';
import { cn } from '@smartapp/ui/lib/utils';
import { ShieldCheckIcon } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { InstallNudgeController } from '@/features/install/InstallNudgeController';
import { PropertyBrandLink } from '@/features/property/components/PropertyBrandLink';
import { PropertyDesktopNav } from '@/features/property/components/PropertyDesktopNav';
import { PropertyMenuSheet } from '@/features/property/components/PropertyMenuSheet';
import { PropertyTopActions } from '@/features/property/components/PropertyTopActions';
import { normalizeMediaSrc } from '@/features/property/media-src';
import type { PropertySectionNavItem, UnitDisplayCard } from '@/features/property/property-rules';

import { DemoBanner } from '../DemoBanner';
import { PausedPropertyContent } from './PausedPropertyContent';

export interface PropertyFrameProps {
  readonly propertyView: PropertyView;
  readonly children: ReactNode;
  readonly navItems?: readonly PropertySectionNavItem[] | undefined;
  readonly unitCards?: readonly UnitDisplayCard[] | undefined;
  readonly actionBar?: ReactNode;
  readonly actionBarClassName?: string | undefined;
}

export function PropertyFrame({
  propertyView,
  children,
  navItems,
  unitCards,
  actionBar,
  actionBarClassName,
}: PropertyFrameProps) {
  const { property, account, page_media } = propertyView;
  const basePath = `/${property.slug}`;
  const isPaused = account.is_paused;
  const logoSrc = page_media.logo ? normalizeMediaSrc(page_media.logo.url) : null;

  return (
    <div
      data-slot="property-frame"
      className="flex min-h-dvh flex-col bg-background font-sans text-foreground"
    >
      <DemoBanner isDemo={account.is_demo} />

      <header className="sticky top-0 z-30 border-b border-border bg-card/95 pt-safe backdrop-blur">
        <div className="mx-auto flex min-h-14 w-full max-w-6xl items-center justify-between gap-2 px-4 sm:gap-3 sm:px-6">
          <div className="min-w-0 flex-1 lg:flex-none">
            <PropertyBrandLink
              slug={property.slug}
              propertyName={property.name}
              logoSrc={logoSrc}
            />
          </div>

          {!isPaused && navItems && navItems.length > 0 ? (
            <PropertyDesktopNav items={navItems} />
          ) : null}

          <div className="flex shrink-0 items-center gap-1.5">
            {!isPaused ? (
              <PropertyTopActions
                slug={property.slug}
                propertyName={property.name}
                logoSrc={logoSrc}
                contact={property.contact}
                replyHours={property.reply_hours}
                unitCards={unitCards}
              />
            ) : null}

            <PropertyMenuSheet
              slug={property.slug}
              propertyId={property.id}
              propertyName={property.name}
              tagline={property.tagline}
              logoSrc={logoSrc}
              isPaused={isPaused}
            />
          </div>
        </div>
      </header>

      <main data-page-surface className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        {isPaused ? <PausedPropertyContent propertyView={propertyView} /> : children}
      </main>

      {!isPaused && actionBar ? (
        <div
          data-slot="property-action-bar"
          className={cn(
            'sticky bottom-0 z-20 border-t border-border bg-card/95 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] backdrop-blur sm:px-6',
            actionBarClassName,
          )}
        >
          <div className="mx-auto w-full max-w-6xl">{actionBar}</div>
        </div>
      ) : null}

      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-2 px-4 py-6 text-center text-xs text-muted-foreground sm:flex-row sm:justify-between sm:px-6 sm:py-4 sm:text-left">
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 sm:justify-start">
            <Link
              href={`${basePath}/privacy`}
              className="inline-flex min-h-11 items-center gap-1.5 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              <ShieldCheckIcon aria-hidden="true" className="size-4" />
              Privacy
            </Link>
            {account.is_demo ? (
              <>
                <Separator orientation="vertical" className="hidden h-4 sm:block" />
                <span className="font-medium text-foreground">Demo · not a real property</span>
              </>
            ) : null}
          </div>
          <span>Made with Smart App PH</span>
        </div>
      </footer>

      {!isPaused ? (
        <InstallNudgeController
          slug={property.slug}
          propertyName={property.name}
          logoSrc={logoSrc}
        />
      ) : null}
    </div>
  );
}
