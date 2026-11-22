import { Button } from '@smartapp/ui/components/button';
import { ButtonGroup, ButtonGroupText } from '@smartapp/ui/components/button-group';
import {
  Cropper,
  CropperArea,
  CropperImage,
  type CropperAreaData,
} from '@smartapp/ui/components/cropper';
import {
  ColorPicker,
  ColorPickerArea,
  ColorPickerContent,
  ColorPickerInput,
  ColorPickerSlider,
  ColorPickerSwatches,
  ColorPickerSwatchItem,
  ColorPickerTrigger,
} from '@smartapp/ui/components/reui/color-picker';
import { MinusIcon, PlusIcon } from 'lucide-react';
import { useState } from 'react';

import { DualSurfaceShowcase } from './kit-base-tab';

const OWNER_BRAND_SWATCHES = [
  '#2866EE', // brand-guard-ignore: demo swatch data
  '#1E5631', // brand-guard-ignore: demo swatch data
  '#C85A32', // brand-guard-ignore: demo swatch data
  '#6B4C9A', // brand-guard-ignore: demo swatch data
  '#0F766E', // brand-guard-ignore: demo swatch data
] as const;

function CropperDemo() {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<CropperAreaData | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative h-56 overflow-hidden rounded-xl bg-muted">
        <Cropper
          aspectRatio={4 / 3}
          shape="rectangle"
          withGrid
          crop={crop}
          zoom={zoom}
          minZoom={1}
          maxZoom={3}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropAreaChange={(_, pixels) => setArea(pixels)}
          role="group"
          aria-label="Sample 4:3 listing photo cropper"
          className="size-full"
        >
          <CropperImage
            src="/demo-media/ulap-suites/photos/property-1-800.webp"
            alt="Ulap Suites sample"
          />
          <CropperArea />
        </Cropper>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ButtonGroup aria-label="Zoom">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-11 md:size-9"
            aria-label="Zoom out"
            disabled={zoom <= 1}
            onClick={() => setZoom((z) => Math.max(1, Number((z - 0.25).toFixed(2))))}
          >
            <MinusIcon aria-hidden="true" />
          </Button>
          <ButtonGroupText className="h-11 w-14 justify-center bg-background tabular md:h-9">
            {zoom.toFixed(1)}×
          </ButtonGroupText>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-11 md:size-9"
            aria-label="Zoom in"
            disabled={zoom >= 3}
            onClick={() => setZoom((z) => Math.min(3, Number((z + 0.25).toFixed(2))))}
          >
            <PlusIcon aria-hidden="true" />
          </Button>
        </ButtonGroup>
        <span className="text-xs text-muted-foreground tabular">
          {area ? `${Math.round(area.width)} × ${Math.round(area.height)} px` : 'Drag or zoom'}
        </span>
      </div>
    </div>
  );
}

function ColorPickerDemo() {
  const [color, setColor] = useState('#2866EE'); // brand-guard-ignore: demo swatch data

  return (
    <div className="flex flex-col gap-3">
      <ColorPicker
        value={color}
        onValueChange={(next) => {
          if (next) setColor(next);
        }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <ColorPickerTrigger className="min-h-11 md:min-h-9" />
          <ColorPickerInput className="min-w-40 flex-1" />
        </div>
        <ColorPickerContent className="w-72">
          <ColorPickerArea />
          <ColorPickerSlider channel="hue" />
          <ColorPickerSlider channel="alpha" />
          <ColorPickerSwatches>
            {OWNER_BRAND_SWATCHES.map((swatch) => (
              <ColorPickerSwatchItem key={swatch} value={swatch} />
            ))}
          </ColorPickerSwatches>
        </ColorPickerContent>
      </ColorPicker>
      <p className="text-xs text-muted-foreground tabular">Selected: {color}</p>
    </div>
  );
}

export function KitFormsUi2Section() {
  return (
    <>
      <DualSurfaceShowcase
        title="Cropper"
        source="@diceui/cropper · Base UI (UI-2)"
        useFor="Listing 4:3 crop adjustments, square payment QR crops (lossless PNG), and circle profile photos."
        dont="Force a crop sheet on multi-photo batch uploads (auto-fit 4:3 and offer Adjust per tile)."
        render={() => <CropperDemo />}
      />

      <DualSurfaceShowcase
        title="ColorPicker"
        source="@reui/color-picker · Base UI (UI-2)"
        useFor="Owner brand, page, card, and accent colours in the Page Editor (P5-6)."
        dont="Hand-adjust contrast in the screen; pass the owner's colour through propertyPalette."
        render={() => <ColorPickerDemo />}
      />
    </>
  );
}
