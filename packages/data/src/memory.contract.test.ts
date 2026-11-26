/**
 * Memory adapter contract suite on the `qa` pack at the golden clock (`2026-12-10T10:00:00+08:00`).
 *
 * Phase 11 runs the exact same `runContractTests(makeSource)` suite against
 * the HTTP adapter and the seeded development database.
 */
import { DEMO_IDS, centavos, readErrorDetails } from '@smartapp/core';
import { afterEach, describe, expect, it } from 'vitest';
import { z } from 'zod';

import { runContractTests } from './contract-tests/index.js';
import {
  clearMemoryUploads,
  createValidatedDataSource,
  getDataSource,
  mediaUrl,
  registerMemoryUploadUrl,
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

  it('seeds 8 demo units on Ulap Suites in the marketing pack (6 listed, 1 hidden, 1 draft; D73, P5-1)', async () => {
    const source = await getDataSource({
      adapter: 'memory',
      pack: 'marketing',
      clock: { now: () => new Date(GOLDEN_CLOCK_ISO) },
    });

    const ownerUnits = await source.listOwnerUnits(
      {
        accountId: 'dec0de10-0001-4000-8000-000000000001',
        propertyId: null,
        includeArchived: false,
      },
      {
        role: 'owner',
        accountId: 'dec0de10-0001-4000-8000-000000000001',
        profileId: 'dec0de01-0002-4000-8000-000000000001',
      },
    );
    expect(ownerUnits.ok).toBe(true);
    if (ownerUnits.ok) {
      expect(ownerUnits.data).toHaveLength(8);
      expect(ownerUnits.data.filter((u) => u.unit.status === 'listed')).toHaveLength(6);
      expect(ownerUnits.data.filter((u) => u.unit.status === 'unlisted')).toHaveLength(1);
      expect(ownerUnits.data.filter((u) => u.unit.status === 'draft')).toHaveLength(1);
      expect(ownerUnits.data.some((u) => u.unit.unit_type === 'entire_place')).toBe(true);
      expect(ownerUnits.data.some((u) => u.unit.unit_type === 'private_room')).toBe(true);
    }

    const publicProp = await source.getProperty({ slug: 'ulap-suites' }, { role: 'guest' });
    expect(publicProp.ok).toBe(true);
    if (publicProp.ok) {
      expect(publicProp.data.units).toHaveLength(6);
      for (const u of publicProp.data.units) {
        expect(u.price_from).toBeGreaterThanOrEqual(220_000);
        expect(u.price_from).toBeLessThanOrEqual(480_000);
      }
    }
  });

  afterEach(() => {
    clearMemoryUploads();
  });

  it('serves uploaded unit photos across owner unit page, units list, and storefront getProperty/getPublicUnit (FIX-1 B)', async () => {
    const source = createMemorySource({
      pack: 'qa',
      clock: { now: () => new Date(GOLDEN_CLOCK_ISO) },
      storefrontOrigin: 'http://localhost:3100',
    });
    const session = {
      role: 'owner' as const,
      accountId: DEMO_IDS.ulapSuites.account,
      profileId: DEMO_IDS.people.owners.ulapSuites,
    };

    const created = await source.saveUnit(
      {
        idempotencyKey: 'fix1-b-unit',
        accountId: DEMO_IDS.ulapSuites.account,
        propertyId: DEMO_IDS.ulapSuites.property,
        unitId: null,
        expectedUpdatedAt: null,
        name: 'Garden Studio',
        slug: 'garden-studio',
        mode: 'short_stay',
        unitType: 'entire_place',
        roomId: null,
        description: 'Bright studio with garden view.',
        maxGuests: 2,
        bedrooms: 1,
        beds: 1,
        bathrooms: 1,
        floorAreaSqm: 28,
        arrivalInfo: null,
        amenityIds: [DEMO_IDS.amenities.wifi],
        stayTerms: {
          base_nightly_centavos: centavos(280_000),
          base_guests: 2,
          min_nights: 1,
          max_nights: 14,
          prep_nights: 0,
          weekly_discount_percent: 0,
          monthly_discount_percent: 0,
          down_payment_percent: 30,
          hold_minutes: 60,
          advance_notice_days: 0,
          booking_window_days: 365,
        },
        leaseTerms: null,
      },
      session,
    );
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const uploadedUrls: string[] = [];
    const fileIds: string[] = [];
    for (let i = 1; i <= 3; i += 1) {
      const slot = await source.requestUpload(
        {
          idempotencyKey: `fix1-b-req-${i}`,
          accountId: DEMO_IDS.ulapSuites.account,
          purpose: 'unit_photo',
          mime: 'image/webp',
          sizeBytes: 32_000,
          width: 1200,
          height: 900,
          filename: `garden-${i}.webp`,
        },
        session,
      );
      expect(slot.ok).toBe(true);
      if (!slot.ok) return;
      const dataUrl = `data:image/webp;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==#${i}`;
      registerMemoryUploadUrl(slot.data.file.id, dataUrl);
      uploadedUrls.push(dataUrl);
      const confirmed = await source.confirmUpload(
        {
          idempotencyKey: `fix1-b-conf-${i}`,
          accountId: DEMO_IDS.ulapSuites.account,
          fileId: slot.data.file.id,
          width: 1200,
          height: 900,
          usedByTable: 'listing_photos',
          usedById: created.data.unit.id,
        },
        session,
      );
      expect(confirmed.ok).toBe(true);
      fileIds.push(slot.data.file.id);
    }

    const savedPhotos = await source.saveListingPhotos(
      {
        idempotencyKey: 'fix1-b-photos',
        accountId: DEMO_IDS.ulapSuites.account,
        propertyId: DEMO_IDS.ulapSuites.property,
        unitId: created.data.unit.id,
        photos: fileIds.map((fileId, idx) => ({ fileId, altText: `Garden view ${idx + 1}` })),
      },
      session,
    );
    expect(savedPhotos.ok).toBe(true);

    const listed = await source.setUnitStatus(
      {
        idempotencyKey: 'fix1-b-list',
        accountId: DEMO_IDS.ulapSuites.account,
        unitId: created.data.unit.id,
        status: 'listed',
        expectedUpdatedAt: created.data.unit.updated_at,
      },
      session,
    );
    expect(listed.ok).toBe(true);

    const ownerDetail = await source.getOwnerUnit(
      { accountId: DEMO_IDS.ulapSuites.account, unitId: created.data.unit.id },
      session,
    );
    expect(ownerDetail.ok).toBe(true);
    if (ownerDetail.ok) {
      expect(ownerDetail.data.photos.map((p) => p.url)).toEqual(uploadedUrls);
    }

    const ownerList = await source.listOwnerUnits(
      {
        accountId: DEMO_IDS.ulapSuites.account,
        propertyId: DEMO_IDS.ulapSuites.property,
        includeArchived: false,
      },
      session,
    );
    expect(ownerList.ok).toBe(true);
    if (ownerList.ok) {
      const card = ownerList.data.find((u) => u.unit.id === created.data.unit.id);
      expect(card?.cover_photo?.url).toBe(uploadedUrls[0]);
    }

    const storefrontProp = await source.getProperty({ slug: 'ulap-suites' }, { role: 'guest' });
    expect(storefrontProp.ok).toBe(true);
    if (storefrontProp.ok) {
      const publicCard = storefrontProp.data.units.find((u) => u.id === created.data.unit.id);
      expect(publicCard?.photos.map((p) => p.url)).toEqual(uploadedUrls);
    }

    const storefrontUnit = await source.getPublicUnit(
      { slug: 'ulap-suites', unitSlug: 'garden-studio' },
      { role: 'guest' },
    );
    expect(storefrontUnit.ok).toBe(true);
    if (storefrontUnit.ok) {
      expect(storefrontUnit.data.photos.map((p) => p.url)).toEqual(uploadedUrls);
    }
  });

  it('bypasses plan unit limit when enforcePlanLimit is false (FIX-1 G)', async () => {
    const source = createMemorySource({
      pack: 'marketing',
      clock: { now: () => new Date(GOLDEN_CLOCK_ISO) },
      enforcePlanLimit: false,
    });
    const session = {
      role: 'owner' as const,
      accountId: DEMO_IDS.ulapSuites.account,
      profileId: DEMO_IDS.people.owners.ulapSuites,
    };

    // Ulap Suites in marketing pack starts at 8 of 8 units.
    const extra = await source.saveUnit(
      {
        idempotencyKey: 'fix1-g-bypass',
        accountId: DEMO_IDS.ulapSuites.account,
        propertyId: DEMO_IDS.ulapSuites.property,
        unitId: null,
        expectedUpdatedAt: null,
        name: 'Testing Suite 9',
        slug: 'testing-suite-9',
        mode: 'short_stay',
        unitType: 'entire_place',
        roomId: null,
        description: 'Added with plan limit switched off for testing.',
        maxGuests: 2,
        bedrooms: 1,
        beds: 1,
        bathrooms: 1,
        floorAreaSqm: 30,
        arrivalInfo: null,
        amenityIds: [],
        stayTerms: null,
        leaseTerms: null,
      },
      session,
    );
    expect(extra.ok).toBe(true);

    // Confirm default source with enforcePlanLimit=true blocks at 8/8.
    const enforced = createMemorySource({
      pack: 'marketing',
      clock: { now: () => new Date(GOLDEN_CLOCK_ISO) },
    });
    const blocked = await enforced.saveUnit(
      {
        idempotencyKey: 'fix1-g-blocked',
        accountId: DEMO_IDS.ulapSuites.account,
        propertyId: DEMO_IDS.ulapSuites.property,
        unitId: null,
        expectedUpdatedAt: null,
        name: 'Testing Suite 9',
        slug: 'testing-suite-9',
        mode: 'short_stay',
        unitType: 'entire_place',
        roomId: null,
        description: 'Blocked at 8/8.',
        maxGuests: 2,
        bedrooms: 1,
        beds: 1,
        bathrooms: 1,
        floorAreaSqm: 30,
        arrivalInfo: null,
        amenityIds: [],
        stayTerms: null,
        leaseTerms: null,
      },
      session,
    );
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(readErrorDetails(blocked.error)).toMatchObject({
        reason: 'unit_limit',
        limit: 8,
        used: 8,
      });
    }
  });
});
