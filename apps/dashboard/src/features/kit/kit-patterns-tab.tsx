import { useState } from 'react';
import { BedDoubleIcon, HomeIcon } from 'lucide-react';
import { Button } from '@smartapp/ui/components/button';
import { Field, FieldLabel } from '@smartapp/ui/components/field';
import { Input } from '@smartapp/ui/components/input';
import { AppSheet } from '@smartapp/ui/compositions/app-sheet';
import { ChoiceChip } from '@smartapp/ui/compositions/choice-chip';
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
  const [sheet, setSheet] = useState<'none' | 'form' | 'long'>('none');
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
          <Button variant="outline" onClick={() => setSheet('form')}>
            Open a form sheet
          </Button>
          <Button variant="outline" onClick={() => setSheet('long')}>
            Open a long sheet
          </Button>
        </div>
        <AppSheet
          open={sheet === 'form'}
          onOpenChange={(open) => setSheet(open ? 'form' : 'none')}
          title="Add a unit"
          description="Start with the basics. Photos come next."
          height="full"
          footer={
            <>
              <Button variant="outline" onClick={() => setSheet('none')}>
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
    </div>
  );
}
