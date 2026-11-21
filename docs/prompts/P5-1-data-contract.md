# P5-1 · Data contract for the public pages and the page editor

Model: Gemini 4 Argon, Medium. Planning mode. Can run in parallel with P5-0.

Read first: AGENTS.md, docs/prompts/P5-guide.md, docs/prompts/P4-0-data-contract.md (how the last contract task was done), Feature blueprint §7 (property app briefs) and §7a (page editor), Database blueprint `property_pages`. Files: `packages/core/src/contract/operations.ts`, `packages/core/src/schemas/views/public.ts`, `packages/core/src/schemas/tables/common.ts` (`propertyPageDraftSchema`), `packages/data/src/mocks/memory.ts`, `packages/data/src/mocks/owner-handlers.ts`, the demo brands in `packages/core/src/demo/brands/`.

## Goal

Every read and write Phase 5 screens need exists in the contract, has Zod input and output, is answered by the memory adapter, and is tested, so P5-2 to P5-6 only build screens.

## Branch

`ag/p5-1-pages-contract` from main. One PR.

## Add or change

1. **`getPublicUnit`** (public; PA-02, PA-08). Input `{ slug, unitSlug }`. Output:
   - the unit card fields plus all its photos (with `url`), amenities, house rules;
   - `price_from` (the lowest nightly price over the next 60 nights);
   - the property's cancellation preset in words (`CANCELLATION_PRESET_COPY`), check-in and check-out times, whether IDs are asked, minimum and maximum nights;
   - `page.published.look` (so the page uses the owner's colours).
   - Errors: `not_found` (unknown, archived, hidden unit, unpublished property).
   - Long-term units return their lease terms (wave 2 screens can use it later).
2. **`getProperty` view additions** (PA-01, PA-10):
   - `host`: display name, photo url, languages, `hosting_since` (year of the account's first published version), `reply_time` worked out from the demo threads ("Usually replies within an hour").
   - `trust`: `is_verified`, `payment_accounts_changed_recently` (a payment account added or edited in the last 7 days).
   - Every photo used by the page (`logo`, hero, banners, host photo, share picture) as `{ file_id, url, alt }`.
   - Paused accounts return contact details only (PA-09).
3. **Owner editor operations** (OW-02, OW-11, §7a):
   - `getPageEditor` (owner): `{ draft, published, draft_rev, version, draft_updated_at, published_at }`, plus the data the preview needs whether or not the page is published (the same shape as `getProperty`, built from the **draft**). This also serves `/[slug]/preview`.
   - `savePageDraft` (owner, idempotent): `{ propertyId, draft, expectedDraftRev }` → `{ draft_rev, draft_updated_at }`. A stale `expectedDraftRev` → `draft_conflict`, with the newer draft in `details`.
   - `discardPageDraft` (owner): copies `published` back to `draft`, `draft_rev + 1`. If nothing was ever published, it resets to the brand defaults.
   - `publishPropertyPage` (exists): check it blocks with `invalid_move` and a reason when there is no cover photo or the web address is taken (the two blockers in §7a), and returns the new `version`.
   - `getPageChanges` (owner): the plain-words list of differences between draft and published, as `{ part, words }[]` ("Fonts: Café", "Banner 2 photo"). Put the diff function in `packages/core/src/editor/changes.ts` with tests. **Port** it from the food app's `apps/dashboard/src/features/editor/change-text.ts`.
4. **Errors:** add `draft_conflict` to the error codes, with owner words in the error copy ("Someone saved a newer version. Load the newer one or keep yours.").
5. **Preview channel schema** in `packages/core/src/editor/preview-messages.ts`: the Zod messages between the dashboard and the preview frame (`draft`, `select-part`, `hover-part`, `go-to-page`, `ready`, `part-clicked`). **Port** from the food app's `apps/storefront/src/features/preview/preview-messages.ts`; rename shop to property.
6. **Demo data:** each of the 5 brands has a full published page and a draft with 1 to 3 differences (so "Draft with N changes" shows). Ulap Suites has 3 banners, an announcement and 6 FAQ; Tita Lorna Dorm has none of those (the empty look). Use existing demo media only.
7. **More demo units (D73).** Ulap Suites gets 8 units in the `marketing` pack (today it has 2), reusing its existing demo photos in a different order per unit: a mix of whole places and private rooms, one hidden, one draft, prices from ₱2,200 to ₱4,800 a night, so the Units grid, Reorder and Select can be checked. Keep the demo invariants and snapshot tests passing (update snapshots on purpose). The `empty` pack still has none.
8. **Memory adapter:** answer every new operation; `savePageDraft` keeps state for the session like the other writes; `?pack=slow` delays; `?pack=error` fails them.

## Not in this task

Any screen. The real database (Phase 10).

## Done when

- Contract tests: each new operation's input and output parse; `draft_conflict` on a stale rev; publish blocked without a cover; `getPublicUnit` not_found for a hidden unit.
- `getPageChanges` has at least 8 unit tests (each part type).
- `pnpm check` green. PROGRESS: tick P5-1. One CHANGELOG line. Record the new operations in docs/decisions.md as one dated P5-1 line (like the P4-3 line).
- Open the PR, wait for green CI, **do not merge**. Report the PR number.
