import { useEffect } from 'react';
import { useMatches } from '@tanstack/react-router';

export interface PageParentCrumb {
  readonly to: string;
  readonly title: string;
}

export interface PageMeta {
  readonly title: string;
  readonly parent?: PageParentCrumb | undefined;
  /** AuthFrame only: a wider two-column layout (sign-up's sell panel on desktop). */
  readonly wide?: boolean | undefined;
}

declare module '@tanstack/react-router' {
  interface StaticDataRouteOption {
    readonly page?: PageMeta | undefined;
  }
}

const UNIT_SECTION_TITLES: Readonly<Record<string, string>> = {
  basics: 'Basics',
  photos: 'Photos',
  price: 'Price',
  amenities: 'Amenities',
  rules: 'Booking rules',
};

export function usePageMeta(): PageMeta {
  const matches = useMatches();
  for (let idx = matches.length - 1; idx >= 0; idx -= 1) {
    const match = matches[idx];
    if (match?.routeId === '/app-frame/units/$unitId/$section') {
      const unitId = 'unitId' in match.params ? String(match.params.unitId) : undefined;
      const section = 'section' in match.params ? String(match.params.section) : undefined;
      const title = (section && UNIT_SECTION_TITLES[section]) ?? 'Edit unit';
      return {
        title,
        parent: unitId
          ? { to: `/units/${unitId}`, title: 'Edit unit' }
          : { to: '/units', title: 'Units' },
      };
    }
    if (match?.staticData.page) {
      return match.staticData.page;
    }
  }
  return { title: 'Dashboard' };
}

export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = `${title} · Smart App PH`;
  }, [title]);
}
