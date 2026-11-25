import { Suspense, lazy, useState, type ReactNode } from 'react';
import { BedDoubleIcon, CreditCardIcon, HomeIcon, UserIcon } from 'lucide-react';
import { Button } from '@smartapp/ui/components/button';
import { Calendar } from '@smartapp/ui/components/calendar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@smartapp/ui/components/card';
import { Checkbox } from '@smartapp/ui/components/checkbox';
import { CircularProgressCombined } from '@smartapp/ui/components/circular-progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@smartapp/ui/components/dialog';
import { Field, FieldDescription, FieldError, FieldLabel } from '@smartapp/ui/components/field';
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadItem,
  FileUploadItemDelete,
  FileUploadItemMetadata,
  FileUploadItemPreview,
  FileUploadList,
  FileUploadTrigger,
} from '@smartapp/ui/components/file-upload';
import { Input } from '@smartapp/ui/components/input';
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@smartapp/ui/components/item';
import { Label } from '@smartapp/ui/components/label';
import { NativeSelect, NativeSelectOption } from '@smartapp/ui/components/native-select';
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from '@smartapp/ui/components/number-field';
import { Popover, PopoverContent, PopoverTrigger } from '@smartapp/ui/components/popover';
import { Progress } from '@smartapp/ui/components/progress';
import { RadioGroup, RadioGroupItem } from '@smartapp/ui/components/radio-group';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from '@smartapp/ui/components/responsive-dialog';
import { Sortable, SortableItem, SortableItemHandle } from '@smartapp/ui/components/sortable';
import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from '@smartapp/ui/components/stepper';
import { Switch } from '@smartapp/ui/components/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@smartapp/ui/components/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@smartapp/ui/components/tabs';
import { Textarea } from '@smartapp/ui/components/textarea';
import { Toggle } from '@smartapp/ui/components/toggle';
import { ToggleGroup, ToggleGroupItem } from '@smartapp/ui/components/toggle-group';
import { ToggleBookmark } from '@smartapp/ui/variants/toggle-group/toggle-bookmark';
import { ToggleFavorite } from '@smartapp/ui/variants/toggle-group/toggle-favorite';
import { ToggleGroupSpaced } from '@smartapp/ui/variants/toggle-group/toggle-group-spaced';

import { KitFormsUi1Section } from './kit-forms-ui1-section';
import { KitFormsUi2Section } from './kit-forms-ui2-section';
import { KitFormsUi3Section } from './kit-forms-ui3-section';

const KitCalendarVariantsRow = lazy(() =>
  import('./kit-forms-ui4-section').then((m) => ({ default: m.KitCalendarVariantsRow })),
);
const KitFormsUi4Section = lazy(() =>
  import('./kit-forms-ui4-section').then((m) => ({ default: m.KitFormsUi4Section })),
);
const KitFormsUi5Section = lazy(() =>
  import('./kit-forms-ui5-section').then((m) => ({ default: m.KitFormsUi5Section })),
);
import { AmenityChips } from '@smartapp/ui/compositions/amenity-chips';
import { AsyncButton, type AsyncButtonState } from '@smartapp/ui/compositions/async-button';
import { celebrate, resetCelebration } from '@smartapp/ui/lib/celebration';
import { DraftNotice } from '@smartapp/ui/compositions/draft-notice';
import { GoogleButton } from '@smartapp/ui/compositions/google-button';
import { GoLiveCard } from '@smartapp/ui/compositions/go-live-card';
import { MilestonePicture } from '@smartapp/ui/compositions/milestone-picture';
import { MoneyInput } from '@smartapp/ui/compositions/money-input';
import { notify } from '@smartapp/ui/lib/notify';
import { PasswordInput } from '@smartapp/ui/compositions/password-input';
import { PersonAvatar } from '@smartapp/ui/compositions/person-avatar';
import { PhoneInput } from '@smartapp/ui/compositions/phone-input';
import { SaveBar } from '@smartapp/ui/compositions/save-bar';
import { SettingsList } from '@smartapp/ui/compositions/settings-list';
import { SlugField, type SlugCheckResult } from '@smartapp/ui/compositions/slug-field';
import { TimeSelect } from '@smartapp/ui/compositions/time-select';
import { MILESTONE_ART_KEYS } from '@smartapp/ui/lib/milestone-art';
import { DualSurfaceShowcase } from './kit-base-tab';

