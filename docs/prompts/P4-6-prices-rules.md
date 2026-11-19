# P4-6 · Prices, amenities and booking rules

Model: Claude Opus 5.5, High.

Read AGENTS.md, docs/decisions.md (D45–D60, O10), `packages/core/src/pricing` (quoteStay and the golden cases), `packages/core/src/lists/pricing.ts`, the `/units/$id` page from P4-5, and the contract entries `saveUnitPrices` and `listAmenities`.

## Goal

The Price, Amenities and Booking rules sections of `/units/$id` (OW-09, D50). Prices are typed in pesos only, and owners see what each coming night will cost before they save.

## Plan first

Post the `PriceEditor` layout, the holiday list with its sources, the 14-night preview logic (reusing `quoteStay`, not a second calculator), and the booking-rules fields. Wait for my OK.

## Branch

`ag/p4-6-prices-rules` from the latest main. Follow AGENTS.md rule 10.

## Price (`PriceEditor` composition)

1. **Base nightly price** (`MoneyInput`) and guests included.
2. **"Charge more on some days?"** is a switch.
   - It shows day chips (toggle-group) with Friday and Saturday picked, and one price for the picked days.
   - Hint: "A Friday night means checking in on Friday."
3. **Special dates** open a sheet (a drawer on phones, a popover calendar on desktop).
   - The sheet takes a date range (shadcn calendar), a price and an optional label.
   - Philippine holiday chips fill in the dates: Holy Week, Christmas, New Year, long weekends.
   - Overlapping ranges are refused, with a way out ("Edit the other date").
4. **14-night preview strip:** what each of the next 14 nights costs, and which rule set it (special date, then weekday, then base). It is built on `quoteStay`.
5. **"More fees and discounts"** (folded): cleaning fee, extra-guest fee, and weekly or monthly discount (only the larger applies). Leave out a security deposit; it is O10.

**Holidays:** add `packages/core/src/time/ph-holidays.ts`.

- **2026:** the dates from the official proclamation, with its number in a comment.
- **2027:** if the proclamation is not out yet, add the fixed-date holidays plus Holy Week computed from Easter, marked "until proclaimed".
- **Tests:** one case per holiday kind.

## Amenities

`AmenityChips` with the `listAmenities` catalogue (groups and icons), search, and "Add your own".

## Booking rules (folded)

- Minimum and maximum nights.
- Down payment % (10–100, number-field).
- Hold time.
- Preparation nights.
- Advance notice and booking window.

Each field has a one-line hint in plain words, following the `smartapp-ui-writing` skill.

All three sections save through `saveUnitPrices` (or `saveUnit` for amenities) with the `SaveBar`. Errors land on their fields.

## Not in this task

Guest-side prices and date picking (Phase 6), the security deposit (O10).

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
