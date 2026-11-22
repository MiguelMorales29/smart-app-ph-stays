'use client';

import * as React from 'react';
import { MinusIcon, PlusIcon } from 'lucide-react';
import { Button } from '@smartapp/ui/components/button';
import { ButtonGroup, ButtonGroupText } from '@smartapp/ui/components/button-group';
import {
  Cropper,
  CropperArea,
  CropperImage,
  type CropperAreaData,
} from '@smartapp/ui/components/cropper';
import { AppSheet } from '@smartapp/ui/compositions/app-sheet';
import { AsyncButton } from '@smartapp/ui/compositions/async-button';
import { useLastDefined } from '@smartapp/ui/hooks/use-last-defined';

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;

export interface PhotoCropSheetProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  /** Object URL or image URL to crop. Kept mounted during sheet exit. */
  readonly src: string | null;
  readonly title?: string | undefined;
  readonly description?: string | undefined;
  readonly aspectRatio?: number | undefined;
  readonly shape?: 'rectangle' | 'circle' | undefined;
  readonly withGrid?: boolean | undefined;
  /**
   * Which button gets the primary visual weight:
   * - `'crop'` (default): "Apply crop" is primary (used for Adjust and QR square crop).
   * - `'use-as-is'`: "Use as is" is primary (used for single listing photo upload).
   */
  readonly primaryAction?: 'crop' | 'use-as-is' | undefined;
  readonly confirmLabel?: string | undefined;
  readonly useAsIsLabel?: string | undefined;
  readonly busy?: boolean | undefined;
  readonly onConfirm: (area: CropperAreaData) => void | Promise<void>;
  readonly onUseAsIs?: (() => void | Promise<void>) | undefined;
}

/**
 * Shared photo crop sheet built on `AppSheet` + Dice UI `Cropper` with accessible zoom controls.
 * Never unmounts its cropper content while closing (Pattern Guide §2).
 */
export function PhotoCropSheet({
  open,
  onOpenChange,
  src,
  title = 'Fit photo',
  description = 'Drag to move. Pinch or use the buttons to zoom.',
  aspectRatio = 4 / 3,
  shape = 'rectangle',
  withGrid,
  primaryAction = 'crop',
  confirmLabel = 'Apply crop',
  useAsIsLabel = 'Use as is',
  busy = false,
  onConfirm,
  onUseAsIs,
}: PhotoCropSheetProps) {
  const shownSrc = useLastDefined(src ?? undefined);
  const [area, setArea] = React.useState<CropperAreaData | null>(null);
  const showGrid = withGrid ?? shape === 'rectangle';

  const applyButton = (
    <AsyncButton
      type="button"
      variant={primaryAction === 'crop' ? 'default' : 'outline'}
      className="min-h-11"
      state={busy ? 'busy' : 'idle'}
      disabled={!area || busy}
      onClick={() => {
        if (area) void onConfirm(area);
      }}
    >
      {confirmLabel}
    </AsyncButton>
  );

  const useAsIsButton = onUseAsIs ? (
    <AsyncButton
      type="button"
      variant={primaryAction === 'use-as-is' ? 'default' : 'outline'}
      className="min-h-11"
      state={busy ? 'busy' : 'idle'}
      disabled={busy}
      onClick={() => void onUseAsIs()}
    >
      {useAsIsLabel}
    </AsyncButton>
  ) : null;

  return (
    <AppSheet
      open={open}
      onOpenChange={onOpenChange}
      size="md"
      title={title}
      description={description}
      footer={
        <>
          <Button
            type="button"
            data-sheet-cancel=""
            variant="ghost"
            className="min-h-11"
            disabled={busy}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          {primaryAction === 'use-as-is' ? (
            <>
              {applyButton}
              {useAsIsButton}
            </>
          ) : (
            <>
              {useAsIsButton}
              {applyButton}
            </>
          )}
        </>
      }
    >
      {shownSrc ? (
        <PhotoCropBody
          key={shownSrc}
          src={shownSrc}
          aspectRatio={aspectRatio}
          shape={shape}
          showGrid={showGrid}
          onAreaChange={setArea}
        />
      ) : null}
    </AppSheet>
  );
}

function PhotoCropBody({
  src,
  aspectRatio,
  shape,
  showGrid,
  onAreaChange,
}: {
  readonly src: string;
  readonly aspectRatio: number;
  readonly shape: 'rectangle' | 'circle';
  readonly showGrid: boolean;
  readonly onAreaChange: (area: CropperAreaData) => void;
}) {
  const [crop, setCrop] = React.useState({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative h-72 overflow-hidden rounded-xl bg-muted sm:h-80">
        <Cropper
          aspectRatio={aspectRatio}
          shape={shape}
          withGrid={showGrid}
          crop={crop}
          zoom={zoom}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropAreaChange={(_, pixels) => onAreaChange(pixels)}
          role="group"
          aria-label="Photo crop area"
          className="size-full"
        >
          <CropperImage
            src={src}
            alt=""
            crossOrigin={/^https?:/.test(src) ? 'anonymous' : undefined}
          />
          <CropperArea />
        </Cropper>
      </div>
      <ButtonGroup aria-label="Zoom" className="self-center">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-11"
          aria-label="Zoom out"
          disabled={zoom <= MIN_ZOOM}
          onClick={() => setZoom((z) => Math.max(MIN_ZOOM, Number((z - ZOOM_STEP).toFixed(2))))}
        >
          <MinusIcon aria-hidden="true" />
        </Button>
        <ButtonGroupText className="h-11 w-16 justify-center bg-background tabular">
          {zoom.toFixed(1)}×
        </ButtonGroupText>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-11"
          aria-label="Zoom in"
          disabled={zoom >= MAX_ZOOM}
          onClick={() => setZoom((z) => Math.min(MAX_ZOOM, Number((z + ZOOM_STEP).toFixed(2))))}
        >
          <PlusIcon aria-hidden="true" />
        </Button>
      </ButtonGroup>
    </div>
  );
}
