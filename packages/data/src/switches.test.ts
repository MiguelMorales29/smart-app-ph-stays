import {
  DEMO_IDS,
  buildBaseProfiles,
  buildExtraStateOwners,
  buildUlapSuitesBrand,
  fixedClock,
  manilaToday,
} from '@smartapp/core';
import { describe, expect, it } from 'vitest';

import { getHttpDataSource } from './http-client.js';
import {
  GOLDEN_CLOCK_ISO,
  SWITCH_BAR_MARKER,
  SWITCH_STORAGE_KEY,
  createDefaultSwitchState,
  createSwitchClientBundle,
  getSwitchViewAsOptions,
  isOfflineError,
  parseSwitchStateCookie,
  parseSwitchStateFromSearch,
  resolveInitialSwitchState,
  resolveSwitchClock,
  saveSwitchStateToStorage,
  serializeSwitchStateCookie,
  serializeSwitchStateToSearch,
} from './switches.js';

function createMemoryStorage(): Pick<Storage, 'getItem' | 'setItem'> {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
  };
}

describe('packages/data HTTP loader', () => {
  it('rejects early HTTP adapter requests with a clear Phase 11 error', async () => {
    await expect(getHttpDataSource({ apiBaseUrl: 'https://api.example.test' })).rejects.toThrow(
      /available from Phase 11/,
    );
  });
});

