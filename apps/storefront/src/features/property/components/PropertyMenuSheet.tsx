'use client';

import { Button } from '@smartapp/ui/components/button';
import { MenuIcon } from 'lucide-react';
import { useState } from 'react';

import { LazyPropertyMenuSheetBody } from './LazySheets';

export interface PropertyMenuSheetProps {
  readonly slug: string;
  readonly propertyId: string;
  readonly propertyName: string;
  readonly tagline: string | null;
  readonly logoSrc: string | null;
  readonly isPaused: boolean;
}

/**
 * Property menu trigger (D79, D68):
 * Keeps the trigger lightweight on first paint and lazy-loads the Sheet body, InstallGuideSheet
 * and ReportPageSheet only when opened. Marks the trigger with `data-dev-panel-menu` on sample
 * builds so the floating Preview pill stays hidden immediately on SSR and hydration.
 */
export function PropertyMenuSheet({
  slug,
  propertyId,
  propertyName,
  tagline,
  logoSrc,
  isPaused,
}: PropertyMenuSheetProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuMounted, setMenuMounted] = useState(false);

  const previewSwitches =
    process.env.NEXT_PUBLIC_DATA_SOURCE === 'memory' &&
    process.env.NEXT_PUBLIC_APP_ENV !== 'production';

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Open property menu"
        aria-haspopup="dialog"
        aria-expanded={menuOpen}
        data-dev-panel-menu={previewSwitches ? '' : undefined}
        onClick={() => {
          setMenuMounted(true);
          setMenuOpen(true);
        }}
        className="min-h-11 min-w-11 shrink-0 rounded-full"
      >
        <MenuIcon aria-hidden="true" className="size-5" />
      </Button>

      {menuMounted ? (
        <LazyPropertyMenuSheetBody
          open={menuOpen}
          onOpenChange={setMenuOpen}
          slug={slug}
          propertyId={propertyId}
          propertyName={propertyName}
          tagline={tagline}
          logoSrc={logoSrc}
          isPaused={isPaused}
          previewSwitches={previewSwitches}
        />
      ) : null}
    </>
  );
}
