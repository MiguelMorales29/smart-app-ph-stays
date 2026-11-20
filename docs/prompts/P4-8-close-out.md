# P4-8 · Phase 4 close-out: owner journey test, component tests, budget and docs

Model: Claude Opus 5.5, High.

Read AGENTS.md, docs/decisions.md (D40, D44, D45–D60), docs/PROGRESS.md, docs/ui-library.md, docs/previews.md, `.github/workflows/check.yml`, `tooling/e2e/`, and what P4-0 to P4-7 added.

## Goal

Prove Phase 4 works end to end on a phone, guard it in CI, and close Phase 4 as **UI approved**.

## Plan first

Post the journey test steps, the six component tests, how the budget check measures, the doc changes, and Lex's phone checklist. Wait for my OK.

## Branch

`ag/p4-8-close-out` from the latest main. Follow AGENTS.md rule 10.

## Packages (approved in the Phase 4 block of docs/decisions.md)

`@testing-library/react@16.3.3`, `@testing-library/user-event@14.6.9`, `@testing-library/jest-dom@7.0.1` and `jsdom@31.0.0`, as dev dependencies of `apps/dashboard` only, with licences listed.

## Tests

1. **Owner journey (Playwright, phone size with touch, in CI):**
   - **The steps:**
     1. Apply with email.
     2. See "Application sent".
     3. On `/onboarding` while pending, do step 1 with the web address check, then step 2 with 4 bed spaces.
     4. Add photos, including one HEIC file that gets the right message.
     5. Set a price with Friday and Saturday.
     6. Skip payment.
     7. Fill in the rules.
     8. Review.
     9. Switch to approved.
     10. Add a GCash account (password asked).
     11. The home checklist shows everything done except publishing.
   - **Plus:** one Google sign-in path, the leave guard, and back from an open sheet closing it.
2. **Component tests (Vitest + jsdom):**
   - an error is marked on its field;
   - focus goes to the first error;
   - `slug_taken` lands on the web address field;
   - pesos are formatted on blur;
   - a draft comes back after a remount;
   - the leave guard opens.
3. **Budget check in CI** (like the food app's), measured from the preview build:
   - the main dashboard bundle stays at most 210 KB gzipped;
   - each Phase 4 page chunk stays at most 40 KB;
   - DiceBear, confetti, dnd-kit and the calendar never appear in the main chunk.

   Report the numbers.

4. **Screenshots and UI scan:**
   - Add the Phase 4 routes to the screenshot matrix: light and dark, 360 and 1,280 px, with the marketing pack and the pending owner.
   - Regenerate baselines only with the "Update screenshots" workflow.

## Docs

- **`docs/ui-library.md`:** every Phase 4 composition, with "use for" and "don't".
- **`docs/demo-data.md`:** the demo codes and the Google demo credential.
- **`docs/previews.md`:** "Phase 4 phone check" for Lex, a short numbered list:
  1. Install the dashboard on his iPhone.
  2. Apply.
  3. Wait.
  4. Set up.
  5. Add beds.
  6. Set prices.
  7. Add GCash.
  8. Edge swipe back.
  9. Check that the keyboard doesn't cover Save.
  10. Pick a HEIC photo.
  11. Use the approval switch.
  12. Turn on "reduce motion" and check that everything becomes still.
- **PROGRESS:** tick P4-8 and Phase 4 as **UI approved** (not Done).
- **AGENTS.md:** "Where we are" moves to Phase 5.
- **CHANGELOG:** one line.

## Close-out report

As in the shared footer below, and your report includes the budget numbers, the journey test run time, and anything Lex must do by hand.

## Phase 4.5 rules (added 20 Nov 2026)

- **Final design pass:**
  - every Phase 4 route checked against docs/pattern-guide.md at 390 px (Safari bars) and 1280 px, light and dark;
  - `design:design-critique` and `design:accessibility-review` on the result;
  - a before/after gallery in the PR;
  - Lex signs off on his own iPhone.
- Run the full UI scan on the Phase 4 routes: `gh workflow run full-ui-scan.yml --ref main -f paths=/signup,/login,/forgot-password,/onboarding,/home,/units,/settings`.
- AGENTS.md "Where we are" moves to Phase 5 only after Lex's sign-off.

## Every prompt in Phase 4

- Load the `smartapp-ui`, `smartapp-ui-writing` and `smartapp-ui-check` skills before any UI work.
- Every screen follows the Phase 4 rules:
  - **States:** skeleton while loading; empty means one sentence and one action; error with Try again; offline ("You're offline. Changes save when you're back.", Save disabled); the paused-account banner.
  - **Layout:**
    - Long names are cut to 2 lines.
    - ₱ amounts use tabular numbers.
    - One primary action per screen, in the thumb zone on phones.
    - At most 7 fields per step or section.
  - **Access:** 44 px targets and 16 px inputs on touch; the keyboard reaches everything; status shows an icon, a word and a colour.
- Screens read and write only through `apps/dashboard/src/data/<area>/` (P4-0). Forms use React Hook Form with the schemas in `packages/core/src/forms`, and `useFormErrors` for errors.
- If the contract is missing something a screen needs, stop and propose the operation. Never fake data in a screen.
- Work only in your own folder. If another agent session may use this repository at the same time, work in a separate `git worktree`.
- Do not run `pnpm build` or Playwright locally unless a check fails and you need it; CI runs them.
- If the frames or kits changed on purpose, regenerate screenshot baselines only with the "Update screenshots" workflow on your branch.
- **Done when:**
  - `pnpm check` passes, and CI (Check and Screenshots, including the UI scan with axe) is green.
  - The PR is merged per rule 10.
  - PROGRESS ticks this prompt, with one CHANGELOG line.
  - Do not edit docs/prompts; this prompt is already saved.
- Your report lists what changed, which demo view shows each screen state, and how Lex checks it on his phone.
