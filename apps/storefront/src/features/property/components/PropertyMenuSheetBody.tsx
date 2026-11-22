'use client';

import { Separator } from '@smartapp/ui/components/separator';
import { copyText } from '@smartapp/ui/lib/copy-text';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@smartapp/ui/components/sheet';
import { openDevPanel } from '@smartapp/ui/lib/dev-panel';
import {
  CheckIcon,
  DownloadIcon,
  FlagIcon,
  FlaskConicalIcon,
  SearchIcon,
  Share2Icon,
  ShieldCheckIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useInstallPlatform } from '@/features/install/install-store';

import { LazyInstallGuideSheet, LazyReportPageSheet } from './LazySheets';

export interface PropertyMenuSheetBodyProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly slug: string;
  readonly propertyId: string;
  readonly propertyName: string;
  readonly tagline: string | null;
  readonly logoSrc: string | null;
  readonly isPaused: boolean;
  readonly previewSwitches: boolean;
}

const MENU_ROW_CLASS =
  'press flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium text-foreground outline-none transition-colors duration-fast hover-hover:hover:bg-accent hover-hover:hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring';

/** Lazy-loaded body of the property menu sheet (keeps Sheet + Base UI Dialog out of first paint). */
export function PropertyMenuSheetBody({
  open,
  onOpenChange,
  slug,
  propertyId,
  propertyName,
  tagline,
  logoSrc,
  isPaused,
  previewSwitches,
}: PropertyMenuSheetBodyProps) {
  const [installOpen, setInstallOpen] = useState(false);
  const [installMounted, setInstallMounted] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportMounted, setReportMounted] = useState(false);
  const [shareState, setShareState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const installPlatform = useInstallPlatform();

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
        onOpenChange(false);
        return;
      } catch (caught: unknown) {
        if (caught instanceof DOMException && caught.name === 'AbortError') {
          return;
        }
      }
    }

    const copied = await copyText(url);
    setShareState(copied ? 'copied' : 'failed');
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
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
                  onOpenChange(false);
                  setInstallMounted(true);
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
              onClick={() => onOpenChange(false)}
              className={MENU_ROW_CLASS}
            >
              <SearchIcon aria-hidden="true" className="size-4 text-muted-foreground" />
              <span>Find my booking</span>
            </Link>

            <Link
              href={`/${slug}/privacy`}
              onClick={() => onOpenChange(false)}
              className={MENU_ROW_CLASS}
            >
              <ShieldCheckIcon aria-hidden="true" className="size-4 text-muted-foreground" />
              <span>Privacy</span>
            </Link>

            {!isPaused ? (
              <button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  setReportMounted(true);
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
                    onOpenChange(false);
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

      {installMounted ? (
        <LazyInstallGuideSheet
          open={installOpen}
          onOpenChange={setInstallOpen}
          slug={slug}
          propertyName={propertyName}
          logoSrc={logoSrc}
        />
      ) : null}

      {reportMounted ? (
        <LazyReportPageSheet
          open={reportOpen}
          onOpenChange={setReportOpen}
          propertyId={propertyId}
          propertyName={propertyName}
        />
      ) : null}
    </>
  );
}