const TAKEN = new Set(['ulap-suites', 'bahay-batis']);

async function fakeCheck(slug: string): Promise<SlugCheckResult> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  if (TAKEN.has(slug)) {
    return { status: 'taken', suggestions: [`${slug}-tagaytay`, `${slug}-stay`] };
  }
  return { status: 'available', suggestions: [] };
}

const AMENITY_SAMPLE = [
  { id: 'wifi', label: 'Wi-Fi', icon: 'wifi', group: 'Essentials' },
  { id: 'aircon', label: 'Aircon', icon: 'snowflake', group: 'Essentials' },
  { id: 'parking', label: 'Free parking', icon: 'car', group: 'Essentials' },
  { id: 'bunk', label: 'Bunk beds', icon: 'bed-bunk', group: 'Sleeping' },
  { id: 'towels', label: 'Towels', icon: 'towel', group: 'Sleeping' },
  { id: 'kettle', label: 'Electric kettle', icon: 'kettle', group: 'Kitchen' },
  { id: 'bbq', label: 'BBQ grill', icon: 'barbecue', group: 'Kitchen' },
  { id: 'hottub', label: 'Hot tub', icon: 'hot-tub', group: 'Outdoors' },
  { id: 'pool', label: 'Pool', icon: 'waves', group: 'Outdoors' },
];

function Section({
  title,
  source,
  useFor,
  dont,
  children,
}: {
  readonly title: string;
  readonly source: string;
  readonly useFor: string;
  readonly dont: string;
  readonly children: (surface: 'light' | 'dark') => ReactNode;
}) {
  return (
    <DualSurfaceShowcase
      title={title}
      source={source}
      useFor={useFor}
      dont={dont}
      render={children}
    />
  );
}

function FormFieldsDemo() {
  return (
    <div className="space-y-4">
      <Field>
        <FieldLabel htmlFor="kit-name">Place name</FieldLabel>
        <Input id="kit-name" defaultValue="Ulap Suites" />
        <FieldDescription>Guests see this at the top of your page.</FieldDescription>
      </Field>
      <Field data-invalid="true">
        <FieldLabel htmlFor="kit-email">Email</FieldLabel>
        <Input id="kit-email" aria-invalid="true" defaultValue="owner@" />
        <FieldError>Enter an email like name@gmail.com.</FieldError>
      </Field>
      <Field>
        <FieldLabel htmlFor="kit-about">About your place</FieldLabel>
        <Textarea id="kit-about" placeholder="A cool, quiet suite in Tagaytay…" />
      </Field>
      <Field>
        <FieldLabel htmlFor="kit-province">Province</FieldLabel>
        <NativeSelect id="kit-province" defaultValue="cavite">
          <NativeSelectOption value="cavite">Cavite</NativeSelectOption>
          <NativeSelectOption value="batangas">Batangas</NativeSelectOption>
          <NativeSelectOption value="laguna">Laguna</NativeSelectOption>
        </NativeSelect>
      </Field>
    </div>
  );
}

function ChoicesDemo() {
  return (
    <div className="space-y-4">
      <RadioGroup defaultValue="whole" aria-label="What you rent">
        <div className="flex items-center gap-2">
          <RadioGroupItem value="whole" id="kit-whole" />
          <Label htmlFor="kit-whole">Whole place</Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="room" id="kit-room" />
          <Label htmlFor="kit-room">Private room</Label>
        </div>
      </RadioGroup>
      <div className="flex items-center gap-2">
        <Checkbox id="kit-terms" />
        <Label htmlFor="kit-terms">I agree to the terms</Label>
      </div>
      <div className="flex items-center gap-2">
        <Switch id="kit-weekend" defaultChecked />
        <Label htmlFor="kit-weekend">Charge more on some days</Label>
      </div>
      <ToggleGroup multiple defaultValue={['fri', 'sat']} aria-label="Days">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <ToggleGroupItem key={day} value={day.toLowerCase()} aria-label={day}>
            {day}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <Toggle>Listed only</Toggle>
      <div className="space-y-1.5 border-t border-border pt-3">
        <p className="text-xs font-medium text-muted-foreground">Variants</p>
        <div className="flex flex-wrap items-center gap-2">
          <ToggleGroupSpaced />
          <ToggleBookmark />
          <ToggleFavorite />
        </div>
      </div>
      <NumberField defaultValue={2} min={1} max={20}>
        <Label>Guests</Label>
        <NumberFieldGroup>
          <NumberFieldDecrement />
          <NumberFieldInput aria-label="Guests" />
          <NumberFieldIncrement />
        </NumberFieldGroup>
      </NumberField>
    </div>
  );
}

