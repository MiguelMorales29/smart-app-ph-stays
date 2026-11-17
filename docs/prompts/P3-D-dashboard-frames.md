# P3-D · Dashboard and admin frames, router and route index

Read AGENTS.md, docs/decisions.md (D34–D41), docs/blueprints/feature-blueprint.md section 6 (the dashboard, super admin and builders routes, and the menu order table), and the dashboard app as it is now.

## Goal

Every wave 1 dashboard and super admin route opens as an empty page inside the right frame, with working navigation on a 360 px phone, a tablet and a 1280 px desktop, in light and dark.

## Plan first

Post the route tree, the four frames, the navigation behaviour at each width, and the package to add. Wait for my OK.

## Branch

`ag/p3d-dashboard-frames` from the latest main. Follow AGENTS.md rule 10.

## Package

@tanstack/react-router 1.170.46, with code-based routes as in the food app (no router plugin). Add it to the Stack register first; same install rules as P3-A.

## Routes (empty framed pages: a heading and "Coming in phase N")

- **Auth frame:** /signup, /login.
- **Focus frame (no menu):** /onboarding, /editor.
- **App frame:** /home, /calendar, /bookings, /payments, /inbox, /units, /guests, and /settings with /settings/payments, /policies, /notices, /plan, /activity, /property, /hours, /account and /storage.
- **Admin frame (its own route tree and menu):** /admin, /admin/owners, /admin/plans, /admin/usage, /admin/audit, /admin/health, /admin/flags, /admin/pixels.
- **Development and preview only:** /kit (left empty for P3-E) and /kit/routes, the route index: every route of both apps as a link with its frame and phase, plus the storefront routes for the four demo slugs.

## Navigation (menu order from the Feature blueprint)

- **Phone, under 768 px:** a bottom tab bar with Home, Calendar, Bookings, Inbox and More.
  - More opens a Drawer with Payments, Units, Guests, Editor and Settings.
  - Count badges come from packages/data (ownerHome), never from demo files.
  - Port the food app's bottom-dock and nav-drawer compositions from `gh repo clone webserbisyo/Smart-App-PH---FINAL-2026 /tmp/food-ref -- --depth 1` (read-only; delete it afterwards).
- **Tablet, 768–1279 px:** the shadcn Sidebar collapsed to an icon rail.
- **Desktop, 1280 px and up:** the full Sidebar, with the account menu (DropdownMenu with the light, dark or system choice from P3-A) and the property switcher placeholder.
- **Admin:** the same Sidebar component with the admin menu, and a clear "Super admin" label.
- Wave 2 and 3 items (Tenants, Reports, Rewards, Team) stay hidden. Their menu places are kept in the config, behind a switch.

## Shared states (packages/ui/src/compositions, built from installed parts)

LoadingState (skeleton layouts), EmptyState (port the food app's empty-state), ErrorState (with "Try again"), OfflineBanner, PausedAccountBanner and NotAllowedState. The Phase 2 switch bar keeps working; its "error", "slow" and "offline" scenarios should now show these states on /home.

## Rules

- A component that isn't installed: stop and ask; never hand-build it.
- /kit and /kit/routes load only when APP_ENV is not production, through a dynamic import, like the switch bar. The production scan must still pass.

## Not in this task

Page content, forms, tables, the editor's insides, the storefront, kits, Playwright.

## Checks

- `pnpm --filter @smartapp/dashboard typecheck` and its tests while you work.
- No local build.
- `pnpm check` once before the pull request.
- Save this prompt as docs/prompts/P3-D-dashboard-frames.md, add its README line, tick P3-D, and add a CHANGELOG line.

## Done when

CI is green and the PR is merged. The report lists every route with its frame, plus 5 steps for me to check the navigation on my phone and a laptop.
