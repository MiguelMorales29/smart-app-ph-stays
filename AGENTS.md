# AGENTS.md: Smart App PH Stays and Rentals

Smart App PH Stays and Rentals gives small Philippine property owners their own installable booking app. Guests book staycations (per night) and tenants rent rooms and apartments (per month). Owners run everything from a dashboard; the founder runs the platform from a super admin area. Tours come later (MVP B).

This file is the rule book for every AI coder in this repository. It stays short on purpose. The full plans are in `docs/blueprints/`; read one only when a prompt names it.

## Where we are

**Phase 4 of 16: owner start and listing (in progress; Phase 4.5 UX pass before P4-7).** Phases 1 to 3 are done: the demo world and data layer (Phase 2, `docs/demo-data.md`) and the look, components and app frames (Phase 3, `docs/ui-library.md`, `/kit` pages). No database and no real sign-in yet. The phases are in `docs/blueprints/build-roadmap.md`; progress is ticked in `docs/PROGRESS.md`.

Order of work (decided 2026-11-16): inside each wave, the screens are built first on mock data, then the real database and API for the same screens. A page on mock data is **UI approved**; it is **Done** only when it runs on the real database.

Decisions in `docs/decisions.md` override the blueprint snapshots in `docs/blueprints/`.

## Shape

- pnpm workspace + Turborepo. Node 24.14, TypeScript strict. Package scope `@smartapp/*`.
- `apps/storefront`: Next.js App Router. The guest-facing app (stays, rentals, later tours). Port 3100.
- `apps/dashboard`: Vite + React single-page app. Owner dashboard and super admin. Port 5174.
- `apps/api`: NestJS on Express, written by hand. Port 4100. Health check only in phase 1.
- `packages/core`: Zod schemas, types, money, dates, words, error codes, demo data. No React, no UI, no data fetching.
- `packages/ui`: design tokens, the one stylesheet, installed library components (from phase 3).
- `packages/data`: the only functions screens call for data. Mock adapters now, the API later.
- `tooling`: repo checks (lint-wall tests and scripts).
- `docs`: decisions, progress, changelog, prompts and the blueprint snapshots.

The ports differ from the food app (3000, 5173, 4000) so both can run at the same time.

## Commands

`pnpm install` · `pnpm dev` (all apps) · `pnpm check` (typecheck, lint, test) · `pnpm build` · `pnpm format` · `pnpm format:check`.

No Nest CLI and no `nest` commands: write NestJS files by hand.

## Hard rules

1. **Scope.** Do only the task in the prompt. If something has no clear place, or two documents disagree, stop and ask. Never pick one silently.
2. **Packages.** Exact versions, no `^` or `~`. A release must be at least 7 days old (`minimumReleaseAge` in `pnpm-workspace.yaml`) unless it is a security fix the founder approved. No new package without the founder's yes; every approved package is listed in `docs/decisions.md`. pnpm settings live in `pnpm-workspace.yaml` only; there is no `.npmrc`.
3. **Imports.** Apps never import each other. Only `apps/api` may import `@supabase/*` (from phase 10). `packages/core` imports no React, `@smartapp/ui` or `@smartapp/data`. `packages/ui` does not import `@smartapp/data`. Screens never import mock files. Never weaken `eslint.config.js` or a tsconfig to make a check pass; stop and ask instead.
4. **Types.** No `any`, no `as` casts, no `@ts-ignore`, `@ts-expect-error` or `@ts-nocheck`. Closed lists are `as const` arrays plus a Zod enum.
5. **Mock data.** Lives only in `packages/data/src/mocks` and `packages/core/src/demo`, typed by the Zod schemas in `packages/core`. Mock data may imitate a database rule but must say so in a comment; the real rule lives in the database.
6. **Money and time.** Money is whole centavos (integers). Dates are Manila calendar dates; times are shown in Manila time.
7. **Components (from phase 3).** For any UI work, load the skills in `.agents/skills/` (`smartapp-ui`, `smartapp-ui-writing`, `smartapp-ui-check`). Read `docs/ui-library.md` and inspect the `/kit` pages (`/kit` in dashboard and `/kit` in storefront) before building any UI. Follow the D34 layers: installed primitives stay in `packages/ui/src/components`, shared patterns live in `packages/ui/src/compositions`, and app-specific wrappers live in the app without copying components into `apps/*`. Use the planned library components and install anything missing with the shadcn CLI (`pnpm dlx shadcn@4.23.0`); if the planned libraries lack a piece, follow the sourcing order in the `smartapp-ui` skill (D60) and ask before adding another library or rebuilding one. Colours come only from theme tokens; `tooling/brand-guard.test.ts` fails CI on raw Tailwind colours or hard-coded colour values. **Every owner screen follows `docs/pattern-guide.md` (from Phase 4.5): its patterns, its motion rules (never remove content while it animates) and its definition of done (390 px with Safari's bars and 1280 px, light and dark, screenshots and recordings in the PR).** Before wiring an installed component, read how it animates, scrolls and shows selection.
8. **Backend (from phase 10).** Browser to NestJS API to Postgres. Screens never call Supabase. Only the founder applies migrations; never run a command that changes a hosted database.
9. **Secrets.** Never read, print or commit `.env*` files or keys. Only `.env.example` files are committed. Each app checks its environment with Zod at start.
10. **Git.** Work on the branch the prompt names, created from the latest `main`. Open the pull request yourself (`gh pr create --base main`), wait for the CI check with `gh pr checks --watch`, and when it is green merge it yourself with `gh pr merge --squash --delete-branch`, then `git checkout main && git pull`. If CI fails, fix it on the branch; never merge a red check. Never push directly to `main` and never force-push.
11. **Generated and build files.** Never edit `dist/`, `.next/`, lockfile entries by hand, or any build output to make a check pass.

## Every task

1. Read this file, then only the files the prompt names.
2. Post a short plan (files, commands, the flags of any scaffolder after reading its `--help`) and wait for the founder's OK.
3. Build in small commits: `chore(p1a): ...`, `feat(p1b): ...`.
4. Before the pull request: `pnpm install --frozen-lockfile`, `pnpm format:check` and `pnpm check` pass. Run `pnpm build` too unless the prompt says CI will do it.
5. Update `docs/PROGRESS.md` (tick the task), add one line to `docs/CHANGELOG.md`, and add any decision the founder approved to `docs/decisions.md`.
6. Finish with: what changed, how the founder tests it, what the founder must do by hand, and the merged pull request link.

## If something fails

Read the current official documentation for that tool, use the closest correct fix, and say exactly what you changed and why. If the fix needs a new package, a looser rule or a different version than the prompt says, stop and ask first. The founder's Mac runs macOS 12.7 on Node 24.14.0: if a tool will not run there, stop and report it rather than working around it.
