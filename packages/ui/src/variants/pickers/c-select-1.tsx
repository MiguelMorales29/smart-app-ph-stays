'use client';

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
  { label: 'Select a fruit', value: null },
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana' },
  { label: 'Blueberry', value: 'blueberry' },
  { label: 'Grapes', value: 'grapes' },
  { label: 'Pineapple', value: 'pineapple' },
];

export function Pattern() {
  return (
    <Field className="max-w-xs">
      <Select items={items}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
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
