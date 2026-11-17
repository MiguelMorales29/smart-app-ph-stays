import type { Metadata, Viewport } from 'next';
import { Suspense, type ReactNode } from 'react';

import { PreviewRibbon } from '@/components/PreviewRibbon';
import { StorefrontSwitchGate } from '@/components/StorefrontSwitchGate';

export const metadata: Metadata = {
  title: 'Smart App PH · Stays and Rentals',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={null}>
          <StorefrontSwitchGate />
        </Suspense>
        {children}
        <PreviewRibbon />
      </body>
    </html>
  );
}
