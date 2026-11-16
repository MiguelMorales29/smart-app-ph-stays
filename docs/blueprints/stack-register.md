# Stack and dependency register

What this system uses, with exact versions. The food app's versions were checked on 14 November 2026 against its `package.json` files and the `catalog` in `pnpm-workspace.yaml`, and they match. Anything marked *planned* is not yet installed. No individual UI component is researched here; component choices come later.

**Phase 1 versions, checked on 16 November 2026** (newest release at least 7 days old): pnpm 12.18.0, Turborepo 2.11.10, TypeScript 6.0.3 (typescript-eslint 8.72 still supports only below 6.1), Next.js 16.4.6, Vite 8.3.7, React 19.3.1, NestJS 12.4.2, ESLint 10.14.0, Prettier 3.9.10, Vitest 5.1.0, Zod 4.6.7, `@types/node` 24.19.2. The repository's `docs/decisions.md` is the record of what was installed. Tailwind, the component libraries and Supabase are installed in their own phases, not in phase 1.

## 1. Runtime and tooling (carried over)

| Item | Version | Where it is pinned | Use |
| --- | --- | --- | --- |
| Node.js | 24.14 (engines `>=24.14 <25`) | root `package.json` | Runtime for every app |
| pnpm | 12.8.1 | `packageManager` | Package manager, workspaces |
| Turborepo | 2.11.7 | root `package.json` | Task runner and build cache |
| TypeScript | 6.0.3 | `catalog` | Language, all tiers |
| ESLint | 10.12.0 | catalog | Lint, including module-wall rules |
| Prettier | 3.9.10 | catalog | Formatting |
| Vitest | 5.0.3 | catalog | Unit tests |
| Playwright | 1.64.1 | tooling | End-to-end smoke tests |
| Supabase CLI | 2.120.0 | catalog | Migrations and types |
| shadcn | 4.21.4 | dev dependency | Component installer for `packages/ui` and the dashboard |

**TypeScript settings carried over** (`tsconfig.base.json`): `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` and `verbatimModuleSyntax` are all on; target ES2022; NodeNext modules.

**CI carried over** (`.github/workflows/check.yml`), in order: install with a frozen lockfile, audit of production dependencies, format check, typecheck with lint and tests, build, the storefront JavaScript budget, and a scan of the build output for demo emails, the `/kit` route and localhost addresses.

## 2. Frameworks and libraries (carried over)

| Item | Version | Used in | Use |
| --- | --- | --- | --- |
| Next.js | 16.4.2 | `apps/storefront` | Property app (server rendering, pages) |
| Vite | 8.3.4 | `apps/dashboard` | Owner and admin dashboard (single-page app) |
| React | 19.3.0 | catalog | UI |
| Tailwind CSS | 4.3.3 | storefront, dashboard, `packages/ui` | Styling |
| @tailwindcss/vite | 4.3.3 | dashboard | Tailwind plugin for Vite |
| @vitejs/plugin-react | 6.1.2 | dashboard | React plugin for Vite |
| Serwist | 9.5.13 (with `@serwist/turbopack` 9.5.13) | storefront | Service worker, offline shell, push |
| TanStack Router | 1.170.42 | dashboard | Routes |
| TanStack Query | 5.104.1 | dashboard, storefront | Server state and cache |
| NestJS core | 12.1.2 (Express) | `apps/api` | API tier |
| @nestjs/config | 12.0.1 | `apps/api` | Settings from the environment |
| @nestjs/terminus | 12.1.0 | `apps/api` | Health checks |
| Helmet | 8.3.0 | `apps/api` | Security headers |
| jose | 6.2.12 | `apps/api` | Token verification |
| supabase-js | 2.117.3 | `apps/api`, `packages/data` | Database and storage client (API only) |
| @supabase/ssr | 0.12.7 | food app | Session handling for Supabase auth |
| Zod | 4.6.6 | catalog | One set of schemas for input checks, types and fixtures |
| React Hook Form | 7.89.0 | dashboard, storefront | Forms |
| @hookform/resolvers | 5.9.1 | forms | Connects Zod to React Hook Form |
| date-fns | 4.4.0 | catalog | Date arithmetic |
| @date-fns/tz | 1.5.0 | catalog | Manila time zone |
| class-variance-authority | 0.7.1 | `packages/ui` | Component variants |

## 3. UI libraries (carried over, families only)

These are the families the food app installed. Each one is confirmed again before use; no component is chosen here.

| Family | Packages and versions | Notes |
| --- | --- | --- |
| Base UI | @base-ui/react 1.9.0 | Unstyled accessible primitives |
| Icons | lucide-react 1.55.0; simple-icons 16.36.0 | Icons; brand marks |
| Charts | recharts 3.8.0 | Owner reports |
| Tables | @tanstack/react-table 9.3.1; @tanstack/react-virtual 3.14.22 | Long lists |
| Motion | motion 14.3.0 | Animation; respect reduced motion |
| Carousel | embla-carousel-react 8.6.0 | Photo galleries |
| Calendar | react-day-picker 10.0.2 | Date picking for stays |
| Drag and drop | @dnd-kit/core 6.3.1 | Sorting photos and units |
| One-time codes | input-otp 1.5.0 | Email code entry |
| Celebration | canvas-confetti 1.9.4 | Booking confirmed (optional) |
| QR codes | qrcode 1.5.4 | Check-in and share |
| Avatars | @dicebear/core and adventurer 9.4.3 | Default avatars |
| Colour | @material/material-color-utilities 0.4.0 | Palette generation |
| Animation utilities | tw-animate-css 1.4.0 | Tailwind animation classes |
| Checkbox group | @diceui/checkbox-group 1.0.0 | Multi-select |

