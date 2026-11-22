# P5-3 · Unit page

Model: Gemini 4 Argon, Medium. Planning mode. After P5-2 is merged.

Read first: AGENTS.md, docs/prompts/P5-guide.md, docs/research/phase-5-guest-pages.md (sections 1, 2, 5, 6), Feature blueprint §7 (`/units/<unit>` short-stay brief), PA-02, PA-04, PA-08. Files from P5-2 (the gallery, viewer, highlights, rules and trust parts are reused, not copied). Operations: `getPublicUnit`, `getUnitCalendar`, `quoteStay`.

## Goal

A guest opens `/<slug>/units/<unit>`, sees the place, picks dates and guests, and sees the exact price before reserving. Reserving itself is Phase 6.

## Branch

`ag/p5-3-unit-page` from main. One PR.

## Data first (gap found in the research pass)

P5-1's public views carry `price_from` but not the unit's required fees, so "+ ₱500 cleaning fee" (D74) can't be shown before dates are picked. Add `required_fees: { code, label, amount_centavos }[]` (the unit's active fees from `unit_fees` that every booking pays; not per-extra-guest or optional ones) to the unit cards in `getProperty` and to `getPublicUnit`, in the schema, the memory adapter and the contract tests. P5-2's cards then show the note too (one line in `UnitsSection`).

## The page

1. **Gallery:** the same component as the property page with the unit's photos; Back to the property in the top bar.
2. **Title block:** name, type, guests · bedrooms (or "Studio") · beds · baths, floor area when set, "from ₱X a night" (with the required fee note, D74), and "See reviews on Google" when the owner set the link.
3. **Dates and guests** (PA-02, PA-04):
   - The installed Calendar (react-day-picker) in range mode. A taken night (`taken_ranges`) is struck through and can't be a check-in night, **but it can be the check-out date** when the nights before it are free (D75): a guest may leave on the morning another guest arrives. Screen readers hear "taken" or "check-out only".
   - Minimum and maximum nights are enforced in the calendar: after a check-in is picked, check-out dates that are too early or too late are disabled with the reason ("Stays here are at least 2 nights"). Changing one date never clears the other without saying so.
   - Phone: months scroll vertically in the sheet; desktop: two months side by side.
   - Nightly prices from `weekday_rates` and `rate_overrides` show small under each day from 768 px.
   - Guests: `InlineStepper` for adults and children, capped at `max_guests`.
   - Dates and guests live in the web address (`?in=2026-12-12&out=2026-12-14&adults=2`), so a shared link opens the same choice.
   - Phone: dates open in an `AppSheet` (full height) from a "Add dates" row; desktop: a sticky card on the right with the calendar in a popover.
4. **Price breakdown (total first, D74):**
   - Built from `quoteStay`: nights × price per night (grouped by price), cleaning fee, extra guest fee, discount, total, down payment and when the rest is due.
   - Changes as the guest picks. A short "Price updated" note when it changes after a reload.
   - Once dates are picked, the **stay total with every required fee** is the largest price on the page and in the Reserve bar; the nightly rate is secondary. Before dates, the title block says "from ₱X a night" plus "+ ₱500 cleaning fee" when the unit has a required fee. A required fee must never appear for the first time on the booking form.
5. **Rules for this stay:** minimum and maximum nights, check-in and check-out times, cancellation preset in plain words, "IDs are asked before arrival" when on.
6. **Details:** description (clamped with "Read more"), all amenities (in a sheet when more than 10), house rules.
7. **Reserve bar:**
   - Phone: a sticky bar with the total for the chosen dates and "Reserve".
   - Desktop: the button in the sticky card.
   - It goes to `/<slug>/book?unit=…&in=…&out=…&adults=…` (the Phase 6 placeholder).
   - A second button "Ask a question" opens the contact sheet from P5-2 (Messenger, call, text, Facebook; D76: BK-10 inquiries are wave 2). It does not go to `/inquire`.
8. **Share preview** (PA-08): title, description and the cover photo in `generateMetadata`.

## States to handle (the brief's extra states)

- **Dates just taken:** `quoteStay` returns `dates_taken`. Say "Those dates were just booked. Pick other dates." and clear the range.
- **Below minimum nights:** "Stays here are at least 2 nights."
- **Too many guests:** the stepper stops at the maximum, with "Up to 4 guests".
- **Long-term unit** (wave 2): show rent, inclusions, availability and "Ask about this unit" (the contact sheet); no calendar.
- **Check-out-only day:** picking a taken night as check-out works; picking it as check-in says "That night is taken. You can check out that morning."
- Plus the 7 standard states.

## Leftovers from P5-2b

- The desktop promo banner subtitle must end with `"…"` when cut (it stops at `"…and a sea of"` at 1280 px).
- The `"Times"` section says `"Replies any time"` while the host card says `"Usually replies within a day"`. Use one reply-time value from the data in both places, and hide the Times row if it repeats the host card.

## Not in this task

Holding dates, the booking form, payment (Phase 6). Editing in the page editor (P5-5).

## Done when

- The pattern guide's definition of done (§6), with screenshots at 390 px and 1280 px of Studio Fog (Ulap Suites) and one bed space (Tita Lorna Dorm), including the dates sheet open and a price breakdown.
- Dates in the web address survive a reload and a shared link.
- Keyboard: the calendar works with arrows and Enter; screen readers hear "taken" on taken days.
- `pnpm check` green, baselines regenerated after checking. PROGRESS: tick P5-3. One CHANGELOG line.
- Open the PR, wait for green CI, **do not merge**. Report the PR number.
