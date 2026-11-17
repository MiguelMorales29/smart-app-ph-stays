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

## Open (not phase 1)

- O1 Where the owner landing page lives. The Feature blueprint says the bare domain `webserbisyo.com`, which may already serve the webserbisyo site. Decide in phase 9.
- O2 Hosted preview links for phone checks (Vercel previews or another host). Decide in phase 3.
- O3 Installed library components get their own folder and one relaxed lint and type rule set from the first install, instead of one exception per file as in the food app. Decide in phase 3.
- O4 How bed spaces count toward the plan's 5 included units.
- O5 Day-use stays (for example a Pansol day swim, 8 am to 5 pm) have no model.
- O7 Check that the five demo brand names are not real businesses before public videos.
- O8 The RA 9653 rent cap is extended only to 31 December 2026; the lease warning must be easy to change.
