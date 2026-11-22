'use client';

import type { PublicHostView } from '@smartapp/core';
import { Avatar, AvatarFallback } from '@smartapp/ui/components/avatar';
import { Button } from '@smartapp/ui/components/button';
import { cn } from '@smartapp/ui/lib/utils';
import { BadgeCheckIcon, Clock3Icon, GlobeIcon } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

import { normalizeMediaSrc } from '../media-src';

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? 'H';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return `${first}${last}`.toUpperCase();
}

export interface AboutHostSectionProps {
  readonly about: string | null;
  readonly host: PublicHostView;
  readonly isVerified: boolean;
}

/**
 * About and host (part 7): about text clamped to 6 lines with "Read more", plus host card with
 * photo, name, languages, "Hosting since <year>" and worked-out reply time (decision E9).
 */
export function AboutHostSection({ about, host, isVerified }: AboutHostSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const trimmedAbout = about?.trim() ?? '';
  const shouldOfferExpand = trimmedAbout.length > 260 || trimmedAbout.split('\n').length > 5;
  const hostPhotoUrl = host.photo ? normalizeMediaSrc(host.photo.url) : null;

  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      data-slot="about-host-section"
      className="scroll-mt-32 space-y-4 lg:scroll-mt-24"
    >
      <h2 id="about-heading" className="font-heading text-xl font-semibold tracking-tight">
        About this place
      </h2>

      <div className="grid gap-4 lg:grid-cols-5">
        {trimmedAbout ? (
          <div className="space-y-2 rounded-2xl border border-border bg-card p-5 text-card-foreground lg:col-span-3">
            <p
              className={cn(
                'text-sm leading-relaxed whitespace-pre-line text-card-foreground sm:text-base',
                !expanded && 'line-clamp-6',
              )}
            >
              {trimmedAbout}
            </p>
            {shouldOfferExpand ? (
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={() => setExpanded((prev) => !prev)}
                aria-expanded={expanded}
                className="min-h-11 px-0 font-semibold text-[var(--card-link,var(--property-10-text))]"
              >
                {expanded ? 'Show less' : 'Read more'}
              </Button>
            ) : null}
          </div>
        ) : null}

        <div
          className={cn(
            'flex flex-col justify-between gap-4 rounded-2xl border border-border bg-card p-5 text-card-foreground',
            trimmedAbout ? 'lg:col-span-2' : 'lg:col-span-5',
          )}
        >
          <div className="flex items-center gap-3.5">
            {hostPhotoUrl ? (
              <span className="relative size-14 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
                <Image
                  src={hostPhotoUrl}
                  alt={host.photo?.alt || host.display_name}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              </span>
            ) : (
              <Avatar className="size-14 shrink-0">
                <AvatarFallback className="bg-property-10-soft font-heading text-base font-semibold text-property-10-soft-foreground">
                  {initialsOf(host.display_name)}
                </AvatarFallback>
              </Avatar>
            )}

            <div className="min-w-0 space-y-0.5">
              <p className="text-xs font-medium text-muted-foreground">Hosted by</p>
              <div className="flex items-center gap-1.5">
                <h3 className="truncate font-heading text-base font-semibold">
                  {host.display_name}
                </h3>
                {isVerified ? (
                  <BadgeCheckIcon
                    aria-label="Verified owner"
                    className="size-4 shrink-0 text-success"
                  />
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground tabular">
                Hosting since {host.hosting_since}
              </p>
            </div>
          </div>

          <dl className="space-y-2 border-t border-border pt-3 text-sm">
            <div className="flex items-start gap-2">
              <Clock3Icon
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              />
              <dd className="text-card-foreground">{host.reply_time}</dd>
            </div>
            {host.languages.length > 0 ? (
              <div className="flex items-start gap-2">
                <GlobeIcon
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                />
                <dd className="text-muted-foreground">Speaks {host.languages.join(', ')}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      </div>
    </section>
  );
}
