import { centavos } from '../../money/index.js';
import type { CustomerConsentsRow, CustomersRow } from '../../schemas/tables/index.js';
import { addDays, manilaToday, manilaWallTime } from '../../time/index.js';
import type { Clock } from '../../time/index.js';
import { buildUlapSuitesBrand } from '../brands/index.js';
import { makeDemoUuid } from '../ids.js';
import { buildBaseProfiles } from '../people.js';
import { AccountStoryBuilder } from '../story.js';
import { appendBrandToWorld, createEmptyDemoWorld, seedPlatformBase } from './shared.js';
import type { DemoWorld } from './shared.js';

const FIRST_NAMES = [
  'Marco',
  'Bea',
  'Carlo',
  'Alyssa',
  'Jericho',
  'Camille',
  'Paolo',
  'Cheska',
  'Vince',
  'Maricel',
  'Roel',
  'Danica',
  'Jomar',
  'Rina',
  'Mark',
] as const;

const LAST_NAMES = [
  'Santos',
  'Mendoza',
  'Reyes',
  'Garcia',
  'Tolentino',
  'Magbanua',
  'Ouano',
  'Bacalso',
  'Agbayani',
  'Corpuz',
] as const;

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildBusyPack(clock: Clock): DemoWorld {
  const today = manilaToday(clock);
  const createdAt = manilaWallTime(addDays(today, -540), '09:00').toISOString();
  const world = createEmptyDemoWorld();

  seedPlatformBase(world, today);
  const baseProfiles = buildBaseProfiles(createdAt);
  const ulapOwner = baseProfiles.brandOwnerProfiles[0];
  if (ulapOwner) {
    world.profiles.push(ulapOwner);
  }

  const ulap = buildUlapSuitesBrand(today);

  // Add 2 extra short-stay units on Ulap Suites so 400 non-overlapping stays fit over 18 months
  const extraUnits = [
    {
      id: makeDemoUuid('60', '0005', 3),
      slug: 'ridge-loft-2br',
      name: '2BR Ridge Loft',
      baseNightly: centavos(460000),
      weekendNightly: centavos(540000),
      maxGuests: 6,
    },
    {
      id: makeDemoUuid('60', '0005', 4),
      slug: 'pine-suite-studio',
      name: 'Pine Suite Studio',
      baseNightly: centavos(280000),
      weekendNightly: centavos(340000),
      maxGuests: 2,
    },
  ] as const;

  let weekdayRateSeq = 10;
  for (const extra of extraUnits) {
    ulap.units.push({
      id: extra.id,
      account_id: ulap.account.id,
      property_id: ulap.property.id,
      slug: extra.slug,
      name: extra.name,
      mode: 'short_stay',
      unit_type: 'entire_place',
      room_id: null,
      description: `${extra.name} in Tagaytay Ridge.`,
      max_guests: extra.maxGuests,
      bedrooms: 1,
      beds: 2,
      bathrooms: 1,
      floor_area_sqm: 30,
      arrival_info: 'Keyless entry.',
      sort_order: ulap.units.length,
      status: 'listed',
      archived_at: null,
      created_at: createdAt,
      updated_at: createdAt,
    });

    ulap.stayTerms.push({
      unit_id: extra.id,
      account_id: ulap.account.id,
      base_nightly_centavos: extra.baseNightly,
      base_guests: extra.maxGuests,
      min_nights: 1,
      max_nights: 14,
      prep_nights: 0,
      weekly_discount_percent: 10,
      monthly_discount_percent: 20,
      down_payment_percent: 30,
      hold_minutes: 60,
      advance_notice_days: 0,
      booking_window_days: 365,
      created_at: createdAt,
      updated_at: createdAt,
    });

    ulap.weekdayRates.push(
      {
        id: makeDemoUuid('60', '000a', weekdayRateSeq++),
        account_id: ulap.account.id,
        unit_id: extra.id,
        iso_weekday: 5,
        nightly_centavos: extra.weekendNightly,
        created_at: createdAt,
        updated_at: createdAt,
      },
      {
        id: makeDemoUuid('60', '000a', weekdayRateSeq++),
        account_id: ulap.account.id,
        unit_id: extra.id,
        iso_weekday: 6,
        nightly_centavos: extra.weekendNightly,
        created_at: createdAt,
        updated_at: createdAt,
      },
    );
  }

  // Generate 150 deterministic customers
  const customers: CustomersRow[] = [];
  const consents: CustomerConsentsRow[] = [];

  for (let i = 0; i < 150; i += 1) {
    const seq = i + 1;
    const first = FIRST_NAMES[i % FIRST_NAMES.length] ?? 'Guest';
    const last = LAST_NAMES[Math.floor(i / FIRST_NAMES.length) % LAST_NAMES.length] ?? 'Santos';
    const custId = makeDemoUuid('60', '0010', seq);
    const consentId = makeDemoUuid('60', '0011', seq);
    const email = `${first.toLowerCase()}.${last.toLowerCase()}.${seq}@example.com`;
    const mobile = `0917200${String(seq).padStart(4, '0')}`;

    customers.push({
      id: custId,
      account_id: ulap.account.id,
      profile_id: null,
      full_name: `${first} ${last}`,
      email,
      mobile,
      status: 'active',
      owner_note: null,
      anonymised_at: null,
      created_at: createdAt,
      updated_at: createdAt,
    });

    consents.push({
      id: consentId,
      account_id: ulap.account.id,
      customer_id: custId,
      kind: 'privacy_notice',
      granted: true,
      source: 'booking_form',
      notice_version: '2026-11',
      created_at: createdAt,
    });
  }

  world.customers.push(...customers);
  world.customer_consents.push(...consents);

  // Generate 400 non-overlapping bookings across the 4 units over 18 months (-450 to +90 days)
  const rng = mulberry32(0xdec0de42);
  const story = new AccountStoryBuilder(ulap, today, clock, '60');

  for (let uIdx = 0; uIdx < ulap.units.length; uIdx += 1) {
    const unit = ulap.units[uIdx];
    if (!unit) {
      continue;
    }

    let cursorOffset = -450 + uIdx;
    for (let b = 0; b < 100; b += 1) {
      const nights = rng() < 0.65 ? 2 : 3;
      const gap = rng() < 0.5 ? 2 : 3;
      const custIdx = Math.floor(rng() * customers.length);
      const customer = customers[custIdx];
      if (!customer) {
        continue;
      }

      const checkOutOffset = cursorOffset + nights;
      const status =
        checkOutOffset <= 0
          ? 'completed'
          : cursorOffset <= 0 && checkOutOffset > 0
            ? 'checked_in'
            : 'confirmed';

      story.stay({
        unitId: unit.id,
        customer,
        checkInOffset: cursorOffset,
        nights,
        adults: 2,
        status,
        paid: status === 'completed' || status === 'checked_in' ? 'full' : 'down',
        guestListSubmitted: false,
      });

      cursorOffset += nights + gap;
    }
  }

  appendBrandToWorld(world, ulap, story.build());

  return world;
}
