import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Storefront UI Kit · Smart App PH',
  robots: { index: false, follow: false },
};

async function StorefrontKitBoundary({
  searchParams,
}: {
  readonly searchParams: Promise<{
    readonly look?: string;
    readonly pack?: string;
    readonly clock?: string;
  }>;
}) {
  if (process.env.NEXT_PUBLIC_APP_ENV === 'production') {
    notFound();
  }

  const resolved = await searchParams;
  const queryParts: string[] = [];
  if (resolved.pack) queryParts.push(`pack=${encodeURIComponent(resolved.pack)}`);
  if (resolved.clock) queryParts.push(`clock=${encodeURIComponent(resolved.clock)}`);

  const { StorefrontKitView } = await import('@/components/kit/StorefrontKitView');
  return (
    <StorefrontKitView
      lookParam={resolved.look}
      switchQuery={queryParts.length > 0 ? queryParts.join('&') : undefined}
    />
  );
}

export default function StorefrontKitPage({
  searchParams,
}: {
  readonly searchParams: Promise<{
    readonly look?: string;
    readonly pack?: string;
    readonly clock?: string;
  }>;
}) {
  if (process.env.NEXT_PUBLIC_APP_ENV === 'production') {
    notFound();
  }

  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-5xl px-4 py-8 text-sm text-muted-foreground">
          Loading storefront kit…
        </main>
      }
    >
      <StorefrontKitBoundary searchParams={searchParams} />
    </Suspense>
  );
}
