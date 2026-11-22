import { useState } from 'react';
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from '@smartapp/ui/components/context-menu';
import { CalendarDaysIcon, MessageSquareIcon, Trash2Icon, WalletIcon } from 'lucide-react';

import { DualSurfaceShowcase } from './kit-base-tab';

function ContextMenuDemo({ surface }: { readonly surface: 'light' | 'dark' }) {
  const [pinTop, setPinTop] = useState(true);
  const [lastAction, setLastAction] = useState<string>('Right-click the booking card');

  return (
    <div className="space-y-2">
      <ContextMenu>
        <ContextMenuTrigger className="flex min-h-20 w-full cursor-context-menu flex-col justify-center rounded-xl border border-dashed border-border bg-card px-4 py-3 text-left transition-colors hover:bg-muted/60">
          <span className="text-sm font-semibold text-foreground">
            BK-2041 · Studio Fog ({surface})
          </span>
          <span className="text-xs text-muted-foreground">
            12–14 Dec 2026 · Miguel Santos · Right-click for quick actions
          </span>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-56">
          <ContextMenuGroup>
            <ContextMenuLabel>Booking actions</ContextMenuLabel>
            <ContextMenuItem onClick={() => setLastAction('Opened booking details')}>
              <CalendarDaysIcon aria-hidden="true" />
              <span>View booking</span>
              <ContextMenuShortcut>Enter</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => setLastAction('Opened guest conversation')}>
              <MessageSquareIcon aria-hidden="true" />
              <span>Message guest</span>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => setLastAction('Recorded cash payment')}>
              <WalletIcon aria-hidden="true" />
              <span>Record cash payment</span>
            </ContextMenuItem>
          </ContextMenuGroup>
          <ContextMenuSeparator />
          <ContextMenuCheckboxItem checked={pinTop} onCheckedChange={setPinTop}>
            Pin to arrivals list
          </ContextMenuCheckboxItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            variant="destructive"
            onClick={() => setLastAction('Requested cancellation')}
          >
            <Trash2Icon aria-hidden="true" />
            <span>Cancel booking</span>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      <p className="text-xs text-muted-foreground">{lastAction}</p>
    </div>
  );
}

/** UI-4 base primitive showcase (ContextMenu installed early for ReUI Gantt). */
export function KitBaseUi4Section() {
  return (
    <DualSurfaceShowcase
      title="ContextMenu"
      source="shadcn base-nova · installed early for ReUI Gantt (UI-4)"
      useFor="Desktop secondary actions on calendar bars, Gantt rows, and booking cards."
      dont="Hide the only way to trigger an action inside a right-click menu (touch devices need a visible button or ⋯ menu)."
      render={(surface) => <ContextMenuDemo surface={surface} />}
    />
  );
}
