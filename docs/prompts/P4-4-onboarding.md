# P4-4 · Onboarding and the home setup checklist

Model: Gemini 4 Neon, High.

Read AGENTS.md, docs/decisions.md (D45–D60), docs/ui-library.md, the `/kit` pages, `FocusFrame`, the `/home` feature, `apps/dashboard/src/data/{setup,property,units,prices,photos,payments}`, and the contract entries `getSetupChecklist`, `getOwnerProperty`, `saveProperty`, `checkSlug`, `saveUnit`, `createBedSpaces`, `saveUnitPrices`, `savePaymentAccount` and `savePolicies`.

## Goal

A new owner goes from an empty account to a property that is ready to publish, in six short steps plus Review (D48). Home then shows what is left until everything is done (OW-02).

## Plan first

Post the step-by-step field list, what each step saves, how the steps are kept in the address, the desktop preview card, and the checklist rules. Wait for my OK.

## Branch

`ag/p4-4-onboarding` from the latest main. Follow AGENTS.md rule 10.

## `/onboarding` (FocusFrame, no dock)

- **Top:** "Step 2 of 6 · First unit", a 6-part bar (ReUI stepper) and "Finish later" (goes to `/home`).
- **Phones:** a bottom bar with Back and a forward button that says where it goes ("Continue to Photos").
- **Desktop:** a 560 px form column beside a live preview card of the guest page.
- **Behaviour:**
  - The step lives in the address (`?step=3`), so the phone's back gesture goes to the previous step. Moving between steps is by buttons only, never by swipe.
  - Each step saves on Continue. Coming back opens the first unfinished step.
  - Drafts survive app switching (`useFormDraft`).
- **Motion:** steps slide 8 px forward or back and the bar grows. Focus moves to the step's heading. All of it is still under reduced motion.

Steps:

| #   | Step           | Fields                                                                                                                                                                                                            | Skip?                |
| --- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| 1   | Your place     | Name (prefilled from the application), web address (`SlugField` with `checkSlug`), province and city (native-select), street                                                                                      | No                   |
| 2   | First unit     | Type as radio cards (whole place, private room, bed in a shared room), name, guests (`number-field`), rooms. For beds: "How many beds in this room?", which uses `createBedSpaces` with the room as `group_label` | No                   |
| 3   | Photos         | A simple picker for now: at least 3 to list. The full photo manager arrives in P4-5; here use the same upload operations with a plain grid                                                                        | Yes, "Do this later" |
| 4   | Price          | Base nightly price (`MoneyInput`) with guests included. "Charge more on some days?" opens the weekday price (Friday and Saturday picked). Special dates come later, on the unit page                              | No                   |
| 5   | How guests pay | One GCash, Maya or bank account (the password is asked again)                                                                                                                                                     | Yes, "Do this later" |
| 6   | Rules          | Cancellation preset cards, with "down payment kept, one date change allowed" picked. Check-in 2:00 PM and check-out 12:00 PM (`TimeSelect`). House-rule chips                                                     | No, but prefilled    |
| ✓   | Review         | Each answer with an Edit link                                                                                                                                                                                     | —                    |

Review ends with "Your page is ready to publish", or for pending owners "Ready. You can publish once we approve you". Publishing itself is Phase 5: the button goes to `/editor` ("Coming in phase 5").

## Home setup checklist (OW-02)

- **Card:** "Get your page ready · 3 of 8 done", with a segmented bar and the `circular-progress` ring.
- **Head start:** "Create your account" is already ticked (goal-gradient).
- **Folding:** only the next step is open; the rest are folded.
- **Data:** steps tick themselves from `getSetupChecklist`, with the ticked row's check popping. Waiting items say what they wait for.
- **Completion:** the card disappears after publishing.
- **Go-live moment:** build "Ulap Suites is live" with the link, Copy, and the `Celebration` burst (once per property per device). It is shown only from the Phase 5 publish flow; put it on `/kit` now.

## Not in this task

The full units pages and photo manager (P4-5), the price editor (P4-6), the settings pages (P4-7), publishing (Phase 5).

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
