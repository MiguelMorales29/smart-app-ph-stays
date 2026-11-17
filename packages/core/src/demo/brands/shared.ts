import type {
  AccountMembersRow,
  AccountsRow,
  FilesRow,
  HouseRulesRow,
  ListingPhotosRow,
  PaymentAccountsRow,
  PropertiesRow,
  PropertyPagesRow,
  RateOverridesRow,
  SavedRepliesRow,
  SubscriptionPaymentsRow,
  SubscriptionsRow,
  UnitAmenitiesRow,
  UnitFeesRow,
  UnitLeaseTermsRow,
  UnitStayTermsRow,
  UnitsRow,
  WeekdayRatesRow,
} from '../../schemas/tables/index.js';
import { addDays, calendarDate, nightsBetween } from '../../time/index.js';
import type { CalendarDate } from '../../time/index.js';
import { makeDemoUuid } from '../ids.js';
import { DEMO_MEDIA_MANIFEST } from '../manifest.js';

type BannerItem = {
  readonly photo: string;
  readonly alt: string;
  readonly title: string | null;
  readonly line: string | null;
  readonly link: string | null;
};

export interface BrandBundle {
  readonly slug: string;
  readonly groupHex: string;
  readonly account: AccountsRow;
  readonly member: AccountMembersRow;
  readonly subscription: SubscriptionsRow;
  readonly subscriptionPayment: SubscriptionPaymentsRow;
  readonly property: PropertiesRow;
  readonly propertyPage: PropertyPagesRow;
  readonly units: UnitsRow[];
  readonly stayTerms: UnitStayTermsRow[];
  readonly leaseTerms: UnitLeaseTermsRow[];
  readonly weekdayRates: WeekdayRatesRow[];
  readonly rateOverrides: RateOverridesRow[];
  readonly unitFees: UnitFeesRow[];
  readonly unitAmenities: UnitAmenitiesRow[];
  readonly houseRules: HouseRulesRow[];
  readonly paymentAccounts: PaymentAccountsRow[];
  readonly savedReplies: SavedRepliesRow[];
  readonly files: FilesRow[];
  readonly listingPhotos: ListingPhotosRow[];
}

