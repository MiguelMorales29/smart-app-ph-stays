import { Field } from '@smartapp/ui/components/field';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@smartapp/ui/components/select';

const items = [
  { label: 'Select an item', value: null },
  ...Array.from({ length: 100 }).map((_, i) => ({
    label: `Item ${i}`,
    value: `item-${i}`,
  })),
];

export function Pattern() {
  return (
    <Field className="max-w-xs">
      <Select items={items}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {items.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  );
}
