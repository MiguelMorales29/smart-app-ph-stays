import {
  SpeedDial,
  SpeedDialAction,
  SpeedDialContent,
  SpeedDialItem,
  SpeedDialLabel,
  SpeedDialTrigger,
} from '@smartapp/ui/components/speed-dial';
import { Swap, SwapOff, SwapOn } from '@smartapp/ui/components/swap';
import { Pattern as KbdExample } from '@smartapp/ui/variants/buttons/c-kbd-1';
import { Slider } from '@smartapp/ui/components/slider';
import { Pattern as ResizableExample } from '@smartapp/ui/variants/lists/c-resizable-1';
import { Pattern as MenubarExample } from '@smartapp/ui/variants/navigation/c-menubar-1';
import { Pattern as NavigationMenuExample } from '@smartapp/ui/variants/navigation/c-navigation-menu-1';
import { Pattern as PaginationExample } from '@smartapp/ui/variants/navigation/c-pagination-1';
import {
  BedDoubleIcon,
  CalendarPlusIcon,
  EyeIcon,
  EyeOffIcon,
  HeartIcon,
  PlusIcon,
  ReceiptIcon,
} from 'lucide-react';

import { DualSurfaceShowcase } from './kit-base-tab';
import { KitVariantsSection } from './kit-variants-section';

function SwapDemo() {
  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Swap
          aria-label="Show unit on booking page"
          className="size-11 rounded-lg border border-border bg-card"
        >
          <SwapOn>
            <EyeIcon className="size-5" aria-hidden="true" />
          </SwapOn>
          <SwapOff>
            <EyeOffIcon className="size-5" aria-hidden="true" />
          </SwapOff>
        </Swap>
        Shown on booking page
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Swap
          aria-label="Save this stay"
          className="size-11 rounded-lg border border-border bg-card"
        >
          <SwapOn>
            <HeartIcon className="size-5 fill-current text-destructive" aria-hidden="true" />
          </SwapOn>
          <SwapOff>
            <HeartIcon className="size-5" aria-hidden="true" />
          </SwapOff>
        </Swap>
        Saved stay
      </div>
    </div>
  );
}

function SpeedDialDemo() {
  return (
    <div className="flex min-h-48 items-end justify-end">
      <SpeedDial>
        <SpeedDialTrigger
          aria-label="Quick add"
          className="transition-transform duration-200 ease-out data-[state=open]:rotate-45"
        >
          <PlusIcon />
        </SpeedDialTrigger>
        <SpeedDialContent>
          <SpeedDialItem>
            <SpeedDialLabel>New booking</SpeedDialLabel>
            <SpeedDialAction aria-label="New booking">
              <CalendarPlusIcon />
            </SpeedDialAction>
          </SpeedDialItem>
          <SpeedDialItem>
            <SpeedDialLabel>Add unit</SpeedDialLabel>
            <SpeedDialAction aria-label="Add unit">
              <BedDoubleIcon />
            </SpeedDialAction>
          </SpeedDialItem>
          <SpeedDialItem>
            <SpeedDialLabel>Record payment</SpeedDialLabel>
            <SpeedDialAction aria-label="Record payment">
              <ReceiptIcon />
            </SpeedDialAction>
          </SpeedDialItem>
        </SpeedDialContent>
      </SpeedDial>
    </div>
  );
}

/** UI-6 base primitives, then the button and badge variant rows. */
export function KitBaseUi6Section() {
  return (
    <>
      <DualSurfaceShowcase
        title="Kbd"
        source="shadcn base-nova (offline install, UI-6) · example: ReUI c-kbd-1"
        useFor="Keyboard shortcut hints in menus and the command menu on desktop."
        dont="Show shortcuts on phone-only screens."
        render={() => <KbdExample />}
      />
      <DualSurfaceShowcase
        title="Slider"
        source="shadcn base-nova (offline install, UI-6)"
        useFor="Price range filters and the downpayment percentage."
        dont="Use it for an exact ₱ amount; pair it with a number field."
        render={() => (
          <div className="max-w-sm space-y-2">
            <p className="text-sm text-foreground">Nightly price, ₱1,500 to ₱4,000</p>
            <Slider
              aria-label="Nightly price"
              defaultValue={[1500, 4000]}
              min={500}
              max={8000}
              step={100}
            />
          </div>
        )}
      />
      <DualSurfaceShowcase
        title="Swap"
        source="Dice UI (offline install, UI-6)"
        useFor="Two-state icon buttons: show or hide a unit, save a stay."
        dont="Use it without an aria-label; the icon alone does not say what it does."
        render={() => <SwapDemo />}
      />
      <DualSurfaceShowcase
        title="SpeedDial"
        source="Dice UI (offline install, UI-6)"
        useFor="A phone-only quick-add button with two to four actions."
        dont="Put it on desktop or hide the only way to reach an action inside it."
        render={() => <SpeedDialDemo />}
      />
      <DualSurfaceShowcase
        title="Pagination"
        source="shadcn base-nova (offline install, UI-6) · example: ReUI c-pagination-1"
        useFor="Long booking and payment histories on desktop."
        dont="Page a list that fits on one screen."
        render={() => <PaginationExample />}
      />
      <DualSurfaceShowcase
        title="Resizable"
        source="shadcn base-nova + react-resizable-panels (UI-6) · example: ReUI c-resizable-1"
        useFor="Desktop split views, such as inbox list beside a conversation."
        dont="Use it on phones; stack the panes instead."
        render={() => <ResizableExample />}
      />
      <DualSurfaceShowcase
        title="Menubar · NavigationMenu"
        source="shadcn base-nova (offline install, UI-6) · examples: ReUI c-menubar-1, c-navigation-menu-1"
        useFor="Desktop-only menus on the platform marketing pages."
        dont="Replace the app sidebar or bottom dock with them."
        render={() => (
          <div className="space-y-4">
            <MenubarExample />
            <NavigationMenuExample />
          </div>
        )}
      />
      <KitVariantsSection areas={['buttons']} />
    </>
  );
}
