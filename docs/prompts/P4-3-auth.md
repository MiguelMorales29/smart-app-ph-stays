# P4-3 · Sign-up, login, forgot password and waiting for approval

Model: Claude Opus 5.5, High.

Read AGENTS.md, docs/decisions.md (D45–D60, O9), docs/demo-data.md, docs/ui-library.md, the `/kit` pages, `apps/dashboard/src/app/router.tsx`, `AuthFrame`, `dashboard-context.tsx`, `apps/dashboard/src/data/{auth,setup,shared}.ts*`, `packages/data/src/switches.ts`, and the contract entries `applyAsOwner`, `signIn`, `signInWithGoogle`, `requestPasswordCode`, `resetPassword` and `getMyAccount`. Look at the shadcn blocks `login-04`, `signup-04` and `login-05` as a starting point only.

## Goal

An owner applies in under 2 minutes, signs in, resets a forgotten password, and while pending is never stuck: they can set up everything and see where their application stands (OW-01, F20, D47, D58).

## Plan first

Post the following, then wait for my OK:

- the routes and the screens per step;
- how a successful sign-in sets the session through the existing dashboard session and switch layer;
- the copy for every message;
- any contract gap.

## Branch

`ag/p4-3-auth` from the latest main. Follow AGENTS.md rule 10.

## Session

Signing in or applying stores the returned session through the existing layer (`dashboard-context.tsx`, `src/data/shared.ts`, the switches). Do not create a second session store. If the layer cannot be set from a screen, stop and propose the smallest change. Signing out returns to `/login`.

## Screens (all in AuthFrame)

1. **`/signup`**, 3 steps with "Step 1 of 3" on phones.
   - **Desktop:** a sell panel on the left (₱599 a month and 14 days free, read from the demo plan rather than typed in, plus a "See a demo page" link) and the form on the right.
   - **Step 1, You:**
     - "Continue with Google" (`GoogleButton`) at the top.
     - Then "or", and full name · mobile (`PhoneInput`) · email · password (`PasswordInput` with a rules line) · a terms checkbox that starts unticked.
     - Google fills in the name and email and skips the password and step 3.
   - **Step 2, Your place:**
     - Place name · what you rent (Staycation / Apartments / Dorm or bed spaces / A mix, as radio cards) · how many units (1, 2–5, 6–20, 21+) · how many properties (1, 2–3, 4+) · town or city · Facebook page link (optional, hint "Helps us check you faster").
   - **Step 3, Email code:** 6 digits in one field with `autocomplete="one-time-code"` and `inputmode="numeric"`, plus Resend after 30 s.
     - The contract has no sign-up email check yet. Add the smallest public operation pair to the contract, the memory adapter and the contract tests, with a demo code documented in docs/demo-data.md. Show this in the plan.
   - **Primary action:** "Send application".
   - **Behaviour:**
     - The step lives in the address (`?step=2`), so back goes to the previous step.
     - Answers survive leaving the page (`useFormDraft`).
     - Errors land on their field (`email_taken` lands on email).
2. **"Application sent" moment:**
   - The `MilestonePicture` (waiting_approval).
   - A static 3-step timeline: Sent ✓, Checking, Approved (ReUI stepper, vertical).
   - The primary action "Set up your page" goes to `/onboarding`.
3. **`/login`:**
   - Email · password (`PasswordInput`) · "Sign in" · "Forgot password?" · "Continue with Google" · "New here? Apply".
   - **Errors:** any failure shows one answer: "That email and password don't match. Try again or reset your password." After 5 tries, show the 15-minute wait from the data layer.
   - **Where it goes:** pending owners go to `/onboarding`, others to `/home`.
   - **Google:** a Google sign-in that returns `needs_application` continues at `/signup?step=2` with the name and email filled in.
4. **Forgot password** (`/forgot-password`, AuthFrame; add it to the route catalog and the UI-scan list):
   - email → always "If that email has an account, we sent a 6-digit code" (MilestonePicture code_sent);
   - → code + new password;
   - → "Password changed. Other devices are signed out." → Sign in.
5. **Waiting for approval**, on `/home` and `/onboarding` for pending accounts:
   - **Banner:** "We're checking your application. We'll email you. Set up your page now; it goes live after we approve you."
   - **Actions:** primary "Set up your page"; secondary "What we check" (a sheet with 3 plain lines) and "Message us on Messenger".
   - **No time promise** (O9 is open), unless docs/decisions.md says otherwise by then.
   - **Approved:** "You're approved. Publish your page."
   - **Suspended:** the reason and a contact, read-only.
   - **Status checks:** the account status is checked again every 30 seconds and when the tab comes back (F20). In the demo, Lex switches between pending and approved with the Preview pill (`owner:pending`).

## Not in this task

Onboarding steps (P4-4), real Google or email (Phase 11), the super admin side (Phase 9).

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
