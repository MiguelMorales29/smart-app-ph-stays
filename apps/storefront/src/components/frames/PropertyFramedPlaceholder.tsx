import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { ConversationFrame } from '@/components/frames/ConversationFrame';
import { PropertyFrame } from '@/components/frames/PropertyFrame';
import { PlaceholderPageContent } from '@/components/PlaceholderPageContent';
import { getServerProperty } from '@/lib/property-server';

interface FramedPlaceholderProps {
  readonly params: Promise<{
    readonly slug: string;
    readonly unit?: string;
    readonly token?: string;
  }>;
  readonly title: string;
  readonly phase: number;
  readonly detailKey?: 'unit' | 'token';
  readonly frame?: 'property' | 'conversation';
}

async function FramedPlaceholderInner({
  params,
  title,
  phase,
  detailKey,
  frame = 'property',
}: FramedPlaceholderProps) {
  const resolved = await params;
  const propertyView = await getServerProperty(resolved.slug);

  if (!propertyView || !propertyView.page.published) {
    notFound();
  }

  const detailValue =
    detailKey === 'unit' ? resolved.unit : detailKey === 'token' ? resolved.token : undefined;

  const content = (
    <PlaceholderPageContent
      title={title}
      phase={phase}
      {...(detailValue !== undefined ? { detail: detailValue } : {})}
    />
  );

  if (frame === 'conversation') {
    return <ConversationFrame propertyView={propertyView}>{content}</ConversationFrame>;
  }

  return <PropertyFrame propertyView={propertyView}>{content}</PropertyFrame>;
}

export function PropertyFramedPlaceholder(props: FramedPlaceholderProps) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-muted-foreground">Loading…</div>
      }
    >
      <FramedPlaceholderInner {...props} />
    </Suspense>
  );
}
