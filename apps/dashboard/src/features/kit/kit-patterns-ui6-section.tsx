import { useState } from 'react';
import { useCreatePresentationStore } from '@diceui/pptx';
import { Button } from '@smartapp/ui/components/button';
import {
  CommandStack,
  CommandStackEmpty,
  CommandStackGroup,
  CommandStackInput,
  CommandStackItem,
  CommandStackList,
  CommandStackPage,
} from '@smartapp/ui/components/command-stack';
import { Input } from '@smartapp/ui/components/input';
import { Label } from '@smartapp/ui/components/label';
import {
  MediaPlayer,
  MediaPlayerControls,
  MediaPlayerFullscreen,
  MediaPlayerPlay,
  MediaPlayerSeek,
  MediaPlayerTime,
  MediaPlayerVideo,
  MediaPlayerVolume,
} from '@smartapp/ui/components/media-player';
import {
  Presentation,
  PresentationContent,
  PresentationError,
  PresentationLoading,
  PresentationProvider,
  PresentationSlide,
  PresentationThumbnailList,
  PresentationViewport,
} from '@smartapp/ui/components/presentation';
import {
  Tour,
  TourArrow,
  TourClose,
  TourDescription,
  TourFooter,
  TourHeader,
  TourNext,
  TourPortal,
  TourPrev,
  TourSpotlight,
  TourSpotlightRing,
  TourStep,
  TourStepCounter,
  TourTitle,
} from '@smartapp/ui/components/tour';
import { BedDoubleIcon, CalendarPlusIcon, HomeIcon, ReceiptIcon, UsersIcon } from 'lucide-react';

import { DualSurfaceShowcase } from './kit-base-tab';
import { KitVariantsSection } from './kit-variants-section';

const UNITS = ['Studio Fog', 'Loft 2B', 'Pine Room', 'Garden Suite'];
const GUESTS = ['Miguel Santos', 'Ana Reyes', 'Paolo Cruz'];

function CommandStackDemo() {
  return (
    <CommandStack className="w-full max-w-md border border-border shadow-md">
      <CommandStackInput placeholder="What do you need?" />
      <CommandStackList>
        <CommandStackEmpty>No matches. Try a unit or guest name.</CommandStackEmpty>
        <CommandStackPage value="root" label="Home">
          <CommandStackGroup heading="Go to">
            <CommandStackItem page="units">
              <BedDoubleIcon />
              Units…
            </CommandStackItem>
            <CommandStackItem page="guests">
              <UsersIcon />
              Guests…
            </CommandStackItem>
          </CommandStackGroup>
          <CommandStackGroup heading="Create">
            <CommandStackItem>
              <CalendarPlusIcon />
              New booking
            </CommandStackItem>
            <CommandStackItem>
              <ReceiptIcon />
              Record payment
            </CommandStackItem>
          </CommandStackGroup>
        </CommandStackPage>
        <CommandStackPage value="units" label="Units" placeholder="Search units">
          {UNITS.map((unit) => (
            <CommandStackItem key={unit}>
              <BedDoubleIcon />
              {unit}
            </CommandStackItem>
          ))}
        </CommandStackPage>
        <CommandStackPage value="guests" label="Guests" placeholder="Search guests">
          {GUESTS.map((guest) => (
            <CommandStackItem key={guest}>
              <UsersIcon />
              {guest}
            </CommandStackItem>
          ))}
        </CommandStackPage>
      </CommandStackList>
    </CommandStack>
  );
}

