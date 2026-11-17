import { propertySlugSchema, type PropertyView } from '@smartapp/core';
import { getHttpDataSource } from '@smartapp/data/http';
import { cookies } from 'next/headers';
import { cache } from 'react';

import { env } from '../env';

const SWITCH_COOKIE_NAME = 'smartapp.dev.switches';

/**
 * Resolves a published property for server rendering via `@smartapp/data` (`getProperty`).
 * In development and preview with `DATA_SOURCE=memory`, reads the switch-bar cookie so
 * server-rendered frames match the active scenario pack. In production (`APP_ENV=production`),
 * the dynamic `@smartapp/data/switches` import is dead-code eliminated.
 */
export async function resolveServerProperty(
  slug: string,
  switchCookieValue?: string | null,
): Promise<PropertyView | null> {
  // A link that cannot be a property slug (capitals, dots, "favicon.ico") is simply not found.
  // Without this guard the data contract throws on the input and the page answers with a 500.
  if (!propertySlugSchema.safeParse(slug).success) {
    return null;
  }
  if (
    process.env.NEXT_PUBLIC_DATA_SOURCE === 'memory' &&
    process.env.NEXT_PUBLIC_APP_ENV !== 'production'
  ) {
    const switches = await import('@smartapp/data/switches');
    const state =
      switches.parseSwitchStateCookie(switchCookieValue) ?? switches.createDefaultSwitchState();
    const bundle = await switches.createSwitchClientBundle(state, {
      storefrontOrigin: env.STOREFRONT_ORIGIN,
    });
    const res = await bundle.source.getProperty({ slug }, { role: 'guest' });
    return res.ok ? res.data : null;
  }

  const source = await getHttpDataSource({
    apiBaseUrl: env.API_BASE_URL ?? '',
  });
  const res = await source.getProperty({ slug }, { role: 'guest' });
  return res.ok ? res.data : null;
}

export const getServerProperty = cache(async (slug: string): Promise<PropertyView | null> => {
  if (
    process.env.NEXT_PUBLIC_DATA_SOURCE === 'memory' &&
    process.env.NEXT_PUBLIC_APP_ENV !== 'production'
  ) {
    const cookieStore = await cookies();
    const rawCookie = cookieStore.get(SWITCH_COOKIE_NAME)?.value ?? null;
    return resolveServerProperty(slug, rawCookie);
  }

  return resolveServerProperty(slug, null);
});

export function shouldNoindexProperty(propertyView: PropertyView | null): boolean {
  return env.APP_ENV !== 'production' || Boolean(propertyView?.account.is_demo);
}

export function shouldNoindexRoot(): boolean {
  return env.APP_ENV !== 'production';
}
