import { Fragment, useState, type ReactNode } from 'react';
import { EllipsisIcon, PlusIcon } from 'lucide-react';
import { Badge } from '@smartapp/ui/components/badge';
import { useKeyboardOpen } from '../hooks/use-keyboard-open';
import { countLabel, useNavLink, type NavItem } from '../lib/nav';
import { NavDrawer } from './nav-drawer';

export interface BottomDockAction {
  readonly label?: string | undefined;
  readonly onClick: () => void;
}

export interface BottomDockProps {
  readonly label: string;
  /** Up to 5 items, or 4 when `more` is set. */
  readonly items: readonly NavItem[];
  /** Optional centre create button (D65): 44 px Smart Blue circle with a white plus. */
  readonly action?: BottomDockAction | undefined;
  readonly more?:
    | {
        readonly label: string;
        readonly items: readonly NavItem[];
      }
    | undefined;
}

/** Shared by every dock slot and the More trigger button. */
export const dockSlotClass =
  'group/slot pressable relative flex h-14 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-full text-xs font-medium text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring data-active:text-foreground';

function SlotContent({
  icon,
  label,
  count,
  dot,
}: {
  readonly icon: ReactNode;
  readonly label: string;
  readonly count?: number | undefined;
  readonly dot?: boolean | undefined;
}) {
  return (
    <>
      <span className="relative flex h-7 w-12 items-center justify-center rounded-full transition-colors group-data-active/slot:bg-accent group-data-active/slot:text-primary">
        <span aria-hidden="true" className="flex *:size-5">
          {icon}
        </span>
        {count !== undefined && count > 0 ? (
          <Badge className="absolute -top-1 -right-2 h-4 min-w-4 px-1 tabular">
            {countLabel(count)}
          </Badge>
        ) : dot ? (
          <span
            aria-label="Attention needed"
            className="absolute top-0.5 right-2 size-2 rounded-full bg-warning"
          />
        ) : null}
      </span>
      <span className="max-w-full truncate leading-tight">{label}</span>
    </>
  );
}

function DockSlot({ item }: { readonly item: NavItem }) {
  return useNavLink(item, {
    className: dockSlotClass,
    children: <SlotContent icon={item.icon} label={item.label} count={item.count} dot={item.dot} />,
  });
}

function DockActionButton({ action }: { readonly action: BottomDockAction }) {
  return (
    <div className="flex h-14 min-w-0 flex-1 items-center justify-center">
      <button
        type="button"
        aria-label={action.label ?? 'Add'}
        onClick={action.onClick}
        className="press flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm outline-none hover-hover:hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring"
      >
        <PlusIcon aria-hidden="true" className="size-5" />
      </button>
    </div>
  );
}

/** Floating pill navigation for phones; hidden while the on-screen keyboard is open. */
export function BottomDock({ label, items, action, more }: BottomDockProps) {
  const keyboardOpen = useKeyboardOpen();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = more?.items.some((item) => item.active) ?? false;
  // D67: More shows a dot (no number) only when an item inside it needs the owner.
  const moreDot =
    more?.items.some((item) => Boolean(item.dot) || (item.count !== undefined && item.count > 0)) ??
    false;
  const actionIndex = action ? Math.min(2, items.length) : -1;

  return (
    <>
      <nav
        aria-label={label}
        data-slot="bottom-dock"
        data-keyboard={keyboardOpen ? 'open' : 'closed'}
        className="fixed inset-x-4 dock-pill z-30 mx-auto flex items-center gap-1 rounded-full border border-border frost px-1 shadow-md keyboard-open:hidden"
      >
        {items.map((item, index) => (
          <Fragment key={item.id}>
            {action && index === actionIndex ? <DockActionButton action={action} /> : null}
            <DockSlot item={item} />
          </Fragment>
        ))}
        {action && actionIndex === items.length ? <DockActionButton action={action} /> : null}
        {more ? (
          <button
            type="button"
            className={dockSlotClass}
            data-active={moreActive ? '' : undefined}
            aria-haspopup="dialog"
            aria-expanded={moreOpen}
            onClick={() => setMoreOpen(true)}
          >
            <SlotContent icon={<EllipsisIcon />} label={more.label} dot={moreDot} />
          </button>
        ) : null}
      </nav>
      {more ? (
        <NavDrawer
          title={more.label}
          items={more.items}
          open={moreOpen}
          onOpenChange={setMoreOpen}
        />
      ) : null}
    </>
  );
}
