---
name: smartapp-ui
description: Smart App PH brand and component rules for any UI work in this repo. Use this skill before you build or change a page, frame, form, dialog, banner, badge or any React component in apps/dashboard, apps/storefront or packages/ui; before installing or editing a shadcn/Dice UI/ReUI component; and whenever you pick a colour, font, spacing, radius, icon or dark-mode style. Use it even for "small" UI tweaks, because most brand breaks start as small tweaks.
---

# Smart App PH UI

Every screen in this repo should look like one product, in light and dark, on a 360 px phone and a 1280 px desktop. That only works if every colour, size and component comes from one shared system instead of being decided again on each page. This skill is how to stay inside that system.

The system already exists. This skill tells you where it lives and how to work with it; the documents it links are the source of truth, so read them instead of guessing.

| What                                  | Where                                                                                                          |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Colour, type, radius, motion tokens   | `packages/ui/src/styles/tokens.css` (values), `docs/design-tokens.md` (meaning)                                |
| Tailwind names for the tokens         | `packages/ui/src/styles/globals.css` (`@theme inline`)                                                         |
| Installed components and compositions | `docs/ui-library.md`                                                                                           |
| Decisions behind all of this          | `docs/decisions.md`: D34 layers, D35 theme, D36 modes, D37 font pairs, D42 dev switches, D43 banners and glass |
| Live examples                         | `/kit` in the dashboard (Base, Dashboard, Tokens tabs, `/kit/routes`) and `/kit` in the storefront             |
| Words on screen                       | the `smartapp-ui-writing` skill                                                                                |
| Checking your work                    | the `smartapp-ui-check` skill                                                                                  |

## The two looks

- **Platform look** (dashboard, super admin, auth): Smart Blue `--primary`, Growth Mint `--brand-accent`, navy ink, cool neutrals, one font (Plus Jakarta Sans). Light, Dark and System modes (D36). Dark mode is layered, never pure black: sidebar darkest, then page, card, raised.
- **Property look** (storefront `[slug]` pages): each owner's colours through `PropertyTheme` and the `--property-*` tokens, with a 60/30/10 split and a font pair from D37. Light only. `packages/core/src/theme/palette.ts` fixes contrast automatically, so never reject or hand-adjust an owner's colour in a page.

Work out which look your screen uses before writing anything, because the token names differ (`bg-primary` vs `bg-property-10`).

## Surfaces come in layers, in both modes

Depth comes from stepping through surface layers, not from one flat colour plus heavy shadows. Each mode has its own order:

| Layer                             | Token                      | Light                                               | Dark                 |
| --------------------------------- | -------------------------- | --------------------------------------------------- | -------------------- |
| Navigation rail                   | `bg-sidebar`               | light grey `#F1F3F9`                                | darkest `#14171D`    |
| Page                              | `bg-background`            | off-white `#F9FAFD`                                 | `#1B1E24`            |
| Card, panel                       | `bg-card`                  | white `#FFFFFF` (brightest)                         | `#23262D`            |
| Menu, popover, floating           | `bg-popover` / `bg-raised` | white, separated by `shadow-md` and `border-border` | `#2C3039` (lightest) |
| Quiet fill (inputs, chips, hover) | `bg-muted`                 | `#EDF0F6`                                           | `#2A2E36`            |

Put each surface on the layer below it in this table: a card sits on the page, a menu floats over a card. Never place a surface on the same colour as what is behind it (a white card on a white popover, a `bg-card` box inside a `bg-card` panel): it disappears in one mode even if it looks fine in the other. When two surfaces must share a colour, separate them with `border-border` or use `bg-muted` for the inner one. Pure black (`#000`) and pure white text on dark are never used; dark text is off-white `--foreground`.

## Building a screen: the order

1. **Find the frame.** Every route already has one: `AuthFrame`, `FocusFrame`, `AppFrame` or `AdminFrame` in the dashboard, `LandingFrame`, `PropertyFrame` or `ConversationFrame` in the storefront (see `/kit/routes`). Put your page inside it; don't build page chrome (headers, docks, sidebars, banners) inside a feature.
2. **Reuse a composition** from `packages/ui/src/compositions` before anything else: `LoadingState`, `EmptyState`, `ErrorState`, `NotAllowedState`, `OfflineBanner`, `PausedAccountBanner`, `BookingStatusBadge` / `PaymentStatusBadge`, `BottomDock`, `NavDrawer`, `PropertyTheme`. These already handle light/dark, phone/desktop and accessibility.
3. **Then an installed component** from `packages/ui/src/components` (list in `docs/ui-library.md`).
4. **Missing piece? Follow the sourcing order (D60).**
   1. Install it from shadcn, ReUI or Dice UI (next section).
   2. None has it: find a free item in another library that works on Base UI (or uses no Radix), has an open licence (MIT, Apache-2.0, ISC, CC0) and doesn't need the `motion` package. Propose it with its licence and size, and wait for the founder's yes.
   3. Last resort: rebuild it as a composition in `packages/ui/src/compositions` from installed parts and tokens, using the beautiful reference only as a picture (screenshots, sizes, behaviour). Say so in the plan first.

   Never copy code from a paid ("Pro") item or a site without an open licence, never scrape a site's code or compiled CSS, and never hand-build something a library on our list already provides. Open-licence code may be read and adapted with its licence notice kept at the top of the file. Never copy a component into `apps/*`; if it needs different behaviour, wrap it in the app (D34).

