'use client';

import { Button } from '@smartapp/ui/components/button';
import { Separator } from '@smartapp/ui/components/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@smartapp/ui/components/sheet';
import { openDevPanel } from '@smartapp/ui/lib/dev-panel';
import {
  CheckIcon,
  DownloadIcon,
  FlagIcon,
  FlaskConicalIcon,
  MenuIcon,
  SearchIcon,
  Share2Icon,
  ShieldCheckIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { InstallGuideSheet } from '@/features/install/InstallGuideSheet';
import { useInstallPlatform } from '@/features/install/install-store';

import { ReportPageSheet } from './ReportPageSheet';

export interface PropertyMenuSheetProps {
  readonly slug: string;
  readonly propertyId: string;
  readonly propertyName: string;
  readonly tagline: string | null;
  readonly logoSrc: string | null;
  readonly isPaused: boolean;
}

const MENU_ROW_CLASS =
  'press flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium text-foreground outline-none transition-colors duration-fast hover-hover:hover:bg-accent hover-hover:hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring';

/**
 * Property menu sheet (D79, D68):
 * Contains Share, Install, Find my booking, Privacy, Report this page, and the Preview switch
 * on sample/demo builds. Marks its trigger with `data-dev-panel-menu` on sample builds so the
 * floating Preview pill hides automatically (same rule as D68 in the dashboard).
 */
export function PropertyMenuSheet({
  slug,
  propertyId,
  propertyName,
  tagline,
  logoSrc,
  isPaused,
}: PropertyMenuSheetProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [installOpen, setInstallOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [shareState, setShareState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const installPlatform = useInstallPlatform();

  const previewSwitches =
    process.env.NEXT_PUBLIC_DATA_SOURCE === 'memory' &&
    process.env.NEXT_PUBLIC_APP_ENV !== 'production';

  useEffect(() => {
    if (shareState === 'idle') return;
    const timer = window.setTimeout(() => setShareState('idle'), 2400);
    return () => window.clearTimeout(timer);
  }, [shareState]);

  async function handleShare() {
    const url = window.location.href;
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: propertyName,
          ...(tagline ? { text: tagline } : {}),
          url,
        });
        setMenuOpen(false);
        return;
      } catch (caught: unknown) {
        if (caught instanceof DOMException && caught.name === 'AbortError') {
          return;
        }
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        setShareState('copied');
        return;
      } catch {
        // Fall through to failure notice.
      }
    }
    setShareState('failed');
  }

  return (
    <>
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Open property menu"
              data-dev-panel-menu={previewSwitches ? '' : undefined}
              className="min-h-11 min-w-11 shrink-0 rounded-full"
            />
          }
        >
          <MenuIcon aria-hidden="true" className="size-5" />
        </SheetTrigger>
        <SheetContent side="right" className="flex flex-col">
          <SheetHeader>
            <SheetTitle>{propertyName}</SheetTitle>
            <SheetDescription className="sr-only">
              Property links, share, install and help options.
            </SheetDescription>
          </SheetHeader>

          <nav aria-label="Property navigation" className="mt-4 flex flex-col gap-1 px-2">
            {!isPaused ? (
              <button type="button" onClick={() => void handleShare()} className={MENU_ROW_CLASS}>
                {shareState === 'copied' ? (
                  <CheckIcon aria-hidden="true" className="size-4 text-success" />
                ) : (
                  <Share2Icon aria-hidden="true" className="size-4 text-muted-foreground" />
                )}
                <span>{shareState === 'copied' ? 'Link copied' : 'Share this page'}</span>
              </button>
            ) : null}

            {!isPaused && installPlatform !== 'installed' ? (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setInstallOpen(true);
                }}
                className={MENU_ROW_CLASS}
              >
                <DownloadIcon aria-hidden="true" className="size-4 text-muted-foreground" />
                <span>Install app</span>
              </button>
            ) : null}

            <Link
              href={`/${slug}/find`}
              onClick={() => setMenuOpen(false)}
              className={MENU_ROW_CLASS}
            >
              <SearchIcon aria-hidden="true" className="size-4 text-muted-foreground" />
              <span>Find my booking</span>
            </Link>

            <Link
              href={`/${slug}/privacy`}
              onClick={() => setMenuOpen(false)}
              className={MENU_ROW_CLASS}
            >
              <ShieldCheckIcon aria-hidden="true" className="size-4 text-muted-foreground" />
              <span>Privacy</span>
            </Link>

            {!isPaused ? (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setReportOpen(true);
                }}
                className={MENU_ROW_CLASS}
              >
                <FlagIcon aria-hidden="true" className="size-4 text-muted-foreground" />
                <span>Report this page</span>
              </button>
            ) : null}

            {previewSwitches ? (
              <>
                <Separator className="my-2" />
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    openDevPanel();
                  }}
                  className={MENU_ROW_CLASS}
                >
                  <FlaskConicalIcon aria-hidden="true" className="size-4 text-warning" />
                  <span>Preview · sample data</span>
                </button>
              </>
            ) : null}
          </nav>

          <span role="status" aria-live="polite" className="sr-only">
            {shareState === 'copied'
              ? 'Link copied to clipboard.'
              : shareState === 'failed'
                ? 'Could not copy link. Copy the address from your browser bar.'
                : ''}
          </span>
        </SheetContent>
      </Sheet>

      <InstallGuideSheet
        open={installOpen}
        onOpenChange={setInstallOpen}
        slug={slug}
        propertyName={propertyName}
        logoSrc={logoSrc}
      />

      <ReportPageSheet
        open={reportOpen}
        onOpenChange={setReportOpen}
        propertyId={propertyId}
        propertyName={propertyName}
      />
    </>
  );
}
