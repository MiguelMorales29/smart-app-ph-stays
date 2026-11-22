import type {
  AccountMembersRow,
  AccountsRow,
  CustomerConsentsRow,
  CustomersRow,
  OwnerApplicationsRow,
  PlatformAdminsRow,
  ProfilesRow,
  SubscriptionsRow,
} from '../schemas/tables/index.js';
import { addDays, manilaWallTime } from '../time/index.js';
import type { CalendarDate } from '../time/index.js';
import { DEMO_IDS, makeDemoUuid } from './ids.js';

export interface DemoCustomerTemplate {
  readonly index: number;
  readonly key: string;
  readonly fullName: string;
  readonly email: string;
  readonly mobile: string;
  readonly profileId: string | null;
}

export const DEMO_CUSTOMER_TEMPLATES: readonly DemoCustomerTemplate[] = [
  {
    index: 1,
    key: 'beaSantos',
    fullName: 'Bea Santos',
    email: 'bea.santos@example.com',
    mobile: '09170001001',
    profileId: DEMO_IDS.people.memberBeaProfile,
  },
  {
    index: 2,
    key: 'carloMendoza',
    fullName: 'Carlo Mendoza',
    email: 'carlo.mendoza@example.com',
    mobile: '09170001002',
    profileId: null,
  },
  {
    index: 3,
    key: 'alyssaReyes',
    fullName: 'Alyssa Reyes',
    email: 'alyssa.reyes@example.com',
    mobile: '09170001003',
    profileId: null,
  },
  {
    index: 4,
    key: 'jerichoGarcia',
    fullName: 'Jericho Garcia',
    email: 'jericho.garcia@example.com',
    mobile: '09170001004',
    profileId: null,
  },
  {
    index: 5,
    key: 'camilleTolentino',
    fullName: 'Camille Tolentino',
    email: 'camille.tolentino@example.com',
    mobile: '09170001005',
    profileId: null,
  },
  {
    index: 6,
    key: 'paoloEvangelista',
    fullName: 'Paolo Evangelista',
    email: 'paolo.evangelista@example.com',
    mobile: '09170001006',
    profileId: null,
  },
  {
    index: 7,
    key: 'cheskaMagbanua',
    fullName: 'Cheska Magbanua',
    email: 'cheska.magbanua@example.com',
    mobile: '09170001007',
    profileId: null,
  },
  {
    index: 8,
    key: 'vinceCanete',
    fullName: 'Vince Cañete',
    email: 'vince.canete@example.com',
    mobile: '09170001008',
    profileId: null,
  },
  {
    index: 9,
    key: 'maricelOuano',
    fullName: 'Maricel Ouano',
    email: 'maricel.ouano@example.com',
    mobile: '09170001009',
    profileId: null,
  },
  {
    index: 10,
    key: 'roelYbanez',
    fullName: 'Roel Ybañez',
    email: 'roel.ybanez@example.com',
    mobile: '09170001010',
    profileId: null,
  },
  {
    index: 11,
    key: 'danicaOcampo',
    fullName: 'Danica Ocampo',
    email: 'danica.ocampo@example.com',
    mobile: '09170001011',
    profileId: null,
  },
  {
    index: 12,
    key: 'jomarBacalso',
    fullName: 'Jomar Bacalso',
    email: 'jomar.bacalso@example.com',
    mobile: '09170001012',
    profileId: null,
  },
  {
    index: 13,
    key: 'rinaAgbayani',
    fullName: 'Rina Agbayani',
    email: 'rina.agbayani@example.com',
    mobile: '09170001013',
    profileId: null,
  },
  {
    index: 14,
    key: 'markCorpuz',
    fullName: 'Mark Corpuz',
    email: 'mark.corpuz@example.com',
    mobile: '09170001014',
    profileId: null,
  },
  {
    index: 15,
    key: 'joyMangaoang',
    fullName: 'Joy Mangaoang',
    email: 'joy.mangaoang@example.com',
    mobile: '09170001015',
    profileId: null,
  },
  {
    index: 16,
    key: 'bryanAncheta',
    fullName: 'Bryan Ancheta',
    email: 'bryan.ancheta@example.com',
    mobile: '09170001016',
    profileId: null,
  },
  {
    index: 17,
    key: 'leahMadamba',
    fullName: 'Leah Madamba',
    email: 'leah.madamba@example.com',
    mobile: '09170001017',
    profileId: null,
  },
  {
    index: 18,
    key: 'erwinDumlao',
    fullName: 'Erwin Dumlao',
    email: 'erwin.dumlao@example.com',
    mobile: '09170001018',
    profileId: null,
  },
  {
    index: 19,
    key: 'kevinLim',
    fullName: 'Kevin Lim',
    email: 'kevin.lim@example.com',
    mobile: '09170001019',
    profileId: null,
  },
  {
    index: 20,
    key: 'stephanieChua',
    fullName: 'Stephanie Chua',
    email: 'stephanie.chua@example.com',
    mobile: '09170001020',
    profileId: null,
  },
  {
    index: 21,
    key: 'lanceOng',
    fullName: 'Lance Ong',
    email: 'lance.ong@example.com',
    mobile: '09170001021',
    profileId: null,
  },
  {
    index: 22,
    key: 'trishaGo',
    fullName: 'Trisha Go',
    email: 'trisha.go@example.com',
    mobile: '09170001022',
    profileId: null,
  },
  {
    index: 23,
    key: 'benedictTan',
    fullName: 'Benedict Tan',
    email: 'benedict.tan@example.com',
    mobile: '09170001023',
    profileId: null,
  },
  {
    index: 24,
    key: 'audreySy',
    fullName: 'Audrey Sy',
    email: 'audrey.sy@example.com',
    mobile: '09170001024',
    profileId: null,
  },
] as const;

