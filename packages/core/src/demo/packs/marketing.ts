import { addDays, manilaToday, manilaWallTime } from '../../time/index.js';
import type { Clock } from '../../time/index.js';
import {
  buildBahayBatisBrand,
  buildIlawResidencesBrand,
  buildTitaLornaDormBrand,
  buildUlapSuitesBrand,
} from '../brands/index.js';
import { DEMO_IDS } from '../ids.js';
import { buildAccountCustomers, buildBaseProfiles } from '../people.js';
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

  const ulap = buildUlapSuitesBrand(today);
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
  const studioFog = DEMO_IDS.ulapSuites.units.studioFog;
  const taalView = DEMO_IDS.ulapSuites.units.taalView1br;

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

  appendBrandToWorld(world, ulap, ulapStory.build());
  appendBrandToWorld(world, bahay, bahayStory.build());
  appendBrandToWorld(world, ilaw);
  appendBrandToWorld(world, lorna);

  return world;
}