function LayoutDemo() {
  return (
    <div className="space-y-4">
      <Tabs defaultValue="basics">
        <TabsList>
          <TabsTrigger value="basics">Basics</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
        </TabsList>
        <TabsContent value="basics" className="pt-2 text-sm text-muted-foreground">
          Name, type and guests.
        </TabsContent>
        <TabsContent value="photos" className="pt-2 text-sm text-muted-foreground">
          At least 3 photos.
        </TabsContent>
      </Tabs>
      <Card>
        <CardHeader>
          <CardTitle>Ulap Suite A</CardTitle>
          <CardDescription>Whole place · 4 guests</CardDescription>
        </CardHeader>
        <CardContent className="text-sm">₱3,500 / night</CardContent>
      </Card>
      <Item variant="outline">
        <ItemMedia variant="icon">
          <BedDoubleIcon />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Room 2A</ItemTitle>
          <ItemDescription>6 beds · 4 listed</ItemDescription>
        </ItemContent>
      </Item>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Unit</TableHead>
            <TableHead className="text-right">Price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Ulap Suite A</TableCell>
            <TableCell className="text-right tabular">₱3,500</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Bed 1</TableCell>
            <TableCell className="text-right tabular">₱450</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <Progress value={60} aria-label="Setup progress" />
      <CircularProgressCombined value={62} label="Setup" />
    </div>
  );
}

function OverlaysDemo() {
  return (
    <div className="flex flex-wrap gap-2">
      <Dialog>
        <DialogTrigger render={<Button variant="outline" />}>Dialog</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change link</DialogTitle>
            <DialogDescription>Old links and printed QR codes keep working.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button>Change link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ResponsiveDialog>
        <ResponsiveDialogTrigger render={<Button variant="outline" />}>
          Responsive dialog
        </ResponsiveDialogTrigger>
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Discard changes?</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              A bottom sheet on phones, a dialog on bigger screens.
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <ResponsiveDialogFooter>
            <Button variant="destructive">Discard</Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
      <Popover>
        <PopoverTrigger render={<Button variant="outline" />}>Popover calendar</PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar mode="range" numberOfMonths={1} />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function StepperDemo() {
  const steps = ['Your place', 'First unit', 'Photos', 'Price', 'Payment', 'Rules'];
  return (
    <Stepper defaultValue={2}>
      <StepperNav>
        {steps.map((title, index) => (
          <StepperItem key={title} step={index + 1} className="relative flex-1">
            <StepperTrigger className="flex flex-col gap-1.5">
              <StepperIndicator>{index + 1}</StepperIndicator>
              <StepperTitle className="hidden text-xs sm:block">{title}</StepperTitle>
            </StepperTrigger>
            {index < steps.length - 1 ? <StepperSeparator /> : null}
          </StepperItem>
        ))}
      </StepperNav>
    </Stepper>
  );
}

function SortableDemo() {
  const [items, setItems] = useState(['Cover photo', 'Bedroom', 'Bathroom', 'View']);
  return (
    <Sortable value={items} onValueChange={setItems} getItemValue={(item) => item}>
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <SortableItem
            key={item}
            value={item}
            className="flex items-center gap-2 rounded-lg border border-border bg-card p-2 text-sm"
          >
            <SortableItemHandle className="cursor-grab px-1 text-muted-foreground">
              ⋮⋮
            </SortableItemHandle>
            {item}
          </SortableItem>
        ))}
      </div>
    </Sortable>
  );
}

