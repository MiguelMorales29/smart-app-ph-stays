import {
  CheckboxGroup,
  CheckboxGroupDescription,
  CheckboxGroupItem,
  CheckboxGroupLabel,
  CheckboxGroupList,
} from '@smartapp/ui/components/checkbox-group';
import { Field, FieldDescription, FieldLabel } from '@smartapp/ui/components/field';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@smartapp/ui/components/input-otp';
import { Rating, RatingItem } from '@smartapp/ui/components/rating';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@smartapp/ui/components/select';
import {
  TimePicker,
  TimePickerContent,
  TimePickerHour,
  TimePickerInput,
  TimePickerInputGroup,
  TimePickerLabel,
  TimePickerMinute,
  TimePickerPeriod,
  TimePickerSeparator,
  TimePickerTrigger,
} from '@smartapp/ui/components/time-picker';
import { VisuallyHiddenInput } from '@smartapp/ui/components/visually-hidden-input';
import { OtpResend } from '@smartapp/ui/compositions/otp-resend';
import { DayChips, TimeChips } from '@smartapp/ui/compositions/slot-chips';
import { useId, useState } from 'react';

import { DualSurfaceShowcase } from './kit-base-tab';

const AREA_LABELS: Readonly<Record<string, string>> = {
  tagaytay: 'Tagaytay City, Cavite',
  pansol: 'Pansol, Calamba, Laguna',
  pasig: 'Kapitolyo, Pasig',
  sampaloc: 'Sampaloc, Manila',
};

function SelectDemo() {
  const [value, setValue] = useState<string>('tagaytay');
  const labelId = useId();

  return (
    <Field className="max-w-xs">
      <FieldLabel id={labelId}>Property area</FieldLabel>
      <Select
        items={AREA_LABELS}
        value={value}
        onValueChange={(next) => {
          if (next) setValue(next);
        }}
      >
        <SelectTrigger aria-labelledby={labelId} className="w-full">
          <SelectValue placeholder="Choose an area" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="tagaytay">Tagaytay City, Cavite</SelectItem>
          <SelectItem value="pansol">Pansol, Calamba, Laguna</SelectItem>
          <SelectItem value="pasig">Kapitolyo, Pasig</SelectItem>
          <SelectItem value="sampaloc">Sampaloc, Manila</SelectItem>
        </SelectContent>
      </Select>
    </Field>
  );
}

function OtpDemo() {
  const [rawOtp, setRawOtp] = useState('482');
  const [resendOtp, setResendOtp] = useState('');
  const [resendAt, setResendAt] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">InputOTP primitive</p>
        <InputOTP maxLength={6} value={rawOtp} onChange={setRawOtp}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </div>

      <OtpResend
        id="kit-otp-resend"
        value={resendOtp}
        onChange={setResendOtp}
        label="Verification code"
        sentLine="We sent a 6-digit code to owner@example.com."
        hint="Check Spam if it does not arrive within a minute."
        resendAt={resendAt}
        onResend={() => setResendAt(new Date(Date.now() + 30_000).toISOString())}
      />
    </div>
  );
}

function CheckboxGroupDemo() {
  const [selected, setSelected] = useState<string[]>(['wifi', 'balcony']);

  return (
    <CheckboxGroup value={selected} onValueChange={setSelected}>
      <CheckboxGroupLabel>Included stay highlights</CheckboxGroupLabel>
      <CheckboxGroupList>
        <CheckboxGroupItem value="wifi">Fast fiber Wi-Fi</CheckboxGroupItem>
        <CheckboxGroupItem value="balcony">Taal view balcony</CheckboxGroupItem>
        <CheckboxGroupItem value="projector">Movie projector &amp; screen</CheckboxGroupItem>
      </CheckboxGroupList>
      <CheckboxGroupDescription>
        Selected: {selected.length > 0 ? selected.join(', ') : 'none'}
      </CheckboxGroupDescription>
    </CheckboxGroup>
  );
}