Component registries used by the food app's `components.json` files: @reui, @diceui, @magicui, and @evilcharts (only in `packages/ui`). Style base-nova, icon library lucide.

## 4. Fonts (carried over)

Variable font packages from Fontsource: Baloo 2, Bricolage Grotesque, DM Sans, Figtree, Fraunces, Fredoka, Manrope, Nunito, Outfit, Playfair Display, Plus Jakarta Sans, Sora, and Young Serif. For this system we keep one or two faces and drop the rest, so the page weight stays inside budget.

## 5. Overrides (security patches)

fast-uri 3.1.9, body-parser 2.4.0, multer 2.5.0, qs 6.16.1, seroval 1.6.11, seroval-plugins 1.6.11. Each override is recorded with its reason. Remove one when the parent package ships the fix.

## 6. Supply-chain rules (carried over)

- `minimumReleaseAge` 10080 minutes (7 days): a new release is not installed until it is a week old.
- `engineStrict` true: install fails on the wrong Node version.
- Exact versions in the catalog; lockfile committed; audit runs in CI.

## 7. Additions planned for this system (need approval)

| Item | Why | Status |
| --- | --- | --- |
| NestJS rate limiter (`@nestjs/throttler`) | Per-route limits (API4), login and hold limits (API6) | Planned; version not chosen |
| Email sending (provider not chosen) | Booking and rent emails through the outbox | Planned |
| Web push library (`web-push` or equivalent) | Push from the outbox worker | Planned; iOS needs a Home Screen install |
| Meta Conversions API calls (direct HTTPS) | Server events with deterministic IDs | Planned; no SDK |
| PostgreSQL extension `btree_gist` | Needed for the overlap exclusion constraint | Planned; enabled in the migration |
| Zod-to-OpenAPI or similar | Keeps `docs/api.md` in step with the schemas | Idea only |
| Zustand, with zundo | Page editor state: draft, selection, save status, Undo and Redo (50 steps) | Planned, decided 16 November 2026; editor only; exact version chosen at install, after the food editor moves to it |

Checked on 14 November 2026: the food app's API has no rate limiter installed, so `@nestjs/throttler` is a true addition. Its limits are kept in memory by default, which is correct only while one API instance runs.

**Added on 14 November 2026, from the Database and Feature blueprints.** Each needs your yes before it is installed.

| Addition | Why | Status |
| --- | --- | --- |
| `@serwist/vite`, with `@serwist/window` | Offline support and push for the Vite dashboard. The food app only has Serwist for Next.js | Approved on 14 November 2026; exact version chosen at install. Serwist's guide shows a service worker we write ourselves but no push example, so push in the dashboard is unproven until slice 6 |
| `@nestjs/schedule` | Timed jobs inside the API: expire holds, issue rent bills, send reminders, delete old proofs | Approved on 14 November 2026; exact version chosen at install |
| An uptime check | Tells us when the API is down | Chosen: Sentry's one free uptime check on the API's health address |
| An error-alert tool | Tells us when the API throws errors | Chosen: Sentry's free Developer plan (one user, 5,000 errors a month) |

Charts need no addition. Reports use the EvilCharts registry already set up in `packages/ui`.

**Zustand: decided on 16 November 2026, for the page editor only.** The editor holds a large draft, a 50-step Undo history, the selected part, the save status and the preview link, all in the browser and shared by many components. Zustand keeps them in one store and re-renders only what changed; `zundo` adds Undo and Redo on top. Everything that comes from the API stays in TanStack Query, and forms stay in React Hook Form: a store never holds a copy of server data. The food app's editor moves to it first, while that app is still front end only, and this app reuses that engine whole (decision E2).

## 8. Dependency rules for this system

1. Every new dependency is written in this register with its version, reason and licence before it is added.
2. Prefer what the food app already uses. A new family needs a reason no existing package covers.
3. No screen imports a mock, and no package is added to the screens only for a fixture.
4. Each added version is at least seven days old, as the food app's setting requires.
5. Licences are checked; the register records each one.

## 9. Hosting

| Service | Role | Plan facts | Status |
| --- | --- | --- | --- |
| Vercel | Property app and dashboard | The pricing page lists Pro at US$20 a month with US$20 usage credit and developer seats at US$20 each. It does not state whether the free Hobby plan may be used commercially. | Launch gate: confirm commercial terms before live use |
| Railway | API and outbox worker | Priced by usage | Cost figure in the proposal is a planning estimate |
| Supabase | Postgres, storage, auth | Two projects, one for development and one for live | Plan check before launch |

## 10. Checked and not covered

- Individual shadcn components: not researched, by request.
- Licence text for each library: not read yet; the register records the licence field only where the package states it.
- The food app's own `docs/` pages (`components.md`, `decisions.md`) were not used as sources for versions; the versions come from the package files.
