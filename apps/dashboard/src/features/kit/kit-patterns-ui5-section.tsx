import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from '@smartapp/ui/components/attachment';
import { Avatar, AvatarFallback } from '@smartapp/ui/components/avatar';
import { Bubble, BubbleContent } from '@smartapp/ui/components/bubble';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@smartapp/ui/components/chart';
import { EvilAreaChart } from '@smartapp/ui/components/evilcharts/charts/recharts-area-chart';
import { EvilBarChart } from '@smartapp/ui/components/evilcharts/charts/recharts-bar-chart';
import { EvilPieChart } from '@smartapp/ui/components/evilcharts/charts/recharts-pie-chart';
import { EvilRadialChart } from '@smartapp/ui/components/evilcharts/charts/recharts-radial-chart';
import { Marker, MarkerContent } from '@smartapp/ui/components/marker';
import { Message, MessageAvatar, MessageContent } from '@smartapp/ui/components/message';
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from '@smartapp/ui/components/message-scroller';
import { FileImageIcon } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';

import { DualSurfaceShowcase } from './kit-base-tab';

// Kit sample numbers only (pesos and nights) for an owner with five units.
const MONTHS = [
  { month: 'Jul', paid: 142000 },
  { month: 'Aug', paid: 168500 },
  { month: 'Sep', paid: 121000 },
  { month: 'Oct', paid: 154200 },
  { month: 'Nov', paid: 189900 },
  { month: 'Dec', paid: 248600 },
];
const monthConfig = { paid: { label: 'Paid', color: 'var(--chart-1)' } } satisfies ChartConfig;

const WEEK = [
  { label: 'Mon', usual: 2, booked: 3 },
  { label: 'Tue', usual: 2, booked: 1 },
  { label: 'Wed', usual: 3, booked: 2 },
  { label: 'Thu', usual: 3, booked: 4 },
  { label: 'Fri', usual: 4, booked: 5 },
  { label: 'Sat', usual: 5, booked: 5 },
  { label: 'Sun', usual: 4, booked: 3 },
];
const DAYS = [
  { label: '1 Dec', before: 6200, paid: 8400 },
  { label: '5 Dec', before: 7100, paid: 5200 },
  { label: '9 Dec', before: 5400, paid: 9900 },
  { label: '13 Dec', before: 8800, paid: 12600 },
  { label: '17 Dec', before: 9100, paid: 10400 },
  { label: '21 Dec', before: 11200, paid: 15800 },
];
const SOURCES = [
  { name: 'page', bookings: 21 },
  { name: 'messenger', bookings: 9 },
  { name: 'walk_in', bookings: 4 },
];
const OCCUPANCY = [
  { name: 'last', value: 58 },
  { name: 'this', value: 72 },
];
const peso = (value: number) => `₱${value.toLocaleString('en-PH')}`;

function ChartDemo() {
  return (
    <ChartContainer config={monthConfig} className="aspect-auto h-52 w-full">
      <BarChart accessibilityLayer data={MONTHS}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent indicator="dot" formatter={(value) => peso(Number(value))} />
          }
        />
        <Bar dataKey="paid" fill="var(--color-paid)" radius={6} />
      </BarChart>
    </ChartContainer>
  );
}

function EvilChartsDemo() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="h-48 min-w-0">
        <EvilBarChart
          data={WEEK}
          config={{
            usual: { label: 'A usual week', colors: { light: ['var(--muted-foreground)'] } },
            booked: { label: 'Nights booked', colors: { light: ['var(--chart-1)'] } },
          }}
          className="aspect-auto h-full w-full"
          barRadius={6}
        >
          <EvilBarChart.Grid />
          <EvilBarChart.XAxis dataKey="label" />
          <EvilBarChart.Legend />
          <EvilBarChart.Bar dataKey="usual" variant="hatched" />
          <EvilBarChart.Bar dataKey="booked" variant="gradient" />
        </EvilBarChart>
      </div>
      <div className="h-48 min-w-0">
        <EvilAreaChart
          data={DAYS}
          config={{
            before: { label: 'Last month', colors: { light: ['var(--muted-foreground)'] } },
            paid: { label: 'Paid', colors: { light: ['var(--chart-1)'] } },
          }}
          className="aspect-auto h-full w-full"
          curveType="monotone"
        >
          <EvilAreaChart.Grid />
          <EvilAreaChart.XAxis dataKey="label" />
          <EvilAreaChart.Legend />
          <EvilAreaChart.Area dataKey="before" variant="dotted" />
          <EvilAreaChart.Area dataKey="paid" variant="gradient" strokeVariant="solid" />
        </EvilAreaChart>
      </div>
      <div className="flex items-center gap-3">
        <div className="size-36">
          <EvilPieChart
            data={SOURCES}
            config={{
              page: { label: 'Booking page', colors: { light: ['var(--chart-1)'] } },
              messenger: { label: 'Messenger', colors: { light: ['var(--chart-2)'] } },
              walk_in: { label: 'Walk-in', colors: { light: ['var(--chart-3)'] } },
            }}
            dataKey="bookings"
            nameKey="name"
            className="aspect-square size-full"
          >
            <EvilPieChart.Pie
              innerRadius="60%"
              outerRadius="96%"
              cornerRadius={6}
              paddingAngle={3}
            />
            <EvilPieChart.Tooltip />
          </EvilPieChart>
        </div>
        <p className="text-xs text-muted-foreground">Where bookings came from (Pie)</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="size-36">
          <EvilRadialChart
            data={OCCUPANCY}
            config={{
              last: {
                label: 'Last month',
                colors: {
                  light: ['color-mix(in oklab, var(--muted-foreground) 45%, transparent)'],
                },
              },
              this: { label: 'This month', colors: { light: ['var(--chart-1)'] } },
            }}
            nameKey="name"
            max={100}
            innerRadius="60%"
            outerRadius="100%"
            className="aspect-square size-full"
          >
            <EvilRadialChart.RadialBar dataKey="value" barSize={12} cornerRadius={8} />
          </EvilRadialChart>
        </div>
        <p className="text-xs text-muted-foreground">Occupancy, this month vs last (Radial)</p>
      </div>
    </div>
  );
}

