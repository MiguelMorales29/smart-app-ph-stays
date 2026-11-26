import { Field } from '@smartapp/ui/components/field';
import { Input } from '@smartapp/ui/components/input';

export function Pattern() {
  return (
    <Field className="max-w-xs">
      <Input id="basic-input" type="text" placeholder="Basic Input" />
    </Field>
  );
}