function TourDemo({ surface }: { readonly surface: 'light' | 'dark' }) {
  const [open, setOpen] = useState(false);
  const id = (name: string) => `kit-tour-${surface}-${name}`;
  return (
    <div className="space-y-4">
      <Button variant="outline" onClick={() => setOpen(true)}>
        <HomeIcon aria-hidden="true" />
        Start the Home tour
      </Button>
      <div className="grid gap-3 sm:grid-cols-3">
        <div id={id('bookings')} className="rounded-lg border border-border bg-card p-3 text-sm">
          Bookings this week
        </div>
        <div id={id('payments')} className="rounded-lg border border-border bg-card p-3 text-sm">
          Payments to check
        </div>
        <div id={id('page')} className="rounded-lg border border-border bg-card p-3 text-sm">
          Your booking page
        </div>
      </div>
      <Tour
        open={open}
        onOpenChange={setOpen}
        stepFooter={
          <TourFooter>
            <div className="flex w-full items-center justify-between">
              <TourStepCounter />
              <div className="flex gap-2">
                <TourPrev />
                <TourNext />
              </div>
            </div>
          </TourFooter>
        }
      >
        <TourPortal>
          <TourSpotlight />
          <TourSpotlightRing />
          <TourStep target={`#${id('bookings')}`} side="bottom" align="center">
            <TourArrow />
            <TourHeader>
              <TourTitle>Your bookings</TourTitle>
              <TourDescription>New and upcoming stays show here first.</TourDescription>
            </TourHeader>
            <TourClose />
          </TourStep>
          <TourStep target={`#${id('payments')}`} side="bottom" align="center">
            <TourArrow />
            <TourHeader>
              <TourTitle>Payments to check</TourTitle>
              <TourDescription>
                Approve GCash or Maya proof so the booking is confirmed.
              </TourDescription>
            </TourHeader>
            <TourClose />
          </TourStep>
          <TourStep target={`#${id('page')}`} side="bottom" align="center">
            <TourArrow />
            <TourHeader>
              <TourTitle>Your booking page</TourTitle>
              <TourDescription>Share this link so guests can book you directly.</TourDescription>
            </TourHeader>
            <TourClose />
          </TourStep>
        </TourPortal>
      </Tour>
    </div>
  );
}

function MediaPlayerDemo() {
  return (
    <MediaPlayer className="max-w-xl">
      <MediaPlayerVideo poster="/art/live.webp" aria-label="Property walk-through video" />
      <MediaPlayerControls className="flex-col items-start gap-2">
        <MediaPlayerSeek />
        <div className="flex w-full items-center gap-2">
          <MediaPlayerPlay />
          <MediaPlayerVolume expandable />
          <MediaPlayerTime />
          <div className="flex-1" />
          <MediaPlayerFullscreen />
        </div>
      </MediaPlayerControls>
    </MediaPlayer>
  );
}

function PresentationDemo({ surface }: { readonly surface: 'light' | 'dark' }) {
  const store = useCreatePresentationStore();
  const inputId = `kit-pptx-${surface}`;
  return (
    <div className="space-y-2">
      <Label htmlFor={inputId}>Open a .pptx house manual</Label>
      <Input
        id={inputId}
        type="file"
        accept=".pptx"
        className="max-w-xs"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void store.load(file).catch(() => undefined);
        }}
      />
      <PresentationProvider store={store}>
        <Presentation className="h-72 rounded-lg border border-border">
          <PresentationThumbnailList className="p-1.5" />
          <PresentationContent>
            <PresentationLoading />
            <PresentationError />
            <PresentationViewport>
              <PresentationSlide />
            </PresentationViewport>
          </PresentationContent>
        </Presentation>
      </PresentationProvider>
    </div>
  );
}

/** UI-6 pattern primitives, then the remaining variant rows. */
export function KitPatternsUi6Section() {
  return (
    <div className="space-y-6">
      <DualSurfaceShowcase
        title="CommandStack"
        source="Dice UI (offline install, UI-6)"
        useFor="The desktop command menu with drill-down pages (units, guests)."
        dont="Make it the only way to reach a screen; every item also lives in navigation."
        render={() => <CommandStackDemo />}
      />
      <DualSurfaceShowcase
        title="Tour"
        source="Dice UI (offline install, UI-6)"
        useFor="A short first-visit tour of Home, at most four steps, always skippable."
        dont="Start it on its own every visit, or block the screen with required steps."
        render={(surface) => <TourDemo surface={surface} />}
      />
      <DualSurfaceShowcase
        title="MediaPlayer"
        source="Dice UI + media-chrome (UI-6)"
        useFor="A property walk-through video on the booking page."
        dont="Autoplay with sound or load a video on the first screen."
        render={() => <MediaPlayerDemo />}
      />
      <DualSurfaceShowcase
        title="Presentation"
        source="Dice UI + @diceui/pptx (UI-6)"
        useFor="Previewing an owner's .pptx house manual before sharing it with guests."
        dont="Ask guests to download PowerPoint files; publish the manual as a page."
        render={(surface) => <PresentationDemo surface={surface} />}
      />
      <KitVariantsSection
        areas={['photos-files', 'lists', 'feedback', 'navigation', 'chat-money']}
      />
    </div>
  );
}
