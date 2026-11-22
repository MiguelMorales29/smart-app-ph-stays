'use client';

import * as React from 'react';
import { CameraIcon, MinusIcon, PlusIcon } from 'lucide-react';
import { faceWords, resolveProfileAvatar, type ProfileAvatar } from '@smartapp/core';
import { Button } from '@smartapp/ui/components/button';
import { ButtonGroup, ButtonGroupText } from '@smartapp/ui/components/button-group';
import {
  Cropper,
  CropperArea,
  CropperImage,
  type CropperAreaData,
} from '@smartapp/ui/components/cropper';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@smartapp/ui/components/tabs';
import { AppSheet } from '@smartapp/ui/compositions/app-sheet';
import { AsyncButton } from '@smartapp/ui/compositions/async-button';
import { FacePicker } from '@smartapp/ui/compositions/face-picker';
import { PersonAvatar } from '@smartapp/ui/compositions/person-avatar';

const TABS = ['faces', 'photo'] as const;
type Tab = (typeof TABS)[number];

const ACCEPT = 'image/jpeg,image/png,image/webp';
const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const FIRST_FACE: ProfileAvatar = { kind: 'face', style: 'soft', face: 1, theme: 'sky' };

export interface CroppedPhotoResult {
  readonly fileId: string;
  readonly previewUrl: string;
}

export interface YourPictureSheetProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly name: string;
  readonly current: ProfileAvatar | null;
  readonly photoSrc?: ((fileId: string) => string | null) | undefined;
  /**
   * Crops, compresses (256 px), and uploads the picked photo, returning its file id and preview
   * URL. Runs inside the Photo tab when the user taps "Use this photo".
   */
  readonly onUploadPhoto: (file: File, area: CropperAreaData) => Promise<CroppedPhotoResult>;
  /** Saves the picked face, customised face, initials, or uploaded photo. */
  readonly onSave: (avatar: ProfileAvatar, photoPreviewUrl: string | null) => Promise<void>;
}

/**
 * The "Your picture" sheet (ported from the food app): Faces (7 styles × 12 faces, Customise this
 * face, Surprise me, 8 background colours, or initials) and Photo (pick a photo, circle Dice UI
 * Cropper with zoom, "We keep a 256 px copy"), plus the required DiceBear CC-BY-4.0 credit line.
 */
export function YourPictureSheet({
  open,
  onOpenChange,
  name,
  current,
  photoSrc,
  onUploadPhoto,
  onSave,
}: YourPictureSheetProps) {
  const formId = React.useId();
  const [saving, setSaving] = React.useState(false);
  const [canSave, setCanSave] = React.useState(true);

  return (
    <AppSheet
      open={open}
      onOpenChange={onOpenChange}
      size="md"
      height="full"
      title="Your picture"
      description="Pick a face and change any piece, or upload your own photo."
      footer={
        <>
          <Button
            type="button"
            data-sheet-cancel=""
            variant="outline"
            className="min-h-11"
            disabled={saving}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <AsyncButton
            type="submit"
            form={formId}
            className="min-h-11"
            state={saving ? 'busy' : 'idle'}
            disabled={!canSave}
          >
            Use this picture
          </AsyncButton>
        </>
      }
    >
      {open ? (
        <YourPictureBody
          formId={formId}
          name={name}
          current={current}
          photoSrc={photoSrc}
          onUploadPhoto={onUploadPhoto}
          onSave={onSave}
          onSavingChange={setSaving}
          onCanSaveChange={setCanSave}
          onClose={() => onOpenChange(false)}
        />
      ) : null}
    </AppSheet>
  );
}