export function buildBaseProfiles(createdAt: string): {
  readonly superAdminProfile: ProfilesRow;
  readonly platformAdmin: PlatformAdminsRow;
  readonly brandOwnerProfiles: readonly ProfilesRow[];
  readonly memberBeaProfile: ProfilesRow;
} {
  const superAdminProfile: ProfilesRow = {
    id: DEMO_IDS.platform.superAdminProfile,
    full_name: 'Demo Platform Admin',
    avatar: { kind: 'initials', text: 'DA', theme: 'navy' },
    photo_file_id: null,
    created_at: createdAt,
    updated_at: createdAt,
  };

  const platformAdmin: PlatformAdminsRow = {
    profile_id: DEMO_IDS.platform.superAdminProfile,
    created_by: null,
    created_at: createdAt,
  };

  const brandOwnerProfiles: readonly ProfilesRow[] = [
    {
      id: DEMO_IDS.people.owners.ulapSuites,
      full_name: 'Marco Villanueva',
      avatar: { kind: 'face', style: 'soft', face: 3, theme: 'sky' },
      photo_file_id: null,
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: DEMO_IDS.people.owners.bahayBatis,
      full_name: 'Jun Mercado',
      avatar: { kind: 'face', style: 'people', face: 2, theme: 'mint' },
      photo_file_id: null,
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: DEMO_IDS.people.owners.ilawResidences,
      full_name: 'Clarisse Sy-Tan',
      avatar: { kind: 'face', style: 'bright', face: 5, theme: 'lilac' },
      photo_file_id: null,
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: DEMO_IDS.people.owners.titaLornaDorm,
      full_name: 'Lorna Macaraeg',
      avatar: { kind: 'face', style: 'sketch', face: 7, theme: 'sand' },
      photo_file_id: null,
      created_at: createdAt,
      updated_at: createdAt,
    },
  ];

  const memberBeaProfile: ProfilesRow = {
    id: DEMO_IDS.people.memberBeaProfile,
    full_name: 'Bea Santos',
    avatar: { kind: 'initials', text: 'BS', theme: 'blush' },
    photo_file_id: null,
    created_at: createdAt,
    updated_at: createdAt,
  };

  return {
    superAdminProfile,
    platformAdmin,
    brandOwnerProfiles,
    memberBeaProfile,
  };
}

