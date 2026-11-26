import { useState } from 'react';
import {
  AngleSlider,
  AngleSliderRange,
  AngleSliderThumb,
  AngleSliderTrack,
  AngleSliderValue,
} from '@smartapp/ui/components/angle-slider';
import { ButtonGroup } from '@smartapp/ui/components/button-group';
import {
  Mention,
  MentionContent,
  MentionInput,
  MentionItem,
  MentionLabel,
} from '@smartapp/ui/components/mention';
import {
  QueryBuilder,
  QueryBuilderAddRule,
  QueryBuilderConnector,
  QueryBuilderField,
  QueryBuilderGroup,
  QueryBuilderGroupContent,
  QueryBuilderGroupFooter,
  QueryBuilderOperator,
  QueryBuilderRemove,
  QueryBuilderRule,
  QueryBuilderRuleList,
  QueryBuilderValue,
} from '@smartapp/ui/components/query-builder';
import { SegmentedInput, SegmentedInputItem } from '@smartapp/ui/components/segmented-input';
import { Textarea } from '@smartapp/ui/components/textarea';
import type { QueryField, QueryGroup } from '@smartapp/ui/lib/query-builder';
import { Pattern as PhoneInputExample } from '@smartapp/ui/variants/inputs/c-phone-input-1';
import { Pattern as ComboboxExample } from '@smartapp/ui/variants/pickers/c-combobox-1';
import { Pattern as AutocompleteSearchExample } from '@smartapp/ui/variants/pickers/c-autocomplete-1';
import { BanIcon, CircleCheckIcon, CircleDotIcon } from 'lucide-react';

import { DualSurfaceShowcase } from './kit-base-tab';
import { KitVariantsSection } from './kit-variants-section';

const STAFF = [
  { id: 'lorna', name: 'Lorna Dizon', role: 'Caretaker' },
  { id: 'paolo', name: 'Paolo Cruz', role: 'Housekeeping' },
  { id: 'ana', name: 'Ana Reyes', role: 'Front desk' },
];

const BOOKING_FIELDS: QueryField[] = [
  { value: 'guest', label: 'Guest name', type: 'text' },
  {
    value: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { label: 'Held', value: 'held', icon: CircleDotIcon },
      { label: 'Confirmed', value: 'confirmed', icon: CircleCheckIcon },
      { label: 'Cancelled', value: 'cancelled', icon: BanIcon },
    ],
  },
  { value: 'nights', label: 'Nights', type: 'number' },
  { value: 'checkIn', label: 'Check-in', type: 'date' },
];

const DEFAULT_FILTER: QueryGroup = {
  id: 'root',
  combinator: 'and',
  rules: [
    { id: 'status', field: 'status', operator: 'eq', value: 'confirmed' },
    { id: 'nights', field: 'nights', operator: 'gte', value: '3' },
  ],
};

function SegmentedDemo() {
  const [time, setTime] = useState({ hour: '14', minute: '00' });
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">Check-in time</p>
      <SegmentedInput className="w-40">
        <SegmentedInputItem
          inputMode="numeric"
          className="text-base"
          aria-label="Hour"
          value={time.hour}
          onChange={(event) => setTime((value) => ({ ...value, hour: event.target.value }))}
        />
        <SegmentedInputItem
          inputMode="numeric"
          className="text-base"
          aria-label="Minute"
          value={time.minute}
          onChange={(event) => setTime((value) => ({ ...value, minute: event.target.value }))}
        />
      </SegmentedInput>
    </div>
  );
}

function MentionDemo() {
  return (
    <Mention className="w-full max-w-md">
      <MentionLabel>Note for staff</MentionLabel>
      <MentionInput placeholder="Type @ to tag a staff member" asChild>
        <Textarea />
      </MentionInput>
      <MentionContent>
        {STAFF.map((person) => (
          <MentionItem key={person.id} value={person.name}>
            <span className="text-sm">{person.name}</span>
            <span className="text-xs text-muted-foreground">{person.role}</span>
          </MentionItem>
        ))}
      </MentionContent>
    </Mention>
  );
}

function QueryDemo() {
  const [query, setQuery] = useState(DEFAULT_FILTER);
  return (
    <QueryBuilder fields={BOOKING_FIELDS} value={query} onValueChange={setQuery} className="w-full">
      <QueryBuilderGroup>
        <QueryBuilderConnector />
        <QueryBuilderGroupContent>
          <QueryBuilderRuleList>
            <QueryBuilderRule>
              <QueryBuilderConnector />
              <ButtonGroup>
                <QueryBuilderField />
                <QueryBuilderOperator />
                <QueryBuilderValue />
                <QueryBuilderRemove variant="outline" />
              </ButtonGroup>
            </QueryBuilderRule>
          </QueryBuilderRuleList>
          <QueryBuilderGroupFooter>
            <QueryBuilderAddRule />
          </QueryBuilderGroupFooter>
        </QueryBuilderGroupContent>
      </QueryBuilderGroup>
    </QueryBuilder>
  );
}

/** UI-6 form primitives, then the input, picker and calendar variant rows. */
export function KitFormsUi6Section() {
  return (
    <div className="space-y-6">
      <DualSurfaceShowcase
        title="Combobox"
        source="shadcn base-nova (offline install, UI-6) · example: ReUI c-combobox-1"
        useFor="Picking one item from a long list with typing: city, unit, guest."
        dont="Use it for under seven choices; a select or radio group is clearer."
        render={() => <ComboboxExample />}
      />
      <DualSurfaceShowcase
        title="Autocomplete"
        source="ReUI (offline install, UI-6) · example: ReUI c-autocomplete-1"
        useFor="Free text with suggestions, such as a landmark or street name."
        dont="Use it when only listed values are valid; that is a Combobox."
        render={() => <AutocompleteSearchExample />}
      />
      <DualSurfaceShowcase
        title="PhoneInput (ReUI, any country)"
        source="ReUI + react-phone-number-input (UI-6) · example: ReUI c-phone-input-1"
        useFor="Foreign guests' numbers on the booking form."
        dont="Replace our PhoneInput composition for Philippine mobile numbers (+63 mask, used at sign-in)."
        render={() => <PhoneInputExample />}
      />
      <DualSurfaceShowcase
        title="SegmentedInput"
        source="Dice UI (offline install, UI-6)"
        useFor="Short split values, such as check-in hour and minute."
        dont="Split codes people paste; use InputOTP."
        render={() => <SegmentedDemo />}
      />
      <DualSurfaceShowcase
        title="AngleSlider"
        source="Dice UI (offline install, UI-6)"
        useFor="Rotating a photo or a floor-plan pin."
        dont="Use it for amounts or dates."
        render={() => (
          <AngleSlider defaultValue={[90]} max={360} min={0} step={1}>
            <AngleSliderTrack>
              <AngleSliderRange />
            </AngleSliderTrack>
            <AngleSliderThumb aria-label="Photo rotation" />
            <AngleSliderValue />
          </AngleSlider>
        )}
      />
      <DualSurfaceShowcase
        title="Mention"
        source="Dice UI + @diceui/mention (UI-6)"
        useFor="Tagging staff in a cleaning or maintenance note."
        dont="Tag guests; they are not staff members and get no notification."
        render={() => <MentionDemo />}
      />
      <DualSurfaceShowcase
        title="QueryBuilder"
        source="Dice UI (offline install, UI-6)"
        useFor="Saved filters on the owner's bookings list (desktop)."
        dont="Show it to guests or on phones; use filter chips there."
        render={() => <QueryDemo />}
      />
      <KitVariantsSection areas={['inputs', 'pickers', 'calendar']} />
    </div>
  );
}
