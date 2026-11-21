import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useMatches } from '@tanstack/react-router';
import type { OwnerUnitListItemView } from '@smartapp/core';
import { useActiveDataClient } from '@/data/shared';
import { unitsKeys } from '@/data/units/keys';
import { useOwnerUnitQuery } from '@/data/units/reads';

export interface PageParentCrumb {
  readonly to: string;
  readonly title: string;
}

export interface PageMeta {
  readonly title: string;
  readonly parent?: PageParentCrumb | undefined;
  readonly parents?: readonly PageParentCrumb[] | undefined;
  /** Opts the route into a wider layout (sign-up's sell panel in AuthFrame; 4-column grid on Units in AppFrame). */
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
  const queryClient = useQueryClient();
  const active = useActiveDataClient();

  let activeUnitId: string | null = null;
  for (let idx = matches.length - 1; idx >= 0; idx -= 1) {
    const match = matches[idx];
    if (
      (match?.routeId === '/app-frame/units/$unitId' ||
        match?.routeId === '/app-frame/units/$unitId/$section') &&
      'unitId' in match.params
    ) {
      activeUnitId = String(match.params.unitId);
      break;
    }
  }

  const unitDetail = useOwnerUnitQuery(activeUnitId);
  let cachedUnitName = unitDetail.data?.unit.name ?? null;
  if (cachedUnitName === null && activeUnitId !== null) {
    const cachedList = queryClient.getQueryData<readonly OwnerUnitListItemView[]>(
      unitsKeys.list(active.accountId, null, false),
    );
    cachedUnitName = cachedList?.find((item) => item.unit.id === activeUnitId)?.unit.name ?? null;
  }
  const unitCrumbTitle = cachedUnitName ?? 'Edit unit';

  for (let idx = matches.length - 1; idx >= 0; idx -= 1) {
    const match = matches[idx];
    if (match?.routeId === '/app-frame/units/$unitId/$section') {
      const unitId = 'unitId' in match.params ? String(match.params.unitId) : undefined;
      const section = 'section' in match.params ? String(match.params.section) : undefined;
      const title = (section && UNIT_SECTION_TITLES[section]) ?? 'Edit unit';
      const unitsCrumb: PageParentCrumb = { to: '/units', title: 'Units' };
      if (unitId) {
        const unitCrumb: PageParentCrumb = { to: `/units/${unitId}`, title: unitCrumbTitle };
        return {
          title,
          parent: unitCrumb,
          parents: [unitsCrumb, unitCrumb],
        };
      }
      return {
        title,
        parent: unitsCrumb,
        parents: [unitsCrumb],
      };
    }
    if (match?.routeId === '/app-frame/units/$unitId') {
      const unitsCrumb: PageParentCrumb = { to: '/units', title: 'Units' };
      return {
        title: unitCrumbTitle,
        parent: unitsCrumb,
        parents: [unitsCrumb],
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
