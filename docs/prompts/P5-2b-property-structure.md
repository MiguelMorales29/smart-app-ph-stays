# P5-2b · Property page structure, round 2

Model: Gemini 4 Argon or Neon, Medium. Planning mode. After P5-2 is merged.

Read first: AGENTS.md, docs/prompts/P5-guide.md, docs/research/phase-5-storefront-structure.md (all of it), docs/research/phase-5-guest-pages.md, docs/decisions.md D74 to D82. Files: everything under `apps/storefront/src/features/property/`, `components/frames/PropertyFrame.tsx`, `features/install/` if present.

Port from the food app (`rm -rf /tmp/food-ref && gh repo clone webserbisyo/Smart-App-PH---FINAL-2026 /tmp/food-ref`, read-only): `apps/storefront/src/features/shell/components/top-bar.tsx` and `nav.tsx` (the centre pill group and account button layout), `account-button.tsx`, and `apps/storefront/src/features/install/components/install-card.tsx` (its iPhone Share steps).

## Goal

The property page navigates like an app (section tabs, a clean top bar), has a booking action on every screen size, shows dorm rooms as rooms, and teaches iPhone guests to install it in a way they can follow on their own phone.

## Branch

`ag/p5-2b-property-structure` from main. One PR.

## Do

1. **Top bar (D79):** phone: logo and name left; right: Install (hidden when installed), Your booking (person icon → `/<slug>/find` for now), menu. Share moves into the menu and next to the name block. Desktop (≥1024 px): the section links in the middle as a pill group (food app pattern) and a filled "Check dates" on the right after Install and Your booking.
2. **Section tabs (D79):** a sticky row under the top bar that appears after the hero leaves the screen: Units · About · Rules · Location · FAQ, only for parts that are shown. Install ReUI Scrollspy (Base UI build, pinned CLI) to highlight the current section; Dice UI Scroller (or the existing scroll-fades hook) for the sideways row on phones. Tapping a tab scrolls to the section with the top bars accounted for (`scroll-margin-top`).
3. **Menu sheet:** Share, Install, Find my booking, Privacy, Report this page, and the Preview switch on demo builds. Hide the floating Preview pill whenever this menu exists (the dashboard's D68 rule).
4. **Desktop two columns (D80):** from 1024 px, the content on the left and a sticky booking card on the right: "from ₱X a night" (or a month) with the required fee note (D74), Check dates (single unit: its date picker page; several: a unit chooser sheet), Message (the contact sheet), "See reviews on Google" when set, and one trust line. The price leaves the name block on desktop.
5. **Units (D81):**
   - Bed spaces grouped by room: one card per room ("Room 2A · Ladies · 6 beds · 2 free", from the bed units' shared `group_label`), linking to the first free bed's page.
   - Stays and Monthly rentals as two segmented tabs when both exist.
   - Card: photo with a "+N" photo count, name, "Whole place · 2 guests · 1 bed", price with the fee note, one highlight chip. Phone 1 column, tablet 2, desktop left column 2.
   - "Show all photos" button under the phone gallery; the viewer groups photos by unit.
6. **iPhone install guide (D82):** replace the iPhone part of the install sheet and `/install` with the 4-step guide in the research file:
   - Detect: iOS version (≥ 26 vs older) from the user agent; Safari vs Chrome on iPhone (`CriOS`); in-app browsers (D76); Android Chrome uses the real prompt.
   - Each step has a drawing that looks like that Safari screen (our own components, light and dark: the bottom bar with ⋯, the menu with Share, the share list with Add to Home Screen, the add screen with "Open as Web App" on and the property's own icon and home-screen name). Use the vertical Stepper.
   - A pulsing arrow pointing at the real ⋯ position (bottom right); a toggle "My address bar is at the top" switches the drawings and the arrow.
   - "Can't see it? Scroll the list, or tap Edit Actions" under step 3.
   - The nudge sheet appears only on a second visit or after a confirmed booking, never on the first screen; dismissing hides it for 30 days. The top-bar Install button always opens the guide.
7. **Words** follow `smartapp-ui-writing`; every new control has a visible focus ring and 44 px target.

## Not in this task

The unit page (P5-3), the manifest, icons and splash (P5-4), real member sign-in (Phase 8).

## Done when

- The pattern guide's definition of done (§6). PR screenshots at 390 px and 1280 px for Ulap Suites and Tita Lorna's Dorm: the top bar, the section tabs while scrolling, the desktop booking card, the room cards, and each of the 4 iPhone guide steps (iOS 26 and the "address bar at the top" variant).
- Unit tests for the iOS, Chrome-on-iPhone and in-app detection, and for grouping beds into rooms.
- `pnpm format:check` and `pnpm check` only (no local build); Lighthouse mobile on the Vercel preview in the PR; CI green.
- PROGRESS: tick P5-2b. One CHANGELOG line.
- Open the PR, wait for green CI, **do not merge**. Report the PR number.
