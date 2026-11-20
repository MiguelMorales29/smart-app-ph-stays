# Pattern Guide v2 (Phase 4.5)

How every owner screen looks, moves and behaves. Approved by Lex on 20 Nov 2026 (D61–D64). The research behind it is in the Claude project doc `phase-4-ux-research.md` and the interactive "Phase 4 UX Lab" page.

Read this before building or changing any screen. Each pattern names the installed component that builds it and the checks it must pass. A screen is not done until every pattern on it passes its checks at **390 px with Safari's bars** and at **1280 px**, in **light and dark**.

## 1. Colour (D61)

The structure follows the Claude apps: warm greys, layered surfaces, one action colour, separate status colours. The values are ours.

| Role                                | Light                   | Dark                             | Notes                                                     |
| ----------------------------------- | ----------------------- | -------------------------------- | --------------------------------------------------------- |
| Page `--background`                 | `#F7F6F2`               | `#1F1E1C`                        | Warm off-white / warm charcoal, never pure white or black |
| Sidebar, rail `--sidebar`           | `#EFEDE6`               | `#171715`                        | Darkest layer in dark mode                                |
| Card `--card`                       | `#FFFFFF`               | `#2A2927`                        | Brightest surface in light                                |
| Menu, sheet `--popover`, `--raised` | `#FFFFFF` (+ shadow)    | `#33322F`                        | Lightest surface in dark                                  |
| Quiet fill `--muted`                | `#EFEDE6`               | `#2E2D2A`                        | Inputs, chips, grouped-row backgrounds                    |
| Text `--foreground`                 | `#1D1C19` (15.8:1)      | `#F4F3EE` (15.0:1)               |                                                           |
| Secondary text `--muted-foreground` | `#6B6960` (5.1:1)       | `#A9A69C` (6.8:1)                |                                                           |
| Lines `--border`                    | `#E3E0D7`               | `#3B3A36`                        | Hairlines only; never the only thing marking a control    |
| Input edge `--input`                | `#C9C5BA`               | `#55534D`                        |                                                           |
| Action `--primary`                  | `#2866EE`               | `#7AA5FF` (text on it `#121A2E`) | Smart Blue. Buttons, links, focus, selected               |
| Selected fill `--primary-tint`      | `#E6EDFC`               | `#24324F`                        | Always with a 1.5 px `--primary` ring                     |
| Brand accent                        | Growth Mint (unchanged) | Growth Mint (unchanged)          | Decoration only, never status                             |

Status colours keep their own ramps (success, warning, info, danger) and always come with an icon and a word.

## 2. Motion (D62)

CSS only (no `motion` package). Tokens, all zero under reduced motion:

| Token         | Time   | Used for                                                  |
| ------------- | ------ | --------------------------------------------------------- |
| `--dur-press` | 70 ms  | Press feedback: `active:scale-[0.98]` on buttons and rows |
| `--dur-fast`  | 120 ms | Colour and state changes, checkmarks                      |
| `--dur-base`  | 200 ms | Segmented thumb, chevrons, toasts                         |
| `--dur-slow`  | 300 ms | Sheets, sections, the save pill                           |

Rules:

- Animate only in response to the owner's action.
- **Never remove content while it animates.** Closing sheets, dialogs and sections keep their content until the close transition ends.
- Height changes use the accordion's own variables or `grid-template-rows: 0fr → 1fr`.
- Address (URL) updates never re-mount what is animating.

## 3. Patterns

### 3.1 Sheet (phones) / dialog (desktop)

- **Component:** `ResponsiveDialog` over the Base UI drawer (`packages/ui/src/components/drawer.tsx`), with `snapPoints`.
- **Behaviour:**
  - Opens at **half** height for short tasks and drags to **full**. Long forms open at full.
  - Grabber on top. Close (×) top-left; one main button pinned at the bottom.
  - The body scrolls inside the sheet and fades at the top and bottom edges when there is more.
  - Swipe down closes; with unsaved input it asks first.
  - One sheet at a time.
  - The keyboard never covers the focused field (`Drawer.VirtualKeyboardProvider`).
- **Checks:**
  - [ ] The footer button is fully visible above Safari's bar and the home indicator.
  - [ ] The body scrolls; the edge fades appear and disappear correctly.
  - [ ] Dragging snaps between half and full.
  - [ ] Closing shows the content until the sheet is gone.
  - [ ] Back closes it (the sheet is in the address).

### 3.2 Grouped rows

