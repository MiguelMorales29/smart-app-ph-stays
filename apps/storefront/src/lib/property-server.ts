import {
  appError,
  manilaToday,
  propertySlugSchema,
  systemClock,
  type CalendarDate,
  type Clock,
  type PropertyView,
} from '@smartapp/core';
import type { DataSource } from '@smartapp/data';
import { getHttpDataSource } from '@smartapp/data/http';
import { cookies } from 'next/headers';
import { cache } from 'react';

import { env } from '../env';

const SWITCH_COOKIE_NAME = 'smartapp.dev.switches';

// Bounded server-side cache for read-only memory DataSource instances in dev/preview.
// Avoids rebuilding the entire demo world 3× per request (which took ~2.4s on cold previews).
const memorySourceCache = new Map<
  string,
  Promise<{ readonly source: DataSource; readonly clock: Clock }>
>();
const MAX_CACHED_MEMORY_SOURCES = 12;

export type ServerPropertyResult =
  | {
      readonly kind: 'ok';
      readonly propertyView: PropertyView;
      readonly today: CalendarDate;
    }
  | { readonly kind: 'not_found' }
  | { readonly kind: 'offline'; readonly message: string }
  | { readonly kind: 'error'; readonly code: string; readonly message: string };

export type RawSearchParams = Readonly<Record<string, string | string[] | undefined>>;

function buildSearchString(searchParams?: RawSearchParams): string {
  if (!searchParams) return '';
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === 'string') {
      params.set(key, value);
    } else if (Array.isArray(value) && typeof value[0] === 'string') {
      params.set(key, value[0]);
    }
  }
  const encoded = params.toString();
  return encoded.length > 0 ? `?${encoded}` : '';
}

/**
 * Resolves a published property for server rendering via `@smartapp/data` (`getProperty`),
 * returning structured `ok | not_found | offline | error` states so pages can render all 7 states.
 */
export async function resolveServerPropertyResult(
  slug: string,
  switchCookieValue?: string | null,
  searchParams?: RawSearchParams,
): Promise<ServerPropertyResult> {
  // A link that cannot be a property slug (capitals, dots, "favicon.ico") is simply not found.
  if (!propertySlugSchema.safeParse(slug).success) {
    return { kind: 'not_found' };
  }

  if (
    process.env.NEXT_PUBLIC_DATA_SOURCE === 'memory' &&
    process.env.NEXT_PUBLIC_APP_ENV !== 'production'
  ) {
    const [switches, { getDataSource }] = await Promise.all([
      import('@smartapp/data/switches'),
      import('@smartapp/data'),
    ]);
    const fromCookie =
      switches.parseSwitchStateCookie(switchCookieValue) ?? switches.createDefaultSwitchState();
    const search = buildSearchString(searchParams);
    const state = search ? switches.parseSwitchStateFromSearch(search, fromCookie) : fromCookie;
    const demoPack = switches.resolveDemoPackForScenario(state.pack);
    const clock = switches.resolveSwitchClock(state.clock);
    const today = manilaToday(clock);
    const cacheKey = [
      state.pack,
      demoPack,
      state.clock,
      today,
      state.errorCode,
      state.latencyMs,
      env.STOREFRONT_ORIGIN,
    ].join('|');

    let entry = memorySourceCache.get(cacheKey);
    if (!entry) {
      const failWith =
        state.pack === 'offline'
          ? appError('not_found', 'Offline: no network connection.', { offline: true })
          : state.pack === 'error'
            ? state.errorCode
            : undefined;
      entry = getDataSource({
        adapter: 'memory',
        pack: demoPack,
        clock,
        storefrontOrigin: env.STOREFRONT_ORIGIN,
        ...(state.pack === 'slow' ? { latencyMs: state.latencyMs } : {}),
        ...(failWith !== undefined ? { failWith } : {}),
      }).then((source) => ({ source, clock }));

      if (memorySourceCache.size >= MAX_CACHED_MEMORY_SOURCES) {
        const oldestKey = memorySourceCache.keys().next().value;
        if (oldestKey !== undefined) {
          memorySourceCache.delete(oldestKey);
        }
      }
      memorySourceCache.set(cacheKey, entry);
    }

    const { source } = await entry;
    const res = await source.getProperty({ slug }, { role: 'guest' });
    if (res.ok) {
      return {
        kind: 'ok',
        propertyView: res.data,
        today,
      };
    }
    if (switches.isOfflineError(res.error)) {
      return { kind: 'offline', message: res.error.message };
    }
    if (res.error.code === 'not_found' && state.pack !== 'error') {
      return { kind: 'not_found' };
    }
    return {
      kind: 'error',
      code: res.error.code,
      message: res.error.message,
    };
  }

  const source = await getHttpDataSource({
    apiBaseUrl: env.API_BASE_URL ?? '',
  });
  const res = await source.getProperty({ slug }, { role: 'guest' });
  if (res.ok) {
    return {
      kind: 'ok',
      propertyView: res.data,
      today: manilaToday(systemClock),
    };
  }
  if (res.error.details?.offline === true) {
    return { kind: 'offline', message: res.error.message };
  }
  if (res.error.code === 'not_found') {
    return { kind: 'not_found' };
  }
  return {
    kind: 'error',
    code: res.error.code,
    message: res.error.message,
  };
}

/**
 * Resolves a published property for server rendering via `@smartapp/data` (`getProperty`).
 * Kept backwards-compatible for existing frames, kit views and tests.
 */
export async function resolveServerProperty(
  slug: string,
  switchCookieValue?: string | null,
): Promise<PropertyView | null> {
  const result = await resolveServerPropertyResult(slug, switchCookieValue);
  return result.kind === 'ok' ? result.propertyView : null;
}

const getCachedServerPropertyResult = cache(
  async (slug: string, serializedSearch: string): Promise<ServerPropertyResult> => {
    const parsedSearch: RawSearchParams | undefined = serializedSearch
      ? Object.fromEntries(new URLSearchParams(serializedSearch).entries())
      : undefined;

    if (
      process.env.NEXT_PUBLIC_DATA_SOURCE === 'memory' &&
      process.env.NEXT_PUBLIC_APP_ENV !== 'production'
    ) {
      const cookieStore = await cookies();
      const rawCookie = cookieStore.get(SWITCH_COOKIE_NAME)?.value ?? null;
      return resolveServerPropertyResult(slug, rawCookie, parsedSearch);
    }

    return resolveServerPropertyResult(slug, null, parsedSearch);
  },
);

export function getServerPropertyResult(
  slug: string,
  searchParams?: RawSearchParams,
): Promise<ServerPropertyResult> {
  return getCachedServerPropertyResult(slug, buildSearchString(searchParams));
}

export const getServerProperty = cache(async (slug: string): Promise<PropertyView | null> => {
  const result = await getServerPropertyResult(slug);
  return result.kind === 'ok' ? result.propertyView : null;
});

export function shouldNoindexProperty(propertyView: PropertyView | null): boolean {
  return env.APP_ENV !== 'production' || Boolean(propertyView?.account.is_demo);
}

export function shouldNoindexRoot(): boolean {
  return env.APP_ENV !== 'production';
}
