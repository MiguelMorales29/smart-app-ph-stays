import {
  MAX_UPLOAD_SIZE_BYTES,
  SETUP_STEP_KEYS,
  addDays,
  appError,
  centavos,
  checkSlugFormat,
  err,
  formatWallTime12h,
  isValidBankAccount,
  isValidWalletMobile,
  manilaToday,
  normalizeBankAccount,
  normalizePhMobile,
  ok,
  operations,
  reasonError,
  slugifyPropertyName,
  suggestAlternativeSlugs,
  words,
  type AccountDeletionRequestView,
  type Clock,
  type DemoWorld,
  type FilesRow,
  type HouseRulesRow,
  type ListingPhotosRow,
  type OperationName,
  type OwnerPhotoView,
  type OwnerUnitDetailView,
  type OwnerUnitListItemView,
  type PaymentAccountsRow,
  type PropertiesRow,
  type RateOverridesRow,
  type Result,
  type SetupChecklistItemView,
  type UnitFeesRow,
  type UnitStayTermsRow,
  type UnitsRow,
  type WeekdayRatesRow,
  type WeeklyHours,
} from '@smartapp/core';
import type { z } from 'zod';

import { mediaUrl, type MediaConfig } from '../media.js';
import type { ParsedDataSourceHandlers, Session } from '../source.js';
import { addHoursIso, nowIsoFromClock, type DemoIdAllocator } from './helpers.js';

export const DEMO_OWNER_PASSWORD = 'demo-owner-pass';
export const DEMO_PASSWORD_CODE = '123456';

const ALLOWED_IMAGE_MIMES: ReadonlySet<string> = new Set(['image/jpeg', 'image/png', 'image/webp']);

const MAX_PROPERTY_PHOTOS = 10;
const MAX_UNIT_PHOTOS = 20;
const MAX_BANK_ACCOUNTS = 3;
const MAX_SLUG_CHANGES_PER_YEAR = 3;
const MAX_SIGN_IN_FAILURES = 5;
const SIGN_IN_LOCK_MINUTES = 15;
const MAX_CODE_FAILURES = 5;
const CODE_TTL_MINUTES = 15;
const DELETION_WAIT_DAYS = 7;

export interface MemoryAuthState {
  readonly passwordsByEmail: Map<string, string>;
  readonly signInFailuresByEmail: Map<string, { count: number; lockedUntilMs: number | null }>;
  readonly passwordCodesByEmail: Map<
    string,
    { code: string; attempts: number; expiresAtMs: number }
  >;
  readonly signupCodesByEmail: Map<string, { code: string; attempts: number; expiresAtMs: number }>;
  readonly deletionByAccountId: Map<string, AccountDeletionRequestView>;
  readonly slugChangesByPropertyId: Map<string, number[]>;
}

export function createMemoryAuthState(world: DemoWorld, clock: Clock): MemoryAuthState {
  const passwordsByEmail = new Map<string, string>();
  for (const account of world.accounts) {
    passwordsByEmail.set(account.contact_email.toLowerCase(), DEMO_OWNER_PASSWORD);
  }
  const slugChangesByPropertyId = new Map<string, number[]>();
  const nowMs = clock.now().getTime();
  for (const prop of world.properties) {
    if (prop.old_slugs.length > 0) {
      slugChangesByPropertyId.set(
        prop.id,
        prop.old_slugs.map(() => nowMs),
      );
    }
  }
  return {
    passwordsByEmail,
    signInFailuresByEmail: new Map(),
    passwordCodesByEmail: new Map(),
    signupCodesByEmail: new Map(),
    deletionByAccountId: new Map(),
    slugChangesByPropertyId,
  };
}

export interface OwnerHandlerContext {
  readonly world: DemoWorld;
  readonly clock: Clock;
  readonly ids: DemoIdAllocator;
  readonly mediaConfig: MediaConfig;
  readonly auth: MemoryAuthState;
  readonly beforeCall: <K extends OperationName>(
    opName: K,
    session: Session,
  ) => Promise<Result<void>>;
  readonly requireOwnerAccountMatch: (session: Session, accountId: string) => Result<string>;
  readonly runIdempotent: <K extends OperationName, T>(
    scope: K,
    key: string,
    accountId: string | null,
    payload: unknown,
    outputSchema: z.ZodType<T>,
    action: () => Promise<Result<T>>,
  ) => Promise<Result<T>>;
}

function parseDemoGoogleCredential(
  credential: string,
): { readonly email: string; readonly fullName: string } | null {
  if (!credential.startsWith('demo-google:')) return null;
  const rest = credential.slice('demo-google:'.length);
  const sep = rest.indexOf(':');
  if (sep <= 0) return null;
  const email = rest.slice(0, sep).trim().toLowerCase();
  const fullName = rest.slice(sep + 1).trim();
  if (!email.includes('@') || fullName.length === 0 || fullName.length > 80) {
    return null;
  }
  return { email, fullName };
}

function checkNotStale(expectedUpdatedAt: string | null, actualUpdatedAt: string): Result<void> {
  // Imitates optimistic concurrency check `where updated_at = $expected_updated_at`.
  if (expectedUpdatedAt !== null && expectedUpdatedAt !== actualUpdatedAt) {
    return err(reasonError('not_allowed', 'changed_elsewhere'));
  }
  return ok(undefined);
}

function hasOverlappingWeeklyHours(hours: WeeklyHours | null): boolean {
  if (hours === null) return false;
  const days = [hours.mon, hours.tue, hours.wed, hours.thu, hours.fri, hours.sat, hours.sun];
  for (const dayRanges of days) {
    const sorted = [...dayRanges].sort((a, b) => a.start.localeCompare(b.start));
    for (let i = 1; i < sorted.length; i += 1) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      if (prev && curr && curr.start < prev.end) {
        return true;
      }
    }
  }
  return false;
}

export function checkUnitLimitForAccount(
  world: DemoWorld,
  accountId: string,
  addingCount: number,
): Result<void> {
  // Imitates DB plan unit-limit trigger: active units <= plan.included_units + subscription.extra_units.
  // Pending accounts without an active subscription fall back to the standard plan's included_units (5).
  const used = world.units.filter(
    (u) => u.account_id === accountId && u.archived_at === null,
  ).length;
  const sub = world.subscriptions.find((s) => s.account_id === accountId);
  const plan =
    (sub ? world.plans.find((p) => p.id === sub.plan_id) : undefined) ??
    world.plans.find((p) => p.code === 'standard');
  const limit = (plan?.included_units ?? 5) + (sub?.extra_units ?? 0);

  if (used + addingCount > limit) {
    return err(reasonError('not_allowed', 'unit_limit', { limit, used }));
  }
  return ok(undefined);
}

export function validateSlugChangeInMemory(params: {
  readonly world: DemoWorld;
  readonly auth: MemoryAuthState;
  readonly clock: Clock;
  readonly rawSlug: string;
  readonly fieldName: 'slug' | 'newSlug';
  readonly existingProperty: PropertiesRow | null;
}): Result<string> {
  const { world, auth, clock, rawSlug, fieldName, existingProperty } = params;
  const format = checkSlugFormat(rawSlug);
  if (format === 'invalid') {
    return err(
      reasonError('not_allowed', 'invalid_input', {
        fields: { [fieldName]: 'Use 3 to 40 lowercase letters, numbers or hyphens.' },
      }),
    );
  }
  if (format === 'reserved') {
    return err(
      reasonError('not_allowed', 'slug_reserved', {
        fields: { [fieldName]: words.errorReasons.slug_reserved },
      }),
    );
  }

  // Imitates unique constraint across properties.slug and properties.old_slugs.
  const isTakenByAnother = world.properties.some(
    (p) => p.id !== existingProperty?.id && (p.slug === rawSlug || p.old_slugs.includes(rawSlug)),
  );
  if (isTakenByAnother) {
    return err(
      reasonError('not_allowed', 'slug_taken', {
        fields: { [fieldName]: words.errorReasons.slug_taken },
      }),
    );
  }

  if (existingProperty !== null && existingProperty.slug !== rawSlug) {
    // Imitates DB slug change rate limit: at most 3 slug changes per 365 days.
    const nowMs = clock.now().getTime();
    const oneYearAgoMs = nowMs - 365 * 24 * 3_600_000;
    const recentChanges = (auth.slugChangesByPropertyId.get(existingProperty.id) ?? []).filter(
      (ts) => ts >= oneYearAgoMs,
    );
    if (recentChanges.length >= MAX_SLUG_CHANGES_PER_YEAR) {
      return err(
        reasonError('not_allowed', 'slug_change_limit', {
          fields: { [fieldName]: words.errorReasons.slug_change_limit },
        }),
      );
    }
  }

  return ok(rawSlug);
}

export function recordSlugChangeTimestamp(
  auth: MemoryAuthState,
  clock: Clock,
  propertyId: string,
): void {
  const nowMs = clock.now().getTime();
  const oneYearAgoMs = nowMs - 365 * 24 * 3_600_000;
  const recent = (auth.slugChangesByPropertyId.get(propertyId) ?? []).filter(
    (ts) => ts >= oneYearAgoMs,
  );
  recent.push(nowMs);
  auth.slugChangesByPropertyId.set(propertyId, recent);
}

function toOwnerPhotoView(
  photo: ListingPhotosRow,
  world: DemoWorld,
  mediaConfig: MediaConfig,
): OwnerPhotoView {
  const file = world.files.find((f) => f.id === photo.file_id);
  const url = file ? mediaUrl(file, mediaConfig) : '/demo-media/missing.webp';
  return { ...photo, url };
}

