'use client';

import { Button } from '@smartapp/ui/components/button';
import {
  BadgeCheckIcon,
  CheckIcon,
  ExternalLinkIcon,
  MapPinIcon,
  Share2Icon,
  StarIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import type { StartingPrice } from '../property-rules';
import { VerifiedOwnerSheet } from './VerifiedOwnerSheet';

export interface PropertyNameBlockProps {
  readonly name: string;
  readonly tagline: string | null;
  readonly areaLabel: string;
  readonly isVerified: boolean;
  readonly startingPrice: StartingPrice | null;
  readonly googleReviewUrl: string | null;
}

/**
 * Property name block (D77, D79, D80):
 * - Tappable "Verified owner" badge opening `VerifiedOwnerSheet`.
 * - Town and province only (E7), plus "See reviews on Google" when set.
 * - Share button moved here from the phone top bar (D79).
 * - Starting price shown on phone/tablet and omitted on desktop (where the sticky booking card carries it, D80).
 */
export function PropertyNameBlock({
  name,
  tagline,
  areaLabel,
  isVerified,
  startingPrice,
  googleReviewUrl,
}: PropertyNameBlockProps) {
  const [verifiedOpen, setVerifiedOpen] = useState(false);
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
          title: name,
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
    <section data-slot="property-name-block" className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {isVerified ? (
          <button
            type="button"
            onClick={() => setVerifiedOpen(true)}
            aria-haspopup="dialog"
            className="press inline-flex min-h-9 items-center gap-1.5 rounded-full border border-success/25 bg-success-tint px-3 py-1 text-xs font-medium text-foreground outline-none transition-colors duration-fast hover-hover:hover:border-success/50 focus-visible:ring-3 focus-visible:ring-ring"
          >
            <BadgeCheckIcon aria-hidden="true" className="size-3.5 text-success" />
            Verified owner
          </button>
        ) : null}

        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPinIcon aria-hidden="true" className="size-4 shrink-0" />
          <span>{areaLabel}</span>
        </span>

        {googleReviewUrl ? (
          <a
            href={googleReviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-9 items-center gap-1.5 text-sm font-medium text-[var(--page-link,var(--property-10-text))] underline underline-offset-4 outline-none hover:opacity-80 focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring"
          >
            <StarIcon aria-hidden="true" className="size-3.5" />
            <span>See reviews on Google</span>
            <ExternalLinkIcon aria-hidden="true" className="size-3" />
          </a>
        ) : null}
      </div>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            {name}
          </h1>
          {tagline ? (
            <p className="text-base text-muted-foreground text-pretty">{tagline}</p>
          ) : null}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void handleShare()}
          aria-label={shareState === 'copied' ? 'Link copied' : `Share ${name}`}
          className="min-h-11 shrink-0 gap-1.5 rounded-full px-3.5"
        >
          {shareState === 'copied' ? (
            <CheckIcon aria-hidden="true" className="size-4 text-success" />
          ) : (
            <Share2Icon aria-hidden="true" className="size-4" />
          )}
          <span className="text-sm">{shareState === 'copied' ? 'Copied' : 'Share'}</span>
        </Button>
      </div>

      {/* Price sits under the name on phones & tablets; desktop moves it to the sticky booking card (D80). */}
      {startingPrice ? (
        <p className="font-heading text-lg font-semibold text-[var(--page-link,var(--property-10-text))] tabular sm:text-xl lg:hidden">
          {startingPrice.formatted}
        </p>
      ) : null}

      <span role="status" aria-live="polite" className="sr-only">
        {shareState === 'copied'
          ? 'Link copied to clipboard.'
          : shareState === 'failed'
            ? 'Could not copy link. Copy the address from your browser bar.'
            : ''}
      </span>

      <VerifiedOwnerSheet open={verifiedOpen} onOpenChange={setVerifiedOpen} propertyName={name} />
    </section>
  );
}