function FileUploadDemo() {
  const [files, setFiles] = useState<File[]>([]);
  return (
    <FileUpload
      value={files}
      onValueChange={setFiles}
      accept="image/jpeg,image/png,image/webp"
      maxFiles={3}
      multiple
    >
      <FileUploadDropzone className="flex-col gap-2 text-center text-sm">
        <span className="text-muted-foreground">Drop photos here, or</span>
        <FileUploadTrigger render={<Button variant="outline" size="sm" />}>
          Choose photos
        </FileUploadTrigger>
      </FileUploadDropzone>
      <FileUploadList>
        {files.map((file) => (
          <FileUploadItem key={`${file.name}-${file.size}`} value={file}>
            <FileUploadItemPreview />
            <FileUploadItemMetadata />
            <FileUploadItemDelete render={<Button variant="ghost" size="sm" />}>
              Remove
            </FileUploadItemDelete>
          </FileUploadItem>
        ))}
      </FileUploadList>
    </FileUpload>
  );
}

function CompositionsDemo() {
  const [phone, setPhone] = useState('+639171234567');
  const [money, setMoney] = useState<number | null>(350_000);
  const [slug, setSlug] = useState('ulap-suites');
  const [time, setTime] = useState('14:00');
  const [amenities, setAmenities] = useState<string[]>(['wifi', 'aircon']);
  const [saveState, setSaveState] = useState<AsyncButtonState>('idle');
  const [dirty, setDirty] = useState(true);

  function fakeSave() {
    setSaveState('busy');
    window.setTimeout(() => setSaveState('done'), 900);
    window.setTimeout(() => {
      setSaveState('idle');
      setDirty(false);
    }, 2300);
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="kit-phone">Mobile</FieldLabel>
          <PhoneInput id="kit-phone" value={phone} onValueChange={setPhone} />
          <FieldDescription>Stored as {phone || '—'}</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="kit-money">Base price per night</FieldLabel>
          <MoneyInput id="kit-money" value={money} onValueChange={setMoney} />
          <FieldDescription>
            Stored as {money ?? '—'} centavos. Try 1.5k or 150000.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="kit-password">Password</FieldLabel>
          <PasswordInput
            id="kit-password"
            autoComplete="new-password"
            rules="At least 8 characters, with a number."
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="kit-time">Check-in time</FieldLabel>
          <TimeSelect id="kit-time" value={time} onValueChange={setTime} />
        </Field>
        <Field className="md:col-span-2">
          <FieldLabel htmlFor="kit-slug">Web address</FieldLabel>
          <SlugField
            id="kit-slug"
            host="smartapp.ph"
            value={slug}
            onValueChange={setSlug}
            check={fakeCheck}
          />
        </Field>
      </div>
      <div className="max-w-sm space-y-3">
        <GoogleButton />
        <AsyncButton state={saveState} onClick={fakeSave}>
          Save changes
        </AsyncButton>
      </div>
      <AmenityChips
        options={AMENITY_SAMPLE}
        value={amenities}
        onValueChange={setAmenities}
        onAddOwn={(label) => notify.success(`${label} added`)}
      />
      <SettingsList
        groups={[
          {
            id: 'property',
            title: 'Property',
            rows: [
              {
                id: 'details',
                label: 'Details',
                value: 'Ulap Suites',
                icon: <HomeIcon />,
                render: (props) => <button type="button" {...props} />,
              },
              {
                id: 'payments',
                label: 'Payments',
                value: '2 ways to pay',
                icon: <CreditCardIcon />,
                unfinished: true,
                render: (props) => <button type="button" {...props} />,
              },
            ],
          },
          {
            id: 'you',
            title: 'You',
            rows: [
              {
                id: 'account',
                label: 'Account',
                value: 'Light',
                icon: <UserIcon />,
                render: (props) => <button type="button" {...props} />,
              },
            ],
          },
        ]}
      />
      <div className="flex flex-wrap items-center gap-3">
        <PersonAvatar
          name="Lorna Reyes"
          avatar={{ kind: 'face', style: 'soft', face: 3, theme: 'sky' }}
          size="lg"
        />
        <PersonAvatar
          name="Ramon Dela Cruz"
          avatar={{ kind: 'initials', text: 'RD', theme: 'navy' }}
          size="lg"
        />
        <PersonAvatar
          name="Ana"
          avatar={{ kind: 'preset', preset_id: 'notionists-Mabuhay' }}
          size="lg"
        />
      </div>
      <div className="flex flex-wrap gap-4">
        {MILESTONE_ART_KEYS.map((key) => (
          <figure
            key={key}
            className="flex flex-col items-center gap-1.5 text-xs text-muted-foreground"
          >
            <MilestonePicture art={key} tone={key === 'live' ? 'celebrate' : 'primary'} size="sm" />
            <figcaption>{key}</figcaption>
          </figure>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() =>
            notify.success('6 beds hidden', { onUndo: () => notify.info('Beds shown again') })
          }
        >
          Toast with Undo
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            resetCelebration('kit');
            void celebrate('kit');
          }}
        >
          Go-live confetti
        </Button>
      </div>
      <DraftNotice
        onKeep={() => notify.info('Draft kept')}
        onDiscard={() => notify.info('Started over')}
      />
      <SaveBar
        dirty={dirty}
        state={saveState}
        onSave={fakeSave}
        onDiscard={() => setDirty(false)}
      />
    </div>
  );
}

