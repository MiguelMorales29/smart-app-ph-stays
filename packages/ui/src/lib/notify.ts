import { toast } from '@smartapp/ui/components/toast';

export interface NotifyOptions {
  readonly description?: string | undefined;
  /** Shows an Undo button; called if the person taps it. */
  readonly onUndo?: (() => void) | undefined;
  /** How long it stays, in ms (default 5 s; 10 s when there is an Undo). */
  readonly timeout?: number | undefined;
}

type Kind = 'success' | 'info' | 'warning' | 'error';

function show(kind: Kind, title: string, options: NotifyOptions = {}): string {
  const { description, onUndo, timeout } = options;
  return toast.add({
    title,
    type: kind,
    ...(description !== undefined ? { description } : {}),
    timeout: timeout ?? (onUndo ? 10_000 : 5_000),
    priority: kind === 'error' ? 'high' : 'low',
    ...(onUndo
      ? {
          actionProps: {
            children: 'Undo',
            onClick: () => {
              onUndo();
            },
          },
        }
      : {}),
  });
}

/**
 * One way to show a short message (no sonner, food app rule R35). Errors that need the person to
 * act stay in the page (Alert or ErrorState), not in a toast.
 *
 * notify.success('6 beds hidden', { onUndo: () => showBeds(ids) })
 */
export const notify = {
  success: (title: string, options?: NotifyOptions) => show('success', title, options),
  info: (title: string, options?: NotifyOptions) => show('info', title, options),
  warning: (title: string, options?: NotifyOptions) => show('warning', title, options),
  error: (title: string, options?: NotifyOptions) => show('error', title, options),
  dismiss: (id: string) => toast.close(id),
};
