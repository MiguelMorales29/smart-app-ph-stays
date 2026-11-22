import { Badge } from '@smartapp/ui/components/badge';
import { Button } from '@smartapp/ui/components/button';
import { CopyButton } from '@smartapp/ui/compositions/copy-button';
import { CountUp } from '@smartapp/ui/compositions/count-up';
import { DrawnCheckIcon } from '@smartapp/ui/compositions/drawn-check';
import { InfoList } from '@smartapp/ui/compositions/info-list';
import { PageHeader } from '@smartapp/ui/compositions/page-header';
import { ResponsiveSheet } from '@smartapp/ui/compositions/responsive-sheet';
import { ScrollHint } from '@smartapp/ui/compositions/scroll-hint';
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  PhoneIcon,
  PlusIcon,
  RotateCcwIcon,
} from 'lucide-react';
import { useState } from 'react';

import { DualSurfaceShowcase } from './kit-base-tab';

function ResponsiveSheetDemo() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        Open ResponsiveSheet
      </Button>
      <ResponsiveSheet
        open={open}
        onOpenChange={setOpen}
        title="Booking details"
        description="Side sheet on desktop, snapping bottom drawer on phones."
        header={
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <p className="font-heading text-base font-semibold">Studio Fog · Dec 12–14</p>
              <p className="text-xs text-muted-foreground">2 nights · 2 guests</p>
            </div>
            <Badge variant="secondary">Confirmed</Badge>
          </div>
        }
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
            <Button type="button" onClick={() => setOpen(false)}>
              Message guest
            </Button>
          </div>
        }
      >
        <div className="space-y-3 p-4 text-sm text-muted-foreground">
          {Array.from({ length: 8 }, (_, idx) => (
            <p key={idx}>
              Guest arrival note #{idx + 1}: Check-in at 2:00 PM with condo lobby ID clearance
              confirmed 48 hours ahead.
            </p>
          ))}
        </div>
      </ResponsiveSheet>
    </div>
  );
}

function FeedbackCompositionsDemo() {
  const [amount, setAmount] = useState(24_800);
  const [checkKey, setCheckKey] = useState(1);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <CopyButton value="https://smartapp.webserbisyo.com/ulap-suites" label="Copy link" />
        <CopyButton value="0917 000 0101" iconOnly label="Copy GCash number" />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="rounded-xl border border-border bg-card px-4 py-2.5">
          <p className="text-xs text-muted-foreground">Monthly earnings</p>
          <p className="font-heading text-2xl font-bold text-foreground">
            <CountUp value={amount} prefix="₱" />
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setAmount((prev) => (prev === 24_800 ? 38_400 : 24_800))}
        >
          Update CountUp
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <span className="inline-flex size-9 items-center justify-center rounded-full bg-success-tint text-success">
          <DrawnCheckIcon key={checkKey} className="size-5" />
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => setCheckKey((k) => k + 1)}
        >
          <RotateCcwIcon className="size-3.5" aria-hidden="true" />
          Replay DrawnCheckIcon
        </Button>
      </div>
    </div>
  );
}

/** UI-1 batch compositions shown on the dashboard `/kit` Patterns tab (light + dark). */
export function KitPatternsUi1Section() {
  return (
    <div className="space-y-6">
      <DualSurfaceShowcase
        title="PageHeader"
        source="Food app composition (Tabs + Badge)"
        useFor="Top action bar + link-backed section tabs inside dashboard screens while keeping a screen-reader h1."
        dont="Duplicate the visible page title that already lives in the app top bar."
        render={() => (
          <PageHeader
            title="Bookings"
            actions={
              <Button type="button" size="sm" className="gap-1.5">
                <PlusIcon className="size-4" aria-hidden="true" />
                Manual booking
              </Button>
            }
            tabs={[
              {
                id: 'upcoming',
                label: 'Upcoming',
                icon: <CalendarIcon className="size-4" aria-hidden="true" />,
                link: <a href="#upcoming" onClick={(e) => e.preventDefault()} />,
                active: true,
                count: 4,
              },
              {
                id: 'checking-in',
                label: 'Checking in',
                icon: <ClockIcon className="size-4" aria-hidden="true" />,
                link: <a href="#checking-in" onClick={(e) => e.preventDefault()} />,
                active: false,
                count: 1,
              },
            ]}
          />
        )}
      />

      <DualSurfaceShowcase
        title="InfoList"
        source="Food app composition (Item primitives)"
        useFor="Bordered label/value rows for hours, contact links, and booking summaries."
        dont="Use for editable forms (use RowGroup / RowControl)."
        render={() => (
          <InfoList
            rows={[
              {
                id: 'hours',
                icon: <ClockIcon className="size-4" aria-hidden="true" />,
                label: 'Check-in / Check-out',
                badge: <Badge variant="secondary">Today</Badge>,
                value: '2:00 PM – 12:00 PM',
                highlight: true,
              },
              {
                id: 'location',
                icon: <MapPinIcon className="size-4" aria-hidden="true" />,
                label: 'Area',
                description: 'Exact address is shared after payment',
                value: 'Tagaytay City',
              },
              {
                id: 'phone',
                icon: <PhoneIcon className="size-4" aria-hidden="true" />,
                label: 'Host mobile',
                value: '0917 000 0101',
                href: 'tel:+639170000101',
              },
            ]}
          />
        )}
      />

      <DualSurfaceShowcase
        title="ResponsiveSheet & ScrollHint"
        source="Food app compositions (Drawer + Sheet + Scroller)"
        useFor="Inspector panels that keep the page visible on desktop (side Sheet) and snap full/half on phones, plus ScrollHint edge fades with a More below pill."
        dont="Replace AppSheet for centred modal tasks or confirmations."
        render={() => (
          <div className="space-y-4">
            <ResponsiveSheetDemo />
            <div className="flex h-36 flex-col overflow-hidden rounded-xl border border-border bg-card">
              <ScrollHint className="p-3">
                <div className="space-y-2 text-xs text-muted-foreground">
                  {Array.from({ length: 8 }, (_, idx) => (
                    <p key={idx}>
                      Scrollable policy line #{idx + 1} — fade and &ldquo;More below&rdquo; button
                      disappear once you reach the end.
                    </p>
                  ))}
                </div>
              </ScrollHint>
            </div>
          </div>
        )}
      />

      <DualSurfaceShowcase
        title="CopyButton, CountUp & DrawnCheckIcon"
        source="Food app compositions (CSS-only, zero motion)"
        useFor="One-tap copy with animated check feedback, smooth tabular KPI counters, and self-drawing confirmation checks."
        dont="Fail silently when clipboard access is denied (CopyButton falls back and notifies)."
        render={() => <FeedbackCompositionsDemo />}
      />
    </div>
  );
}
