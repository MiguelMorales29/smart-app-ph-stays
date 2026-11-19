import { centavos } from '../../money/index.js';
import type {
  PropertyPageDraft,
  UnitAmenitiesRow,
  UnitLeaseTermsRow,
  UnitsRow,
} from '../../schemas/tables/index.js';
import { addDays, manilaWallTime } from '../../time/index.js';
import type { CalendarDate } from '../../time/index.js';
import { DEMO_IDS, makeDemoUuid } from '../ids.js';
import { buildBrandMediaFromManifest } from './shared.js';
import type { BrandBundle } from './shared.js';

export function buildTitaLornaDormBrand(today: CalendarDate): BrandBundle {
  const groupHex = '40';
  const createdAt = manilaWallTime(addDays(today, -60), '09:00').toISOString();
  const ids = DEMO_IDS.titaLornaDorm;
  const ownerId = DEMO_IDS.people.owners.titaLornaDorm;

  const room2aIds = [
    ids.units.room2aBed1,
    ids.units.room2aBed2,
    ids.units.room2aBed3,
    ids.units.room2aBed4,
  ] as const;

  const room3bIds = [
    ids.units.room3bBed1,
    ids.units.room3bBed2,
    ids.units.room3bBed3,
    ids.units.room3bBed4,
    ids.units.room3bBed5,
    ids.units.room3bBed6,
  ] as const;

  const media = buildBrandMediaFromManifest({
    brandSlug: 'tita-lorna-dorm',
    groupHex,
    accountId: ids.account,
    ownerProfileId: ownerId,
    propertyId: ids.property,
    logoFileId: ids.logoFile,
    subscriptionProofFileId: ids.subscriptionProofFile,
    subscriptionPaymentId: ids.subscriptionPayment,
    unitPrefixMap: {
      'room-2a-ladies': room2aIds,
      'room-3b-gents': room3bIds,
    },
    createdAt,
  });

  const draft: PropertyPageDraft = {
    logo: ids.logoFile,
    tagline: 'Study hard. Tita has the rest.',
    about:
      'Safe, all-in student bed spaces in Sampaloc, Manila — five minutes to University Belt campuses. Biometric gate, 24/7 air-conditioned study hall, common kitchen, and rooftop laundry.',
    look: {
      brandColor: '#BF4700',
      pageColor: '#FFF9F3',
      cardColor: '#FFE7DE',
      accentColor: '#2F6AE0',
      logoShape: 'rounded',
      fontPair: 'homey',
      banners: media.banners,
      bannerSeconds: 5,
      announcement: {
        text: 'Second-semester bed spaces open for Room 2A (ladies) and Room 3B (gents) — all-in water, Wi-Fi, and night air-con.',
        tone: 'warning',
        endDate: null,
      },
      sections: {
        banners: true,
        about: true,
        units: true,
        highlights: true,
        rules: true,
        location: true,
        faq: true,
      },
    },
    install: {
      homeScreenName: 'Tita Lorna',
      splashColor: '#E45705',
      splashAnimation: true,
      showName: true,
      showTagline: true,
    },
    hero: {
      cover: media.heroPhotoFileIds[0] ?? null,
      photos: media.heroPhotoFileIds.slice(0, 5),
    },
    host: {
      displayName: 'Lorna Macaraeg',
      photoFile: null,
      languages: ['Tagalog', 'English'],
    },
    units: [ids.units.room2aBed1, ids.units.room2aBed2, ids.units.room3bBed1, ids.units.room3bBed2],
    highlights: [
      DEMO_IDS.amenities.wifi,
      DEMO_IDS.amenities.aircon,
      DEMO_IDS.amenities.studyHall,
      DEMO_IDS.amenities.keycardCctv,
      DEMO_IDS.amenities.lockers,
      DEMO_IDS.amenities.rooftopLaundry,
    ],
    faq: [
      {
        question: 'What is included in the all-in monthly rate?',
        answer:
          'Water, fiber Wi-Fi, evening-to-morning air-conditioning, study hall power, and use of the common kitchen.',
      },
      {
        question: 'Is there a curfew?',
        answer:
          'Residents have 24/7 biometric access for late review classes; visitors are allowed in the ground-floor lounge until 8:00 pm.',
      },
    ],
    seo: {
      title: "Tita Lorna's Dorm Sampaloc · All-In Student Bed Spaces",
      description:
        'Safe student dorm near University Belt in Sampaloc, Manila. Ladies and gents air-con rooms with 24/7 study hall.',
      sharePictureFile: media.heroPhotoFileIds[0] ?? null,
      hideFromSearch: false,
    },
  };

  const units: UnitsRow[] = [];
  const leaseTerms: UnitLeaseTermsRow[] = [];
  const unitAmenities: UnitAmenitiesRow[] = [];

  const dormAmenityIds = [
    DEMO_IDS.amenities.wifi,
    DEMO_IDS.amenities.aircon,
    DEMO_IDS.amenities.waterHeater,
    DEMO_IDS.amenities.workDesk,
    DEMO_IDS.amenities.fullKitchen,
    DEMO_IDS.amenities.studyHall,
    DEMO_IDS.amenities.keycardCctv,
    DEMO_IDS.amenities.lockers,
    DEMO_IDS.amenities.rooftopLaundry,
  ];

  room2aIds.forEach((unitId, idx) => {
    const bedNum = idx + 1;
    units.push({
      id: unitId,
      account_id: ids.account,
      property_id: ids.property,
      slug: `room-2a-bed-${bedNum}`,
      name: `Room 2A · Bed ${bedNum}`,
      mode: 'long_term',
      unit_type: 'bed_space',
      group_label: 'Room 2A',
      description: `Ladies air-conditioned 4-bed room (Bed ${bedNum}) with privacy curtain, reading lamp, charging outlet, personal numbered locker, and study desk.`,
      max_guests: 1,
      bedrooms: 1,
      beds: 1,
      bathrooms: 2,
      floor_area_sqm: 18,
      arrival_info: `2nd Floor Ladies Wing, Room 2A, Bed ${bedNum} & Locker #2A-${bedNum}.`,
      sort_order: idx,
      status: 'listed',
      archived_at: null,
      created_at: createdAt,
      updated_at: createdAt,
    });

    leaseTerms.push({
      unit_id: unitId,
      account_id: ids.account,
      monthly_rent_centavos: centavos(480000),
      min_lease_months: 6,
      advance_months: 1,
      deposit_months: 1,
      reservation_fee_centavos: centavos(0),
      available_from: addDays(today, 3),
      inclusions:
        'All-in water, fiber Wi-Fi, night air-con (8 pm to 6 am), 24/7 study hall, and common kitchen.',
      created_at: createdAt,
      updated_at: createdAt,
    });

    for (const amenityId of dormAmenityIds) {
      unitAmenities.push({
        account_id: ids.account,
        unit_id: unitId,
        amenity_id: amenityId,
        created_at: createdAt,
      });
    }
  });

  room3bIds.forEach((unitId, idx) => {
    const bedNum = idx + 1;
    units.push({
      id: unitId,
      account_id: ids.account,
      property_id: ids.property,
      slug: `room-3b-bed-${bedNum}`,
      name: `Room 3B · Bed ${bedNum}`,
      mode: 'long_term',
      unit_type: 'bed_space',
      group_label: 'Room 3B',
      description: `Gents air-conditioned 6-bed room (Bed ${bedNum}) with reading light, clip-on fan, charging outlet, personal locker, and row of study desks.`,
      max_guests: 1,
      bedrooms: 1,
      beds: 1,
      bathrooms: 2,
      floor_area_sqm: 24,
      arrival_info: `3rd Floor Gents Wing, Room 3B, Bed ${bedNum} & Locker #3B-${bedNum}.`,
      sort_order: room2aIds.length + idx,
      status: 'listed',
      archived_at: null,
      created_at: createdAt,
      updated_at: createdAt,
    });

    leaseTerms.push({
      unit_id: unitId,
      account_id: ids.account,
      monthly_rent_centavos: centavos(420000),
      min_lease_months: 6,
      advance_months: 1,
      deposit_months: 1,
      reservation_fee_centavos: centavos(0),
      available_from: addDays(today, 3),
      inclusions:
        'All-in water, fiber Wi-Fi, night air-con (8 pm to 6 am), 24/7 study hall, and common kitchen.',
      created_at: createdAt,
      updated_at: createdAt,
    });

    for (const amenityId of dormAmenityIds) {
      unitAmenities.push({
        account_id: ids.account,
        unit_id: unitId,
        amenity_id: amenityId,
        created_at: createdAt,
      });
    }
  });

  return {
    slug: 'tita-lorna-dorm',
    groupHex,
    account: {
      id: ids.account,
      name: "Tita Lorna's Dorm",
      status: 'active',
      is_demo: true,
      contact_email: 'owner.tita-lorna-dorm@demo.invalid',
      contact_mobile: '09170000104',
      notify_email: 'owner.tita-lorna-dorm@demo.invalid',
      timezone: 'Asia/Manila',
      currency: 'PHP',
      approved_at: createdAt,
      approved_by: DEMO_IDS.platform.superAdminProfile,
      verified_at: createdAt,
      verified_by: DEMO_IDS.platform.superAdminProfile,
      verification_note: 'DEMO · Verified sample student dormitory in Sampaloc, Manila',
      created_at: createdAt,
      updated_at: createdAt,
    },
    member: {
      id: ids.member,
      account_id: ids.account,
      profile_id: ownerId,
      role: 'owner',
      status: 'active',
      notify: {
        new_booking: true,
        payment_to_check: true,
        storage_80: true,
        storage_full: true,
        plan_due: true,
        send_to: null,
      },
      created_at: createdAt,
      updated_at: createdAt,
    },
    application: {
      id: ids.application,
      account_id: ids.account,
      rents: 'bed_spaces',
      unit_count_band: '6_20',
      property_count_band: '1',
      city: 'Manila',
      facebook_page: 'https://facebook.com/titalornadorm.demo',
      sign_up_method: 'password',
      created_at: createdAt,
      updated_at: createdAt,
    },
    subscription: {
      id: ids.subscription,
      account_id: ids.account,
      plan_id: DEMO_IDS.platform.standardPlan,
      status: 'active',
      trial_ends_on: addDays(today, -46),
      paid_through: addDays(today, 18),
      extra_units: 5,
      paused_at: null,
      created_at: createdAt,
      updated_at: createdAt,
    },
    subscriptionPayment: {
      id: ids.subscriptionPayment,
      account_id: ids.account,
      subscription_id: ids.subscription,
      months: 1,
      amount_centavos: centavos(109900),
      method: 'gcash',
      reference_no: 'LORNAPLAN001',
      proof_file_id: ids.subscriptionProofFile,
      status: 'approved',
      reviewed_by: DEMO_IDS.platform.superAdminProfile,
      reviewed_at: manilaWallTime(addDays(today, -12), '09:30').toISOString(),
      reject_reason: null,
      covers_from: addDays(today, -12),
      covers_to: addDays(today, 18),
      created_at: createdAt,
      updated_at: createdAt,
    },
    property: {
      id: ids.property,
      account_id: ids.account,
      slug: 'tita-lorna-dorm',
      old_slugs: [],
      name: "Tita Lorna's Dorm",
      tagline: 'Study hard. Tita has the rest.',
      description:
        'All-in student bed spaces in Sampaloc, Manila with biometric entry, 24/7 study hall, air-con rooms, and home-style common kitchen.',
      address_line: '1142 P. Noval corner Dapitan Street',
      barangay: 'Barangay 470',
      city: 'Manila',
      province: 'Metro Manila',
      region: 'NCR',
      country: 'PH',
      latitude: 14.6112,
      longitude: 120.9895,
      map_url: 'https://maps.google.com/?q=14.6112,120.9895',
      checkin_time: '14:00',
      checkout_time: '12:00',
      arrival_info:
        'Blue metal gate beside the corner sari-sari store on P. Noval. Look for Ate Lorna at the logbook desk.',
      cancellation_preset: 'moderate',
      cancellation_note: null,
      privacy_contact: 'owner.tita-lorna-dorm@demo.invalid',
      logo_file_id: ids.logoFile,
      status: 'published',
      published_at: createdAt,
      archived_at: null,
      rebook_min_days: 7,
      rebook_within_months: 6,
      guest_ids_required: false,
      guest_list_due_hours: 48,
      contact: {
        phone: '+63 917 000 0104',
        messenger: 'https://m.me/titalornadorm.demo',
        facebook: 'https://facebook.com/titalornadorm.demo',
        instagram: null,
        tiktok: null,
        viber: '+639170000104',
        whatsapp: null,
        google_review_url: null,
      },
      show_exact_location: false,
      reply_hours: null,
      viewing_hours: null,
      created_at: createdAt,
      updated_at: createdAt,
    },
    propertyPage: {
      property_id: ids.property,
      account_id: ids.account,
      draft,
      published: draft,
      draft_rev: 1,
      version: 1,
      draft_updated_at: createdAt,
      published_at: createdAt,
      published_by: ownerId,
      created_at: createdAt,
      updated_at: createdAt,
    },
    units,
    stayTerms: [],
    leaseTerms,
    weekdayRates: [],
    rateOverrides: [],
    unitFees: [],
    unitAmenities,
    houseRules: [
      {
        id: makeDemoUuid(groupHex, '0008', 1),
        account_id: ids.account,
        property_id: ids.property,
        body: 'Visitors are welcome in the ground-floor lounge only until 8:00 pm; no opposite-gender visitors on bedroom floors.',
        sort_order: 0,
        created_at: createdAt,
        updated_at: createdAt,
      },
      {
        id: makeDemoUuid(groupHex, '0008', 2),
        account_id: ids.account,
        property_id: ids.property,
        body: 'Keep study hall desks quiet and label your food containers in the shared kitchen fridge.',
        sort_order: 1,
        created_at: createdAt,
        updated_at: createdAt,
      },
    ],
    paymentAccounts: [
      {
        id: ids.paymentAccounts.gcash,
        account_id: ids.account,
        method: 'gcash',
        bank: null,
        bank_name: null,
        account_name: 'SAMPLE · Lorna Macaraeg',
        account_number: '0917 000 0000',
        qr_file_id: null,
        instructions:
          'Send monthly rent via GCash and upload the receipt screenshot for your stamp.',
        is_active: true,
        is_sample: true,
        sort_order: 0,
        created_at: createdAt,
        updated_at: createdAt,
      },
      {
        id: ids.paymentAccounts.bdo,
        account_id: ids.account,
        method: 'bank',
        bank: 'bdo',
        bank_name: null,
        account_name: "SAMPLE · Tita Lorna's Dorm",
        account_number: '0000 0000 0000',
        qr_file_id: null,
        instructions: 'BDO savings transfer; include your room and bed number.',
        is_active: true,
        is_sample: true,
        sort_order: 1,
        created_at: createdAt,
        updated_at: createdAt,
      },
    ],
    savedReplies: [],
    files: media.files,
    listingPhotos: media.listingPhotos,
  };
}
