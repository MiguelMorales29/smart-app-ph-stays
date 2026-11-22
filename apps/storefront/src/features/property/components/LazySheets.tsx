'use client';

import { Spinner } from '@smartapp/ui/components/spinner';
import dynamic from 'next/dynamic';

function SheetLoadingPill() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 pointer-events-none"
    >
      <span className="inline-flex items-center gap-2 rounded-full border border-border bg-popover px-4 py-2 text-xs font-medium text-popover-foreground shadow-md">
        <Spinner className="size-3.5" />
        Loading…
      </span>
    </div>
  );
}

export const LazyInstallGuideSheet = dynamic(
  () => import('@/features/install/InstallGuideSheet').then((m) => m.InstallGuideSheet),
  { ssr: false, loading: () => <SheetLoadingPill /> },
);

export const LazyPropertyContactSheet = dynamic(
  () => import('./PropertyContactSheet').then((m) => m.PropertyContactSheet),
  { ssr: false, loading: () => <SheetLoadingPill /> },
);

export const LazyVerifiedOwnerSheet = dynamic(
  () => import('./VerifiedOwnerSheet').then((m) => m.VerifiedOwnerSheet),
  { ssr: false, loading: () => <SheetLoadingPill /> },
);

export const LazyUnitChooserSheet = dynamic(
  () => import('./UnitChooserSheet').then((m) => m.UnitChooserSheet),
  { ssr: false, loading: () => <SheetLoadingPill /> },
);

export const LazyReportPageSheet = dynamic(
  () => import('./ReportPageSheet').then((m) => m.ReportPageSheet),
  { ssr: false, loading: () => <SheetLoadingPill /> },
);

export const LazyUnitQuickLookSheet = dynamic(
  () => import('./UnitQuickLookSheet').then((m) => m.UnitQuickLookSheet),
  { ssr: false, loading: () => <SheetLoadingPill /> },
);

export const LazyPropertyMenuSheetBody = dynamic(
  () => import('./PropertyMenuSheetBody').then((m) => m.PropertyMenuSheetBody),
  { ssr: false, loading: () => <SheetLoadingPill /> },
);

export const LazyHeroPhotoViewerModal = dynamic(
  () => import('./HeroPhotoViewerModal').then((m) => m.HeroPhotoViewerModal),
  { ssr: false, loading: () => <SheetLoadingPill /> },
);
