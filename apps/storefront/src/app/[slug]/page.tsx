import { PropertyTheme } from '@smartapp/ui/compositions/property-theme';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { PropertyFrame } from '@/components/frames/PropertyFrame';
import { PropertyActionBar } from '@/features/property/components/PropertyActionBar';
import { PropertyPageView } from '@/features/property/components/PropertyPageView';
import {
  PropertyErrorView,
  PropertyLoadingSkeleton,
} from '@/features/property/components/PropertyStateView';
import {
  buildUnitDisplayCards,
  orderUnitsForProperty,
  resolvePrimaryCtaTarget,
  resolvePropertyNavItems,
  resolvePropertySections,
} from '@/features/property/property-rules';
import { getServerPropertyResult, type RawSearchParams } from '@/lib/property-server';

interface PropertyHomePageProps {
  readonly params: Promise<{ readonly slug: string }>;
  readonly searchParams: Promise<RawSearchParams>;
}

async function PropertyHomeInner({ params, searchParams }: PropertyHomePageProps) {
  const [{ slug }, resolvedSearch] = await Promise.all([params, searchParams]);
  const [layoutResult, pageResult] = await Promise.all([
    getServerPropertyResult(slug),
    getServerPropertyResult(slug, resolvedSearch),
  ]);

  if (pageResult.kind === 'offline') {
    return <PropertyErrorView kind="offline" message={pageResult.message} />;
  }

  if (pageResult.kind === 'error') {
    return <PropertyErrorView kind="error" message={pageResult.message} code={pageResult.code} />;
  }

  if (pageResult.kind === 'not_found' || !pageResult.propertyView.page.published) {
    notFound();
  }

  const { propertyView, today } = pageResult;
  const published = propertyView.page.published;
  if (!published) {
    notFound();
  }

  const visibility = resolvePropertySections(propertyView, today);
  const navItems = resolvePropertyNavItems(visibility);
  const orderedUnits = orderUnitsForProperty(propertyView.units, published.units);
  const unitCards = buildUnitDisplayCards(
    orderedUnits,
    propertyView.amenities,
    published.highlights,
  );
  const checkDatesHref = resolvePrimaryCtaTarget(propertyView.property.slug, orderedUnits);

  const frame = (
    <PropertyFrame
      propertyView={propertyView}
      navItems={navItems}
      unitCards={unitCards}
      actionBarClassName="lg:hidden"
      actionBar={
        <PropertyActionBar
          propertyName={propertyView.property.name}
          checkDatesHref={checkDatesHref}
          contact={propertyView.property.contact}
          replyHours={propertyView.property.reply_hours}
        />
      }
    >
      <PropertyPageView propertyView={propertyView} today={today} />
    </PropertyFrame>
  );

  // If layout already applied PropertyTheme for this slug, avoid wrapping twice.
  if (layoutResult.kind === 'ok' && layoutResult.propertyView.page.published) {
    return frame;
  }

  const { look } = published;
  return (
    <PropertyTheme
      brandColor={look.brandColor}
      pageColor={look.pageColor}
      cardColor={look.cardColor}
      accentColor={look.accentColor}
      fontPair={look.fontPair}
      logoShape={look.logoShape}
      withPortals
    >
      {frame}
    </PropertyTheme>
  );
}

export default function PropertyHomePage(props: PropertyHomePageProps) {
  return (
    <Suspense fallback={<PropertyLoadingSkeleton />}>
      <PropertyHomeInner {...props} />
    </Suspense>
  );
}