export function buildAccountCustomers(
  brandGroupHex: string,
  accountId: string,
  createdAt: string,
): {
  readonly customers: CustomersRow[];
  readonly consents: CustomerConsentsRow[];
  readonly byKey: Readonly<Record<string, CustomersRow>>;
} {
  const customers: CustomersRow[] = [];
  const consents: CustomerConsentsRow[] = [];
  const byKey: Record<string, CustomersRow> = {};

  for (const template of DEMO_CUSTOMER_TEMPLATES) {
    const customerId = makeDemoUuid(brandGroupHex, '0010', template.index);
    const consentId = makeDemoUuid(brandGroupHex, '0011', template.index);
    const row: CustomersRow = {
      id: customerId,
      account_id: accountId,
      profile_id: template.profileId,
      full_name: template.fullName,
      email: template.email,
      mobile: template.mobile,
      status: 'active',
      owner_note:
        template.key === 'beaSantos' ? 'Repeat guest, always leaves the unit tidy.' : null,
      anonymised_at: null,
      created_at: createdAt,
      updated_at: createdAt,
    };
    customers.push(row);
    byKey[template.key] = row;

    consents.push({
      id: consentId,
      account_id: accountId,
      customer_id: customerId,
      kind: 'privacy_notice',
      granted: true,
      source: 'booking_form',
      notice_version: '2026-11',
      created_at: createdAt,
    });
  }

  return { customers, consents, byKey };
}

