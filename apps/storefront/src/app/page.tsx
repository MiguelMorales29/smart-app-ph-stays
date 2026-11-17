import { Suspense } from 'react';

import { LandingFrame } from '@/components/frames/LandingFrame';
import { StorefrontHomeClient } from '@/components/StorefrontHomeClient';

export default function HomePage() {
  return (
    <LandingFrame>
      <Suspense
        fallback={
          <div className="py-8 text-sm text-muted-foreground">
            <p>Loading stays…</p>
          </div>
        }
      >
        <StorefrontHomeClient />
      </Suspense>
    </LandingFrame>
  );
}
