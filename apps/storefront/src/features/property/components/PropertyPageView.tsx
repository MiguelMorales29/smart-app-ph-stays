import type { CalendarDate, EditorPart, PropertyView } from '@smartapp/core';
import type { ReactNode } from 'react';

import {
  computeStartingPrice,
  formatAreaLabel,
  orderUnitsForProperty,
  resolveBannerItems,
  resolveHeroPhotos,
  resolveHighlightAmenities,
  resolvePropertySections,
} from '../property-rules';
import { AboutHostSection } from './AboutHostSection';
import { AnnouncementStrip } from './AnnouncementStrip';
import { FaqSection } from './FaqSection';
import { HeroGallery } from './HeroGallery';
import { HighlightsSection } from './HighlightsSection';
import { LocationContactSection } from './LocationContactSection';
import { PromoBanners } from './PromoBanners';
import { PropertyNameBlock } from './PropertyNameBlock';
import { RulesSection } from './RulesSection';
import { TimesSection } from './TimesSection';
import { TrustPanel } from './TrustPanel';
import { UnitsSection } from './UnitsSection';

export interface PropertyPageViewProps {
  readonly propertyView: PropertyView;
  readonly today: CalendarDate;
  /** Optional wrapper used by the Page Editor preview (P5-5) to highlight and select parts. */
  readonly wrap?: ((part: EditorPart, node: ReactNode) => ReactNode) | undefined;
  readonly showBanner?: { readonly index: number; readonly at: number } | undefined;
}

const passthrough = (_part: EditorPart, node: ReactNode) => node;

/**
 * Full public property page body (parts 2 through 13, top to bottom).
 * Built only from `getProperty` (`PropertyView`), honouring every show/hide switch in `look.sections`.
 */
export function PropertyPageView({
  propertyView,
  today,
  wrap = passthrough,
  showBanner,
}: PropertyPageViewProps) {
  const { property, page, host, trust, units, house_rules } = propertyView;
  const published = page.published;
  if (!published) return null;

  const visibility = resolvePropertySections(propertyView, today);
  const hero = resolveHeroPhotos(propertyView);
  const banners = resolveBannerItems(propertyView);
  const orderedUnits = orderUnitsForProperty(units, published.units);
  const highlights = resolveHighlightAmenities(propertyView);
  const startingPrice = computeStartingPrice(orderedUnits);
  const areaLabel = formatAreaLabel(property);
  const aboutText = published.about ?? property.description;

  return (
    <div data-slot="property-page" className="flex flex-col gap-8 pb-4">
      {visibility.announcement && published.look.announcement
        ? wrap('announcement', <AnnouncementStrip announcement={published.look.announcement} />)
        : null}

      {hero.allPhotos.length > 0
        ? wrap(
            'hero',
            <HeroGallery
              propertyName={property.name}
              mosaicPhotos={hero.mosaicPhotos}
              allPhotos={hero.allPhotos}
            />,
          )
        : null}

      {wrap(
        'style',
        <PropertyNameBlock
          name={property.name}
          tagline={published.tagline ?? property.tagline}
          areaLabel={areaLabel}
          isVerified={trust.is_verified}
          startingPrice={startingPrice}
        />,
      )}

      {visibility.banners
        ? wrap(
            'banners',
            <PromoBanners
              slug={property.slug}
              banners={banners}
              seconds={published.look.bannerSeconds}
              show={showBanner}
            />,
          )
        : null}

      {visibility.units
        ? wrap('units', <UnitsSection slug={property.slug} units={orderedUnits} />)
        : null}

      {visibility.highlights
        ? wrap('highlights', <HighlightsSection highlights={highlights} />)
        : null}

      {visibility.about
        ? wrap(
            'about',
            <AboutHostSection about={aboutText} host={host} isVerified={trust.is_verified} />,
          )
        : null}

      {visibility.rules
        ? wrap('rules', <RulesSection property={property} houseRules={house_rules} />)
        : null}

      {visibility.location
        ? wrap('location', <LocationContactSection property={property} />)
        : null}

      {visibility.times ? wrap('times', <TimesSection property={property} />) : null}

      {visibility.faq ? wrap('faq', <FaqSection items={published.faq} />) : null}

      <TrustPanel propertyId={property.id} propertyName={property.name} trust={trust} />
    </div>
  );
}
