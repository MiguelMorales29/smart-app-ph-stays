import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { Suspense, type ReactNode } from 'react';

import { PropertyTheme } from '@smartapp/ui/compositions/property-theme';

import { getServerProperty, shouldNoindexProperty } from '@/lib/property-server';

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

  if (!propertyView) {
    return {
      title: 'Property not found · Smart App PH',
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `${propertyView.property.name} · Smart App PH`,
    ...(shouldNoindexProperty(propertyView) ? { robots: { index: false, follow: false } } : {}),
  };
}

export async function generateViewport({
  params,
}: {
  readonly params: Promise<{ readonly slug: string }>;
}): Promise<Viewport> {
  const { slug } = await params;
  const propertyView = await getServerProperty(slug);
  const brandColor = propertyView?.page.published?.look.brandColor;

  return {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover',
    ...(brandColor ? { themeColor: brandColor } : {}),
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
  const propertyView = await getServerProperty(slug);

  if (!propertyView || !propertyView.page.published) {
    notFound();
  }

  const { look } = propertyView.page.published;

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
      {children}
    </PropertyTheme>
  );
}

export default function PropertyLayout({ children, params }: PropertyLayoutProps) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-muted-foreground">
          Loading property…
        </div>
      }
    >
      <PropertyThemeBoundary params={params}>{children}</PropertyThemeBoundary>
    </Suspense>
  );
}