function computeEasterSunday(year: number): CalendarDate {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return calendarDate(
    `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
  );
}

export function resolveNextHolidayWindows(today: CalendarDate): {
  readonly christmas: { readonly start: CalendarDate; readonly end: CalendarDate };
  readonly holyWeek: { readonly start: CalendarDate; readonly end: CalendarDate };
} {
  const year = Number(today.slice(0, 4));
  const xmasThisYear = calendarDate(`${year}-12-24`);
  const xmasYear = nightsBetween(today, xmasThisYear) > 0 ? year : year + 1;
  const christmas = {
    start: calendarDate(`${xmasYear}-12-24`),
    end: calendarDate(`${xmasYear + 1}-01-02`),
  };

  let easter = computeEasterSunday(year);
  let maundyThursday = addDays(easter, -3);
  if (nightsBetween(today, maundyThursday) <= 0) {
    easter = computeEasterSunday(year + 1);
    maundyThursday = addDays(easter, -3);
  }
  const holyWeek = {
    start: maundyThursday,
    end: addDays(easter, 1),
  };

  return { christmas, holyWeek };
}

export function buildBrandMediaFromManifest(params: {
  readonly brandSlug: string;
  readonly groupHex: string;
  readonly accountId: string;
  readonly ownerProfileId: string;
  readonly propertyId: string;
  readonly logoFileId: string;
  readonly subscriptionProofFileId: string;
  readonly subscriptionPaymentId: string;
  readonly unitPrefixMap: Readonly<Record<string, readonly string[]>>;
  readonly createdAt: string;
}): {
  readonly files: FilesRow[];
  readonly listingPhotos: ListingPhotosRow[];
  readonly banners: BannerItem[];
  readonly heroPhotoFileIds: string[];
} {
  const {
    brandSlug,
    groupHex,
    accountId,
    ownerProfileId,
    propertyId,
    logoFileId,
    subscriptionProofFileId,
    subscriptionPaymentId,
    unitPrefixMap,
    createdAt,
  } = params;

  const files: FilesRow[] = [];
  const listingPhotos: ListingPhotosRow[] = [];
  const banners: BannerItem[] = [];
  const heroPhotoFileIds: string[] = [];

  let fileSeq = 1;
  let photoSeq = 1;

  files.push({
    id: logoFileId,
    account_id: accountId,
    bucket: 'listing-media',
    path: `/demo-media/${brandSlug}/brand/logo-symbol-1024.webp`,
    purpose: 'logo',
    mime: 'image/webp',
    size_bytes: 18432,
    width: 1024,
    height: 1024,
    uploaded_by_kind: 'owner',
    customer_id: null,
    uploaded_by_profile: ownerProfileId,
    used_by_table: 'properties',
    used_by_id: propertyId,
    status: 'ready',
    confirmed_at: createdAt,
    delete_after: null,
    deleted_at: null,
    created_at: createdAt,
    updated_at: createdAt,
  });

  files.push({
    id: subscriptionProofFileId,
    account_id: accountId,
    bucket: 'payment-proofs',
    path: `${accountId}/subscription-proofs/${subscriptionProofFileId}.webp`,
    purpose: 'subscription_proof',
    mime: 'image/webp',
    size_bytes: 94208,
    width: 800,
    height: 1200,
    uploaded_by_kind: 'owner',
    customer_id: null,
    uploaded_by_profile: ownerProfileId,
    used_by_table: 'subscription_payments',
    used_by_id: subscriptionPaymentId,
    status: 'ready',
    confirmed_at: createdAt,
    delete_after: null,
    deleted_at: null,
    created_at: createdAt,
    updated_at: createdAt,
  });

  const manifestEntries = DEMO_MEDIA_MANIFEST.filter((entry) => entry.brand === brandSlug);

  for (const entry of manifestEntries) {
    const primaryRelPath = entry.files[0];
    if (!primaryRelPath) {
      continue;
    }

    if (entry.folder === 'banners' && entry.name.startsWith('hero-')) {
      const fileId = makeDemoUuid(groupHex, '0006', fileSeq);
      fileSeq += 1;

      files.push({
        id: fileId,
        account_id: accountId,
        bucket: 'listing-media',
        path: `/demo-media/${brandSlug}/${primaryRelPath}`,
        purpose: 'property_photo',
        mime: 'image/webp',
        size_bytes: 210_000,
        width: 1376,
        height: 768,
        uploaded_by_kind: 'owner',
        customer_id: null,
        uploaded_by_profile: ownerProfileId,
        used_by_table: 'property_pages',
        used_by_id: propertyId,
        status: 'ready',
        confirmed_at: createdAt,
        delete_after: null,
        deleted_at: null,
        created_at: createdAt,
        updated_at: createdAt,
      });

      banners.push({
        photo: fileId,
        alt: entry.altText,
        title: entry.heroDescription.slice(0, 40) || null,
        line: entry.altText.slice(0, 90),
        link: null,
      });
    } else if (entry.folder === 'photos' && entry.name.startsWith('property-')) {
      const fileId = makeDemoUuid(groupHex, '0006', fileSeq);
      fileSeq += 1;
      const photoId = makeDemoUuid(groupHex, '0007', photoSeq);
      const sortOrder = photoSeq - 1;
      photoSeq += 1;

      files.push({
        id: fileId,
        account_id: accountId,
        bucket: 'listing-media',
        path: `/demo-media/${brandSlug}/${primaryRelPath}`,
        purpose: 'property_photo',
        mime: 'image/webp',
        size_bytes: 225_000,
        width: 1200,
        height: 896,
        uploaded_by_kind: 'owner',
        customer_id: null,
        uploaded_by_profile: ownerProfileId,
        used_by_table: 'listing_photos',
        used_by_id: photoId,
        status: 'ready',
        confirmed_at: createdAt,
        delete_after: null,
        deleted_at: null,
        created_at: createdAt,
        updated_at: createdAt,
      });

      listingPhotos.push({
        id: photoId,
        account_id: accountId,
        property_id: propertyId,
        unit_id: null,
        file_id: fileId,
        alt_text: entry.altText,
        sort_order: sortOrder,
        created_at: createdAt,
        updated_at: createdAt,
      });

      if (heroPhotoFileIds.length < 5) {
        heroPhotoFileIds.push(fileId);
      }
    } else if (entry.folder === 'photos') {
      const matchedPrefix = Object.keys(unitPrefixMap).find((prefix) =>
        entry.name.startsWith(`${prefix}-`),
      );
      if (!matchedPrefix) {
        continue;
      }

      const targetUnitIds = unitPrefixMap[matchedPrefix];
      if (!targetUnitIds || targetUnitIds.length === 0) {
        continue;
      }

      const fileId = makeDemoUuid(groupHex, '0006', fileSeq);
      fileSeq += 1;
      const firstPhotoId = makeDemoUuid(groupHex, '0007', photoSeq);

      files.push({
        id: fileId,
        account_id: accountId,
        bucket: 'listing-media',
        path: `/demo-media/${brandSlug}/${primaryRelPath}`,
        purpose: 'unit_photo',
        mime: 'image/webp',
        size_bytes: 165_000,
        width: 1200,
        height: 896,
        uploaded_by_kind: 'owner',
        customer_id: null,
        uploaded_by_profile: ownerProfileId,
        used_by_table: 'listing_photos',
        used_by_id: firstPhotoId,
        status: 'ready',
        confirmed_at: createdAt,
        delete_after: null,
        deleted_at: null,
        created_at: createdAt,
        updated_at: createdAt,
      });

      const suffixNumber = Number(entry.name.slice(matchedPrefix.length + 1));
      const unitSortOrder =
        Number.isInteger(suffixNumber) && suffixNumber > 0 ? suffixNumber - 1 : 0;

      for (const unitId of targetUnitIds) {
        const photoId = makeDemoUuid(groupHex, '0007', photoSeq);
        photoSeq += 1;
        listingPhotos.push({
          id: photoId,
          account_id: accountId,
          property_id: propertyId,
          unit_id: unitId,
          file_id: fileId,
          alt_text: entry.altText,
          sort_order: unitSortOrder,
          created_at: createdAt,
          updated_at: createdAt,
        });
      }

      if (heroPhotoFileIds.length < 5) {
        heroPhotoFileIds.push(fileId);
      }
    }
  }

  return { files, listingPhotos, banners, heroPhotoFileIds };
}
