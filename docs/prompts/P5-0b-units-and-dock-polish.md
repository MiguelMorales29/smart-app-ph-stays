# P5-0b · Units page, unit cards and dock polish (round 2)

Model: Gemini 4 Argon, Medium. Planning mode. After P5-0 (PR #44) is merged. Can run beside P5-1 (different files), but merge P5-1 first if both are ready, because P5-1 adds the demo units this page is checked with.

Read first: AGENTS.md, docs/prompts/P5-guide.md (rules), docs/pattern-guide.md, docs/decisions.md D65 to D73. Files: `packages/ui/src/compositions/bottom-dock.tsx`, `status-badge.tsx`, `choice-chip.tsx`; `apps/dashboard/src/features/units/units-page.tsx`, `unit-words.tsx`; `apps/dashboard/src/features/home/home-page.tsx`; `apps/dashboard/src/app/shell/AppSidebar.tsx`, `nav-config.ts`.

## Goal

The fixes Lex found on his iPhone and laptop after P5-0 (22 Nov 2026, D73): one clear place to add a unit, unit cards that use their space, a grid that fills the screen, a dock + that stands out, and a Home badge that matches Home.

## Branch

`ag/p5-0b-polish` from main. One PR.

## Do

1. **Dock + lifted (D73).** In `BottomDock`, the action button is 52 px, raised so about a third of it sits above the dock's top edge, with a 4 px ring in the page colour (`ring-background`) so it reads as cut out of the dock. No SVG notch. The other slots keep their size and spacing; the dock height does not change. It must not cover the last row of a page (check the bottom padding). Same in light and dark.
2. **Units: one action row.**
   - Remove the floating "Add unit" pill above the dock on phones (it stacked on the dock +).
   - Phones: the row above the chips is `[+ Add unit]` (filled, left) and a `⋯` button (right) whose menu holds Reorder and Select (each with its icon).
   - Desktop: the same "Add unit" button and `⋯` on the right of the chips row, in one row.
   - Rename the desktop button from "Add" to "Add unit" (the sidebar keeps "+ New").
3. **No duplicate "Units" title on desktop.** The top bar already says Units. Make the page `h1` `sr-only` at every size (phones already do this).
4. **Filter chips with status icons.** All (no icon), Listed (eye, success colour), Hidden (eye-off, muted), Drafts (pencil, warning colour), using the same icons and tokens as `StatusBadge`. Chips with 0 stay visible but quieter (`text-muted-foreground`, not disabled).
5. **Unit cards (grid and row).**
   - The status badge moves onto the photo (top-left, on a `bg-card/90` pill so it reads on any photo). In the phone row card, it sits on the thumbnail's corner.
   - Line 1: name (one line, truncate) and `⋯`.
   - Line 2: "Whole place · 2 guests · 1 bed" (bed spaces: "Bed space · Room 3").
   - Line 3: price in `tabular` digits, written "₱2,600 a night" / "₱8,500 a month" (fix "/ night" everywhere on this page), plus "Next guest Fri, 12 Dec" when the unit has a next booking (from data the page already loads; omit if not available, don't add an operation).
   - Same card height across a row.
6. **Grid that fills the width.** `grid-cols-[repeat(auto-fill,minmax(260px,1fr))]` inside the page width: 1 column on phones (keep the row card under 640 px), 2 on tablets, 3 on a 1280 px laptop with the sidebar open, 4 from 1536 px. The table view for more than 8 units stays as it is.
7. **Home badge matches Home.** Today the dock and sidebar show Home "5" while Home says "Nothing needs you right now". Until Phase 8 builds Home, show a short "Needs you" list on Home built from the same `ownerHome` counts the badge uses: one row each for arrivals today, departures today, payment proofs to check, holds ending soon, unread messages, each with its count and a link (Calendar, Payments, Bookings, Inbox). The empty state shows only when the total is 0. The badge and the list must use one shared function.
8. **Desktop "+ New" menu** is at least 280 px wide so hints stay on one line.
9. **Breadcrumb** on a unit section page on desktop reads `Units › Studio Fog › Price` (unit name, not "Edit unit").
10. **Kit:** update the dock and unit card samples in `/kit?tab=patterns`.

## Not in this task

Demo units (P5-1). Any storefront work. Building Home for real (Phase 8).

## Done when

- The pattern guide's definition of done (§6). PR screenshots at 390 px and 1280 px, light and dark: the dock, Units with the menu open, the grid at 1280 and 1536 px, a phone row card, Home with the "Needs you" list.
- The lifted + does not cover content on Settings, Units, Edit unit and Home at 360 px.
- `pnpm format:check` and `pnpm check` only (no local `pnpm build`); baselines regenerated in CI; CI green.
- PROGRESS: tick P5-0b. One CHANGELOG line.
- Open the PR, wait for green CI, **do not merge**. Report the PR number.
