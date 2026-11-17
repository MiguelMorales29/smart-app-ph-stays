import { describe, expect, it } from 'vitest';

import {
  amenitiesRow,
  houseRulesRow,
  listingPhotosRow,
  paymentAccountsRow,
  propertiesRow,
  propertyPagesRow,
  unitAmenitiesRow,
  unitLeaseTermsRow,
  unitStayTermsRow,
  unitsRow,
} from './listing.js';

const id1 = 'dec0de00-0000-4000-8000-000000000001';
const id2 = 'dec0de00-0000-4000-8000-000000000002';
const id3 = 'dec0de00-0000-4000-8000-000000000003';
const ts = '2026-12-10T10:00:00+08:00';

describe('listing table schemas', () => {
  it('validates propertiesRow and rejects 3 broken rows', () => {
    const valid = {
      id: id1,
      account_id: id2,
      slug: 'bahay-batis',
      old_slugs: [],
      name: 'Bahay Batis Pansol',
      tagline: 'Private hot spring villa',
      description: 'Warm spring pool in Pansol, Calamba.',
      address_line: '12 Batis Road',
      barangay: 'Pansol',
      city: 'Calamba',
      province: 'Laguna',
      region: 'CALABARZON',
      country: 'PH',
      latitude: 14.1785,
      longitude: 121.1862,
      map_url: null,
      checkin_time: '14:00',
      checkout_time: '12:00',
      arrival_info: 'Gate code 1234',
      cancellation_preset: 'dp_rebook',
      cancellation_note: null,
      privacy_contact: 'privacy@bahaybatis.ph',
      logo_file_id: id3,
      status: 'published',
      published_at: ts,
      archived_at: null,
      rebook_min_days: 7,
      rebook_within_months: 6,
      guest_ids_required: false,
      guest_list_due_hours: 48,
      contact: {
        phone: '+639171234567',
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
      created_at: ts,
      updated_at: ts,
    };
    expect(propertiesRow.safeParse(valid).success).toBe(true);
    expect(propertiesRow.safeParse({ ...valid, slug: 'demo-media' }).success).toBe(false);
    expect(propertiesRow.safeParse({ ...valid, latitude: 14.1785, longitude: null }).success).toBe(
      false,
    );
    expect(
      propertiesRow.safeParse({
        ...valid,
        cancellation_preset: 'custom',
        cancellation_note: null,
      }).success,
    ).toBe(false);
  });

  it('validates propertyPagesRow and rejects 3 broken rows', () => {
    const draft = {
      logo: id3,
      tagline: 'Hot spring villa',
      about: 'Family resort in Pansol',
      look: {
        brandColor: '#008481',
        pageColor: '#FEF9F1',
        cardColor: '#D5F4F2',
        accentColor: '#FA776B',
        logoShape: 'rounded',
        fontPair: 'bold',
        banners: [],
        bannerSeconds: 5,
        announcement: null,
        sections: { faq: true },
      },
      install: {
        homeScreenName: 'Bahay Batis',
        splashColor: '#008481',
        splashAnimation: true,
        showName: true,
        showTagline: true,
      },
      hero: { cover: id3, photos: [id3] },
      host: { displayName: 'Jun Mercado', photoFile: null, languages: ['Tagalog', 'English'] },
      units: [id1],
      highlights: [id2],
      faq: [{ question: 'Is parking free?', answer: 'Yes, up to 3 cars.' }],
      seo: {
        title: 'Bahay Batis',
        description: 'Private villa',
        sharePictureFile: null,
        hideFromSearch: false,
      },
    };
    const valid = {
      property_id: id1,
      account_id: id2,
      draft,
      published: draft,
      draft_rev: 1,
      version: 1,
      draft_updated_at: ts,
      published_at: ts,
      published_by: id3,
      created_at: ts,
      updated_at: ts,
    };
    expect(propertyPagesRow.safeParse(valid).success).toBe(true);
    expect(propertyPagesRow.safeParse({ ...valid, draft_rev: -1 }).success).toBe(false);
    expect(
      propertyPagesRow.safeParse({
        ...valid,
        draft: { ...draft, look: { ...draft.look, bannerSeconds: 2 } },
      }).success,
    ).toBe(false);
    expect(
      propertyPagesRow.safeParse({
        ...valid,
        draft: { ...draft, install: { ...draft.install, homeScreenName: 'TooLongHomeName' } },
      }).success,
    ).toBe(false);
  });

  it('validates unitsRow, unitStayTermsRow and unitLeaseTermsRow and rejects 3 broken rows each', () => {
    const unit = {
      id: id1,
      account_id: id2,
      property_id: id3,
      slug: 'buong-bahay',
      name: 'Buong Bahay Villa',
      mode: 'short_stay',
      unit_type: 'entire_place',
      description: '4 bedrooms with private pool',
      max_guests: 15,
      bedrooms: 4,
      beds: 8,
      bathrooms: 3.5,
      floor_area_sqm: 180,
      arrival_info: null,
      sort_order: 0,
      status: 'listed',
      archived_at: null,
      created_at: ts,
      updated_at: ts,
    };
    expect(unitsRow.safeParse(unit).success).toBe(true);
    expect(unitsRow.safeParse({ ...unit, max_guests: 0 }).success).toBe(false);
    expect(unitsRow.safeParse({ ...unit, bathrooms: 1.25 }).success).toBe(false);
    expect(unitsRow.safeParse({ ...unit, slug: 'a'.repeat(41) }).success).toBe(false);

    const stayTerms = {
      unit_id: id1,
      account_id: id2,
      base_nightly_centavos: 1200000,
      base_guests: 10,
      min_nights: 1,
      max_nights: 14,
      prep_nights: 0,
      weekly_discount_percent: 10,
      monthly_discount_percent: 25,
      down_payment_percent: 50,
      hold_minutes: 60,
      advance_notice_days: 1,
      booking_window_days: 365,
      created_at: ts,
      updated_at: ts,
    };
    expect(unitStayTermsRow.safeParse(stayTerms).success).toBe(true);
    expect(
      unitStayTermsRow.safeParse({ ...stayTerms, min_nights: 10, max_nights: 5 }).success,
    ).toBe(false);
    expect(unitStayTermsRow.safeParse({ ...stayTerms, down_payment_percent: 5 }).success).toBe(
      false,
    );
    expect(unitStayTermsRow.safeParse({ ...stayTerms, prep_nights: 3 }).success).toBe(false);

    const leaseTerms = {
      unit_id: id1,
      account_id: id2,
      monthly_rent_centavos: 850000,
      min_lease_months: 6,
      advance_months: 1,
      deposit_months: 2,
      reservation_fee_centavos: 200000,
      available_from: '2026-12-15',
      inclusions: 'Water and Wi-Fi included',
      created_at: ts,
      updated_at: ts,
    };
    expect(unitLeaseTermsRow.safeParse(leaseTerms).success).toBe(true);
    expect(unitLeaseTermsRow.safeParse({ ...leaseTerms, monthly_rent_centavos: 0 }).success).toBe(
      false,
    );
    expect(unitLeaseTermsRow.safeParse({ ...leaseTerms, min_lease_months: 0 }).success).toBe(false);
    expect(
      unitLeaseTermsRow.safeParse({ ...leaseTerms, available_from: '2026-02-30' }).success,
    ).toBe(false);
  });

  it('validates listingPhotosRow, amenitiesRow, unitAmenitiesRow, houseRulesRow and paymentAccountsRow', () => {
    const photo = {
      id: id1,
      account_id: id2,
      property_id: id3,
      unit_id: id1,
      file_id: id2,
      alt_text: 'Pool view at dusk',
      sort_order: 0,
      created_at: ts,
      updated_at: ts,
    };
    expect(listingPhotosRow.safeParse(photo).success).toBe(true);
    expect(listingPhotosRow.safeParse({ ...photo, alt_text: '' }).success).toBe(false);
    expect(listingPhotosRow.safeParse({ ...photo, alt_text: 'x'.repeat(161) }).success).toBe(false);
    expect(listingPhotosRow.safeParse({ ...photo, sort_order: -1 }).success).toBe(false);

    const amenity = {
      id: id1,
      account_id: null,
      code: 'wifi',
      label: 'Fast Wi-Fi',
      icon: 'wifi',
      grp: 'essentials',
      sort_order: 0,
      is_active: true,
      created_at: ts,
      updated_at: ts,
    };
    expect(amenitiesRow.safeParse(amenity).success).toBe(true);
    expect(amenitiesRow.safeParse({ ...amenity, grp: 'luxury' }).success).toBe(false);
    expect(amenitiesRow.safeParse({ ...amenity, code: '' }).success).toBe(false);
    expect(amenitiesRow.safeParse({ ...amenity, label: '' }).success).toBe(false);

    const unitAmenity = {
      account_id: id1,
      unit_id: id2,
      amenity_id: id3,
      created_at: ts,
    };
    expect(unitAmenitiesRow.safeParse(unitAmenity).success).toBe(true);
    expect(unitAmenitiesRow.safeParse({ ...unitAmenity, account_id: 'bad' }).success).toBe(false);
    expect(unitAmenitiesRow.safeParse({ ...unitAmenity, unit_id: 'bad' }).success).toBe(false);
    expect(unitAmenitiesRow.safeParse({ ...unitAmenity, created_at: 'bad' }).success).toBe(false);

    const rule = {
      id: id1,
      account_id: id2,
      property_id: id3,
      body: 'Quiet hours start at 10 pm.',
      sort_order: 0,
      created_at: ts,
      updated_at: ts,
    };
    expect(houseRulesRow.safeParse(rule).success).toBe(true);
    expect(houseRulesRow.safeParse({ ...rule, body: '' }).success).toBe(false);
    expect(houseRulesRow.safeParse({ ...rule, body: 'x'.repeat(201) }).success).toBe(false);
    expect(houseRulesRow.safeParse({ ...rule, sort_order: -1 }).success).toBe(false);

    const payAcct = {
      id: id1,
      account_id: id2,
      method: 'bank',
      bank: 'bpi',
      bank_name: null,
      account_name: 'Maria Santos',
      account_number: '1234567890',
      qr_file_id: null,
      instructions: 'Send screenshot after transfer',
      is_active: true,
      is_sample: true,
      sort_order: 0,
      created_at: ts,
      updated_at: ts,
    };
    expect(paymentAccountsRow.safeParse(payAcct).success).toBe(true);
    expect(paymentAccountsRow.safeParse({ ...payAcct, bank: null }).success).toBe(false);
    expect(paymentAccountsRow.safeParse({ ...payAcct, method: 'gcash', bank: 'bpi' }).success).toBe(
      false,
    );
    expect(
      paymentAccountsRow.safeParse({ ...payAcct, bank: 'other', bank_name: null }).success,
    ).toBe(false);
  });
});
