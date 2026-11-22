import { useRef, useState } from 'react';
import { Button } from '@smartapp/ui/components/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@smartapp/ui/components/command';
import {
  Editable,
  EditableArea,
  EditableCancel,
  EditableInput,
  EditableLabel,
  EditablePreview,
  EditableSubmit,
  EditableToolbar,
  EditableTrigger,
} from '@smartapp/ui/components/editable';
import {
  Faceted,
  FacetedClear,
  FacetedContent,
  FacetedEmpty,
  FacetedGroup,
  FacetedInput,
  FacetedItem,
  FacetedItemIndicator,
  FacetedList,
  FacetedTrigger,
  FacetedValue,
} from '@smartapp/ui/components/faceted';
import {
  KeyValue,
  KeyValueAdd,
  KeyValueItem,
  KeyValueKeyInput,
  KeyValueList,
  KeyValueRemove,
  KeyValueValueInput,
} from '@smartapp/ui/components/key-value';
import {
  Listbox,
  ListboxGroup,
  ListboxGroupLabel,
  ListboxItem,
  ListboxItemIndicator,
} from '@smartapp/ui/components/listbox';
import {
  Cascader,
  CascaderContent,
  CascaderEmpty,
  CascaderList,
  CascaderStatus,
  CascaderTrigger,
} from '@smartapp/ui/components/reui/cascader/cascader';
import {
  CascaderBack,
  CascaderBreadcrumb,
  CascaderInput,
  CascaderValue,
} from '@smartapp/ui/components/reui/cascader/cascader-nav';
import {
  createFilterQuery,
  createFilterRule,
  Filters,
  type FilterField,
  type FilterQuery,
} from '@smartapp/ui/components/reui/filters/filters';
import {
  SelectionToolbar,
  SelectionToolbarItem,
  SelectionToolbarSeparator,
} from '@smartapp/ui/components/selection-toolbar';
import {
  TagsInput,
  TagsInputClear,
  TagsInputInput,
  TagsInputItem,
  TagsInputLabel,
  TagsInputList,
} from '@smartapp/ui/components/tags-input';
import { CopyIcon, MessageSquareReplyIcon, Trash2Icon } from 'lucide-react';

import { DualSurfaceShowcase } from './kit-base-tab';

const PH_LOCATION_NODES = [
  {
    value: 'cavite',
    label: 'Cavite',
    children: [
      {
        value: 'tagaytay',
        label: 'Tagaytay City',
        children: [
          { value: 'maharlika-west', label: 'Maharlika West' },
          { value: 'kaybagal-south', label: 'Kaybagal South' },
          { value: 'silang-crossing', label: 'Silang Crossing East' },
        ],
      },
      {
        value: 'silang',
        label: 'Silang',
        children: [{ value: 'lalaan-1', label: 'Lalaan 1st' }],
      },
    ],
  },
  {
    value: 'laguna',
    label: 'Laguna',
    children: [
      {
        value: 'calamba',
        label: 'Calamba',
        children: [
          { value: 'pansol', label: 'Pansol' },
          { value: 'bagong-kalsada', label: 'Bagong Kalsada' },
        ],
      },
    ],
  },
];

const BOOKING_FILTER_FIELDS: FilterField[] = [
  {
    id: 'status',
    label: 'Booking status',
    type: 'select',
    options: [
      { value: 'held', label: 'Held' },
      { value: 'in_review', label: 'In review' },
      { value: 'confirmed', label: 'Confirmed' },
      { value: 'checked_in', label: 'Checked in' },
    ],
  },
  {
    id: 'unit',
    label: 'Unit',
    type: 'select',
    options: [
      { value: 'studio-fog', label: 'Studio Fog' },
      { value: 'taal-1br', label: '1BR Taal View' },
      { value: 'garden-suite', label: 'Garden Suite' },
    ],
  },
  {
    id: 'guest',
    label: 'Guest name',
    type: 'text',
  },
];

const INITIAL_FILTER_QUERY: FilterQuery = createFilterQuery([
  createFilterRule({ id: 'r1', path: ['status'], operator: 'is', value: 'in_review' }),
]);

const FACET_OPTIONS = [
  { value: 'held', label: 'Held' },
  { value: 'in_review', label: 'In review' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'checked_in', label: 'Checked in' },
  { value: 'completed', label: 'Completed' },
];

