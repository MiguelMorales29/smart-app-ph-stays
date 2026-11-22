# P5-7 · Tests and close-out

Model: Gemini Flash, High. Planning mode. After P5-6 is merged.

Read first: AGENTS.md, docs/prompts/P5-guide.md, docs/PROGRESS.md (Phase 5 list and the carry-over items), `tooling/check-budget.ts`, `tooling/e2e/`.

## Goal

Phase 5 is covered by tests, inside its budgets, and documented, ready for Lex's iPhone gate.

## Branch

`ag/p5-7-close-out` from main. One PR.

## Do

1. **Node 24.15:** bump `.nvmrc`, `engines` and the CI setup to Node 24.15.x (needed by jsdom 31).
2. **Component tests** in `packages/ui` and `apps/dashboard` with `@testing-library/react` 16.3.3, `@testing-library/user-event` 14.6.9, `@testing-library/jest-dom` 7.0.1, `jsdom` 31.0.0 (approved in P4-8). Test:
   - `AppSheet` (opens, closes, focus trap)
   - `SaveBar` (dirty, busy, saved)
   - `InlineStepper` (min/max, keyboard)
   - `SegmentedControl` (arrow keys)
   - `RowPicker` (pick and close)
   - the dock + sheet
   - the editor's part list (show/hide switch)
3. **Journey tests** (Playwright, phone size):
   - **Owner:** sign in → `/editor` → change the tagline and a colour → Publish → open `/<slug>` and see both.
   - **Guest:** `/<slug>` → a unit → pick dates and 2 guests → the price breakdown matches `quoteStay` and the stay total (with the cleaning fee) is the largest price → Reserve reaches the Phase 6 placeholder with the dates in the address.
   - **Check-out on a taken night:** a stay that ends on the first night of an existing booking can be picked (D75).
   - **In-app browser:** with a Facebook in-app user agent, Install shows "Open in Safari or Chrome" (D76).
   - **Small fix from the P5-0b review:** on phone unit rows, the status on the 88 px thumbnail becomes an icon-only dot with the word for screen readers (the word "Listed" covered most of the photo).
4. **Budgets & lazy toast:**
   - Extend `tooling/check-budget.ts` to the storefront: the property page's first load at most 170 KB gzipped of JavaScript.
   - No carousel code when the page has fewer than 2 banners.
   - The editor stays out of the dashboard's first load.
   - Load the toast layer lazily on idle or first toast, like the food app's `AppToaster` (speed only, no behaviour change).
5. **Full UI scan** on main: `gh workflow run full-ui-scan.yml --ref main -f paths=/units,/settings,/editor` for the dashboard, plus the storefront paths for 2 brands.
6. **Docs:**
   - PROGRESS: tick P5-7 and Phase 5. Move the property switcher, saved replies and profile photo to Phase 8's list (D70).
   - AGENTS "Where we are" → Phase 6.
   - Stack register: zustand, zundo and embla versions.
   - CHANGELOG line.

## Done when

- All new tests pass in CI; budgets pass; full UI scan green.
- A short gate checklist for Lex in the PR body: install Ulap Suites on his iPhone, open it from the Home Screen (splash), edit and publish from the phone, check light page colours on a bright brand.
- Open the PR, wait for green CI, **do not merge**. Report the PR number.
