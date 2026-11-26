import { Field } from '@smartapp/ui/components/field';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@smartapp/ui/components/input-group';
import { Kbd } from '@smartapp/ui/components/kbd';

export function Pattern() {
  return (
    <Field className="w-full max-w-xs">
      <InputGroup>
        <InputGroupInput placeholder="Search documentation..." />
        <InputGroupAddon align="inline-end">
          <Kbd>⌘K</Kbd>
        </InputGroupAddon>
      </InputGroup>
    </Field>
  );
}
