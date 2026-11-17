import {
  DEMO_IDS,
  DEMO_PACKS,
  ERROR_CODES,
  addDays,
  appError,
  buildBahayBatisBrand,
  buildBaseProfiles,
  buildExtraStateOwners,
  buildIlawResidencesBrand,
  buildTitaLornaDormBrand,
  buildUlapSuitesBrand,
  demoPackSchema,
  errorCodeSchema,
  fixedClock,
  manilaToday,
  manilaWallTime,
  resolveDemoWorld,
  systemClock,
  type Clock,
  type DemoPack,
  type ErrorCode,
} from '@smartapp/core';
import { z } from 'zod';

import { getDataSource } from './client.js';
import type { DataSource, Session } from './source.js';

/**
 * Unique marker rendered by the dev/preview switch bar and checked by the
 * production build-output scan (`tooling/scan-build.ts`).
 */
export const SWITCH_BAR_MARKER = '__SMARTAPP_DEV_SWITCH_BAR__';

export const GOLDEN_CLOCK_ISO = '2026-12-10T10:00:00+08:00';
export const DEFAULT_SLOW_LATENCY_MS = 2000;
export const DEFAULT_ERROR_CODE: ErrorCode = 'not_allowed';
export const SWITCH_STORAGE_KEY = 'smartapp.dev.switches.v1';

export const VIEW_AS_KEYS = [
  'guest',
  'guest:link',
  'member:bea-santos',
  'owner:ulap-suites',
  'owner:bahay-batis',
  'owner:ilaw-residences',
  'owner:tita-lorna-dorm',
  'owner:pending',
  'super-admin',
] as const;

export const viewAsKeySchema = z.enum(VIEW_AS_KEYS);
export type ViewAsKey = z.infer<typeof viewAsKeySchema>;

export const SCENARIO_KEYS = [...DEMO_PACKS, 'error', 'slow', 'offline'] as const;

export const scenarioKeySchema = z.enum(SCENARIO_KEYS);
export type ScenarioKey = z.infer<typeof scenarioKeySchema>;

export const CLOCK_KEYS = ['now', 'golden', '+1h', '+1d'] as const;

export const clockKeySchema = z.enum(CLOCK_KEYS);
export type ClockKey = z.infer<typeof clockKeySchema>;

export const switchStateSchema = z.object({
  as: viewAsKeySchema,
  pack: scenarioKeySchema,
  clock: clockKeySchema,
  errorCode: errorCodeSchema,
  latencyMs: z.number().int().min(1500).max(3000),
});

export type SwitchState = z.infer<typeof switchStateSchema>;

export interface ViewAsOption {
  readonly key: ViewAsKey;
  readonly label: string;
  readonly role: Session['role'];
  readonly accountId: string | null;
  readonly isPendingOwner: boolean;
}

export interface ScenarioOption {
  readonly key: ScenarioKey;
  readonly label: string;
}

export interface ClockOption {
  readonly key: ClockKey;
  readonly label: string;
}

export interface SwitchClientBundle {
  readonly source: DataSource;
  readonly session: Session;
  readonly demoPack: DemoPack;
  readonly clock: Clock;
  readonly propertySlugs: readonly string[];
  readonly accountId: string | null;
  readonly isPendingOwner: boolean;
  readonly hasBookingLink: boolean;
}

export function createDefaultSwitchState(overrides?: Partial<SwitchState>): SwitchState {
  return switchStateSchema.parse({
    as: overrides?.as ?? 'guest',
    pack: overrides?.pack ?? 'marketing',
    clock: overrides?.clock ?? 'now',
    errorCode: overrides?.errorCode ?? DEFAULT_ERROR_CODE,
    latencyMs: overrides?.latencyMs ?? DEFAULT_SLOW_LATENCY_MS,
  });
}

function findProfileName(
  profiles: readonly { readonly id: string; readonly full_name: string }[],
  profileId: string,
  kind: string,
): string {
  const found = profiles.find((profile) => profile.id === profileId);
  if (!found) {
    throw new Error(`Missing demo profile name for ${kind} (${profileId}).`);
  }
  return found.full_name;
}

/**
 * Derives View-As options directly from `packages/core` demo people and brands
 * so names never drift from `people.ts` and the brand definitions.
 */
