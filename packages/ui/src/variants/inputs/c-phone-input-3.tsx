import { PhoneInput } from '@smartapp/ui/components/reui/phone-input';

export function Pattern() {
  return (
    <PhoneInput
      variant="lg"
      placeholder="Enter phone number"
      defaultCountry="US"
      value="+12125551234"
    />
  );
}
