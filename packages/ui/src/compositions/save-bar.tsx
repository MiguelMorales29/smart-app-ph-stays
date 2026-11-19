import type { ReactNode } from 'react';
import { cn } from 'cn';
import { Button } from '@smartapp/ui/components/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@smartapp/ui/components/alert-dialog';
import { useKeyboardInset } from '@smartapp/ui/hooks/use-keyboard-inset';
import { useBeforeUnloadGuard } from '@smartapp/ui/hooks/use-before-unload-guard';
import { AsyncButton, type AsyncButtonState } from '@smartapp/ui/compositions/async-button';

export interface SaveBarProps {
  /** True while the form has changes that are not saved. The bar only shows then (or while saving). */
  readonly dirty: boolean;
  readonly state: AsyncButtonState;
  readonly onSave: () => void;
  readonly onDiscard: () => void;
  readonly saveLabel?: string | undefined;
  readonly message?: ReactNode;
  readonly className?: string | undefined;
  /** False disables Save (for example offline); the message says why. */
  readonly canSave?: boolean | undefined;
}

/**
 * A sticky bar (at least 44 px) with "Unsaved changes", Discard and Save. It sits above the
 * phone dock (--dock-h) and lifts above the iPhone keyboard. It also warns before the tab closes.
 */
export function SaveBar({
  dirty,
  state,
  onSave,
  onDiscard,
  saveLabel = 'Save changes',
  message = 'Unsaved changes',
  className,
  canSave = true,
}: SaveBarProps) {
  const keyboard = useKeyboardInset();
  useBeforeUnloadGuard(dirty);
  const visible = dirty || state !== 'idle';

  return (
    <div
      data-slot="save-bar"
      data-visible={visible}
      aria-hidden={!visible}
      style={{ bottom: keyboard > 0 ? `${keyboard}px` : undefined }}
      className={cn(
        'sticky bottom-0 z-20 -mx-4 mt-6 border-t border-border bg-raised/95 px-4 py-2 backdrop-blur supports-backdrop-filter:bg-raised/85',
        'transition-[opacity,translate] duration-base ease-enter',
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0',
        className,
      )}
    >
      <div className="mx-auto flex min-h-11 max-w-3xl items-center gap-2">
        <p className="min-w-0 flex-1 truncate text-sm text-muted-foreground" role="status">
          {state === 'idle' ? message : null}
        </p>
        <Button
          type="button"
          variant="ghost"
          className="min-h-11"
          onClick={onDiscard}
          disabled={state === 'busy'}
          tabIndex={visible ? 0 : -1}
        >
          Discard
        </Button>
        <AsyncButton
          type="button"
          state={state}
          className="min-h-11 px-4"
          onClick={onSave}
          disabled={!canSave}
          tabIndex={visible ? 0 : -1}
        >
          {saveLabel}
        </AsyncButton>
      </div>
    </div>
  );
}

/** The "Leave without saving?" question, driven by the app's router blocker. */
export function LeaveGuardDialog({
  open,
  onStay,
  onLeave,
}: {
  readonly open: boolean;
  readonly onStay: () => void;
  readonly onLeave: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => (next ? undefined : onStay())}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Leave without saving?</AlertDialogTitle>
          <AlertDialogDescription>Your changes on this page will be lost.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onStay}>Keep editing</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onLeave}>
            Leave
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
