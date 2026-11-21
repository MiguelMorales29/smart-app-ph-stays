# P5-6 · Page editor parts (the 14 panels)

Model: Gemini 4 Argon, Medium. Planning mode. After P5-5 is merged.

Read first: AGENTS.md, docs/prompts/P5-guide.md, Feature blueprint §7a "The sections" table (every rule in it), "Readability is fixed for the owner, not blocked", decisions E3 to E9 and D31, D32. Files: the P5-5 engine, `packages/core/src/theme/palette.ts`, `packages/ui/src/compositions/photo-manager.tsx`, `grouped-rows.tsx`, `choice-chip.tsx`, `app-sheet.tsx`.

Port from the food app (`/tmp/food-ref`, read-only; clone it there first with `gh repo clone webserbisyo/Smart-App-PH---FINAL-2026 /tmp/food-ref` if it is missing):

- Panels: `apps/dashboard/src/features/editor/panels/brand-panel.tsx`, `banners-panel.tsx`, `announcement-panel.tsx`, `opening-panel.tsx`, `about-panel.tsx`, `owned-panel.tsx`, `field-count.tsx`
- Style: `style-card.tsx`, `palette-check.tsx`, `any-colour-picker.tsx`, `use-logo-colours.ts`, `logo-loupe.tsx`, `logo-tools.ts`, `logo-places.tsx`, `font-picker.tsx`, `banner-text.ts`, `picture.ts`
- Rules: `packages/core/src/rules/palette.ts` and `style-designer.ts` (merge with our `packages/core/src/theme/palette.ts`; keep one source and every test)

## Goal

Every wave 1 part of the page can be set from a phone in a few taps, and the page always stays readable.

## Branch

`ag/p5-6-editor-parts` from main. One PR (split into two PRs, style parts and content parts, if the diff passes about 2,500 lines).

## The panels (each follows the §7a rules exactly)

1. **Style: logo and colours:**
   - Logo upload: trim, square, at least 256 px, "Remove white background", circle or rounded.
   - Tagline (80).
   - The 8 styles made from the logo with "Best match", plus "More like this".
   - Fine-tune page (60), cards (30), buttons (10) and the accent with swatches or any colour (HEX, RGB, HSL, eyedropper, copy). "Tap your logo" magnifier for iPhone.
   - The 60 · 30 · 10 strip with its five checks.
   - Use the Dice UI **Color Picker** (Base UI build) for the any-colour part if it covers the food app's picker; otherwise port the food one.
2. **Fonts:** the 10 pairs (D32) as cards showing the pair's own letters; self-hosted.
3. **Install look:** home-screen name (12, with a live home-screen mock), splash colour (default the 60, with a contrast check for logo and name), animation None or Fade (wave 1), show name or tagline. Note that phones that installed earlier may keep the old icon.
4. **Hero photos:** pick the cover and order the first 5 from the property and unit photos (`PhotoManager` grid, keyboard reorder).
5. **Promo banners:** up to 3; 16:9 crop (1600 × 900); title 40, line 90, photo description 120 (required); one button to a unit, a promo or Rewards; move up or down; 3/5/7/10 s. The title and line can be typed on the preview (ported `banner-text.ts`).
6. **Announcement:** text 200, tone, optional end date; writing a message turns the part on.
7. **About and host:** about 600; host display name, photo, languages (chips). Worked-out facts are shown, not editable.
8. **Units:** up to 4 featured, in order, from the unit list (sortable); "Change prices in Units" link.
9. **Highlights:** up to 6 from the amenities (chips with the selected look).
10. **Rules and policies**, 11. **Location and contact**, 12. **Times:** owned parts. Show or hide, a summary of what guests see, and a "Change in Settings" link to the right Settings page (E5).
11. **FAQ:** up to 10, question 200, answer 300; add, edit, reorder, delete with Undo.
12. **Share and search:** title 60, description 155 with live counters; share picture made from cover, name and logo, or uploaded at 1200 × 630; "Hide from search while setting up".

## Rules

- Every field shows its counter near the limit (`field-count.tsx`).
- Uploads use the existing photo pipeline (`app/photos/use-photo-pipeline.ts`, `compressImage`).
- Panels are forms inside the sheet: inputs 16 px, the keyboard never hides the field being typed (Base UI `VirtualKeyboardProvider`), and each panel scrolls with edge fades.
- Words follow `smartapp-ui-writing`; any colour is allowed, words switch to black or white automatically (never block the owner).

## Not in this task

Guest count (wave 2), reordering parts, starting looks, version history.

## Done when

- The pattern guide's definition of done (§6), with screenshots of every panel on a phone (390 px, sheet at 55 %) and on desktop.
- Palette tests from the food app pass here; a bright yellow brand still gives readable buttons and text (show it in the PR).
- One full run recorded: change style, font, a banner, FAQ, then publish, on a 390 px viewport.
- `pnpm check` green, bundle budget passes. PROGRESS: tick P5-6. One CHANGELOG line.
- Open the PR, wait for green CI, **do not merge**. Report the PR number.
