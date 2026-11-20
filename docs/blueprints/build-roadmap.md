# Build roadmap

16 November 2026

This tab is the order of work for building MVP A with an AI coder (Antigravity). It is general on purpose. A phase gets its detail only when its turn comes: Lex pastes the phase into the chat with Claude, they research and challenge it, and Claude writes the prompts for the AI coder. **Nothing in this tab has been built.**

## 1. The idea on one page

1. Build the screens first, on mock data, so every page can be seen and checked early.
2. Then build the real database and API for the same screens, and switch the mock data off.
3. Do this one wave at a time: wave 1 (booking a stay), wave 2 (rentals), wave 3 (rewards).

| Stage | Phases | What exists at the end |
| --- | --- | --- |
| A. Foundations | 1 to 3 | An empty but correct repository, the demo data, the look and the app frames. No real page yet |
| B. Wave 1 screens | 4 to 9 | Every wave 1 page, clickable on a phone, on mock data |
| Gate |  | Lex and a few real owners click through it; fixes are made; the wave 1 data shapes are frozen |
| C. Wave 1 for real | 10 to 14 | The same pages on the real database, with sign-in, files and notices; one pilot owner live |
| D. Waves 2 and 3 | 15 and 16 | Rentals, then rewards; each one screens first, then for real |
| Later |  | MVP B modules, one at a time |

## 2. What changed from the earlier tabs, and what did not

**Changed, decided by Lex on 16 November 2026:** the order of work inside a wave. The earlier tabs said database, then API, then screen, for each slice. Now the screens of a wave come first, on mock data.

**Also decided on 16 November 2026:** the page editor keeps its state (the draft, the selected part, the save status and Undo) in one Zustand store, with `zundo` for Undo and Redo. It is installed in phase 5, the food app's editor moves to it first, and API data never goes in a store. The Stack register and section 7a of the Feature blueprint record it.

**Why it can work here:** the Database blueprint is already final for the first launch, so the mock data can copy its shapes exactly.

**The risk:** the food app was also built screens first. When its code was read on 14 November 2026 (commit `df7c1b7`), its backend was still only sign-in and one migration. Rules 3 and 4 below exist so that does not happen again.

**Not changed:** the slices and waves in section 11 of the Feature blueprint, every rule in the AI handoff brief, and the meaning of done: a slice is done only when it runs on the real database.

## 3. Rules for every phase

1. Screens never import mock files. They ask `packages/data`, which answers from mock data now and from the API later.
2. Mock data uses the same Zod schemas the API will use, and the schemas are copied from the Database blueprint.
3. There are two labels. **UI approved** means the page works on mock data. **Done** means it works on the real database. Only Done counts as finished.
4. Screens run at most one wave ahead of the real backend.
5. Rules the database owns (no double booking, totals, stamps) are imitated simply in the mock data and labelled as imitations. They are not rebuilt in the browser.
6. One task, one branch, one pull request. The AI coder never pushes to main. Lex merges.
7. No new package without a line in the Stack register first: exact version, at least seven days old.
8. Components come only from the installed libraries, and are chosen in a page's own research pass, never earlier.
9. If a decision changes, the tab that holds it is updated before the code.
10. The MVP A scope is closed, and the six rules in section 12 of the Tours (MVP B) tab are followed.

## 4. How a phase runs

1. Lex copies the phase's section into the chat, using the template in section 7, and adds his own ideas and references.
2. Claude re-reads the tabs named under "Read first" and says plainly what it could not read.
3. Research: the official documents for anything being installed or built. For pages, the ten-step pass in section 11 of the Feature blueprint.
4. Claude challenges the plan: flaws, gaps, what to cut. The open questions are then settled. Lex has the final say.
5. Claude writes the prompts for the AI coder. One small task per prompt, each with what to read, the exact scope, what not to touch, the checks to pass, and when to stop and ask.
6. The AI coder builds on a branch and opens a pull request. Lex checks it on a phone against the checklist, and merges.
7. The phase is ticked in section 6, and any changed decision is written back to its tab.

## 5. The phases

Slice numbers are the ones in section 11 of the Feature blueprint.

### Stage A: Foundations (no database, no real backend)

#### Phase 1. Repository and stack

