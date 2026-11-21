import { centavos } from '../../money/index.js';
import { addDays, manilaToday, manilaWallTime } from '../../time/index.js';
import type { Clock } from '../../time/index.js';
import {
  buildBahayBatisBrand,
  buildIlawResidencesBrand,
  buildTitaLornaDormBrand,
  buildUlapSuitesBrand,
} from '../brands/index.js';
import { DEMO_IDS, makeDemoUuid } from '../ids.js';
import { buildAccountCustomers, buildBaseProfiles, buildExtraStateOwners } from '../people.js';
import { AccountStoryBuilder } from '../story.js';
import { appendBrandToWorld, createEmptyDemoWorld, seedPlatformBase } from './shared.js';
import type { DemoWorld } from './shared.js';

export function buildMarketingPack(clock: Clock): DemoWorld {
  const today = manilaToday(clock);
  const createdAt = manilaWallTime(addDays(today, -60), '09:00').toISOString();
  const world = createEmptyDemoWorld();

  seedPlatformBase(world, today);
  const baseProfiles = buildBaseProfiles(createdAt);
  world.profiles.push(...baseProfiles.brandOwnerProfiles);

  const studioFog = DEMO_IDS.ulapSuites.units.studioFog;
  const taalView = DEMO_IDS.ulapSuites.units.taalView1br;
  const ulap = buildUlapSuitesBrand(today, {
    extraUnits: 3,
    pageUnits: [
      studioFog,
      taalView,
      DEMO_IDS.ulapSuites.units.ridgeSuite1br,
      DEMO_IDS.ulapSuites.units.cloudCornerStudio,
    ],
  });
  const bahay = buildBahayBatisBrand(today);
  const ilaw = buildIlawResidencesBrand(today);
  const lorna = buildTitaLornaDormBrand(today);

  const ulapCustomers = buildAccountCustomers('10', ulap.account.id, createdAt);
  const bahayCustomers = buildAccountCustomers('20', bahay.account.id, createdAt);
  world.customers.push(...ulapCustomers.customers, ...bahayCustomers.customers);
  world.customer_consents.push(...ulapCustomers.consents, ...bahayCustomers.consents);

  const uc = ulapCustomers.byKey;
  const bc = bahayCustomers.byKey;

  const ulapStory = new AccountStoryBuilder(ulap, today, clock);

  const mustCustomer = (
    map: Readonly<Record<string, (typeof ulapCustomers.customers)[0]>>,
    key: string,
  ) => {
    const c = map[key];
    if (!c) {
      throw new Error(`Missing demo customer: ${key}`);
    }
    return c;
  };

  // Studio Fog stays (11 bookings: 3 completed, 1 checked_in today 0->+3, 5 confirmed, 1 in_review, 1 held)
  ulapStory.stay({
    unitId: studioFog,
    customer: mustCustomer(uc, 'beaSantos'),
    checkInOffset: -28,
    nights: 2,
    adults: 2,
    status: 'completed',
    paid: 'full',
    vehiclePlate: 'NAA 4821',
    review: {
      stars: 5,
      note: 'Super cozy projector setup and sunrise coffee on the balcony! Will definitely book again.',
    },
  });
  ulapStory.stay({
    unitId: studioFog,
    customer: mustCustomer(uc, 'carloMendoza'),
    checkInOffset: -20,
    nights: 3,
    adults: 2,
    status: 'completed',
    paid: 'full',
    review: {
      stars: 5,
      note: 'Fast fiber Wi-Fi for remote work and spotless bathroom. Easy self check-in.',
    },
  });
  ulapStory.stay({
    unitId: studioFog,
    customer: mustCustomer(uc, 'alyssaReyes'),
    checkInOffset: -11,
    nights: 2,
    adults: 2,
    status: 'completed',
    paid: 'full',
    review: {
      stars: 4,
      note: 'Loved the board games and pandesal basket! Pool water was a bit chilly at night.',
    },
  });
  ulapStory.stay({
    unitId: studioFog,
    customer: mustCustomer(uc, 'jerichoGarcia'),
    checkInOffset: 0,
    nights: 3,
    adults: 2,
    status: 'checked_in',
    paid: 'full',
    vehiclePlate: 'NCD 1094',
  });
  ulapStory.stay({
    unitId: studioFog,
    customer: mustCustomer(uc, 'camilleTolentino'),
    checkInOffset: 3,
    nights: 3,
    adults: 2,
    status: 'confirmed',
    paid: 'down',
  });
  ulapStory.stay({
    unitId: studioFog,
    customer: mustCustomer(uc, 'paoloEvangelista'),
    checkInOffset: 7,
    nights: 3,
    adults: 2,
    status: 'confirmed',
    paid: 'full',
  });
  ulapStory.stay({
    unitId: studioFog,
    customer: mustCustomer(uc, 'cheskaMagbanua'),
    checkInOffset: 11,
    nights: 2,
    adults: 2,
    status: 'in_review',
    paid: 'down',
  });
  ulapStory.stay({
    unitId: studioFog,
    customer: mustCustomer(uc, 'vinceCanete'),
    checkInOffset: 14,
    nights: 3,
    adults: 2,
    status: 'confirmed',
    paid: 'down',
  });
  ulapStory.stay({
    unitId: studioFog,
    customer: mustCustomer(uc, 'maricelOuano'),
    checkInOffset: 19,
    nights: 2,
    adults: 2,
    status: 'held',
    paid: 'none',
  });
  ulapStory.stay({
    unitId: studioFog,
    customer: mustCustomer(uc, 'beaSantos'),
    checkInOffset: 22,
    nights: 3,
    adults: 2,
    status: 'confirmed',
    paid: 'down',
  });
  ulapStory.stay({
    unitId: studioFog,
    customer: mustCustomer(uc, 'roelYbanez'),
    checkInOffset: 26,
    nights: 3,
    adults: 2,
    status: 'confirmed',
    paid: 'full',
  });

  // 1BR Taal View stays (9 bookings: 2 completed, 1 checked_in checking out today -3->0, 6 confirmed)
  ulapStory.stay({
    unitId: taalView,
    customer: mustCustomer(uc, 'danicaOcampo'),
    checkInOffset: -24,
    nights: 3,
    adults: 4,
    status: 'completed',
    paid: 'full',
    review: {
      stars: 5,
      note: 'Best Taal Lake view in Tagaytay! My family loved the karaoke and full kitchen.',
    },
  });
  ulapStory.stay({
    unitId: taalView,
    customer: mustCustomer(uc, 'leahMadamba'),
    checkInOffset: -14,
    nights: 3,
    adults: 3,
    children: 1,
    status: 'completed',
    paid: 'full',
    review: {
      stars: 5,
      note: 'Very responsive host and super clear payment receipt in the link.',
    },
  });
  ulapStory.stay({
    unitId: taalView,
    customer: mustCustomer(uc, 'jomarBacalso'),
    checkInOffset: -3,
    nights: 3,
    adults: 4,
    status: 'checked_in',
    paid: 'full',
    vehiclePlate: 'GAE 7721',
  });
  ulapStory.stay({
    unitId: taalView,
    customer: mustCustomer(uc, 'rinaAgbayani'),
    checkInOffset: 1,
    nights: 3,
    adults: 3,
    children: 1,
    status: 'confirmed',
    paid: 'full',
  });
  ulapStory.stay({
    unitId: taalView,
    customer: mustCustomer(uc, 'markCorpuz'),
    checkInOffset: 5,
    nights: 4,
    adults: 4,
    status: 'confirmed',
    paid: 'down',
  });
  ulapStory.stay({
    unitId: taalView,
    customer: mustCustomer(uc, 'joyMangaoang'),
    checkInOffset: 10,
    nights: 4,
    adults: 4,
    status: 'confirmed',
    paid: 'full',
  });
  ulapStory.stay({
    unitId: taalView,
    customer: mustCustomer(uc, 'bryanAncheta'),
    checkInOffset: 15,
    nights: 3,
    adults: 4,
    status: 'confirmed',
    paid: 'down',
  });
  ulapStory.stay({
    unitId: taalView,
    customer: mustCustomer(uc, 'leahMadamba'),
    checkInOffset: 19,
    nights: 3,
    adults: 3,
    status: 'confirmed',
    paid: 'full',
  });
  ulapStory.stay({
    unitId: taalView,
    customer: mustCustomer(uc, 'erwinDumlao'),
    checkInOffset: 24,
    nights: 3,
    adults: 4,
    status: 'confirmed',
    paid: 'down',
  });

  // Bahay Batis stays (7 bookings: 2 completed with reviews, 5 confirmed including 1 with owner-recorded cash payment)
  const bahayStory = new AccountStoryBuilder(bahay, today, clock);
  const buongBahay = DEMO_IDS.bahayBatis.units.buongBahay;

  bahayStory.stay({
    unitId: buongBahay,
    customer: mustCustomer(bc, 'kevinLim'),
    checkInOffset: -21,
    nights: 2,
    adults: 15,
    children: 3,
    status: 'completed',
    paid: 'full',
    review: {
      stars: 5,
      note: 'Warm natural hot spring pool, clean bunk rooms, and zero corkage! Whole clan had a blast.',
    },
  });
  bahayStory.stay({
    unitId: buongBahay,
    customer: mustCustomer(bc, 'stephanieChua'),
    checkInOffset: -10,
    nights: 2,
    adults: 14,
    children: 2,
    status: 'completed',
    paid: 'full',
    review: {
      stars: 5,
      note: 'Kids loved the slide and adults played billiards and videoke all night. Highly recommended!',
    },
  });
  bahayStory.stay({
    unitId: buongBahay,
    customer: mustCustomer(bc, 'lanceOng'),
    checkInOffset: 1,
    nights: 3,
    adults: 16,
    children: 2,
    status: 'confirmed',
    paid: 'down_plus_cash_balance',
  });
  bahayStory.stay({
    unitId: buongBahay,
    customer: mustCustomer(bc, 'trishaGo'),
    checkInOffset: 6,
    nights: 4,
    adults: 15,
    status: 'confirmed',
    paid: 'full',
  });
  bahayStory.stay({
    unitId: buongBahay,
    customer: mustCustomer(bc, 'benedictTan'),
    checkInOffset: 11,
    nights: 4,
    adults: 18,
    children: 2,
    status: 'confirmed',
    paid: 'down',
  });
  bahayStory.stay({
    unitId: buongBahay,
    customer: mustCustomer(bc, 'audreySy'),
    checkInOffset: 17,
    nights: 4,
    adults: 16,
    status: 'confirmed',
    paid: 'full',
  });
  bahayStory.stay({
    unitId: buongBahay,
    customer: mustCustomer(bc, 'beaSantos'),
    checkInOffset: 23,
    nights: 4,
    adults: 15,
    status: 'confirmed',
    paid: 'down',
  });

  // D73 / P5-1: Ulap Suites gets 8 units in the marketing pack (today 2), reusing its existing demo photos
  // in a different order per unit: a mix of whole places and private rooms, one hidden, one draft,
  // prices from ₱2,200 to ₱4,800 a night, with extra_units = 3 (5 included + 3 extra = 8 limit).
  const studioFogPhotos = ulap.listingPhotos
    .filter((lp) => lp.unit_id === studioFog)
    .sort((a, b) => a.sort_order - b.sort_order);
  const taalViewPhotos = ulap.listingPhotos
    .filter((lp) => lp.unit_id === taalView)
    .sort((a, b) => a.sort_order - b.sort_order);

  const rotatePhotos = <T>(items: readonly T[], offset: number, count: number): T[] => {
    if (items.length === 0) return [];
    const out: T[] = [];
    for (let i = 0; i < count && i < items.length; i += 1) {
      const item = items[(i + offset) % items.length];
      if (item !== undefined) {
        out.push(item);
      }
    }
    return out;
  };

  const extraMarketingUnits = [
    {
      id: DEMO_IDS.ulapSuites.units.pineNookRoom,
      slug: 'pine-nook-room',
      name: 'Pine Nook Room',
      unit_type: 'private_room' as const,
      status: 'listed' as const,
      max_guests: 2,
      bedrooms: 1,
      beds: 1,
      bathrooms: 1,
      floor_area_sqm: 18,
      baseNightly: 220_000, // ₱2,200
      weekendNightly: 260_000,
      description:
        'Quiet private queen room overlooking the pine grove with dedicated fiber work desk and coffee corner.',
      arrival_info: 'Tower 2, Unit 1204. Keyless door code #1204.',
      sourcePhotos: rotatePhotos(studioFogPhotos, 2, 5),
      amenityIds: [
        DEMO_IDS.amenities.wifi,
        DEMO_IDS.amenities.aircon,
        DEMO_IDS.amenities.waterHeater,
        DEMO_IDS.amenities.towels,
        DEMO_IDS.amenities.coffeeBar,
        DEMO_IDS.amenities.workDesk,
      ],
    },
    {
      id: DEMO_IDS.ulapSuites.units.cloudCornerStudio,
      slug: 'cloud-corner-studio',
      name: 'Cloud Corner Studio',
      unit_type: 'entire_place' as const,
      status: 'listed' as const,
      max_guests: 2,
      bedrooms: 0,
      beds: 1,
      bathrooms: 1,
      floor_area_sqm: 26,
      baseNightly: 280_000, // ₱2,800
      weekendNightly: 340_000,
      description:
        'Corner studio with wrap-around ridge windows, 100-inch projector, induction kitchenette, and board games.',
      arrival_info: 'Tower 2, Unit 1510. Keyless door code #1510.',
      sourcePhotos: rotatePhotos(studioFogPhotos, 4, 6),
      amenityIds: [
        DEMO_IDS.amenities.wifi,
        DEMO_IDS.amenities.aircon,
        DEMO_IDS.amenities.waterHeater,
        DEMO_IDS.amenities.towels,
        DEMO_IDS.amenities.projector,
        DEMO_IDS.amenities.boardGames,
        DEMO_IDS.amenities.kitchenette,
      ],
    },
    {
      id: DEMO_IDS.ulapSuites.units.ridgeSuite1br,
      slug: 'ridge-suite-1br',
      name: '1BR Ridge Suite',
      unit_type: 'entire_place' as const,
      status: 'listed' as const,
      max_guests: 4,
      bedrooms: 1,
      beds: 2,
      bathrooms: 1,
      floor_area_sqm: 38,
      baseNightly: 380_000, // ₱3,800
      weekendNightly: 440_000,
      description:
        'High-floor 1-bedroom suite with wide Taal Lake balcony, full kitchen, smart TV, and board game shelf.',
      arrival_info: 'Tower 2, Unit 1905. Keyless door code #1905.',
      sourcePhotos: rotatePhotos(taalViewPhotos, 2, 6),
      amenityIds: [
        DEMO_IDS.amenities.wifi,
        DEMO_IDS.amenities.aircon,
        DEMO_IDS.amenities.waterHeater,
        DEMO_IDS.amenities.towels,
        DEMO_IDS.amenities.smartTv,
        DEMO_IDS.amenities.fullKitchen,
        DEMO_IDS.amenities.balcony,
        DEMO_IDS.amenities.sharedPool,
      ],
    },
    {
      id: DEMO_IDS.ulapSuites.units.sunriseRoom,
      slug: 'sunrise-room',
      name: 'Sunrise Balcony Room',
      unit_type: 'private_room' as const,
      status: 'listed' as const,
      max_guests: 2,
      bedrooms: 1,
      beds: 1,
      bathrooms: 1,
      floor_area_sqm: 20,
      baseNightly: 240_000, // ₱2,400
      weekendNightly: 290_000,
      description:
        'East-facing private room with sunrise balcony chairs, drip coffee bar, rain shower, and fast Wi-Fi.',
      arrival_info: 'Tower 2, Unit 1603. Keyless door code #1603.',
      sourcePhotos: rotatePhotos(taalViewPhotos, 5, 5),
      amenityIds: [
        DEMO_IDS.amenities.wifi,
        DEMO_IDS.amenities.aircon,
        DEMO_IDS.amenities.waterHeater,
        DEMO_IDS.amenities.towels,
        DEMO_IDS.amenities.coffeeBar,
        DEMO_IDS.amenities.balcony,
      ],
    },
    {
      id: DEMO_IDS.ulapSuites.units.skylineLoft2br,
      slug: 'skyline-loft-2br',
      name: '2BR Skyline Loft',
      unit_type: 'entire_place' as const,
      status: 'unlisted' as const, // 1 hidden
      max_guests: 6,
      bedrooms: 2,
      beds: 3,
      bathrooms: 2,
      floor_area_sqm: 54,
      baseNightly: 480_000, // ₱4,800
      weekendNightly: 560_000,
      description:
        'Top-floor 2-bedroom family loft with panoramic Taal ridge terrace, karaoke set, full kitchen, and dining for six.',
      arrival_info: 'Tower 2, Penthouse 2101. Keyless door code #2101.',
      sourcePhotos: rotatePhotos(taalViewPhotos, 3, 6),
      amenityIds: [
        DEMO_IDS.amenities.wifi,
        DEMO_IDS.amenities.aircon,
        DEMO_IDS.amenities.waterHeater,
        DEMO_IDS.amenities.towels,
        DEMO_IDS.amenities.smartTv,
        DEMO_IDS.amenities.karaoke,
        DEMO_IDS.amenities.fullKitchen,
        DEMO_IDS.amenities.balcony,
      ],
    },
    {
      id: DEMO_IDS.ulapSuites.units.gardenPatioStudio,
      slug: 'garden-patio-studio',
      name: 'Garden Patio Studio',
      unit_type: 'entire_place' as const,
      status: 'draft' as const, // 1 draft
      max_guests: 2,
      bedrooms: 0,
      beds: 1,
      bathrooms: 1,
      floor_area_sqm: 25,
      baseNightly: 250_000, // ₱2,500
      weekendNightly: 300_000,
      description:
        'Ground-level studio opening onto the pine courtyard patio with coffee bar and reading nook.',
      arrival_info: 'Tower 2, Unit 104. Keyless door code #0104.',
      sourcePhotos: rotatePhotos(studioFogPhotos, 5, 4),
      amenityIds: [
        DEMO_IDS.amenities.wifi,
        DEMO_IDS.amenities.aircon,
        DEMO_IDS.amenities.waterHeater,
        DEMO_IDS.amenities.towels,
        DEMO_IDS.amenities.coffeeBar,
      ],
    },
  ] as const;

  let extraPhotoSeq = 100;
  let extraWeekdaySeq = 10;
  for (let i = 0; i < extraMarketingUnits.length; i += 1) {
    const spec = extraMarketingUnits[i];
    if (!spec) continue;
    ulap.units.push({
      id: spec.id,
      account_id: ulap.account.id,
      property_id: ulap.property.id,
      slug: spec.slug,
      name: spec.name,
      mode: 'short_stay',
      unit_type: spec.unit_type,
      group_label: null,
      description: spec.description,
      max_guests: spec.max_guests,
      bedrooms: spec.bedrooms,
      beds: spec.beds,
      bathrooms: spec.bathrooms,
      floor_area_sqm: spec.floor_area_sqm,
      arrival_info: spec.arrival_info,
      sort_order: 2 + i,
      status: spec.status,
      archived_at: null,
      created_at: createdAt,
      updated_at: createdAt,
    });

    ulap.stayTerms.push({
      unit_id: spec.id,
      account_id: ulap.account.id,
      base_nightly_centavos: centavos(spec.baseNightly),
      base_guests: Math.min(spec.max_guests, 2),
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
        id: makeDemoUuid('10', '000a', extraWeekdaySeq++),
        account_id: ulap.account.id,
        unit_id: spec.id,
        iso_weekday: 5,
        nightly_centavos: centavos(spec.weekendNightly),
        created_at: createdAt,
        updated_at: createdAt,
      },
      {
        id: makeDemoUuid('10', '000a', extraWeekdaySeq++),
        account_id: ulap.account.id,
        unit_id: spec.id,
        iso_weekday: 6,
        nightly_centavos: centavos(spec.weekendNightly),
        created_at: createdAt,
        updated_at: createdAt,
      },
    );

    spec.sourcePhotos.forEach((photo, idx) => {
      ulap.listingPhotos.push({
        id: makeDemoUuid('10', '0007', extraPhotoSeq++),
        account_id: ulap.account.id,
        property_id: ulap.property.id,
        unit_id: spec.id,
        file_id: photo.file_id,
        alt_text: photo.alt_text,
        sort_order: idx,
        created_at: createdAt,
        updated_at: createdAt,
      });
    });

    for (const amenityId of spec.amenityIds) {
      ulap.unitAmenities.push({
        account_id: ulap.account.id,
        unit_id: spec.id,
        amenity_id: amenityId,
        created_at: createdAt,
      });
    }
  }

  appendBrandToWorld(world, ulap, ulapStory.build());
  appendBrandToWorld(world, bahay, bahayStory.build());
  appendBrandToWorld(world, ilaw);
  appendBrandToWorld(world, lorna);

  // One pending owner applicant so pending onboarding/approval flows work on the default pack
  const extraOwners = buildExtraStateOwners(today);
  const pendingProfile = extraOwners.profiles.find((p) => p.id === DEMO_IDS.people.owners.pending);
  const pendingAccount = extraOwners.accounts.find(
    (a) => a.id === DEMO_IDS.people.extraAccounts.pendingAccount,
  );
  const pendingMember = extraOwners.members.find(
    (m) => m.id === DEMO_IDS.people.extraAccounts.pendingMember,
  );
  const pendingApplication = extraOwners.applications.find(
    (app) => app.id === DEMO_IDS.people.extraAccounts.pendingApplication,
  );
  if (pendingProfile && pendingAccount && pendingMember && pendingApplication) {
    world.profiles.push(pendingProfile);
    world.accounts.push(pendingAccount);
    world.account_members.push(pendingMember);
    world.owner_applications.push(pendingApplication);
  }

  return world;
}
