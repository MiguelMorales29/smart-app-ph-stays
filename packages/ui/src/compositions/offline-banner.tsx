import { useSyncExternalStore } from 'react';
import { WifiOffIcon } from 'lucide-react';
import { Banner, BannerIcon, BannerTitle } from '@smartapp/ui/components/banner';

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

export interface OfflineBannerProps {
  readonly forceOffline?: boolean | undefined;
  readonly message?: string | undefined;
}

/** Displays a persistent warning banner when the browser is offline or offline simulation is active. */
export function OfflineBanner({
  forceOffline = false,
  message = 'You appear to be offline. Some details may be out of date.',
}: OfflineBannerProps) {
  const browserOffline = useSyncExternalStore(
    subscribeOnlineStatus,
    getOfflineSnapshot,
    getOfflineServerSnapshot,
  );

  if (!browserOffline && !forceOffline) {
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
        <WifiOffIcon className="size-4" />
      </BannerIcon>
      <BannerTitle>{message}</BannerTitle>
    </Banner>
  );
}
