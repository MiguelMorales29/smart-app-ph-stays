import type { ReactNode } from 'react';
import { XIcon } from 'lucide-react';
import { Button } from '@smartapp/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@smartapp/ui/components/dialog';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerVirtualKeyboardProvider,
} from '@smartapp/ui/components/drawer';
import { useFormFactor } from '@smartapp/ui/hooks/use-form-factor';
import { useScrollFades } from '@smartapp/ui/hooks/use-scroll-fades';
import { cn } from '@smartapp/ui/lib/utils';

export type AppSheetHeight = 'half' | 'full' | 'fit';

export interface AppSheetProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly title: ReactNode;
  readonly description?: ReactNode | undefined;
  readonly children: ReactNode;
  /**
   * Pinned at the bottom (phones) or the dialog's foot (desktop): usually Cancel and the main button.
   * Mark Cancel with `data-sheet-cancel`: phones hide it, because the sheet's Close button and a
   * swipe down already cancel, and one pinned button keeps the form visible (Pattern Guide §3.1).
   */
  readonly footer?: ReactNode | undefined;
  /**
   * Phones only. `half` opens at half height and drags to full (short pickers); `full` opens tall
   * (forms); `fit` sizes to the content up to the screen.
   */
  readonly height?: AppSheetHeight | undefined;
  /** Desktop dialog width. */
  readonly size?: 'sm' | 'md' | 'lg' | undefined;
  readonly className?: string | undefined;
}

const DIALOG_WIDTH = { sm: 'sm:max-w-sm', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl' } as const;

/**
 * The one sheet pattern (Pattern Guide §3.1): a drawer on phones and tablets, a dialog on desktop.
 * On phones it has a grabber, Close top-left, a body that scrolls with edge fades, and a footer
 * pinned above the home indicator that stays above the keyboard. The sheet stays mounted until its
 * close animation ends; if its data is cleared on close, wrap that data in useLastDefined() so the
 * content doesn't change while it slides away (Pattern Guide §2).
 */
export function AppSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  height = 'fit',
  size = 'md',
  className,
}: AppSheetProps) {
  const formFactor = useFormFactor();
  const fadesRef = useScrollFades<HTMLDivElement>();

  const shown = { title, description, children, footer };

  if (formFactor === 'desktop') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton={false}
          className={cn(
            'flex max-h-[min(85dvh,52rem)] flex-col gap-0 p-0',
            DIALOG_WIDTH[size],
            className,
          )}
        >
          <div className="flex items-start gap-3 px-5 pt-5 pb-3">
            <div className="min-w-0 flex-1 space-y-1">
              <DialogTitle className="font-heading text-lg font-semibold">
                {shown.title}
              </DialogTitle>
              {shown.description ? (
                <DialogDescription className="text-sm text-muted-foreground">
                  {shown.description}
                </DialogDescription>
              ) : null}
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close"
              onClick={() => onOpenChange(false)}
            >
              <XIcon aria-hidden="true" />
            </Button>
          </div>
          <div
            ref={fadesRef}
            className="scroll-fades min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4"
          >
            {shown.children}
          </div>
          {shown.footer ? (
            <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-border px-5 py-3">
              {shown.footer}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    );
  }

  const snapPoints = height === 'half' ? [0.5, 1] : undefined;

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      showSwipeHandle
      {...(snapPoints ? { snapPoints, defaultSnapPoint: 0.5 } : {})}
    >
      <DrawerVirtualKeyboardProvider>
        <DrawerContent
          data-height={height}
          className={cn(
            'rounded-t-3xl border-0 bg-popover shadow-lg data-[height=full]:[--drawer-content-height:calc(100dvh-3rem)]',
            className,
          )}
        >
          <div className="grid shrink-0 grid-cols-[2.75rem_1fr_2.75rem] items-center px-3 pt-1 pb-2">
            <DrawerClose
              render={
                <Button
                  variant="secondary"
                  size="icon"
                  className="size-10 rounded-full"
                  aria-label="Close"
                />
              }
            >
              <XIcon aria-hidden="true" />
            </DrawerClose>
            <DrawerTitle className="truncate text-center font-heading text-base font-semibold">
              {shown.title}
            </DrawerTitle>
            <span aria-hidden="true" />
          </div>
          {shown.description ? (
            <DrawerDescription className="shrink-0 px-5 pb-2 text-center text-sm text-muted-foreground">
              {shown.description}
            </DrawerDescription>
          ) : null}
          <div
            ref={fadesRef}
            data-base-ui-swipe-ignore="y"
            className="scroll-fades min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain px-4 pb-4"
          >
            {shown.children}
          </div>
          {shown.footer ? (
            <div
              data-slot="app-sheet-footer"
              className="flex shrink-0 flex-col gap-2 border-t border-border bg-popover px-4 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+var(--drawer-keyboard-inset,0px)+0.75rem)] transition-transform duration-slow ease-enter [transform:translateY(calc(-1*var(--drawer-snap-point-offset,0px)))] [&>*]:min-h-12 [&>*]:w-full [&>[data-sheet-cancel]]:hidden sm:flex-row sm:justify-end sm:[&>*]:w-auto"
            >
              {shown.footer}
            </div>
          ) : null}
        </DrawerContent>
      </DrawerVirtualKeyboardProvider>
    </Drawer>
  );
}
