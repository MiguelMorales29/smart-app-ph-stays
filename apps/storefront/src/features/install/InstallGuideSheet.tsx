'use client';

import { Button } from '@smartapp/ui/components/button';
import { AppSheet } from '@smartapp/ui/compositions/app-sheet';

import { InstallGuideContent } from './InstallGuideContent';
import { useInstallDetection } from './install-store';

export interface InstallGuideSheetProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly slug: string;
  readonly propertyName: string;
  readonly logoSrc: string | null;
  readonly onDismissForLater?: (() => void) | undefined;
}

/**
 * Install guide sheet (D76, D82): opens from the top-bar Install button, menu, or the 2nd-visit nudge.
 * Uses `AppSheet` so phones get a scrollable bottom drawer and desktop gets a dialog.
 */
export function InstallGuideSheet({
  open,
  onOpenChange,
  slug,
  propertyName,
  logoSrc,
  onDismissForLater,
}: InstallGuideSheetProps) {
  const { platform } = useInstallDetection();

  function handleClose() {
    onDismissForLater?.();
    onOpenChange(false);
  }

  return (
    <AppSheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onDismissForLater?.();
        onOpenChange(nextOpen);
      }}
      title={`Install ${propertyName}`}
      description={
        platform === 'in_app'
          ? 'Open in Safari or Chrome first so your phone can install this app.'
          : 'Add this property to your Home Screen for one-tap access.'
      }
      height={platform === 'prompt' || platform === 'in_app' ? 'half' : 'full'}
      size="md"
      footer={
        <Button type="button" variant="outline" onClick={handleClose} className="min-h-12">
          {onDismissForLater ? 'Not now' : 'Done'}
        </Button>
      }
    >
      <div className="py-1">
        <InstallGuideContent
          slug={slug}
          propertyName={propertyName}
          logoSrc={logoSrc}
          showCornerPointer={open && platform === 'ios_safari_26'}
          onInstalled={() => onOpenChange(false)}
        />
      </div>
    </AppSheet>
  );
}
