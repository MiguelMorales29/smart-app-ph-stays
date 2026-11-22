'use client';

import { Button } from '@smartapp/ui/components/button';
import { CheckIcon, DownloadIcon, Share2Icon } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export interface PropertyTopActionsProps {
  readonly slug: string;
  readonly propertyName: string;
  readonly tagline: string | null;
}

/** Top-bar Share (Web Share API with copy-link fallback) and Install (`/install`) actions. */
export function PropertyTopActions({ slug, propertyName, tagline }: PropertyTopActionsProps) {
  const [shareState, setShareState] = useState<'idle' | 'copied' | 'failed'>('idle');

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
    <div className="flex shrink-0 items-center gap-1.5">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => void handleShare()}
        aria-label={shareState === 'copied' ? 'Link copied' : `Share ${propertyName}`}
        className="min-h-11 min-w-11 gap-1.5 px-2.5 sm:px-3"
      >
        {shareState === 'copied' ? (
          <CheckIcon aria-hidden="true" className="size-4 text-success" />
        ) : (
          <Share2Icon aria-hidden="true" className="size-4" />
        )}
        <span className="hidden text-sm sm:inline">
          {shareState === 'copied' ? 'Copied' : 'Share'}
        </span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        nativeButton={false}
        render={<Link href={`/${slug}/install`} />}
        aria-label={`Install ${propertyName} app`}
        className="min-h-11 min-w-11 gap-1.5 px-2.5 sm:px-3"
      >
        <DownloadIcon aria-hidden="true" className="size-4" />
        <span className="hidden text-sm sm:inline">Install</span>
      </Button>

      <span role="status" aria-live="polite" className="sr-only">
        {shareState === 'copied'
          ? 'Link copied to clipboard.'
          : shareState === 'failed'
            ? 'Could not copy link. Copy the address from your browser bar.'
            : ''}
      </span>
    </div>
  );
}
