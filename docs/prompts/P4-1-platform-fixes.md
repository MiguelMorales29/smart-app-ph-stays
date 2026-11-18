# P4-1 · Phone and platform fixes before the Phase 4 screens

Read AGENTS.md, docs/decisions.md (D35, D42–D44 and the Phase 4 block D45–D60), docs/PROGRESS.md, docs/design-tokens.md, `packages/ui/src/styles/globals.css`, `packages/ui/src/components/{input,sheet,drawer,dropdown-menu}.tsx`, `apps/dashboard/index.html`, `apps/dashboard/src/app/router.tsx`, the `AuthFrame` and `FocusFrame` files, `apps/storefront/src/app/layout.tsx` and `tooling/e2e/ui-scan.e2e.ts`. Load the `smartapp-ui` and `smartapp-ui-check` skills.

## Goal

Fix the eight repo gaps that would break the Phase 4 forms on phones (Phase 4 plan, section 10), before any form is built. No new pages.

## Plan first

Post the exact changes per file, the new tokens and utilities, and the two new UI-scan rules. Wait for my OK.

## Branch

`ag/p4-1-platform-fixes` from the latest main. Follow AGENTS.md rule 10.

## Package (approved)

`@axe-core/playwright@4.14.0` in `tooling` devDependencies only, with its line under "P4-1 approved packages" in docs/decisions.md. Nothing else.

## Fixes

1. **Installable dashboard.**
   - A web app manifest in `apps/dashboard/public`: name "Smart App PH", short name "Smart App", `display: standalone`, `start_url: /home`, theme and background colours from the light page token.
   - App icons at 192, 512 and a maskable 512, made from the existing favicon mark, plus a 180 px `apple-touch-icon`.
   - Link them in `index.html`, together with `apple-mobile-web-app-capable` and a status-bar style.
   - The installed app must open on the page colour, never white.
2. **Viewport (both apps).** Use `width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content`. Never block zoom. Use `dvh`, never `100vh`.
3. **Scroll restoration.** Turn on TanStack Router's scroll restoration. Going back returns to the old position; a new page starts at the top.
4. **Notch and home bar.** The `AuthFrame` and `FocusFrame` headers and footers add `env(safe-area-inset-*)` once, the same way `AppFrame` does. No double padding.
5. **Inputs on touch (sizes follow the pointer, not the screen width).**
   - In the shared `input` (and the future textarea/select through a shared class), use `pointer-coarse:` for `min-h-11` (44 px) and `text-base` (16 px).
   - Keep the desktop size for fine pointers.
   - Remove the 14 px text from 768 px up, which made iPads zoom.
   - Log the edit in `docs/ui-library.md`.
6. **Autofill.** Autofilled fields keep our `--input`/`--foreground` tokens in light and dark (no browser yellow or blue). Do it with a global rule in `globals.css`.
7. **Motion tokens and reduced motion (D53).**
   - Add duration utilities: fast 120 ms, base 200 ms, slow 320 ms.
   - Add easing tokens: enter, exit, and a small spring for icon pops only.
   - Make tw-animate-css and the installed sheet, drawer and menu read these utilities instead of their hard-coded 150/200 ms.
   - Add one global `prefers-reduced-motion: reduce` rule that makes every animation and transition instant.
   - Show the tokens on `/kit` → Tokens.
8. **Tap feel.**
   - No grey tap flash.
   - Hover styles only on devices that hover.
   - A press state on buttons for touch.
9. **UI scan rules** (`tooling/e2e/ui-scan.e2e.ts`, hard failures):
   - any visible `input`, `textarea` or `select` under 16 px computed font size at the phone size;
   - axe accessibility violations of impact `serious` or `critical`, on every scanned route.

   List any existing violations in your report. Fix them if they are in the frames; otherwise stop and ask before muting a rule.

## Not in this task

New pages or components, packages other than the one above, form code, data code (P4-0 runs at the same time in other files).

## Done when

- `pnpm check` passes and CI is green, including Screenshots and the UI scan.
- If the frames changed on purpose, regenerate baselines only with the "Update screenshots" workflow on this branch.
- The PR is merged per rule 10, and PROGRESS ticks P4-1 with one CHANGELOG line.
- Do not edit docs/prompts; this prompt is already saved.
- If main moved before you merge, run `git fetch && git merge origin/main`, keep both sides of any PROGRESS or CHANGELOG conflict, and push. Never force-push.
- Report what changed, and how Lex checks it on his iPhone: add the dashboard to the Home Screen, open a sign-in field, and confirm it doesn't zoom.
