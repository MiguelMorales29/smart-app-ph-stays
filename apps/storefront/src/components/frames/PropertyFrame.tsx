import type { PropertyView } from '@smartapp/core';
import { Avatar, AvatarFallback } from '@smartapp/ui/components/avatar';
import { Button } from '@smartapp/ui/components/button';
import { Separator } from '@smartapp/ui/components/separator';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@smartapp/ui/components/sheet';
import { cn } from '@smartapp/ui/lib/utils';
import { MenuIcon, ShieldCheckIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { PropertyTopActions } from '@/features/property/components/PropertyTopActions';
import { normalizeMediaSrc } from '@/features/property/media-src';

import { DemoBanner } from '../DemoBanner';
import { PausedPropertyContent } from './PausedPropertyContent';

function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words[0]?.[0] ?? 'P';
  const second = words[1]?.[0] ?? '';
  return `${first}${second}`.toUpperCase();
}

export interface PropertyFrameProps {
  readonly propertyView: PropertyView;
  readonly children: ReactNode;
  readonly actionBar?: ReactNode;
  readonly actionBarClassName?: string | undefined;
}

export function PropertyFrame({
  propertyView,
  children,
  actionBar,
  actionBarClassName,
}: PropertyFrameProps) {
  const { property, account, page_media } = propertyView;
  const basePath = `/${property.slug}`;
  const isPaused = account.is_paused;
  const logoSrc = page_media.logo ? normalizeMediaSrc(page_media.logo.url) : null;

  const menuLinks: readonly { readonly href: string; readonly label: string }[] = [
    { href: basePath, label: 'Property home' },
    { href: `${basePath}/find`, label: 'Find my booking' },
    { href: `${basePath}/join`, label: 'Join as member' },
    { href: `${basePath}/account`, label: 'My account' },
    { href: `${basePath}/install`, label: 'Install app' },
    { href: `${basePath}/privacy`, label: 'Privacy' },
  ];

  return (
    <div
      data-slot="property-frame"
      className="flex min-h-dvh flex-col bg-background font-sans text-foreground"
    >
      <DemoBanner isDemo={account.is_demo} />

      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex min-h-14 w-full max-w-5xl items-center justify-between gap-2 px-4 sm:gap-3 sm:px-6">
          <Link
            href={basePath}
            className="flex min-h-11 min-w-0 items-center gap-2.5 font-heading text-base font-semibold tracking-tight text-foreground sm:gap-3"
          >
            {logoSrc ? (
              <span
                className="relative size-9 shrink-0 overflow-hidden border border-border/60 bg-card"
                style={{ borderRadius: 'var(--logo-radius)' }}
              >
                <Image src={logoSrc} alt="" fill sizes="36px" className="object-cover" />
              </span>
            ) : (
              <Avatar className="size-9 shrink-0" style={{ borderRadius: 'var(--logo-radius)' }}>
                <AvatarFallback
                  className="bg-primary text-xs font-bold text-primary-foreground"
                  style={{ borderRadius: 'var(--logo-radius)' }}
                >
                  {initialsOf(property.name)}
                </AvatarFallback>
              </Avatar>
            )}
            <span className="truncate">{property.name}</span>
          </Link>

          <div className="flex shrink-0 items-center gap-1.5">
            {!isPaused ? (
              <PropertyTopActions
                slug={property.slug}
                propertyName={property.name}
                tagline={property.tagline}
              />
            ) : null}

            <Sheet>
              <SheetTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Open property menu"
                    className="min-h-11 min-w-11 shrink-0"
                  />
                }
              >
                <MenuIcon aria-hidden="true" className="size-5" />
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>{property.name}</SheetTitle>
                </SheetHeader>
                <nav aria-label="Property navigation" className="mt-4 flex flex-col gap-1 px-2">
                  {menuLinks.map((item) => (
                    <SheetClose
                      key={item.href}
                      nativeButton={false}
                      render={
                        <Link
                          href={item.href}
                          className="flex min-h-11 items-center rounded-md px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                        />
                      }
                    >
                      {item.label}
                    </SheetClose>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main data-page-surface className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">
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
          <div className="mx-auto w-full max-w-5xl">{actionBar}</div>
        </div>
      ) : null}

      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-2 px-4 py-6 text-center text-xs text-muted-foreground sm:flex-row sm:justify-between sm:px-6 sm:py-4 sm:text-left">
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
    </div>
  );
}
