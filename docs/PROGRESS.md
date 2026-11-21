# Progress

The phases come from `docs/blueprints/build-roadmap.md`. A page is **UI approved** on mock data and **Done** only on the real database.

## Phase 1. Repository and stack

- [x] P1-A Root, tooling, shared packages and CI
- [x] P1-B The three apps with placeholder pages and the API health check
- [x] P1-C Lint-wall tests, build scan, phone check and final verification

## Phase 2. Data shapes, demo data and the mock layer

- [x] P2-A Demo media, manifest check and Phase 2 decisions
- [x] P2-B Core basics: money, Manila time, errors, wave 1 closed lists, lifecycles and demo ids
- [x] P2-C Wave 1 table schemas, view schemas, operation contract, quoteStay and reserved slugs
- [x] P2-D Demo world: the four demo properties, four packs, invariants, snapshot and demo:print
- [x] P2-E Data layer: DataSource contract wrapper, memory adapter, dynamic client loader, mediaUrl and 19 contract tests
- [x] P2-F Switches, env validation, preview ribbon, placeholder pages, and extended production build scan

## Phase 3. Look and app frames

- [x] P3-0 Housekeeping before Phase 3
- [x] P3-A UI foundation: Tailwind, shadcn, tokens, platform theme and Phase 3 components
- [x] P3-B Storefront theme engine and font pairs
- [x] P3-C Storefront frame and routes
- [x] P3-D Dashboard and admin frames, router and route index
- [x] P3-E Kits, screenshot tests, previews and docs
- [x] UI skills and guards: `.agents/skills` (smartapp-ui, -writing, -check), brand guard test, responsive UI scan in CI (D44)
- [x] P3 polish: floating developer switches, banner tokens, glass fix, storefront home cards, invalid-slug 404s, favicons

## Phase 4. Owner start and listing (screens)

Plan: the "Phase 4 plan" tab in the Claude Doc. Decisions D45–D60.

- [x] P4-0 Owner data contract, error reasons, schema additions, PH input helpers, form schemas, data hooks
- [x] P4-1 Phone and platform fixes: manifest, viewport, scroll restoration, notch, 16 px inputs, autofill, motion tokens, UI-scan rules
- [x] P4-2 Components and compositions (D55), DiceBear avatars, Fluent pictures
- [x] P4-3 Sign-up (with Google), login, forgot password, waiting for approval
- [x] P4-4 Onboarding and the home checklist
- [x] P4-5 Units and photos
- [x] P4-6 Prices, amenities and booking rules
- [x] P4.5-A Pattern Guide v2 patterns: warm colours, motion, sheet, rows, segmented pill, stepper, chips, save pill, section nav
- [x] P4.5-B Refit Phase 4 screens on the patterns, demo photos, Preview switch
- [x] P4-7 Settings and the property switcher
  - Follow-ups (open): the property switcher needs a demo owner with 2 properties and the data hooks reading the active property (`?p=`); saved replies need a contract operation; uploading your own profile photo needs a photo URL on the profile.
- [x] P4-8 Close-out (wrapped up 2026-11-21 by Lex's call): pages load on demand and a bundle budget check runs in CI (entry 100 KB, first load 245 KB gzipped); the full UI scan passed on main; docs updated. The rest moved to the Phase 5 carry-over list below.

### Carry-over into Phase 5 (decided by Lex, 2026-11-21)

- [ ] Lex's iPhone check of every Phase 4 screen (Safari bars, light and dark), with a screen recording of anything that feels broken.
- [ ] Edit unit accordion on iPhone: opening one section closes the one above, so the page jumps (suspected; fix after the recording).
- [ ] Re-check every component changed in Phase 4 / 4.5 on a real iPhone, not only in Chrome.
- [ ] Desktop + mobile UX research pass (desktop patterns were not studied as deeply as mobile), then a combined Smart App pattern set.
- [ ] Owner journey e2e test and the six component tests (needs Node 24.15 for jsdom 31; the repo pins 24.14).
- [ ] Property switcher: a demo owner with 2 properties and the data hooks reading `?p=`.
- [ ] Saved replies (needs a contract operation) and uploading your own profile photo.
- [ ] Guest rewards and promotions for Phase 7 (`docs/rewards-and-promotions.md`): push campaigns (O11), referral (O12), discount engine and promo codes (O13); confirm the five O14 settings before the Phase 7 screens.

## Later phases

- [x] 2 Data shapes, demo data and the mock layer
- [x] 3 Look and app frames
- [x] 4 Owner start and listing (screens)
- [ ] 5 Public pages and the page editor (screens)
- [ ] 6 Dates, price and holding a booking (screens)
- [ ] 7 Conversation, payment proof and notices (screens)
- [ ] 8 Daily work and members (screens)
- [ ] 9 Plans, super admin and the owner landing page (screens)
- [ ] Gate: the wave 1 click-through
- [ ] 10 Database, wave 1
- [ ] 11 API and sign-in
- [ ] 12 Files, notices and timed jobs
- [ ] 13 Plans, super admin and Meta for real
- [ ] 14 Hardening and pilot launch
- [ ] 15 Rentals (wave 2)
- [ ] 16 Rewards and the funnel report (wave 3)
