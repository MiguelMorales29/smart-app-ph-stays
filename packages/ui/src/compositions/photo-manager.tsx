import { useId, useRef, type ReactNode } from 'react';
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  GripVerticalIcon,
  ImagePlusIcon,
  MoreHorizontalIcon,
  RotateCwIcon,
  StarIcon,
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
          : `${tiles.length} of ${max} photos. The first one is the cover.`}
        {saved > 0 && saved < minToList ? ` Add ${minToList - saved} more to list it.` : ''}
      </p>
      <Sortable
        value={[...ids]}
        onValueChange={onReorder}
        getItemValue={(id) => id}
        strategy="grid"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3"
      >
        {tiles.map((tile, index) => (
          <SortableItem
            key={tile.id}
            value={tile.id}
            role="group"
            tabIndex={-1}
            disabled={disabled === true}
            className="flex min-w-0 flex-col gap-2 rounded-lg border border-border bg-card p-2"
          >
            <figure className="relative aspect-[4/3] overflow-hidden rounded-md bg-muted">
              <img
                src={tile.src}
                alt={tile.alt}
                className={cn(
                  'size-full object-cover transition-[filter] duration-slow ease-enter',
                  tile.status === 'saved' ? 'blur-0' : 'blur-sm',
                )}
              />
              {index === 0 ? (
                <figcaption className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 rounded bg-background/90 px-1.5 py-0.5 text-xs font-medium text-foreground">
                  <StarIcon aria-hidden="true" className="size-3" />
                  Cover
                </figcaption>
              ) : null}
              <SortableItemHandle
                render={<button type="button" />}
                aria-label={`Drag to move photo ${index + 1}`}
                className="absolute top-1 right-1 flex size-9 cursor-grab items-center justify-center rounded-md bg-background/90 text-muted-foreground"
              >
                <GripVerticalIcon aria-hidden="true" className="size-4" />
              </SortableItemHandle>
              {tile.status === 'uploading' ? (
                <Progress
                  value={tile.progress ?? 0}
                  aria-label={`Uploading photo ${index + 1}`}
                  className="absolute inset-x-2 bottom-2"
                />
              ) : null}
            </figure>
            <div className="flex items-start gap-1.5 text-xs">
              {tile.status === 'saved' ? (
                <CheckIcon aria-hidden="true" className="mt-px size-3.5 shrink-0 text-success" />
              ) : tile.status === 'error' ? (
                <AlertTriangleIcon
                  aria-hidden="true"
                  className="mt-px size-3.5 shrink-0 text-destructive"
                />
              ) : null}
              <span
                className={cn(
                  'min-w-0 flex-1 tabular',
                  tile.status === 'error' ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {statusLine(tile)}
              </span>
            </div>
            {tile.warning ? (
              <p className="flex items-start gap-1.5 text-xs text-foreground">
                <AlertTriangleIcon
                  aria-hidden="true"
                  className="mt-px size-3.5 shrink-0 text-warning"
                />
                {tile.warning}
              </p>
            ) : null}
            <label className="sr-only" htmlFor={`${tile.id}-alt`}>
              Description of photo {index + 1}
            </label>
            <Input
              id={`${tile.id}-alt`}
              value={tile.alt}
              maxLength={160}
              disabled={disabled}
              placeholder="What's in this photo"
              onChange={(event) => onAltChange(tile.id, event.target.value)}
            />
            <div className="flex items-center gap-1">
              {tile.status === 'error' && tile.canRetry ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="min-h-11 flex-1 sm:min-h-8"
                  onClick={() => onRetry(tile.id)}
                >
                  <RotateCwIcon aria-hidden="true" />
                  Retry
                </Button>
              ) : (
                <span className="flex-1" />
              )}
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-11 sm:size-8"
                      aria-label={`More for photo ${index + 1}`}
                      disabled={disabled}
                    />
                  }
                >
                  <MoreHorizontalIcon aria-hidden="true" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem disabled={index === 0} onClick={() => move(tile.id, 0)}>
                    <StarIcon aria-hidden="true" />
                    Make cover
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled={index === 0} onClick={() => move(tile.id, index - 1)}>
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
            </div>
          </SortableItem>
        ))}
        {!full ? (
          <button
            type="button"
            disabled={disabled}
            aria-describedby={hintId}
            onClick={() => inputRef.current?.click()}
            className="flex aspect-[4/3] min-h-11 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border bg-card text-sm font-medium text-muted-foreground outline-none hover-hover:hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
          >
            <ImagePlusIcon aria-hidden="true" className="size-5" />
            {label === 'Photos' ? 'Add photos' : `Add ${label.toLowerCase()}`}
          </button>
        ) : null}
      </Sortable>
    </div>
  );
}
