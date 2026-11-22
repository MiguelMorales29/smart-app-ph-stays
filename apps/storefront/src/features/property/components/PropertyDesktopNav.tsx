'use client';

import { Scrollspy } from '@smartapp/ui/components/reui/scrollspy';

import type { PropertySectionNavItem } from '../property-rules';

export interface PropertyDesktopNavProps {
  readonly items: readonly PropertySectionNavItem[];
}

/**
 * Desktop centre pill navigation inside the top bar (≥1024 px, D79).
 * Ported from the food app's centre pill group layout, wired to ReUI Scrollspy.
 */
export function PropertyDesktopNav({ items }: PropertyDesktopNavProps) {
  if (items.length === 0) return null;

  return (
    <Scrollspy offset={84} history={false} className="mx-auto hidden items-center lg:flex">
      <nav
        aria-label="Page sections"
        data-slot="property-desktop-nav"
        className="flex items-center gap-1 rounded-full bg-muted/75 p-1"
      >
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            data-scrollspy-anchor={item.id}
            className="flex h-9 items-center rounded-full px-3.5 text-sm font-medium text-muted-foreground outline-none transition-colors duration-base hover-hover:hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-[active=true]:bg-card data-[active=true]:font-semibold data-[active=true]:text-foreground data-[active=true]:shadow-sm pointer-coarse:h-11"
          >
            {item.label}
          </a>
        ))}
      </nav>
    </Scrollspy>
  );
}
