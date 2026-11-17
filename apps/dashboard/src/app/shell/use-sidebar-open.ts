import { useCallback, useEffect, useState } from 'react';
import type { FormFactor } from '@smartapp/ui/hooks/use-form-factor';

function readDesktopSidebarDefault(): boolean {
  if (typeof document === 'undefined') return true;
  return !document.cookie.split('; ').includes('sidebar_state=false');
}

/**
 * Keeps the tablet sidebar collapsed to the icon rail by default while preserving
 * the desktop sidebar cookie preference. Both toggle with SidebarTrigger.
 */
export function useResponsiveSidebarOpen(formFactor: FormFactor): {
  readonly sidebarOpen: boolean;
  readonly onSidebarOpenChange: (nextOpen: boolean) => void;
} {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() =>
    formFactor === 'tablet' ? false : readDesktopSidebarDefault(),
  );

  useEffect(() => {
    if (formFactor === 'tablet') {
      setSidebarOpen(false);
    } else if (formFactor === 'desktop') {
      setSidebarOpen(readDesktopSidebarDefault());
    }
  }, [formFactor]);

  const onSidebarOpenChange = useCallback(
    (nextOpen: boolean) => {
      setSidebarOpen(nextOpen);
      if (formFactor === 'desktop') {
        document.cookie = `sidebar_state=${nextOpen}; path=/; max-age=${60 * 60 * 24 * 7}`;
      }
    },
    [formFactor],
  );

  return { sidebarOpen, onSidebarOpenChange };
}