describe('packages/data switches controller', () => {
  it('exports a stable switch bar marker for the production build scan', () => {
    expect(SWITCH_BAR_MARKER).toBe('__SMARTAPP_DEV_SWITCH_BAR__');
  });

  it('derives every person and brand name dynamically from @smartapp/core demo definitions', () => {
    const clock = fixedClock(GOLDEN_CLOCK_ISO);
    const today = manilaToday(clock);
    const base = buildBaseProfiles(`${today}T09:00:00+08:00`);
    const extra = buildExtraStateOwners(today);
    const ulap = buildUlapSuitesBrand(today);

    const pendingProfile = extra.profiles.find((p) => p.id === DEMO_IDS.people.owners.pending);
    const pendingAccount = extra.accounts.find(
      (a) => a.id === DEMO_IDS.people.extraAccounts.pendingAccount,
    );
    const ulapOwner = base.brandOwnerProfiles.find(
      (p) => p.id === DEMO_IDS.people.owners.ulapSuites,
    );

    if (!pendingProfile || !pendingAccount || !ulapOwner) {
      throw new Error('Expected demo profiles to exist');
    }

    const options = getSwitchViewAsOptions(clock);
    const pendingOpt = options.find((opt) => opt.key === 'owner:pending');
    const ulapOpt = options.find((opt) => opt.key === 'owner:ulap-suites');
    const beaOpt = options.find((opt) => opt.key === 'member:bea-santos');
    const adminOpt = options.find((opt) => opt.key === 'super-admin');

    expect(pendingOpt?.label).toContain(pendingProfile.full_name);
    expect(pendingOpt?.label).toContain(pendingAccount.name);
    expect(ulapOpt?.label).toContain(ulapOwner.full_name);
    expect(ulapOpt?.label).toContain(ulap.account.name);
    expect(beaOpt?.label).toContain(base.memberBeaProfile.full_name);
    expect(adminOpt?.label).toContain(base.superAdminProfile.full_name);
  });

  it('parses and serializes URL query parameters and syncs with sessionStorage', () => {
    const storage = createMemoryStorage();
    const saved = createDefaultSwitchState({
      as: 'owner:bahay-batis',
      pack: 'busy',
      clock: 'golden',
    });
    saveSwitchStateToStorage(storage, saved);
    expect(storage.getItem(SWITCH_STORAGE_KEY)).toBeTruthy();

    const fromStorage = resolveInitialSwitchState('', storage);
    expect(fromStorage.as).toBe('owner:bahay-batis');
    expect(fromStorage.pack).toBe('busy');
    expect(fromStorage.clock).toBe('golden');

    const overriddenByUrl = resolveInitialSwitchState(
      '?as=super-admin&pack=error&clock=%2B1d&error=dates_taken&other=keep',
      storage,
    );
    expect(overriddenByUrl.as).toBe('super-admin');
    expect(overriddenByUrl.pack).toBe('error');
    expect(overriddenByUrl.clock).toBe('+1d');
    expect(overriddenByUrl.errorCode).toBe('dates_taken');

    const search = serializeSwitchStateToSearch(overriddenByUrl, '?other=keep');
    expect(search).toContain('other=keep');
    expect(search).toContain('as=super-admin');
    expect(search).toContain('pack=error');
    expect(search).toContain('error=dates_taken');

    const fallback = parseSwitchStateFromSearch('?as=bogus&pack=nope&clock=invalid');
    expect(fallback).toEqual(createDefaultSwitchState());
  });

  it('resolves golden clock and relative +1h/+1d offsets', () => {
    const baseMs = Date.parse('2026-11-17T10:00:00+08:00');
    expect(resolveSwitchClock('golden').now().toISOString()).toBe(
      new Date(GOLDEN_CLOCK_ISO).toISOString(),
    );
    expect(resolveSwitchClock('+1h', baseMs).now().getTime()).toBe(baseMs + 3_600_000);
    expect(resolveSwitchClock('+1d', baseMs).now().getTime()).toBe(baseMs + 86_400_000);
  });

  it('creates empty, error, offline, and guest-link client bundles cleanly', async () => {
    const guestLinkBundle = await createSwitchClientBundle(
      createDefaultSwitchState({ as: 'guest:link', pack: 'marketing', clock: 'golden' }),
      { storefrontOrigin: '' },
    );
    expect(guestLinkBundle.hasBookingLink).toBe(true);
    expect(guestLinkBundle.propertySlugs.length).toBe(4);
    expect(guestLinkBundle.session.role).toBe('guest');
    if (guestLinkBundle.session.role === 'guest' && 'threadToken' in guestLinkBundle.session) {
      const threadRes = await guestLinkBundle.source.getThread(
        { threadToken: guestLinkBundle.session.threadToken, threadId: null },
        guestLinkBundle.session,
      );
      expect(threadRes.ok).toBe(true);
    } else {
      throw new Error('Expected guest session with threadToken');
    }

    const emptyBundle = await createSwitchClientBundle(
      createDefaultSwitchState({ pack: 'empty', clock: 'golden' }),
      { storefrontOrigin: '' },
    );
    expect(emptyBundle.propertySlugs).toEqual([]);

    const errorBundle = await createSwitchClientBundle(
      createDefaultSwitchState({
        as: 'owner:ulap-suites',
        pack: 'error',
        errorCode: 'hold_limit',
        clock: 'golden',
      }),
      { storefrontOrigin: '' },
    );
    if (!errorBundle.accountId) {
      throw new Error('Expected accountId for owner_ulap');
    }
    const errRes = await errorBundle.source.ownerHome(
      { accountId: errorBundle.accountId },
      errorBundle.session,
    );
    expect(errRes.ok).toBe(false);
    if (!errRes.ok) {
      expect(errRes.error.code).toBe('hold_limit');
    }

    const offlineBundle = await createSwitchClientBundle(
      createDefaultSwitchState({ pack: 'offline', clock: 'golden' }),
      { storefrontOrigin: '' },
    );
    const offlineRes = await offlineBundle.source.getProperty(
      { slug: 'ulap-suites' },
      offlineBundle.session,
    );
    expect(offlineRes.ok).toBe(false);
    if (!offlineRes.ok) {
      expect(isOfflineError(offlineRes.error)).toBe(true);
    }

    const qaBundle = await createSwitchClientBundle(
      createDefaultSwitchState({ pack: 'qa', clock: 'golden' }),
      { storefrontOrigin: '' },
    );
    const pausedPropRes = await qaBundle.source.getProperty(
      { slug: 'casa-soriano-paused' },
      qaBundle.session,
    );
    expect(pausedPropRes.ok).toBe(true);
    if (pausedPropRes.ok) {
      expect(pausedPropRes.data.account.is_paused).toBe(true);
    }

    const activePropRes = await qaBundle.source.getProperty(
      { slug: 'ulap-suites' },
      qaBundle.session,
    );
    expect(activePropRes.ok).toBe(true);
    if (activePropRes.ok) {
      expect(activePropRes.data.account.is_paused).toBe(false);
    }
  });

  it('serializes and parses switch cookie values safely', () => {
    const state = createDefaultSwitchState({ as: 'guest', pack: 'qa', clock: 'golden' });
    const cookieStr = serializeSwitchStateCookie(state);
    const rawValue = cookieStr.split('=')[1]?.split(';')[0];
    expect(parseSwitchStateCookie(rawValue)).toEqual(state);
    expect(parseSwitchStateCookie('not-json')).toBeNull();
  });
});
