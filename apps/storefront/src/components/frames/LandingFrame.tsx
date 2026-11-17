import { Separator } from '@smartapp/ui/components/separator';
import Link from 'next/link';
import type { ReactNode } from 'react';

export function LandingFrame({ children }: { readonly children: ReactNode }) {
  return (
    <div
      data-slot="landing-frame"
      className="flex min-h-dvh flex-col bg-background text-foreground"
    >
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex min-h-14 w-full max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 font-heading text-base font-semibold tracking-tight text-foreground"
          >
            <span
              aria-hidden="true"
              className="inline-flex size-8 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground"
            >
              SA
            </span>
            <span>Smart App PH</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">{children}</main>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex min-h-14 w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 text-xs text-muted-foreground sm:px-6">
          <span>Smart App PH · Stays &amp; Rentals</span>
          <Separator orientation="vertical" className="hidden h-4 sm:block" />
          <span>Powered by Smart App PH</span>
        </div>
      </footer>
    </div>
  );
}