export function buildExtraStateOwners(today: CalendarDate): {
  readonly profiles: ProfilesRow[];
  readonly accounts: AccountsRow[];
  readonly members: AccountMembersRow[];
  readonly applications: OwnerApplicationsRow[];
  readonly subscriptions: SubscriptionsRow[];
} {
  const createdAt = manilaWallTime(addDays(today, -30), '09:00').toISOString();
  const defaultNotify = {
    new_booking: true,
    payment_to_check: true,
    storage_80: true,
    storage_full: true,
    plan_due: true,
    send_to: null,
  };

  const profiles: ProfilesRow[] = [
    {
      id: DEMO_IDS.people.owners.pending,
      full_name: 'Noel Panganiban',
      avatar: { kind: 'initials', text: 'NP', theme: 'sky' },
      photo_file_id: null,
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: DEMO_IDS.people.owners.trialDay13,
      full_name: 'Hannah Uy',
      avatar: { kind: 'initials', text: 'HU', theme: 'sun' },
      photo_file_id: null,
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: DEMO_IDS.people.owners.inGrace,
      full_name: 'Dennis Bautista',
      avatar: { kind: 'initials', text: 'DB', theme: 'sand' },
      photo_file_id: null,
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: DEMO_IDS.people.owners.paused,
      full_name: 'Grace Soriano',
      avatar: { kind: 'initials', text: 'GS', theme: 'blush' },
      photo_file_id: null,
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: DEMO_IDS.people.owners.cancelled,
      full_name: 'Victor Alvarez',
      avatar: { kind: 'initials', text: 'VA', theme: 'navy' },
      photo_file_id: null,
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: DEMO_IDS.people.owners.empty,
      full_name: 'Patricia Dizon',
      avatar: { kind: 'initials', text: 'PD', theme: 'mint' },
      photo_file_id: null,
      created_at: createdAt,
      updated_at: createdAt,
    },
  ];

  const accounts: AccountsRow[] = [
    {
      id: DEMO_IDS.people.extraAccounts.pendingAccount,
      name: 'Pinecrest Cabin',
      status: 'pending',
      is_demo: true,
      contact_email: 'owner.pending@demo.invalid',
      contact_mobile: '09170000105',
      notify_email: 'owner.pending@demo.invalid',
      timezone: 'Asia/Manila',
      currency: 'PHP',
      approved_at: null,
      approved_by: null,
      verified_at: null,
      verified_by: null,
      verification_note: null,
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: DEMO_IDS.people.extraAccounts.trialDay13Account,
      name: 'CasaSol Beach House',
      status: 'active',
      is_demo: true,
      contact_email: 'owner.trial-day13@demo.invalid',
      contact_mobile: '09170000106',
      notify_email: 'owner.trial-day13@demo.invalid',
      timezone: 'Asia/Manila',
      currency: 'PHP',
      approved_at: manilaWallTime(addDays(today, -13), '10:00').toISOString(),
      approved_by: DEMO_IDS.platform.superAdminProfile,
      verified_at: null,
      verified_by: null,
      verification_note: null,
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: DEMO_IDS.people.extraAccounts.inGraceAccount,
      name: 'Patio Verde Stay',
      status: 'active',
      is_demo: true,
      contact_email: 'owner.in-grace@demo.invalid',
      contact_mobile: '09170000107',
      notify_email: 'owner.in-grace@demo.invalid',
      timezone: 'Asia/Manila',
      currency: 'PHP',
      approved_at: createdAt,
      approved_by: DEMO_IDS.platform.superAdminProfile,
      verified_at: null,
      verified_by: null,
      verification_note: null,
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: DEMO_IDS.people.extraAccounts.pausedAccount,
      name: 'Luntian Loft',
      status: 'active',
      is_demo: true,
      contact_email: 'owner.paused@demo.invalid',
      contact_mobile: '09170000108',
      notify_email: 'owner.paused@demo.invalid',
      timezone: 'Asia/Manila',
      currency: 'PHP',
      approved_at: createdAt,
      approved_by: DEMO_IDS.platform.superAdminProfile,
      verified_at: null,
      verified_by: null,
      verification_note: null,
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: DEMO_IDS.people.extraAccounts.cancelledAccount,
      name: 'Lumang Bahay Inn',
      status: 'closed',
      is_demo: true,
      contact_email: 'owner.cancelled@demo.invalid',
      contact_mobile: '09170000109',
      notify_email: 'owner.cancelled@demo.invalid',
      timezone: 'Asia/Manila',
      currency: 'PHP',
      approved_at: createdAt,
      approved_by: DEMO_IDS.platform.superAdminProfile,
      verified_at: null,
      verified_by: null,
      verification_note: null,
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: DEMO_IDS.people.extraAccounts.emptyAccount,
      name: 'Bagong Bukas Homestay',
      status: 'active',
      is_demo: true,
      contact_email: 'owner.empty@demo.invalid',
      contact_mobile: '09170000110',
      notify_email: 'owner.empty@demo.invalid',
      timezone: 'Asia/Manila',
      currency: 'PHP',
      approved_at: manilaWallTime(today, '08:00').toISOString(),
      approved_by: DEMO_IDS.platform.superAdminProfile,
      verified_at: null,
      verified_by: null,
      verification_note: null,
      created_at: manilaWallTime(today, '08:00').toISOString(),
      updated_at: manilaWallTime(today, '08:00').toISOString(),
    },
  ];

  const members: AccountMembersRow[] = [
    {
      id: DEMO_IDS.people.extraAccounts.pendingMember,
      account_id: DEMO_IDS.people.extraAccounts.pendingAccount,
      profile_id: DEMO_IDS.people.owners.pending,
      role: 'owner',
      status: 'active',
      notify: defaultNotify,
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: DEMO_IDS.people.extraAccounts.trialDay13Member,
      account_id: DEMO_IDS.people.extraAccounts.trialDay13Account,
      profile_id: DEMO_IDS.people.owners.trialDay13,
      role: 'owner',
      status: 'active',
      notify: defaultNotify,
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: DEMO_IDS.people.extraAccounts.inGraceMember,
      account_id: DEMO_IDS.people.extraAccounts.inGraceAccount,
      profile_id: DEMO_IDS.people.owners.inGrace,
      role: 'owner',
      status: 'active',
      notify: defaultNotify,
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: DEMO_IDS.people.extraAccounts.pausedMember,
      account_id: DEMO_IDS.people.extraAccounts.pausedAccount,
      profile_id: DEMO_IDS.people.owners.paused,
      role: 'owner',
      status: 'active',
      notify: defaultNotify,
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: DEMO_IDS.people.extraAccounts.cancelledMember,
      account_id: DEMO_IDS.people.extraAccounts.cancelledAccount,
      profile_id: DEMO_IDS.people.owners.cancelled,
      role: 'owner',
      status: 'active',
      notify: defaultNotify,
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: DEMO_IDS.people.extraAccounts.emptyMember,
      account_id: DEMO_IDS.people.extraAccounts.emptyAccount,
      profile_id: DEMO_IDS.people.owners.empty,
      role: 'owner',
      status: 'active',
      notify: defaultNotify,
      created_at: manilaWallTime(today, '08:00').toISOString(),
      updated_at: manilaWallTime(today, '08:00').toISOString(),
    },
  ];

  const subscriptions: SubscriptionsRow[] = [
    {
      id: DEMO_IDS.people.extraAccounts.trialDay13Subscription,
      account_id: DEMO_IDS.people.extraAccounts.trialDay13Account,
      plan_id: DEMO_IDS.platform.standardPlan,
      status: 'trial',
      trial_ends_on: addDays(today, 1),
      paid_through: addDays(today, 1),
      extra_units: 0,
      paused_at: null,
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: DEMO_IDS.people.extraAccounts.inGraceSubscription,
      account_id: DEMO_IDS.people.extraAccounts.inGraceAccount,
      plan_id: DEMO_IDS.platform.standardPlan,
      status: 'active',
      trial_ends_on: addDays(today, -33),
      paid_through: addDays(today, -3),
      extra_units: 0,
      paused_at: null,
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: DEMO_IDS.people.extraAccounts.pausedSubscription,
      account_id: DEMO_IDS.people.extraAccounts.pausedAccount,
      plan_id: DEMO_IDS.platform.standardPlan,
      status: 'paused',
      trial_ends_on: addDays(today, -45),
      paid_through: addDays(today, -15),
      extra_units: 0,
      paused_at: manilaWallTime(addDays(today, -7), '01:00').toISOString(),
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: DEMO_IDS.people.extraAccounts.cancelledSubscription,
      account_id: DEMO_IDS.people.extraAccounts.cancelledAccount,
      plan_id: DEMO_IDS.platform.standardPlan,
      status: 'cancelled',
      trial_ends_on: addDays(today, -60),
      paid_through: addDays(today, -30),
      extra_units: 0,
      paused_at: null,
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: DEMO_IDS.people.extraAccounts.emptySubscription,
      account_id: DEMO_IDS.people.extraAccounts.emptyAccount,
      plan_id: DEMO_IDS.platform.standardPlan,
      status: 'trial',
      trial_ends_on: addDays(today, 14),
      paid_through: addDays(today, 14),
      extra_units: 0,
      paused_at: null,
      created_at: manilaWallTime(today, '08:00').toISOString(),
      updated_at: manilaWallTime(today, '08:00').toISOString(),
    },
  ];

  const applications: OwnerApplicationsRow[] = [
    {
      id: DEMO_IDS.people.extraAccounts.pendingApplication,
      account_id: DEMO_IDS.people.extraAccounts.pendingAccount,
      rents: 'staycation',
      unit_count_band: '2_5',
      property_count_band: '1',
      city: 'Baguio City',
      facebook_page: 'https://facebook.com/pinecrestcabin.demo',
      sign_up_method: 'password',
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: DEMO_IDS.people.extraAccounts.trialDay13Application,
      account_id: DEMO_IDS.people.extraAccounts.trialDay13Account,
      rents: 'staycation',
      unit_count_band: '1',
      property_count_band: '1',
      city: 'San Juan, La Union',
      facebook_page: null,
      sign_up_method: 'google',
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: DEMO_IDS.people.extraAccounts.inGraceApplication,
      account_id: DEMO_IDS.people.extraAccounts.inGraceAccount,
      rents: 'mix',
      unit_count_band: '2_5',
      property_count_band: '2_3',
      city: 'Lipa City',
      facebook_page: 'https://facebook.com/patioverde.demo',
      sign_up_method: 'password',
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: DEMO_IDS.people.extraAccounts.pausedApplication,
      account_id: DEMO_IDS.people.extraAccounts.pausedAccount,
      rents: 'apartments',
      unit_count_band: '2_5',
      property_count_band: '1',
      city: 'Makati City',
      facebook_page: null,
      sign_up_method: 'password',
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: DEMO_IDS.people.extraAccounts.cancelledApplication,
      account_id: DEMO_IDS.people.extraAccounts.cancelledAccount,
      rents: 'staycation',
      unit_count_band: '1',
      property_count_band: '1',
      city: 'Vigan City',
      facebook_page: null,
      sign_up_method: 'password',
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: DEMO_IDS.people.extraAccounts.emptyApplication,
      account_id: DEMO_IDS.people.extraAccounts.emptyAccount,
      rents: 'staycation',
      unit_count_band: '2_5',
      property_count_band: '1',
      city: 'Cebu City',
      facebook_page: null,
      sign_up_method: 'password',
      created_at: manilaWallTime(today, '08:00').toISOString(),
      updated_at: manilaWallTime(today, '08:00').toISOString(),
    },
  ];

  return { profiles, accounts, members, applications, subscriptions };
}
