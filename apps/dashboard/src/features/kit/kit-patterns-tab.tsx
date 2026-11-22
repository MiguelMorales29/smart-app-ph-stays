import { Suspense, createElement, lazy, useState } from 'react';
import {
  BedDoubleIcon,
  CalendarDaysIcon,
  HomeIcon,
  MessageSquareIcon,
  MoreHorizontalIcon,
  PlusIcon,
} from 'lucide-react';
import { Button } from '@smartapp/ui/components/button';
import { Field, FieldLabel } from '@smartapp/ui/components/field';
import { Input } from '@smartapp/ui/components/input';
import { AppSheet } from '@smartapp/ui/compositions/app-sheet';
import { ChoiceChip } from '@smartapp/ui/compositions/choice-chip';
import { dockSlotClass } from '@smartapp/ui/compositions/bottom-dock';
import { EditorSections } from '@smartapp/ui/compositions/editor-sections';
import {
  RowButton,
  RowControl,
  RowGroup,
  RowPicker,
  RowSwitch,
} from '@smartapp/ui/compositions/grouped-rows';
import { InlineStepper } from '@smartapp/ui/compositions/inline-stepper';
import { MoneyInput } from '@smartapp/ui/compositions/money-input';
import { SaveBar } from '@smartapp/ui/compositions/save-bar';
import { SegmentedControl } from '@smartapp/ui/compositions/segmented-control';
import { UnitStatusBadge } from '@smartapp/ui/compositions/status-badge';
import { QUICK_ADD_ITEMS } from '@/app/nav-config';

import { KitPatternsUi1Section } from './kit-patterns-ui1-section';
import { KitPatternsUi2Section } from './kit-patterns-ui2-section';
import { KitPatternsUi3Section } from './kit-patterns-ui3-section';

const KitPatternsUi4Section = lazy(() =>
  import('./kit-patterns-ui4-section').then((m) => ({ default: m.KitPatternsUi4Section })),
);

type Section = 'basics' | 'price' | 'rules';

const HOLD = [
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
  { value: 120, label: '2 hours' },
  { value: 360, label: '6 hours' },
  { value: 1440, label: '24 hours' },
] as const;

function Block({
  title,
  note,
  children,
}: {
  readonly title: string;
  readonly note: string;
  readonly children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <h2 className="font-heading text-lg font-semibold">{title}</h2>
        <p className="max-w-prose text-sm text-muted-foreground">{note}</p>
      </div>
      {children}
    </section>
  );
}