function YourPictureBody({
  formId,
  name,
  current,
  photoSrc,
  onUploadPhoto,
  onSave,
  onSavingChange,
  onCanSaveChange,
  onClose,
}: {
  readonly formId: string;
  readonly name: string;
  readonly current: ProfileAvatar | null;
  readonly photoSrc?: ((fileId: string) => string | null) | undefined;
  readonly onUploadPhoto: (file: File, area: CropperAreaData) => Promise<CroppedPhotoResult>;
  readonly onSave: (avatar: ProfileAvatar, photoPreviewUrl: string | null) => Promise<void>;
  readonly onSavingChange: (saving: boolean) => void;
  readonly onCanSaveChange: (canSave: boolean) => void;
  readonly onClose: () => void;
}) {
  const initialResolved = React.useMemo(() => resolveProfileAvatar(current), [current]);
  const [tab, setTab] = React.useState<Tab>(() =>
    initialResolved.kind === 'photo' ? 'photo' : 'faces',
  );
  const [face, setFace] = React.useState<ProfileAvatar>(() =>
    initialResolved.kind === 'photo' ? FIRST_FACE : initialResolved,
  );
  const [photo, setPhoto] = React.useState<{
    readonly avatar: ProfileAvatar;
    readonly previewUrl: string;
  } | null>(() =>
    initialResolved.kind === 'photo'
      ? {
          avatar: initialResolved,
          previewUrl: photoSrc?.(initialResolved.file_id) ?? '',
        }
      : null,
  );
  const [saveError, setSaveError] = React.useState<string | null>(null);

  React.useEffect(() => {
    onCanSaveChange(!(tab === 'photo' && photo === null));
  }, [tab, photo, onCanSaveChange]);

  const draft = tab === 'photo' && photo ? photo.avatar : face;
  const resolvePreview = (fileId: string): string | null => {
    if (
      photo &&
      photo.avatar.kind === 'photo' &&
      photo.avatar.file_id === fileId &&
      photo.previewUrl
    ) {
      return photo.previewUrl;
    }
    return photoSrc?.(fileId) ?? null;
  };

  async function handleSave() {
    onSavingChange(true);
    setSaveError(null);
    try {
      await onSave(
        draft,
        draft.kind === 'photo' ? (photo?.previewUrl ?? resolvePreview(draft.file_id)) : null,
      );
      onClose();
    } catch (caught) {
      setSaveError(caught instanceof Error ? caught.message : "Couldn't save your picture.");
    } finally {
      onSavingChange(false);
    }
  }

  return (
    <form
      id={formId}
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        void handleSave();
      }}
    >
      <div className="flex justify-center">
        <PersonAvatar
          avatar={draft}
          name={name}
          photoSrc={resolvePreview}
          className="size-24 text-2xl shadow-md ring-4 ring-background"
        />
      </div>

      <Tabs
        value={tab}
        onValueChange={(value) => {
          const next = TABS.find((t) => t === value);
          if (next) setTab(next);
        }}
        className="gap-4"
      >
        <TabsList className="grid w-full grid-cols-2 group-data-horizontal/tabs:h-auto">
          <TabsTrigger value="faces" className="h-11 md:h-9">
            Faces
          </TabsTrigger>
          <TabsTrigger value="photo" className="h-11 md:h-9">
            Photo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="faces">
          <FacePicker value={face} name={name} onChange={setFace} />
        </TabsContent>

        <TabsContent value="photo">
          <PhotoTab
            onUploadPhoto={onUploadPhoto}
            onPicked={(result) =>
              setPhoto({
                avatar: { kind: 'photo', file_id: result.fileId },
                previewUrl: result.previewUrl,
              })
            }
          />
        </TabsContent>
      </Tabs>

      {saveError ? (
        <p role="alert" className="text-sm text-destructive">
          {saveError}
        </p>
      ) : null}

      {/* D84: CC-BY-4.0 artwork credit always shown wherever these faces can be picked. */}
      <p className="text-xs text-muted-foreground">{faceWords.credit}</p>
    </form>
  );
}

function PhotoTab({
  onUploadPhoto,
  onPicked,
}: {
  readonly onUploadPhoto: (file: File, area: CropperAreaData) => Promise<CroppedPhotoResult>;
  readonly onPicked: (result: CroppedPhotoResult) => void;
}) {
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [pickedFile, setPickedFile] = React.useState<File | null>(null);
  const [source, setSource] = React.useState<string | null>(null);
  const [crop, setCrop] = React.useState({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);
  const [area, setArea] = React.useState<CropperAreaData | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [cropping, setCropping] = React.useState(false);

  React.useEffect(
    () => () => {
      if (source) URL.revokeObjectURL(source);
    },
    [source],
  );

  async function apply() {
    if (!pickedFile || !area) return;
    setCropping(true);
    setError(null);
    try {
      const done = await onUploadPhoto(pickedFile, area);
      onPicked(done);
      setSource(null);
      setPickedFile(null);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Couldn't read this photo. Pick another one.",
      );
    } finally {
      setCropping(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Fit your photo in the circle. We keep a 256 px copy.
      </p>
      <input
        ref={fileRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          setError(null);
          if (!file) return;
          const lower = file.type.toLowerCase();
          if (
            lower === 'image/heic' ||
            lower === 'image/heif' ||
            /\.(heic|heif)$/i.test(file.name)
          ) {
            setError("This iPhone photo (HEIC) can't be opened here. Pick a JPEG, PNG or WebP.");
            return;
          }
          if (!['image/jpeg', 'image/png', 'image/webp'].includes(lower)) {
            setError('Use a JPEG, PNG or WebP photo.');
            return;
          }
          if (file.size > MAX_UPLOAD_BYTES) {
            setError('This photo is over 15 MB. Pick a smaller one.');
            return;
          }
          setCrop({ x: 0, y: 0 });
          setZoom(1);
          setArea(null);
          setPickedFile(file);
          setSource(URL.createObjectURL(file));
        }}
      />
      {source ? (
        <>
          <div className="relative h-64 overflow-hidden rounded-xl bg-muted">
            <Cropper
              aspectRatio={1}
              shape="circle"
              crop={crop}
              zoom={zoom}
              minZoom={MIN_ZOOM}
              maxZoom={MAX_ZOOM}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropAreaChange={(_, pixels) => setArea(pixels)}
              role="group"
              aria-label="Photo crop area"
              className="size-full"
            >
              <CropperImage src={source} alt="" />
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
              onClick={() => setZoom((z) => Math.max(MIN_ZOOM, Number((z - 0.25).toFixed(2))))}
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
              onClick={() => setZoom((z) => Math.min(MAX_ZOOM, Number((z + 0.25).toFixed(2))))}
            >
              <PlusIcon aria-hidden="true" />
            </Button>
          </ButtonGroup>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="min-h-11 flex-1"
              disabled={cropping}
              onClick={() => {
                setSource(null);
                setPickedFile(null);
              }}
            >
              Back
            </Button>
            <AsyncButton
              type="button"
              state={cropping ? 'busy' : 'idle'}
              className="min-h-11 flex-1"
              disabled={!area || cropping}
              onClick={() => void apply()}
            >
              Use this photo
            </AsyncButton>
          </div>
        </>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="min-h-11 self-start"
          onClick={() => fileRef.current?.click()}
        >
          <CameraIcon aria-hidden="true" />
          Pick a photo
        </Button>
      )}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