function TimePickerAndRatingDemo() {
  const [time, setTime] = useState('14:00');
  const [stars, setStars] = useState(4);
  const [customChecked, setCustomChecked] = useState(true);

  return (
    <div className="space-y-6">
      <TimePicker value={time} onValueChange={setTime} className="max-w-xs">
        <TimePickerLabel>Check-in starts</TimePickerLabel>
        <TimePickerInputGroup>
          <TimePickerInput segment="hour" />
          <TimePickerSeparator />
          <TimePickerInput segment="minute" />
          <TimePickerInput segment="period" />
          <TimePickerTrigger />
        </TimePickerInputGroup>
        <TimePickerContent>
          <TimePickerHour />
          <TimePickerMinute />
          <TimePickerPeriod />
        </TimePickerContent>
      </TimePicker>

      <div className="space-y-1.5">
        <p className="text-sm font-medium text-foreground">Guest stay rating ({stars} of 5)</p>
        <Rating value={stars} onValueChange={setStars} max={5} size="default">
          {Array.from({ length: 5 }, (_, idx) => (
            <RatingItem key={idx} />
          ))}
        </Rating>
      </div>

      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">VisuallyHiddenInput</p>
        <label className="relative inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium">
          <VisuallyHiddenInput
            type="checkbox"
            control={null}
            value={customChecked ? 'yes' : 'no'}
            checked={customChecked}
            onChange={(event) => setCustomChecked(event.target.checked)}
          />
          <span>Instant booking ({customChecked ? 'On' : 'Off'})</span>
        </label>
      </div>
    </div>
  );
}

function SlotChipsDemo() {
  const [day, setDay] = useState<string>('sat-12');
  const [slot, setSlot] = useState<string>('14:00');

  return (
    <div className="space-y-4">
      <Field>
        <FieldLabel>Check-in or viewing day</FieldLabel>
        <DayChips
          label="Check-in day"
          value={day}
          onValueChange={setDay}
          chips={[
            { value: 'fri-11', label: 'Fri 11', detail: '2 free', tone: 'primary' },
            { value: 'sat-12', label: 'Sat 12', detail: 'Popular', tone: 'warning', current: true },
            { value: 'sun-13', label: 'Sun 13', detail: 'Full', disabled: true, struck: true },
            { value: 'mon-14', label: 'Mon 14', detail: '4 free' },
          ]}
        />
        <FieldDescription>Scrolls sideways on narrow phones with edge fades.</FieldDescription>
      </Field>

      <Field>
        <FieldLabel>Arrival or viewing window</FieldLabel>
        <TimeChips
          label="Arrival window"
          value={slot}
          onValueChange={setSlot}
          chips={[
            { value: '14:00', label: '2:00 PM', detail: 'Standard' },
            { value: '16:00', label: '4:00 PM', detail: '2 slots' },
            { value: '18:00', label: '6:00 PM', detail: 'Full', disabled: true, struck: true },
          ]}
        />
      </Field>
    </div>
  );
}

/** UI-1 batch form controls & pickers shown on the dashboard `/kit` Forms tab (light + dark). */
export function KitFormsUi1Section() {
  return (
    <>
      <DualSurfaceShowcase
        title="Select"
        source="shadcn base-nova (4.23.0)"
        useFor="Rich option lists with icons or descriptions where native pickers fall short."
        dont="Replace NativeSelect for short fixed mobile lists like province or bank."
        render={() => <SelectDemo />}
      />

      <DualSurfaceShowcase
        title="InputOTP & OtpResend"
        source="shadcn input-otp (1.5.0) + food app composition"
        useFor="6-digit email verification codes with paste support, one-time-code autofill, and timed Resend."
        dont="Drop OTP slot inputs below 16 px font size on touchscreens."
        render={() => <OtpDemo />}
      />

      <DualSurfaceShowcase
        title="CheckboxGroup"
        source="@diceui/checkbox-group 1.0.0"
        useFor="Grouped multi-select amenities and booking filters with shared label and validation state."
        dont="Use for instant on/off toggles that save immediately (use Switch)."
        render={() => <CheckboxGroupDemo />}
      />

      <DualSurfaceShowcase
        title="TimePicker, Rating & VisuallyHiddenInput"
        source="@diceui/time-picker · @diceui/rating · Base UI"
        useFor="Structured check-in/out times, 5-star guest stay ratings, and accessible hidden form inputs."
        dont="Use TimePicker when simple 30-minute TimeSelect options are faster."
        render={() => <TimePickerAndRatingDemo />}
      />

      <DualSurfaceShowcase
        title="DayChips & TimeChips (slot-chips)"
        source="Food app composition (adapted for stays & viewings)"
        useFor="Fast day and arrival/viewing slot chips built on ToggleGroup and Scroller."
        dont="Use for multi-night stay date ranges (use Calendar)."
        render={() => <SlotChipsDemo />}
      />
    </>
  );
}
