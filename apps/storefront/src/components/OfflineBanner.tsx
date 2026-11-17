'use client';

import { Banner, BannerIcon, BannerTitle } from '@smartapp/ui/components/banner';
import { WifiOff } from 'lucide-react';
import { useSyncExternalStore } from 'react';

function subscribeOnlineStatus(callback: () => void): () => void {
  window.addEventListener('offline', callback);
  window.addEventListener('online', callback);
  return () => {
    window.removeEventListener('offline', callback);
    window.removeEventListener('online', callback);
  };
}

function getOfflineSnapshot(): boolean {
  return !window.navigator.onLine;
}

function getOfflineServerSnapshot(): boolean {
  return false;
}

export function OfflineBanner() {
  const offline = useSyncExternalStore(
    subscribeOnlineStatus,
    getOfflineSnapshot,
    getOfflineServerSnapshot,
  );

  if (!offline) {
    return null;
  }

  return (
    <Banner
      variant="warning"
      dismissible={false}
      className="rounded-none border-x-0 border-t-0 px-4 py-2"
      aria-label="Offline notice"
    >
      <BannerIcon>
        <WifiOff className="size-4" />
      </BannerIcon>
      <BannerTitle>You appear to be offline. Some details may be out of date.</BannerTitle>
    </Banner>
  );
}
