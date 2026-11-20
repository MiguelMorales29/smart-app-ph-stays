# P4-7 · Settings, the property switcher and phone gestures

Model: Claude Opus 5.5, High.

Read AGENTS.md, docs/decisions.md (D29, D45–D60), docs/ui-library.md, the `/kit` pages, `apps/dashboard/src/app/router.tsx`, the shell files, `apps/dashboard/src/data/{property,payments,settings}`, and the contract entries `getOwnerProperty`, `saveProperty`, `changeSlug`, `checkSlug`, the payment-account operations, `savePolicies`, `saveHours`, `updateProfile`, `changePassword`, `signOutEverywhere`, `requestAccountDeletion` and `getMyAccount`.

## Goal

Owners change anything later in one predictable place (OW-12, OW-23, OW-24, OW-25), switch between properties, and the installed iPhone app gets a back swipe (D52).

## Plan first

Post the settings layout at each size, each page's fields and copy, the switcher, and how the swipe-back hook decides when it is on. Wait for my OK.

## Branch

`ag/p4-7-settings` from the latest main. Follow AGENTS.md rule 10.

## `/settings` hub

- **List:** `SettingsList` with groups Property (Details, Policies, Hours) · Money (Payments, Plan) · You (Account, Notices) · Data (Storage, Activity). Each row shows its current value ("Payments · 2 ways to pay"), and unfinished rows get a dot.
- **Phones:** each row opens its own page, sliding in from the right.
- **From 1,024 px:** two panes, the list at 280 px and the page up to 720 px.
- **Later pages:** Plan, Notices, Storage and Activity stay "Coming in phase 7/9" placeholders.

## Pages

1. **Property:**
   - Name, contacts (mobile via `PhoneInput`, Messenger, Facebook page, Google review link) and address.
   - "Show exact location only after payment" is on by default.
   - The web address changes in a "Change link" dialog with `SlugField`: "Old links and printed QR codes keep working." It shows `slug_change_limit` plainly.
2. **Payments:**
   - **Cards:** GCash, Maya, bank and QR Ph. Fields: account name ("Type it exactly as your GCash shows it"), number (P4-0 helpers), bank (D29 list, native-select), a square QR image (the photo pipeline from P4-5), and instructions.
   - **Order and switches:** Move up / Move down sets the order guests see. Each account has an on/off switch; at least one stays on (`last_payment_method`), and at most 3 banks (`bank_limit`).
   - **Previews and warnings:** a "What guests see" preview. On edit: "Guests with open bookings will see that you changed this."
   - **Password:** saving asks for the password again in a dialog (`wrong_password` lands on it).
   - **Empty:** "No way to pay yet. Guests can't pay until you add one." (MilestonePicture no_payment_accounts).
3. **Policies:**
   - **Cancellation:** preset cards, each with a worked example ("Guest paid ₱3,000, cancels 3 days before → gets back ₱1,500", computed rather than typed).
   - **Times and arrival:** check-in and check-out (`TimeSelect`, D56) and arrival details.
   - **Guests:** a guest list and ID switch with its due time.
   - **Rules and contacts:** house-rule chips (No smoking, No pets, No parties, Quiet hours 10 PM–7 AM) plus your own; saved replies (edit the list only); privacy contact.
   - **Preview:** "How guests read it".
4. **Hours:** reply and viewing hours, up to 4 ranges a day, "Copy Monday to all days", and closed dates. Empty: "Replies any time."
5. **Account:**
   - Picture (`OwnerAvatar` with the 8-seed DiceBear picker, or upload), name and email.
   - Change password (email code), Light / Dark / System, and this device.
   - "Sign out everywhere".
   - "Ask to delete account": waits 7 days and can be cancelled, with an alert-dialog that rises from the bottom on phones.

## Property switcher

- **Who sees it:** only owners with 2 or more properties.
- **Opening it:** tap the property name (the sidebar header on desktop, the top-bar title on phones). It opens a drawer sheet (about 94% tall, page scaled back with `Indent`, X button, swipe down to close).
- **Rows:** each property's cover, name, Live or Draft, and how many things need you, plus "Add property".
- **Address:** the current property is kept in the address (`?p=ulap-suites`), and each property has its own checklist.

## Phone gestures (D52)

- **Swipe-back hook:**
  - On only in the installed iPhone app (standalone display mode on iOS).
  - A 24 px zone at the left edge; the page follows the finger; letting go past 35% goes back.
  - Off while a sheet is open and on onboarding step 1.
  - Never swipes forward, never swipes between pages, and a sideways swipe never starts a vertical one.
- **Back history:** every sheet is in the address, so back closes it, and saving replaces its history entry.

## Not in this task

Plan, notices, storage and activity pages, publishing (Phase 5).

## Phase 4.5 rules (added 20 Nov 2026)

- Build every page from docs/pattern-guide.md:
  - grouped rows for every setting;
  - picker sheets for choices;
  - `SegmentedControl` for 2–4 options;
  - `InlineStepper` for small counts;
  - the save pill;
  - sheets with snap points for Change link, the password ask, account cards and the property switcher.
- The hub follows the Claude settings layout: groups with titles, a value on each row, a dot only on unfinished rows.
- Done also means the pattern guide's definition of done (§6): screenshots at 390 px with Safari's bars and 1280 px, light and dark, and recordings of each sheet.

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