const THREAD = [
  { id: 'm1', from: 'guest', text: 'Hi! Is Studio Fog free on 12–14 Dec for 2 adults?' },
  { id: 'm2', from: 'owner', text: 'Yes, it is. ₱2,600 a night, check-in from 2:00 PM.' },
  { id: 'm3', from: 'guest', text: 'Great, booking now. Can we park one car?' },
  { id: 'm4', from: 'owner', text: 'Yes, parking is free for guests.' },
  { id: 'm5', from: 'guest', text: 'Sent the GCash payment proof.', proof: true },
  { id: 'm6', from: 'owner', text: 'Got it, payment approved. See you on Friday!' },
] as const;

function ChatDemo() {
  return (
    <MessageScrollerProvider defaultScrollPosition="end">
      <MessageScroller className="relative h-80 rounded-xl border border-border bg-card">
        <MessageScrollerViewport aria-label="Conversation with Miguel Santos" className="h-full">
          <MessageScrollerContent className="flex flex-col gap-4 p-4">
            <MessageScrollerItem>
              <Marker variant="separator">
                <MarkerContent>Thu, 11 Dec</MarkerContent>
              </Marker>
            </MessageScrollerItem>
            {THREAD.map((line) => (
              <MessageScrollerItem key={line.id} messageId={line.id}>
                <Message align={line.from === 'owner' ? 'end' : 'start'}>
                  <MessageAvatar>
                    <Avatar>
                      <AvatarFallback>{line.from === 'owner' ? 'US' : 'MS'}</AvatarFallback>
                    </Avatar>
                  </MessageAvatar>
                  <MessageContent>
                    {'proof' in line ? (
                      <Attachment>
                        <AttachmentMedia>
                          <FileImageIcon aria-hidden="true" />
                        </AttachmentMedia>
                        <AttachmentContent>
                          <AttachmentTitle>gcash-proof.jpg</AttachmentTitle>
                          <AttachmentDescription>JPG, 184 KB</AttachmentDescription>
                        </AttachmentContent>
                      </Attachment>
                    ) : null}
                    <Bubble variant={line.from === 'owner' ? 'default' : 'muted'}>
                      <BubbleContent>{line.text}</BubbleContent>
                    </Bubble>
                  </MessageContent>
                </Message>
              </MessageScrollerItem>
            ))}
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton />
      </MessageScroller>
    </MessageScrollerProvider>
  );
}

/** UI-5 patterns: owner charts and the booking conversation (StampCard is guest-facing: storefront /kit). */
export function KitPatternsUi5Section() {
  return (
    <div className="space-y-6">
      <DualSurfaceShowcase
        title="Chart (shadcn + recharts)"
        source="shadcn · recharts 3.8.0 · lazy (UI-5)"
        useFor="Owner Reports: ₱ paid per month, using --chart-1…6 so both modes stay readable."
        dont="Load a chart on the first page or pick colours by hand; take them from the chart tokens."
        render={() => <ChartDemo />}
      />
      <DualSurfaceShowcase
        title="evilcharts: Bar, Area, Pie, Radial"
        source="evilcharts (MIT) · via food app · lazy (UI-5)"
        useFor="Home cards: this week against a usual week, paid vs last month, booking sources, occupancy."
        dont="Mix more than three series in one chart; split it instead."
        render={() => <EvilChartsDemo />}
      />
      <DualSurfaceShowcase
        title="Message · Bubble · Attachment · MessageScroller"
        source="shadcn + ReUI · via food app (UI-5)"
        useFor="The booking conversation between owner and guest, including payment proof files."
        dont="Hand-roll a chat list; MessageScroller keeps the newest message in view and shows the jump button."
        render={() => <ChatDemo />}
      />
    </div>
  );
}
