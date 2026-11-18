# P4-0 · Owner data contract, helpers and form plumbing

Read AGENTS.md, docs/decisions.md (D28–D33 and the Phase 4 block D45–D60), docs/PROGRESS.md, docs/demo-data.md, then `packages/core/src/contract/operations.ts`, `packages/core/src/errors/index.ts`, `packages/core/src/schemas/tables/{listing,platform,price}.ts`, `packages/data/src/source.ts`, `packages/data/src/mocks/memory.ts` and `packages/data/src/contract-tests/index.ts`. Read docs/blueprints/feature-blueprint.md rows OW-01, OW-02, OW-08, OW-09, OW-12, OW-23 to OW-25 and OW-27, and line F20. Nothing else.

## Goal

Every Phase 4 owner screen (sign-up, sign-in, onboarding, units, photos, prices, payment accounts, policies, hours, account) can read and save through `packages/data`, on the memory adapter, with the same contract the real API will use in Phase 11. No screens in this task.

## Plan first

Post: the operation list (name, access, input, output, errors, idempotent, feature IDs), the schema changes, the new error reasons, the helper list with their test cases, the files you will touch, and the package lines. Wait for my OK.

## Branch

`ag/p4-0-data-contract` from the latest main. Follow AGENTS.md rule 10.

## Packages (approved, D46)

`react-hook-form@7.89.0`, `@hookform/resolvers@5.9.1` and `@tanstack/react-query@5.104.1`, in `apps/dashboard` only. Add the Stack register line for each in docs/decisions.md under "P4-0 approved packages". Nothing else.

## Build

