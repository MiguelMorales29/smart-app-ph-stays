import { ColorSwatch } from '@smartapp/ui/components/color-swatch';
import {
  CompareSlider,
  CompareSliderAfter,
  CompareSliderBefore,
  CompareSliderHandle,
} from '@smartapp/ui/components/compare-slider';
import { Masonry, MasonryItem } from '@smartapp/ui/components/masonry';

import { DualSurfaceShowcase } from './kit-base-tab';

const SWATCH_PALETTE = [
  { name: 'Smart Blue', value: '#2866EE' }, // brand-guard-ignore: demo swatch data
  { name: 'Tagaytay Pine', value: '#1E5631' }, // brand-guard-ignore: demo swatch data
  { name: 'Sunset Clay', value: '#C85A32' }, // brand-guard-ignore: demo swatch data
  { name: 'Translucent Blue', value: 'rgba(40, 102, 238, 0.5)' }, // brand-guard-ignore: demo swatch data
] as const;

const MASONRY_PHOTOS = [
  {
    src: '/demo-media/ulap-suites/photos/property-1-800.webp',
    alt: 'Ulap Suites terrace overlooking Taal',
    aspect: 'aspect-[4/3]',
    caption: 'Terrace view',
  },
  {
    src: '/demo-media/ulap-suites/photos/studio-fog-1-800.webp',
    alt: 'Studio Fog queen bed',
    aspect: 'aspect-square',
    caption: 'Studio Fog',
  },
  {
    src: '/demo-media/ulap-suites/photos/taal-view-1br-1-800.webp',
    alt: 'Taal View 1BR living room',
    aspect: 'aspect-[3/4]',
    caption: 'Taal View 1BR',
  },
  {
    src: '/demo-media/ulap-suites/photos/property-2-800.webp',
    alt: 'Garden lounge seating',
    aspect: 'aspect-[4/3]',
    caption: 'Garden lounge',
  },
  {
    src: '/demo-media/ulap-suites/photos/studio-fog-2-800.webp',
    alt: 'Studio Fog dining nook',
    aspect: 'aspect-[4/3]',
    caption: 'Dining nook',
  },
  {
    src: '/demo-media/ulap-suites/photos/taal-view-1br-2-800.webp',
    alt: 'Taal View bedroom balcony',
    aspect: 'aspect-square',
    caption: 'Balcony',
  },
] as const;

export function KitBaseUi2Section() {
  return (
    <>
      <DualSurfaceShowcase
        title="CompareSlider"
        source="@diceui/compare-slider · Base UI (UI-2)"
        useFor="Before/after photo comparisons such as logo background removal or daylight vs evening shots."
        dont="Hide essential text inside clipped panels without labels."
        render={() => (
          <CompareSlider
            defaultValue={50}
            aria-label="Compare before and after property photo"
            className="h-48 w-full rounded-xl border border-border"
          >
            <CompareSliderBefore label="Before">
              <img
                src="/demo-media/ulap-suites/photos/property-1-800.webp"
                alt="Property before edit"
                className="size-full object-cover saturate-50"
              />
            </CompareSliderBefore>
            <CompareSliderAfter label="After">
              <img
                src="/demo-media/ulap-suites/photos/property-1-800.webp"
                alt="Property after edit"
                className="size-full object-cover"
              />
            </CompareSliderAfter>
            <CompareSliderHandle />
          </CompareSlider>
        )}
      />

      <DualSurfaceShowcase
        title="ColorSwatch"
        source="@diceui/color-swatch · Base UI (UI-2)"
        useFor="Showing an owner's chosen brand, page, card, or accent colour, including empty and translucent states."
        dont="Use as an interactive button without wrapping or pairing it with an accessible control."
        render={() => (
          <div className="flex flex-wrap items-center gap-4">
            {SWATCH_PALETTE.map((swatch) => (
              <div key={swatch.name} className="flex items-center gap-2">
                <ColorSwatch color={swatch.value} size="default" />
                <span className="text-xs text-muted-foreground">{swatch.name}</span>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <ColorSwatch size="default" />
              <span className="text-xs text-muted-foreground">None</span>
            </div>
          </div>
        )}
      />

      <DualSurfaceShowcase
        title="Masonry"
        source="@diceui/masonry · Base UI (UI-2)"
        useFor="Variable-height photo galleries where portrait and landscape shots sit tightly together."
        dont="Use for tabular lists or equal-height unit cards (use CSS Grid there)."
        render={() => (
          <Masonry columnCount={2} gap={10} itemHeight={140} className="w-full">
            {MASONRY_PHOTOS.map((photo) => (
              <MasonryItem key={photo.caption}>
                <figure className="overflow-hidden rounded-xl border border-border bg-card">
                  <img
                    src={photo.src}
                    alt={photo.alt}
                    loading="lazy"
                    className={`w-full object-cover ${photo.aspect}`}
                  />
                  <figcaption className="px-2.5 py-1.5 text-xs text-muted-foreground">
                    {photo.caption}
                  </figcaption>
                </figure>
              </MasonryItem>
            ))}
          </Masonry>
        )}
      />
    </>
  );
}
