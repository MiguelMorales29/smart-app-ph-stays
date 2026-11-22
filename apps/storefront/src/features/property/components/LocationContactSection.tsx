import type { PropertyView } from '@smartapp/core';
import { Button } from '@smartapp/ui/components/button';
import {
  ExternalLinkIcon,
  GlobeIcon,
  MapPinIcon,
  MessageCircleIcon,
  PhoneIcon,
  StarIcon,
} from 'lucide-react';

import { formatAreaLabel, resolveContactLinks, type PropertyContactLink } from '../property-rules';

function contactIcon(kind: PropertyContactLink['kind']) {
  if (kind === 'phone') return PhoneIcon;
  if (kind === 'messenger' || kind === 'viber' || kind === 'whatsapp') return MessageCircleIcon;
  return GlobeIcon;
}

export interface LocationContactSectionProps {
  readonly property: PropertyView['property'];
}

/**
 * Location and contact (part 11): area only (never exact address, E7), conditional contact
 * buttons, and Google review link when set.
 */
export function LocationContactSection({ property }: LocationContactSectionProps) {
  const areaLabel = formatAreaLabel(property);
  const contactLinks = resolveContactLinks(property.contact);
  const googleReviewUrl = property.contact.google_review_url?.trim() || null;

  return (
    <section
      id="location"
      aria-labelledby="location-heading"
      data-slot="location-contact-section"
      className="scroll-mt-32 space-y-4 lg:scroll-mt-24"
    >
      <h2 id="location-heading" className="font-heading text-xl font-semibold tracking-tight">
        Location and contact
      </h2>

      <div className="space-y-4 rounded-2xl border border-border bg-card p-5 text-card-foreground">
        <div className="flex items-start gap-3">
          <MapPinIcon
            aria-hidden="true"
            className="mt-0.5 size-5 shrink-0 text-[var(--card-link,var(--property-10-text))]"
          />
          <div className="space-y-1">
            <p className="font-heading text-base font-semibold">{areaLabel}</p>
            <p className="text-sm text-muted-foreground">Exact address is shared after payment</p>
          </div>
        </div>

        {contactLinks.length > 0 ? (
          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            {contactLinks.map((item) => {
              const Icon = contactIcon(item.kind);
              return (
                <Button
                  key={item.kind}
                  variant="outline"
                  nativeButton={false}
                  render={
                    item.external ? (
                      <a href={item.href} target="_blank" rel="noopener noreferrer" />
                    ) : (
                      <a href={item.href} />
                    )
                  }
                  className="min-h-12 gap-2 px-4"
                >
                  <Icon aria-hidden="true" className="size-4" />
                  <span>{item.label}</span>
                  {item.external ? (
                    <ExternalLinkIcon aria-hidden="true" className="size-3.5 opacity-70" />
                  ) : null}
                </Button>
              );
            })}
          </div>
        ) : null}

        {googleReviewUrl ? (
          <div className="border-t border-border pt-3">
            <a
              href={googleReviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-[var(--card-link,var(--property-10-text))] underline underline-offset-4 hover:opacity-80"
            >
              <StarIcon aria-hidden="true" className="size-4" />
              <span>See reviews on Google</span>
              <ExternalLinkIcon aria-hidden="true" className="size-3.5" />
            </a>
          </div>
        ) : null}
      </div>
    </section>
  );
}
