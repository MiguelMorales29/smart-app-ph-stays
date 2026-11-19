# P4-2 · Components and compositions for Phase 4

Model: Gemini 4 Neon, High.

Read AGENTS.md, docs/decisions.md (D34, D41, D44, D45–D60), docs/ui-library.md, docs/design-tokens.md, `packages/ui/components.json`, the `/kit` pages, and what P4-0 and P4-1 added. The food app is at `~/Project/Smart-App-PH---FINAL-2026`; it is read-only, so never edit it.

## Goal

Install everything the Phase 4 pages use (D55, and nothing more), and build the shared Phase 4 compositions, so the screen prompts (P4-3 to P4-7) only assemble pages. No pages in this task.

## Plan first

Post the following, then wait for my OK:

- The install list in order, with the `--dry-run` output summary for each ReUI and Dice UI item: the files it writes, where it writes them, any packages it adds, and any raw colours.
- The composition list with their props.
- The npm package lines with licences.
- The DiceBear size measurement.

## Branch

`ag/p4-2-components` from the latest main. Follow AGENTS.md rule 10.

## Install (D55), one at a time, `pnpm dlx shadcn@4.23.0 add <item>` from the repo root

- **shadcn:** field, label, textarea, input-group, native-select, radio-group, checkbox, switch, toggle, toggle-group, tabs, dialog, alert-dialog, progress, card, item, table, popover, calendar.
- **ReUI:** stepper, sortable, number-field.
- **Dice UI:** file-upload, mask-input, responsive-dialog, circular-progress.
- **Never:**
  - `@reui/alert`, `@reui/badge`, `sonner`, `select`, `command`, `vaul`, `data-grid`;
  - any phone-input or time-picker item;
  - Magic UI or Aceternity.
- **Install-location risk:** `components.json` points the components alias at `compositions`. Every installed primitive must land in `packages/ui/src/components`. Dry-run first; if an item would write elsewhere, stop and show me.
- **After each item:**
  - Replace raw colours with tokens.
  - Run the brand guard.
  - Add the item to `/kit` → Base with light and dark samples.
  - Log any edit in `docs/ui-library.md`.
- **Drawer:** export `Provider`, `Indent`, `IndentBackground`, `SwipeArea` and `VirtualKeyboardProvider` from the installed Base UI drawer. This is a shared-variant edit (D34); log it.

## npm packages (approved in the Phase 4 plan, exact versions)

- **Pulled in by the items above:** `react-day-picker@10.0.2`, `date-fns@4.4.0`, `@dnd-kit/core@6.3.1`, `@dnd-kit/sortable@10.0.0`, `@dnd-kit/utilities@3.2.2`. If an item wants a different version, stop and ask.
- **Added directly:** `@lucide/lab@0.12.0` and `canvas-confetti@1.9.4`, plus `@types/canvas-confetti@1.9.0` as a dev dependency.
- **DiceBear (D59):**
  - Prefer `@dicebear/core@9.4.2` with `@dicebear/notionists@9.4.2` (CC0). Do not use `@dicebear/styles`: it holds every style (about 7.7 MB).
  - Measure the gzipped size when lazy-loaded, and report it before installing.
  - It must never enter the main dashboard bundle.
  - Generated in the browser, never through DiceBear's online API. Background colours come from tokens.
- **Records:** list every package with its licence under "P4-2 approved packages" in docs/decisions.md, and add a credits line (DiceBear Notionists CC0, Fluent Emoji MIT) to docs/ui-library.md.

## Compositions (`packages/ui/src/compositions`, each on `/kit` → Dashboard with every state)

1. `SettingsList`: an iOS-style grouped list. Each row is at least 52 px, with the label on the left, the value on the right, a chevron, and an optional "unfinished" dot. The whole row is the target.
2. `SaveBar` plus a `useLeaveGuard` hook.
   - The bar is sticky and at least 44 px. It shows "Unsaved changes" with Save and Discard, sits above the dock, and lifts above the iPhone keyboard (a small hook that measures `visualViewport`).
   - The guard asks before leaving with unsaved changes, both on route changes and on closing the tab.
3. `AsyncButton`: Save → Saving → ✓ Saved, keeping the same width throughout. The result is announced to screen readers.
4. `MoneyInput`:
   - A ₱ addon in input-group, using the P4-0 peso helpers.
   - Shows "₱1,500" once you leave the field.
   - `inputmode="decimal"`, never `type=number`.
   - Above ₱100,000 it asks "Is ₱150,000 a night right?".
5. `PhoneInput`: Dice UI mask-input plus the P4-0 mobile helper. Shows `0917 123 4567`, stores `+639…`.
6. `PasswordInput`:
   - input-group with a show/hide eye button. The label changes between "Show password" and "Hide password".
   - `autocomplete` is passed in (`current-password` or `new-password`).
   - An optional rules line underneath.
7. `GoogleButton`: "Continue with Google" (D58).
   - It uses Google's official "G" mark. The mark's own colours are allowed only in this file, with a `brand-guard-ignore` comment citing Google's sign-in branding rules.
   - The button itself uses our tokens: outline style, full width, 44 px.
8. `TimeSelect`: native-select with 30-minute choices from the P4-0 time helper ("2:00 PM" shown, "14:00" stored).
9. `SlugField`:
   - The web address input with a `/` prefix, made from the name with the P4-0 slug helper.
   - It checks the address through a passed-in function 400 ms after typing stops.
   - It shows, in a fixed-width slot so nothing jumps: Checking… → ✓ Available → "Taken. Try: …" (tap to use) → "That word is kept for the app" → "Use 3 to 40 letters or numbers".
   - Hint: "You can change it later; old links keep working."
10. `AmenityChips`:
    - Grouped checkbox chips with search and "Add your own".
    - Icons come from one `AMENITY_ICONS` map in `packages/ui/src/lib/amenity-icons.ts`, with Lucide and `@lucide/lab` only (D54).
    - Hot tub and elevator use the nearest icon; the word is always shown.
11. `notify()`: one helper over the installed Base UI toast (no sonner). It supports an Undo action.
12. `OwnerAvatar`: a photo if there is one, otherwise the DiceBear Notionists avatar from a seed, otherwise initials. It is lazy-loaded, and comes with a picker of 8 seeds for the account page.
13. `MilestonePicture`: a Fluent Emoji 3D picture on a token-coloured disc (`primary-tint`, or mint only for celebrations) (D54).
    - **Port the food app's `tooling/scripts/fluent-art.ts`.** Do not add `sharp`: encode the 192 px WebP files with Playwright's Chromium (already installed), and stop and ask if that does not work.
    - **Keys:** welcome, no_units, no_payment_accounts, waiting_approval, needs_changes, code_sent, live, offline, error, not_found.
    - **Output:** files go to `apps/dashboard/public/art`, about 50 KB in total.
14. `useFormDraft`: autosaves a form to the device 800 ms after typing stops, keyed per form and record. It brings back "We kept the changes you didn't save. Keep them / Start over" after the app reloads.
15. `Celebration`: one confetti burst (`canvas-confetti`, loaded only when called), once per key per device, with a still version under reduced motion.

## Not in this task

Pages, routes, the photo manager, the price editor and the setup checklist (P4-4 to P4-6), the swipe-back hook (P4-7).

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
