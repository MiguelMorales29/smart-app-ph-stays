import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense, type ReactNode } from 'react';

import { PropertyTheme } from '@smartapp/ui/compositions/property-theme';

import { PropertyLoadingSkeleton } from '@/features/property/components/PropertyStateView';
import {
  getServerProperty,
  getServerPropertyResult,
  shouldNoindexProperty,
} from '@/lib/property-server';

interface PropertyLayoutProps {
  readonly children: ReactNode;
  readonly params: Promise<{ readonly slug: string }>;
}

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const propertyView = await getServerProperty(slug);

  if (!propertyView || !propertyView.page.published) {
    return {
      title: 'Property not found · Smart App PH',
      robots: { index: false, follow: false },
    };
  }

  const published = propertyView.page.published;
  const title = published.seo.title?.trim() || `${propertyView.property.name} · Smart App PH`;
  const description =
    published.seo.description?.trim() ||
    published.tagline?.trim() ||
    propertyView.property.tagline?.trim() ||
    undefined;

  return {
    title,
    ...(description ? { description } : {}),
    ...(shouldNoindexProperty(propertyView) || published.seo.hideFromSearch
      ? { robots: { index: false, follow: false } }
      : {}),
  };
}

async function PropertyThemeBoundary({
  params,
  children,
}: {
  readonly params: Promise<{ readonly slug: string }>;
  readonly children: ReactNode;
}) {
  const { slug } = await params;
  const result = await getServerPropertyResult(slug);

  if (result.kind === 'error' || result.kind === 'offline') {
    return <>{children}</>;
  }

  if (result.kind === 'not_found' || !result.propertyView.page.published) {
    // In memory dev/preview mode, allow the page to inspect `?pack=` query overrides (e.g. `?pack=qa`).
    if (
      process.env.NEXT_PUBLIC_DATA_SOURCE === 'memory' &&
      process.env.NEXT_PUBLIC_APP_ENV !== 'production'
    ) {
      return <>{children}</>;
    }
    notFound();
  }

  const { look } = result.propertyView.page.published;

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
      <meta name="theme-color" content={look.brandColor} />
      {children}
    </PropertyTheme>
  );
}

export default function PropertyLayout({ children, params }: PropertyLayoutProps) {
  return (
    <Suspense fallback={<PropertyLoadingSkeleton />}>
      <PropertyThemeBoundary params={params}>{children}</PropertyThemeBoundary>
    </Suspense>
  );
}
