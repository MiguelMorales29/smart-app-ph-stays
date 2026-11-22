import { useEffect, useState } from 'react';
import { guestAvatarChoices, guestFaceWords } from '@smartapp/core';
import { Avatar, AvatarImage } from '@smartapp/ui/components/avatar';
import { Badge } from '@smartapp/ui/components/badge';
import { Button } from '@smartapp/ui/components/button';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@smartapp/ui/components/hover-card';
import { RelativeTimeCard } from '@smartapp/ui/components/relative-time-card';
import { FileType } from '@smartapp/ui/components/reui/file-type';
import {
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from '@smartapp/ui/components/reui/frame';
import { IconStack } from '@smartapp/ui/components/reui/icon-stack';
import { IconTile } from '@smartapp/ui/components/reui/icon-tile';
import {
  Timeline,
  TimelineContent,
  TimelineDate,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
} from '@smartapp/ui/components/reui/timeline';
import {
  createTree,
  expandAllFeature,
  hotkeysCoreFeature,
  selectionFeature,
  syncDataLoaderFeature,
  Tree,
  TreeItem,
  TreeItemLabel,
  type TreeState,
} from '@smartapp/ui/components/reui/tree';
import { Stack, StackItem } from '@smartapp/ui/components/stack';
import {
  BedDoubleIcon,
  Building2Icon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  HomeIcon,
  ReceiptTextIcon,
  ShieldCheckIcon,
} from 'lucide-react';

import { DualSurfaceShowcase } from './kit-base-tab';

interface PropertyTreeItem {
  readonly name: string;
  readonly children?: readonly string[];
}

const TREE_ITEMS: Record<string, PropertyTreeItem> = {
  root: { name: 'All properties', children: ['ulap', 'bahay'] },
  ulap: { name: 'Ulap Suites · Tagaytay', children: ['studio-fog', 'taal-1br'] },
  'studio-fog': { name: 'Studio Fog · ₱2,600 / night' },
  'taal-1br': { name: '1BR Taal View · ₱3,400 / night' },
  bahay: { name: 'Bahay Batis · Pansol', children: ['river-loft'] },
  'river-loft': { name: 'River Loft · ₱5,200 / night' },
};

const SAMPLE_BOOKING_TIME = new Date('2026-12-10T02:15:00Z');

function PropertyTreeDemo() {
  const [treeState, setTreeState] = useState<Partial<TreeState<PropertyTreeItem>>>({
    expandedItems: ['ulap'],
    selectedItems: ['studio-fog'],
  });

  const [tree] = useState(() =>
    createTree<PropertyTreeItem>({
      rootItemId: 'root',
      getItemName: (item) => item.getItemData().name,
      isItemFolder: (item) => (item.getItemData().children?.length ?? 0) > 0,
      dataLoader: {
        getItem: (id) => TREE_ITEMS[id] ?? { name: id },
        getChildren: (id) => [...(TREE_ITEMS[id]?.children ?? [])],
      },
      features: [syncDataLoaderFeature, selectionFeature, hotkeysCoreFeature, expandAllFeature],
    }),
  );

  useEffect(() => {
    tree.setConfig((prev) => ({
      ...prev,
      state: treeState,
      setState: (updater) =>
        setTreeState((current) => (typeof updater === 'function' ? updater(current) : updater)),
    }));
  }, [tree, treeState]);

  const items = tree.getItems();

  return (
    <Tree tree={tree} indent={18} toggleIconType="chevron" aria-label="Properties and units">
      {items.map((item) => (
        <TreeItem key={item.getId()} item={item}>
          <TreeItemLabel>
            {item.isFolder() ? (
              <Building2Icon className="size-3.5 text-muted-foreground" aria-hidden="true" />
            ) : (
              <BedDoubleIcon className="size-3.5 text-muted-foreground" aria-hidden="true" />
            )}
            <span className="truncate">{item.getItemName()}</span>
          </TreeItemLabel>
        </TreeItem>
      ))}
    </Tree>
  );
}

/** UI-3 base & display components rendered in Dashboard `/kit` Base tab. */
export function KitBaseUi3Section() {
  const toonFaces = guestAvatarChoices('toon').slice(0, 6);
  const smileFaces = guestAvatarChoices('smile').slice(0, 6);

  return (
    <div className="space-y-6">
      <DualSurfaceShowcase
        title="Frame, IconTile & IconStack"
        source="@reui/frame · @reui/icon-tile · @reui/icon-stack"
        useFor="Grouped settings panels, structured summary frames, icon tiles and empty-state artwork."
        dont="Wrap every card on a screen inside a double Frame; reserve Frame for grouped sections."
        render={() => (
          <div className="space-y-4">
            <Frame spacing="sm">
              <FrameHeader>
                <FrameTitle>Payout details</FrameTitle>
                <FrameDescription>Shown to guests only after they hold dates.</FrameDescription>
              </FrameHeader>
              <FramePanel>
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-medium">GCash · 0917 812 4401</span>
                  <Badge variant="secondary">Verified</Badge>
                </div>
              </FramePanel>
              <FrameFooter>
                <p className="text-xs text-muted-foreground">Updated 10 Dec 2026, Manila time</p>
              </FrameFooter>
            </Frame>
            <div className="flex flex-wrap items-center gap-3">
              <IconTile variant="outline">
                <HomeIcon aria-hidden="true" />
              </IconTile>
              <IconTile variant="elevated">
                <CalendarDaysIcon aria-hidden="true" />
              </IconTile>
              <IconTile variant="soft">
                <ReceiptTextIcon aria-hidden="true" />
              </IconTile>
              <IconTile variant="solid">
                <ShieldCheckIcon aria-hidden="true" />
              </IconTile>
              <IconTile variant="frame">
                <CheckCircle2Icon aria-hidden="true" />
              </IconTile>
              <IconStack>
                <ReceiptTextIcon className="size-5" aria-hidden="true" />
              </IconStack>
            </div>
          </div>
        )}
      />

      <DualSurfaceShowcase
        title="FileType"
        source="@reui/file-type · semantic tokens"
        useFor="Showing attachment types for payment proofs, signed leases, house rules PDFs and exports."
        dont="Override file badges with raw Tailwind palette classes."
        render={() => (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <FileType type="pdf" />
              <FileType type="jpg" />
              <FileType type="xlsx" />
              <FileType type="docx" />
              <FileType type="zip" />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <FileType type="pdf" variant="light" />
              <FileType type="xlsx" variant="solid" />
              <FileType type="jpg" variant="mono" />
              <FileType type="document" glyph />
            </div>
          </div>
        )}
      />

      <DualSurfaceShowcase
        title="Timeline"
        source="@reui/timeline · Base UI"
        useFor="Booking activity history, payment verification trail, and approval milestones."
        dont="Use Timeline for multi-step form navigation (use Stepper instead)."
        render={() => (
          <Timeline defaultValue={3}>
            <TimelineItem step={1}>
              <TimelineHeader>
                <TimelineSeparator />
                <TimelineDate>10 Dec · 9:10 AM</TimelineDate>
                <TimelineTitle>Dates held by Miguel Santos</TimelineTitle>
                <TimelineIndicator />
              </TimelineHeader>
              <TimelineContent>Studio Fog · 12–14 Dec (2 nights)</TimelineContent>
            </TimelineItem>
            <TimelineItem step={2}>
              <TimelineHeader>
                <TimelineSeparator />
                <TimelineDate>10 Dec · 9:24 AM</TimelineDate>
                <TimelineTitle>GCash payment proof sent</TimelineTitle>
                <TimelineIndicator />
              </TimelineHeader>
              <TimelineContent>₱2,850 down payment uploaded</TimelineContent>
            </TimelineItem>
            <TimelineItem step={3}>
              <TimelineHeader>
                <TimelineSeparator />
                <TimelineDate>10 Dec · 9:40 AM</TimelineDate>
                <TimelineTitle>Booking confirmed</TimelineTitle>
                <TimelineIndicator />
              </TimelineHeader>
              <TimelineContent>Wallet checked and receipt issued</TimelineContent>
            </TimelineItem>
            <TimelineItem step={4}>
              <TimelineHeader>
                <TimelineDate>12 Dec · 2:00 PM</TimelineDate>
                <TimelineTitle>Check-in</TimelineTitle>
                <TimelineIndicator />
              </TimelineHeader>
              <TimelineContent>Arrival instructions sent 24 hours before</TimelineContent>
            </TimelineItem>
          </Timeline>
        )}
      />

      <DualSurfaceShowcase
        title="Tree"
        source="@reui/tree · @headless-tree/core 1.8.0"
        useFor="Hierarchical property-to-unit switchers and grouped room/bed trees (Phase 8)."
        dont="Use Tree for flat single-level navigation lists."
        render={() => <PropertyTreeDemo />}
      />

      <DualSurfaceShowcase
        title="HoverCard & RelativeTimeCard"
        source="shadcn hover-card · @diceui/relative-time-card"
        useFor="Compact timestamps ('2 hours ago') with exact Manila and UTC times on hover or focus."
        dont="Hide essential booking dates inside a hover-only card on phones."
        render={() => (
          <div className="flex flex-wrap items-center gap-4">
            <HoverCard>
              <HoverCardTrigger render={<Button variant="outline" size="sm" />}>
                Ulap Suites summary
              </HoverCardTrigger>
              <HoverCardContent>
                <div className="space-y-1">
                  <p className="text-sm font-semibold">Ulap Suites · Tagaytay</p>
                  <p className="text-xs text-muted-foreground">
                    8 listed units · Instant confirmation on verified down payment.
                  </p>
                </div>
              </HoverCardContent>
            </HoverCard>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Proof received:</span>
              <RelativeTimeCard
                date={SAMPLE_BOOKING_TIME}
                timezones={['Asia/Manila', 'UTC']}
                className="font-medium text-foreground underline decoration-dotted underline-offset-4"
              />
            </div>
          </div>
        )}
      />

      <DualSurfaceShowcase
        title="Stack"
        source="@diceui/stack · Base UI"
        useFor="Stacked booking notices or recent activity cards that fan out on hover or tap."
        dont="Stack critical errors that require immediate reading without expanding."
        render={() => (
          <div className="pt-2 pb-16">
            <Stack expandOnHover itemCount={3} gap={8} offset={10} side="top" className="h-24">
              <StackItem>
                <p className="text-sm font-medium">Payment proof waiting · Studio Fog</p>
                <p className="text-xs text-muted-foreground">Miguel Santos · ₱2,850 via GCash</p>
              </StackItem>
              <StackItem>
                <p className="text-sm font-medium">Check-in tomorrow · 1BR Taal View</p>
                <p className="text-xs text-muted-foreground">Ana Reyes · 4 guests · 2:00 PM</p>
              </StackItem>
              <StackItem>
                <p className="text-sm font-medium">New message · Garden Suite</p>
                <p className="text-xs text-muted-foreground">
                  &ldquo;Can we request early check-in at 1 PM?&rdquo;
                </p>
              </StackItem>
            </Stack>
          </div>
        )}
      />

      <DualSurfaceShowcase
        title="Guest & member pre-made faces (Toon Head · Big Smile)"
        source="DiceBear toon-head & big-smile 9.4.3 (CC BY 4.0)"
        useFor="Pre-made static WebP guest and member faces (Phase 8); kept separate from owner FacePicker."
        dont="Omit the CC-BY-4.0 artist credit line wherever these faces are shown or picked."
        render={() => (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">
                {guestFaceWords.sets.toon} (24 pre-made faces)
              </p>
              <div className="flex flex-wrap gap-2">
                {toonFaces.map((src, index) => (
                  <Avatar key={src} size="lg">
                    <AvatarImage src={src} alt={`Toon guest face ${index + 1}`} />
                  </Avatar>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">
                {guestFaceWords.sets.smile} (12 pre-made faces)
              </p>
              <div className="flex flex-wrap gap-2">
                {smileFaces.map((src, index) => (
                  <Avatar key={src} size="lg">
                    <AvatarImage src={src} alt={`Big smile guest face ${index + 1}`} />
                  </Avatar>
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{guestFaceWords.credit}</p>
          </div>
        )}
      />
    </div>
  );
}
