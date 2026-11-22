'use client';

import { shouldShowInstallNudge } from '@smartapp/core';
import { useEffect, useState } from 'react';

import { InstallGuideSheet } from './InstallGuideSheet';
import {
  dismissInstallNudge,
  readInstallDismissedAt,
  recordPropertyVisit,
  useInstallPlatform,
  watchInstall,
} from './install-store';

export interface InstallNudgeControllerProps {
  readonly slug: string;
  readonly propertyName: string;
  readonly logoSrc: string | null;
  readonly confirmedBooking?: boolean | undefined;
}

/**
 * Watches `beforeinstallprompt` / `appinstalled` and opens the install nudge sheet only on a
 * second visit or after a confirmed booking — never on the first screen (D82).
 */
export function InstallNudgeController({
  slug,
  propertyName,
  logoSrc,
  confirmedBooking = false,
}: InstallNudgeControllerProps) {
  const platform = useInstallPlatform();
  const [nudgeOpen, setNudgeOpen] = useState(false);

  useEffect(() => watchInstall(), []);

  useEffect(() => {
    const visits = recordPropertyVisit(slug);
    const dismissedAt = readInstallDismissedAt(slug);
    const shouldShow = shouldShowInstallNudge({
      platform,
      visitCount: visits,
      confirmedBooking,
      dismissedAt,
      nowMs: Date.now(),
    });
    if (!shouldShow) return;

    const timer = window.setTimeout(() => {
      setNudgeOpen(true);
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [slug, platform, confirmedBooking]);

  return (
    <InstallGuideSheet
      open={nudgeOpen}
      onOpenChange={setNudgeOpen}
      slug={slug}
      propertyName={propertyName}
      logoSrc={logoSrc}
      onDismissForLater={() => dismissInstallNudge(slug)}
    />
  );
}
