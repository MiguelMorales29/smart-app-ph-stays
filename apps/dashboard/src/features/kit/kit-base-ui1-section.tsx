import {
  ActionBar,
  ActionBarClose,
  ActionBarGroup,
  ActionBarItem,
  ActionBarSelection,
  ActionBarSeparator,
} from '@smartapp/ui/components/action-bar';
import { Android } from '@smartapp/ui/components/android';
import { AspectRatio } from '@smartapp/ui/components/aspect-ratio';
import { Avatar, AvatarFallback } from '@smartapp/ui/components/avatar';
import { AvatarGroup } from '@smartapp/ui/components/avatar-group';
import { Badge } from '@smartapp/ui/components/badge';
import { BadgeOverflow } from '@smartapp/ui/components/badge-overflow';
import { Button } from '@smartapp/ui/components/button';
import {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
} from '@smartapp/ui/components/button-group';
import { ClientOnly } from '@smartapp/ui/components/client-only';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@smartapp/ui/components/collapsible';
import { Hitbox } from '@smartapp/ui/components/hitbox';
import { Pending } from '@smartapp/ui/components/pending';
import {
  QRCode,
  QRCodeCanvas,
  QRCodeDownload,
  QRCodeSkeleton,
} from '@smartapp/ui/components/qr-code';
import { SkipNav } from '@smartapp/ui/components/skip-nav';
import { Spinner } from '@smartapp/ui/components/spinner';
import { Status, StatusIndicator, StatusLabel } from '@smartapp/ui/components/status';
import { ChevronDownIcon, DownloadIcon, EyeOffIcon, HeartIcon, TagIcon, XIcon } from 'lucide-react';
import { useState } from 'react';

import { DualSurfaceShowcase } from './kit-base-tab';

const SAMPLE_AMENITIES = [
  'Fiber Wi-Fi',
  'Aircon',
  'Taal view balcony',
  'Projector & screen',
  'Coffee bar',
  'Board games',
  'Pool access',
];

function ActionBarDemo() {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen((prev) => !prev)}
        className="min-h-11 sm:min-h-9"
      >
        {open ? 'Hide floating ActionBar' : 'Preview floating ActionBar (2 selected)'}
      </Button>
      <ActionBar open={open} onOpenChange={setOpen}>
        <ActionBarSelection>
          <span className="tabular font-medium">2 units selected</span>
        </ActionBarSelection>
        <ActionBarSeparator />
        <ActionBarGroup>
          <ActionBarItem onClick={() => setOpen(false)}>
            <EyeOffIcon className="size-4" aria-hidden="true" />
            Hide
          </ActionBarItem>
          <ActionBarItem onClick={() => setOpen(false)}>
            <TagIcon className="size-4" aria-hidden="true" />
            Change price
          </ActionBarItem>
        </ActionBarGroup>
        <ActionBarClose aria-label="Clear selection">
          <XIcon className="size-4" aria-hidden="true" />
        </ActionBarClose>
      </ActionBar>
    </div>
  );
}

function CollapsibleDemo() {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="space-y-2">
      <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2">
        <span className="text-sm font-medium">House rules summary</span>
        <CollapsibleTrigger
          render={<Button type="button" variant="ghost" size="sm" className="gap-1" />}
        >
          <span>{open ? 'Show less' : 'Read more'}</span>
          <ChevronDownIcon
            aria-hidden="true"
            className={`size-4 transition-transform duration-fast ${open ? 'rotate-180' : ''}`}
          />
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="rounded-lg border border-border bg-muted/50 px-3 py-2.5 text-sm text-muted-foreground">
        Quiet hours start at 10:00 PM. Condo security asks for guest IDs 48 hours before arrival.
      </CollapsibleContent>
    </Collapsible>
  );
}

function HitboxAndPendingDemo() {
  const [debug, setDebug] = useState(true);
  const [pending, setPending] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="flex items-center gap-4">
        <Hitbox
          size="default"
          radius="full"
          debug={debug}
          render={
            <button
              type="button"
              aria-label="Favourite unit"
              className="inline-flex size-7 items-center justify-center rounded-full border border-border bg-card text-foreground"
            >
              <HeartIcon className="size-3.5" aria-hidden="true" />
            </button>
          }
        />
        <Button type="button" variant="ghost" size="sm" onClick={() => setDebug((v) => !v)}>
          {debug ? 'Hide hitbox guide' : 'Show hitbox guide'}
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Pending
          isPending={pending}
          render={
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setPending(true);
                window.setTimeout(() => setPending(false), 1200);
              }}
            >
              {pending ? (
                <>
                  <Spinner className="size-3.5" />
                  Saving…
                </>
              ) : (
                'Test Pending'
              )}
            </Button>
          }
        />
      </div>
    </div>
  );
}

