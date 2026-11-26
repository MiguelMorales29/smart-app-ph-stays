import {
  Gauge,
  GaugeIndicator,
  GaugeLabel,
  GaugeRange,
  GaugeTrack,
  GaugeValueText,
} from '@smartapp/ui/components/gauge';
import { Marquee, MarqueeContent, MarqueeEdge, MarqueeItem } from '@smartapp/ui/components/marquee';
import { Marker, MarkerContent, MarkerIcon } from '@smartapp/ui/components/marker';
import {
  Stat,
  StatDescription,
  StatIndicator,
  StatLabel,
  StatTrend,
  StatValue,
} from '@smartapp/ui/components/stat';
import {
  BedDoubleIcon,
  CalendarCheckIcon,
  MoonStarIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  WalletIcon,
} from 'lucide-react';

import { DualSurfaceShowcase } from './kit-base-tab';
import { KitBaseUi5Effects } from './kit-base-ui5-effects';

// Kit sample numbers only (pesos and nights), shaped like an owner's week at Ulap Suites.
const STATS = [
  {
    label: 'Bookings this week',
    value: '18',
    trend: 'up' as const,
    change: '+4 vs last week',
    icon: CalendarCheckIcon,
    color: 'info' as const,
  },
  {
    label: 'Paid this week',
    value: '₱86,400',
    trend: 'up' as const,
    change: '+12%',
    icon: WalletIcon,
    color: 'success' as const,
  },
  {
    label: 'Empty nights',
    value: '9',
    trend: 'down' as const,
    change: '3 more than usual',
    icon: MoonStarIcon,
    color: 'warning' as const,
  },
];

const ANNOUNCEMENTS = [
  'Check-in from 2:00 PM',
  'Free parking for 2 cars',
  'Pet-friendly rooms on request',
  'GCash and Maya accepted',
  'Late check-out until 1:00 PM, ₱500',
];

function StatDemo() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {STATS.map((stat) => (
        <Stat key={stat.label} className="rounded-xl border border-border bg-card p-4">
          <StatLabel>{stat.label}</StatLabel>
          <StatIndicator variant="icon" color={stat.color}>
            <stat.icon aria-hidden="true" />
          </StatIndicator>
          <StatValue className="tabular">{stat.value}</StatValue>
          <StatDescription>
            <StatTrend trend={stat.trend}>
              {stat.trend === 'up' ? (
                <TrendingUpIcon aria-hidden="true" />
              ) : (
                <TrendingDownIcon aria-hidden="true" />
              )}
              {stat.change}
            </StatTrend>
          </StatDescription>
        </Stat>
      ))}
    </div>
  );
}

function GaugeDemo() {
  return (
    <div className="flex flex-wrap items-end gap-6">
      <Gauge value={72} size={150} thickness={12} startAngle={-90} endAngle={90}>
        <GaugeIndicator>
          <GaugeTrack />
          <GaugeRange />
        </GaugeIndicator>
        <GaugeValueText>72%</GaugeValueText>
        <GaugeLabel>Nights booked</GaugeLabel>
      </Gauge>
      <Gauge value={5} max={8} size={110} thickness={10}>
        <GaugeIndicator>
          <GaugeTrack />
          <GaugeRange className="stroke-success" />
        </GaugeIndicator>
        <GaugeValueText>5 of 8</GaugeValueText>
        <GaugeLabel>Rooms ready</GaugeLabel>
      </Gauge>
    </div>
  );
}

function MarqueeDemo() {
  return (
    <Marquee className="rounded-lg border border-border bg-card py-2" speed={30} pauseOnHover>
      <MarqueeContent>
        {ANNOUNCEMENTS.map((line) => (
          <MarqueeItem key={line} className="px-3 text-sm text-foreground">
            {line}
          </MarqueeItem>
        ))}
      </MarqueeContent>
      <MarqueeEdge side="left" />
      <MarqueeEdge side="right" />
    </Marquee>
  );
}

function MarkerDemo() {
  return (
    <div className="space-y-3">
      <Marker variant="separator">
        <MarkerContent>Today, Fri 12 Dec</MarkerContent>
      </Marker>
      <Marker>
        <MarkerIcon>
          <BedDoubleIcon aria-hidden="true" />
        </MarkerIcon>
        <MarkerContent>Miguel Santos booked Studio Fog for 2 nights</MarkerContent>
      </Marker>
      <Marker variant="border">
        <MarkerContent>Payment proof sent, 2:14 PM</MarkerContent>
      </Marker>
    </div>
  );
}

/** UI-5 base pieces: numbers at a glance, guest notices, and chat markers. */
export function KitBaseUi5Section() {
  return (
    <>
      <DualSurfaceShowcase
        title="Stat"
        source="Dice UI · via food app (UI-5)"
        useFor="Owner Home tiles: bookings, ₱ paid, empty nights, each with an icon, a number and a trend word."
        dont="Show a trend with colour only; keep the arrow icon and the words."
        render={() => <StatDemo />}
      />
      <DualSurfaceShowcase
        title="Gauge"
        source="Dice UI · via food app (UI-5)"
        useFor="One number against a whole: nights booked this month, rooms cleaned and ready."
        dont="Put several gauges side by side to compare values; use a bar chart instead."
        render={() => <GaugeDemo />}
      />
      <DualSurfaceShowcase
        title="Marquee"
        source="Dice UI · via food app (UI-5)"
        useFor="A short strip of guest notices on the property page (check-in time, parking, payments)."
        dont="Hide anything a guest must read to book; a moving strip is easy to miss and pauses on hover."
        render={() => <MarqueeDemo />}
      />
      <DualSurfaceShowcase
        title="Marker"
        source="ReUI · via food app (UI-5)"
        useFor="Day separators and system lines inside a booking conversation."
        dont="Use it as a heading for page sections."
        render={() => <MarkerDemo />}
      />
      <KitBaseUi5Effects />
    </>
  );
}