function FiltersAndCascaderDemo() {
  const [query, setQuery] = useState<FilterQuery>(INITIAL_FILTER_QUERY);
  const [barangay, setBarangay] = useState<string | null>('maharlika-west');

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">Booking filters bar</p>
        <Filters fields={BOOKING_FILTER_FIELDS} query={query} onQueryChange={setQuery} showClear />
      </div>
      <div className="max-w-xs space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">
          Location cascader (Province → City → Barangay)
        </p>
        <Cascader
          items={PH_LOCATION_NODES}
          value={barangay ?? ''}
          onValueChange={(next) => setBarangay(next)}
        >
          <CascaderTrigger className="w-full justify-between">
            <CascaderValue placeholder="Pick province, city and barangay" />
          </CascaderTrigger>
          <CascaderContent>
            <CascaderInput placeholder="Search places…" />
            <CascaderBack />
            <CascaderBreadcrumb />
            <CascaderList />
            <CascaderEmpty>No matching place</CascaderEmpty>
            <CascaderStatus />
          </CascaderContent>
        </Cascader>
      </div>
    </div>
  );
}

function CommandAndFacetedDemo() {
  const [statuses, setStatuses] = useState<string[]>(['in_review', 'confirmed']);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Faceted
          multiple
          items={FACET_OPTIONS}
          value={statuses}
          onValueChange={(next) => setStatuses(next ?? [])}
        >
          <FacetedTrigger
            render={<Button variant="outline" size="sm" className="min-h-11 sm:min-h-9" />}
          >
            <FacetedValue placeholder="Filter status" />
          </FacetedTrigger>
          <FacetedContent>
            <FacetedInput placeholder="Search status…" />
            <FacetedList>
              <FacetedEmpty>No status found.</FacetedEmpty>
              <FacetedGroup>
                {FACET_OPTIONS.map((option) => (
                  <FacetedItem key={option.value} value={option.value}>
                    <span>{option.label}</span>
                    <FacetedItemIndicator />
                  </FacetedItem>
                ))}
              </FacetedGroup>
              <FacetedClear />
            </FacetedList>
          </FacetedContent>
        </Faceted>
      </div>
      <Command className="max-w-sm rounded-lg border border-border">
        <CommandInput placeholder="Jump to a unit or setting…" />
        <CommandList>
          <CommandEmpty>No match found.</CommandEmpty>
          <CommandGroup heading="Units">
            <CommandItem>Studio Fog · ₱2,600 / night</CommandItem>
            <CommandItem>1BR Taal View · ₱3,400 / night</CommandItem>
          </CommandGroup>
          <CommandGroup heading="Settings">
            <CommandItem>Payment accounts</CommandItem>
            <CommandItem>Check-in and check-out hours</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  );
}

function FeesAndInlineInputsDemo() {
  const [fees, setFees] = useState([
    { id: 'cleaning', key: 'Cleaning fee', value: '₱500 per stay' },
    { id: 'extra-guest', key: 'Extra guest', value: '₱350 per night' },
  ]);
  const [unitTitle, setUnitTitle] = useState('Studio Fog');
  const [rules, setRules] = useState([
    'No smoking inside',
    'Quiet hours 10 PM–7 AM',
    'Pets welcome',
  ]);
  const [arrivalSlot, setArrivalSlot] = useState('2pm');

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">KeyValue (fees editor)</p>
        <KeyValue
          value={fees}
          onValueChange={setFees}
          keyPlaceholder="Fee name"
          valuePlaceholder="Amount"
        >
          <KeyValueList>
            <KeyValueItem>
              <KeyValueKeyInput aria-label="Fee name" />
              <KeyValueValueInput aria-label="Fee amount" />
              <KeyValueRemove aria-label="Remove fee">
                <Trash2Icon className="size-4" aria-hidden="true" />
              </KeyValueRemove>
            </KeyValueItem>
          </KeyValueList>
          <KeyValueAdd>Add fee</KeyValueAdd>
        </KeyValue>
      </div>

      <div className="space-y-1.5">
        <Editable value={unitTitle} onValueChange={setUnitTitle} onSubmit={setUnitTitle}>
          <EditableLabel>Inline unit rename (Editable)</EditableLabel>
          <EditableArea>
            <EditablePreview />
            <EditableInput />
          </EditableArea>
          <EditableTrigger render={<Button variant="outline" size="sm" className="mt-1.5 w-fit" />}>
            Rename unit
          </EditableTrigger>
          <EditableToolbar className="mt-1.5">
            <EditableSubmit render={<Button size="sm" />}>Save name</EditableSubmit>
            <EditableCancel render={<Button variant="outline" size="sm" />}>Cancel</EditableCancel>
          </EditableToolbar>
        </Editable>
      </div>

      <TagsInput value={rules} onValueChange={setRules} editable>
        <TagsInputLabel>House rules &amp; tags (TagsInput)</TagsInputLabel>
        <TagsInputList>
          {rules.map((rule) => (
            <TagsInputItem key={rule} value={rule}>
              {rule}
            </TagsInputItem>
          ))}
          <TagsInputInput placeholder="Type a rule and press Enter…" />
        </TagsInputList>
        <TagsInputClear asChild>
          <Button variant="ghost" size="sm" className="w-fit">
            Clear rules
          </Button>
        </TagsInputClear>
      </TagsInput>

      <div className="max-w-sm space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">Arrival preference (Listbox)</p>
        <Listbox
          value={arrivalSlot}
          onValueChange={(next) => {
            if (typeof next === 'string') setArrivalSlot(next);
          }}
          aria-label="Arrival preference"
        >
          <ListboxGroup>
            <ListboxGroupLabel>Check-in window</ListboxGroupLabel>
            <ListboxItem value="2pm">
              <span>2:00 PM – 4:00 PM (Standard)</span>
              <ListboxItemIndicator />
            </ListboxItem>
            <ListboxItem value="5pm">
              <span>5:00 PM – 8:00 PM (Evening self check-in)</span>
              <ListboxItemIndicator />
            </ListboxItem>
          </ListboxGroup>
        </Listbox>
      </div>
    </div>
  );
}

function SelectionToolbarDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        className="rounded-lg border border-border bg-card p-3.5 text-sm leading-relaxed text-card-foreground select-text"
      >
        Highlight any part of this guest note to open the floating toolbar: &ldquo;Hi! We are
        arriving around 3:30 PM from Manila with 1 car. Can you send the gate pin?&rdquo;
      </div>
      <SelectionToolbar container={containerRef}>
        <SelectionToolbarItem onSelect={(text) => setLastAction(`Quoted "${text.slice(0, 32)}"`)}>
          <MessageSquareReplyIcon className="size-3.5" aria-hidden="true" />
          Quote
        </SelectionToolbarItem>
        <SelectionToolbarSeparator />
        <SelectionToolbarItem onSelect={(text) => setLastAction(`Copied "${text.slice(0, 32)}"`)}>
          <CopyIcon className="size-3.5" aria-hidden="true" />
          Copy
        </SelectionToolbarItem>
      </SelectionToolbar>
      {lastAction ? <p className="text-xs text-muted-foreground">{lastAction}</p> : null}
    </div>
  );
}

/** UI-3 form, filter, and picker components rendered in Dashboard `/kit` Forms tab. */
export function KitFormsUi3Section() {
  return (
    <div className="space-y-6">
      <DualSurfaceShowcase
        title="Filters & Cascader"
        source="@reui/filters · @reui/cascader (installed early from UI-6)"
        useFor="Multi-criteria bookings & guests filters (Phase 8) and province → city → barangay location pickers (Phase 6)."
        dont="Use Cascader for a flat single-level list (use NativeSelect or Select)."
        render={() => <FiltersAndCascaderDemo />}
      />

      <DualSurfaceShowcase
        title="Faceted & Command"
        source="@diceui/faceted · shadcn command (installed early from UI-6, cmdk 1.1.1)"
        useFor="Searchable multi-select filter popovers and quick keyboard command palettes."
        dont="Drop touch search inputs below 16 px or omit empty-state copy."
        render={() => <CommandAndFacetedDemo />}
      />

      <DualSurfaceShowcase
        title="KeyValue, Editable, TagsInput & Listbox"
        source="@diceui/key-value · @diceui/editable · @diceui/tags-input · @diceui/listbox"
        useFor="Optional fee rows, inline unit rename, house rules/languages tags, and keyboard-accessible option lists."
        dont="Use TagsInput for the fixed amenity catalogue (use AmenityChips)."
        render={() => <FeesAndInlineInputsDemo />}
      />

      <DualSurfaceShowcase
        title="SelectionToolbar"
        source="@diceui/selection-toolbar · @floating-ui/react-dom 2.1.9"
        useFor="Quick quote/copy actions when highlighting text in guest notes or messages."
        dont="Block native copy/paste or cover essential buttons when closed."
        render={() => <SelectionToolbarDemo />}
      />
    </div>
  );
}
