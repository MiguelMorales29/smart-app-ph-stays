import { Suspense } from 'react';

import { StorefrontHomeClient } from '@/components/StorefrontHomeClient';

export default function HomePage() {
  return (
    <Suspense fallback={<main><p>Loading stays…</p></main>}>
      <StorefrontHomeClient />
    </Suspense>
  );
}
