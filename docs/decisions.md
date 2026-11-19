# Decisions

Current decisions only, one line each, newest at the bottom of its section. Product and data decisions live in the blueprints (`docs/blueprints/`); this file holds the build decisions made in this repository. When a decision here changes a blueprint, the Claude Doc is updated too.

## Phase 1 (founder with Claude, 2026-11-16)

- D1 Repository `webserbisyo/smart-app-ph-stays`, private. One repository for the whole product (stays, rentals, later tours).
- D2 Folders `apps/storefront` (guest-facing app, called "property app" in the blueprints), `apps/dashboard` (owner and super admin), `apps/api`. Package scope `@smartapp/*`, the same as the food app, so its patterns carry over. The name `storefront` describes the role, not one listing type; it replaces `apps/stays` in the System blueprint.
- D3 Local ports 3100 (storefront), 5174 (dashboard), 4100 (API), so this repo runs beside the food app (3000, 5173, 4000).
- D4 The NestJS API exists from phase 1 as a shell: environment check with Zod, helmet, CORS for the two local apps, `GET /health`. No Nest CLI. Terminus is added in phase 10, when the health check has a database to check.
- D5 Tailwind CSS, the shadcn CLI, fonts, design tokens, the Prettier Tailwind plugin and the CSS lint walls are set up in phase 3, together with the look. Phase 1 pages are unstyled.
- D6 TanStack Router and Query, React Hook Form and the dashboard routes arrive in phase 3 (app frames). The Supabase CLI and `supabase/` arrive in phase 10.
- D7 Versions: the newest stable release at least 7 days old, pinned exactly, re-checked on install day. TypeScript stays on 6.0.x while typescript-eslint supports only `<6.1`. `@types/node` follows Node 24. Node is pinned to 24.14.0 (founder's Mac, macOS 12.7).
- D8 Git: one prompt, one branch, one pull request. The agent merges its own pull request only after CI is green (founder, 2026-11-16). Nothing is pushed straight to main.
- D9 Copied from the food app (read-only reference, commit b34ca22): the shape of `tsconfig.base.json`, `pnpm-workspace.yaml` settings, `turbo.json`, the ESLint import walls, Prettier settings, the CI order, the API dev script, Vitest with `unplugin-swc` for the API. Written fresh: `AGENTS.md`, the docs, and no Supabase, demo emails or component exceptions.
- D10 `cacheComponents` is on in the storefront from the start, so every page is written for it.
- D11 Checking on a phone in phase 1: the dev servers listen on the Wi-Fi address and the phone opens `http://<mac-ip>:<port>`. Hosted preview links are decided in phase 3.
- D12 Docs: the Claude Doc is the master plan. `docs/blueprints/` holds dated Markdown snapshots of its tabs. Agents read a snapshot only when a prompt names it.
- D13 Tests: Vitest in each package (`--passWithNoTests` until a package has tests); the API uses `@nestjs/testing` with supertest. No Playwright until a phase needs it.
- D14 Approved packages for phase 1 (exact versions in the prompts): turbo, typescript, @types/node, eslint, @eslint/js, typescript-eslint, eslint-plugin-react-hooks, @next/eslint-plugin-next, prettier, vitest, zod, react, react-dom, @types/react, @types/react-dom, next, vite, @vitejs/plugin-react, @nestjs/common, @nestjs/core, @nestjs/platform-express, @nestjs/config, @nestjs/testing, reflect-metadata, rxjs, helmet, unplugin-swc, @swc/core, supertest, @types/supertest, @types/express.
- D15 P1-A install-day adjustments (2026-11-16): `typescript-eslint` pinned to `8.72.1` (instead of `8.72.2`) and `@next/eslint-plugin-next` pinned to `16.4.5` (instead of `16.4.6`) to satisfy `minimumReleaseAge: 10080`; `typescript` and `@types/node` (catalog) added to root `devDependencies` for `typescript-eslint`; `allowBuilds: {}` (no P1-A packages required build scripts).
- D16 P1-B install-day adjustments (2026-11-16): `next` pinned to `16.4.5` (instead of `16.4.6`) to satisfy `minimumReleaseAge: 10080`; `agentRules: false` added to `apps/storefront/next.config.ts` so `next dev` does not generate `apps/storefront/AGENTS.md`; `allowBuilds: { '@swc/core': true }` added in `pnpm-workspace.yaml` for `@swc/core@1.16.22`; `apps/api/tsconfig.json` covers `src`, `test`, and `vitest.config.ts` without `rootDir` (`rootDir: "src"` and test excludes live in `apps/api/tsconfig.build.json`).
- D17 The lint walls are proven by `tooling/lint-walls.test.ts`; a new wall needs a new case in the same pull request.

## Phase 2 (founder, 2026-11-17)

- D18 Demo accounts on live, fenced. Demo rows live only in accounts with `is_demo = true`, and every demo id starts with `dec0de`. The seed refuses any other id, and writing to live needs an explicit `--live` flag. Demo accounts are never billed, paused, counted in platform totals, sent to Meta, or emailed (the outbox drops them). Their pages are noindex and show a "Demo · not a real property" ribbon. Their payment accounts are `is_sample`. Only allow-listed test emails can finish a booking; others see "This is a demo" with a sign-up link. The CI rule is "no demo row outside a demo account", not "no demo data on live".
- D19 The mock lives in packages/data as a memory adapter behind one DataSource interface. Screens call packages/data only. The HTTP adapter and NestJS endpoints come in Phase 11 behind the same interface. The seed runs through the API's services from Phase 10.
- D20 Demo ids are literal UUIDs written once and committed, identical in every environment.
- D21 The demo world is built from an injectable Manila clock with dates relative to today. Golden test clock: 2026-12-10T10:00:00+08:00.
- D22 Manila time uses the built-in Intl API (Asia/Manila) and the +08:00 offset; no date library in Phase 2.
- D23 Demo media lives in apps/storefront/public/demo-media and is served at /demo-media. Photos stay 4:3; screens crop with CSS. Screens get image URLs only from packages/data. On live, the seed uploads the same files to Supabase Storage. Reserve slug `demo-media` (Prompt C adds it to the reserved-slug list).
- D24 A bed space is one unit per bed ("Room 2A · Bed 1") until O4 is decided.
- D25 Demo packs: marketing (the only pack allowed on live), qa (development only), empty, busy.
- D26 Subscription moves added: trial → paused (system) and cancel by super admin. The blueprint's section 9 did not cover a trial ending unpaid.
- D27 File purposes guest_id and data_export added; booking_guests.id_file_id and data_exports.file_id point to files.
- D28 Slugs are 3 to 40 characters; the Database blueprint's 60 is changed to 40.
- D29 On payment_accounts, bank (from BANKS) replaces bank_name as the required field when method is bank; bank_name is kept only as an optional label, required when bank is "other".
- D30 threads.inquiry_id and lease_id stay nullable uuids ready for wave 2; createInquiry and BK-10 move to wave 2 with RN-01 because the inquiries table is wave 2.
- D31 Page look gains accentColor, for the 60/30/10 rule in OW-11.
- D32 Font pairs gain unbounded-plus-jakarta and young-serif-plus-jakarta (10 pairs in total); Bahay Batis and Tita Lorna's Dorm use them, closing O6. Installing the Unbounded and Young Serif font packages waits for Phase 3.
- D33 Approving a GCash, Maya or bank payment without wallet_checked returns not_allowed with details { reason: "wallet_not_checked" }, keeping the 7 blueprint error codes.

## Phase 3 (founder, 2026-11-18)

- D34 Component layers: library components are installed once in packages/ui/src/components, changed only by shared variants. Each app's look comes from CSS variables. Different behaviour means a component in that app that wraps the shared one. Never copy a component into an app. An app component both apps need moves to packages/ui. Business rules stay in packages/core and packages/data. Three kits: base, dashboard and storefront.
- D35 Platform theme: Smart App PH logo colours (Smart Blue primary, Growth Mint accent, navy ink); cool navy-tinted neutrals; dark mode in layers (sidebar darkest, page, card, raised), never pure black, off-white text; status colours green done, amber waiting, blue in progress, red problem, grey finished, always with an icon and a word; mint never means status; one font, Plus Jakarta Sans. On `--primary-tint`, text uses `--primary-hover` or `--foreground` (light `--primary` on `--primary-tint` is 4.23:1).
- D36 The dashboard and admin have light, dark and system, kept on the device; the storefront is light only.
- D37 Font pair ids follow the Feature blueprint: malinaw, friendly, street, cafe, elegant, bakery, playful, modern, plus bold (Unbounded + Plus Jakarta Sans) and homey (Young Serif + Plus Jakarta Sans). Ulap Suites cafe, Bahay Batis bold, Ilaw Residences modern, Tita Lorna's Dorm homey.
- D38 Hosted previews: two Vercel projects set up by hand (`smart-app-ph-stays-storefront` with root `apps/storefront`, `smart-app-ph-stays-dashboard` with root `apps/dashboard`, Node.js 24.x, `APP_ENV=preview`, `DATA_SOURCE=memory`, Vercel Authentication disabled). Updated 2026-11-18: Vercel's Production branch tracks `main`, so every merge to `main` refreshes the short links `https://smart-app-ph-stays-storefront.vercel.app` and `https://smart-app-ph-stays-dashboard.vercel.app`. Vercel calls these deploys "Production", but they still run `APP_ENV=preview` on sample data; the real production environment and domain come in Phase 14. The empty `production` branch is unused and may be deleted (closes O2).
- D39 Installed components live in packages/ui/src/components with one relaxed lint and type block for that folder only (closes O3).
- D40 Screenshot tests: Playwright screenshots of the three kits (light, dark, the four demo brands + worst-case look, 360 and 1280 px) plus `/home`, `/ulap-suites`, and `/admin` run in CI (`Screenshots` job); baselines come only from the CI "Update screenshots" workflow, never from a laptop.
- D41 shadcn base-nova on Base UI is the base; Dice UI items are added one at a time; ReUI, Magic UI and EvilCharts registries are configured but nothing is installed until a page's research step picks it; no paid (Pro) item, ever.
- D42 Developer switches are a floating "Preview" pill in the bottom-right corner (above the phone dock and the storefront action bar) that opens a themed panel, shared as `DevSwitchPanel` in `packages/ui/src/compositions`. It never takes layout space and is never covered by the sidebar. `?clean=1` hides it for the browser tab (screen recordings), `?clean=0` brings it back. On sample data the pill replaces the full-width preview ribbon; the ribbon returns only for previews on real data (Phase 10+).
- D43 Banners use the D35 status tokens (`--info-tint`, `--success-tint`, `--warning-tint`, `--danger-tint` with `--foreground` text and a status-coloured icon), never raw Tailwind palette colours. Frosted glass mixes the background with transparent in sRGB, not OKLCH (OKLCH tinted the glass brown).
- D44 UI rules live as three workspace skills in `.agents/skills/` (Antigravity's workspace skill folder; `.claude/skills` is a link to it for Claude Code): `smartapp-ui`, `smartapp-ui-writing`, `smartapp-ui-check`. They point to `docs/design-tokens.md`, `docs/ui-library.md` and this file instead of copying them, so there is one source of truth. They are enforced by `tooling/brand-guard.test.ts` (in `pnpm check`) and by the responsive UI scan `tooling/e2e/ui-scan.e2e.ts`, which runs in the Screenshots CI job on every pull request and uploads the `ui-scan-report` artifact. Corner radius stays `--radius: 0.625rem` (10 px), the value in the code since P3-A.
- P3-A approved packages (2026-11-18): `tailwindcss@4.3.5` (MIT), `@tailwindcss/postcss@4.3.5` (MIT), `@tailwindcss/vite@4.3.5` (MIT), `@base-ui/react@1.9.0` (MIT), `@base-ui/utils@0.5.0` (MIT, needed directly by `@diceui/banner`), `cn@0.5.2` (MIT, catalog; replaces separate `clsx` + `tailwind-merge`), `lucide-react@1.71.0` (ISC, catalog; `1.74.0` skipped under `minimumReleaseAge`), `class-variance-authority@0.7.1` (Apache-2.0), `tw-animate-css@1.4.0` (MIT), `@fontsource-variable/plus-jakarta-sans@5.3.0` (OFL-1.1); `shadcn@4.23.0` (MIT) run only via `pnpm dlx`.
- P3-B approved font packages (2026-11-18): `@fontsource-variable/fredoka`, `nunito`, `bricolage-grotesque`, `dm-sans`, `fraunces`, `figtree`, `playfair-display`, `manrope`, `baloo-2`, `sora`, `outfit`, `unbounded` and `@fontsource/young-serif` (all `5.3.0`, OFL-1.1), loaded only via `packages/ui/src/styles/property-fonts.css` for the storefront so the dashboard CSS stays platform-font only.
- P3-D approved packages (2026-11-18): `@tanstack/react-router@1.170.46` (MIT, catalog; code-based routes, no router plugin), plus `lucide-react` (`catalog:`) in `apps/dashboard`.
- P3-E approved packages (2026-11-18): `@playwright/test@1.65.0` (Apache-2.0, `tooling` devDependencies, catalog; `1.65.1` skipped under `minimumReleaseAge`), Chromium only.

## Phase 4 (founder, 2026-11-18)

Approved from the Phase 4 plan (Claude Doc, "Phase 4 plan" tab).

- D45 Error reasons: the 7 error codes stay. A closed list of 15 reasons (`invalid_input`, `slug_taken`, `slug_reserved`, `slug_change_limit`, `email_taken`, `unit_limit`, `storage_full`, `file_too_large`, `not_image`, `last_payment_method`, `bank_limit`, `changed_elsewhere`, `wrong_password`, `unit_not_ready`, plus D33's `wallet_not_checked`) and per-field errors go in `details`. Bad input to any operation returns an error result, never throws.
- D46 Forms use React Hook Form 7.89.0 with @hookform/resolvers 5.9.1. TanStack Query 5.104.1 moves forward from Phase 5 to Phase 4. Data hooks live in `apps/dashboard/src/data/<area>/` (keys, reads, writes), one automatic retry; instant updates with Undo only for switches, reordering, archiving and removing photos.
- D47 Approval blocks going live, not setting up. Pending owners can set up everything; publishing waits for approval.
- D48 Setup is six steps plus Review. Photos and payment can wait; publishing arrives with the Phase 5 editor.
- D49 Photos: JPEG, PNG or WebP (HEIC is converted by the phone's picker), up to 15 MB in, shrunk to 1,600 px; at least 3 to list a unit; up to 20 per unit and 10 per property; warn under 1,024 px, refuse under 600 × 400; Move buttons beside drag.
- D50 Prices are typed in pesos only: base, weekday price (Friday and Saturday preset), special dates with holiday chips, and a 14-night preview.
- D51 Bed spaces are created in bulk and grouped by room (`units.group_label`).
- D52 Navigation: the phone dock stays; settings is a list then a page, two panes from 1,024 px; short tasks open in sheets kept in the address; swipe-back only in the installed iPhone app; no page swiping.
- D53 Motion is CSS and View Transitions in Phase 4 (no `motion` package); one celebration with canvas-confetti; duration and easing tokens; reduced motion enforced by one global rule.
- D54 Icons are Lucide plus `@lucide/lab` only. Milestone pictures are Microsoft Fluent Emoji 3D (MIT) on token-coloured discs. No Storyset, unDraw, DrawKit, Lottie or Rive.
- D55 Phase 4 install list: shadcn field, label, textarea, input-group, native-select, radio-group, checkbox, switch, toggle, toggle-group, tabs, dialog, alert-dialog, progress, card, item, table, popover, calendar; ReUI stepper, sortable, number-field; Dice UI file-upload, mask-input, responsive-dialog, circular-progress. Never `@reui/alert`, `@reui/badge`, `sonner` or `vaul`. No Magic UI or Aceternity in Phase 4.
- D56 Check-in and check-out times are property-level and set in Policies; `/settings/hours` is reply and viewing hours.
- D57 `properties.status = published` decides whether the public page shows; publishing is refused while the account is pending.
- D58 Owners can sign up and sign in with Google as well as email and password. Phase 4 shows "Continue with Google" on `/signup` and `/login` and imitates it on the memory data layer; the real Google sign-in arrives with real sign-in in Phase 11. Google applicants still answer sign-up steps 2 and 3 and wait for approval.
- D59 Default avatars come from DiceBear (`@dicebear/core` plus one CC0 style, Notionists unless the kit review picks another CC0 style), generated in the app, never through DiceBear's online API, with background colours from our tokens. Stored as `profiles.avatar = { kind: "preset", preset_id: "notionists-<seed>" }`; no schema change. Installed in P4-2 after the founder's yes on the exact versions.
- D60 Sourcing order for a component the planned libraries lack: (1) shadcn, ReUI or Dice UI; (2) another free library item that works on Base UI (or uses no Radix), has an open licence (MIT, Apache-2.0, ISC or CC0) and does not need `motion`, proposed to the founder first; (3) last resort, rebuild it as a composition from our installed parts and tokens, using the reference only as a picture (screenshots, sizes, behaviour). Never copy code from paid ("Pro") items or sites without an open licence, never scrape a site's code or compiled CSS. Open-licence code may be read and adapted with its licence notice kept in the file.
- Sign-up answers (what they rent, counts, city, Facebook page) are stored in one `owner_applications` record per account, so the super admin screen (Phase 9) reads it as a whole. Wave 1 now has 49 tables.
- P4-0 approved packages (2026-11-20, `apps/dashboard` only): `react-hook-form@7.89.0` (MIT), `@hookform/resolvers@5.9.1` (MIT), `@tanstack/react-query@5.104.1` (MIT).
- Test packages approved for Phase 4: `@axe-core/playwright@4.14.0` (P4-1); `@testing-library/react@16.3.3`, `@testing-library/user-event@14.6.9`, `@testing-library/jest-dom@7.0.1`, `jsdom@31.0.0` (P4-8). Each is listed with its licence when installed.

### P4-1 approved packages

- `@axe-core/playwright@4.14.0` (MPL-2.0) in `tooling` devDependencies only for automated accessibility checks in `tooling/e2e/ui-scan.e2e.ts`.

- P4-2 approved packages (2026-11-20, all in `packages/ui`): `react-day-picker@10.0.2` (MIT), `date-fns@4.4.0` (MIT), `@dnd-kit/core@6.3.1`, `@dnd-kit/sortable@10.0.0`, `@dnd-kit/utilities@3.2.2` (MIT), `@lucide/lab@0.12.0` (ISC), `canvas-confetti@1.9.4` (ISC) with `@types/canvas-confetti@1.9.0` (MIT, dev), `@dicebear/core@9.4.2` (MIT) and `@dicebear/notionists@9.4.2` (MIT code, CC0 1.0 artwork). `@dicebear/styles` was not used (every style in one 7.7 MB package).

- P4-3 (2026-11-20): the contract gains `listPlans` (public: plan name, price, included units, trial days, for the sign-up sell panel and later the owner landing page), `requestSignupCode` and `verifySignupCode` (public; the sign-up email check, demo code 123456), and `applyAsOwner.placeName` (becomes the account name). Real enforcement that an application's email was verified moves to the API in Phase 11.

## Open (not phase 1)

- O1 Where the owner landing page lives. The Feature blueprint says the bare domain `webserbisyo.com`, which may already serve the webserbisyo site. Decide in phase 9.
- O2 ~~Hosted preview links for phone checks (Vercel previews or another host). Decide in phase 3.~~ Closed in D38.
- O4 How bed spaces count toward the plan's 5 included units. Each bed is a unit (D24), so a 12-bed dorm would pay ₱599 + 7 × ₱100 = ₱1,299 a month. Decide before the pilot; it shows on the units page (P4-5).
- O5 Day-use stays (for example a Pansol day swim, 8 am to 5 pm) have no model.
- O7 Check that the five demo brand names are not real businesses before public videos.
- O8 The RA 9653 rent cap is extended only to 31 December 2026; the lease warning must be easy to change.
- O9 What the waiting-for-approval screen promises about time ("usually within 1 working day" or nothing). Decide before P4-3.
- O10 Whether to add a refundable security-deposit fee type. Decide before P4-6.
