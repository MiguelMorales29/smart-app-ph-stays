import { centavos } from '../../money/index.js';
import type {
  AccountCountersRow,
  AccountFeaturesRow,
  AccountMembersRow,
  AccountsRow,
  AmenitiesRow,
  AuditLogsRow,
  BookingEventsRow,
  BookingGuestsRow,
  BookingLinesRow,
  BookingsRow,
  CustomerConsentsRow,
  CustomersRow,
  DataExportsRow,
  FeatureFlagsRow,
  FilesRow,
  HouseRulesRow,
  IdempotencyKeysRow,
  JobRunsRow,
  ListingPhotosRow,
  MessagesRow,
  MetaAttributionRow,
  MetaCapiDeliveriesRow,
  MetaEventSwitchesRow,
  MetaPixelsRow,
  NotificationsOutboxRow,
  PageReportsRow,
  PaymentAccountsRow,
  PaymentProofsRow,
  PaymentsRow,
  PlansRow,
  PlatformAdminsRow,
  ProfilesRow,
  PropertiesRow,
  PropertyPagesRow,
  PushSubscriptionsRow,
  RateOverridesRow,
  SavedRepliesRow,
  StayReviewsRow,
  SubscriptionPaymentsRow,
  SubscriptionsRow,
  ThreadsRow,
  UnitAmenitiesRow,
  UnitFeesRow,
  UnitLeaseTermsRow,
  UnitOccupancyRow,
  UnitStayTermsRow,
  UnitsRow,
  WeekdayRatesRow,
} from '../../schemas/tables/index.js';
import { addDays, manilaWallTime } from '../../time/index.js';
import type { CalendarDate } from '../../time/index.js';
import type { BrandBundle } from '../brands/shared.js';
import { DEMO_IDS } from '../ids.js';
import { buildPlatformAmenities } from '../manifest.js';
import { buildBaseProfiles } from '../people.js';
import type { AccountStoryData } from '../story.js';

export interface DemoWorld {
  readonly profiles: ProfilesRow[];
  readonly platform_admins: PlatformAdminsRow[];
  readonly plans: PlansRow[];
  readonly feature_flags: FeatureFlagsRow[];
  readonly accounts: AccountsRow[];
  readonly account_members: AccountMembersRow[];
  readonly subscriptions: SubscriptionsRow[];
  readonly account_features: AccountFeaturesRow[];
  readonly account_counters: AccountCountersRow[];
  readonly idempotency_keys: IdempotencyKeysRow[];
  readonly audit_logs: AuditLogsRow[];
  readonly job_runs: JobRunsRow[];
  readonly files: FilesRow[];
  readonly subscription_payments: SubscriptionPaymentsRow[];
  readonly data_exports: DataExportsRow[];
  readonly properties: PropertiesRow[];
  readonly property_pages: PropertyPagesRow[];
  readonly units: UnitsRow[];
  readonly unit_stay_terms: UnitStayTermsRow[];
  readonly unit_lease_terms: UnitLeaseTermsRow[];
  readonly listing_photos: ListingPhotosRow[];
  readonly amenities: AmenitiesRow[];
  readonly unit_amenities: UnitAmenitiesRow[];
  readonly house_rules: HouseRulesRow[];
  readonly payment_accounts: PaymentAccountsRow[];
  readonly page_reports: PageReportsRow[];
  readonly weekday_rates: WeekdayRatesRow[];
  readonly rate_overrides: RateOverridesRow[];
  readonly unit_fees: UnitFeesRow[];
  readonly customers: CustomersRow[];
  readonly customer_consents: CustomerConsentsRow[];
  readonly unit_occupancy: UnitOccupancyRow[];
  readonly bookings: BookingsRow[];
  readonly booking_lines: BookingLinesRow[];
  readonly booking_events: BookingEventsRow[];
  readonly booking_guests: BookingGuestsRow[];
  readonly stay_reviews: StayReviewsRow[];
  readonly payments: PaymentsRow[];
  readonly payment_proofs: PaymentProofsRow[];
  readonly threads: ThreadsRow[];
  readonly messages: MessagesRow[];
  readonly saved_replies: SavedRepliesRow[];
  readonly push_subscriptions: PushSubscriptionsRow[];
  readonly notifications_outbox: NotificationsOutboxRow[];
  readonly meta_pixels: MetaPixelsRow[];
  readonly meta_event_switches: MetaEventSwitchesRow[];
  readonly meta_attribution: MetaAttributionRow[];
  readonly meta_capi_deliveries: MetaCapiDeliveriesRow[];
}

export function createEmptyDemoWorld(): DemoWorld {
  return {
    profiles: [],
    platform_admins: [],
    plans: [],
    feature_flags: [],
    accounts: [],
    account_members: [],
    subscriptions: [],
    account_features: [],
    account_counters: [],
    idempotency_keys: [],
    audit_logs: [],
    job_runs: [],
    files: [],
    subscription_payments: [],
    data_exports: [],
    properties: [],
    property_pages: [],
    units: [],
    unit_stay_terms: [],
    unit_lease_terms: [],
    listing_photos: [],
    amenities: [],
    unit_amenities: [],
    house_rules: [],
    payment_accounts: [],
    page_reports: [],
    weekday_rates: [],
    rate_overrides: [],
    unit_fees: [],
    customers: [],
    customer_consents: [],
    unit_occupancy: [],
    bookings: [],
    booking_lines: [],
    booking_events: [],
    booking_guests: [],
    stay_reviews: [],
    payments: [],
    payment_proofs: [],
    threads: [],
    messages: [],
    saved_replies: [],
    push_subscriptions: [],
    notifications_outbox: [],
    meta_pixels: [],
    meta_event_switches: [],
    meta_attribution: [],
    meta_capi_deliveries: [],
  };
}

