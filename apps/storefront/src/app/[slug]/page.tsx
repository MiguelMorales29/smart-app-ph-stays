import { Suspense } from 'react';

import { StorefrontPropertyClient } from '@/components/StorefrontPropertyClient';

export default function PropertyPage() {
  return (
    <Suspense
      fallback={
        <main>
          <p>Loading property…</p>
        </main>
      }
    >
      <StorefrontPropertyClient />
    </Suspense>
  );
}
