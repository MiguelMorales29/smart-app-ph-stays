# UI Library Reference

Every UI primitive in this repository lives once in `packages/ui/src/components/`, installed through the shadcn CLI (`shadcn@4.23.0`) using `style: "base-nova"` on Base UI (D34, D39, D41). App-specific skins use CSS variables (`tokens.css` and `PropertyTheme`), and shared compositions live in `packages/ui/src/compositions/`.

Agents: follow the `smartapp-ui` skill (`.agents/skills/smartapp-ui/SKILL.md`), which includes the checklist for installing or editing a component.

Live interactive previews and dark/light/brand checks live in the development-only UI kits:

- Dashboard kit (`/kit` with `Base`, `Dashboard`, and `Tokens` tabs, plus `/kit/routes`)
- Storefront kit (`/kit` in `apps/storefront`, with switcher across all 4 demo brands plus worst-case `#FFE600`)

## Installed Libraries (Base UI + Registries)

| Library / Package          | Version  | Licence    | Role                                                                             |
| -------------------------- | -------- | ---------- | -------------------------------------------------------------------------------- |
| `@base-ui/react`           | `1.9.0`  | MIT        | Accessible unstyled primitives backing shadcn `base-nova`                        |
| `@base-ui/utils`           | `0.5.0`  | MIT        | Utilities required directly by `@diceui/banner`                                  |
| `class-variance-authority` | `0.7.1`  | Apache-2.0 | Typed variant class composition (`cva`)                                          |
| `cn`                       | `0.5.2`  | MIT        | Class merging utility used across shadcn & Dice UI items                         |
| `lucide-react`             | `1.71.0` | ISC        | Icon library across dashboard and storefront (`1.74.0` skipped under 7-day rule) |
| `tw-animate-css`           | `1.4.0`  | MIT        | Enter/exit animation utilities for dialogs, drawers, menus, toasts               |

## Installed Components (`packages/ui/src/components/`)

Installed in P3-A with `pnpm dlx shadcn@4.23.0 add` (`base-nova` preset; registries `@diceui`, `@reui`, `@magicui`, `@evilcharts` configured in `packages/ui/components.json`):

| Component      | File                | Source & Version              | Use for                                                                                | Don't                                                                     |
| -------------- | ------------------- | ----------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `Alert`        | `alert.tsx`         | shadcn `base-nova` (`4.23.0`) | Inline warnings, paused notices, policy callouts (`default`, `destructive`)            | Use for transient toast feedback                                          |
| `Avatar`       | `avatar.tsx`        | shadcn `base-nova` (`4.23.0`) | Owner/guest initials, monogram logos, `AvatarBadge` online dot                         | Rely on dot colour without text status                                    |
| `Badge`        | `badge.tsx`         | shadcn `base-nova` (`4.23.0`) | Status pills (via `StatusBadge`), counts, compact frame/phase labels                   | Wrap full paragraphs or status without icon + word                        |
| `Banner`       | `banner.tsx`        | `@diceui/banner` (`@diceui`)  | Full-width top banners (`Preview`, `Demo`, `Offline`, `PausedAccountBanner`)           | Stack more than two banners on 360 px screens                             |
| `Breadcrumb`   | `breadcrumb.tsx`    | shadcn `base-nova` (`4.23.0`) | Tablet & desktop top-bar hierarchy on nested settings/admin pages                      | Show multi-level crumbs on phones (use Back arrow)                        |
| `Button`       | `button.tsx`        | shadcn `base-nova` (`4.23.0`) | Actions across 6 variants and sizes (`xs`–`lg`, `icon`)                                | Put two primary solid buttons side by side                                |
| `Drawer`       | `drawer.tsx`        | shadcn `base-nova` (`4.23.0`) | Phone bottom navigation (`NavDrawer`) and thumb-reach sheets                           | Replace desktop dropdowns with drawers                                    |
| `DropdownMenu` | `dropdown-menu.tsx` | shadcn `base-nova` (`4.23.0`) | `AccountMenu` (appearance switcher + links) and row actions                            | Put complex forms inside a dropdown                                       |
| `Empty`        | `empty.tsx`         | shadcn `base-nova` (`4.23.0`) | Base primitive for `EmptyState`, `ErrorState`, `NotAllowedState`, 404s                 | Show raw blank screens when data is empty                                 |
| `Input`        | `input.tsx`         | shadcn `base-nova` (`4.23.0`) | Text, search, and number inputs (`>= 16 px` font on mobile)                            | Drop below 16 px font size on touchscreens                                |
| `ScrollArea`   | `scroll-area.tsx`   | shadcn `base-nova` (`4.23.0`) | Bounded scrollable regions and sidebars                                                | Scroll-trap full-page vertical documents                                  |
| `Separator`    | `separator.tsx`     | shadcn `base-nova` (`4.23.0`) | Hairline horizontal and vertical section dividers                                      | Use heavy borders when whitespace suffices                                |
| `Sheet`        | `sheet.tsx`         | shadcn `base-nova` (`4.23.0`) | Storefront property slide-over menu and inspector drawers                              | Use on tablet dashboard nav (`Sidebar` rail toggles via `SidebarTrigger`) |
| `Sidebar`      | `sidebar.tsx`       | shadcn `base-nova` (`4.23.0`) | Desktop sidebar and tablet collapsible icon rail (`SidebarProvider`, `SidebarTrigger`) | Render inside 360 px phones (use `BottomDock` + `NavDrawer`)              |
| `Skeleton`     | `skeleton.tsx`      | shadcn `base-nova` (`4.23.0`) | Base placeholder block inside `LoadingState`                                           | Replace layout shapes with arbitrary boxes                                |
| `Spinner`      | `spinner.tsx`       | shadcn `base-nova` (`4.23.0`) | Inline busy indicators inside buttons and compact controls                             | Replace full-page `LoadingState` skeletons                                |
| `Toast`        | `toast.tsx`         | shadcn `base-nova` (`4.23.0`) | Non-blocking feedback and 10 s Undo actions (`Toaster`, `toast`)                       | Display persistent errors (use `Alert` or `ErrorState`)                   |
| `Tooltip`      | `tooltip.tsx`       | shadcn `base-nova` (`4.23.0`) | Collapsed icon-rail labels on hover/focus                                              | Hide essential labels on touch-only controls                              |

