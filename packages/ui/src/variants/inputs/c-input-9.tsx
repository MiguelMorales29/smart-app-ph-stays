import { Field, FieldLabel } from '@smartapp/ui/components/field';
import { Input } from '@smartapp/ui/components/input';

export function Pattern() {
  return (
    <Field className="max-w-xs">
      <FieldLabel htmlFor="input-demo-url">URL</FieldLabel>
      <Input id="input-demo-url" type="url" placeholder="https://example.com" />
    </Field>
  );
}
