import { useId, useRef, useState, type ReactNode } from 'react';
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CropIcon,
  ImagePlusIcon,
  MoreHorizontalIcon,
  RotateCwIcon,
  StarIcon,
  TextIcon,
  Trash2Icon,
} from 'lucide-react';
import { Button } from '@smartapp/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@smartapp/ui/components/dropdown-menu';
import { Input } from '@smartapp/ui/components/input';
import { Progress } from '@smartapp/ui/components/progress';
import { Sortable, SortableItem, SortableItemHandle } from '@smartapp/ui/components/sortable';
import { AppSheet } from '@smartapp/ui/compositions/app-sheet';
import { useLastDefined } from '@smartapp/ui/hooks/use-last-defined';
import { cn } from '@smartapp/ui/lib/utils';

export type PhotoTileStatus = 'shrinking' | 'uploading' | 'saved' | 'error';

export interface PhotoTile {
  readonly id: string;
  /** A preview (object URL) while working, the stored photo's address once saved. */
  readonly src: string;
  readonly alt: string;
  readonly status: PhotoTileStatus;
  /** 0–100 while uploading. */
  readonly progress?: number | undefined;
  /** "4.2 MB → 180 KB" after shrinking. */
  readonly sizeNote?: string | undefined;
  /** A gentle warning, e.g. a small photo. */
  readonly warning?: string | undefined;
  /** Why it failed; shown with Retry when `canRetry`. */
  readonly error?: string | undefined;
  readonly canRetry?: boolean | undefined;
}

const ACCEPT = 'image/jpeg,image/png,image/webp';

function statusLine(tile: PhotoTile): ReactNode {
  if (tile.status === 'shrinking') return 'Shrinking…';
  if (tile.status === 'uploading') return `Uploading ${Math.round(tile.progress ?? 0)}%`;
  if (tile.status === 'error') return tile.error ?? "Couldn't upload";
  return tile.sizeNote ?? 'Saved';
}

/**
 * The listing photo grid (P4-5, D49): add, reorder by drag or by buttons (WCAG 2.5.7), make
 * cover, describe and remove. Shows each photo's progress. The app does the shrinking and
 * uploading and passes the tiles in.
 */
