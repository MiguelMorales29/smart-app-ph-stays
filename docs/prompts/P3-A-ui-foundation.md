Read AGENTS.md, CLAUDE.md, docs/decisions.md and docs/PROGRESS.md. Then read docs/blueprints/stack-register.md sections 3, 4 and 6, and docs/blueprints/feature-blueprint.md section 2. Nothing else yet.

## Goal

The UI foundation, with no pages: Tailwind in both front ends, the shadcn CLI set up for packages/ui, the design tokens with the platform theme in light and dark, the platform font, and only the library components Phase 3 needs, installed through the CLI.

## Plan first

Post:
(a) the exact package list with versions;
(b) the commands you will run, after reading `pnpm dlx shadcn@4.23.0 --help` and `init --help`;
(c) the file layout of packages/ui;
(d) for each component below, what the registry item pulls in (dependencies and other registry items).
Wait for my OK.

## Branch

`ag/p3a-ui-foundation` from the latest main. Follow AGENTS.md rule 10.

## Install rules (read twice)

1. Every new package goes into docs/blueprints/stack-register.md and docs/decisions.md first: exact version, reason, licence. No `^` or `~`. Every version must pass the 7-day rule (minimumReleaseAge). If one fails, take the newest older patch and say so.
2. Library components are installed only through the shadcn CLI. If an install fails, a registry asks for a login or payment, an item is marked Pro, or a licence is unclear: STOP and report the exact error. Never write that component by hand, never copy it from another repo, and never swap in another library.
3. Install nothing beyond the list below. No blocks. Any other component a frame might need goes in your plan as a question.

## Versions (checked 18 November 2026)

| Package                                | Version                      | Where                                                          |
| -------------------------------------- | ---------------------------- | -------------------------------------------------------------- |
| tailwindcss                            | 4.3.5                        | storefront, dashboard, ui                                      |
| @tailwindcss/postcss                   | 4.3.5                        | storefront (dev)                                               |
| @tailwindcss/vite                      | 4.3.5                        | dashboard (dev)                                                |
| shadcn                                 | 4.23.0                       | run with pnpm dlx shadcn@4.23.0; do not add it as a dependency |
| @base-ui/react                         | 1.9.0                        | ui                                                             |
| lucide-react                           | 1.71.0 (not 1.74.0: too new) | ui; add to the catalog                                         |
| class-variance-authority               | 0.7.1                        | ui                                                             |
| tailwind-merge                         | 3.7.0                        | ui                                                             |
| clsx                                   | 2.1.1                        | ui                                                             |
| tw-animate-css                         | 1.4.0                        | ui                                                             |
| @fontsource-variable/plus-jakarta-sans | 5.3.0                        | ui                                                             |

## Steps