- **Goal:** an empty but correct monorepo that installs, runs and passes its checks.
- **Covers:** the new repository; pnpm and Turborepo; `apps/stays` (Next.js), `apps/dashboard` (Vite) and `apps/api` (NestJS, a health check only); empty `packages/core`, `packages/ui` and `packages/data`; shared TypeScript, lint and format settings; the unit test runner; the CI check; the rules file for AI coders and the `docs` folder; one placeholder page per app.
- **Not yet:** Supabase, migrations, sign-in, any feature, any component, any real page.
- **Read first:** Stack register (all); System blueprint, the repository layout table; AI handoff brief.
- **Settle with Claude:** the repository name; the folder name, `apps/stays` (System blueprint) or `apps/storefront` (Stack register); the NestJS shell now or later; whether Tailwind and the component installer are set up here or in phase 3; preview links for checking pages on a phone; what to copy from the food app's settings and what to write fresh; every version re-checked on install day.
- **Done when:** install, run and the full check pass on Lex's Mac and in CI; the three placeholder pages open; the API health address answers.
- **Settled on 16 November 2026** (decisions D1 to D14 in the repository's `docs/decisions.md`): repository `webserbisyo/smart-app-ph-stays`, private; folders `apps/storefront`, `apps/dashboard` and `apps/api` with the `@smartapp/*` scope; local ports 3100, 5174 and 4100 so it runs beside the food app; the NestJS shell now, with Terminus in phase 10; Tailwind and the component installer in phase 3; phone checks over the Wi-Fi now, hosted previews decided in phase 3; one branch and one pull request per prompt, merged only when CI is green.

#### Phase 2. Data shapes, demo data and the mock layer

- **Goal:** a pretend backend, so screens can be built before the real one.
- **Covers:** the Zod schemas for wave 1 in `packages/core`, copied from the Database blueprint; helpers for money in centavos and Manila dates; error codes; the four demo properties; `packages/data` as the one set of functions screens call, answered by mock data; a way to view the app as a guest, member, owner or super admin without sign-in; a way to switch scenarios (empty, busy, error, slow).
- **Not yet:** real API calls, Supabase, real sign-in.
- **Read first:** Database blueprint (wave 1 tables, life cycles, error codes); System blueprint, the mock data rules table; Feature blueprint sections 4 and 10.
- **Settle with Claude:** which tables the wave 1 screens need; where the mock data lives so that a booking made in the property app shows up in the dashboard (inside the browser, or served by the API shell); how much of each database rule the mock imitates; the demo properties' names and photos; how the view-as and scenario switches are kept out of the live build.
- **Done when:** a test reads and writes demo bookings through `packages/data` with no screen involved, and the two switches work on the placeholder pages.

#### Phase 3. Look and app frames

- **Goal:** the look and the frame of each app, before any page.
- **Covers:** design tokens (colour, type, spacing, corners); one or two fonts; how a property's own brand colours sit on top of ours; the frames for the property app, the owner dashboard (phone, tablet and desktop navigation) and the super admin; the shared states (loading, empty, error, offline); one strings file per app; the `/kit` page; a page index that lists every route for quick checking; the UI library families confirmed, with no single component chosen.
- **Not yet:** the content of any real page.
- **Read first:** Feature blueprint sections 2, 6 and 7a; Stack register sections 3 and 4; Knowledge base (the interface design rules).
- **Settle with Claude:** the brand direction for Stays and Rentals; light and dark; which component registries to keep; the accessibility floor; phone first at 360 pixels.
- **Done when:** every wave 1 route opens as an empty framed page with working navigation on a phone and a desktop, and `/kit` shows the tokens and the states.

### Stage B: Wave 1 screens on mock data

Every page in this stage gets the ten-step research pass before it is built. The label at the end of each phase is UI approved, not Done.

#### Phase 4. Owner start and listing (slices 1 and 2, screens)

- **Goal:** an owner applies, waits for approval, and sets up a property.
- **Covers:** owner sign-up, waiting and sign-in screens with no real sign-in behind them; adding a property, a unit, photos, prices and payment accounts.
- **Not yet:** real sign-in; real uploads.
- **Read first:** Feature blueprint sections 5 and 7 (owner dashboard); Database blueprint section 5 (Listing and Price).
- **Settle with Claude:** how short setup can be; photo rules; how prices for weekdays and special dates are entered.

#### Phase 5. Public pages and the page editor (slice 3, screens)

- **Goal:** a visitor opens the property and unit pages; the owner edits and publishes them.
- **Covers:** the property page and the unit page; the editor with brand, colours, sections, web address and the install look (app icon and opening screen); draft and publish; the editor's state in one Zustand store with zundo for Undo and Redo, while data from the API stays in TanStack Query.
- **Not yet:** real installing and push.
- **Read first:** Feature blueprint sections 7 (property app) and 7a (all); Stack register section 7 (Zustand).
- **Settle with Claude:** the sections offered at first launch; what the phone preview shows; how the install look differs on Android and iPhone.

#### Phase 6. Dates, price and holding a booking (slice 4, screens)

- **Goal:** a visitor picks dates, sees the price and holds them; the owner blocks dates and adds a booking by hand.
- **Covers:** date picking; the price breakdown; guest details; the hold and its countdown; the owner's calendar, blocks and manual bookings.
- **Not yet:** the real rule that two people can never hold the same night. It lives in the database (phase 10); here the mock only imitates it.
- **Read first:** Database blueprint section 4 and the Short stay tables in section 5; Feature blueprint sections 8 and 10.
- **Settle with Claude:** how date picking behaves on a phone; the least a guest must type; how the hold time is shown; the calendar for one unit and for many.

#### Phase 7. Conversation, payment proof and notices (slices 5 and 6, screens)

- **Goal:** the guest sends a proof of payment; the owner approves it; a receipt appears.
- **Covers:** the booking conversation; the proof card; the owner's approve and reject steps; the receipt; the notice settings; the install and allow-notices page; owner push campaigns (OW-29 to OW-31, decision O11: send, schedule, audience and limits, results).
- **Not yet:** real files, email or push (phase 12).
- **Read first:** Feature blueprint section 9 (all).
- **Settle with Claude:** what the owner sees first when a proof arrives; the wording of a rejection; what the receipt says; O11 (owner push campaigns: consent, send limit, what a notice carries, discounts as text or promo codes, which plan).

#### Phase 8. Daily work and members (slices 7 and 8, screens)

- **Goal:** the owner's everyday pages, and a guest who becomes a member.
- **Covers:** Home, the bookings board, guests and the activity list; joining with an email code (the screen only); a member's bookings; finding a lost booking link.
- **Read first:** Feature blueprint sections 4 and 7.
- **Settle with Claude:** what Home shows first on a phone; what a member gets that a guest does not.

#### Phase 9. Plans, super admin and the owner landing page (slices 9 and 10, screens)

- **Goal:** how an owner pays us, how Lex runs the platform, and the page that sells it.
- **Covers:** trial, plan payment with proof and the paused state; the super admin's approvals, plans, usage, health, audit and Pixel screens; the owner landing page with prices; the privacy page.
- **Not yet:** the real Pixel and Conversions API (phase 13).
- **Read first:** Feature blueprint sections 7 (super admin) and 10 (account states); the Meta Pixel, CAPI and super admin tab, section 6; System blueprint, pricing.
- **Settle with Claude:** the launch price and any founding-owner offer, because the landing page shows them; what the super admin needs on day one.

#### Gate: the wave 1 click-through

- Lex clicks the whole story on a real phone: an owner applies, is approved, lists a unit; a guest books and pays; the owner approves; the receipt appears.
- Three to five real owners try it. This is where the interviews in section 2a of the Feature blueprint happen, at the latest.
- The fix list is finished, the wave 1 schemas are frozen, and changed decisions are written back.
- Then stage C starts. Building wave 2 screens first instead is possible, but it breaks rule 4.

### Stage C: Wave 1 for real

#### Phase 10. Database, wave 1

- **Goal:** the real tables, rules and functions, with tests.
- **Covers:** the Supabase development project; migrations in the blueprint's order; security rules for every table; the SQL functions with their tests, starting with the no-double-booking rule; demo data loaded from the same demo files the mock used.
- **Read first:** Database blueprint (all).
- **Settle with Claude:** one Supabase project or two at this point; how database tests run in CI; who approves each migration.
- **Done when:** every database test passes, including two guests racing for the same night.

#### Phase 11. API and sign-in

- **Goal:** the pages talk to the real database through the API.
- **Covers:** the API contract, slice by slice; the NestJS modules; sign-in with an email code and the guest links; tests that one owner can never read another's data; rate limits; `packages/data` switched from mock to API, one slice at a time.
- **Read first:** Database blueprint (functions, error codes, security); Feature blueprint sections 4 and 10; AI handoff brief (the rules that do not bend).
- **Done when:** every wave 1 slice is Done, and its pages no longer use mock data.

#### Phase 12. Files, notices and timed jobs

- **Goal:** photos, proofs, emails, push and the jobs that run on a clock.
- **Covers:** safe uploads; the outbox; email; web push on both apps, tested on a real iPhone; the timed jobs (expiring holds, reminders, clean-up).
- **Read first:** Database blueprint (files, outbox, jobs); Feature blueprint section 9; Stack register section 7.
- **Settle with Claude:** the email provider; the push library; how long proofs are kept.

#### Phase 13. Plans, super admin and Meta for real

- **Goal:** Lex can approve owners and plan payments, and our ads can be measured.
- **Covers:** account approval and plan payments; usage and health; the consent bar; the Pixel on the landing, sign-up and setup pages; the Conversions API through its delivery queue; `/admin/pixels`.
- **Read first:** the Meta Pixel, CAPI and super admin tab (all).
- **Before it starts:** Lex creates the Meta Business account and the Pixel, verifies the domain and generates the token.

#### Phase 14. Hardening and pilot launch

- **Goal:** safe and fast enough for a real owner.
- **Covers:** the installable app and its offline frame; the security checklist; the speed budget; error and uptime alerts; backups and a live database kept apart from development; domains and deployment; the privacy and terms pages; the launch gates (NPC registration, Vercel's commercial terms, BIR and the business permit).
- **Read first:** System blueprint (security, hosting and launch sections); Knowledge base; Stack register section 9.
- **Done when:** one real owner takes one real booking.

### Stage D: Waves 2 and 3

#### Phase 15. Rentals (wave 2)

- **Goal:** long-term renting, from the first question to the monthly bill.
- **Covers:** inquiries and viewings; reserving a unit; leases and move-in; monthly bills with utility readings and rent payments; repair requests and the tenant's page; staff sign-ins; reports.
- **How:** the same loop in small: screens on mock data, a click-through, then the database and the API. It is split into its own phases when its turn comes.
- **Read first:** Database blueprint section 6; Feature blueprint, the Rentals features and the "Renting a unit" flow.

#### Phase 16. Rewards and the funnel report (wave 3)

- **Goal:** owners reward returning guests and good tenants, and see where bookings are lost.
- **Covers:** the stamp or points card for stays and for tenants; rewards and claims; the funnel report.
- **Read first:** Feature blueprint section 7c; Database blueprint (the rewards tables).

### Later: MVP B

Calendar sync, tours, a payment gateway and the other modules in section 3.4 of the System blueprint. One module at a time, each behind a per-owner switch. They are not planned in this tab.

## 6. Progress

| # | Phase | Status |
| --- | --- | --- |
| 1 | Repository and stack | Prompts written (P1-A, P1-B, P1-C), 16 November 2026 |
| 2 | Data shapes, demo data and the mock layer | Not started |
| 3 | Look and app frames | Not started |
| 4 | Owner start and listing | Not started |
| 5 | Public pages and the page editor | Not started |
| 6 | Dates, price and holding a booking | Not started |
| 7 | Conversation, payment proof and notices | Not started |
| 8 | Daily work and members | Not started |
| 9 | Plans, super admin and the owner landing page | Not started |
|  | Gate: the wave 1 click-through | Not started |
| 10 | Database, wave 1 | Not started |
| 11 | API and sign-in | Not started |
| 12 | Files, notices and timed jobs | Not started |
| 13 | Plans, super admin and Meta for real | Not started |
| 14 | Hardening and pilot launch | Not started |
| 15 | Rentals (wave 2) | Not started |
| 16 | Rewards and the funnel report (wave 3) | Not started |

## 7. Message template for starting a phase

```
PHASE <number>: <name>

<paste the phase's section from the Build roadmap tab>

My ideas so far:
- ...

References I like (links or screenshots):
- ...

Run the phase loop: re-read the tabs, research, challenge my ideas,
settle the open questions with me, then write the prompts for Antigravity.
```

## 8. Open points

1. Rule 4 puts wave 1's real backend before wave 2's screens. Lex can change this at the gate.
2. The price tiers and the founding-owner offer discussed on 16 November 2026 are not yet in the System blueprint. Phase 9 needs them.
3. The Supabase cost line in the System blueprint should be corrected to US$25 a month for Pro, as read on Supabase's pricing page on 16 November 2026.
4. Settled on 16 November 2026: the property app's folder is `apps/storefront` (decision D2), because it will hold stays, rentals and later tours.
5. The System blueprint's cost table names Resend Pro for email, but the Stack register says the provider is not chosen. Phase 12 settles it.
