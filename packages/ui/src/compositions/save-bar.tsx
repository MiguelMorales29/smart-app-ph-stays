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
import { useFormFactor } from '@smartapp/ui/hooks/use-form-factor';
import { AsyncButton, type AsyncButtonState } from '@smartapp/ui/compositions/async-button';

export interface SaveBarProps {
  /** True while the form has changes that are not saved. The bar only shows then (or while saving). */
  readonly dirty: boolean;
  readonly state: AsyncButtonState;
  readonly onSave: () => void;
  readonly onDiscard: () => void;
  readonly saveLabel?: string | undefined;
  /** How many fields or sections changed; shown as "2 changes". */
  readonly changes?: number | undefined;
  readonly message?: ReactNode;
  readonly className?: string | undefined;
  /** False disables Save (for example offline); the message says why. */
  readonly canSave?: boolean | undefined;
}

/**
 * The save pill (Pattern Guide §3.6). On phones and tablets a dark pill floats above the dock (and
 * above the keyboard); on desktop it floats under the top bar, at the right. It slides in when the
 * form changes, shows a spinner while saving and "Saved" for a moment. It also warns before the
 * tab closes.
 */
export function SaveBar({
  dirty,
  state,
  onSave,
  onDiscard,
  saveLabel = 'Save',
  changes,
  message,
  className,
  canSave = true,
}: SaveBarProps) {
  const keyboard = useKeyboardInset();
  const formFactor = useFormFactor();
  useBeforeUnloadGuard(dirty);
  const visible = dirty || state !== 'idle';
  const desktop = formFactor === 'desktop';
  const text =
    state === 'busy'
      ? 'Saving…'
      : state === 'done'
        ? 'Saved'
        : (message ?? (changes && changes > 1 ? `${changes} changes` : 'Unsaved changes'));

  return (
    <div
      data-slot="save-bar"
      data-visible={visible}
      aria-hidden={!visible}
      style={
        desktop
          ? undefined
          : {
              bottom:
                keyboard > 0
                  ? `${keyboard + 8}px`
                  : 'calc(env(safe-area-inset-bottom, 0px) + var(--dock-height) + var(--dock-offset) * 2)',
            }
      }
      className={cn(
        'fixed z-40 flex items-center gap-1 rounded-full bg-foreground py-1.5 pr-1.5 pl-4 text-background shadow-lg',
        'transition-[translate,opacity] duration-slow ease-spring',
        desktop
          ? 'top-[calc(var(--shell-header-height)+0.75rem)] right-6 min-w-80'
          : 'inset-x-3 mx-auto max-w-md',
        visible
          ? 'translate-y-0 opacity-100'
          : desktop
            ? 'pointer-events-none -translate-y-3 opacity-0'
            : 'pointer-events-none translate-y-6 opacity-0',
        className,
      )}
    >
      <p className="min-w-0 flex-1 truncate text-sm font-medium" role="status" aria-live="polite">
        {visible ? text : null}
      </p>
      <Button
        type="button"
        variant="ghost"
        className="min-h-10 rounded-full text-background hover:bg-background/15 hover:text-background"
        onClick={onDiscard}
        disabled={state === 'busy'}
        tabIndex={visible ? 0 : -1}
      >
        Discard
      </Button>
      <AsyncButton
        type="button"
        state={state}
        className="min-h-10 rounded-full px-5"
        onClick={onSave}
        disabled={!canSave}
        tabIndex={visible ? 0 : -1}
      >
        {saveLabel}
      </AsyncButton>
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
