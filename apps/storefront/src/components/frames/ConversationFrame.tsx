import type { PropertyView } from '@smartapp/core';
import { Avatar, AvatarFallback } from '@smartapp/ui/components/avatar';
import { Separator } from '@smartapp/ui/components/separator';
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

export function ConversationFrame({
  propertyView,
  children,
}: {
  readonly propertyView: PropertyView;
  readonly children: ReactNode;
}) {
  const { property, account } = propertyView;
  const basePath = `/${property.slug}`;

  return (
    <div
      data-slot="conversation-frame"
      className="flex min-h-dvh flex-col bg-background text-foreground"
    >
      <DemoBanner isDemo={account.is_demo} />

      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex min-h-14 w-full max-w-3xl items-center gap-3 px-4 sm:px-6">
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
        </div>
      </header>

      <main data-page-surface className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6">
        {account.is_paused ? <PausedPropertyContent propertyView={propertyView} /> : children}
      </main>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex min-h-14 w-full max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-2 text-xs text-muted-foreground sm:px-6">
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