_(Plus `use-mobile.ts` installed in `packages/ui/src/hooks/` as a transitive dependency of `Sidebar`.)_

## Shared Compositions (`packages/ui/src/compositions/`)

Reuse these before reaching for a raw component; they already handle light/dark, phone/desktop and accessibility.

| Composition                                | Use for                                                                             | Don't                                                        |
| ------------------------------------------ | ----------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `LoadingState`                             | Skeleton placeholders while data loads (`layout` page, cards or list)               | Show a lone spinner for a whole page                         |
| `EmptyState`                               | No data yet: one sentence and one action                                            | Leave a blank area or an empty table                         |
| `ErrorState`                               | A load failed: what happened plus "Try again"                                       | Show raw error codes as the main message                     |
| `NotAllowedState`                          | The viewer's role cannot open this page                                             | Hide the page silently                                       |
| `OfflineBanner`                            | Connection lost; place it inside the content area (`SidebarInset` in the dashboard) | Put it above the sidebar layout, where the sidebar covers it |
| `PausedAccountBanner`                      | Subscription paused notice in the dashboard                                         | Use for general warnings (use `Alert`)                       |
| `BookingStatusBadge`, `PaymentStatusBadge` | Every booking and payment status (icon + word + D35 colour)                         | Build status pills by hand or use mint for status            |
| `BottomDock`, `NavDrawer`                  | Phone navigation and its "More" drawer                                              | Use on tablet or desktop                                     |
| `PropertyTheme`, `PropertyThemeDocument`   | Applying an owner's palette and font pair to storefront pages                       | Hard-code a property's colours                               |
| `DevSwitchPanel` (D42)                     | The floating "Preview" pill, loaded lazily by the switch gates on sample data only  | Render it in production code paths or inside a page layout   |

## Selection Rationale ("How it was chosen")

- **`base-nova` over Radix-only defaults:** Single consistent accessible primitive foundation (`@base-ui/react@1.9.0`) matching D41 and the reference food app architecture, with clean `render` prop composition for TanStack Router `<Link>` and Next.js `<Link>`.
- **Dice UI `Banner` added individually:** Chosen for sticky/top announcement and offline/demo ribbons without pulling an unvetted block library.
- **Zero paid/Pro items & zero pre-installed bloat:** Components are added only as needed; Phases 4–9 research passes install specific extra libraries/blocks only when building those screens.

## Installed Component Edits Log

| File                                    | Phase     | What changed & Why                                                                                                                                                                                                                                                               |
| --------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/ui/src/components/banner.tsx` | P3 polish | `info`, `success`, `warning` and `destructive` variants now use the D35 status tokens (`bg-*-tint`, `text-foreground`, status-coloured icon) instead of raw Tailwind `blue/green/yellow/red-50/950`, which ignored the platform palette and showed brown in dark mode (D43).     |
| `packages/ui/src/components/banner.tsx` | P3-C      | Normalized nullable/optional `variant`, `priority`, and `duration` props in `contextValue`, `renderProps`, and `store.onBannerAdd(...)` so TypeScript with `exactOptionalPropertyTypes: true` compiles cleanly when imported by `apps/storefront`. No runtime behaviour changed. |

_(No other files in `packages/ui/src/components/` were modified in P3-A to P3-E or the P3 polish pass.)_

## Shortlist for Phases 4–9 (Not Installed Yet)

Carried from `docs/blueprints/stack-register.md` §3; each package waits until its page's research pass confirms exact selection and 7-day release age:

- **Tables & Virtualization:** `@tanstack/react-table`, `@tanstack/react-virtual` (long booking/guest/admin lists)
- **Charts:** `recharts` + EvilCharts (`@evilcharts` registry) (owner reports & admin usage)
- **Dates & Calendar:** `react-day-picker` (stay date range pickers)
- **Carousels:** `embla-carousel-react` (listing photo galleries)
- **Drag and Drop:** `@dnd-kit/core` (photo and unit reordering)
- **Forms & Inputs:** `react-hook-form`, `@hookform/resolvers`, `input-otp`, `@diceui/checkbox-group`
- **Motion & Celebration:** `motion`, `canvas-confetti`
- **Media, QR & Colour Tools:** `qrcode`, `@dicebear/core`, `@dicebear/adventurer`, `@material/material-color-utilities`
- **Brand Icons:** `simple-icons`
- **Page Editor State:** `zustand` + `zundo` (Phase 5 editor only, per stack register)