- **Component:** `SettingsList` / `Item` compositions.
- **Behaviour:**
  - Label left, value right, chevron when it opens something, or a switch.
  - Rows sit in a rounded group on the quiet fill, with a small group title above.
  - A row that opens a choice opens a sheet with a checked list.
  - 48–52 px tall.
- **Checks:**
  - [ ] The value is readable in both modes.
  - [ ] The whole row is the target.
  - [ ] Long values cut to one line with an ellipsis.

### 3.3 Segmented pill

- **Component:** new composition `SegmentedControl` on `ToggleGroup` (single).
- **Behaviour:** 2–4 options. A raised thumb slides to the picked option (`--dur-slow`, slight overshoot). More than 4 options use grouped rows in a sheet instead.
- **Checks:**
  - [ ] The picked option is obvious in dark mode without colour alone.
  - [ ] Keyboard arrows move the choice.

### 3.4 Compact stepper

- **Component:** new composition `InlineStepper` on `NumberField`.
- **Behaviour:**
  - A pill with − value +, sitting at the right of a grouped row.
  - Only for small counts (guests, beds, bedrooms, bathrooms, nights).
  - Large ranges (booking window, percentages) open a picker sheet instead.
- **Checks:**
  - [ ] At most one stepper per row.
  - [ ] Buttons are 44 px targets on touch.
  - [ ] The value uses tabular numbers.

### 3.5 Chips (many choices)

- **Component:** `Toggle` with the shared `chip` look.
- **Selected look:** `--primary-tint` fill, a 1.5 px `--primary` ring, a check icon and medium-weight text.
- **Checks:**
  - [ ] Selected and unselected are clearly different in dark mode.

### 3.6 Save pill (unsaved changes)

- **Component:** `SaveBar` rebuilt.
- **Phones:** a floating dark pill above the dock showing "2 changes", Discard and Save. It slides up when the form becomes dirty.
- **Desktop:** the same actions in the top bar.
- **Saving:** Save shows a spinner, then "Saved" for 1.5 s, then the pill leaves. Leaving with changes asks first.
- **Checks:**
  - [ ] Never covers the field being edited.
  - [ ] Never sits under the dock or the Preview tab.

### 3.7 Section navigation (long editors)

- **Component:** `Accordion` on phones; a section list on the left from 1280 px.
- **Behaviour:** each section header shows its **current value** ("₱2,600 · Fri/Sat ₱3,200", "7 photos"), not just a tick. Only unfinished sections get a dot. All section content stays mounted. Heavy sections load on first open and then stay.
- **Checks:**
  - [ ] Opening and closing animate smoothly.
  - [ ] Tapping a section doesn't jump the page.

### 3.8 List cards

- **Phones:** a row card with a 4:3 thumbnail (88 px wide), name (2 lines max), price, status badge and ⋯ menu.
- **Desktop:** a card grid (3–4 per row) or a table only when there are more than 8 items.
- **Bottom padding** leaves room for the floating Add button so it never covers the last card.

### 3.9 Photo grid

- **Phones:** 3 columns at 4:3 with Cover on the first.
- **Descriptions** live in each photo's menu ("Describe photo"), not as a box under every photo.
- **Reorder:** drag, or Move earlier / later in the menu.
- **Progress** shows inside the photo.

### 3.10 Empty, loading, error

- **Empty:** one picture (Fluent), one sentence, one action.
- **Loading:** a skeleton in the shape of the content.
- **Error:** a sentence and Try again.
- **Never** show developer text ("Coming in phase 8", scenario or role lines) outside `/kit`.

### 3.11 Banners

- **Account status** (pending, paused): one calm row with an icon and one link. The full banner appears only on Home.

### 3.12 Toasts

- Past tense plus Undo when it can be undone.
- On phones, above the dock; never over the save pill.

## 4. Dev tools (D63)

The Preview ("view as") switch lives in the account menu on phones and as a small corner tab on desktop. It never floats over content.

## 5. Demo photos (D64)

The dashboard serves its own copy of the demo media, so photos load on any deploy without the storefront.

## 6. Definition of done for every UI prompt

1. `pnpm check` and CI (Check, Screenshots with axe) are green.
2. Every pattern used on the screen passes its checks above.
3. Before and after screenshots of each touched screen at 390 px (with Safari's bars simulated) and 1280 px, light and dark, are attached to the PR.
4. Short recordings (GIF or frames) of each sheet, section and save pill opening and closing.
5. The design skills were used: `design:design-critique` on the result, `design:accessibility-review`, `design:ux-copy`, plus `smartapp-ui`, `smartapp-ui-writing` and `smartapp-ui-check`.
6. Before wiring an installed component, read how it animates, scrolls and shows selection.
