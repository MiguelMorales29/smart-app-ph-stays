# UI-1 to UI-6 · Component library expansion

Six Antigravity prompts that install the catalog in `docs/component-catalog.md` into `packages/ui`. Run them **after P5-2 is merged** (P5-2 also changes `packages/ui`), one at a time, each in a new conversation. They install and adapt components; they don't change any screen. Claude reviews each PR (D70).

Model for all six: **Gemini Flash, High** (mechanical work). If a batch fails the type check many times, switch that batch to Gemini 4 Argon or Neon, Medium.

## Rules for every batch (paste these with the batch)

```
Read first: AGENTS.md, docs/component-catalog.md, docs/ui-library.md, the smartapp-ui skill, packages/ui/components.json.

1. Install only with the pinned CLI from the repo root: pnpm dlx shadcn@4.23.0 add <item> -c packages/ui -y. Base UI builds only (ReUI: the base style; Dice UI: the default). If an install fails, stop and report the error; never write the component yourself.
2. Port from the food app (rm -rf /tmp/food-ref && gh repo clone webserbisyo/Smart-App-PH---FINAL-2026 /tmp/food-ref) only for items the catalog marks "food app", and only by copying its installed file (same registry version) and then adapting it here.
3. After each install: replace every raw colour with our tokens (brand guard must pass), keep 16 px inputs and the 44 px control height, use our radius and motion tokens, and keep Base UI (no Radix imports).
4. No new package without listing its name, version, licence (MIT, Apache-2.0, ISC or CC0 only) and gzipped size in the PR; never the motion package unless O15 is decided as (b).
5. Show each new piece in the existing kit tabs of the app that uses it (never add a separate "Library" tab): dashboard `/kit` Base (primitives & display), Forms (inputs & pickers), Patterns (shared compositions), and storefront `/kit` (guest-facing pieces in the matching existing section or a new section if none fits), with light and dark samples. Variants go as a "Variants" row under their base component. If a tab file grows past about 600 lines, split it into section files in the same folder. Before pushing, open the kit tabs you changed in the dev server (light and dark, phone and desktop width) and fix anything overlapping, cut off or unstyled (one look only). Add a row to docs/ui-library.md (name, source, version, licence, edits).
6. Don't change any screen or existing composition, except the retrofit list in UI-2. Don't weaken eslint or tsconfig; fix the installed file instead and log the edit.
7. Fast mode: run pnpm format:check and pnpm check once. Push, trigger the update-screenshots workflow once (kit pages change in every batch), wait only for the Screenshots job, and fix any UI scan failure (accessibility, 16px inputs, overflow). No Lighthouse. Don't merge.
8. Check before installing: search packages/ui (components, compositions, variants) and docs/ui-library.md. If the piece already exists, skip it.
9. Never overwrite: if the CLI asks to replace an existing file, answer no. If a shared file changed anyway (button.tsx, utils.ts, globals.css, components.json), restore it and log it.
10. No two pieces doing the same job: if a new piece duplicates an existing one, keep ours and skip the new one. End every PR with a table: Installed / Skipped (already had) / Skipped (duplicate of …) / Adapted, plus the running total of components, compositions and variants in packages/ui.
```

## UI-1 · Food app components (forms, feedback, navigation)

Branch `ag/ui-1-food-components`. From catalog section A1: action-bar, aspect-ratio, avatar-group, badge-overflow, button-group, checkbox-group, collapsible, hitbox, input, select, input-otp, pending, scroller, skip-nav, status, visually-hidden-input, time-picker, qr-code, rating (`@diceui/rating`). Plus port from the food app: android, client-only, direction, heart-toggle, celebrate (merged into `celebration.ts` named by effect, e.g. `confettiBurst`), status-logo, brand-lockup, preview-panel, and the toggle-group variants, plus the compositions copy-button, count-up, drawn-check, info-list, messenger-icon, otp-resend, page-header, responsive-sheet, scroll-hint, slot-chips (rename food words). Compare the food app's notify, app-toaster and app-toast-layer with our current toast; port them only if they do more than ours, otherwise list them as duplicates.

## UI-2 · Photos, colours and the picture maker

