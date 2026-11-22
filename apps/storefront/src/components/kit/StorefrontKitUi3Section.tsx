'use client';

import { guestAvatarChoices, guestFaceWords } from '@smartapp/core';
import { Avatar, AvatarImage } from '@smartapp/ui/components/avatar';
import { Badge } from '@smartapp/ui/components/badge';
import { RelativeTimeCard } from '@smartapp/ui/components/relative-time-card';
import { FileType } from '@smartapp/ui/components/reui/file-type';
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from '@smartapp/ui/components/reui/frame';
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
import { Stack, StackItem } from '@smartapp/ui/components/stack';
import { ThermalReceiptCard } from '@smartapp/ui/vendor/opensource-ui/thermal-receipt';
import { FileTextIcon, ShieldCheckIcon } from 'lucide-react';

const SAMPLE_RECEIPT_TIME = new Date('2026-12-10T02:15:00Z');

/** Guest-facing UI-3 showcase rendered inside the active property theme on storefront `/kit`. */
export function StorefrontKitUi3Section({ propertyName }: { readonly propertyName: string }) {
  const toonFaces = guestAvatarChoices('toon').slice(0, 6);
  const smileFaces = guestAvatarChoices('smile').slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Booking &amp; payment receipt (ThermalReceiptCard)
          </p>
          <div className="max-w-xs py-2">
            <ThermalReceiptCard
              propertyName={propertyName.toUpperCase()}
              propertyAddress="Official property booking receipt"
              bookingRef="BK-2041"
              date="10 Dec 2026"
              items={[
                { key: 'stay', name: 'Studio Fog · 2 nights', price: '₱5,200' },
                { key: 'cleaning', name: 'Cleaning fee', price: '₱500' },
              ]}
              subtotalLabel="Stay subtotal"
              subtotal="₱5,200"
              feesLabel="Required fees"
              fees="₱500"
              totalLabel="Total stay"
              total="₱5,700"
              footer="Thank you for booking direct · Check-in 2:00 PM (Manila time)"
            />
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-xs font-medium text-muted-foreground">Booking timeline</p>
          <Timeline defaultValue={2}>
            <TimelineItem step={1}>
              <TimelineHeader>
                <TimelineSeparator />
                <TimelineDate>10 Dec · 9:10 AM</TimelineDate>
                <TimelineTitle>Dates held</TimelineTitle>
                <TimelineIndicator />
              </TimelineHeader>
              <TimelineContent>Your 2-hour hold for 12–14 Dec started.</TimelineContent>
            </TimelineItem>
            <TimelineItem step={2}>
              <TimelineHeader>
                <TimelineSeparator />
                <TimelineDate>10 Dec · 9:24 AM</TimelineDate>
                <TimelineTitle>Payment proof sent</TimelineTitle>
                <TimelineIndicator />
              </TimelineHeader>
              <TimelineContent>The owner is checking your GCash transfer.</TimelineContent>
            </TimelineItem>
            <TimelineItem step={3}>
              <TimelineHeader>
                <TimelineDate>Next</TimelineDate>
                <TimelineTitle>Confirmed &amp; arrival guide</TimelineTitle>
                <TimelineIndicator />
              </TimelineHeader>
              <TimelineContent>You will get the gate pin and check-in guide.</TimelineContent>
            </TimelineItem>
          </Timeline>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>Last updated:</span>
            <RelativeTimeCard
              date={SAMPLE_RECEIPT_TIME}
              timezones={['Asia/Manila', 'UTC']}
              className="font-medium text-foreground underline decoration-dotted underline-offset-4"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Frame spacing="sm">
          <FrameHeader>
            <FrameTitle>Guest attachments</FrameTitle>
            <FrameDescription>House rules and payment receipt files.</FrameDescription>
          </FrameHeader>
          <FramePanel>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <FileType type="pdf" size="sm" />
                <div className="text-xs">
                  <p className="font-medium">House-rules-and-parking.pdf</p>
                  <p className="text-muted-foreground">PDF · 240 KB</p>
                </div>
              </div>
              <Badge variant="secondary">Ready</Badge>
            </div>
          </FramePanel>
        </Frame>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <IconTile variant="soft" size="sm">
              <ShieldCheckIcon aria-hidden="true" />
            </IconTile>
            <IconTile variant="frame" size="sm">
              <FileTextIcon aria-hidden="true" />
            </IconTile>
            <span className="text-xs text-muted-foreground">IconTile &amp; Stack</span>
          </div>
          <div className="pb-14">
            <Stack expandOnHover itemCount={2} gap={8} offset={10} side="top" className="h-20">
              <StackItem>
                <p className="text-xs font-medium">Check-in guide ready</p>
                <p className="text-xs text-muted-foreground">2:00 PM Manila time · Self check-in</p>
              </StackItem>
              <StackItem>
                <p className="text-xs font-medium">Official property link verified</p>
                <p className="text-xs text-muted-foreground">Pay only to listed accounts</p>
              </StackItem>
            </Stack>
          </div>
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-card p-4">
        <p className="text-xs font-medium text-muted-foreground">
          Guest &amp; member pre-made faces ({guestFaceWords.sets.toon} &amp;{' '}
          {guestFaceWords.sets.smile})
        </p>
        <div className="flex flex-wrap gap-2">
          {toonFaces.map((src, index) => (
            <Avatar key={src} size="default">
              <AvatarImage src={src} alt={`Toon guest face ${index + 1}`} />
            </Avatar>
          ))}
          {smileFaces.map((src, index) => (
            <Avatar key={src} size="default">
              <AvatarImage src={src} alt={`Big smile guest face ${index + 1}`} />
            </Avatar>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{guestFaceWords.credit}</p>
      </div>
    </div>
  );
}
