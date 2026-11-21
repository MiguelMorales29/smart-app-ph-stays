# P5-0 · Dock with +, Edit unit rows, badges, Preview switch, spacing

Model: Gemini 4 Argon, Medium. Planning mode.

Read first: AGENTS.md, docs/prompts/P5-guide.md (rules), docs/pattern-guide.md, docs/decisions.md D63 and D65 to D68. Files: `packages/ui/src/compositions/bottom-dock.tsx`, `settings-list.tsx`, `grouped-rows.tsx`, `app-sheet.tsx`, `editor-sections.tsx`, `dev-switch-panel.tsx`; `apps/dashboard/src/app/nav-config.ts`, `app/shell/AppFrame.tsx`, `AppSidebar.tsx`, `AccountMenu.tsx`; `features/units/unit-edit-page.tsx`, `unit-pricing.tsx`; `features/settings/settings-nav.tsx`; `app/router.tsx`.

## Goal

The problems Lex found on his iPhone and desktop on 22 Nov 2026 are fixed, and the dashboard has its final navigation shape.

## Branch

`ag/p5-0-phase4-fixes` from main. One PR.

## Do

1. **Dock (D65).**
   - Phone dock order: Home · Calendar · **+** · Inbox · More. Bookings moves from `mobileSlot: 'dock'` to `'more'` in `nav-config.ts`. The sidebar order on desktop does not change.
   - The **+** is a new `action` slot in `BottomDock`: a filled `bg-primary` circle with a white plus, 44 px, centred in the dock, the same height as the other slots, `aria-label="Add"`, the `press` utility. No raised notch, no label under it. It is a button, never a link, and never looks selected.
   - Tapping + opens an `AppSheet` (half height) titled "Add" with grouped rows (`RowGroup` / `RowButton`, icon + title + one-line hint):
     - Manual booking → `/calendar?add=booking` (Phase 6 placeholder is fine)
     - Block dates → `/calendar?add=block`
     - Add unit → `/units?add=unit` (works today)
     - Record cash payment → `/payments?add=cash`
   - The list lives in one place, `QUICK_ADD_ITEMS` in `nav-config.ts`, so Phase 7 (Send notice) and Phase 15 (Add tenant) add rows without touching the dock.
   - Desktop: a "+ New" button at the top of the sidebar (under the brand) opens the same items in a dropdown menu.
   - Home shows a "See all bookings" link under its list (it goes to `/bookings`).
2. **Badges (D67).**
   - Numbers only on Inbox (unread) and Home (things that need the owner, from `ownerHome`).
   - Calendar shows none.
   - More shows a dot (no number) only when an item inside it needs the owner.
   - Keep the counts in the sidebar on desktop as they are.
3. **Edit unit as Settings-style rows (D66).**
   - Replace `EditorSections` on Edit unit with a `SettingsList`-style group: icon, title, one short value on the **right** (one line, `truncate`), chevron that never moves.
     - Short values: Basics "2 guests · Studio"; Photos "7 photos"; Price "₱2,600 a night"; Amenities "10 picked"; Booking rules "1–14 nights".
     - A blue dot when the section needs the owner (as today).
   - **Phones and tablets:** a row opens the section as its own page, `/units/$unitId/$section` (`basics | photos | price | amenities | rules`). It has the top bar Back, the section title, its form and the save pill. Leaving with unsaved changes asks first (`LeaveGuardDialog`).
   - **From 1024 px:** the list on the left (280 px, sticky), the open section on the right, like `SettingsPane`. The selected row uses the **same** soft highlight as Settings (not the solid blue fill).
   - Keep one draft for the whole unit across sections, so saving from any section saves everything changed. The save order stays: saveUnit, then saveUnitPrices, then photos.
   - Keep `?section=` working: it opens that section.
   - Delete `EditorSections` from `packages/ui` only if nothing else uses it; otherwise leave it.
4. **Add unit: one question, not three (D72).** Today "+ Add" opens a dropdown (Add a unit / Add bed spaces), then the dialog asks "Room or place / Bed spaces", then "Whole place / Private room". That is one question asked three times.
   - "+ Add" on Units becomes a plain button that opens the dialog (no dropdown). `?add=unit` and `?add=beds` keep working and preselect the answer.
   - At the top of the dialog, one question **"What do guests get?"** as three `RadioCards`: Whole place ("Guests have it to themselves"), Private room ("A room in a shared place"), Bed space ("A bed in a shared room, like a dorm").
   - Remove the "Room or place / Bed spaces" segmented control.
   - Picking Bed space swaps the fields only: Room name, Beds in this room (stepper), Price for each bed, button "Create 4 beds". Whole place / Private room show Unit name, Guests, Price, button "Save and add photos". "How guests rent it" (By the night / By the month) stays for all three.
   - The title follows the answer ("Add a unit" / "Add bed spaces"); keep the typed values when switching between answers.
   - The dock + sheet's "Add unit" row opens this same dialog.
5. **Preview switch (D68).** On desktop too, open it from the account menu ("Preview · sample data") and hide the floating pill whenever the account menu exists. Sign-in pages keep the pill.
6. **Settings rows.** Rows for pages not built yet (Notices, Storage, Activity, Plan if still a placeholder) show a small "Soon" label in place of a value.
7. **Spacing and width.**
   - Phone: every page scrolls far enough that its last row clears the dock (check Settings, Units, Edit unit, Home).
   - Desktop forms (Settings pages, Edit unit sections): fields at most 560 px wide.
   - Group labels ("The space", "How guests reach you", "Address") line up with the field edges.
8. **Kit and route catalog:** add the + sheet to `/kit?tab=patterns`; add the new `/units/$unitId/$section` route to the route catalog.

## Not in this task

Building manual booking, blocking dates or recording payments (Phase 6/7). Editing a booking (BK-21, Phase 6). Any storefront work.

## Done when

- The pattern guide's definition of done (§6). Screenshots in the PR at 390 px and 1280 px, light and dark: dock, + sheet, the Add unit dialog with each of the 3 answers, Edit unit list and one section page, Settings bottom.
- The Edit unit chevrons line up on a 360 px screen, even with the longest demo values.
- Keyboard: the + is reachable and the sheet traps focus; Back from a section page returns to the list.
- `pnpm check` green; screenshot baselines regenerated (`gh workflow run update-screenshots.yml --ref <branch>`), then CI green.
- PROGRESS: tick P5-0. One CHANGELOG line.
- Open the PR, wait for green CI, **do not merge**. Report the PR number.