export function PhotoManager({
  tiles,
  max,
  minToList = 3,
  onAdd,
  onReorder,
  onAltChange,
  onAdjust,
  onRemove,
  onRetry,
  disabled,
  label = 'Photos',
}: {
  readonly tiles: readonly PhotoTile[];
  readonly max: number;
  readonly minToList?: number | undefined;
  readonly onAdd: (files: File[]) => void;
  readonly onReorder: (ids: string[]) => void;
  readonly onAltChange: (id: string, alt: string) => void;
  readonly onAdjust?: ((id: string) => void) | undefined;
  readonly onRemove: (id: string) => void;
  readonly onRetry: (id: string) => void;
  readonly disabled?: boolean | undefined;
  readonly label?: string | undefined;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hintId = useId();
  const ids = tiles.map((tile) => tile.id);
  const full = tiles.length >= max;
  const saved = tiles.filter((tile) => tile.status === 'saved').length;

  function move(id: string, to: number) {
    const from = ids.indexOf(id);
    if (from < 0 || to < 0 || to >= ids.length || from === to) return;
    const next = [...ids];
    next.splice(from, 1);
    next.splice(to, 0, id);
    onReorder(next);
  }

  const [describing, setDescribing] = useState<string | null>(null);
  // Keep the sheet's photo while it slides away (Pattern Guide §2).
  const describedId = useLastDefined(describing);
  const describedIndex = tiles.findIndex((tile) => tile.id === describedId);
  const described = describedIndex >= 0 ? tiles[describedIndex] : undefined;

  return (
    <div data-slot="photo-manager" className="flex flex-col gap-3">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          const files = [...(event.target.files ?? [])];
          event.target.value = '';
          if (files.length > 0) onAdd(files.slice(0, Math.max(0, max - tiles.length)));
        }}
      />
      <p id={hintId} className="text-sm text-muted-foreground" aria-live="polite">
        {tiles.length === 0
          ? `Add at least ${minToList} photos to list it. We suggest 5 or more.`
          : `${tiles.length} of ${max} photos. The first one is the cover. Hold and drag a photo to move it, or use its ⋯ menu.`}
        {saved > 0 && saved < minToList ? ` Add ${minToList - saved} more to list it.` : ''}
      </p>
      {/* Pattern Guide §3.9: a 3-column grid on phones; progress and errors sit inside the photo;
          description, cover and moving live in each photo's menu. */}
      <Sortable
        value={[...ids]}
        onValueChange={onReorder}
        getItemValue={(id) => id}
        strategy="grid"
        className="grid grid-cols-3 gap-2 sm:gap-3 xl:grid-cols-4"
      >
        {tiles.map((tile, index) => {
          const working = tile.status === 'shrinking' || tile.status === 'uploading';
          return (
            <SortableItem
              key={tile.id}
              value={tile.id}
              role="group"
              aria-label={`Photo ${index + 1}${index === 0 ? ', cover' : ''}`}
              tabIndex={-1}
              disabled={disabled === true}
              className="flex min-w-0 flex-col gap-1"
            >
              <figure className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">
                <img
                  src={tile.src}
                  alt={tile.alt}
                  className={cn(
                    'size-full object-cover transition-[filter] duration-slow ease-enter',
                    tile.status === 'saved' ? 'blur-0' : 'blur-sm',
                  )}
                />
                {index === 0 ? (
                  <figcaption className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-xs font-medium text-foreground">
                    <StarIcon aria-hidden="true" className="size-3" />
                    Cover
                  </figcaption>
                ) : null}
                {working ? (
                  <div className="absolute inset-x-2 bottom-2 flex flex-col gap-1">
                    <span className="self-start rounded-full bg-background/90 px-2 py-0.5 text-xs text-foreground tabular">
                      {statusLine(tile)}
                    </span>
                    {tile.status === 'uploading' ? (
                      <Progress
                        value={tile.progress ?? 0}
                        aria-label={`Uploading photo ${index + 1}`}
                      />
                    ) : null}
                  </div>
                ) : null}
                {tile.status === 'error' ? (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1 bg-background/80 p-1 text-center text-xs text-foreground">
                    <AlertTriangleIcon aria-hidden="true" className="size-4 text-destructive" />
                    <span className="line-clamp-2">{statusLine(tile)}</span>
                    {tile.canRetry ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-full pointer-coarse:h-9"
                        onClick={() => onRetry(tile.id)}
                      >
                        <RotateCwIcon aria-hidden="true" />
                        Retry
                      </Button>
                    ) : null}
                  </div>
                ) : null}
                {/* The whole photo is the drag handle: hold and drag on touch, drag with a mouse,
                    or focus it and use Space and the arrow keys. */}
                <SortableItemHandle
                  render={<button type="button" />}
                  aria-label={`Move photo ${index + 1}`}
                  className="absolute inset-0 rounded-xl outline-none [-webkit-touch-callout:none] focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-inset"
                />
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-1 z-10 size-8 rounded-full bg-background/90 hover-hover:hover:bg-background pointer-coarse:size-9"
                        aria-label={`More for photo ${index + 1}`}
                        disabled={disabled}
                      />
                    }
                  >
                    <MoreHorizontalIcon aria-hidden="true" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onAdjust ? (
                      <DropdownMenuItem disabled={working} onClick={() => onAdjust(tile.id)}>
                        <CropIcon aria-hidden="true" />
                        Adjust
                      </DropdownMenuItem>
                    ) : null}
                    <DropdownMenuItem onClick={() => setDescribing(tile.id)}>
                      <TextIcon aria-hidden="true" />
                      {tile.alt.trim() ? 'Edit description' : 'Describe photo'}
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled={index === 0} onClick={() => move(tile.id, 0)}>
                      <StarIcon aria-hidden="true" />
                      Make cover
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={index === 0}
                      onClick={() => move(tile.id, index - 1)}
                    >
                      <ArrowLeftIcon aria-hidden="true" />
                      Move earlier
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={index === tiles.length - 1}
                      onClick={() => move(tile.id, index + 1)}
                    >
                      <ArrowRightIcon aria-hidden="true" />
                      Move later
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onClick={() => onRemove(tile.id)}>
                      <Trash2Icon aria-hidden="true" />
                      Remove photo
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </figure>
              {tile.warning ? (
                <p className="line-clamp-2 flex items-start gap-1 text-xs text-foreground">
                  <AlertTriangleIcon
                    aria-hidden="true"
                    className="mt-px size-3.5 shrink-0 text-warning"
                  />
                  {tile.warning}
                </p>
              ) : null}
            </SortableItem>
          );
        })}
        {!full ? (
          <button
            type="button"
            disabled={disabled}
            aria-describedby={hintId}
            onClick={() => inputRef.current?.click()}
            className="press flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-input bg-card px-1 text-center text-xs font-medium text-muted-foreground outline-none hover-hover:hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 sm:text-sm"
          >
            <ImagePlusIcon aria-hidden="true" className="size-5" />
            {label === 'Photos' ? 'Add photos' : `Add ${label.toLowerCase()}`}
          </button>
        ) : null}
      </Sortable>

      <AppSheet
        open={describing !== null}
        onOpenChange={(next) => !next && setDescribing(null)}
        title="Describe this photo"
        description="Guests using screen readers hear this. Say what's in it, like “Bedroom with a queen bed”."
        size="sm"
        footer={
          <Button type="button" className="min-h-11" onClick={() => setDescribing(null)}>
            Done
          </Button>
        }
      >
        {described ? (
          <div className="flex flex-col gap-3">
            <img
              src={described.src}
              alt=""
              className="aspect-[4/3] w-full rounded-xl object-cover"
            />
            <label className="text-sm font-medium" htmlFor={`${described.id}-alt`}>
              Description of photo {describedIndex + 1}
            </label>
            <Input
              id={`${described.id}-alt`}
              value={described.alt}
              maxLength={160}
              placeholder="What's in this photo"
              onChange={(event) => onAltChange(described.id, event.target.value)}
            />
          </div>
        ) : null}
      </AppSheet>
    </div>
  );
}
