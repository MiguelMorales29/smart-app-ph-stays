import { Badge } from '@smartapp/ui/components/badge';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@smartapp/ui/components/drawer';
import { countLabel, useNavLink, type NavItem } from '../lib/nav';

export interface NavDrawerProps {
  readonly title: string;
  readonly items: readonly NavItem[];
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

const tileClass =
  'group/tile pressable relative flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card p-3 text-center text-sm font-medium text-foreground outline-none hover-hover:hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring data-active:border-primary data-active:text-primary';

function NavTile({ item, onSelect }: { readonly item: NavItem; readonly onSelect: () => void }) {
  return useNavLink(item, {
    className: tileClass,
    onClick: onSelect,
    children: (
      <>
        <span
          aria-hidden="true"
          className="flex size-10 items-center justify-center rounded-full bg-muted *:size-5 group-data-active/tile:bg-secondary group-data-active/tile:text-primary"
        >
          {item.icon}
        </span>
        <span className="line-clamp-2">{item.label}</span>
        {item.count !== undefined && item.count > 0 ? (
          <Badge className="absolute top-2 right-2 tabular">{countLabel(item.count)}</Badge>
        ) : item.dot ? (
          <span
            aria-label="Attention needed"
            className="absolute top-2.5 right-2.5 size-2 rounded-full bg-warning"
          />
        ) : null}
      </>
    ),
  });
}

/** Bottom drawer with nav items as tiles; the mobile BottomDock More button opens it. */
export function NavDrawer({ title, items, open, onOpenChange }: NavDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} showSwipeHandle>
      <DrawerContent className="pb-safe">
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
        </DrawerHeader>
        <div className="grid grid-cols-3 gap-3 px-4 pb-4">
          {items.map((item) => (
            <NavTile key={item.id} item={item} onSelect={() => onOpenChange(false)} />
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