function buildUnitDetailView(
  world: DemoWorld,
  mediaConfig: MediaConfig,
  unit: UnitsRow,
): OwnerUnitDetailView {
  const stayTerms = world.unit_stay_terms.find((t) => t.unit_id === unit.id) ?? null;
  const leaseTerms = world.unit_lease_terms.find((t) => t.unit_id === unit.id) ?? null;
  const weekdayRates = world.weekday_rates
    .filter((r) => r.unit_id === unit.id)
    .sort((a, b) => a.iso_weekday - b.iso_weekday);
  const rateOverrides = world.rate_overrides
    .filter((r) => r.unit_id === unit.id)
    .sort((a, b) => a.during.start.localeCompare(b.during.start));
  const fees = world.unit_fees
    .filter((f) => f.unit_id === unit.id)
    .sort((a, b) => a.sort_order - b.sort_order);
  const photos = world.listing_photos
    .filter((p) => p.unit_id === unit.id)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((p) => toOwnerPhotoView(p, world, mediaConfig));
  const amenityIds = world.unit_amenities
    .filter((ua) => ua.unit_id === unit.id)
    .map((ua) => ua.amenity_id);

  return {
    unit,
    stay_terms: stayTerms,
    lease_terms: leaseTerms,
    weekday_rates: weekdayRates,
    rate_overrides: rateOverrides,
    fees,
    photos,
    amenity_ids: amenityIds,
  };
}

function verifyOwnerPassword(
  world: DemoWorld,
  auth: MemoryAuthState,
  accountId: string,
  password: string,
): Result<void> {
  // Imitates re-authentication check against Auth password hash before editing payment accounts.
  const account = world.accounts.find((a) => a.id === accountId);
  if (!account) return err(appError('not_found'));
  const expected = auth.passwordsByEmail.get(account.contact_email.toLowerCase());
  if (expected === undefined || expected !== password) {
    return err(
      reasonError('not_allowed', 'wrong_password', {
        fields: { password: words.errorReasons.wrong_password },
      }),
    );
  }
  return ok(undefined);
}

function consumePasswordCode(
  auth: MemoryAuthState,
  clock: Clock,
  email: string,
  code: string,
): Result<void> {
  // Imitates DB password-code verification: 5 wrong attempts invalidate the active code.
  const normalized = email.toLowerCase();
  const entry = auth.passwordCodesByEmail.get(normalized);
  const nowMs = clock.now().getTime();
  if (!entry || entry.expiresAtMs <= nowMs) {
    if (entry) auth.passwordCodesByEmail.delete(normalized);
    return err(appError('not_allowed', 'That code is wrong or expired. Ask for a new code.'));
  }
  if (entry.code !== code) {
    entry.attempts += 1;
    if (entry.attempts >= MAX_CODE_FAILURES) {
      auth.passwordCodesByEmail.delete(normalized);
    }
    return err(appError('not_allowed', 'That code is wrong or expired. Ask for a new code.'));
  }
  auth.passwordCodesByEmail.delete(normalized);
  return ok(undefined);
}

type P4OwnerOperationName =
  | 'applyAsOwner'
  | 'signIn'
  | 'signInWithGoogle'
  | 'listPlans'
  | 'requestSignupCode'
  | 'verifySignupCode'
  | 'requestPasswordCode'
  | 'resetPassword'
  | 'getMyAccount'
  | 'getSetupChecklist'
  | 'getOwnerProperty'
  | 'saveProperty'
  | 'checkSlug'
  | 'listOwnerUnits'
  | 'getOwnerUnit'
  | 'saveUnit'
  | 'createBedSpaces'
  | 'setUnitStatus'
  | 'reorderUnits'
  | 'archiveUnit'
  | 'listAmenities'
  | 'saveUnitPrices'
  | 'requestUpload'
  | 'confirmUpload'
  | 'saveListingPhotos'
  | 'listPaymentAccounts'
  | 'savePaymentAccount'
  | 'setPaymentAccountActive'
  | 'reorderPaymentAccounts'
  | 'savePolicies'
  | 'saveHours'
  | 'updateProfile'
  | 'changePassword'
  | 'signOutEverywhere'
  | 'requestAccountDeletion';

export type P4OwnerHandlers = Pick<ParsedDataSourceHandlers, P4OwnerOperationName>;

