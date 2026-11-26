import { Button } from '@smartapp/ui/components/button';
import { ButtonGroup } from '@smartapp/ui/components/button-group';
import { Input } from '@smartapp/ui/components/input';

export function Pattern() {
  return (
    <ButtonGroup>
      <Button variant="outline">Button</Button>
      <Input placeholder="Type something here..." />
    </ButtonGroup>
  );
}
