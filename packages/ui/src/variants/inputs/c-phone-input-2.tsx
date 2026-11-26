import { PhoneInput } from '@smartapp/ui/components/reui/phone-input';

export function Pattern() {
  return (
    <PhoneInput
      variant="sm"
      placeholder="Enter phone number"
      defaultCountry="NL"
      value="+31612345678"
    />
  );
}