/** /kit?tab=patterns: every Pattern Guide v2 pattern, live, in the current theme. */
export function KitPatternsTab() {
  const [kind, setKind] = useState<'unit' | 'beds'>('unit');
  const [rent, setRent] = useState<'night' | 'month'>('night');
  const [guests, setGuests] = useState(2);
  const [beds, setBeds] = useState(1);
  const [minNights, setMinNights] = useState(1);
  const [hold, setHold] = useState<number>(120);
  const [instant, setInstant] = useState(true);
  const [days, setDays] = useState<readonly number[]>([5, 6]);
  const [section, setSection] = useState<Section | null>('basics');
  const [sheet, setSheet] = useState<'none' | 'add' | 'form' | 'long'>('none');
  const [name, setName] = useState('Studio Fog');
  const [savedName, setSavedName] = useState('Studio Fog');
  const [saveState, setSaveState] = useState<'idle' | 'busy' | 'done'>('idle');
  const [price, setPrice] = useState<number | null>(260000);

  const dirty = name !== savedName;

  return (
    <div className="space-y-10 pb-32">
      <p className="max-w-prose text-sm text-muted-foreground">
        Every pattern from docs/pattern-guide.md, working. Switch Light and Dark above, and open
        this tab at phone width to see sheets as drawers.
      </p>

      <Block
        title="Segmented pill"
        note="Two to four choices. The thumb slides to the picked option; arrow keys move it."
      >
        <div className="flex max-w-md flex-col gap-3">
          <SegmentedControl
            aria-label="What are you adding?"
            value={kind}
            onValueChange={setKind}
            options={[
              { value: 'unit', label: 'Room or place', icon: <HomeIcon /> },
              { value: 'beds', label: 'Bed spaces', icon: <BedDoubleIcon /> },
            ]}
          />
          <SegmentedControl
            aria-label="How guests rent it"
            size="sm"
            value={rent}
            onValueChange={setRent}
            options={[
              { value: 'night', label: 'By the night' },
              { value: 'month', label: 'By the month' },
            ]}
          />
        </div>
      </Block>

      <Block
        title="Grouped rows"
        note="Label left, value right. Small counts get an inline stepper; choices open a half-height sheet with a checked list."
      >
        <div className="flex max-w-md flex-col gap-6">
          <RowGroup title="Basics">
            <RowButton label="Name" value="Studio Fog" onClick={() => setSheet('form')} />
            <RowControl label="Guests">
              <InlineStepper
                label="Guests"
                value={guests}
                onValueChange={setGuests}
                min={1}
                max={30}
              />
            </RowControl>
            <RowControl label="Beds">
              <InlineStepper label="Beds" value={beds} onValueChange={setBeds} min={1} max={20} />
            </RowControl>
          </RowGroup>
          <RowGroup title="Booking rules" footer="Guests see these before they pay.">
            <RowControl label="Shortest stay" hint="Nights">
              <InlineStepper
                label="Nights"
                value={minNights}
                onValueChange={setMinNights}
                min={1}
                max={30}
                unit="nights"
              />
            </RowControl>
            <RowPicker
              label="Time to send payment"
              value={hold}
              onValueChange={setHold}
              options={HOLD}
            />
            <RowSwitch
              label="Book without asking me"
              hint="Guests who pay the down payment are confirmed."
              checked={instant}
              onCheckedChange={setInstant}
            />
          </RowGroup>
        </div>
      </Block>

      <Block
        title="Chips"
        note="Many choices. Selected chips get the tint, a blue ring and a check in both modes."
      >
        <div className="flex flex-wrap gap-2" role="group" aria-label="Days with a different price">
          {[
            [1, 'Mon'],
            [2, 'Tue'],
            [3, 'Wed'],
            [4, 'Thu'],
            [5, 'Fri'],
            [6, 'Sat'],
            [7, 'Sun'],
          ].map(([iso, label]) => (
            <ChoiceChip
              key={iso}
              pressed={days.includes(Number(iso))}
              onPressedChange={(on) =>
                setDays((list) =>
                  on ? [...list, Number(iso)] : list.filter((day) => day !== Number(iso)),
                )
              }
            >
              {label}
            </ChoiceChip>
          ))}
        </div>
      </Block>

      <Block
        title="Sheet"
        note="Drawer on phones, dialog on desktop. Grabber, Close top-left, a body that scrolls with edge fades, and a footer above the home indicator."
      >
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setSheet('add')}>
            <PlusIcon aria-hidden="true" />
            Open the + quick-add sheet
          </Button>
          <Button variant="outline" onClick={() => setSheet('form')}>
            Open a form sheet
          </Button>
          <Button variant="outline" onClick={() => setSheet('long')}>
            Open a long sheet
          </Button>
        </div>
        <AppSheet
          open={sheet === 'add'}
          onOpenChange={(open) => setSheet(open ? 'add' : 'none')}
          title="Add"
          height="half"
          size="sm"
        >
          <RowGroup>
            {QUICK_ADD_ITEMS.map((item) => (
              <RowButton
                key={item.id}
                label={item.label}
                hint={item.hint}
                icon={createElement(item.icon)}
                onClick={() => setSheet('none')}
              />
            ))}
          </RowGroup>
        </AppSheet>
        <AppSheet
          open={sheet === 'form'}
          onOpenChange={(open) => setSheet(open ? 'form' : 'none')}
          title="Add a unit"
          description="Start with the basics. Photos come next."
          height="full"
          footer={
            <>
              <Button data-sheet-cancel="" variant="outline" onClick={() => setSheet('none')}>
                Cancel
              </Button>
              <Button onClick={() => setSheet('none')}>Save and add photos</Button>
            </>
          }
        >
          <div className="flex flex-col gap-4">
            <SegmentedControl
              aria-label="What are you adding?"
              value={kind}
              onValueChange={setKind}
              options={[
                { value: 'unit', label: 'Room or place' },
                { value: 'beds', label: 'Bed spaces' },
              ]}
            />
            <Field>
              <FieldLabel htmlFor="kit-sheet-name">Unit name</FieldLabel>
              <Input id="kit-sheet-name" placeholder="e.g. Suite A" />
            </Field>
            <RowGroup>
              <RowControl label="Guests">
                <InlineStepper
                  label="Guests"
                  value={guests}
                  onValueChange={setGuests}
                  min={1}
                  max={30}
                />
              </RowControl>
            </RowGroup>
            <Field>
              <FieldLabel htmlFor="kit-sheet-price">Price</FieldLabel>
              <MoneyInput
                id="kit-sheet-price"
                value={price}
                per="a night"
                onValueChange={setPrice}
              />
            </Field>
          </div>
        </AppSheet>
        <AppSheet
          open={sheet === 'long'}
          onOpenChange={(open) => setSheet(open ? 'long' : 'none')}
          title="House rules"
          height="full"
          footer={<Button onClick={() => setSheet('none')}>Done</Button>}
        >
          <ol className="flex flex-col gap-3 text-sm">
            {Array.from({ length: 24 }, (_, index) => (
              <li key={index} className="rounded-xl bg-muted p-3">
                Rule {index + 1}: quiet hours from 10 PM to 7 AM, no parties, and no smoking inside.
              </li>
            ))}
          </ol>
        </AppSheet>
      </Block>

      <Block
        title="Editor sections"
        note="Accordion on phones, a section list on desktop. Each header shows its value. Content stays mounted, so opening and closing animate."
      >
        <div className="max-w-3xl">
          <EditorSections<Section>
            value={section}
            onValueChange={setSection}
            sections={[
              {
                value: 'basics',
                label: 'Basics',
                summary: `${guests} guests · ${beds} ${beds === 1 ? 'bed' : 'beds'}`,
                content: (
                  <RowGroup>
                    <RowControl label="Guests">
                      <InlineStepper
                        label="Guests"
                        value={guests}
                        onValueChange={setGuests}
                        min={1}
                        max={30}
                      />
                    </RowControl>
                    <RowControl label="Beds">
                      <InlineStepper
                        label="Beds"
                        value={beds}
                        onValueChange={setBeds}
                        min={1}
                        max={20}
                      />
                    </RowControl>
                  </RowGroup>
                ),
              },
              {
                value: 'price',
                label: 'Price',
                summary: '₱2,600 a night · Fri/Sat ₱3,200',
                content: (
                  <Field>
                    <FieldLabel htmlFor="kit-sections-price">Price per night</FieldLabel>
                    <MoneyInput
                      id="kit-sections-price"
                      value={price}
                      per="a night"
                      onValueChange={setPrice}
                    />
                  </Field>
                ),
              },
              {
                value: 'rules',
                label: 'Booking rules',
                summary: `${minNights} ${minNights === 1 ? 'night' : 'nights'} minimum`,
                needsYou: true,
                content: (
                  <RowGroup>
                    <RowControl label="Shortest stay">
                      <InlineStepper
                        label="Nights"
                        value={minNights}
                        onValueChange={setMinNights}
                        min={1}
                        max={30}
                      />
                    </RowControl>
                  </RowGroup>
                ),
              },
            ]}
          />
        </div>
      </Block>

      <Block
        title="Unit cards & phone dock (D73)"
        note="Status pill sits on the photo corner; line 1 is name and ⋯; line 2 is type · guests · beds; line 3 is '₱2,600 a night'. The phone dock + is 52 px, lifted a third above the dock with a 4 px page-colour ring."
      >
        <div className="space-y-6">
          <div className="grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
            <article className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                <img
                  src="/demo-media/ulap-suites/photos/studio-fog-1-800.webp"
                  alt=""
                  loading="lazy"
                  className="size-full object-cover"
                />
                <UnitStatusBadge
                  status="listed"
                  overlay
                  className="pointer-events-none absolute top-2.5 left-2.5 z-10"
                />
              </div>
              <div className="flex flex-1 flex-col justify-between gap-1 p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium">Studio Fog</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="-mr-1.5 size-9 shrink-0"
                    aria-label="More for Studio Fog"
                  >
                    <MoreHorizontalIcon aria-hidden="true" />
                  </Button>
                </div>
                <p className="truncate text-sm text-muted-foreground">
                  Whole place · 2 guests · 1 bed
                </p>
                <p className="text-sm font-medium text-foreground tabular">₱2,600 a night</p>
              </div>
            </article>

            <div className="flex flex-col justify-between gap-4">
              <article className="flex items-center gap-3 overflow-hidden rounded-xl border border-border bg-card p-2.5">
                <div className="relative aspect-[4/3] w-[88px] shrink-0 overflow-hidden rounded-lg bg-muted">
                  <img
                    src="/demo-media/ulap-suites/photos/taal-view-1br-1-800.webp"
                    alt=""
                    loading="lazy"
                    className="size-full object-cover"
                  />
                  <UnitStatusBadge
                    status="draft"
                    overlay
                    className="pointer-events-none absolute top-1 left-1 z-10 h-5 px-1.5 text-[11px]"
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-between gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium">1BR Taal View</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="-mr-1.5 size-9 shrink-0"
                      aria-label="More for 1BR Taal View"
                    >
                      <MoreHorizontalIcon aria-hidden="true" />
                    </Button>
                  </div>
                  <p className="truncate text-sm text-muted-foreground">
                    Whole place · 4 guests · 2 beds
                  </p>
                  <p className="text-sm font-medium text-foreground tabular">₱3,400 a night</p>
                </div>
              </article>

              <div className="pt-4">
                <div
                  role="group"
                  aria-label="Phone dock sample"
                  className="mx-auto flex h-16 max-w-sm items-center gap-1 rounded-full border border-border frost px-1 shadow-md"
                >
                  <button type="button" data-active="" className={dockSlotClass}>
                    <span className="relative flex h-7 w-12 items-center justify-center rounded-full bg-accent text-primary">
                      <HomeIcon aria-hidden="true" className="size-5" />
                    </span>
                    <span className="truncate leading-tight">Home</span>
                  </button>
                  <button type="button" className={dockSlotClass}>
                    <span className="relative flex h-7 w-12 items-center justify-center rounded-full">
                      <CalendarDaysIcon aria-hidden="true" className="size-5" />
                    </span>
                    <span className="truncate leading-tight">Calendar</span>
                  </button>
                  <div className="flex h-14 min-w-0 flex-1 items-center justify-center">
                    <button
                      type="button"
                      aria-label="Add (sample)"
                      onClick={() => setSheet('add')}
                      className="press relative -translate-y-6 flex size-13 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md ring-4 ring-background outline-none hover-hover:hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                      <PlusIcon aria-hidden="true" className="size-6" />
                    </button>
                  </div>
                  <button type="button" className={dockSlotClass}>
                    <span className="relative flex h-7 w-12 items-center justify-center rounded-full">
                      <MessageSquareIcon aria-hidden="true" className="size-5" />
                    </span>
                    <span className="truncate leading-tight">Inbox</span>
                  </button>
                  <button type="button" className={dockSlotClass}>
                    <span className="relative flex h-7 w-12 items-center justify-center rounded-full">
                      <MoreHorizontalIcon aria-hidden="true" className="size-5" />
                    </span>
                    <span className="truncate leading-tight">More</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Block>

      <Block
        title="Save pill"
        note="Type in the field. On phones the pill floats above the dock; on desktop under the top bar."
      >
        <Field className="max-w-md">
          <FieldLabel htmlFor="kit-save-name">Unit name</FieldLabel>
          <Input
            id="kit-save-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <SaveBar
          dirty={dirty}
          state={saveState}
          onDiscard={() => setName(savedName)}
          onSave={() => {
            setSaveState('busy');
            window.setTimeout(() => {
              setSavedName(name);
              setSaveState('done');
              window.setTimeout(() => setSaveState('idle'), 1500);
            }, 600);
          }}
        />
      </Block>

      <KitPatternsUi1Section />
      <KitPatternsUi2Section />
      <KitPatternsUi3Section />
      <Suspense fallback={null}>
        <KitPatternsUi4Section />
      </Suspense>
    </div>
  );
}
