'use client';

import { useEffect, useState, type ComponentType } from 'react';

export function StorefrontSwitchGate() {
  const [Bar, setBar] = useState<ComponentType | null>(null);

  useEffect(() => {
    let active = true;
    if (
      process.env.NEXT_PUBLIC_DATA_SOURCE === 'memory' &&
      process.env.NEXT_PUBLIC_APP_ENV !== 'production'
    ) {
      void import('./StorefrontSwitchBar').then((mod) => {
        if (active) {
          setBar(() => mod.StorefrontSwitchBar);
        }
      });
    }
    return () => {
      active = false;
    };
  }, []);

  if (
    process.env.NEXT_PUBLIC_DATA_SOURCE === 'memory' &&
    process.env.NEXT_PUBLIC_APP_ENV !== 'production' &&
    Bar
  ) {
    return <Bar />;
  }

  return null;
}