/** UI-1 batch primitives shown on the dashboard `/kit` Base tab (light + dark). */
export function KitBaseUi1Section() {
  return (
    <>
      <DualSurfaceShowcase
        title="ActionBar"
        source="@diceui/action-bar · Base UI"
        useFor="Floating bulk action bar when rows or unit cards are selected."
        dont="Leave it permanently open with zero items selected."
        render={() => <ActionBarDemo />}
      />

      <DualSurfaceShowcase
        title="AspectRatio"
        source="shadcn base-nova (4.23.0)"
        useFor="Locking hero photos (4:3) and promo banners (16:9) so images load with zero layout shift."
        dont="Nest conflicting fixed heights inside AspectRatio."
        render={() => (
          <div className="grid max-w-md grid-cols-2 gap-3">
            <AspectRatio
              ratio={16 / 9}
              className="flex items-center justify-center rounded-lg border border-border bg-muted text-xs font-medium text-muted-foreground"
            >
              16 : 9 banner
            </AspectRatio>
            <AspectRatio
              ratio={4 / 3}
              className="flex items-center justify-center rounded-lg border border-border bg-muted text-xs font-medium text-muted-foreground"
            >
              4 : 3 photo
            </AspectRatio>
          </div>
        )}
      />

      <DualSurfaceShowcase
        title="AvatarGroup"
        source="@diceui/avatar-group · Base UI"
        useFor="Showing guests on a booking or team members with a +N overflow count."
        dont="Stack more than 4 avatars without a max overflow cap."
        render={() => (
          <AvatarGroup max={3} size={36}>
            {['MV', 'AL', 'JM', 'CR', 'KT'].map((initials) => (
              <Avatar key={initials}>
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            ))}
          </AvatarGroup>
        )}
      />

      <DualSurfaceShowcase
        title="BadgeOverflow"
        source="@diceui/badge-overflow · Base UI"
        useFor="Amenity chip rows that automatically collapse extra badges into +N."
        dont="Use for required statuses that must never be hidden."
        render={() => (
          <BadgeOverflow
            items={SAMPLE_AMENITIES}
            lineCount={1}
            className="max-w-full"
            renderBadge={(item) => (
              <Badge key={item} variant="secondary" className="shrink-0">
                {item}
              </Badge>
            )}
            renderOverflow={(count) => (
              <Badge variant="outline" className="shrink-0 tabular">
                +{count} more
              </Badge>
            )}
          />
        )}
      />

      <DualSurfaceShowcase
        title="ButtonGroup"
        source="shadcn base-nova (4.23.0)"
        useFor="Split actions, compact segmented action bars, and joined prefix/suffix controls."
        dont="Put more than three unrelated actions in one group."
        render={() => (
          <div className="flex flex-wrap items-center gap-3">
            <ButtonGroup>
              <Button variant="outline" size="sm">
                Listed
              </Button>
              <Button variant="outline" size="sm">
                Hidden
              </Button>
              <Button variant="outline" size="sm">
                Drafts
              </Button>
            </ButtonGroup>

            <ButtonGroup>
              <ButtonGroupText>PHP</ButtonGroupText>
              <ButtonGroupSeparator />
              <Button size="sm">Publish</Button>
            </ButtonGroup>
          </div>
        )}
      />

      <DualSurfaceShowcase
        title="Collapsible"
        source="shadcn base-nova (4.23.0)"
        useFor="Expanding long descriptions, house rules, or optional details in place."
        dont="Hide critical price or cancellation rules behind a collapsed panel."
        render={() => <CollapsibleDemo />}
      />

      <DualSurfaceShowcase
        title="Status"
        source="@diceui/status · Base UI (D35 status tokens)"
        useFor="Compact live status indicators (online, live, paused, error) with icon dot + word."
        dont="Show the pulsing dot without a text label."
        render={() => (
          <div className="flex flex-wrap items-center gap-2">
            <Status variant="success">
              <StatusIndicator />
              <StatusLabel>Live</StatusLabel>
            </Status>
            <Status variant="warning">
              <StatusIndicator />
              <StatusLabel>Needs review</StatusLabel>
            </Status>
            <Status variant="info">
              <StatusIndicator />
              <StatusLabel>Synced</StatusLabel>
            </Status>
            <Status variant="error">
              <StatusIndicator />
              <StatusLabel>Offline</StatusLabel>
            </Status>
            <Status variant="default">
              <StatusIndicator />
              <StatusLabel>Paused</StatusLabel>
            </Status>
          </div>
        )}
      />

      <DualSurfaceShowcase
        title="QRCode"
        source="@diceui/qr-code · qrcode 1.5.4"
        useFor="Shareable property page QR codes and payment QR previews with download support."
        dont="Invert QR contrast below scannable levels."
        render={() => (
          <QRCode
            value="https://smartapp.webserbisyo.com/ulap-suites"
            size={128}
            className="w-fit flex-row items-center gap-4"
          >
            <div className="rounded-xl border border-border bg-card p-2">
              <QRCodeCanvas />
              <QRCodeSkeleton />
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-foreground">Ulap Suites QR</p>
              <QRCodeDownload
                filename="ulap-suites-qr"
                render={<Button type="button" variant="outline" size="sm" className="gap-1.5" />}
              >
                <DownloadIcon className="size-3.5" aria-hidden="true" />
                Download PNG
              </QRCodeDownload>
            </div>
          </QRCode>
        )}
      />

      <DualSurfaceShowcase
        title="Hitbox & Pending"
        source="Food app primitives (Base UI useRender)"
        useFor="Hitbox expands small icon tap areas to 44 px without changing layout; Pending blocks double-clicks while keeping focus."
        dont="Shrink visual labels just to rely on invisible hitboxes."
        render={() => <HitboxAndPendingDemo />}
      />

      <DualSurfaceShowcase
        title="SkipNav, ClientOnly & Android"
        source="Food app primitives (MIT)"
        useFor="SkipNav jumps keyboard users to #main-content; ClientOnly avoids SSR mismatch for browser-only widgets; Android frames phone previews."
        dont="Render Android frames on phones where they waste screen width."
        render={() => (
          <div className="flex flex-wrap items-center gap-5">
            <div className="space-y-2">
              <SkipNav href="#main-content" className="static sr-only focus-visible:not-sr-only" />
              <p className="text-xs text-muted-foreground">
                <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">SkipNav</code>{' '}
                mounts invisibly until focused via Tab.
              </p>
              <ClientOnly fallback={<Badge variant="outline">Server fallback</Badge>}>
                <Badge variant="secondary">ClientOnly: mounted in browser</Badge>
              </ClientOnly>
            </div>
            <Android width={110} height={224} className="h-auto w-28 shrink-0" />
          </div>
        )}
      />
    </>
  );
}
