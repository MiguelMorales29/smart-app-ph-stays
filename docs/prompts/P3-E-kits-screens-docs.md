# P3-E · Kits, screenshot tests, previews and docs

Read AGENTS.md, docs/decisions.md (D34–D41), docs/PROGRESS.md, the CI workflow, and what P3-A to P3-D added.

## Goal

Three kits that show every installed component and composition in its real setting, screenshot tests that guard them in CI, the hosted-preview steps, and Phase 3 closed in the docs.

## Plan first

Post the kit layout, the screenshot matrix, how baselines are made in CI, and the doc changes. Wait for my OK.

## Branch

`ag/p3e-kits-screens-docs` from the latest main. Follow AGENTS.md rule 10.

## Package

@playwright/test 1.65.0 (not 1.65.1: too new), with the Stack register line first. Use Chromium only.

## Kits (development and preview only; the production build scan must still pass)

1. **/kit in the dashboard, three tabs:**
   - **Base:** every installed component with every variant, in light and dark side by side.
   - **Dashboard:** the frames, the navigation, the shared states and the status badges (the booking and payment status colours from D35, each with an icon and a word).
   - **Tokens:** the colour table with live contrast ratios, the type scale, radius, shadows and motion.
2. **/kit in the storefront:** the property frame and the storefront compositions under each of the four demo brands plus a "worst case" look (from P3-B's test cases), with a brand switcher.
3. Each kit entry has one line of "use for" and one of "don't".

## Screenshot tests (D40)

- tooling/e2e with a Playwright config that starts both dev servers with APP_ENV=preview and DATA_SOURCE=memory.
- Screenshots:
  - dashboard /kit: base and dashboard tabs × light and dark × 360 and 1280 px;
  - storefront /kit: × 5 looks × 360 and 1280 px;
  - one each of /home, /<slug> and /admin per size.
- Freeze motion; use the golden clock and the marketing pack; mask nothing else.
- **Baselines come only from CI:** add a workflow_dispatch workflow "Update screenshots" that runs Playwright with --update-snapshots in the official Playwright container and commits the images to the branch. The normal CI job compares against them and uploads the diff report as an artifact when it fails.
- Tell me the exact command to start the baseline workflow (`gh workflow run ...`), and run it yourself on this branch before you open the pull request.

## Hosted previews (D38): steps for me, not code

Write docs/previews.md with:

- the exact clicks to create two Vercel projects from this repo (root apps/storefront and apps/dashboard);
- the Preview environment variables (APP_ENV=preview, DATA_SOURCE=memory, plus the origin settings from .env.example);
- no Production variables, on purpose, so a production build fails until Phase 14;
- how to find each pull request's preview link.

## Docs to close Phase 3

- docs/decisions.md: record D38 and D40 exactly as written at the end of this prompt, and close O2.
- docs/ui-library.md: the libraries table, every installed component with its source and version, the "how it was chosen" notes, and the shortlist for Phases 4–9 (from the plan's library table). Nothing in the shortlist is installed.
- docs/design-tokens.md: the platform theme, the base tokens, the storefront theme engine and the status map.
- AGENTS.md: add a "Components" rule: read docs/ui-library.md and the kits before building anything; the D34 layers; stop instead of hand-building an installed component.
- docs/blueprints/stack-register.md: every package added in Phase 3, marked as installed.
- PROGRESS: tick P3-E and Phase 3. CHANGELOG line. Save this prompt as docs/prompts/P3-E-kits-screens-docs.md and add its README line.
- List anything from the Phase 3 "done when" that is still not true.

## Not in this task

Page content, new components, blocks, Vercel setup itself (I do that by hand).

## Checks

- Run only tooling and ui tests while you work; Playwright runs in CI.
- `pnpm check` once before the pull request.

## Done when

CI is green with the screenshot job passing on the committed baselines, and the PR is merged.

## Phase 3 done when

Every wave 1 route opens in its frame on a 360 px phone and on desktop; the three kits render in light and dark and in all four demo brands; screenshot tests pass in CI.

## Decisions to record

- D38 Hosted previews: two Vercel projects (storefront, dashboard), Preview environment only, with APP_ENV=preview and DATA_SOURCE=memory; no production environment until Phase 14 (closes O2).
- D40 Screenshot tests: Playwright screenshots of the three kits (light, dark, the four demo brands, 360 and 1280 px) run in CI; baselines come only from the CI "Update screenshots" workflow, never from a laptop.

Extra instructions for this run:

1. Never merge until `gh pr checks` shows every check passed.
2. Add apps/dashboard/vercel.json with a rewrite that sends every path to /index.html, so refreshing a deep link like /bookings works on Vercel. The storefront needs no vercel.json.
3. In docs/ui-library.md, record every edit made to an installed component so far, including banner.tsx (changed for exactOptionalPropertyTypes), with the reason.
4. Vercel is already set up by hand. Do not write click-by-click setup steps; instead record what exists in the docs and update D38:
   - two projects: smart-app-ph-stays-storefront (root apps/storefront) and smart-app-ph-stays-dashboard (root apps/dashboard)
   - Node.js Version 24.x on both
   - env vars APP_ENV=preview, DATA_SOURCE=memory
   - Production branch tracking set to an empty `production` branch, so every merge to main is a Preview deploy; never push to or delete `production` until Phase 14
   - Vercel Authentication disabled on both
   - main links: https://smart-app-ph-stays-storefront.vercel.app and https://smart-app-ph-stays-dashboard.vercel.app
