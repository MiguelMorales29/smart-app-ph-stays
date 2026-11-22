import { createElement } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { AppSheet } from '@smartapp/ui/compositions/app-sheet';
import { RowButton, RowGroup } from '@smartapp/ui/compositions/grouped-rows';
import { ACTIVE_WAVE, QUICK_ADD_ITEMS } from '@/app/nav-config';

export function QuickAddSheet({
  open,
  onOpenChange,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const quickAddItems = QUICK_ADD_ITEMS.filter((item) => item.wave <= ACTIVE_WAVE);

  return (
    <AppSheet open={open} onOpenChange={onOpenChange} title="Add" height="half" size="sm">
      <RowGroup>
        {quickAddItems.map((item) => (
          <RowButton
            key={item.id}
            label={item.label}
            hint={item.hint}
            icon={createElement(item.icon)}
            onClick={() => {
              onOpenChange(false);
              void navigate({ to: item.to, search: item.search });
            }}
          />
        ))}
      </RowGroup>
    </AppSheet>
  );
}
