import type { Metadata, Viewport } from 'next';
import { Suspense, type ReactNode } from 'react';

import './globals.css';
import { OfflineBanner } from '@/components/OfflineBanner';
import { PreviewRibbon } from '@/components/PreviewRibbon';
import { StorefrontSwitchGate } from '@/components/StorefrontSwitchGate';
import { shouldNoindexRoot } from '@/lib/property-server';

export function generateMetadata(): Metadata {
  return {
    title: 'Smart App PH · Stays and Rentals',
    ...(shouldNoindexRoot() ? { robots: { index: false, follow: false } } : {}),
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
};

export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <OfflineBanner />
        <Suspense fallback={null}>
          <StorefrontSwitchGate />
        </Suspense>
        {children}
        <PreviewRibbon />
      </body>
    </html>
  );
}
