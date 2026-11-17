# P2-F View-as switches, scenario switches, and closing Phase 2

Paste everything below the line into a new Antigravity conversation (Planning mode), after P2-E is merged.

---

To save my laptop: while you work, run only the typecheck and tests of the package you are changing (for example `pnpm --filter @smartapp/storefront typecheck`). Do not run `pnpm build` locally; CI runs the full check, both production builds and the scan. Run `pnpm check` once, just before opening the pull request. Start `pnpm dev` only once, at the end, to confirm the switches work.

Read AGENTS.md, docs/decisions.md and docs/PROGRESS.md. Then read the placeholder pages in apps/storefront and apps/dashboard, the CI workflow, and the build-output scan from Phase 1.

## Goal

The roadmap's second "done when": the view-as switch and the scenario switch work on the placeholder pages, and neither the switches nor the demo world can reach a live build.

## Plan first

Post how each app gets its configuration, where the switch bar lives, and how you will prove it is absent from a production build. Wait for my OK.

## Branch

`ag/p2f-switches` from the latest main. Follow AGENTS.md rule 10.

## Build

1. Configuration, checked with Zod at start, per app:
   - `DATA_SOURCE` (`memory` or `http`; storefront as `NEXT_PUBLIC_DATA_SOURCE`, dashboard as `VITE_DATA_SOURCE`) and `APP_ENV` (`development`, `preview` or `production`).
   - `production` with `memory` is refused at start.
   - `http` answers "available from Phase 11" for now.
   - Document every variable in each app's `.env.example`.
2. A small switch bar shown only when `DATA_SOURCE` is `memory` and `APP_ENV` is not `production`, loaded with a dynamic `import()` in that branch only. Put it in packages/data as a framework-free controller, with a thin piece per app; ask before adding anything to packages/ui. It sets:
   - **View as:** guest; guest with a booking link; member Bea Santos; owner of each demo brand; the pending owner; super admin.
   - **Scenario:** marketing (default), qa, empty, busy, plus "error" (the next call fails with a chosen error code), "slow" (1.5 to 3 seconds per call) and "offline".
   - **Clock:** now, the golden clock, +1 hour, +1 day.
     The choice lives in the address (`?as=owner:ulap-suites&pack=qa`) and in sessionStorage, so I can send a link that opens the same view.
3. The placeholder pages call packages/data only. Storefront `/`: lists the demo properties with their cover photo from `mediaUrl`. Storefront `/<slug>`: shows the property name, units and one quote. Dashboard `/`: for an owner, the home counts (proofs to check, holds running out, arrivals today); for the super admin, owners by state. Each shows loading, empty and error states in plain text. No styling: Phase 3 brings the look.
4. A preview build shows a fixed "Preview · sample data" ribbon.
5. Extend the Phase 1 build-output scan so it fails if a production build contains `dec0de`, `@example.com`, `@demo.invalid` or the switch bar's marker text. Add a CI step that builds both front ends with `APP_ENV=production DATA_SOURCE=http` and runs the scan.
6. Close Phase 2:
   - tick Phase 2 in PROGRESS;
   - update docs/blueprints/database-blueprint.md, feature-blueprint.md and system-blueprint.md so every Phase 2 decision (D18 onward) is written into them, each change marked with its decision number, for example "(D28)";
   - CHANGELOG line;
   - add a "How to use the switches" section to docs/demo-data.md;
   - list in your report anything from the roadmap's Phase 2 "done when" that is still not true.

## Not in this task

Styling, components, Tailwind, the HTTP adapter, NestJS endpoints, sign-in.

## Done when

On my laptop, `pnpm dev` and then:

- changing "view as" changes what both placeholder pages show;
- "empty", "busy", "error" and "slow" each visibly change the pages;
- the production build scan passes in CI;
- the PR is merged per rule 10.
  In the same pull request, save this prompt word for word as docs/prompts/P2-F-switches.md and add one line to docs/prompts/README.md: prompt, branch, PR link, date. Finish with five steps for me to test it on my phone over Wi-Fi.
