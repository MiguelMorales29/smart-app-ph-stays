# Design Tokens & Theme System

Agents: the `smartapp-ui` skill (`.agents/skills/smartapp-ui/SKILL.md`) explains how to use these tokens; this file explains what they mean.

The token layer lives in [tokens.css](../packages/ui/src/styles/tokens.css), mapped to Tailwind v4 theme variables in [globals.css](../packages/ui/src/styles/globals.css) and verified by automated WCAG AA tests in [tokens-contrast.test.ts](../packages/ui/test/tokens-contrast.test.ts).

## 1. Platform Theme (Dashboard & Super Admin, D35 & D36)

- **Warm neutrals (D61, Phase 4.5):** the structure follows the Claude apps (warm greys, layered surfaces, one action colour). Light: page `#f7f6f2`, rail `#efede6`, card `#ffffff`, quiet fill `#efede6`, border `#e3e0d7`, input edge `#8a867b`, ink `#1d1c19`, secondary text `#6b6960`. Full table and rules in `docs/pattern-guide.md` §1.
- **Brand & ink:** Smart Blue (`--primary`: `#2866ee` light / `#7aa5ff` dark, with `#121a2e` text on it), Growth Mint (`--brand-accent`: `#7ed6ac` light / `#40be8a` dark), warm ink (`--foreground`: `#1d1c19` light / `#f4f3ee` dark).
- **Modes:** Dashboard and Super Admin support **Light**, **Dark**, and **System**, persisted per device in `localStorage` (`smartapp-dashboard-theme`) and switched inside `AccountMenu` / `AuthFrame`.
- **Layered dark surfaces (never pure `#000`):**
  - `--sidebar`: `#171715` (darkest navigation rail)
  - `--background`: `#1f1e1c` (page canvas)
  - `--card`: `#2a2927` (card surface)
  - `--popover` / `--raised`: `#33322f` (popovers, sheets & raised menus)
  - `--muted`: `#2e2d2a`, `--border`: `#3b3a36`, `--input`: `#7a776e`, secondary text `#a9a69c`
- **Nested light previews inside dark dashboard:** `:root, .light` resets light token values inside any `.light` container, and `@custom-variant dark` excludes `.light *` descendants so Phase 3 `/kit` side-by-side showcases and Phase 5 editor previews stay strictly light.
- **WCAG AA Guardrails:**
  - Text on surfaces, muted text on surfaces, buttons (`--primary-foreground` on `--primary`), `--primary-hover` / `--foreground` on `--primary-tint`, and status ink on status tints all enforce `>= 4.5:1` contrast. _(Never place light `--primary` `#2866ee` text directly on `--primary-tint` `#e6edfc`, which measures `4.23:1`; selected states use `--foreground` text with a `--primary` ring.)_
  - Controls and borders (`--input` on `--background` / `--card` / `--muted`, `--ring`) enforce `>= 3.0:1` contrast (dark `--input` was adjusted from `#6f7581` to `#737985` in P3-C to meet `>= 3.0:1` against dark `--muted`).

## 2. Typography, Radii, Shadows & Motion

- **Platform font:** `@fontsource-variable/plus-jakarta-sans` (`5.3.0`, OFL-1.1), imported in `packages/ui/src/styles/globals.css`. Dashboard builds include only Plus Jakarta Sans (never the 13 storefront fonts).
- **Storefront font pairs (D37):** Self-hosted in `packages/ui/src/styles/property-fonts.css` and imported only by `apps/storefront`. Ten pairs mapped in `FONT_PAIRS` (`packages/core/src/theme/fontPairs.ts`):
  - `malinaw`, `friendly`, `street`, `cafe` (Ulap Suites), `elegant`, `bakery`, `playful`, `modern` (Ilaw Residences), `bold` (Bahay Batis), `homey` (Tita Lorna's Dorm).
- **Scale & touch defaults:**
  - Base `--radius`: `0.625rem` (`sm` `-4px`, `md` `-2px`, `lg` base, `xl` `+4px`).
  - Control height `--control-h`: `44px` default (`48px` in `apps/storefront`), `16 px` (`1rem`) minimum input font size to stop iOS Safari auto-zoom.
  - Floating phone dock tokens: `--dock-height: 4rem`, `--dock-max-width: 24rem`, `--dock-offset: 0.75rem`, `--shell-header-height: 3.5rem`.
  - Durations: `--dur-press: 70ms` (with the `press` utility: 0.98 scale on press), `--dur-fast: 120ms`, `--dur-base: 200ms`, `--dur-slow: 320ms`, zeroed automatically under `@media (prefers-reduced-motion: reduce)`. Utilities `press` and `scroll-fades` (with `useScrollFades`) live in `globals.css`.

## 3. Storefront Theme Engine (`propertyPalette` + `PropertyTheme`)

Storefront pages are **light only** (D36). Each property provides `brandColor`, `pageColor`, `cardColor`, `accentColor`, `fontPair`, and `logoShape` (`'circle' | 'rounded'`), resolved in `packages/core/src/theme/palette.ts`:

- **60 / 30 / 10 allocation:** `property60` (page background), `property30` (card/bar surface), `property10` (primary buttons & active indicator), plus `brandAccent`.
- **Automatic contrast guard (never rejects an owner colour):**
  - Ink on `property60`, `property30`, `property10`, and `brandAccent` switches between dark `#0b1633` and white `#ffffff` to guarantee `>= 4.5:1`.
  - Button fills (`property10`, `brandAccent`) lighten or darken along perceptual OKLCH lightness until their ink meets `>= 4.5:1` AND the button stands out `>= 3.0:1` from both `property60` and `property30`.
- **Portal forwarding:** `PropertyTheme` sets `--property-*`, `--font-*`, and `--logo-radius` variables on its wrapper AND syncs them to `document.documentElement` when `withPortals` is enabled so sheets, drawers, dropdowns, and toasts inherit the property's look.

## 4. D35 Status Colour Map (`StatusBadge`)

Status ALWAYS pairs a semantic colour with an icon and a plain-word label (Growth Mint is never used for status):

| Meaning                | Light ink / tint       | Dark ink / tint        | Statuses                             |
| ---------------------- | ---------------------- | ---------------------- | ------------------------------------ |
| **Done (green)**       | `#007031` on `#daf5de` | `#50bf6f` on `#193b22` | `confirmed`, `completed`, `approved` |
| **Waiting (amber)**    | `#7d5200` on `#fee9ce` | `#db9400` on `#47300c` | `held`, `in_review`, `submitted`     |
| **In progress (blue)** | `#006393` on `#dcf0ff` | `#4faeeb` on `#133951` | `checked_in`                         |
| **Problem (red)**      | `#ac111f` on `#ffe6e4` | `#ff8a84` on `#542523` | `cancelled`, `rejected`, `reversed`  |
| **Finished (grey)**    | `#5c6372` on `#edf0f6` | `#9fa5b0` on `#2a2e36` | `expired`                            |
