import { STARTING_MAKE, avatarSvgSrc, type AvatarMake, type ProfileAvatar } from '@smartapp/core';
import { Button } from '@smartapp/ui/components/button';
import { AvatarMaker } from '@smartapp/ui/compositions/avatar-maker';
import { FacePicker } from '@smartapp/ui/compositions/face-picker';
import { PersonAvatar } from '@smartapp/ui/compositions/person-avatar';
import { PhotoCropSheet } from '@smartapp/ui/compositions/photo-crop-sheet';
import { YourPictureSheet } from '@smartapp/ui/compositions/picture-picker-sheet';
import { notify } from '@smartapp/ui/lib/notify';
import { CropIcon, PencilIcon } from 'lucide-react';
import { useState } from 'react';

import { DualSurfaceShowcase } from './kit-base-tab';

function YourPictureSheetDemo() {
  const [open, setOpen] = useState(false);
  const [avatar, setAvatar] = useState<ProfileAvatar>({
    kind: 'face',
    style: 'soft',
    face: 3,
    theme: 'sky',
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  return (
    <div className="flex flex-wrap items-center gap-4">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Change picture"
        className="group relative rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <PersonAvatar
          avatar={avatar}
          name="Marco Villanueva"
          photoSrc={() => photoPreview}
          size="lg"
          className="size-16 text-lg"
        />
        <span className="absolute right-0 bottom-0 flex size-6 items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground [&_svg]:size-3">
          <PencilIcon aria-hidden="true" />
        </span>
      </button>
      <div className="flex flex-col items-start gap-1">
        <p className="text-sm font-medium">Marco Villanueva</p>
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
          Open “Your picture” sheet
        </Button>
      </div>
      <YourPictureSheet
        open={open}
        onOpenChange={setOpen}
        name="Marco Villanueva"
        current={avatar}
        photoSrc={() => photoPreview}
        onUploadPhoto={async (file: File) => {
          const previewUrl = URL.createObjectURL(file);
          return { fileId: 'dec0de00-0000-4000-8000-000000000099', previewUrl };
        }}
        onSave={async (next, preview) => {
          setAvatar(next);
          if (preview) setPhotoPreview(preview);
          notify.success('Picture updated in kit preview');
        }}
      />
    </div>
  );
}

function PhotoCropSheetDemo() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'use-as-is' | 'crop'>('use-as-is');

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          setMode('use-as-is');
          setOpen(true);
        }}
      >
        <CropIcon aria-hidden="true" />
        Single photo (“Use as is” primary)
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          setMode('crop');
          setOpen(true);
        }}
      >
        <CropIcon aria-hidden="true" />
        Adjust / QR square crop
      </Button>
      <PhotoCropSheet
        open={open}
        onOpenChange={setOpen}
        src="/demo-media/ulap-suites/photos/property-1-800.webp"
        title={mode === 'use-as-is' ? 'Fit photo' : 'Crop QR code'}
        aspectRatio={mode === 'use-as-is' ? 4 / 3 : 1}
        primaryAction={mode}
        confirmLabel={mode === 'use-as-is' ? 'Apply crop' : 'Use this QR'}
        onConfirm={async (area) => {
          notify.success(`Cropped ${Math.round(area.width)} × ${Math.round(area.height)} px`);
          setOpen(false);
        }}
        onUseAsIs={
          mode === 'use-as-is'
            ? async () => {
                notify.info('Used photo as is');
                setOpen(false);
              }
            : undefined
        }
      />
    </div>
  );
}

function FacePickerDemo() {
  const [avatar, setAvatar] = useState<ProfileAvatar>({
    kind: 'face',
    style: 'people',
    face: 2,
    theme: 'mint',
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <PersonAvatar avatar={avatar} name="Clarisse Sy-Tan" size="lg" />
        <PersonAvatar
          avatar={{ kind: 'preset', preset_id: 'notionists-Sampaguita' }}
          name="Legacy Preset"
          size="lg"
        />
        <PersonAvatar
          avatar={{ kind: 'initials', text: 'LM', theme: 'navy' }}
          name="Lorna Macaraeg"
          size="lg"
        />
      </div>
      <FacePicker value={avatar} name="Clarisse Sy-Tan" onChange={setAvatar} showCredit />
    </div>
  );
}

function AvatarMakerDemo() {
  const [make, setMake] = useState<AvatarMake>(STARTING_MAKE);
  const [svg, setSvg] = useState<string>('');

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="size-16 overflow-hidden rounded-full bg-avatar-sky">
          {svg ? (
            <img src={avatarSvgSrc(svg)} alt="Made avatar preview" className="size-full" />
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">
          DiceBear Adventurer loads lazily only when this maker mounts.
        </p>
      </div>
      <AvatarMaker
        value={make}
        tileClassName="bg-avatar-sky"
        onChange={(nextMake, nextSvg) => {
          setMake(nextMake);
          setSvg(nextSvg);
        }}
      />
    </div>
  );
}

export function KitPatternsUi2Section() {
  return (
    <>
      <DualSurfaceShowcase
        title="YourPictureSheet & PhotoCropSheet"
        source="Compositions (UI-2, D84)"
        useFor="Settings → Account profile picture (Faces / Photo + circle cropper + credits) and every photo crop flow."
        dont="Hide the DiceBear CC-BY-4.0 credit line or apply lossy compression to payment QR codes."
        render={() => (
          <div className="flex flex-col gap-5">
            <YourPictureSheetDemo />
            <PhotoCropSheetDemo />
          </div>
        )}
      />

      <DualSurfaceShowcase
        title="PersonAvatar & FacePicker"
        source="Compositions (UI-2, food app)"
        useFor="Consistent owner and member pictures across sidebar, top bar, Settings, and booking views, with legacy preset fallback."
        dont="Load DiceBear JS on first paint (preset faces serve static WebPs)."
        render={() => <FacePickerDemo />}
      />

      <DualSurfaceShowcase
        title="AvatarMaker"
        source="Composition (UI-2, food app)"
        useFor="Piece-by-piece Adventurer face builder for member onboarding."
        dont="Mount on pages that don't need customisation."
        render={() => <AvatarMakerDemo />}
      />
    </>
  );
}
