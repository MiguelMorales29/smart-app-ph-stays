import { CircleDashedIcon, EyeIcon, EyeOffIcon } from 'lucide-react';
import {
  formatPesos,
  type OwnerUnitListItemView,
  type UnitStatus,
  type UnitType,
} from '@smartapp/core';
import { cn } from '@smartapp/ui/lib/utils';

export const UNIT_TYPE_LABEL: Record<UnitType, string> = {
  entire_place: 'Whole place',
  private_room: 'Private room',
  bed_space: 'Bed space',
};

const STATUS: Record<UnitStatus, { label: string; icon: typeof EyeIcon; tone: string }> = {
  draft: {
    label: 'Draft',
    icon: CircleDashedIcon,
    tone: 'bg-muted text-foreground [&>svg]:text-muted-foreground',
  },
  listed: {
    label: 'Listed',
    icon: EyeIcon,
    tone: 'bg-success-tint text-foreground [&>svg]:text-success',
  },
  unlisted: {
    label: 'Hidden',
    icon: EyeOffIcon,
    tone: 'bg-warning-tint text-foreground [&>svg]:text-warning',
  },
};

export function unitStatusLabel(status: UnitStatus): string {
  return STATUS[status].label;
}

/** Draft, Listed or Hidden: an icon, a word and a colour. */
export function UnitStatusBadge({
  status,
  className,
}: {
  readonly status: UnitStatus;
  readonly className?: string;
}) {
  const item = STATUS[status];
  const Icon = item.icon;
  return (
    <span
      data-slot="unit-status-badge"
      className={cn(
        'inline-flex h-6 shrink-0 items-center gap-1 rounded-full px-2 text-xs font-medium',
        item.tone,
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      {item.label}
    </span>
  );
}

/** "₱3,500 / night", "₱4,500 / month" or null when no price is set. */
export function unitPriceText(
  item: Pick<OwnerUnitListItemView, 'unit' | 'stay_terms' | 'lease_terms'>,
): string | null {
  if (item.unit.mode === 'long_term') {
    return item.lease_terms
      ? `${formatPesos(item.lease_terms.monthly_rent_centavos)} / month`
      : null;
  }
  return item.stay_terms ? `${formatPesos(item.stay_terms.base_nightly_centavos)} / night` : null;
}

export const MISSING_LABEL: Record<string, string> = {
  photos: 'Add at least 3 photos',
  price: 'Set a price',
};
