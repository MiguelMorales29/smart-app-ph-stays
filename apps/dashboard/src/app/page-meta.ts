import { useEffect } from 'react';
import { useMatches } from '@tanstack/react-router';

export interface PageParentCrumb {
  readonly to: string;
  readonly title: string;
}

export interface PageMeta {
  readonly title: string;
  readonly parent?: PageParentCrumb | undefined;
}

declare module '@tanstack/react-router' {
  interface StaticDataRouteOption {
    readonly page?: PageMeta | undefined;
  }
}

export function usePageMeta(): PageMeta {
  const matches = useMatches();
  for (let idx = matches.length - 1; idx >= 0; idx -= 1) {
    const match = matches[idx];
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
