import { Field } from '@smartapp/ui/components/field';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@smartapp/ui/components/input-group';
import { SearchIcon } from 'lucide-react';

export function Pattern() {
  return (
    <Field className="max-w-xs">
      <InputGroup>
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput placeholder="Search..." />
      </InputGroup>
    </Field>
  );
}
