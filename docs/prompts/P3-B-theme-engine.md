Read AGENTS.md, docs/decisions.md (D34–D41), and docs/blueprints/feature-blueprint.md section 7a only up to and including "The sections" table (the readability rules and the Style and Fonts rows). Use what P3-A added in packages/ui.

## Goal

Turn any owner's page look (brandColor, pageColor, cardColor, accentColor, fontPair, logoShape) into safe CSS variables for the storefront. Colours are fixed for readability instead of being refused. Guests download only their property's font pair.

## Reference code to port (read-only)

The food app solved this. Clone it read-only OUTSIDE this repo:
`gh repo clone webserbisyo/Smart-App-PH---FINAL-2026 /tmp/food-ref -- --depth 1`
(if that fails, stop and tell me). Read, then adapt (do not copy blindly):

- packages/core/src/rules/palette.ts and packages/core/test/palette.test.ts (the 60/30/10 palette and the contrast guard: words switch to black or white at 4.5:1; buttons lighten or darken until their words read at 4.5:1 and they stand out 3:1 from page and cards)
- packages/ui/src/lib/css-vars.ts and packages/ui/src/lib/font-pairs.ts
- packages/ui/src/compositions/shop-theme.tsx and shop-theme-document.tsx
  Rename shop to property everywhere. Drop anything about a dark shop (the storefront is light only, D36) and anything from style-designer.ts (the logo style picker belongs to the editor, Phase 5). These files are our own earlier code, not installed components, so porting them is allowed. Delete /tmp/food-ref at the end.

## Plan first

Post the files you will port and how each changes, the new font pair ids and their families, the packages to add, and how the property's variables reach portals (sheets, toasts). Wait for my OK.

## Branch

`ag/p3b-theme-engine` from the latest main. Follow AGENTS.md rule 10.

## Steps

1. packages/core/src/theme/palette.ts with its tests: `propertyPalette(look)` returns the 60/30/10 roles plus the brand accent, every one checked with the contrast guard. Pure maths, no package. Add test cases for all four demo brands and three worst cases: yellow #FFE600 as the button colour, a near-white page with a white card, and a near-black brand colour.
2. Font pairs (D37): rename FONT_PAIRS in packages/core to `malinaw`, `friendly`, `street`, `cafe`, `elegant`, `bakery`, `playful`, `modern`, `bold` and `homey`, with the families:
   - malinaw: Plus Jakarta Sans
   - friendly: Fredoka + Nunito
   - street: Bricolage Grotesque + DM Sans
   - cafe: Fraunces + Figtree
   - elegant: Playfair Display + Manrope
   - bakery: Young Serif + Nunito
   - playful: Baloo 2 + Nunito
   - modern: Sora + Outfit
   - bold: Unbounded + Plus Jakarta Sans
   - homey: Young Serif + Plus Jakarta Sans

   Update the demo brands (Ulap Suites cafe, Bahay Batis bold, Ilaw Residences modern, Tita Lorna's Dorm homey) and regenerate the marketing snapshot.

3. Install the font families through Fontsource, version 5.3.0, OFL-1.1, adding each to the Stack register first: variable packages for Fredoka, Nunito, Bricolage Grotesque, DM Sans, Fraunces, Figtree, Playfair Display, Manrope, Baloo 2, Sora, Outfit and Unbounded; the static package for Young Serif. Declare them so a browser downloads a family only when a page uses it. Prove that with a test or a note in the report.
4. packages/ui/src/compositions/property-theme.tsx: sets the CSS variables from the palette and the font pair (`--font-sans`, `--font-heading`). On the storefront it also copies them onto <html>, so portals get them. It also sets the storefront's `--control-h` to 48px.
5. Record D37 in docs/decisions.md as written at the end.

## Install rules

Same as P3-A: the Stack register first, exact versions, the 7-day rule. Stop on any failure; never hand-build.

## Not in this task

Frames, routes, kits, the editor and its style picker, the dark storefront.

## Checks

- `pnpm --filter @smartapp/core test`, `pnpm --filter @smartapp/ui test` and their typechecks while you work.
- Do not run pnpm build locally.
- `pnpm check` once before the pull request.
- Save this prompt as docs/prompts/P3-B-theme-engine.md, add its README line, tick P3-B, and add one CHANGELOG line.

## Done when

CI is green and the PR is merged. Your report lists each demo brand's resolved palette with its contrast ratios, and what the guard changed for the three worst cases.

## Decision to record

- D37 Font pair ids follow the Feature blueprint: malinaw, friendly, street, cafe, elegant, bakery, playful, modern, plus bold (Unbounded + Plus Jakarta Sans) and homey (Young Serif + Plus Jakarta Sans). Ulap Suites cafe, Bahay Batis bold, Ilaw Residences modern, Tita Lorna's Dorm homey.

Two token fixes from P3-A, in this same pull request:

1. Change the light `--input` in packages/ui/src/styles/tokens.css from #8C929F to #83899A (passes 3:1 on background 3.35, card 3.49 and muted 3.06). Update the contrast test so input is checked against background, card and muted.
2. Add a test that fails if `--primary` is ever used as text on `--primary-tint` in light mode (4.23:1), and write the rule in docs/decisions.md under D35: on --primary-tint, text uses --primary-hover or --foreground.
