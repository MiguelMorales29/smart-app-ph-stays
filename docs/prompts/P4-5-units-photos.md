# P4-5 · Units, bed spaces and photos

Model: Claude Opus 5.5, High.

Read AGENTS.md, docs/decisions.md (D23, D24, D45–D60, O4), docs/ui-library.md, the `/kit` pages, `apps/dashboard/src/data/{units,photos}`, and the contract entries `listOwnerUnits`, `getOwnerUnit`, `saveUnit`, `createBedSpaces`, `setUnitStatus`, `reorderUnits`, `archiveUnit`, `duplicateUnit`, `requestUpload`, `confirmUpload` and `saveListingPhotos`. From the food app (read-only): `packages/data/src/compress-image.ts` and its test.

## Goal

Owners manage every unit and bed space, and add good photos from a phone (OW-08, OW-27, D49, D51).

## Plan first

Post the list and table layouts, the bulk-action flow with Undo, the edit page sections, and the photo pipeline step by step. Wait for my OK.

## Branch

`ag/p4-5-units-photos` from the latest main. Follow AGENTS.md rule 10.

## `/units`

- **Layout:** cards with a 4:3 cover, name, type, "₱3,500 / night" and status (Draft, Listed, Hidden) in one column on phones; a plain table on desktop (no data grid).
- **Filters:** chips for All, Listed, Hidden and Drafts, kept in the address.
- **⋯ menu:** Edit, Duplicate, Hide from page / Show on page, Archive. Listing a unit that isn't ready shows what is missing (`unit_not_ready` with `details.missing`), with links to fix it.
- **Bed spaces:**
  - Grouped by room: "Room 2A · 6 beds · 4 listed".
  - "Add bed spaces" takes a room name, a bed count, one price and shared photos. It previews "Bed 1 … Bed 6", then "Create 6 beds".
- **Bulk actions (OW-27):**
  - Select, then Hide, Show or Change price.
  - Then "6 beds hidden · Undo" through `notify()`.
  - Switches, reorder and archive update instantly with Undo; form saves wait for the answer (D46).
- **Reorder:** ReUI sortable plus Move up / Move down buttons.
- **Unit limit:** `unit_limit` shows the limit and how many are used, with "More units come with your plan" linking to `/settings/plan` (Phase 9). Bed-space pricing is still open (O4), so show no price for extra units.
- **Empty:** "No units yet. Add your first room, suite or bed to start taking bookings." (MilestonePicture no_units).
- **Add unit:** a short sheet with name, type, guests or beds, and base price, then "Save and add photos", which opens the edit page. The sheet lives in the address, and saving replaces its history entry.
- **Main action:** an "Add unit" pill above the dock, hidden while the keyboard is open.

## `/units/$id` (new route, AppFrame; add to the route catalog and the UI-scan list)

- **Sections in order:** Basics · Photos · Price · Amenities · Booking rules. This prompt builds Basics and Photos; the other three show "Coming next" until P4-6.
- **Layout:** an accordion with a done mark per section on phones; a section list on the left with the form on the right on desktop.
- **Saving:** `SaveBar` with a leave guard and `useFormDraft`. A stale save shows `changed_elsewhere` with Reload.
- **Basics:** name, type, guests, bedrooms, beds, bathrooms, floor area, description, arrival details ("Only guests with a confirmed booking see this"), and room (`group_label`) for beds.

## Photo manager (`PhotoManager` composition plus the helper)

- **Shrinking:**
  - Port `compress-image.ts` into `packages/data`, with tests: 1,600 px on the longest side, WebP where the browser can make it, otherwise JPEG (Safari).
  - One photo at a time; at most 2 uploads at once.
  - Temporary preview links are cleaned up.
- **Files:**
  - Accept JPEG, PNG or WebP up to 15 MB. HEIC is not in `accept`.
  - A HEIC that slips through gets: "This iPhone photo (HEIC) can't be opened here. Pick it from Photos, or take a screenshot."
  - Warn under 1,024 px wide; refuse under 600 × 400.
- **Progress:** each tile shows shrinking → uploading n% → saved or Retry, with "4.2 MB → 180 KB". The thumbnail goes from blurred to sharp. Progress follows the latency switch.
- **Order and cover:** the first photo is the cover. Reorder by drag or with Make cover / Move earlier / Move later (WCAG 2.5.7), and the Cover badge moves with it.
- **Descriptions:** every photo needs a short description, filled in for the owner ("Ulap Suite A, photo 3").
- **Limits:** up to 20 per unit and 10 for the property. At least 3 to list (we suggest 5).
- **Preview:** guests see photos in a 4:3 frame (D23).
- **Reuse:** replace the P4-4 step 3 picker with this composition.

## Not in this task

Prices, amenities and booking rules (P4-6), settings (P4-7), the cropper (Phase 5).

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