export function getSwitchViewAsOptions(clock: Clock = systemClock): readonly ViewAsOption[] {
  const today = manilaToday(clock);
  const createdAt = manilaWallTime(addDays(today, -60), '09:00').toISOString();
  const baseProfiles = buildBaseProfiles(createdAt);
  const extraOwners = buildExtraStateOwners(today);

  const ulap = buildUlapSuitesBrand(today);
  const bahay = buildBahayBatisBrand(today);
  const ilaw = buildIlawResidencesBrand(today);
  const lorna = buildTitaLornaDormBrand(today);

  const pendingAccount = extraOwners.accounts.find(
    (account) => account.id === DEMO_IDS.people.extraAccounts.pendingAccount,
  );
  if (!pendingAccount) {
    throw new Error('Missing pending demo account in buildExtraStateOwners.');
  }

  const beaName = baseProfiles.memberBeaProfile.full_name;
  const superAdminName = baseProfiles.superAdminProfile.full_name;
  const pendingOwnerName = findProfileName(
    extraOwners.profiles,
    DEMO_IDS.people.owners.pending,
    'pending owner',
  );

  return [
    {
      key: 'guest',
      label: 'Guest',
      role: 'guest',
      accountId: null,
      isPendingOwner: false,
    },
    {
      key: 'guest:link',
      label: 'Guest with booking link',
      role: 'guest',
      accountId: null,
      isPendingOwner: false,
    },
    {
      key: 'member:bea-santos',
      label: `Member — ${beaName}`,
      role: 'member',
      accountId: ulap.account.id,
      isPendingOwner: false,
    },
    {
      key: 'owner:ulap-suites',
      label: `${findProfileName(baseProfiles.brandOwnerProfiles, DEMO_IDS.people.owners.ulapSuites, ulap.account.name)} (${ulap.account.name})`,
      role: 'owner',
      accountId: ulap.account.id,
      isPendingOwner: false,
    },
    {
      key: 'owner:bahay-batis',
      label: `${findProfileName(baseProfiles.brandOwnerProfiles, DEMO_IDS.people.owners.bahayBatis, bahay.account.name)} (${bahay.account.name})`,
      role: 'owner',
      accountId: bahay.account.id,
      isPendingOwner: false,
    },
    {
      key: 'owner:ilaw-residences',
      label: `${findProfileName(baseProfiles.brandOwnerProfiles, DEMO_IDS.people.owners.ilawResidences, ilaw.account.name)} (${ilaw.account.name})`,
      role: 'owner',
      accountId: ilaw.account.id,
      isPendingOwner: false,
    },
    {
      key: 'owner:tita-lorna-dorm',
      label: `${findProfileName(baseProfiles.brandOwnerProfiles, DEMO_IDS.people.owners.titaLornaDorm, lorna.account.name)} (${lorna.account.name})`,
      role: 'owner',
      accountId: lorna.account.id,
      isPendingOwner: false,
    },
    {
      key: 'owner:pending',
      label: `Pending — ${pendingOwnerName} (${pendingAccount.name})`,
      role: 'owner',
      accountId: pendingAccount.id,
      isPendingOwner: true,
    },
    {
      key: 'super-admin',
      label: `Super admin — ${superAdminName}`,
      role: 'super_admin',
      accountId: null,
      isPendingOwner: false,
    },
  ];
}

export function getSwitchScenarioOptions(): readonly ScenarioOption[] {
  return [
    { key: 'marketing', label: 'Marketing (default)' },
    { key: 'qa', label: 'QA (all states & edge cases)' },
    { key: 'empty', label: 'Empty' },
    { key: 'busy', label: 'Busy' },
    { key: 'error', label: 'Error' },
    { key: 'slow', label: 'Slow (2s)' },
    { key: 'offline', label: 'Offline' },
  ];
}

export function getSwitchClockOptions(): readonly ClockOption[] {
  return [
    { key: 'now', label: 'Now' },
    { key: 'golden', label: 'Golden (2026-12-10 10:00)' },
    { key: '+1h', label: '+1h' },
    { key: '+1d', label: '+1d' },
  ];
}

export function getSwitchErrorCodeOptions(): readonly ErrorCode[] {
  return ERROR_CODES;
}

export function resolveSwitchClock(clockKey: ClockKey, baseNowMs?: number): Clock {
  if (clockKey === 'now') {
    return baseNowMs === undefined ? systemClock : fixedClock(new Date(baseNowMs).toISOString());
  }
  if (clockKey === 'golden') {
    return fixedClock(GOLDEN_CLOCK_ISO);
  }
  const referenceMs = baseNowMs ?? Date.now();
  const offsetMs = clockKey === '+1h' ? 3_600_000 : 86_400_000;
  return fixedClock(new Date(referenceMs + offsetMs).toISOString());
}

