'use client';

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from '@smartapp/ui/components/drawer';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@smartapp/ui/components/sheet';
import { cn } from 'cn';
import * as React from 'react';

import { useFormFactor } from '../hooks/use-form-factor';
import { cssVars } from '../lib/css-vars';
import { ScrollHint } from './scroll-hint';

export interface ResponsiveSheetProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  /** Accessible panel title; visible header can be passed via `header`. */
  readonly title: string;
  readonly description?: string | undefined;
  readonly header?: React.ReactNode | undefined;
  readonly footer?: React.ReactNode | undefined;
  readonly children: React.ReactNode;
  readonly className?: string | undefined;
}

const PHONE_SNAPS = [0.5, 1];
const FULL = 1;
type SnapPoint = number | string | null;

/**
 * Side inspector panel (ported from food app; distinct from `AppSheet` which uses a centred dialog
 * on desktop): right-hand `Sheet` on tablet/desktop and snapping bottom `Drawer` on phones.
 */
export function ResponsiveSheet({
  open,
  onOpenChange,
  title,
  description,
  header,
  footer,
  children,
  className,
}: ResponsiveSheetProps) {
  const formFactor = useFormFactor();
  const phone = formFactor === 'phone';
  const [snap, setSnap] = React.useState<SnapPoint>(FULL);
  const [wasOpen, setWasOpen] = React.useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setSnap(FULL);
  }

  const body = (
    <ScrollHint className={phone ? 'drawer-snap-room' : undefined}>{children}</ScrollHint>
  );

  const foot = footer ? (
    <div
      className={cn(
        'shrink-0 border-t border-border bg-popover px-4 py-3 pb-safe',
        phone && 'drawer-snap-lift relative z-10',
      )}
    >
      {footer}
    </div>
  ) : null;

  if (phone) {
    return (
      <Drawer
        open={open}
        onOpenChange={onOpenChange}
        showSwipeHandle
        snapPoints={PHONE_SNAPS}
        snapToSequentialPoints
        snapPoint={snap}
        onSnapPointChange={(next) => setSnap(next)}
      >
        <DrawerContent
          className={cn('overflow-hidden pt-safe', className)}
          style={cssVars({
            '--drawer-content-max-height': '100dvh',
            '--sheet-lift':
              typeof snap === 'number' && snap < FULL ? `${(FULL - snap) * 100}dvh` : '0px',
          })}
        >
          <DrawerTitle className="sr-only">{title}</DrawerTitle>
          {description ? (
            <DrawerDescription className="sr-only">{description}</DrawerDescription>
          ) : null}
          {header}
          {body}
          {foot}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className={cn(
          'gap-0 overflow-hidden p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-md data-[side=right]:lg:max-w-lg',
          className,
        )}
      >
        <SheetTitle className="sr-only">{title}</SheetTitle>
        {description ? (
          <SheetDescription className="sr-only">{description}</SheetDescription>
        ) : null}
        {header}
        {body}
        {foot}
      </SheetContent>
    </Sheet>
  );
}
