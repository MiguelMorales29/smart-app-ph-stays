'use client';

import { Bubble, BubbleContent } from '@smartapp/ui/components/bubble';
import { Marquee, MarqueeContent, MarqueeEdge, MarqueeItem } from '@smartapp/ui/components/marquee';
import { Marker, MarkerContent } from '@smartapp/ui/components/marker';
import { Message, MessageContent } from '@smartapp/ui/components/message';
import { StampCard } from '@smartapp/ui/compositions/stamp-card';

const NOTICES = [
  'Check-in from 2:00 PM',
  'Free parking for guests',
  'GCash and Maya accepted',
  'Quiet hours from 10:00 PM',
];

/** Guest-facing UI-5 pieces inside the active PropertyTheme on storefront `/kit`. */
export function StorefrontKitUi5Section({ propertyName }: { readonly propertyName: string }) {
  return (
    <div className="space-y-6">
      <div className="min-w-0 space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Guest notices (Marquee)</p>
        <Marquee className="rounded-lg border border-border bg-card py-2" speed={30} pauseOnHover>
          <MarqueeContent>
            {NOTICES.map((line) => (
              <MarqueeItem key={line} className="px-3 text-sm text-foreground">
                {line}
              </MarqueeItem>
            ))}
          </MarqueeContent>
          <MarqueeEdge side="left" />
          <MarqueeEdge side="right" />
        </Marquee>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="min-w-0 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Stay rewards (StampCard)</p>
          <StampCard
            needed={6}
            stamped={4}
            pending={1}
            title="Stay 5 nights, the 6th is free"
            body={`Every paid night at ${propertyName} earns one stamp.`}
            progressLabel="4 of 6 nights"
            prize={{ title: 'Free night', photo: null, label: 'Free' }}
          />
        </div>
        <div className="min-w-0 space-y-3 rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">
            Booking conversation (Message · Bubble · Marker)
          </p>
          <Marker variant="separator">
            <MarkerContent>Thu, 11 Dec</MarkerContent>
          </Marker>
          <Message align="end">
            <MessageContent>
              <Bubble>
                <BubbleContent>Is the loft free on 12–14 Dec for 2 adults?</BubbleContent>
              </Bubble>
            </MessageContent>
          </Message>
          <Message>
            <MessageContent>
              <Bubble variant="muted">
                <BubbleContent>Yes, ₱2,600 a night. Check-in from 2:00 PM.</BubbleContent>
              </Bubble>
            </MessageContent>
          </Message>
        </div>
      </div>
    </div>
  );
}