1. **shadcn setup in packages/ui:**
   - components.json with style `base-nova`, baseColor `neutral`, cssVariables true, iconLibrary `lucide`, and css `src/styles/globals.css`.
   - Aliases under `@smartapp/ui/components`, `@smartapp/ui/lib` and `@smartapp/ui/hooks`.
   - Registries: @diceui https://diceui.com/r/{style}/{name}.json, @reui https://reui.io/r/{style}/{name}.json, @magicui https://magicui.design/r/{name}, @evilcharts https://evilcharts.com/r/{name}.json.
   - packages/ui/package.json exports for ./styles/_, ./components/_, ./compositions/_, ./lib/_ and ./hooks/*.
2. **Install through the CLI:**
   - From shadcn: button, separator, skeleton, spinner, empty, alert, badge, avatar, tooltip, sheet, drawer, dropdown-menu, sidebar, scroll-area, breadcrumb, toast.
   - From Dice UI: @diceui/banner.
     Read each item's JSON before installing and list in your report what it added.
3. **Installed-components folder (D39):** add one ESLint and tsconfig block that relaxes only what the installed files need (for example `as` casts), for `packages/ui/src/components/**` only. Our own folders (lib, compositions, hooks, styles) keep every rule. Prove it with a case in tooling/lint-walls.test.ts.
4. **Tokens (D35)** in `packages/ui/src/styles/tokens.css`, with globals.css importing tailwindcss, tw-animate-css and tokens.css:
   - Use shadcn's variable names (`--background`, `--foreground`, `--card`, `--popover`, `--primary`, `--primary-foreground`, `--secondary`, `--muted`, `--muted-foreground`, `--accent`, `--accent-foreground`, `--destructive`, `--border`, `--input`, `--ring`, `--sidebar-*`), plus ours: `--success`, `--success-tint`, `--warning`, `--warning-tint`, `--info`, `--info-tint`, `--danger-tint`, `--raised`, `--control-h`, `--dur-fast`, `--dur-base`, `--dur-slow`, `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--radius`.
   - Light in `:root`, dark in `.dark`, with the exact values in the table at the end of this prompt.
   - Map them for Tailwind with `@theme inline`.
   - `--control-h`: 44px by default; the storefront overrides it to 48px.
   - Reduced motion: every duration becomes 0ms.
5. **Contrast test:** packages/ui/test/tokens-contrast.test.ts checks every text and fill pair in the table at WCAG AA (text 4.5:1; input border and ring 3:1), in light and dark. It parses tokens.css, so the test and the file can never drift.
6. **Platform font:** Plus Jakarta Sans Variable from Fontsource, self-hosted, as `--font-sans`. Turn on tabular numbers through a `.tabular` utility (`font-variant-numeric: tabular-nums`). Check that the font supports it and report.
7. **Wire Tailwind into both apps:**
   - storefront: postcss with @tailwindcss/postcss;
   - dashboard: the @tailwindcss/vite plugin.
     Each app imports `@smartapp/ui/styles/globals.css` and adds `@source` for packages/ui. The placeholder pages stay as they are; only fonts and colours change.
8. **Dashboard light, dark and system mode (D36), kept on the device:**
   - a tiny inline script in index.html sets `.dark` before the first paint (no flash);
   - a small provider in apps/dashboard/src/app/theme with no new package (no next-themes).
     The storefront stays light only.

## Not in this task

The theme engine for owners (P3-B), frames, routes, kits, the router, Playwright, other fonts, blocks, and any component not listed above.

## Checks

- `pnpm --filter @smartapp/ui test` (contrast test) and `pnpm --filter @smartapp/ui typecheck` while you work.
- Do not run pnpm build locally; CI builds.
- Run `pnpm check` once before the pull request.
- Save this prompt word for word as docs/prompts/P3-A-ui-foundation.md, add its line to docs/prompts/README.md, tick P3-A in PROGRESS, and add one CHANGELOG line.
- Record D34, D35, D36, D39 and D41 in docs/decisions.md exactly as given at the end of this prompt, and close O3.

## Done when

CI is green, the PR is merged per rule 10, and the report lists: every package and version, every installed component with what it pulled in, and the contrast test results.

## Decisions to record

- D34 Component layers: library components are installed once in packages/ui/src/components, changed only by shared variants. Each app's look comes from CSS variables. Different behaviour means a component in that app that wraps the shared one. Never copy a component into an app. An app component both apps need moves to packages/ui. Business rules stay in packages/core and packages/data. Three kits: base, dashboard and storefront.
- D35 Platform theme: Smart App PH logo colours (Smart Blue primary, Growth Mint accent, navy ink); cool navy-tinted neutrals; dark mode in layers (sidebar darkest, page, card, raised), never pure black, off-white text; status colours green done, amber waiting, blue in progress, red problem, grey finished, always with an icon and a word; mint never means status; one font, Plus Jakarta Sans.
- D36 The dashboard and admin have light, dark and system, kept on the device; the storefront is light only.
- D39 Installed components live in packages/ui/src/components with one relaxed lint and type block for that folder only (closes O3).
- D41 shadcn base-nova on Base UI is the base; Dice UI items are added one at a time; ReUI, Magic UI and EvilCharts registries are configured but nothing is installed until a page's research step picks it; no paid (Pro) item, ever.

## Token values (light / dark)

background #F9FAFD / #1B1E24 · sidebar #F1F3F9 / #14171D · card #FFFFFF / #23262D · popover #FFFFFF / #2C3039 · muted #EDF0F6 / #2A2E36 · border #E0E3EA / #393D46 · input #8C929F / #6F7581 · foreground #0B1633 / #EEF0F4 · muted-foreground #5C6372 / #9FA5B0 · primary #2866EE / #74A2FF · primary-hover #194FC9 / #A1C1FF · primary-foreground #FFFFFF / #060E25 · primary-tint #E4EDFF / #1E3666 · ring #4883FF / #74A2FF · accent (mint) #7ED6AC / #40BE8A · accent-foreground #0B1633 / #060E25 · success #007031 / #50BF6F · success-tint #DAF5DE / #193B22 · warning #7D5200 / #DB9400 · warning-tint #FEE9CE / #47300C · destructive #AC111F / #FF716B · danger-tint #FFE6E4 / #542523 · info #006393 / #4FAEEB · info-tint #DCF0FF / #133951
Note: shadcn's `--accent` is a hover fill. Keep its meaning by mapping `--accent` to the muted fill, and put the mint in new `--brand-accent` and `--brand-accent-foreground` tokens. Say in your plan how you map it.