1. **Bad input returns an error, never throws (D45).** In `createValidatedDataSource`, use `safeParse` on the input. A failure returns `{ ok: false }` with code `not_allowed`, `details.reason = 'invalid_input'` and `details.fields` (path → message, from Zod's issues). Add a contract test.
2. **Error reasons (D45).** Keep the 7 error codes. Add a closed list `ERROR_REASONS` (as const + Zod enum) in `packages/core/src/errors`: `invalid_input`, `slug_taken`, `slug_reserved`, `slug_change_limit`, `email_taken`, `unit_limit`, `storage_full`, `file_too_large`, `not_image`, `last_payment_method`, `bank_limit`, `changed_elsewhere`, `wallet_not_checked` (D33's existing one). Plus a typed `details` shape `{ reason, fields? }` and a helper that reads it. Add owner-friendly words for each reason in `words.ts`, following the `smartapp-ui-writing` skill.
3. **Schema additions (D51, D57, D58, D60 answers):**
   - `owner_applications` (new wave 1 table, one row per sign-up): `account_id`, `rents` (staycation, apartments, bed_spaces, mix), `unit_count_band`, `property_count_band`, `city`, `facebook_page` (nullable), `sign_up_method` (password, google), timestamps. Bands as closed lists. Row test like the others. Note in docs/decisions.md that the wave 1 table count is now 49.
   - `units.group_label` (nullable, up to 40) for bed spaces grouped by room.
   - A setup checklist view: the seven items from OW-02, each `done | todo | waiting`, plus `account_status` and `can_publish` (false while the account is pending, D47, D57).
   - Avatars (D59): no change. `profiles.avatar` already has `initials | preset | photo`; a DiceBear avatar is `preset` with `preset_id` like `notionists-<seed>`.
   - Not now: a security-deposit fee type (waits for Lex).
4. **Operations.** Add these to the contract, each `owner` access unless stated, each write taking an `idempotencyKey`, with its errors and feature IDs:
   - Sign-up and sign-in (`public`): `applyAsOwner` (password or Google), `signIn`, `signInWithGoogle`, `requestPasswordCode`, `resetPassword`. Plus `getMyAccount` (`owner`).
   - Onboarding and property: `getSetupChecklist`, `getOwnerProperty`, `saveProperty`, `checkSlug` (returns available / taken / reserved / invalid plus up to 3 suggestions).
   - Units: `listOwnerUnits`, `getOwnerUnit`, `saveUnit`, `createBedSpaces` (bulk, with `group_label`), `setUnitStatus`, `reorderUnits`, `archiveUnit`, `listAmenities`.
   - Prices: `saveUnitPrices` (base, weekday prices, special dates and fees in one save).
   - Photos: `requestUpload`, `confirmUpload`, `saveListingPhotos` (order and descriptions).
   - Payment accounts: `listPaymentAccounts`, `savePaymentAccount`, `setPaymentAccountActive`, `reorderPaymentAccounts`.
   - Settings: `savePolicies`, `saveHours`, `updateProfile`, `changePassword`, `signOutEverywhere`, `requestAccountDeletion` (7 days, cancellable).

   Rules to imitate in the memory adapter (comment each one as a database rule, AGENTS rule 5):
   - Unknown email and wrong password give the same `not_allowed` answer.
   - Five failed sign-ins give a 15-minute wait.
   - `requestPasswordCode` always succeeds.
   - Google sign-in: a demo owner's email signs in. Any other email returns `needs_application` with the name and email, so `/signup` can continue at step 2. The real Google redirect comes with real sign-in in Phase 11.
   - Pending owners can save everything but cannot publish.
   - The last active payment method cannot be turned off (`last_payment_method`).
   - At most 3 banks (`bank_limit`).
   - Photos: JPEG, PNG or WebP only, 15 MB in. At most 20 per unit and 10 per property.
   - The slug can be changed a limited number of times (reuse `changeSlug`'s rule).
   - Saving with a stale `updated_at` returns `changed_elsewhere`.

5. **Contract tests** in `packages/data/src/contract-tests` for every new operation: one success, each error reason it can return, a repeated save with the same key giving the same result, and an owner of another account getting `not_allowed`.
6. **Philippine input helpers** in `packages/core/src/inputs/`, pure and tested (one valid and one invalid case per rule, at least):
   - **Mobile:** accepts `0917…`, `917…` and `+63…`. Stored as `+639…`, shown as `0917 123 4567`. The same check applies to GCash and Maya account numbers.
   - **Bank account:** 8–20 digits after removing spaces and dashes, shown in groups of 4.
   - **Pesos:** accepts `1,500`, `1500`, `₱1500` and `1.5k`, giving centavos. Refuses negatives and more than 2 decimals. Formats as `₱1,500`.
   - **Time:** 30-minute choices, shown as `2:00 PM` and stored as `14:00`.
   - **Web address:** accents removed (ñ → n), straight and curly apostrophes removed, `&` → `and`, anything else → hyphen, at most 40 characters cut at a hyphen, then checked against `RESERVED_SLUGS`.
7. **Form schemas** in `packages/core/src/forms/`, built from the row schemas with `z.object(row.shape).pick()`, not `.pick()` on a refined schema (it throws in Zod 4.6.7). Cross-field rules are shared functions. One schema per Phase 4 form: apply steps 1–3, sign-in, new password, property, unit, bed spaces, prices, payment account, policies, hours, profile. Test each.
8. **Dashboard data plumbing:**
   - A `QueryClientProvider` in `apps/dashboard`, with one automatic retry.
   - `apps/dashboard/src/data/<area>/` with `keys.ts`, `reads.ts` and `writes.ts` for auth, setup, property, units, prices, photos, payments and settings.
   - A `useFormErrors` helper that puts a reason's `fields` on the matching form fields (for example `slug_taken` lands on the web address field), shows unknown errors at the top, and focuses the first error.
   - No screens.
9. **Demo data:** every pack still passes its invariants. Add `owner_applications` rows for the demo owners and one pending applicant.

## Not in this task

Screens, installed components, the photo-shrinking helper (P4-5), DiceBear (P4-2), the NestJS API, SQL.

## Done when

- `pnpm check` passes and CI is green.
- The PR is merged per rule 10, and PROGRESS ticks P4-0 with one CHANGELOG line.
- Do not edit docs/prompts; this prompt is already saved.
- P4-1 may run at the same time. If main moved before you merge, run `git fetch && git merge origin/main`, keep both sides of any PROGRESS or CHANGELOG conflict, and push. Never force-push.
- Your report lists the operation count before and after, the new error reasons, the helper test count, and any blueprint gap you found.
