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
- [x] Edit unit accordion on iPhone: replaced by Settings-style rows in P5-0 (D66).
- [ ] Re-check every component changed in Phase 4 / 4.5 on a real iPhone, not only in Chrome.
- [ ] Desktop + mobile UX research pass (desktop patterns were not studied as deeply as mobile), then a combined Smart App pattern set.
- [ ] Owner journey e2e test and the six component tests (needs Node 24.15 for jsdom 31; the repo pins 24.14): in P5-7.
- [ ] Property switcher, saved replies and uploading your own profile photo: moved to Phase 8 (D70).
- [ ] (Phase 7) Guest rewards and promotions (`docs/rewards-and-promotions.md`): push campaigns (O11), referral (O12), discount engine and promo codes (O13); confirm the five O14 settings before the Phase 7 screens.
- [ ] (Phase 7) Guest payment-proof uploads: optional crop, never forced, keep text readable.

## Phase 5. Public pages and the page editor (screens)

Plan: `docs/prompts/P5-guide.md`. Decisions D65–D70. Claude reviews each PR (code and Vercel preview) before merge.

- [x] P5-0 Dock with +, Edit unit as Settings-style rows, badges, Preview switch, spacing (closes the accordion jump)
- [x] P5-0b Units page, unit cards and dock polish (round 2)
- [x] P5-1 Data contract for the public pages and the page editor
- [x] P5-2 Property page
- [x] P5-2b Property page structure, round 2 (section tabs, desktop booking card, rooms, iPhone install guide)
- [ ] P5-3 Unit page
- [ ] P5-4 Install, splash, share previews, offline, privacy
- [ ] P5-5 Page editor engine
- [ ] P5-6 Page editor parts
- [ ] P5-7 Tests (Node 24.15, component and journey tests) and close-out
- [ ] Gate: Lex installs a property on his iPhone, and edits and publishes the page from the phone

### Component library expansion (D78, D83)

Plan: `docs/prompts/UI-library-expansion.md` and `docs/component-catalog.md`.

- [x] UI-1 Food app components (forms, feedback, navigation) and plan updates
- [x] UI-2 Photos, colours and the picture maker (plus screen retrofits)
- [x] UI-3 Data and lists
- [x] UI-4 Dates, calendars and time
- [x] FIX-1 Urgent audit fixes (custom style variants, Your picture sheet, memory uploads, bed spaces, mode defaults & lock, unit readiness card, house rules wrap, O4 plan limit, mobile calendar prices, Playwright journeys)
- [x] UI-5 Conversation, charts and stats (plus step 0 tooling: turbo TUI, `pnpm ui-scan`, `pnpm e2e`, `pnpm budget`, scan warm-up, kit-examples guard)
- [x] UI-6 Missing primitives and variants (19 primitives, 228 ReUI example variants in lazy kit rows)

### Audit and restructure (Claude, from 26 Nov 2026)

- [x] AUDIT-1 Code audit of Phase 3–5 against the blueprints: `docs/audits/AUDIT-1.md` (24 findings)
- [x] R-1 Units: rooms as groups with a room menu, Cards/Table switch, Archived with Restore, bulk archive, price split by nightly and monthly, duplicate copies everything, hold default 60, Rent Control Act warning
- [x] R-1b Units and rooms: one list without category titles, shared rooms as records with Edit room, Delete for never-booked units
- [x] R-2 Settings and saving (A11, A12, A15–A17): house rules list, monthly move-in rules, closed dates calendar, link fields with Open, saves keep the owner in place
- [ ] R-2b Special days (reason, different hours, PH holidays; needs a `special_days` table)
- [x] R-3 Booking rules and amenities (A13, A14)
- [x] R-4 Shared pieces (A18, A19, A23, A24)

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
  - Step 0: demo history pack (12 months of bookings, payments and bills per demo property), so Reports and the UI-5 charts show real-looking history.
- [ ] 16 Rewards and the funnel report (wave 3)
