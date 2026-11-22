'use client';

import { shortAppName } from '@smartapp/core';
import { cn } from '@smartapp/ui/lib/utils';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BookmarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  EllipsisIcon,
  LockIcon,
  ShareIcon,
  SquarePlusIcon,
} from 'lucide-react';
import Image from 'next/image';

function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words[0]?.[0] ?? 'P';
  const second = words[1]?.[0] ?? '';
  return `${first}${second}`.toUpperCase();
}

export interface SafariStepDrawingProps {
  readonly addressBarAtTop: boolean;
  readonly propertyName: string;
  readonly slug: string;
  readonly logoSrc: string | null;
}

/** Step 1 drawing: Safari's bottom or top bar with the ⋯ button circled and a CSS-only pulsing arrow. */
export function SafariStep1Drawing({ addressBarAtTop, slug }: SafariStepDrawingProps) {
  const bar = (
    <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-2.5 py-2 shadow-sm">
      <ChevronLeftIcon aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground/60" />
      <ChevronRightIcon aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground/40" />
      <div className="flex min-w-0 flex-1 items-center justify-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">
        <LockIcon aria-hidden="true" className="size-3 shrink-0" />
        <span className="truncate">smartapp.webserbisyo.com/{slug}</span>
      </div>
      <span
        className="flex size-7 shrink-0 items-center justify-center rounded-full bg-property-10-soft text-property-10-soft-foreground ring-2 ring-primary"
        aria-hidden="true"
      >
        <EllipsisIcon className="size-4" />
      </span>
    </div>
  );

  return (
    <div
      aria-hidden="true"
      data-slot="safari-step-1-drawing"
      data-bar-position={addressBarAtTop ? 'top' : 'bottom'}
      className="rounded-xl border border-border bg-muted/60 p-3"
    >
      {addressBarAtTop ? (
        <div className="space-y-2">
          {bar}
          <div className="flex items-center justify-end pr-1.5">
            <span className="install-arrow-pulse inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground shadow-sm">
              <ArrowUpIcon className="size-3.5" />
              Tap ⋯ here
            </span>
          </div>
          <div className="h-6 rounded-lg border border-dashed border-border/80 bg-background/60" />
        </div>
      ) : (
        <div className="space-y-2">
          <div className="h-6 rounded-lg border border-dashed border-border/80 bg-background/60" />
          <div className="flex items-center justify-end pr-1.5">
            <span className="install-arrow-pulse inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground shadow-sm">
              Tap ⋯ here
              <ArrowDownIcon className="size-3.5" />
            </span>
          </div>
          {bar}
        </div>
      )}
    </div>
  );
}

/** Step 2 drawing: Safari's ⋯ menu with Share highlighted. */
export function SafariStep2Drawing() {
  return (
    <div
      aria-hidden="true"
      data-slot="safari-step-2-drawing"
      className="flex justify-end rounded-xl border border-border bg-muted/60 p-3"
    >
      <div className="w-52 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between bg-property-10-soft px-3 py-2 text-xs font-semibold text-property-10-soft-foreground ring-1 ring-primary ring-inset">
          <span>Share</span>
          <ShareIcon className="size-3.5" />
        </div>
        <div className="flex items-center justify-between px-3 py-2 text-xs text-muted-foreground">
          <span>Add Bookmark</span>
          <BookmarkIcon className="size-3.5" />
        </div>
        <div className="flex items-center justify-between px-3 py-2 text-xs text-muted-foreground">
          <span>Copy</span>
          <CopyIcon className="size-3.5" />
        </div>
      </div>
    </div>
  );
}

/** Step 3 drawing: iOS Share sheet list with Add to Home Screen highlighted. */
export function SafariStep3Drawing() {
  return (
    <div
      aria-hidden="true"
      data-slot="safari-step-3-drawing"
      className="rounded-xl border border-border bg-muted/60 p-3"
    >
      <div className="mx-auto max-w-xs divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between px-3 py-2 text-xs text-muted-foreground">
          <span>Copy</span>
          <CopyIcon className="size-3.5" />
        </div>
        <div className="flex items-center justify-between bg-property-10-soft px-3 py-2.5 text-xs font-semibold text-property-10-soft-foreground ring-1 ring-primary ring-inset">
          <span>Add to Home Screen</span>
          <SquarePlusIcon className="size-4" />
        </div>
        <div className="flex items-center justify-between px-3 py-2 text-xs text-muted-foreground">
          <span>Add to Reading List</span>
          <BookmarkIcon className="size-3.5" />
        </div>
      </div>
    </div>
  );
}

/** Step 4 drawing: Add to Home Screen screen with Open as Web App ON and the property's icon & name. */
export function SafariStep4Drawing({ propertyName, slug, logoSrc }: SafariStepDrawingProps) {
  const homeName = shortAppName(propertyName);
  return (
    <div
      aria-hidden="true"
      data-slot="safari-step-4-drawing"
      className="rounded-xl border border-border bg-muted/60 p-3"
    >
      <div className="mx-auto max-w-xs space-y-2.5 rounded-xl border border-border bg-card p-3 shadow-sm">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Cancel</span>
          <span className="font-semibold text-foreground">Add to Home Screen</span>
          <span className="rounded-full bg-primary px-2.5 py-0.5 font-semibold text-primary-foreground">
            Add
          </span>
        </div>

        <div className="flex items-center gap-2.5 rounded-lg border border-border bg-background p-2">
          <span className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary text-xs font-bold text-primary-foreground">
            {logoSrc ? (
              <Image src={logoSrc} alt="" fill sizes="40px" className="object-cover" />
            ) : (
              initialsOf(propertyName)
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-foreground">{homeName}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              smartapp.webserbisyo.com/{slug}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border bg-background px-2.5 py-2">
          <span className="text-xs font-medium text-foreground">Open as Web App</span>
          <span
            className={cn('flex h-5 w-9 items-center justify-end rounded-full bg-success px-0.5')}
          >
            <span className="size-4 rounded-full bg-card shadow-xs" />
          </span>
        </div>
      </div>
    </div>
  );
}

/** Floating CSS-only pulsing arrow anchored near the real Safari ⋯ position on phones (D82). */
export function SafariRealCornerPointer({
  addressBarAtTop,
}: {
  readonly addressBarAtTop: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      data-slot="safari-corner-pointer"
      className={cn(
        'pointer-events-none fixed right-4 z-50 flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-lg md:hidden',
        'install-arrow-pulse',
        addressBarAtTop
          ? 'top-[calc(env(safe-area-inset-top,0px)+0.5rem)]'
          : 'bottom-[calc(env(safe-area-inset-bottom,0px)+0.5rem)]',
      )}
    >
      {addressBarAtTop ? (
        <>
          <ArrowUpIcon className="size-4" />
          <span>⋯ is up here</span>
        </>
      ) : (
        <>
          <span>⋯ is down here</span>
          <ArrowDownIcon className="size-4" />
        </>
      )}
    </div>
  );
}
