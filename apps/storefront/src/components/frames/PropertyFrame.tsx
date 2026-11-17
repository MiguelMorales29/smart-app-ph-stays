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
import { MenuIcon } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

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
}

export function PropertyFrame({ propertyView, children, actionBar }: PropertyFrameProps) {
  const { property, account } = propertyView;
  const basePath = `/${property.slug}`;
  const isPaused = account.is_paused;

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
      className="flex min-h-dvh flex-col bg-background text-foreground"
    >
      <DemoBanner isDemo={account.is_demo} />

      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex min-h-14 w-full max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link
            href={basePath}
            className="flex min-h-11 min-w-0 items-center gap-3 font-heading text-base font-semibold tracking-tight text-foreground"
          >
            <Avatar className="size-9 shrink-0" style={{ borderRadius: 'var(--logo-radius)' }}>
              <AvatarFallback
                className="bg-primary text-xs font-bold text-primary-foreground"
                style={{ borderRadius: 'var(--logo-radius)' }}
              >
                {initialsOf(property.name)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate">{property.name}</span>
          </Link>

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
              <MenuIcon className="size-5" />
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
      </header>

      <main data-page-surface className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">
        {isPaused ? <PausedPropertyContent propertyView={propertyView} /> : children}
      </main>

      {!isPaused ? (
        <div
          data-slot="property-action-bar"
          className={
            actionBar
              ? 'sticky bottom-0 z-20 border-t border-border bg-card/95 px-4 py-3 backdrop-blur sm:px-6'
              : 'sticky bottom-0 z-20'
          }
        >
          {actionBar ? <div className="mx-auto w-full max-w-5xl">{actionBar}</div> : null}
        </div>
      ) : null}

      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex min-h-14 w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-2 text-xs text-muted-foreground sm:px-6">
          <Link
            href={`${basePath}/privacy`}
            className="inline-flex min-h-11 items-center underline underline-offset-4 hover:text-foreground"
          >
            Privacy
          </Link>
          <Separator orientation="vertical" className="hidden h-4 sm:block" />
          <span>Powered by Smart App PH</span>
        </div>
      </footer>
    </div>
  );
}
