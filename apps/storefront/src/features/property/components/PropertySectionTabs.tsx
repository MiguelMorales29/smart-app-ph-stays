'use client';

import { Scrollspy } from '@smartapp/ui/components/reui/scrollspy';
import { Scroller } from '@smartapp/ui/components/scroller';
import { cn } from '@smartapp/ui/lib/utils';
import { useEffect, useState } from 'react';

import type { PropertySectionNavItem } from '../property-rules';

export interface PropertySectionTabsProps {
  readonly items: readonly PropertySectionNavItem[];
  readonly hasHero?: boolean | undefined;
}

/**
 * Sticky section jump bar under the top bar on phones & tablets (<1024 px, D79).
 * Appears once the hero gallery scrolls out of view, tracks the active section with ReUI Scrollspy,
 * and scrolls sideways with Dice UI Scroller edge fades.
 */
export function PropertySectionTabs({ items, hasHero = true }: PropertySectionTabsProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (items.length === 0) return;
    const hero = hasHero ? document.getElementById('hero-gallery') : null;

    if (hero && typeof IntersectionObserver !== 'undefined') {
      const observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (!entry) return;
          // Show once the hero's bottom moves above the 56px top bar.
          setVisible(!entry.isIntersecting && entry.boundingClientRect.bottom <= 64);
        },
        { rootMargin: '-56px 0px 0px 0px', threshold: 0 },
      );
      observer.observe(hero);
      return () => observer.disconnect();
    }

    const onScroll = () => setVisible(window.scrollY > 120);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [hasHero, items.length]);

  if (items.length === 0) return null;

  return (
    <div
      data-slot="property-section-tabs"
      data-visible={visible ? 'true' : 'false'}
      aria-hidden={!visible}
      className={cn(
        'fixed inset-x-0 top-14 z-20 border-b border-border bg-card/95 backdrop-blur transition-[opacity,transform] duration-base ease-enter lg:hidden',
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0',
      )}
    >
      <div className="mx-auto max-w-6xl px-3 sm:px-6">
        <Scrollspy offset={116} history={false}>
          <Scroller orientation="horizontal" hideScrollbar size={24}>
            <nav aria-label="Page sections" className="flex w-max items-center gap-1 py-1.5">
              {items.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  tabIndex={visible ? 0 : -1}
                  data-scrollspy-anchor={item.id}
                  className="inline-flex min-h-11 shrink-0 items-center rounded-full px-3.5 text-sm font-medium text-muted-foreground outline-none transition-colors duration-fast hover-hover:hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-[active=true]:bg-property-10 data-[active=true]:font-semibold data-[active=true]:text-property-10-foreground"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </Scroller>
        </Scrollspy>
      </div>
    </div>
  );
}
