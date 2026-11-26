import { Field } from '@smartapp/ui/components/field';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@smartapp/ui/components/input-group';
import { MicIcon, RadioIcon } from 'lucide-react';

export function Pattern() {
  return (
    <Field className="max-w-xs">
      <InputGroup>
        <InputGroupAddon>
          <MicIcon />
        </InputGroupAddon>
        <InputGroupInput placeholder="Listening..." />
        <InputGroupAddon align="inline-end">
          <RadioIcon className="text-destructive animate-pulse" />
        </InputGroupAddon>
      </InputGroup>
    </Field>
  );
}