5. **Cover every state** the screen can be in: loading, empty, error, offline, not allowed, paused account, long Filipino names and addresses, big ₱ amounts. The demo packs (`?pack=empty`, `busy`, `error`, `slow`, `offline`) exist so you can see each one.

## Installing or editing a component

Installed components are written by other people for every app on the internet, so they arrive with their own colours. That is how the brown banner reached the dashboard: the Dice UI banner shipped `bg-yellow-950`, and nobody mapped it to our tokens.

1. Check `docs/ui-library.md` and the stack register first; the component may be installed or planned under another name.
2. Install with the pinned CLI from the repo root: `pnpm dlx shadcn@4.23.0 add <item>` (registries `@diceui`, `@reui`, `@magicui`, `@evilcharts` are configured in `packages/ui/components.json`). If it fails, stop and report the error; do not write the component yourself.
3. Open the new file and replace every raw colour with tokens (table below). Run `pnpm --filter @smartapp/tooling test` - the brand guard lists anything you missed.
4. Add it to the `/kit` Base tab with a light and a dark sample, and look at both.
5. Log any edit you made to an installed file in the "Installed Component Edits Log" of `docs/ui-library.md`, with the reason. The next install of that component would otherwise silently undo it.

## Colour: use tokens, not values

Raw Tailwind colours (`bg-yellow-950`, `text-blue-900`, `text-white`) and literal values (`#F4F4F5`, `rgb(...)`, inline `style={{ color: ... }}`) ignore dark mode and the owner's palette. `tooling/brand-guard.test.ts` fails CI on them, so it is quicker to use the right token first.

| You want                     | Use                                                                                                                                                                                                                                |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Page, card, popover, sidebar | `bg-background`, `bg-card`, `bg-popover`, `bg-sidebar`, `bg-raised`                                                                                                                                                                |
| Text, secondary text         | `text-foreground`, `text-muted-foreground`                                                                                                                                                                                         |
| Main action                  | `Button` default variant (`bg-primary text-primary-foreground`)                                                                                                                                                                    |
| Soft blue highlight          | `bg-primary-tint` with `text-primary-hover` or `text-foreground` (never `text-primary` on it: 4.23:1)                                                                                                                              |
| Lines and inputs             | `border-border`, `border-input`, focus `ring-ring`                                                                                                                                                                                 |
| Status                       | `BookingStatusBadge` / `PaymentStatusBadge`, or `bg-success-tint` / `bg-warning-tint` / `bg-info-tint` / `bg-danger-tint` with `text-foreground` and an icon in `text-success` / `text-warning` / `text-info` / `text-destructive` |
| Storefront brand surfaces    | `bg-property-60`, `bg-property-30`, `bg-property-10 text-property-10-foreground`                                                                                                                                                   |

Status always has an icon, a word and a colour, because one in twelve men cannot tell red from green. Growth Mint (`brand-accent`) is decoration and never means a status.

Translucent layers: mix colours in `srgb` or `oklab`, not `oklch`. In OKLCH the transparent side has hue 0, which pulled the blue-grey top bar toward red (D43).

## Size, type and motion

- Radius comes from `--radius` (10 px) through `rounded-lg` and friends; don't pick pixel radii.
- Controls are at least `--control-h` (44 px dashboard, 48 px storefront) and inputs use 16 px text so iOS does not zoom.
- Text comes from `font-sans` / `font-heading`; numbers that line up (prices, counts, dates) use `tabular`.
- Motion uses `--dur-fast`, `--dur-base`, `--dur-slow`, which drop to zero under reduced motion. Animate in response to a person's action (opening, confirming), not to decorate a page.
- Keep a visible focus ring on everything clickable; never remove `outline` without a replacement ring.

## Habits that make a screen look generated

Avoid these unless the screen has a real reason: ALL-CAPS labels, a label above every heading, numbered markers on content that is not a sequence, every section in an identical card, hover animations on every card, one word in a headline in a different colour. Structure should carry information; if a border, badge or divider does not tell the person something, leave it out.

## Before you say it is done

Follow `smartapp-ui-check`. In short: `pnpm check` passes (includes the brand guard), you looked at the screen in light and dark at 360 px and 1280 px (or read the CI UI scan screenshots), and any intended visual change has new screenshot baselines generated in CI.
