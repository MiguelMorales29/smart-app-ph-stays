import { Field, FieldLabel } from '@smartapp/ui/components/field';
import { Input } from '@smartapp/ui/components/input';

export function Pattern() {
  return (
    <Field className="max-w-xs">
      <FieldLabel htmlFor="input-demo-disabled">Email</FieldLabel>
      <Input id="input-demo-disabled" type="email" placeholder="Email" disabled />
    </Field>
  );
}