/** Phase 4 form components and compositions (P4-2), each in light and dark. */
export function KitFormsTab() {
  return (
    <>
      <div className="space-y-6">
        <Section
          title="Field, Input, Textarea, NativeSelect"
          source="shadcn base-nova"
          useFor="Every form field: label, hint and the error tied to its field."
          dont="Use placeholder text as the label, or type=number for money."
        >
          {() => <FormFieldsDemo />}
        </Section>
        <Section
          title="Radio, Checkbox, Switch, Toggle, NumberField"
          source="shadcn + ReUI number-field"
          useFor="Choices, on/off settings, day chips and counts (guests, beds)."
          dont="Use a switch for something that needs Save; use a checkbox there."
        >
          {() => <ChoicesDemo />}
        </Section>
        <Section
          title="Tabs, Card, Item, Table, Progress, CircularProgress"
          source="shadcn + Dice UI circular-progress"
          useFor="Unit lists (cards on phones, table on desktop) and setup progress."
          dont="Put every section in an identical card; use a data grid."
        >
          {() => <LayoutDemo />}
        </Section>
        <Section
          title="Dialog, ResponsiveDialog, Popover, Calendar"
          source="shadcn + Dice UI responsive-dialog"
          useFor="Confirmations (bottom sheet on phones) and the special-dates calendar."
          dont="Put long forms in a dialog; use a page or a sheet."
        >
          {() => <OverlaysDemo />}
        </Section>
        <Suspense fallback={null}>
          <KitCalendarVariantsRow />
        </Suspense>
        <Section
          title="Stepper"
          source="ReUI stepper"
          useFor="Onboarding steps and the waiting timeline."
          dont="Let people move between steps by swiping."
        >
          {() => <StepperDemo />}
        </Section>
        <Section
          title="Sortable"
          source="ReUI sortable (dnd-kit)"
          useFor="Photo and unit order, always with Move buttons too."
          dont="Make dragging the only way to reorder."
        >
          {() => <SortableDemo />}
        </Section>
        <Section
          title="FileUpload"
          source="Dice UI file-upload"
          useFor="The photo drop zone and picker."
          dont="List HEIC in accept."
        >
          {() => <FileUploadDemo />}
        </Section>
        <Section
          title="GoLiveCard"
          source="Composition (D53)"
          useFor="The moment a page is published (Phase 5). Bursts confetti once per property per device."
          dont="Show it for anything smaller than going live."
        >
          {() => (
            <GoLiveCard
              propertyName="Ulap Suites"
              url="https://smartapp.ph/ulap-suites"
              celebrationKey={null}
              className="max-w-sm"
            />
          )}
        </Section>
        <section className="space-y-3 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm">
          <h2 className="font-heading text-lg font-semibold">Phase 4 compositions</h2>
          <p className="text-xs text-muted-foreground">
            PhoneInput, MoneyInput, PasswordInput, TimeSelect, SlugField, GoogleButton, AsyncButton,
            AmenityChips, SettingsList, PersonAvatar (with legacy preset fallback), MilestonePicture
            (Fluent Emoji 3D, MIT), notify(), celebrate(), DraftNotice and SaveBar. Switch the theme
            above to see dark mode.
          </p>
          <CompositionsDemo />
        </section>
        <KitFormsUi1Section />
        <KitFormsUi2Section />
        <KitFormsUi3Section />
        <Suspense fallback={null}>
          <KitFormsUi4Section />
        </Suspense>
        <Suspense fallback={null}>
          <KitFormsUi5Section />
        </Suspense>
      </div>
    </>
  );
}
