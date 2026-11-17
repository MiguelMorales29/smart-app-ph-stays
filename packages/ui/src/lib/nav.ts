import { useRender } from '@base-ui/react/use-render';
import type { ReactElement, ReactNode } from 'react';

/**
 * Shared navigation item for sidebar, bottom dock, and nav drawer.
 * Apps supply their router link element (e.g. TanStack Link or Next Link) so
 * `@smartapp/ui` stays decoupled from any routing library.
 */
export interface NavItem {
  readonly id: string;
  readonly label: string;
  readonly icon: ReactNode;
  readonly link: ReactElement;
  readonly active: boolean;
  readonly count?: number | undefined;
  readonly dot?: boolean | undefined;
}

export function countLabel(count: number): string {
  return count > 99 ? '99+' : String(count);
}

export function useNavLink(
  item: NavItem,
  props: {
    readonly className: string;
    readonly children: ReactNode;
    readonly onClick?: (() => void) | undefined;
  },
): ReactElement {
  const ariaCurrent = item.active ? 'page' : undefined;
  return useRender({
    render: item.link,
    props: {
      className: props.className,
      ...(props.onClick !== undefined ? { onClick: props.onClick } : {}),
      ...(ariaCurrent !== undefined ? { 'aria-current': ariaCurrent } : {}),
      children: props.children,
    },
    state: { active: item.active },
  });
}
