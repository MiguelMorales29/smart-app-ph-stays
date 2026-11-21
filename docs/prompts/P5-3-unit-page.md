# P5-3 · Unit page

Model: Gemini 4 Argon, Medium. Planning mode. After P5-2 is merged.

Read first: AGENTS.md, docs/prompts/P5-guide.md, Feature blueprint §7 (`/units/<unit>` short-stay brief), PA-02, PA-04, PA-08. Files from P5-2 (the gallery, viewer, highlights, rules and trust parts are reused, not copied). Operations: `getPublicUnit`, `getUnitCalendar`, `quoteStay`.

## Goal

A guest opens `/<slug>/units/<unit>`, sees the place, picks dates and guests, and sees the exact price before reserving. Reserving itself is Phase 6.

## Branch

`ag/p5-3-unit-page` from main. One PR.

## The page

1. **Gallery:** the same component as the property page with the unit's photos; Back to the property in the top bar.
2. **Title block:** name, type, guests · bedrooms (or "Studio") · beds · baths, floor area when set, "from ₱X a night".
3. **Dates and guests** (PA-02, PA-04):
   - The installed Calendar (react-day-picker) in range mode; taken dates (`taken_ranges`) are struck through and can't be picked.
   - Nightly prices from `weekday_rates` and `rate_overrides` show small under each day from 768 px.
   - Guests: `InlineStepper` for adults and children, capped at `max_guests`.
   - Dates and guests live in the web address (`?in=2026-12-12&out=2026-12-14&adults=2`), so a shared link opens the same choice.
   - Phone: dates open in an `AppSheet` (full height) from a "Add dates" row; desktop: a sticky card on the right with the calendar in a popover.
4. **Price breakdown:**
   - Built from `quoteStay`: nights × price per night (grouped by price), cleaning fee, extra guest fee, discount, total, down payment and when the rest is due.
   - Changes as the guest picks. A short "Price updated" note when it changes after a reload.
5. **Rules for this stay:** minimum and maximum nights, check-in and check-out times, cancellation preset in plain words, "IDs are asked before arrival" when on.
6. **Details:** description (clamped with "Read more"), all amenities (in a sheet when more than 10), house rules.
7. **Reserve bar:**
   - Phone: a sticky bar with the total for the chosen dates and "Reserve".
   - Desktop: the button in the sticky card.
   - It goes to `/<slug>/book?unit=…&in=…&out=…&adults=…` (the Phase 6 placeholder).
   - A second button "Ask a question" goes to `/<slug>/inquire?unit=…`.
8. **Share preview** (PA-08): title, description and the cover photo in `generateMetadata`.

## States to handle (the brief's extra states)

- **Dates just taken:** `quoteStay` returns `dates_taken`. Say "Those dates were just booked. Pick other dates." and clear the range.
- **Below minimum nights:** "Stays here are at least 2 nights."
- **Too many guests:** the stepper stops at the maximum, with "Up to 4 guests".
- **Long-term unit** (wave 2): show rent, inclusions, availability and "Ask about this unit"; no calendar.
- Plus the 7 standard states.

## Not in this task

Holding dates, the booking form, payment (Phase 6). Editing in the page editor (P5-5).

## Done when

- The pattern guide's definition of done (§6), with screenshots at 390 px and 1280 px of Studio Fog (Ulap Suites) and one bed space (Tita Lorna Dorm), including the dates sheet open and a price breakdown.
- Dates in the web address survive a reload and a shared link.
- Keyboard: the calendar works with arrows and Enter; screen readers hear "taken" on taken days.
- `pnpm check` green, baselines regenerated after checking. PROGRESS: tick P5-3. One CHANGELOG line.
- Open the PR, wait for green CI, **do not merge**. Report the PR number.
