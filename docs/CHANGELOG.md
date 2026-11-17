# Changelog

One line per merged task, newest at the bottom.

- 2026-11-16 Starter docs: AGENTS.md, decisions, progress, blueprint snapshots, phase 1 prompts.
- 2026-11-16 P1-A Root workspace, Turborepo, TypeScript, ESLint import walls, Prettier, Vitest, `@smartapp/{core,data,ui}`, and CI check workflow.
- 2026-11-16 P1-B Added `@smartapp/storefront` (Next.js), `@smartapp/dashboard` (Vite + React), and `@smartapp/api` (NestJS shell with `/health` and e2e test).
- 2026-11-16 P1-C Added `@smartapp/tooling` lint-wall tests, CI production build address scan, and root `README.md`.
- 2026-11-17 P2-A Moved demo media to `apps/storefront/public/demo-media/`, added `docs/demo-media-manifest.csv` and `tooling/check-demo-media.test.ts`, and recorded Phase 2 decisions (`D18`–`D25`, `O4`–`O8`).
- 2026-11-17 P2-B Added `@smartapp/core` primitives (`money`, `time`, `errors`, wave 1 `lists`, `lifecycles`, `ids`, and `words` error/bank copy) with unit tests and recorded `D26`–`D27`.
- 2026-11-17 P2-C Added 48 Wave 1 table row schemas, view schemas, 45-operation contract, `quoteStay` calculator with 16 golden cases, `RESERVED_SLUGS`, and recorded `D28`–`D30`.
- 2026-11-17 P2-D Added `@smartapp/core` demo world (4 demo brands, `marketing`/`qa`/`empty`/`busy` packs, story builder, invariants & snapshot tests), `pnpm demo:print`, `docs/demo-data.md`, and recorded `D31`–`D32` (closing `O6`).
- 2026-11-17 P2-E Added `@smartapp/data` (`DataSource` contract wrapper, `Session`, dynamic `getDataSource`, `mediaUrl`, `createMemorySource` imitating Wave 1 database rules, and 19 portable contract tests) and recorded `D33`.
- 2026-11-17 P2-F Added Zod env checks blocking silent build defaults and `production`+`memory`, `@smartapp/data/switches` + `@smartapp/data/http`, preview ribbon, placeholder pages wired to `packages/data`, extended `tooling/scan-build.ts`, and closed Phase 2.
- 2026-11-18 P3-0 Housekeeping before Phase 3: updated `AGENTS.md` for Phase 3, added `CLAUDE.md`, rewrote `docs/README.md`, ignored `.obsidian/`, and added Phase 3 tracking.
- 2026-11-18 P3-A Added UI foundation in `@smartapp/ui` (Tailwind v4, `shadcn@4.23.0` `base-nova` + `@diceui/banner`, Plus Jakarta Sans Variable, WCAG AA contrast tests, D39 lint/TS block), wired Tailwind into storefront/dashboard with device theme persistence on dashboard, and recorded `D34`–`D36`, `D39`, `D41` (closing `O3`).
