import type { CalendarDate, EditorPart, PropertyView } from '@smartapp/core';
import type { ReactNode } from 'react';

import {
  buildUnitDisplayCards,
  computeStartingPrice,
  formatAreaLabel,
  orderUnitsForProperty,
  resolveBannerItems,
  resolveHeroPhotos,
  resolveHighlightAmenities,
  resolvePropertyNavItems,
  resolvePropertySections,
} from '../property-rules';
import { AboutHostSection } from './AboutHostSection';
import { AnnouncementStrip } from './AnnouncementStrip';
import { FaqSection } from './FaqSection';
import { HeroGallery } from './HeroGallery';
import { HighlightsSection } from './HighlightsSection';
import { LocationContactSection } from './LocationContactSection';
import { PromoBanners } from './PromoBanners';
import { PropertyBookingCard } from './PropertyBookingCard';
import { PropertyNameBlock } from './PropertyNameBlock';
import { PropertySectionTabs } from './PropertySectionTabs';
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
 * Full public property page body (parts 2 through 13, top to bottom, D79–D82):
 * - Sticky section tabs under the top bar on phones & tablets once the hero leaves view.
 * - Two columns on desktop (≥1024 px): content left (~2/3), sticky booking card right (~1/3).
 * - Built only from `getProperty` (`PropertyView`), honouring every show/hide switch in `look.sections`.
 */
export function PropertyPageView({
  propertyView,
  today,
  wrap = passthrough,
  showBanner,
}: PropertyPageViewProps) {
  const { property, page, host, trust, units, amenities, house_rules } = propertyView;
  const published = page.published;
  if (!published) return null;

  const visibility = resolvePropertySections(propertyView, today);
  const navItems = resolvePropertyNavItems(visibility);
  const hero = resolveHeroPhotos(propertyView);
  const banners = resolveBannerItems(propertyView);
  const orderedUnits = orderUnitsForProperty(units, published.units);
  const displayCards = buildUnitDisplayCards(orderedUnits, amenities, published.highlights);
  const highlights = resolveHighlightAmenities(propertyView);
  const startingPrice = computeStartingPrice(orderedUnits);
  const areaLabel = formatAreaLabel(property);
  const aboutText = published.about ?? property.description;
  const googleReviewUrl = property.contact.google_review_url?.trim() || null;

  return (
    <div data-slot="property-page" className="flex flex-col gap-6 pb-4">
      <PropertySectionTabs items={navItems} hasHero={hero.allPhotos.length > 0} />

      {visibility.announcement && published.look.announcement
        ? wrap('announcement', <AnnouncementStrip announcement={published.look.announcement} />)
        : null}

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-8">
        <div className="flex min-w-0 flex-col gap-8">
          {hero.allPhotos.length > 0
            ? wrap(
                'hero',
                <HeroGallery
                  propertyName={property.name}
                  mosaicPhotos={hero.mosaicPhotos}
                  allPhotos={hero.allPhotos}
                  photoGroups={hero.photoGroups}
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
              googleReviewUrl={googleReviewUrl}
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
            ? wrap(
                'units',
                <UnitsSection
                  slug={property.slug}
                  propertyName={property.name}
                  contact={property.contact}
                  replyHours={property.reply_hours}
                  cards={displayCards}
                />,
              )
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

          <TrustPanel
            slug={property.slug}
            propertyId={property.id}
            propertyName={property.name}
            trust={trust}
          />
        </div>

        <PropertyBookingCard
          slug={property.slug}
          propertyName={property.name}
          startingPrice={startingPrice}
          cards={displayCards}
          contact={property.contact}
          replyHours={property.reply_hours}
          googleReviewUrl={googleReviewUrl}
        />
      </div>
    </div>
  );
}