export function resolveDemoPackForScenario(scenario: ScenarioKey): DemoPack {
  const parsed = demoPackSchema.safeParse(scenario);
  return parsed.success ? parsed.data : 'marketing';
}

export function parseSwitchStateFromSearch(
  search: string,
  fallback: SwitchState = createDefaultSwitchState(),
): SwitchState {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const asParsed = viewAsKeySchema.safeParse(params.get('as'));
  const packParsed = scenarioKeySchema.safeParse(params.get('pack'));
  const clockParsed = clockKeySchema.safeParse(params.get('clock'));
  const errorParsed = errorCodeSchema.safeParse(params.get('error'));

  return switchStateSchema.parse({
    as: asParsed.success ? asParsed.data : fallback.as,
    pack: packParsed.success ? packParsed.data : fallback.pack,
    clock: clockParsed.success ? clockParsed.data : fallback.clock,
    errorCode: errorParsed.success ? errorParsed.data : fallback.errorCode,
    latencyMs: fallback.latencyMs,
  });
}

export function serializeSwitchStateToSearch(state: SwitchState, existingSearch = ''): string {
  const params = new URLSearchParams(
    existingSearch.startsWith('?') ? existingSearch.slice(1) : existingSearch,
  );
  params.set('as', state.as);
  params.set('pack', state.pack);
  params.set('clock', state.clock);
  if (state.pack === 'error') {
    params.set('error', state.errorCode);
  } else {
    params.delete('error');
  }
  const encoded = params.toString();
  return encoded.length > 0 ? `?${encoded}` : '';
}

