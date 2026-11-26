import { Kbd } from '@smartapp/ui/components/kbd';

export function Pattern() {
  return (
    <div className="flex items-center justify-center gap-2">
      <Kbd>Ctrl</Kbd>
      <Kbd>⌘K</Kbd>
      <Kbd>Ctrl + B</Kbd>
    </div>
  );
}