export function createOwnerHandlers(ctx: OwnerHandlerContext): P4OwnerHandlers {
  const {
    world,
    clock,
    ids,
    mediaConfig,
    auth,
    beforeCall,
    requireOwnerAccountMatch,
    runIdempotent,
  } = ctx;

  return {
    async applyAsOwner(input, session) {
      const guard = await beforeCall('applyAsOwner', session);
      if (!guard.ok) return guard;

      return runIdempotent(
        'applyAsOwner',
        input.idempotencyKey,
        null,
        input,
        operations.applyAsOwner.output,
        async () => {
          let email: string;
          let storedPassword = DEMO_OWNER_PASSWORD;
          if (input.method === 'google') {
            const parsedCred = parseDemoGoogleCredential(input.credential);
            if (!parsedCred) {
              return err(appError('not_allowed', 'Could not verify your Google account.'));
            }
            email = parsedCred.email;
          } else {
            email = input.email.trim().toLowerCase();
            storedPassword = input.password;
          }

          // Imitates unique index on auth user email / accounts.contact_email.
          const emailTaken = world.accounts.some((a) => a.contact_email.toLowerCase() === email);
          if (emailTaken) {
            return err(
              reasonError('not_allowed', 'email_taken', {
                fields: { email: words.errorReasons.email_taken },
              }),
            );
          }

          const normalizedMobile = normalizePhMobile(input.mobile);
          if (normalizedMobile === null) {
            return err(
              reasonError('not_allowed', 'invalid_input', {
                fields: { mobile: 'Enter a valid Philippine mobile number.' },
              }),
            );
          }

          const nowIso = nowIsoFromClock(clock);
          const profileId = ids.next('0002');
          const accountId = ids.next('0001');
          const memberId = ids.next('0003');
          const applicationId = ids.next('0036');

          const initials = input.fullName
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase() ?? '')
            .join('');

          const profile = {
            id: profileId,
            full_name: input.fullName.trim(),
            avatar: { kind: 'initials' as const, text: initials || 'OW' },
            created_at: nowIso,
            updated_at: nowIso,
          };
          world.profiles.push(profile);

          const account = {
            id: accountId,
            name: (input.placeName ?? input.fullName).trim(),
            status: 'pending' as const,
            is_demo: true,
            contact_email: email,
            contact_mobile: normalizedMobile,
            notify_email: email,
            timezone: 'Asia/Manila',
            currency: 'PHP',
            approved_at: null,
            approved_by: null,
            verified_at: null,
            verified_by: null,
            verification_note: null,
            created_at: nowIso,
            updated_at: nowIso,
          };
          world.accounts.push(account);

          world.account_members.push({
            id: memberId,
            account_id: accountId,
            profile_id: profileId,
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
            created_at: nowIso,
            updated_at: nowIso,
          });

          const application = {
            id: applicationId,
            account_id: accountId,
            rents: input.rents,
            unit_count_band: input.unitCountBand,
            property_count_band: input.propertyCountBand,
            city: input.city.trim(),
            facebook_page: input.facebookPage,
            sign_up_method: input.method,
            created_at: nowIso,
            updated_at: nowIso,
          };
          world.owner_applications.push(application);

          world.account_counters.push(
            { account_id: accountId, kind: 'booking', last_value: 0, updated_at: nowIso },
            { account_id: accountId, kind: 'receipt', last_value: 0, updated_at: nowIso },
          );

          auth.passwordsByEmail.set(email, storedPassword);

          return ok({
            account,
            profile,
            application,
            session: { role: 'owner' as const, accountId, profileId },
          });
        },
      );
    },

    async signIn(input, session) {
      const guard = await beforeCall('signIn', session);
      if (!guard.ok) return guard;

      const email = input.email.trim().toLowerCase();
      const nowMs = clock.now().getTime();
      const genericErr = appError('not_allowed', 'Check your email and password and try again.');

      // Imitates Auth rate-limiting rule: 5 failed sign-ins trigger a 15-minute lockout.
      const failState = auth.signInFailuresByEmail.get(email);
      if (failState?.lockedUntilMs !== null && failState !== undefined) {
        if (failState.lockedUntilMs > nowMs) {
          return err(genericErr);
        }
        auth.signInFailuresByEmail.delete(email);
      }

      const recordFailure = () => {
        const current = auth.signInFailuresByEmail.get(email) ?? { count: 0, lockedUntilMs: null };
        const nextCount = current.count + 1;
        auth.signInFailuresByEmail.set(email, {
          count: nextCount,
          lockedUntilMs:
            nextCount >= MAX_SIGN_IN_FAILURES ? nowMs + SIGN_IN_LOCK_MINUTES * 60_000 : null,
        });
      };

      // Imitates generic auth response: unknown email and wrong password return the same not_allowed error.
      const account = world.accounts.find((a) => a.contact_email.toLowerCase() === email);
      const storedPassword = auth.passwordsByEmail.get(email);
      if (!account || storedPassword === undefined || storedPassword !== input.password) {
        recordFailure();
        return err(genericErr);
      }

      const member = world.account_members.find(
        (m) => m.account_id === account.id && m.role === 'owner' && m.status === 'active',
      );
      const profile = member ? world.profiles.find((p) => p.id === member.profile_id) : undefined;
      if (!member || !profile) {
        recordFailure();
        return err(genericErr);
      }

      auth.signInFailuresByEmail.delete(email);
      return ok({
        account,
        profile,
        session: { role: 'owner' as const, accountId: account.id, profileId: profile.id },
      });
    },

    async signInWithGoogle(input, session) {
      const guard = await beforeCall('signInWithGoogle', session);
      if (!guard.ok) return guard;

      // Imitates Google ID token verification (real token verification arrives in Phase 11).
      const parsed = parseDemoGoogleCredential(input.credential);
      if (!parsed) {
        return err(appError('not_allowed', 'Could not verify your Google account.'));
      }

      const account = world.accounts.find((a) => a.contact_email.toLowerCase() === parsed.email);
      if (!account) {
        return ok({
          kind: 'needs_application' as const,
          email: parsed.email,
          fullName: parsed.fullName,
        });
      }

      const member = world.account_members.find(
        (m) => m.account_id === account.id && m.role === 'owner' && m.status === 'active',
      );
      const profile = member ? world.profiles.find((p) => p.id === member.profile_id) : undefined;
      if (!member || !profile) {
        return ok({
          kind: 'needs_application' as const,
          email: parsed.email,
          fullName: parsed.fullName,
        });
      }

      return ok({
        kind: 'signed_in' as const,
        account,
        profile,
        session: { role: 'owner' as const, accountId: account.id, profileId: profile.id },
      });
    },

    async listPlans(_input, session) {
      const guard = await beforeCall('listPlans', session);
      if (!guard.ok) return guard;
      return ok(
        world.plans
          .filter((plan) => plan.is_active)
          .map((plan) => ({
            code: plan.code,
            name: plan.name,
            price_centavos: plan.price_centavos,
            included_units: plan.included_units,
            extra_unit_centavos: plan.extra_unit_centavos,
            trial_days: plan.trial_days,
          })),
      );
    },

    async requestSignupCode(input, session) {
      const guard = await beforeCall('requestSignupCode', session);
      if (!guard.ok) return guard;

      return runIdempotent(
        'requestSignupCode',
        input.idempotencyKey,
        null,
        input,
        operations.requestSignupCode.output,
        async () => {
          const email = input.email.trim().toLowerCase();
          // Imitates the sign-up email check (Phase 11 sends the real email): every new
          // applicant gets the demo code 123456, valid for 15 minutes.
          auth.signupCodesByEmail.set(email, {
            code: DEMO_PASSWORD_CODE,
            attempts: 0,
            expiresAtMs: clock.now().getTime() + CODE_TTL_MINUTES * 60_000,
          });
          return ok({ queued: true });
        },
      );
    },

    async verifySignupCode(input, session) {
      const guard = await beforeCall('verifySignupCode', session);
      if (!guard.ok) return guard;

      const email = input.email.trim().toLowerCase();
      const wrong = appError('not_allowed', 'That code is wrong or expired. Ask for a new code.', {
        fields: { code: 'That code is wrong or expired. Ask for a new code.' },
      });
      // Imitates the DB code check: 5 wrong tries or 15 minutes end the code.
      const entry = auth.signupCodesByEmail.get(email);
      if (!entry || entry.expiresAtMs < clock.now().getTime()) {
        auth.signupCodesByEmail.delete(email);
        return err(wrong);
      }
      if (entry.code !== input.code) {
        entry.attempts += 1;
        if (entry.attempts >= MAX_CODE_FAILURES) auth.signupCodesByEmail.delete(email);
        return err(wrong);
      }
      auth.signupCodesByEmail.delete(email);
      return ok({ verified: true as const });
    },

    async requestPasswordCode(input, session) {
      const guard = await beforeCall('requestPasswordCode', session);
      if (!guard.ok) return guard;

      return runIdempotent(
        'requestPasswordCode',
        input.idempotencyKey,
        null,
        input,
        operations.requestPasswordCode.output,
        async () => {
          const email = input.email.trim().toLowerCase();
          const account = world.accounts.find((a) => a.contact_email.toLowerCase() === email);
          // Imitates non-enumerating password reset: always succeeds even for unknown emails.
          if (account) {
            const nowMs = clock.now().getTime();
            const nowIso = nowIsoFromClock(clock);
            auth.passwordCodesByEmail.set(email, {
              code: DEMO_PASSWORD_CODE,
              attempts: 0,
              expiresAtMs: nowMs + CODE_TTL_MINUTES * 60_000,
            });
            world.notifications_outbox.push({
              id: ids.next('001c'),
              account_id: account.id,
              channel: 'email',
              template: 'owner.password_code',
              customer_id: null,
              profile_id: null,
              to_email: email,
              payload: { kind: 'password_code' },
              dedupe_key: `owner.password_code:${input.idempotencyKey}`,
              status: 'pending',
              attempts: 0,
              next_attempt_at: nowIso,
              last_error: null,
              sent_at: null,
              created_at: nowIso,
              updated_at: nowIso,
            });
          }
          return ok({ queued: true });
        },
      );
    },

    async resetPassword(input, session) {
      const guard = await beforeCall('resetPassword', session);
      if (!guard.ok) return guard;

      return runIdempotent(
        'resetPassword',
        input.idempotencyKey,
        null,
        input,
        operations.resetPassword.output,
        async () => {
          const email = input.email.trim().toLowerCase();
          const check = consumePasswordCode(auth, clock, email, input.code);
          if (!check.ok) return check;

          const account = world.accounts.find((a) => a.contact_email.toLowerCase() === email);
          if (!account) {
            return err(
              appError('not_allowed', 'That code is wrong or expired. Ask for a new code.'),
            );
          }

          auth.passwordsByEmail.set(email, input.newPassword);
          auth.signInFailuresByEmail.delete(email);
          return ok({ reset: true });
        },
      );
    },

    async getMyAccount(input, session) {
      const guard = await beforeCall('getMyAccount', session);
      if (!guard.ok) return guard;
      const acctCheck = requireOwnerAccountMatch(session, input.accountId);
      if (!acctCheck.ok) return acctCheck;
      if (session.role !== 'owner') return err(appError('not_allowed'));

      const account = world.accounts.find((a) => a.id === acctCheck.data);
      const profile = world.profiles.find((p) => p.id === session.profileId);
      const member = world.account_members.find(
        (m) => m.account_id === acctCheck.data && m.profile_id === session.profileId,
      );
      if (!account || !profile || !member) return err(appError('not_found'));

      const application =
        world.owner_applications.find((app) => app.account_id === account.id) ?? null;
      const subscription = world.subscriptions.find((s) => s.account_id === account.id) ?? null;
      const plan = subscription
        ? (world.plans.find((p) => p.id === subscription.plan_id) ?? null)
        : (world.plans.find((p) => p.code === 'standard') ?? null);
      const properties = world.properties
        .filter((p) => p.account_id === account.id && p.archived_at === null)
        .map((p) => ({
          id: p.id,
          slug: p.slug,
          name: p.name,
          city: p.city,
          status: p.status,
          updated_at: p.updated_at,
        }));
      const deletionRequest: AccountDeletionRequestView = auth.deletionByAccountId.get(
        account.id,
      ) ?? {
        status: 'none',
        requested_at: null,
        scheduled_for: null,
      };

      return ok({
        account,
        profile,
        member,
        application,
        subscription,
        plan,
        properties,
        deletion_request: deletionRequest,
      });
    },

    async getSetupChecklist(input, session) {
      const guard = await beforeCall('getSetupChecklist', session);
      if (!guard.ok) return guard;
      const acctCheck = requireOwnerAccountMatch(session, input.accountId);
      if (!acctCheck.ok) return acctCheck;

      const account = world.accounts.find((a) => a.id === acctCheck.data);
      if (!account) return err(appError('not_allowed'));

      const property =
        input.propertyId !== null
          ? world.properties.find(
              (p) => p.id === input.propertyId && p.account_id === acctCheck.data,
            )
          : world.properties.find((p) => p.account_id === acctCheck.data && p.archived_at === null);

      const propUnits = property
        ? world.units.filter((u) => u.property_id === property.id && u.archived_at === null)
        : [];

      const hasProperty = property !== undefined;
      const hasUnit = propUnits.length > 0;
      const hasPhotos =
        property !== undefined &&
        propUnits.some((u) => world.listing_photos.filter((p) => p.unit_id === u.id).length >= 3);
      const hasPrice = propUnits.some(
        (u) =>
          world.unit_stay_terms.some((t) => t.unit_id === u.id) ||
          world.unit_lease_terms.some((t) => t.unit_id === u.id),
      );
      const hasPaymentAccount = world.payment_accounts.some(
        (pa) => pa.account_id === acctCheck.data && pa.is_active,
      );
      const hasRules =
        property !== undefined &&
        (world.house_rules.some((r) => r.property_id === property.id) ||
          (property.arrival_info !== null && property.arrival_info.trim().length > 0));
      const isPublished = property !== undefined && property.status === 'published';
      const canPublish = account.status === 'active';

      const statusByStep: Record<(typeof SETUP_STEP_KEYS)[number], 'done' | 'todo' | 'waiting'> = {
        property: hasProperty ? 'done' : 'todo',
        unit: hasUnit ? 'done' : 'todo',
        photos: hasPhotos ? 'done' : 'todo',
        price: hasPrice ? 'done' : 'todo',
        payment_accounts: hasPaymentAccount ? 'done' : 'todo',
        rules: hasRules ? 'done' : 'todo',
        publish: isPublished ? 'done' : canPublish ? 'todo' : 'waiting',
      };

      const items: SetupChecklistItemView[] = SETUP_STEP_KEYS.map((key) => ({
        key,
        status: statusByStep[key],
      }));

      return ok({
        items,
        account_status: account.status,
        can_publish: canPublish,
      });
    },

    async getOwnerProperty(input, session) {
      const guard = await beforeCall('getOwnerProperty', session);
      if (!guard.ok) return guard;
      const acctCheck = requireOwnerAccountMatch(session, input.accountId);
      if (!acctCheck.ok) return acctCheck;

      const property =
        input.propertyId !== null
          ? world.properties.find(
              (p) => p.id === input.propertyId && p.account_id === acctCheck.data,
            )
          : world.properties.find((p) => p.account_id === acctCheck.data && p.archived_at === null);

      if (!property) {
        if (input.propertyId !== null) return err(appError('not_found'));
        return ok(null);
      }

      const page = world.property_pages.find((pg) => pg.property_id === property.id) ?? null;
      const photos = world.listing_photos
        .filter((ph) => ph.property_id === property.id && ph.unit_id === null)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((ph) => toOwnerPhotoView(ph, world, mediaConfig));
      const houseRules = world.house_rules
        .filter((r) => r.property_id === property.id)
        .sort((a, b) => a.sort_order - b.sort_order);

      return ok({
        property,
        page,
        photos,
        house_rules: houseRules,
      });
    },

    async saveProperty(input, session) {
      const guard = await beforeCall('saveProperty', session);
      if (!guard.ok) return guard;
      const acctCheck = requireOwnerAccountMatch(session, input.accountId);
      if (!acctCheck.ok) return acctCheck;

      return runIdempotent(
        'saveProperty',
        input.idempotencyKey,
        acctCheck.data,
        input,
        operations.saveProperty.output,
        async () => {
          if ((input.latitude === null) !== (input.longitude === null)) {
            return err(
              reasonError('not_allowed', 'invalid_input', {
                fields: {
                  latitude: 'Set both latitude and longitude, or leave both empty.',
                },
              }),
            );
          }

          const nowIso = nowIsoFromClock(clock);

          if (input.propertyId !== null) {
            const propIdx = world.properties.findIndex(
              (p) => p.id === input.propertyId && p.account_id === acctCheck.data,
            );
            if (propIdx === -1) return err(appError('not_found'));
            const existing = world.properties[propIdx];
            if (!existing) return err(appError('not_found'));

            const stale = checkNotStale(input.expectedUpdatedAt, existing.updated_at);
            if (!stale.ok) return stale;

            const slugCheck = validateSlugChangeInMemory({
              world,
              auth,
              clock,
              rawSlug: input.slug,
              fieldName: 'slug',
              existingProperty: existing,
            });
            if (!slugCheck.ok) return slugCheck;

            const slugChanged = existing.slug !== slugCheck.data;
            const oldSlugs = slugChanged
              ? [...existing.old_slugs, existing.slug]
              : existing.old_slugs;
            if (slugChanged) {
              recordSlugChangeTimestamp(auth, clock, existing.id);
            }

            const updated: PropertiesRow = {
              ...existing,
              slug: slugCheck.data,
              old_slugs: oldSlugs,
              name: input.name,
              tagline: input.tagline,
              description: input.description,
              address_line: input.addressLine,
              barangay: input.barangay,
              city: input.city,
              province: input.province,
              region: input.region,
              latitude: input.latitude,
              longitude: input.longitude,
              map_url: input.mapUrl,
              show_exact_location: input.showExactLocation,
              contact: input.contact,
              privacy_contact: input.privacyContact,
              logo_file_id: input.logoFileId,
              updated_at: nowIso,
            };
            world.properties[propIdx] = updated;
            return ok(updated);
          }

          const slugCheck = validateSlugChangeInMemory({
            world,
            auth,
            clock,
            rawSlug: input.slug,
            fieldName: 'slug',
            existingProperty: null,
          });
          if (!slugCheck.ok) return slugCheck;

          const propertyId = ids.next('0004');
          const created: PropertiesRow = {
            id: propertyId,
            account_id: acctCheck.data,
            slug: slugCheck.data,
            old_slugs: [],
            name: input.name,
            tagline: input.tagline,
            description: input.description,
            address_line: input.addressLine,
            barangay: input.barangay,
            city: input.city,
            province: input.province,
            region: input.region,
            country: 'PH',
            latitude: input.latitude,
            longitude: input.longitude,
            map_url: input.mapUrl,
            checkin_time: '14:00',
            checkout_time: '12:00',
            arrival_info: null,
            cancellation_preset: 'moderate',
            cancellation_note: null,
            privacy_contact: input.privacyContact,
            logo_file_id: input.logoFileId,
            status: 'draft',
            published_at: null,
            archived_at: null,
            rebook_min_days: 7,
            rebook_within_months: 6,
            guest_ids_required: false,
            guest_list_due_hours: 48,
            contact: input.contact,
            show_exact_location: input.showExactLocation,
            reply_hours: null,
            viewing_hours: null,
            created_at: nowIso,
            updated_at: nowIso,
          };
          world.properties.push(created);

          const ownerProfile =
            session.role === 'owner'
              ? world.profiles.find((p) => p.id === session.profileId)
              : undefined;
          world.property_pages.push({
            property_id: propertyId,
            account_id: acctCheck.data,
            draft: {
              logo: input.logoFileId,
              tagline: input.tagline,
              about: input.description ? input.description.slice(0, 600) : null,
              look: {
                brandColor: '#2563EB',
                pageColor: '#F8FAFC',
                cardColor: '#FFFFFF',
                accentColor: '#10B981',
                logoShape: 'rounded',
                fontPair: 'malinaw',
                banners: [],
                bannerSeconds: 5,
                announcement: null,
                sections: {},
              },
              install: {
                homeScreenName: input.name.slice(0, 12),
                splashColor: '#F8FAFC',
                splashAnimation: true,
                showName: true,
                showTagline: false,
              },
              hero: { cover: null, photos: [] },
              host: {
                displayName: ownerProfile?.full_name ?? input.name,
                photoFile: null,
                languages: ['English', 'Tagalog'],
              },
              units: [],
              highlights: [],
              faq: [],
              seo: {
                title: input.name.slice(0, 60),
                description: input.tagline ? input.tagline.slice(0, 155) : null,
                sharePictureFile: null,
                hideFromSearch: true,
              },
            },
            published: null,
            draft_rev: 1,
            version: 0,
            draft_updated_at: nowIso,
            published_at: null,
            published_by: null,
            created_at: nowIso,
            updated_at: nowIso,
          });

          return ok(created);
        },
      );
    },

    async checkSlug(input, session) {
      const guard = await beforeCall('checkSlug', session);
      if (!guard.ok) return guard;
      const acctCheck = requireOwnerAccountMatch(session, input.accountId);
      if (!acctCheck.ok) return acctCheck;

      const trimmed = input.slug.trim();
      const normalized = slugifyPropertyName(trimmed);
      const isTaken = (candidate: string) =>
        world.properties.some(
          (p) =>
            p.id !== input.excludePropertyId &&
            (p.slug === candidate || p.old_slugs.includes(candidate)),
        );

      const rawFormat = checkSlugFormat(trimmed);
      if (rawFormat === 'invalid') {
        return ok({
          status: 'invalid' as const,
          normalized,
          suggestions: suggestAlternativeSlugs(normalized || trimmed, isTaken),
        });
      }
      if (rawFormat === 'reserved') {
        return ok({
          status: 'reserved' as const,
          normalized: trimmed,
          suggestions: suggestAlternativeSlugs(trimmed, isTaken),
        });
      }
      if (isTaken(trimmed)) {
        return ok({
          status: 'taken' as const,
          normalized: trimmed,
          suggestions: suggestAlternativeSlugs(trimmed, isTaken),
        });
      }
      return ok({
        status: 'available' as const,
        normalized: trimmed,
        suggestions: [],
      });
    },

    async listOwnerUnits(input, session) {
      const guard = await beforeCall('listOwnerUnits', session);
      if (!guard.ok) return guard;
      const acctCheck = requireOwnerAccountMatch(session, input.accountId);
      if (!acctCheck.ok) return acctCheck;

      const units = world.units
        .filter(
          (u) =>
            u.account_id === acctCheck.data &&
            (input.propertyId === null || u.property_id === input.propertyId) &&
            (input.includeArchived || u.archived_at === null),
        )
        .sort((a, b) => a.sort_order - b.sort_order);

      const items: OwnerUnitListItemView[] = units.map((unit) => {
        const photos = world.listing_photos
          .filter((p) => p.unit_id === unit.id)
          .sort((a, b) => a.sort_order - b.sort_order);
        const firstPhoto = photos[0];
        return {
          unit,
          cover_photo: firstPhoto ? toOwnerPhotoView(firstPhoto, world, mediaConfig) : null,
          photo_count: photos.length,
          stay_terms: world.unit_stay_terms.find((t) => t.unit_id === unit.id) ?? null,
          lease_terms: world.unit_lease_terms.find((t) => t.unit_id === unit.id) ?? null,
        };
      });

      return ok(items);
    },

    async getOwnerUnit(input, session) {
      const guard = await beforeCall('getOwnerUnit', session);
      if (!guard.ok) return guard;
      const acctCheck = requireOwnerAccountMatch(session, input.accountId);
      if (!acctCheck.ok) return acctCheck;

      const unit = world.units.find(
        (u) => u.id === input.unitId && u.account_id === acctCheck.data,
      );
      if (!unit) return err(appError('not_found'));

      return ok(buildUnitDetailView(world, mediaConfig, unit));
    },

    async saveUnit(input, session) {
      const guard = await beforeCall('saveUnit', session);
      if (!guard.ok) return guard;
      const acctCheck = requireOwnerAccountMatch(session, input.accountId);
      if (!acctCheck.ok) return acctCheck;

      return runIdempotent(
        'saveUnit',
        input.idempotencyKey,
        acctCheck.data,
        input,
        operations.saveUnit.output,
        async () => {
          const property = world.properties.find(
            (p) => p.id === input.propertyId && p.account_id === acctCheck.data,
          );
          if (!property) return err(appError('not_found'));

          const unitSlugFormat = checkSlugFormat(input.slug);
          if (unitSlugFormat === 'invalid') {
            return err(
              reasonError('not_allowed', 'invalid_input', {
                fields: { slug: 'Use 3 to 40 lowercase letters, numbers or hyphens.' },
              }),
            );
          }

          if (input.stayTerms !== null && input.stayTerms.max_nights < input.stayTerms.min_nights) {
            return err(
              reasonError('not_allowed', 'invalid_input', {
                fields: { max_nights: 'Maximum nights must be at least minimum nights.' },
              }),
            );
          }

          // Imitates unique (property_id, slug) constraint on units.
          const slugTaken = world.units.some(
            (u) => u.property_id === property.id && u.id !== input.unitId && u.slug === input.slug,
          );
          if (slugTaken) {
            return err(
              reasonError('not_allowed', 'slug_taken', {
                fields: { slug: 'Another unit in this property already uses that address.' },
              }),
            );
          }

          const nowIso = nowIsoFromClock(clock);
          let savedUnit: UnitsRow;

          if (input.unitId !== null) {
            const unitIdx = world.units.findIndex(
              (u) => u.id === input.unitId && u.account_id === acctCheck.data,
            );
            if (unitIdx === -1) return err(appError('not_found'));
            const existing = world.units[unitIdx];
            if (!existing) return err(appError('not_found'));

            const stale = checkNotStale(input.expectedUpdatedAt, existing.updated_at);
            if (!stale.ok) return stale;

            savedUnit = {
              ...existing,
              slug: input.slug,
              name: input.name,
              mode: input.mode,
              unit_type: input.unitType,
              group_label: input.groupLabel,
              description: input.description,
              max_guests: input.maxGuests,
              bedrooms: input.bedrooms,
              beds: input.beds,
              bathrooms: input.bathrooms,
              floor_area_sqm: input.floorAreaSqm,
              arrival_info: input.arrivalInfo,
              updated_at: nowIso,
            };
            world.units[unitIdx] = savedUnit;
          } else {
            const limitCheck = checkUnitLimitForAccount(world, acctCheck.data, 1);
            if (!limitCheck.ok) return limitCheck;

            const existingPropUnits = world.units.filter((u) => u.property_id === property.id);
            savedUnit = {
              id: ids.next('0005'),
              account_id: acctCheck.data,
              property_id: property.id,
              slug: input.slug,
              name: input.name,
              mode: input.mode,
              unit_type: input.unitType,
              group_label: input.groupLabel,
              description: input.description,
              max_guests: input.maxGuests,
              bedrooms: input.bedrooms,
              beds: input.beds,
              bathrooms: input.bathrooms,
              floor_area_sqm: input.floorAreaSqm,
              arrival_info: input.arrivalInfo,
              sort_order: existingPropUnits.length,
              status: 'draft',
              archived_at: null,
              created_at: nowIso,
              updated_at: nowIso,
            };
            world.units.push(savedUnit);
          }

          // Sync amenities
          for (let i = world.unit_amenities.length - 1; i >= 0; i -= 1) {
            if (world.unit_amenities[i]?.unit_id === savedUnit.id) {
              world.unit_amenities.splice(i, 1);
            }
          }
          for (const amenityId of input.amenityIds) {
            world.unit_amenities.push({
              account_id: acctCheck.data,
              unit_id: savedUnit.id,
              amenity_id: amenityId,
              created_at: nowIso,
            });
          }

          // Sync stay terms
          if (input.stayTerms !== null) {
            const idx = world.unit_stay_terms.findIndex((t) => t.unit_id === savedUnit.id);
            const row: UnitStayTermsRow = {
              unit_id: savedUnit.id,
              account_id: acctCheck.data,
              ...input.stayTerms,
              created_at: idx !== -1 ? (world.unit_stay_terms[idx]?.created_at ?? nowIso) : nowIso,
              updated_at: nowIso,
            };
            if (idx !== -1) {
              world.unit_stay_terms[idx] = row;
            } else {
              world.unit_stay_terms.push(row);
            }
          }

          // Sync lease terms
          if (input.leaseTerms !== null) {
            const idx = world.unit_lease_terms.findIndex((t) => t.unit_id === savedUnit.id);
            const row = {
              unit_id: savedUnit.id,
              account_id: acctCheck.data,
              ...input.leaseTerms,
              created_at: idx !== -1 ? (world.unit_lease_terms[idx]?.created_at ?? nowIso) : nowIso,
              updated_at: nowIso,
            };
            if (idx !== -1) {
              world.unit_lease_terms[idx] = row;
            } else {
              world.unit_lease_terms.push(row);
            }
          }

          return ok(buildUnitDetailView(world, mediaConfig, savedUnit));
        },
      );
    },

    async createBedSpaces(input, session) {
      const guard = await beforeCall('createBedSpaces', session);
      if (!guard.ok) return guard;
      const acctCheck = requireOwnerAccountMatch(session, input.accountId);
      if (!acctCheck.ok) return acctCheck;

      return runIdempotent(
        'createBedSpaces',
        input.idempotencyKey,
        acctCheck.data,
        input,
        operations.createBedSpaces.output,
        async () => {
          const property = world.properties.find(
            (p) => p.id === input.propertyId && p.account_id === acctCheck.data,
          );
          if (!property) return err(appError('not_found'));

          // Imitates unit limit check across all beds being created in one bulk operation (O4/D24).
          const limitCheck = checkUnitLimitForAccount(world, acctCheck.data, input.count);
          if (!limitCheck.ok) return limitCheck;

          const nowIso = nowIsoFromClock(clock);
          const today = manilaToday(clock);
          const baseOrder = world.units.filter((u) => u.property_id === property.id).length;
          const created: UnitsRow[] = [];

          for (let i = 0; i < input.count; i += 1) {
            const num = input.startNumber + i;
            const unitId = ids.next('0005');
            const name = `${input.groupLabel} · ${input.namePrefix} ${num}`.slice(0, 80);
            let slug = slugifyPropertyName(`${input.groupLabel}-${input.namePrefix}-${num}`);
            if (slug.length < 3) slug = `bed-${num}`;
            // Ensure unique slug inside property
            let suffix = 1;
            while (world.units.some((u) => u.property_id === property.id && u.slug === slug)) {
              suffix += 1;
              slug = `${slug.slice(0, 35)}-${suffix}`;
            }

            const unit: UnitsRow = {
              id: unitId,
              account_id: acctCheck.data,
              property_id: property.id,
              slug,
              name,
              mode: input.mode,
              unit_type: 'bed_space',
              group_label: input.groupLabel,
              description: input.description,
              max_guests: 1,
              bedrooms: 1,
              beds: 1,
              bathrooms: input.bathrooms,
              floor_area_sqm: null,
              arrival_info: null,
              sort_order: baseOrder + i,
              status: 'draft',
              archived_at: null,
              created_at: nowIso,
              updated_at: nowIso,
            };
            world.units.push(unit);
            created.push(unit);

            for (const amenityId of input.amenityIds) {
              world.unit_amenities.push({
                account_id: acctCheck.data,
                unit_id: unitId,
                amenity_id: amenityId,
                created_at: nowIso,
              });
            }

            if (input.mode === 'long_term' && input.monthlyRentCentavos !== null) {
              world.unit_lease_terms.push({
                unit_id: unitId,
                account_id: acctCheck.data,
                monthly_rent_centavos: input.monthlyRentCentavos,
                min_lease_months: 6,
                advance_months: 1,
                deposit_months: 1,
                reservation_fee_centavos: centavos(0),
                available_from: addDays(today, 1),
                inclusions: null,
                created_at: nowIso,
                updated_at: nowIso,
              });
            } else if (input.mode === 'short_stay' && input.baseNightlyCentavos !== null) {
              world.unit_stay_terms.push({
                unit_id: unitId,
                account_id: acctCheck.data,
                base_nightly_centavos: input.baseNightlyCentavos,
                base_guests: 1,
                min_nights: 1,
                max_nights: 30,
                prep_nights: 0,
                weekly_discount_percent: 0,
                monthly_discount_percent: 0,
                down_payment_percent: 50,
                hold_minutes: 60,
                advance_notice_days: 0,
                booking_window_days: 365,
                created_at: nowIso,
                updated_at: nowIso,
              });
            }
          }

          return ok(created);
        },
      );
    },

    async setUnitStatus(input, session) {
      const guard = await beforeCall('setUnitStatus', session);
      if (!guard.ok) return guard;
      const acctCheck = requireOwnerAccountMatch(session, input.accountId);
      if (!acctCheck.ok) return acctCheck;

      return runIdempotent(
        'setUnitStatus',
        input.idempotencyKey,
        acctCheck.data,
        input,
        operations.setUnitStatus.output,
        async () => {
          const unitIdx = world.units.findIndex(
            (u) => u.id === input.unitId && u.account_id === acctCheck.data,
          );
          if (unitIdx === -1) return err(appError('not_found'));
          const unit = world.units[unitIdx];
          if (!unit) return err(appError('not_found'));

          const stale = checkNotStale(input.expectedUpdatedAt, unit.updated_at);
          if (!stale.ok) return stale;

          if (unit.archived_at !== null) {
            return err(appError('invalid_move', 'Restore this unit before changing its status.'));
          }

          if (input.status === 'listed') {
            // Imitates DB readiness check (D49): at least 3 photos and a base price to list a unit.
            const missing: ('photos' | 'price')[] = [];
            const photoCount = world.listing_photos.filter((p) => p.unit_id === unit.id).length;
            if (photoCount < 3) {
              missing.push('photos');
            }
            const hasPrice =
              unit.mode === 'short_stay'
                ? world.unit_stay_terms.some(
                    (t) => t.unit_id === unit.id && t.base_nightly_centavos > 0,
                  )
                : world.unit_lease_terms.some(
                    (t) => t.unit_id === unit.id && t.monthly_rent_centavos > 0,
                  );
            if (!hasPrice) {
              missing.push('price');
            }
            if (missing.length > 0) {
              return err(reasonError('invalid_move', 'unit_not_ready', { missing }));
            }
          }

          const nowIso = nowIsoFromClock(clock);
          const updated: UnitsRow = {
            ...unit,
            status: input.status,
            updated_at: nowIso,
          };
          world.units[unitIdx] = updated;
          return ok(updated);
        },
      );
    },

    async reorderUnits(input, session) {
      const guard = await beforeCall('reorderUnits', session);
      if (!guard.ok) return guard;
      const acctCheck = requireOwnerAccountMatch(session, input.accountId);
      if (!acctCheck.ok) return acctCheck;

      return runIdempotent(
        'reorderUnits',
        input.idempotencyKey,
        acctCheck.data,
        input,
        operations.reorderUnits.output,
        async () => {
          const propUnits = world.units.filter(
            (u) => u.property_id === input.propertyId && u.account_id === acctCheck.data,
          );
          if (propUnits.length === 0) return err(appError('not_found'));

          const validIds = new Set(propUnits.map((u) => u.id));
          for (const id of input.unitIds) {
            if (!validIds.has(id)) return err(appError('not_found'));
          }

          const nowIso = nowIsoFromClock(clock);
          const orderMap = new Map<string, number>();
          input.unitIds.forEach((id, idx) => {
            orderMap.set(id, idx);
          });

          const updatedUnits: UnitsRow[] = [];
          for (let i = 0; i < world.units.length; i += 1) {
            const u = world.units[i];
            if (!u || u.property_id !== input.propertyId || u.account_id !== acctCheck.data) {
              continue;
            }
            const nextOrder = orderMap.get(u.id);
            if (nextOrder !== undefined) {
              const updated = { ...u, sort_order: nextOrder, updated_at: nowIso };
              world.units[i] = updated;
              updatedUnits.push(updated);
            } else {
              updatedUnits.push(u);
            }
          }

          updatedUnits.sort((a, b) => a.sort_order - b.sort_order);
          return ok(updatedUnits);
        },
      );
    },

    async archiveUnit(input, session) {
      const guard = await beforeCall('archiveUnit', session);
      if (!guard.ok) return guard;
      const acctCheck = requireOwnerAccountMatch(session, input.accountId);
      if (!acctCheck.ok) return acctCheck;

      return runIdempotent(
        'archiveUnit',
        input.idempotencyKey,
        acctCheck.data,
        input,
        operations.archiveUnit.output,
        async () => {
          const unitIdx = world.units.findIndex(
            (u) => u.id === input.unitId && u.account_id === acctCheck.data,
          );
          if (unitIdx === -1) return err(appError('not_found'));
          const unit = world.units[unitIdx];
          if (!unit) return err(appError('not_found'));

          const stale = checkNotStale(input.expectedUpdatedAt, unit.updated_at);
          if (!stale.ok) return stale;

          if (!input.archived && unit.archived_at !== null) {
            // Imitates plan unit-limit check when restoring an archived unit.
            const limitCheck = checkUnitLimitForAccount(world, acctCheck.data, 1);
            if (!limitCheck.ok) return limitCheck;
          }

          const nowIso = nowIsoFromClock(clock);
          // F24: restored unit comes back unlisted (hidden).
          const updated: UnitsRow = {
            ...unit,
            status: 'unlisted',
            archived_at: input.archived ? nowIso : null,
            updated_at: nowIso,
          };
          world.units[unitIdx] = updated;
          return ok(updated);
        },
      );
    },

    async listAmenities(input, session) {
      const guard = await beforeCall('listAmenities', session);
      if (!guard.ok) return guard;
      const acctCheck = requireOwnerAccountMatch(session, input.accountId);
      if (!acctCheck.ok) return acctCheck;

      const rows = world.amenities
        .filter((a) => a.is_active && (a.account_id === null || a.account_id === acctCheck.data))
        .sort((a, b) => a.sort_order - b.sort_order);
      return ok(rows);
    },

    async saveUnitPrices(input, session) {
      const guard = await beforeCall('saveUnitPrices', session);
      if (!guard.ok) return guard;
      const acctCheck = requireOwnerAccountMatch(session, input.accountId);
      if (!acctCheck.ok) return acctCheck;

      return runIdempotent(
        'saveUnitPrices',
        input.idempotencyKey,
        acctCheck.data,
        input,
        operations.saveUnitPrices.output,
        async () => {
          const unit = world.units.find(
            (u) => u.id === input.unitId && u.account_id === acctCheck.data,
          );
          if (!unit) return err(appError('not_found'));

          if (input.maxNights < input.minNights) {
            return err(
              reasonError('not_allowed', 'invalid_input', {
                fields: { maxNights: 'Maximum nights must be at least minimum nights.' },
              }),
            );
          }

          const existingTermsIdx = world.unit_stay_terms.findIndex((t) => t.unit_id === unit.id);
          const existingTerms =
            existingTermsIdx !== -1 ? world.unit_stay_terms[existingTermsIdx] : undefined;
          if (existingTerms) {
            const stale = checkNotStale(input.expectedUpdatedAt, existingTerms.updated_at);
            if (!stale.ok) return stale;
          }

          const nowIso = nowIsoFromClock(clock);
          const stayTerms: UnitStayTermsRow = {
            unit_id: unit.id,
            account_id: acctCheck.data,
            base_nightly_centavos: input.baseNightlyCentavos,
            base_guests: input.baseGuests,
            min_nights: input.minNights,
            max_nights: input.maxNights,
            prep_nights: input.prepNights,
            weekly_discount_percent: input.weeklyDiscountPercent,
            monthly_discount_percent: input.monthlyDiscountPercent,
            down_payment_percent: input.downPaymentPercent,
            hold_minutes: input.holdMinutes,
            advance_notice_days: input.advanceNoticeDays,
            booking_window_days: input.bookingWindowDays,
            created_at: existingTerms?.created_at ?? nowIso,
            updated_at: nowIso,
          };

          if (existingTermsIdx !== -1) {
            world.unit_stay_terms[existingTermsIdx] = stayTerms;
          } else {
            world.unit_stay_terms.push(stayTerms);
          }

          // Replace weekday rates
          for (let i = world.weekday_rates.length - 1; i >= 0; i -= 1) {
            if (world.weekday_rates[i]?.unit_id === unit.id) {
              world.weekday_rates.splice(i, 1);
            }
          }
          const weekdayRates: WeekdayRatesRow[] = input.weekdayRates.map((r) => {
            const row: WeekdayRatesRow = {
              id: ids.next('000a'),
              account_id: acctCheck.data,
              unit_id: unit.id,
              iso_weekday: r.iso_weekday,
              nightly_centavos: r.nightly_centavos,
              created_at: nowIso,
              updated_at: nowIso,
            };
            world.weekday_rates.push(row);
            return row;
          });

          // Replace rate overrides
          for (let i = world.rate_overrides.length - 1; i >= 0; i -= 1) {
            if (world.rate_overrides[i]?.unit_id === unit.id) {
              world.rate_overrides.splice(i, 1);
            }
          }
          const rateOverrides: RateOverridesRow[] = input.rateOverrides.map((r) => {
            const row: RateOverridesRow = {
              id: ids.next('000b'),
              account_id: acctCheck.data,
              unit_id: unit.id,
              during: r.during,
              nightly_centavos: r.nightly_centavos,
              label: r.label,
              created_at: nowIso,
              updated_at: nowIso,
            };
            world.rate_overrides.push(row);
            return row;
          });

          // Replace fees
          for (let i = world.unit_fees.length - 1; i >= 0; i -= 1) {
            if (world.unit_fees[i]?.unit_id === unit.id) {
              world.unit_fees.splice(i, 1);
            }
          }
          const fees: UnitFeesRow[] = input.fees.map((f, idx) => {
            const row: UnitFeesRow = {
              id: ids.next('000c'),
              account_id: acctCheck.data,
              unit_id: unit.id,
              code: f.code,
              label: f.label,
              amount_centavos: f.amount_centavos,
              basis: f.basis,
              is_active: f.is_active,
              sort_order: idx,
              created_at: nowIso,
              updated_at: nowIso,
            };
            world.unit_fees.push(row);
            return row;
          });

          return ok({ stayTerms, weekdayRates, rateOverrides, fees });
        },
      );
    },

    async requestUpload(input, session) {
      const guard = await beforeCall('requestUpload', session);
      if (!guard.ok) return guard;
      const acctCheck = requireOwnerAccountMatch(session, input.accountId);
      if (!acctCheck.ok) return acctCheck;

      return runIdempotent(
        'requestUpload',
        input.idempotencyKey,
        acctCheck.data,
        input,
        operations.requestUpload.output,
        async () => {
          // Imitates upload validation (D49): JPEG, PNG or WebP only, max 15 MB.
          if (!ALLOWED_IMAGE_MIMES.has(input.mime.toLowerCase())) {
            return err(
              reasonError('not_allowed', 'not_image', {
                fields: { file: words.errorReasons.not_image },
              }),
            );
          }

          if (input.sizeBytes > MAX_UPLOAD_SIZE_BYTES) {
            return err(
              reasonError('not_allowed', 'file_too_large', {
                fields: { file: words.errorReasons.file_too_large },
              }),
            );
          }

          // Imitates storage quota enforcement (product rule 6: payment proofs bypass storage block).
          if (input.purpose !== 'proof' && input.purpose !== 'subscription_proof') {
            const sub = world.subscriptions.find((s) => s.account_id === acctCheck.data);
            const plan =
              (sub ? world.plans.find((p) => p.id === sub.plan_id) : undefined) ??
              world.plans.find((p) => p.code === 'standard');
            const quotaBytes = plan?.storage_bytes ?? 2_147_483_648;
            const usedBytes = world.files
              .filter((f) => f.account_id === acctCheck.data && f.deleted_at === null)
              .reduce((sum, f) => sum + f.size_bytes, 0);
            if (usedBytes + input.sizeBytes > quotaBytes) {
              return err(reasonError('not_allowed', 'storage_full'));
            }
          }

          const nowIso = nowIsoFromClock(clock);
          const fileId = ids.next('0006');
          const safeExt =
            input.mime === 'image/png' ? 'png' : input.mime === 'image/webp' ? 'webp' : 'jpg';
          const bucket =
            input.purpose === 'proof' ||
            input.purpose === 'subscription_proof' ||
            input.purpose === 'guest_id' ||
            input.purpose === 'data_export'
              ? ('documents' as const)
              : ('listing-media' as const);

          const file: FilesRow = {
            id: fileId,
            account_id: acctCheck.data,
            bucket,
            path: `${acctCheck.data}/${input.purpose}/${fileId}.${safeExt}`,
            purpose: input.purpose,
            mime: input.mime.toLowerCase(),
            size_bytes: input.sizeBytes,
            width: input.width,
            height: input.height,
            uploaded_by_kind: 'owner',
            customer_id: null,
            uploaded_by_profile: session.role === 'owner' ? session.profileId : null,
            used_by_table: null,
            used_by_id: null,
            status: 'pending',
            confirmed_at: null,
            delete_after: null,
            deleted_at: null,
            created_at: nowIso,
            updated_at: nowIso,
          };
          world.files.push(file);

          return ok({
            file,
            uploadUrl: `memory-upload://${fileId}`,
          });
        },
      );
    },

    async confirmUpload(input, session) {
      const guard = await beforeCall('confirmUpload', session);
      if (!guard.ok) return guard;
      const acctCheck = requireOwnerAccountMatch(session, input.accountId);
      if (!acctCheck.ok) return acctCheck;

      return runIdempotent(
        'confirmUpload',
        input.idempotencyKey,
        acctCheck.data,
        input,
        operations.confirmUpload.output,
        async () => {
          const idx = world.files.findIndex(
            (f) => f.id === input.fileId && f.account_id === acctCheck.data,
          );
          if (idx === -1) return err(appError('not_found'));
          const file = world.files[idx];
          if (!file) return err(appError('not_found'));
          if (file.status !== 'pending') {
            return err(appError('invalid_move', 'This upload has already been confirmed.'));
          }

          const nowIso = nowIsoFromClock(clock);
          const updated: FilesRow = {
            ...file,
            status: 'ready',
            confirmed_at: nowIso,
            width: input.width ?? file.width,
            height: input.height ?? file.height,
            used_by_table: input.usedByTable ?? file.used_by_table,
            used_by_id: input.usedById ?? file.used_by_id,
            updated_at: nowIso,
          };
          world.files[idx] = updated;
          return ok(updated);
        },
      );
    },

    async saveListingPhotos(input, session) {
      const guard = await beforeCall('saveListingPhotos', session);
      if (!guard.ok) return guard;
      const acctCheck = requireOwnerAccountMatch(session, input.accountId);
      if (!acctCheck.ok) return acctCheck;

      return runIdempotent(
        'saveListingPhotos',
        input.idempotencyKey,
        acctCheck.data,
        input,
        operations.saveListingPhotos.output,
        async () => {
          const property = world.properties.find(
            (p) => p.id === input.propertyId && p.account_id === acctCheck.data,
          );
          if (!property) return err(appError('not_found'));

          if (input.unitId !== null) {
            const unit = world.units.find(
              (u) => u.id === input.unitId && u.property_id === property.id,
            );
            if (!unit) return err(appError('not_found'));
          }

          // Imitates DB photo limit (D49): max 10 property photos, max 20 unit photos.
          const maxAllowed = input.unitId === null ? MAX_PROPERTY_PHOTOS : MAX_UNIT_PHOTOS;
          if (input.photos.length > maxAllowed) {
            return err(
              reasonError('not_allowed', 'invalid_input', {
                fields: {
                  photos:
                    input.unitId === null
                      ? 'You can keep up to 10 property photos.'
                      : 'You can keep up to 20 unit photos.',
                },
              }),
            );
          }

          for (const item of input.photos) {
            const file = world.files.find(
              (f) =>
                f.id === item.fileId &&
                f.account_id === acctCheck.data &&
                f.status === 'ready' &&
                f.deleted_at === null,
            );
            if (!file) return err(appError('not_found'));
          }

          // Replace listing_photos for this property/unit target
          for (let i = world.listing_photos.length - 1; i >= 0; i -= 1) {
            const existing = world.listing_photos[i];
            if (
              existing &&
              existing.property_id === property.id &&
              existing.unit_id === input.unitId
            ) {
              world.listing_photos.splice(i, 1);
            }
          }

          const nowIso = nowIsoFromClock(clock);
          const saved: OwnerPhotoView[] = input.photos.map((item, idx) => {
            const row: ListingPhotosRow = {
              id: ids.next('0007'),
              account_id: acctCheck.data,
              property_id: property.id,
              unit_id: input.unitId,
              file_id: item.fileId,
              alt_text: item.altText,
              sort_order: idx,
              created_at: nowIso,
              updated_at: nowIso,
            };
            world.listing_photos.push(row);
            return toOwnerPhotoView(row, world, mediaConfig);
          });

          return ok(saved);
        },
      );
    },

    async listPaymentAccounts(input, session) {
      const guard = await beforeCall('listPaymentAccounts', session);
      if (!guard.ok) return guard;
      const acctCheck = requireOwnerAccountMatch(session, input.accountId);
      if (!acctCheck.ok) return acctCheck;

      const rows = world.payment_accounts
        .filter((pa) => pa.account_id === acctCheck.data)
        .sort((a, b) => a.sort_order - b.sort_order);
      return ok(rows);
    },

    async savePaymentAccount(input, session) {
      const guard = await beforeCall('savePaymentAccount', session);
      if (!guard.ok) return guard;
      const acctCheck = requireOwnerAccountMatch(session, input.accountId);
      if (!acctCheck.ok) return acctCheck;

      return runIdempotent(
        'savePaymentAccount',
        input.idempotencyKey,
        acctCheck.data,
        input,
        operations.savePaymentAccount.output,
        async () => {
          // Imitates re-authentication gate on payment accounts to prevent account takeover.
          const pwCheck = verifyOwnerPassword(world, auth, acctCheck.data, input.password);
          if (!pwCheck.ok) return pwCheck;

          if ((input.method === 'bank') !== (input.bank !== null)) {
            return err(
              reasonError('not_allowed', 'invalid_input', {
                fields: { bank: 'Choose a bank for bank transfer accounts.' },
              }),
            );
          }
          if (
            input.bank === 'other' &&
            (input.bankName === null || input.bankName.trim().length === 0)
          ) {
            return err(
              reasonError('not_allowed', 'invalid_input', {
                fields: { bankName: 'Enter the bank name.' },
              }),
            );
          }

          let normalizedAccountNumber = input.accountNumber.trim();
          if (input.method === 'gcash' || input.method === 'maya') {
            if (!isValidWalletMobile(input.accountNumber)) {
              return err(
                reasonError('not_allowed', 'invalid_input', {
                  fields: { accountNumber: 'Enter a valid 11-digit Philippine mobile number.' },
                }),
              );
            }
            normalizedAccountNumber =
              normalizePhMobile(input.accountNumber) ?? normalizedAccountNumber;
          } else if (input.method === 'bank') {
            if (!isValidBankAccount(input.accountNumber)) {
              return err(
                reasonError('not_allowed', 'invalid_input', {
                  fields: { accountNumber: 'Enter 8 to 20 digits for the bank account number.' },
                }),
              );
            }
            normalizedAccountNumber =
              normalizeBankAccount(input.accountNumber) ?? normalizedAccountNumber;
          }

          const accountMethods = world.payment_accounts.filter(
            (pa) => pa.account_id === acctCheck.data,
          );
          const nowIso = nowIsoFromClock(clock);

          if (input.paymentAccountId !== null) {
            const idx = world.payment_accounts.findIndex(
              (pa) => pa.id === input.paymentAccountId && pa.account_id === acctCheck.data,
            );
            if (idx === -1) return err(appError('not_found'));
            const existing = world.payment_accounts[idx];
            if (!existing) return err(appError('not_found'));

            const stale = checkNotStale(input.expectedUpdatedAt, existing.updated_at);
            if (!stale.ok) return stale;

            // Imitates DB rule: at most 3 bank accounts per account.
            if (input.method === 'bank' && existing.method !== 'bank') {
              const bankCount = accountMethods.filter((pa) => pa.method === 'bank').length;
              if (bankCount >= MAX_BANK_ACCOUNTS) {
                return err(
                  reasonError('not_allowed', 'bank_limit', {
                    fields: { method: words.errorReasons.bank_limit },
                  }),
                );
              }
            }

            // Imitates DB rule: the last active payment method cannot be turned off.
            if (existing.is_active && !input.isActive) {
              const otherActive = accountMethods.some(
                (pa) => pa.id !== existing.id && pa.is_active,
              );
              if (!otherActive) {
                return err(reasonError('not_allowed', 'last_payment_method'));
              }
            }

            const updated: PaymentAccountsRow = {
              ...existing,
              method: input.method,
              bank: input.bank,
              bank_name: input.bankName,
              account_name: input.accountName,
              account_number: normalizedAccountNumber,
              qr_file_id: input.qrFileId,
              instructions: input.instructions,
              is_active: input.isActive,
              is_sample: false,
              updated_at: nowIso,
            };
            world.payment_accounts[idx] = updated;
            return ok(updated);
          }

          // Imitates DB rule: at most 3 bank accounts per account.
          if (input.method === 'bank') {
            const bankCount = accountMethods.filter((pa) => pa.method === 'bank').length;
            if (bankCount >= MAX_BANK_ACCOUNTS) {
              return err(
                reasonError('not_allowed', 'bank_limit', {
                  fields: { method: words.errorReasons.bank_limit },
                }),
              );
            }
          }

          const created: PaymentAccountsRow = {
            id: ids.next('0009'),
            account_id: acctCheck.data,
            method: input.method,
            bank: input.bank,
            bank_name: input.bankName,
            account_name: input.accountName,
            account_number: normalizedAccountNumber,
            qr_file_id: input.qrFileId,
            instructions: input.instructions,
            is_active: input.isActive,
            is_sample: false,
            sort_order: accountMethods.length,
            created_at: nowIso,
            updated_at: nowIso,
          };
          world.payment_accounts.push(created);
          return ok(created);
        },
      );
    },

    async setPaymentAccountActive(input, session) {
      const guard = await beforeCall('setPaymentAccountActive', session);
      if (!guard.ok) return guard;
      const acctCheck = requireOwnerAccountMatch(session, input.accountId);
      if (!acctCheck.ok) return acctCheck;

      return runIdempotent(
        'setPaymentAccountActive',
        input.idempotencyKey,
        acctCheck.data,
        input,
        operations.setPaymentAccountActive.output,
        async () => {
          const pwCheck = verifyOwnerPassword(world, auth, acctCheck.data, input.password);
          if (!pwCheck.ok) return pwCheck;

          const idx = world.payment_accounts.findIndex(
            (pa) => pa.id === input.paymentAccountId && pa.account_id === acctCheck.data,
          );
          if (idx === -1) return err(appError('not_found'));
          const existing = world.payment_accounts[idx];
          if (!existing) return err(appError('not_found'));

          const stale = checkNotStale(input.expectedUpdatedAt, existing.updated_at);
          if (!stale.ok) return stale;

          // Imitates DB rule: the last active payment method cannot be turned off.
          if (existing.is_active && !input.isActive) {
            const hasOtherActive = world.payment_accounts.some(
              (pa) => pa.account_id === acctCheck.data && pa.id !== existing.id && pa.is_active,
            );
            if (!hasOtherActive) {
              return err(reasonError('not_allowed', 'last_payment_method'));
            }
          }

          const nowIso = nowIsoFromClock(clock);
          const updated: PaymentAccountsRow = {
            ...existing,
            is_active: input.isActive,
            updated_at: nowIso,
          };
          world.payment_accounts[idx] = updated;
          return ok(updated);
        },
      );
    },

    async reorderPaymentAccounts(input, session) {
      const guard = await beforeCall('reorderPaymentAccounts', session);
      if (!guard.ok) return guard;
      const acctCheck = requireOwnerAccountMatch(session, input.accountId);
      if (!acctCheck.ok) return acctCheck;

      return runIdempotent(
        'reorderPaymentAccounts',
        input.idempotencyKey,
        acctCheck.data,
        input,
        operations.reorderPaymentAccounts.output,
        async () => {
          const existingRows = world.payment_accounts.filter(
            (pa) => pa.account_id === acctCheck.data,
          );
          const validIds = new Set(existingRows.map((pa) => pa.id));
          for (const id of input.paymentAccountIds) {
            if (!validIds.has(id)) return err(appError('not_found'));
          }

          const orderMap = new Map<string, number>();
          input.paymentAccountIds.forEach((id, idx) => {
            orderMap.set(id, idx);
          });

          const nowIso = nowIsoFromClock(clock);
          const updated: PaymentAccountsRow[] = [];
          for (let i = 0; i < world.payment_accounts.length; i += 1) {
            const pa = world.payment_accounts[i];
            if (!pa || pa.account_id !== acctCheck.data) continue;
            const nextOrder = orderMap.get(pa.id);
            if (nextOrder !== undefined) {
              const nextRow = { ...pa, sort_order: nextOrder, updated_at: nowIso };
              world.payment_accounts[i] = nextRow;
              updated.push(nextRow);
            } else {
              updated.push(pa);
            }
          }
          updated.sort((a, b) => a.sort_order - b.sort_order);
          return ok(updated);
        },
      );
    },

    async savePolicies(input, session) {
      const guard = await beforeCall('savePolicies', session);
      if (!guard.ok) return guard;
      const acctCheck = requireOwnerAccountMatch(session, input.accountId);
      if (!acctCheck.ok) return acctCheck;

      return runIdempotent(
        'savePolicies',
        input.idempotencyKey,
        acctCheck.data,
        input,
        operations.savePolicies.output,
        async () => {
          const propIdx = world.properties.findIndex(
            (p) => p.id === input.propertyId && p.account_id === acctCheck.data,
          );
          if (propIdx === -1) return err(appError('not_found'));
          const existing = world.properties[propIdx];
          if (!existing) return err(appError('not_found'));

          const stale = checkNotStale(input.expectedUpdatedAt, existing.updated_at);
          if (!stale.ok) return stale;

          if (
            input.cancellationPreset === 'custom' &&
            (input.cancellationNote === null || input.cancellationNote.trim().length === 0)
          ) {
            return err(
              reasonError('not_allowed', 'invalid_input', {
                fields: { cancellationNote: 'Describe your custom cancellation policy.' },
              }),
            );
          }

          const nowIso = nowIsoFromClock(clock);
          const updated: PropertiesRow = {
            ...existing,
            checkin_time: input.checkinTime,
            checkout_time: input.checkoutTime,
            cancellation_preset: input.cancellationPreset,
            cancellation_note: input.cancellationNote,
            rebook_min_days: input.rebookMinDays,
            rebook_within_months: input.rebookWithinMonths,
            guest_ids_required: input.guestIdsRequired,
            guest_list_due_hours: input.guestListDueHours,
            arrival_info: input.arrivalInfo,
            privacy_contact: input.privacyContact,
            updated_at: nowIso,
          };
          world.properties[propIdx] = updated;

          for (let i = world.house_rules.length - 1; i >= 0; i -= 1) {
            if (world.house_rules[i]?.property_id === existing.id) {
              world.house_rules.splice(i, 1);
            }
          }
          const houseRules: HouseRulesRow[] = input.houseRules.map((body, idx) => {
            const row: HouseRulesRow = {
              id: ids.next('0008'),
              account_id: acctCheck.data,
              property_id: existing.id,
              body,
              sort_order: idx,
              created_at: nowIso,
              updated_at: nowIso,
            };
            world.house_rules.push(row);
            return row;
          });

          return ok({ property: updated, houseRules });
        },
      );
    },

    async saveHours(input, session) {
      const guard = await beforeCall('saveHours', session);
      if (!guard.ok) return guard;
      const acctCheck = requireOwnerAccountMatch(session, input.accountId);
      if (!acctCheck.ok) return acctCheck;

      return runIdempotent(
        'saveHours',
        input.idempotencyKey,
        acctCheck.data,
        input,
        operations.saveHours.output,
        async () => {
          const propIdx = world.properties.findIndex(
            (p) => p.id === input.propertyId && p.account_id === acctCheck.data,
          );
          if (propIdx === -1) return err(appError('not_found'));
          const existing = world.properties[propIdx];
          if (!existing) return err(appError('not_found'));

          const stale = checkNotStale(input.expectedUpdatedAt, existing.updated_at);
          if (!stale.ok) return stale;

          if (hasOverlappingWeeklyHours(input.replyHours)) {
            return err(
              reasonError('not_allowed', 'invalid_input', {
                fields: { replyHours: 'Reply time ranges on the same day cannot overlap.' },
              }),
            );
          }
          if (hasOverlappingWeeklyHours(input.viewingHours)) {
            return err(
              reasonError('not_allowed', 'invalid_input', {
                fields: { viewingHours: 'Viewing time ranges on the same day cannot overlap.' },
              }),
            );
          }

          // Sanity-check formatted times exist (keeps import used cleanly if needed)
          if (
            input.replyHours?.mon[0] &&
            formatWallTime12h(input.replyHours.mon[0].start) === null
          ) {
            return err(
              reasonError('not_allowed', 'invalid_input', {
                fields: { replyHours: 'Enter a valid time.' },
              }),
            );
          }

          const nowIso = nowIsoFromClock(clock);
          const updated: PropertiesRow = {
            ...existing,
            reply_hours: input.replyHours,
            viewing_hours: input.viewingHours,
            updated_at: nowIso,
          };
          world.properties[propIdx] = updated;
          return ok(updated);
        },
      );
    },

    async updateProfile(input, session) {
      const guard = await beforeCall('updateProfile', session);
      if (!guard.ok) return guard;
      const acctCheck = requireOwnerAccountMatch(session, input.accountId);
      if (!acctCheck.ok) return acctCheck;
      if (session.role !== 'owner') return err(appError('not_allowed'));

      return runIdempotent(
        'updateProfile',
        input.idempotencyKey,
        acctCheck.data,
        input,
        operations.updateProfile.output,
        async () => {
          const profileIdx = world.profiles.findIndex((p) => p.id === session.profileId);
          const accountIdx = world.accounts.findIndex((a) => a.id === acctCheck.data);
          const memberIdx = world.account_members.findIndex(
            (m) => m.account_id === acctCheck.data && m.profile_id === session.profileId,
          );
          if (profileIdx === -1 || accountIdx === -1 || memberIdx === -1) {
            return err(appError('not_found'));
          }
          const existingProfile = world.profiles[profileIdx];
          const existingAccount = world.accounts[accountIdx];
          const existingMember = world.account_members[memberIdx];
          if (!existingProfile || !existingAccount || !existingMember) {
            return err(appError('not_found'));
          }

          const stale = checkNotStale(input.expectedUpdatedAt, existingProfile.updated_at);
          if (!stale.ok) return stale;

          const nowIso = nowIsoFromClock(clock);
          const profile = {
            ...existingProfile,
            full_name: input.fullName,
            avatar: input.avatar,
            updated_at: nowIso,
          };
          world.profiles[profileIdx] = profile;

          const account =
            input.notifyEmail !== null
              ? { ...existingAccount, notify_email: input.notifyEmail, updated_at: nowIso }
              : existingAccount;
          world.accounts[accountIdx] = account;

          const member =
            input.notify !== null
              ? { ...existingMember, notify: input.notify, updated_at: nowIso }
              : existingMember;
          world.account_members[memberIdx] = member;

          return ok({ profile, account, member });
        },
      );
    },

    async changePassword(input, session) {
      const guard = await beforeCall('changePassword', session);
      if (!guard.ok) return guard;
      const acctCheck = requireOwnerAccountMatch(session, input.accountId);
      if (!acctCheck.ok) return acctCheck;

      return runIdempotent(
        'changePassword',
        input.idempotencyKey,
        acctCheck.data,
        input,
        operations.changePassword.output,
        async () => {
          const account = world.accounts.find((a) => a.id === acctCheck.data);
          if (!account) return err(appError('not_allowed'));

          const email = account.contact_email.toLowerCase();
          const check = consumePasswordCode(auth, clock, email, input.code);
          if (!check.ok) return check;

          auth.passwordsByEmail.set(email, input.newPassword);
          auth.signInFailuresByEmail.delete(email);
          return ok({ changed: true });
        },
      );
    },

    async signOutEverywhere(input, session) {
      const guard = await beforeCall('signOutEverywhere', session);
      if (!guard.ok) return guard;
      const acctCheck = requireOwnerAccountMatch(session, input.accountId);
      if (!acctCheck.ok) return acctCheck;

      return runIdempotent(
        'signOutEverywhere',
        input.idempotencyKey,
        acctCheck.data,
        input,
        operations.signOutEverywhere.output,
        async () => {
          const nowIso = nowIsoFromClock(clock);
          world.audit_logs.push({
            id: ids.next('0023'),
            account_id: acctCheck.data,
            actor_kind: 'owner',
            actor_profile_id: session.role === 'owner' ? session.profileId : null,
            action: 'owner.sign_out_everywhere',
            entity_table: 'accounts',
            entity_id: acctCheck.data,
            detail: {},
            created_at: nowIso,
          });
          return ok({ signedOutAt: nowIso });
        },
      );
    },

    async requestAccountDeletion(input, session) {
      const guard = await beforeCall('requestAccountDeletion', session);
      if (!guard.ok) return guard;
      const acctCheck = requireOwnerAccountMatch(session, input.accountId);
      if (!acctCheck.ok) return acctCheck;

      return runIdempotent(
        'requestAccountDeletion',
        input.idempotencyKey,
        acctCheck.data,
        input,
        operations.requestAccountDeletion.output,
        async () => {
          const existing = auth.deletionByAccountId.get(acctCheck.data);
          const nowIso = nowIsoFromClock(clock);

          if (input.action === 'request') {
            if (existing?.status === 'scheduled') {
              return err(appError('invalid_move', 'Account deletion is already scheduled.'));
            }
            // Imitates 7-day cancellable deletion window (OW-25).
            const scheduled: AccountDeletionRequestView = {
              status: 'scheduled',
              requested_at: nowIso,
              scheduled_for: addHoursIso(clock, DELETION_WAIT_DAYS * 24),
            };
            auth.deletionByAccountId.set(acctCheck.data, scheduled);
            return ok(scheduled);
          }

          if (!existing || existing.status !== 'scheduled') {
            return err(appError('invalid_move', 'No deletion request to cancel.'));
          }
          const cleared: AccountDeletionRequestView = {
            status: 'none',
            requested_at: null,
            scheduled_for: null,
          };
          auth.deletionByAccountId.set(acctCheck.data, cleared);
          return ok(cleared);
        },
      );
    },
  };
}