Branch `ag/ui-2-photos-colours`. Cropper, compare-slider, ReUI color-picker, Dice UI color-swatch, masonry; the compositions avatar-maker, face-picker, face-customiser, person-avatar, avatar-theme with the DiceBear styles adventurer, lorelei, micah, open-peeps, pixel-art and thumbs (credits shown on screen as in the food app). A kit sample of the "Your picture" sheet with Faces / Photo and the circle cropper, like the food app's Settings → Account. Every photo upload in both apps goes through the cropper (`PhotoCropSheet`) and then `@smartapp/data/compress-image`, with no exceptions (keep the existing retrofit list and add any upload spot it is missing).

### UI-2 also retrofits the screens that already exist (Lex, 22 Nov)

Unlike the other batches, UI-2 changes existing screens, because these are general pieces where the food app's version is better:

- **Settings → Account → picture:** replace our picker with the food app's "Your picture" sheet: Faces (styles, 12 faces, Customise this face, Surprise me, background colours) and Photo (pick a photo, circle cropper with zoom, "We keep a 256 px copy"), the pencil badge on the avatar, and the DiceBear credits line. Uploading your own photo needs a photo field on the profile: add `profiles.photo_file_id` and a `setProfilePicture` operation to the contract and the memory adapter (this pulls "upload your own profile photo" forward from Phase 8, D70).
- **Every photo upload in both apps** goes through the cropper (`PhotoCropSheet`) and then `@smartapp/data/compress-image`, with no exceptions (unit photos, onboarding photos, Settings payment QR/proof uploads, profile picture, and any other upload spot).
- **Owner avatar everywhere** (sidebar account menu, top bar, Home) uses the same `person-avatar` so a picked face or photo shows the same in every place.
- **Then the general pieces from UI-1** replace hand-made ones where they exist: `copy-button` (web address, payment accounts), `otp-resend` (sign-up and password codes), `page-header`, `info-list` (Settings summaries). List each replaced spot in the PR.

## UI-3 · Data and lists

Branch `ag/ui-3-data`. ReUI data-grid (with `@tanstack/react-table` 9.3.1 and `@tanstack/react-virtual` 3.14.22, already in the Stack register), filters, kanban, timeline, tree, scrollspy, frame, icon-stack, icon-tile, file-type; Dice UI data-table, faceted, key-value, listbox, editable, tags-input, relative-time-card, selection-toolbar, stack.

## UI-4 · Dates, calendars and time

Branch `ag/ui-4-dates`. ReUI event-calendar, date-selector, gantt; the food app's vendored booking-slot-calendar and week-strip-calendar; shadcn calendar variants (range with a price under each day, two months, check-out-only days). Add `@date-fns/tz` 1.5.0 if the event calendar needs it.

## UI-5 · Conversation, charts and stats

Branch `ag/ui-5-chat-charts`. ReUI message, bubble, attachment, emoji-picker, marker, signature-pad, code-block; shadcn chart with recharts 3.8.0 (in the Stack register); port the food app's evilcharts set and the `stamp-card` composition (for stays rewards later); Dice UI gauge, stat, marquee. Animated effects (`animated-list`, `animated-shiny-text`, `blur-fade`, `border-beam`, `grid-pattern`, `number-ticker`, `progressive-blur`, `pulsating-button`, `shine-border`, `word-rotate`): port them only if decision O15 in `docs/decisions.md` says (b); otherwise make CSS versions of `number-ticker` and `shine-border` and list the rest as "waiting for O15".

## UI-6 · Missing primitives and variants

Branch `ag/ui-6-primitives-variants`. shadcn combobox, command, context-menu, hover-card, kbd, menubar, navigation-menu, pagination, resizable, slider; ReUI autocomplete, cascader, phone-input; Dice UI angle-slider, command-stack, media-player, mention, segmented-input, speed-dial, swap, tour, presentation, query-builder. Then the variants in catalog section E: for each row, install the listed ReUI / Dice UI examples as files under `packages/ui/src/variants/<area>/` and show them as a "Variants" row under their base component on the existing kit tabs. Report the exact final total of components, compositions and variants in the PR.
