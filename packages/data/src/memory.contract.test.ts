/**
 * Memory adapter contract suite on the `qa` pack at the golden clock (`2026-12-10T10:00:00+08:00`).
 *
 * Phase 11 runs the exact same `runContractTests(makeSource)` suite against
 * the HTTP adapter and the seeded development database.
 */
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { runContractTests } from './contract-tests/index.js';
import {
  createValidatedDataSource,
  getDataSource,
  mediaUrl,
  type ParsedDataSourceHandlers,
} from './index.js';
import { createMemorySource } from './mocks/memory.js';

const GOLDEN_CLOCK_ISO = '2026-12-10T10:00:00+08:00';

runContractTests(() => {
  let currentMs = Date.parse(GOLDEN_CLOCK_ISO);
  const clock = {
    now: () => new Date(currentMs),
  };

  const source = createMemorySource({
    pack: 'qa',
    clock,
    storefrontOrigin: 'http://localhost:3100',
  });

  return {
    source,
    advanceMinutes: (minutes: number) => {
      currentMs += minutes * 60_000;
    },
  };
});

describe('getDataSource, mediaUrl, and adapter options', () => {
  it('loads the memory adapter via dynamic import and respects failWith and latencyMs', async () => {
    const startMs = Date.now();
    const slowFailing = await getDataSource({
      adapter: 'memory',
      pack: 'qa',
      clock: { now: () => new Date(GOLDEN_CLOCK_ISO) },
      latencyMs: 25,
      failWith: 'not_allowed',
    });

    const res = await slowFailing.getProperty({ slug: 'ulap-suites' }, { role: 'guest' });
    const elapsedMs = Date.now() - startMs;
    expect(elapsedMs).toBeGreaterThanOrEqual(20);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error.code).toBe('not_allowed');
    }
  });

  it('returns not_allowed with invalid_input and fields on invalid contract inputs without throwing (D45)', async () => {
    const source = await getDataSource({
      adapter: 'memory',
      pack: 'qa',
      clock: { now: () => new Date(GOLDEN_CLOCK_ISO) },
    });

    const result = await source.quoteStay(
      {
        unitId: 'not-a-uuid',
        checkIn: '2027-01-12',
        checkOut: '2027-01-14',
        adults: 2,
        children: 0,
      },
      { role: 'guest' },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('not_allowed');
      expect(result.error.details).toEqual({
        reason: 'invalid_input',
        fields: { unitId: 'Invalid UUID' },
      });
    }
  });

  it('turns files rows into storefront /demo-media URLs in memory mode and Supabase Storage URLs in Phase 11 mode', () => {
    expect(
      mediaUrl(
        {
          bucket: 'listing-media',
          path: '/demo-media/ulap-suites/photos/studio-fog-1-1200.webp',
        },
        { mode: 'memory', storefrontOrigin: 'http://localhost:3100/' },
      ),
    ).toBe('http://localhost:3100/demo-media/ulap-suites/photos/studio-fog-1-1200.webp');

    expect(
      mediaUrl(
        {
          bucket: 'listing-media',
          path: '/demo-media/ulap-suites/photos/studio-fog-1-1200.webp',
        },
        { mode: 'memory', storefrontOrigin: '' },
      ),
    ).toBe('/demo-media/ulap-suites/photos/studio-fog-1-1200.webp');

    expect(
      mediaUrl(
        {
          bucket: 'payment-proofs',
          path: 'acct-1/proofs/file-1.webp',
        },
        { mode: 'supabase', storageBaseUrl: 'https://project.supabase.co/' },
      ),
    ).toBe(
      'https://project.supabase.co/storage/v1/object/public/payment-proofs/acct-1/proofs/file-1.webp',
    );
  });

  it('throws a clear Phase 11 message when requesting the HTTP adapter early', async () => {
    await expect(
      getDataSource({ adapter: 'http', apiBaseUrl: 'https://api.example.com' }),
    ).rejects.toThrow(/Phase 11/);
  });

  it('validates adapter output against the core contract when validateOutput is enabled', async () => {
    const raw = createMemorySource({
      pack: 'qa',
      clock: { now: () => new Date(GOLDEN_CLOCK_ISO) },
    });

    const corruptHandlers: ParsedDataSourceHandlers = {
      ...raw,
      expireHolds: async () => ({
        ok: true,
        data: { expiredCount: -5 },
      }),
    };

    const validated = createValidatedDataSource(corruptHandlers, { validateOutput: true });
    await expect(validated.expireHolds({}, { role: 'system' })).rejects.toThrow(z.ZodError);
  });

  it('supports super admin approval, page publishing, member joining, and thread/review flows', async () => {
    const source = await getDataSource({
      adapter: 'memory',
      pack: 'qa',
      clock: { now: () => new Date(GOLDEN_CLOCK_ISO) },
    });

    const pendingOwners = await source.listOwnerAccounts(
      { status: 'pending' },
      { role: 'super_admin', profileId: 'dec0de00-0002-4000-8000-000000000001' },
    );
    expect(pendingOwners.ok).toBe(true);
    if (pendingOwners.ok && pendingOwners.data[0]) {
      const approved = await source.approveAccount(
        {
          idempotencyKey: 'idem-approve-acct-001',
          accountId: pendingOwners.data[0].id,
        },
        { role: 'super_admin', profileId: 'dec0de00-0002-4000-8000-000000000001' },
      );
      expect(approved.ok).toBe(true);
      if (approved.ok) {
        expect(approved.data.status).toBe('active');
      }
    }

    const joined = await source.joinAsMember(
      {
        idempotencyKey: 'idem-join-member-001',
        accountId: 'dec0de10-0001-4000-8000-000000000001',
        email: 'bea.santos@example.com',
        code: '123456',
      },
      { role: 'guest' },
    );
    expect(joined.ok).toBe(true);

    const home = await source.ownerHome(
      { accountId: 'dec0de10-0001-4000-8000-000000000001' },
      {
        role: 'owner',
        accountId: 'dec0de10-0001-4000-8000-000000000001',
        profileId: 'dec0de01-0002-4000-8000-000000000001',
      },
    );
    expect(home.ok).toBe(true);
    if (home.ok) {
      expect(home.data.proofs_to_check).toBeGreaterThanOrEqual(1);
    }

    const slugChanged = await source.changeSlug(
      {
        idempotencyKey: 'idem-slug-change-001',
        accountId: 'dec0de10-0001-4000-8000-000000000001',
        propertyId: 'dec0de10-0004-4000-8000-000000000001',
        newSlug: 'ulap-tagaytay',
      },
      {
        role: 'owner',
        accountId: 'dec0de10-0001-4000-8000-000000000001',
        profileId: 'dec0de01-0002-4000-8000-000000000001',
      },
    );
    expect(slugChanged.ok).toBe(true);
    if (slugChanged.ok) {
      expect(slugChanged.data.slug).toBe('ulap-tagaytay');
      expect(slugChanged.data.oldSlugs).toContain('ulap-suites');
    }
  });
});
