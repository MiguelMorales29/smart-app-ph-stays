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
- D8 Git: one prompt, one branch, one pull request. CI must be green before the founder merges. Agents never push to `main`. (The food app's later "push straight to main" rule is not used here.)
- D9 Copied from the food app (read-only reference, commit b34ca22): the shape of `tsconfig.base.json`, `pnpm-workspace.yaml` settings, `turbo.json`, the ESLint import walls, Prettier settings, the CI order, the API dev script, Vitest with `unplugin-swc` for the API. Written fresh: `AGENTS.md`, the docs, and no Supabase, demo emails or component exceptions.
- D10 `cacheComponents` is on in the storefront from the start, so every page is written for it.
- D11 Checking on a phone in phase 1: the dev servers listen on the Wi-Fi address and the phone opens `http://<mac-ip>:<port>`. Hosted preview links are decided in phase 3.
- D12 Docs: the Claude Doc is the master plan. `docs/blueprints/` holds dated Markdown snapshots of its tabs. Agents read a snapshot only when a prompt names it.
- D13 Tests: Vitest in each package (`--passWithNoTests` until a package has tests); the API uses `@nestjs/testing` with supertest. No Playwright until a phase needs it.
- D14 Approved packages for phase 1 (exact versions in the prompts): turbo, typescript, @types/node, eslint, @eslint/js, typescript-eslint, eslint-plugin-react-hooks, @next/eslint-plugin-next, prettier, vitest, zod, react, react-dom, @types/react, @types/react-dom, next, vite, @vitejs/plugin-react, @nestjs/common, @nestjs/core, @nestjs/platform-express, @nestjs/config, @nestjs/testing, reflect-metadata, rxjs, helmet, unplugin-swc, @swc/core, supertest, @types/supertest, @types/express.
- D15 P1-A install-day adjustments (2026-11-16): `typescript-eslint` pinned to `8.72.1` (instead of `8.72.2`) and `@next/eslint-plugin-next` pinned to `16.4.5` (instead of `16.4.6`) to satisfy `minimumReleaseAge: 10080`; `typescript` and `@types/node` (catalog) added to root `devDependencies` for `typescript-eslint`; `allowBuilds: {}` (no P1-A packages required build scripts).

## Open (not phase 1)

- O1 Where the owner landing page lives. The Feature blueprint says the bare domain `webserbisyo.com`, which may already serve the webserbisyo site. Decide in phase 9.
- O2 Hosted preview links for phone checks (Vercel previews or another host). Decide in phase 3.
- O3 Installed library components get their own folder and one relaxed lint and type rule set from the first install, instead of one exception per file as in the food app. Decide in phase 3.