export function seedPlatformBase(world: DemoWorld, today: CalendarDate): void {
  const createdAt = manilaWallTime(addDays(today, -90), '08:00').toISOString();
  const baseProfiles = buildBaseProfiles(createdAt);

  world.profiles.push(baseProfiles.superAdminProfile, baseProfiles.memberBeaProfile);
  world.platform_admins.push(baseProfiles.platformAdmin);

  world.plans.push({
    id: DEMO_IDS.platform.standardPlan,
    code: 'standard',
    name: 'Standard Plan',
    price_centavos: centavos(59900),
    included_units: 5,
    extra_unit_centavos: centavos(10000),
    storage_bytes: 2_147_483_648,
    trial_days: 14,
    is_active: true,
    created_at: createdAt,
    updated_at: createdAt,
  });

  world.feature_flags.push(
    {
      key: 'loyalty',
      description: 'Stamp and point cards for repeat guests and tenants',
      default_enabled: false,
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      key: 'calendar_sync',
      description: 'iCal export and import for external channels',
      default_enabled: false,
      created_at: createdAt,
      updated_at: createdAt,
    },
  );

  world.amenities.push(...buildPlatformAmenities(createdAt));

  world.meta_pixels.push({
    id: DEMO_IDS.platform.metaPixel,
    scope: 'platform',
    account_id: null,
    property_id: null,
    pixel_id: '102938475610293',
    status: 'off',
    test_event_code: null,
    api_version: 'v27.0',
    created_at: createdAt,
    updated_at: createdAt,
    updated_by: DEMO_IDS.platform.superAdminProfile,
  });

  world.meta_event_switches.push(
    {
      pixel_ref: DEMO_IDS.platform.metaPixel,
      event_name: 'PageView',
      browser_enabled: true,
      server_enabled: false,
      updated_at: createdAt,
    },
    {
      pixel_ref: DEMO_IDS.platform.metaPixel,
      event_name: 'ViewContent',
      browser_enabled: true,
      server_enabled: false,
      updated_at: createdAt,
    },
    {
      pixel_ref: DEMO_IDS.platform.metaPixel,
      event_name: 'CompleteRegistration',
      browser_enabled: true,
      server_enabled: true,
      updated_at: createdAt,
    },
    {
      pixel_ref: DEMO_IDS.platform.metaPixel,
      event_name: 'StartTrial',
      browser_enabled: false,
      server_enabled: true,
      updated_at: createdAt,
    },
    {
      pixel_ref: DEMO_IDS.platform.metaPixel,
      event_name: 'Purchase',
      browser_enabled: false,
      server_enabled: true,
      updated_at: createdAt,
    },
  );

  const jobTime = manilaWallTime(today, '06:00').toISOString();
  world.job_runs.push(
    {
      id: DEMO_IDS.platform.jobRuns.sendOutbox,
      job: 'send_outbox',
      started_at: jobTime,
      finished_at: jobTime,
      status: 'ok',
      rows_affected: 4,
      error: null,
      created_at: jobTime,
    },
    {
      id: DEMO_IDS.platform.jobRuns.expireHolds,
      job: 'expire_holds',
      started_at: jobTime,
      finished_at: jobTime,
      status: 'ok',
      rows_affected: 1,
      error: null,
      created_at: jobTime,
    },
  );
}

export function appendBrandToWorld(
  world: DemoWorld,
  brand: BrandBundle,
  storyData?: AccountStoryData,
): void {
  world.accounts.push(brand.account);
  world.account_members.push(brand.member);
  world.subscriptions.push(brand.subscription);
  world.files.push(...brand.files);
  world.subscription_payments.push(brand.subscriptionPayment);
  world.properties.push(brand.property);
  world.property_pages.push(brand.propertyPage);
  world.units.push(...brand.units);
  world.unit_stay_terms.push(...brand.stayTerms);
  world.unit_lease_terms.push(...brand.leaseTerms);
  world.listing_photos.push(...brand.listingPhotos);
  world.unit_amenities.push(...brand.unitAmenities);
  world.house_rules.push(...brand.houseRules);
  world.payment_accounts.push(...brand.paymentAccounts);
  world.weekday_rates.push(...brand.weekdayRates);
  world.rate_overrides.push(...brand.rateOverrides);
  world.unit_fees.push(...brand.unitFees);
  world.saved_replies.push(...brand.savedReplies);

  const lastBookingNo = storyData?.lastBookingNo ?? 0;
  const lastReceiptNo = storyData?.lastReceiptNo ?? 0;

  world.account_counters.push(
    {
      account_id: brand.account.id,
      kind: 'booking',
      last_value: lastBookingNo,
      updated_at: brand.account.updated_at,
    },
    {
      account_id: brand.account.id,
      kind: 'receipt',
      last_value: lastReceiptNo,
      updated_at: brand.account.updated_at,
    },
  );

  if (storyData) {
    world.files.push(...storyData.files);
    world.unit_occupancy.push(...storyData.occupancies);
    world.bookings.push(...storyData.bookings);
    world.booking_lines.push(...storyData.bookingLines);
    world.booking_events.push(...storyData.bookingEvents);
    world.booking_guests.push(...storyData.bookingGuests);
    world.stay_reviews.push(...storyData.stayReviews);
    world.payments.push(...storyData.payments);
    world.payment_proofs.push(...storyData.paymentProofs);
    world.threads.push(...storyData.threads);
    world.messages.push(...storyData.messages);
    world.notifications_outbox.push(...storyData.outbox);
    world.audit_logs.push(...storyData.auditLogs);
  }
}
