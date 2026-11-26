import type { ReactNode } from 'react';
import { CheckIcon } from 'lucide-react';
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
 * The save pill (Pattern Guide §3.6, R-4, AUDIT-1 A19). A dark raised pill at the bottom centre on
 * every size: above the dock (and the keyboard) on phones and tablets, near the bottom edge on
 * desktop. Unsaved changes → Saving… → ✓ Saved, then it fades; once saved there is nothing left to
 * discard, so only the word stays. It also warns before the tab closes.
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
  const saved = state === 'done';
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
      style={{
        bottom: desktop
          ? '1.5rem'
          : keyboard > 0
            ? `${keyboard + 8}px`
            : 'calc(env(safe-area-inset-bottom, 0px) + var(--dock-height) + var(--dock-offset) * 2)',
      }}
      className={cn(
        // Light: navy pill. Dark: the raised layer with a hairline, never a white pill on a dark page.
        'fixed inset-x-3 z-40 mx-auto flex min-h-13 max-w-md items-center gap-1 rounded-full py-1.5 pr-1.5 pl-4 shadow-lg max-sm:pl-3.5',
        'bg-foreground text-background dark:border dark:border-border dark:bg-raised dark:text-foreground',
        'transition-[translate,opacity] duration-slow ease-spring',
        desktop && 'md:left-[var(--sidebar-width,0px)]',
        saved && 'w-fit pr-4',
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-6 opacity-0',
        className,
      )}
    >
      <p
        className="flex min-w-0 flex-1 items-center gap-1.5 truncate text-sm font-medium"
        role="status"
        aria-live="polite"
      >
        {saved ? <CheckIcon aria-hidden="true" className="size-4 shrink-0" /> : null}
        {visible ? text : null}
      </p>
      {saved ? null : (
        <>
          <Button
            type="button"
            variant="ghost"
            className="min-h-10 rounded-full px-3 text-current hover:bg-current/15 hover:text-current"
            onClick={onDiscard}
            disabled={state === 'busy'}
            tabIndex={visible ? 0 : -1}
          >
            Discard
          </Button>
          <AsyncButton
            type="button"
            state={state}
            className="min-h-10 rounded-full px-5 max-sm:px-4"
            onClick={onSave}
            disabled={!canSave}
            tabIndex={visible ? 0 : -1}
          >
            {saveLabel}
          </AsyncButton>
        </>
      )}
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
