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

export const QA_EIGHTY_CHAR_EMOJI_ENYE_NAME =
  'Señora Maria Concepcion Villavicencio-Montemayor de la Peña 🌟 Quezon City Habit';

export function buildQaPack(clock: Clock): DemoWorld {
  const today = manilaToday(clock);
  const createdAt = manilaWallTime(addDays(today, -60), '09:00').toISOString();
  const world = createEmptyDemoWorld();

  seedPlatformBase(world, today);
  const baseProfiles = buildBaseProfiles(createdAt);
  world.profiles.push(...baseProfiles.brandOwnerProfiles);

  const qaStoragePlanId = makeDemoUuid('50', '0001', 1);
  world.plans.push({
    id: qaStoragePlanId,
    code: 'qa_storage_10mb',
    name: 'QA 10 MB Storage Plan',
    price_centavos: centavos(59900),
    included_units: 5,
    extra_unit_centavos: centavos(10000),
    storage_bytes: 10_000_000,
    trial_days: 14,
    is_active: true,
    created_at: createdAt,
    updated_at: createdAt,
  });

  const extraOwners = buildExtraStateOwners(today);
  world.profiles.push(...extraOwners.profiles);
  world.accounts.push(...extraOwners.accounts);
  world.account_members.push(...extraOwners.members);

  for (const sub of extraOwners.subscriptions) {
    if (
      sub.account_id === DEMO_IDS.people.extraAccounts.trialDay13Account ||
      sub.account_id === DEMO_IDS.people.extraAccounts.inGraceAccount ||
      sub.account_id === DEMO_IDS.people.extraAccounts.pausedAccount
    ) {
      world.subscriptions.push({ ...sub, plan_id: qaStoragePlanId });
    } else {
      world.subscriptions.push(sub);
    }
  }

  // Storage at 80%, 95%, and 100% of the 10 MB QA plan
  const storageTargets = [
    {
      seq: 1,
      accountId: DEMO_IDS.people.extraAccounts.trialDay13Account,
      profileId: DEMO_IDS.people.owners.trialDay13,
      bytes: 8_000_000, // 80%
    },
    {
      seq: 2,
      accountId: DEMO_IDS.people.extraAccounts.inGraceAccount,
      profileId: DEMO_IDS.people.owners.inGrace,
      bytes: 9_500_000, // 95%
    },
    {
      seq: 3,
      accountId: DEMO_IDS.people.extraAccounts.pausedAccount,
      profileId: DEMO_IDS.people.owners.paused,
      bytes: 10_000_000, // 100%
    },
  ] as const;

  for (const target of storageTargets) {
    const fileId = makeDemoUuid('50', '0006', target.seq);
    world.files.push({
      id: fileId,
      account_id: target.accountId,
      bucket: 'listing-media',
      path: `${target.accountId}/qa-storage/${fileId}.webp`,
      purpose: 'property_photo',
      mime: 'image/webp',
      size_bytes: target.bytes,
      width: 1200,
      height: 896,
      uploaded_by_kind: 'owner',
      customer_id: null,
      uploaded_by_profile: target.profileId,
      used_by_table: 'accounts',
      used_by_id: target.accountId,
      status: 'ready',
      confirmed_at: createdAt,
      delete_after: null,
      deleted_at: null,
      created_at: createdAt,
      updated_at: createdAt,
    });
  }

  // Unpublished property on the in-grace owner account
  const unpublishedPropertyId = makeDemoUuid('50', '0004', 1);
  world.properties.push({
    id: unpublishedPropertyId,
    account_id: DEMO_IDS.people.extraAccounts.inGraceAccount,
    slug: 'patio-verde-unpublished',
    old_slugs: ['patio-verde-old'],
    name: 'Patio Verde Stay (Unpublished)',
    tagline: 'Hidden garden stay',
    description: 'Unpublished property for QA verification.',
    address_line: '77 Mabini Street',
    barangay: 'Poblacion',
    city: 'Lipa City',
    province: 'Batangas',
    region: 'CALABARZON',
    country: 'PH',
    latitude: null,
    longitude: null,
    map_url: null,
    checkin_time: '14:00',
    checkout_time: '12:00',
    arrival_info: null,
    cancellation_preset: 'flexible',
    cancellation_note: null,
    privacy_contact: 'owner.in-grace@demo.invalid',
    logo_file_id: null,
    status: 'unpublished',
    published_at: null,
    archived_at: null,
    rebook_min_days: 7,
    rebook_within_months: 6,
    guest_ids_required: false,
    guest_list_due_hours: 48,
    contact: {
      phone: '+63 917 000 0107',
      messenger: null,
      facebook: null,
      instagram: null,
      tiktok: null,
      viber: null,
      whatsapp: null,
      google_review_url: null,
    },
    show_exact_location: false,
    reply_hours: null,
    viewing_hours: null,
    created_at: createdAt,
    updated_at: createdAt,
  });

  // Published property on the paused owner account (for PA-09 contact-only verification)
  const pausedPropertyId = makeDemoUuid('50', '0004', 2);
  world.properties.push({
    id: pausedPropertyId,
    account_id: DEMO_IDS.people.extraAccounts.pausedAccount,
    slug: 'casa-soriano-paused',
    old_slugs: [],
    name: 'Casa Soriano (Paused)',
    tagline: 'Quiet staycation in Baguio',
    description: 'Published property belonging to a paused owner account for QA verification.',
    address_line: '12 Pine Cone Lane',
    barangay: 'Camp 7',
    city: 'Baguio City',
    province: 'Benguet',
    region: 'CAR',
    country: 'PH',
    latitude: null,
    longitude: null,
    map_url: null,
    checkin_time: '14:00',
    checkout_time: '12:00',
    arrival_info: null,
    cancellation_preset: 'moderate',
    cancellation_note: null,
    privacy_contact: 'owner.paused@demo.invalid',
    logo_file_id: null,
    status: 'published',
    published_at: createdAt,
    archived_at: null,
    rebook_min_days: 7,
    rebook_within_months: 6,
    guest_ids_required: false,
    guest_list_due_hours: 48,
    contact: {
      phone: '+63 917 000 0108',
      messenger: 'https://m.me/casasoriano.demo',
      facebook: null,
      instagram: null,
      tiktok: null,
      viber: '+639170000108',
      whatsapp: null,
      google_review_url: null,
    },
    show_exact_location: false,
    reply_hours: null,
    viewing_hours: null,
    created_at: createdAt,
    updated_at: createdAt,
  });

  const pausedDraft = {
    logo: null,
    tagline: 'Quiet staycation in Baguio',
    about: 'Paused owner sample page for contact-only verification.',
    look: {
      brandColor: '#2866EE',
      pageColor: '#F9FAFD',
      cardColor: '#FFFFFF',
      accentColor: '#7ED6AC',
      logoShape: 'rounded' as const,
      fontPair: 'malinaw' as const,
      banners: [],
      bannerSeconds: 5,
      announcement: null,
      sections: { about: true },
    },
    install: {
      homeScreenName: 'Casa Soriano',
      splashColor: '#F9FAFD',
      splashAnimation: true,
      showName: true,
      showTagline: true,
    },
    hero: { cover: null, photos: [] },
    host: { displayName: 'Grace Soriano', photoFile: null, languages: ['English', 'Tagalog'] },
    units: [],
    highlights: [],
    faq: [],
    seo: { title: null, description: null, sharePictureFile: null, hideFromSearch: true },
  };
  world.property_pages.push({
    property_id: pausedPropertyId,
    account_id: DEMO_IDS.people.extraAccounts.pausedAccount,
    draft: pausedDraft,
    published: pausedDraft,
    draft_rev: 1,
    version: 1,
    draft_updated_at: createdAt,
    published_at: createdAt,
    published_by: DEMO_IDS.people.owners.paused,
    created_at: createdAt,
    updated_at: createdAt,
  });

  const ulap = buildUlapSuitesBrand(today);
  const bahay = buildBahayBatisBrand(today);
  const ilaw = buildIlawResidencesBrand(today);
  const lorna = buildTitaLornaDormBrand(today);

  // Set min_nights = 2, max_nights = 14 on Studio Fog, and prep_nights = 1 on 1BR Taal View
  const studioTerms = ulap.stayTerms.find((t) => t.unit_id === DEMO_IDS.ulapSuites.units.studioFog);
  if (studioTerms) {
    const idx = ulap.stayTerms.indexOf(studioTerms);
    ulap.stayTerms[idx] = { ...studioTerms, min_nights: 2, max_nights: 14 };
  }
  const taalTerms = ulap.stayTerms.find((t) => t.unit_id === DEMO_IDS.ulapSuites.units.taalView1br);
  if (taalTerms) {
    const idx = ulap.stayTerms.indexOf(taalTerms);
    ulap.stayTerms[idx] = { ...taalTerms, prep_nights: 1 };
  }

  // Tita Lorna lease term above RA 9653 limits (2 months advance, 3 months deposit)
  const bed4Lease = lorna.leaseTerms.find(
    (t) => t.unit_id === DEMO_IDS.titaLornaDorm.units.room2aBed4,
  );
  if (bed4Lease) {
    const idx = lorna.leaseTerms.indexOf(bed4Lease);
    lorna.leaseTerms[idx] = {
      ...bed4Lease,
      advance_months: 2,
      deposit_months: 3,
    };
  }

  const ulapCustomers = buildAccountCustomers('51', ulap.account.id, createdAt);
  const bahayCustomers = buildAccountCustomers('52', bahay.account.id, createdAt);

  // Customize specific QA customers: blocked, anonymised, and 80-char emoji + ñ name
  const uc = { ...ulapCustomers.byKey };
  const blockedCust = uc.roelYbanez;
  if (blockedCust) {
    const idx = ulapCustomers.customers.indexOf(blockedCust);
    const updated = {
      ...blockedCust,
      status: 'blocked' as const,
      owner_note: 'Blocked after repeated unpaid holds.',
    };
    ulapCustomers.customers[idx] = updated;
    uc.roelYbanez = updated;
  }

  const anonCust = uc.erwinDumlao;
  if (anonCust) {
    const idx = ulapCustomers.customers.indexOf(anonCust);
    const updated = {
      ...anonCust,
      full_name: 'Anonymised Guest',
      email: 'anonymised.18@example.com',
      mobile: '00000000000',
      anonymised_at: manilaWallTime(addDays(today, -2), '12:00').toISOString(),
    };
    ulapCustomers.customers[idx] = updated;
    uc.erwinDumlao = updated;
  }

  const longNameCust = uc.danicaOcampo;
  if (longNameCust) {
    const idx = ulapCustomers.customers.indexOf(longNameCust);
    const updated = {
      ...longNameCust,
      full_name: QA_EIGHTY_CHAR_EMOJI_ENYE_NAME,
    };
    ulapCustomers.customers[idx] = updated;
    uc.danicaOcampo = updated;
  }

  world.customers.push(...ulapCustomers.customers, ...bahayCustomers.customers);
  world.customer_consents.push(...ulapCustomers.consents, ...bahayCustomers.consents);

  const mustUlapCust = (key: string) => {
    const c = uc[key];
    if (!c) {
      throw new Error(`Missing QA customer: ${key}`);
    }
    return c;
  };
  const mustBahayCust = (key: string) => {
    const c = bahayCustomers.byKey[key];
    if (!c) {
      throw new Error(`Missing QA Bahay customer: ${key}`);
    }
    return c;
  };

  const ulapStory = new AccountStoryBuilder(ulap, today, clock, '51');
  const studioFog = DEMO_IDS.ulapSuites.units.studioFog;
  const taalView = DEMO_IDS.ulapSuites.units.taalView1br;

  // 1. Completed stay with closed thread & 80-char emoji + ñ customer name
  ulapStory.stay({
    unitId: studioFog,
    customer: mustUlapCust('danicaOcampo'),
    checkInOffset: -20,
    nights: 2,
    adults: 2,
    status: 'completed',
    paid: 'full',
    threadStatus: 'closed',
    review: {
      stars: 5,
      note: 'Completed QA stay with closed thread.',
    },
  });

  // 2. Expired hold
  ulapStory.stay({
    unitId: studioFog,
    customer: mustUlapCust('carloMendoza'),
    checkInOffset: -10,
    nights: 2,
    adults: 2,
    status: 'expired',
    paid: 'none',
  });

  // 3. Cancelled booking
  ulapStory.stay({
    unitId: studioFog,
    customer: mustUlapCust('alyssaReyes'),
    checkInOffset: -6,
    nights: 2,
    adults: 2,
    status: 'cancelled',
    cancelledBy: 'customer',
    cancelReason: 'Flight rescheduled.',
    paid: 'none',
  });

  // 4. Checked-in today with overdue guest list (guestListSubmitted: false)
  ulapStory.stay({
    unitId: studioFog,
    customer: mustUlapCust('jerichoGarcia'),
    checkInOffset: 0,
    nights: 2,
    adults: 2,
    status: 'checked_in',
    paid: 'full',
    guestListSubmitted: false,
  });

  // 5 & 6. Back-to-back stays: +2 -> +4 and +4 -> +6 (stay ending on another's check-in day)
  ulapStory.stay({
    unitId: studioFog,
    customer: mustUlapCust('camilleTolentino'),
    checkInOffset: 2,
    nights: 2, // minimum nights = 2
    adults: 2,
    status: 'confirmed',
    paid: 'down',
  });
  ulapStory.stay({
    unitId: studioFog,
    customer: mustUlapCust('paoloEvangelista'),
    checkInOffset: 4,
    nights: 2,
    adults: 2,
    status: 'confirmed',
    paid: 'full',
  });

  // 7. Rejected proof then resent one with reused reference number ('QAREF777888')
  ulapStory.stay({
    unitId: studioFog,
    customer: mustUlapCust('cheskaMagbanua'),
    checkInOffset: 7,
    nights: 2,
    adults: 2,
    status: 'in_review',
    paid: 'down',
    paymentScenario: 'rejected_then_resent',
    referenceOverride: 'QAREF777888',
  });

  // 8. Maximum 14-night stay (+10 -> +24) with reversed payment then replacement
  ulapStory.stay({
    unitId: studioFog,
    customer: mustUlapCust('vinceCanete'),
    checkInOffset: 10,
    nights: 14, // max_nights = 14
    adults: 2,
    status: 'confirmed',
    paid: 'down',
    paymentScenario: 'approved_then_reversed',
  });

  // 9 & 10. Customer at the 2-hold limit (maricelOuano holds two unpaid bookings)
  ulapStory.stay({
    unitId: studioFog,
    customer: mustUlapCust('maricelOuano'),
    checkInOffset: 25,
    nights: 2,
    adults: 2,
    status: 'held',
    paid: 'none',
  });
  ulapStory.stay({
    unitId: studioFog,
    customer: mustUlapCust('maricelOuano'),
    checkInOffset: 28,
    nights: 2,
    adults: 2,
    status: 'held',
    paid: 'none',
  });

  // 11. 1BR Taal View with prep_nights = 1 and guest list due soon (check-in +1, guestListSubmitted: false)
  ulapStory.stay({
    unitId: taalView,
    customer: mustUlapCust('beaSantos'),
    checkInOffset: 1,
    nights: 2, // occupies [+1, +4) because prep_nights = 1
    adults: 4,
    status: 'confirmed',
    paid: 'full',
    guestListSubmitted: false,
    hideLastMessage: true,
  });

  // 12. Next stay on 1BR Taal View starting at +4 (after prep_nights buffer)
  ulapStory.stay({
    unitId: taalView,
    customer: mustUlapCust('rinaAgbayani'),
    checkInOffset: 4,
    nights: 3,
    adults: 4,
    status: 'confirmed',
    paid: 'down',
  });

  // 13. Owner block on 1BR Taal View (+10 -> +12)
  ulapStory.addOwnerBlock({
    unitId: taalView,
    startOffset: 10,
    nights: 2,
    note: 'Aircon preventive maintenance',
  });

  // Bahay Batis manual booking + cash payment
  const bahayStory = new AccountStoryBuilder(bahay, today, clock, '52');
  bahayStory.stay({
    unitId: DEMO_IDS.bahayBatis.units.buongBahay,
    customer: mustBahayCust('kevinLim'),
    checkInOffset: 2,
    nights: 2,
    adults: 16,
    status: 'confirmed',
    source: 'manual',
    sourceNote: 'Walk-in corporate team building',
    paid: 'down_plus_cash_balance',
  });

  appendBrandToWorld(world, ulap, ulapStory.build());
  appendBrandToWorld(world, bahay, bahayStory.build());
  appendBrandToWorld(world, ilaw);
  appendBrandToWorld(world, lorna);

  return world;
}
