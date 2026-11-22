import { Badge } from '@smartapp/ui/components/badge';
import { EventCalendar } from '@smartapp/ui/components/reui/event-calendar/event-calendar';
import { EventCalendarContent } from '@smartapp/ui/components/reui/event-calendar/event-calendar-content';
import { EventCalendarToolbar } from '@smartapp/ui/components/reui/event-calendar/event-calendar-nav';
import type {
  CalendarEvent,
  EventCalendarResource,
} from '@smartapp/ui/components/reui/event-calendar/event-calendar-types';
import { Gantt } from '@smartapp/ui/components/reui/gantt/gantt';
import { GanttToolbar } from '@smartapp/ui/components/reui/gantt/gantt-nav';
import type { GanttEvent, GanttResource } from '@smartapp/ui/components/reui/gantt/gantt-types';
import { GanttView } from '@smartapp/ui/components/reui/gantt/gantt-view';

const ANCHOR_MANILA = new Date('2026-12-10T00:00:00+08:00');

const UNIT_RESOURCES: EventCalendarResource[] = [
  { id: 'cloud-loft', title: 'Cloud Loft', color: 'var(--primary)' },
  { id: 'studio-fog', title: 'Studio Fog', color: 'var(--info)' },
  { id: 'taal-1br', title: '1BR Taal View', color: 'var(--success)' },
];

const STAY_EVENTS: CalendarEvent[] = [
  {
    id: 'bk-2041',
    title: 'Miguel Santos · 2 nights',
    start: new Date('2026-12-10T14:00:00+08:00'),
    end: new Date('2026-12-12T12:00:00+08:00'),
    resourceId: 'cloud-loft',
    color: 'var(--primary)',
  },
  {
    id: 'bk-2042',
    title: 'Ana Reyes · Late arrival',
    start: new Date('2026-12-10T23:30:00+08:00'),
    end: new Date('2026-12-11T12:00:00+08:00'),
    resourceId: 'studio-fog',
    color: 'var(--warning)',
  },
  {
    id: 'bk-2043',
    title: 'Carlo Mendoza · Confirmed',
    start: new Date('2026-12-12T14:00:00+08:00'),
    end: new Date('2026-12-15T12:00:00+08:00'),
    resourceId: 'taal-1br',
    color: 'var(--success)',
  },
  {
    id: 'blk-01',
    title: 'Owner block · Deep clean',
    start: new Date('2026-12-14T00:00:00+08:00'),
    end: new Date('2026-12-15T00:00:00+08:00'),
    allDay: true,
    resourceId: 'cloud-loft',
    color: 'var(--muted-foreground)',
  },
];

const GANTT_UNITS: GanttResource[] = [
  {
    id: 'ulap-stays',
    title: 'Ulap Suites · Tagaytay',
    children: [
      { id: 'cloud-loft', title: 'Cloud Loft', color: 'var(--primary)' },
      { id: 'studio-fog', title: 'Studio Fog', color: 'var(--info)' },
      { id: 'taal-1br', title: '1BR Taal View', color: 'var(--success)' },
    ],
  },
];

const GANTT_BOOKINGS: GanttEvent[] = [
  {
    id: 'g-1',
    title: 'Miguel Santos · Confirmed',
    start: new Date('2026-12-08T14:00:00+08:00'),
    end: new Date('2026-12-12T12:00:00+08:00'),
    resourceId: 'cloud-loft',
    color: 'var(--primary)',
  },
  {
    id: 'g-2',
    title: 'Ana Reyes · Overnight (crosses midnight)',
    start: new Date('2026-12-10T23:30:00+08:00'),
    end: new Date('2026-12-12T12:00:00+08:00'),
    resourceId: 'studio-fog',
    color: 'var(--info)',
  },
  {
    id: 'g-3',
    title: 'Carlo Mendoza · Confirmed',
    start: new Date('2026-12-13T14:00:00+08:00'),
    end: new Date('2026-12-17T12:00:00+08:00'),
    resourceId: 'taal-1br',
    color: 'var(--success)',
  },
  {
    id: 'g-4',
    title: 'Holiday hold · In review',
    start: new Date('2026-12-23T14:00:00+08:00'),
    end: new Date('2026-12-27T12:00:00+08:00'),
    resourceId: 'cloud-loft',
    color: 'var(--warning)',
  },
];

/** UI-4 owner scheduling compositions (EventCalendar + Gantt, Asia/Manila) on `/kit?tab=patterns`. */
export function KitPatternsUi4Section() {
  return (
    <div className="space-y-10">
      <section className="space-y-3 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-heading text-lg font-semibold">EventCalendar (Asia/Manila)</h2>
          <Badge variant="outline">@reui/event-calendar · @date-fns/tz 1.5.0 (UI-4)</Badge>
        </div>
        <p className="max-w-prose text-sm text-muted-foreground">
          Multi-unit owner booking calendar with Month, Week, Day, Agenda, and Resource views pinned
          to Asia/Manila time (Phase 6).
        </p>

        <div className="space-y-4">
          {(['light', 'dark'] as const).map((surface) => (
            <div
              key={surface}
              className={`${surface} min-w-0 rounded-lg border border-border bg-background p-4 text-foreground`}
            >
              <p className="mb-3 text-xs font-medium text-muted-foreground">
                {surface === 'light' ? 'Light' : 'Dark'}
              </p>
              <div className="h-[460px] w-full overflow-hidden rounded-xl border border-border bg-card">
                <EventCalendar
                  defaultEvents={STAY_EVENTS}
                  resources={UNIT_RESOURCES}
                  defaultView="month"
                  defaultDate={ANCHOR_MANILA}
                  timeZone="Asia/Manila"
                  className="h-full"
                >
                  <EventCalendarToolbar />
                  <EventCalendarContent />
                </EventCalendar>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-heading text-lg font-semibold">
            Gantt occupancy timeline (Asia/Manila)
          </h2>
          <Badge variant="outline">@reui/gantt · @date-fns/tz 1.5.0 (UI-4)</Badge>
        </div>
        <p className="max-w-prose text-sm text-muted-foreground">
          Horizontal unit-by-unit occupancy and lease timeline across weeks and months in
          Asia/Manila time (Phase 15).
        </p>

        <div className="space-y-4">
          {(['light', 'dark'] as const).map((surface) => (
            <div
              key={surface}
              className={`${surface} min-w-0 rounded-lg border border-border bg-background p-4 text-foreground`}
            >
              <p className="mb-3 text-xs font-medium text-muted-foreground">
                {surface === 'light' ? 'Light' : 'Dark'}
              </p>
              <div className="h-[340px] w-full overflow-hidden rounded-xl border border-border bg-card">
                <Gantt
                  defaultEvents={GANTT_BOOKINGS}
                  resources={GANTT_UNITS}
                  defaultScale="month"
                  defaultDate={ANCHOR_MANILA}
                  timeZone="Asia/Manila"
                  className="h-full"
                >
                  <GanttToolbar />
                  <GanttView />
                </Gantt>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
