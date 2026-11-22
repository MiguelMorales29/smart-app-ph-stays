import { Button } from '@smartapp/ui/components/button';
import { ArrowLeftIcon } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { PropertyFrame } from '@/components/frames/PropertyFrame';
import { InstallGuideContent } from '@/features/install/InstallGuideContent';
import { PropertyLoadingSkeleton } from '@/features/property/components/PropertyStateView';
import { normalizeMediaSrc } from '@/features/property/media-src';
import { getServerProperty } from '@/lib/property-server';

interface InstallAppPageProps {
  readonly params: Promise<{ readonly slug: string }>;
}

async function InstallAppInner({ params }: InstallAppPageProps) {
  const { slug } = await params;
  const propertyView = await getServerProperty(slug);
  if (!propertyView || !propertyView.page.published) {
    notFound();
  }

  const { property, page_media } = propertyView;
  const logoSrc = page_media.logo ? normalizeMediaSrc(page_media.logo.url) : null;

  return (
    <PropertyFrame propertyView={propertyView}>
      <div className="mx-auto max-w-2xl space-y-6 pb-8">
        <div>
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<Link href={`/${property.slug}`} />}
            className="min-h-11 gap-2 px-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeftIcon aria-hidden="true" className="size-4" />
            Back to {property.name}
          </Button>
        </div>

        <div className="space-y-1.5">
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            Install {property.name}
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Add {property.name} to your Home Screen so you can check rooms, prices and your booking
            with one tap.
          </p>
        </div>

        <InstallGuideContent
          slug={property.slug}
          propertyName={property.name}
          logoSrc={logoSrc}
        />
      </div>
    </PropertyFrame>
  );
}

export default function InstallAppPage(props: InstallAppPageProps) {
  return (
    <Suspense fallback={<PropertyLoadingSkeleton />}>
      <InstallAppInner {...props} />
    </Suspense>
  );
}
