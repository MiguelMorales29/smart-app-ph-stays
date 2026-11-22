'use client';

import type { ProfileAvatar } from '@smartapp/core';
import {
  CompareSlider,
  CompareSliderAfter,
  CompareSliderBefore,
  CompareSliderHandle,
} from '@smartapp/ui/components/compare-slider';
import { Masonry, MasonryItem } from '@smartapp/ui/components/masonry';
import { FacePicker } from '@smartapp/ui/compositions/face-picker';
import { PersonAvatar } from '@smartapp/ui/compositions/person-avatar';
import { useState } from 'react';

const GALLERY_SHOTS = [
  {
    src: '/demo-media/ulap-suites/photos/property-1-800.webp',
    alt: 'Ulap Suites terrace',
    aspect: 'aspect-[4/3]',
    label: 'Terrace',
  },
  {
    src: '/demo-media/ulap-suites/photos/studio-fog-1-800.webp',
    alt: 'Studio Fog bed',
    aspect: 'aspect-square',
    label: 'Studio Fog',
  },
  {
    src: '/demo-media/ulap-suites/photos/taal-view-1br-1-800.webp',
    alt: 'Taal View living area',
    aspect: 'aspect-[3/4]',
    label: 'Taal View 1BR',
  },
  {
    src: '/demo-media/ulap-suites/photos/property-2-800.webp',
    alt: 'Garden lounge',
    aspect: 'aspect-[4/3]',
    label: 'Garden',
  },
] as const;

/** Guest-facing UI-2 showcase rendered inside the active property theme on storefront `/kit`. */
export function StorefrontKitUi2Section() {
  const [guestAvatar, setGuestAvatar] = useState<ProfileAvatar>({
    kind: 'face',
    style: 'fun',
    face: 2,
    theme: 'mint',
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Masonry photo grid</p>
          <Masonry columnCount={2} gap={10} itemHeight={136} className="w-full">
            {GALLERY_SHOTS.map((shot) => (
              <MasonryItem key={shot.label}>
                <figure className="overflow-hidden rounded-xl border border-border bg-card">
                  <img
                    src={shot.src}
                    alt={shot.alt}
                    loading="lazy"
                    className={`w-full object-cover ${shot.aspect}`}
                  />
                  <figcaption className="px-2.5 py-1.5 text-xs text-muted-foreground">
                    {shot.label}
                  </figcaption>
                </figure>
              </MasonryItem>
            ))}
          </Masonry>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Before / after photo slider</p>
          <CompareSlider
            defaultValue={50}
            aria-label="Compare before and after property photo"
            className="h-56 w-full rounded-xl border border-border"
          >
            <CompareSliderBefore label="Morning">
              <img
                src="/demo-media/ulap-suites/photos/property-1-800.webp"
                alt="Property morning view"
                className="size-full object-cover saturate-75"
              />
            </CompareSliderBefore>
            <CompareSliderAfter label="Sunset">
              <img
                src="/demo-media/ulap-suites/photos/property-2-800.webp"
                alt="Property sunset view"
                className="size-full object-cover"
              />
            </CompareSliderAfter>
            <CompareSliderHandle />
          </CompareSlider>
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <PersonAvatar avatar={guestAvatar} name="Bea Santos" size="lg" />
          <div>
            <p className="font-heading text-sm font-semibold">Member picture picker</p>
            <p className="text-xs text-muted-foreground">
              Guests pick a static WebP face or customise it on their device.
            </p>
          </div>
        </div>
        <FacePicker value={guestAvatar} name="Bea Santos" onChange={setGuestAvatar} showCredit />
      </div>
    </div>
  );
}