export function loadSwitchStateFromStorage(
  storage: Pick<Storage, 'getItem'> | null | undefined,
): SwitchState | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(SWITCH_STORAGE_KEY);
    if (!raw) return null;
    const parsedJson: unknown = JSON.parse(raw);
    const parsed = switchStateSchema.safeParse(parsedJson);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function saveSwitchStateToStorage(
  storage: Pick<Storage, 'setItem'> | null | undefined,
  state: SwitchState,
): void {
  if (!storage) return;
  try {
    storage.setItem(SWITCH_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota or private browsing errors in switches.
  }
}

export function resolveInitialSwitchState(
  search: string,
  storage: Pick<Storage, 'getItem'> | null | undefined,
  defaultOverrides?: Partial<SwitchState>,
): SwitchState {
  const baseDefaults = createDefaultSwitchState(defaultOverrides);
  const stored = loadSwitchStateFromStorage(storage);
  const withStored = switchStateSchema.parse({
    ...baseDefaults,
    ...(stored ?? {}),
  });
  return parseSwitchStateFromSearch(search, withStored);
}

export interface ResolvedSwitchSession {
  readonly session: Session;
  readonly accountId: string | null;
  readonly isPendingOwner: boolean;
  readonly hasBookingLink: boolean;
}

export function resolveSwitchSession(
  asKey: ViewAsKey,
  demoPack: DemoPack,
  clock: Clock,
): ResolvedSwitchSession {
  const world = resolveDemoWorld({ pack: demoPack, clock });

  switch (asKey) {
    case 'guest':
      return {
        session: { role: 'guest' },
        accountId: null,
        isPendingOwner: false,
        hasBookingLink: false,
      };
    case 'guest:link': {
      return {
        session: { role: 'guest' },
        accountId: null,
        isPendingOwner: false,
        hasBookingLink: world.threads.some((thread) => thread.status === 'open'),
      };
    }
    case 'member:bea-santos': {
      const beaCustomer = world.customers.find(
        (customer) => customer.profile_id === DEMO_IDS.people.memberBeaProfile,
      );
      return {
        session: {
          role: 'member',
          customerId: beaCustomer?.id ?? DEMO_IDS.people.memberBeaProfile,
          accountId: beaCustomer?.account_id ?? DEMO_IDS.ulapSuites.account,
        },
        accountId: beaCustomer?.account_id ?? DEMO_IDS.ulapSuites.account,
        isPendingOwner: false,
        hasBookingLink: false,
      };
    }
    case 'owner:ulap-suites':
      return {
        session: {
          role: 'owner',
          accountId: DEMO_IDS.ulapSuites.account,
          profileId: DEMO_IDS.people.owners.ulapSuites,
        },
        accountId: DEMO_IDS.ulapSuites.account,
        isPendingOwner: false,
        hasBookingLink: false,
      };
    case 'owner:bahay-batis':
      return {
        session: {
          role: 'owner',
          accountId: DEMO_IDS.bahayBatis.account,
          profileId: DEMO_IDS.people.owners.bahayBatis,
        },
        accountId: DEMO_IDS.bahayBatis.account,
        isPendingOwner: false,
        hasBookingLink: false,
      };
    case 'owner:ilaw-residences':
      return {
        session: {
          role: 'owner',
          accountId: DEMO_IDS.ilawResidences.account,
          profileId: DEMO_IDS.people.owners.ilawResidences,
        },
        accountId: DEMO_IDS.ilawResidences.account,
        isPendingOwner: false,
        hasBookingLink: false,
      };
    case 'owner:tita-lorna-dorm':
      return {
        session: {
          role: 'owner',
          accountId: DEMO_IDS.titaLornaDorm.account,
          profileId: DEMO_IDS.people.owners.titaLornaDorm,
        },
        accountId: DEMO_IDS.titaLornaDorm.account,
        isPendingOwner: false,
        hasBookingLink: false,
      };
    case 'owner:pending':
      return {
        session: {
          role: 'owner',
          accountId: DEMO_IDS.people.extraAccounts.pendingAccount,
          profileId: DEMO_IDS.people.owners.pending,
        },
        accountId: DEMO_IDS.people.extraAccounts.pendingAccount,
        isPendingOwner: true,
        hasBookingLink: false,
      };
    case 'super-admin':
      return {
        session: {
          role: 'super_admin',
          profileId: DEMO_IDS.platform.superAdminProfile,
        },
        accountId: null,
        isPendingOwner: false,
        hasBookingLink: false,
      };
  }
}

export function isOfflineError(error: {
  readonly details?: Readonly<Record<string, unknown>>;
}): boolean {
  return error.details?.offline === true;
}

export async function createSwitchClientBundle(
  state: SwitchState,
  options: { readonly storefrontOrigin: string; readonly baseNowMs?: number },
): Promise<SwitchClientBundle> {
  const validState = switchStateSchema.parse(state);
  const clock = resolveSwitchClock(validState.clock, options.baseNowMs);
  const demoPack = resolveDemoPackForScenario(validState.pack);
  const resolved = resolveSwitchSession(validState.as, demoPack, clock);

  const failWith =
    validState.pack === 'offline'
      ? appError('not_found', 'Offline: no network connection.', { offline: true })
      : validState.pack === 'error'
        ? validState.errorCode
        : undefined;

  const source = await getDataSource({
    adapter: 'memory',
    pack: demoPack,
    clock,
    storefrontOrigin: options.storefrontOrigin,
    ...(validState.pack === 'slow' ? { latencyMs: validState.latencyMs } : {}),
    ...(failWith !== undefined ? { failWith } : {}),
  });

  const world = resolveDemoWorld({ pack: demoPack, clock });
  let session = resolved.session;
  let hasBookingLink = resolved.hasBookingLink;

  if (
    validState.as === 'guest:link' &&
    validState.pack !== 'error' &&
    validState.pack !== 'offline' &&
    validState.pack !== 'slow'
  ) {
    const openThread = world.threads.find((thread) => thread.status === 'open');
    const ownerMember = openThread
      ? world.account_members.find(
          (member) => member.account_id === openThread.account_id && member.role === 'owner',
        )
      : undefined;

    if (openThread && ownerMember) {
      const rotated = await source.rotateThreadLink(
        { idempotencyKey: 'switch-guest-link-init', threadId: openThread.id },
        {
          role: 'owner',
          accountId: ownerMember.account_id,
          profileId: ownerMember.profile_id,
        },
      );
      if (rotated.ok) {
        session = { role: 'guest', threadToken: rotated.data.threadToken };
        hasBookingLink = true;
      }
    }
  }

  const publishedPropertyIds = new Set(
    world.property_pages.filter((page) => page.published).map((page) => page.property_id),
  );
  const propertySlugs = world.properties
    .filter((property) => publishedPropertyIds.has(property.id))
    .map((property) => property.slug);

  return {
    source,
    session,
    demoPack,
    clock,
    propertySlugs,
    accountId: resolved.accountId,
    isPendingOwner: resolved.isPendingOwner,
    hasBookingLink,
  };
}
