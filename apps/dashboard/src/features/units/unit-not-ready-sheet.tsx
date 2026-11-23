import { Link } from '@tanstack/react-router';
import { ImageIcon } from 'lucide-react';
import { Button } from '@smartapp/ui/components/button';
import { AppSheet } from '@smartapp/ui/compositions/app-sheet';
import { useLastDefined } from '@smartapp/ui/hooks/use-last-defined';

import { MISSING_LABEL } from './unit-words';

export interface NotReadyUnit {
  readonly id: string;
  readonly name: string;
  readonly missing: readonly string[];
}

export interface NotReadyState {
  readonly units: readonly NotReadyUnit[];
}

/**
 * Shared sheet shown when one or more units cannot be listed yet (D49: missing photos or price).
 * Used by both `/units` and `/units/$unitId`.
 */
export function UnitNotReadySheet({
  notReady,
  onClose,
  onPickSection,
}: {
  readonly notReady: NotReadyState | null;
  readonly onClose: () => void;
  /** Optional callback when already on the unit page, to jump to the missing section and close. */
  readonly onPickSection?: ((unitId: string, section: 'photos' | 'price') => void) | undefined;
}) {
  // Keep the list while the sheet slides away (Pattern Guide §2).
  const shown = useLastDefined(notReady);

  return (
    <AppSheet
      open={notReady !== null}
      onOpenChange={(open) => !open && onClose()}
      size="sm"
      title={
        shown?.units.length === 1
          ? `${shown.units[0]?.name ?? 'This unit'} can't be listed yet`
          : `${shown?.units.length ?? 0} units can't be listed yet`
      }
      description="Finish these first, then show it on your page."
      footer={
        <Button className="min-h-11" onClick={onClose}>
          Got it
        </Button>
      }
    >
      <ul className="space-y-3">
        {shown?.units.map((unit) => (
          <li key={unit.id} className="space-y-1">
            {shown.units.length > 1 ? <p className="text-sm font-medium">{unit.name}</p> : null}
            <ul className="space-y-1">
              {unit.missing.map((missing) => {
                const section = missing === 'photos' ? 'photos' : 'price';
                const label = MISSING_LABEL[missing] ?? missing;
                return (
                  <li key={missing}>
                    {onPickSection ? (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onPickSection(unit.id, section);
                        }}
                        className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary-hover underline-offset-4 hover-hover:hover:underline"
                      >
                        {missing === 'photos' ? (
                          <ImageIcon aria-hidden="true" className="size-4" />
                        ) : null}
                        {label}
                      </button>
                    ) : (
                      <Link
                        to="/units/$unitId"
                        params={{ unitId: unit.id }}
                        search={{ section }}
                        onClick={onClose}
                        className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary-hover underline-offset-4 hover-hover:hover:underline"
                      >
                        {missing === 'photos' ? (
                          <ImageIcon aria-hidden="true" className="size-4" />
                        ) : null}
                        {label}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>
    </AppSheet>
  );
}
