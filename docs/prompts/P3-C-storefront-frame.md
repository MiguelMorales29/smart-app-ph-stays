# P3-C · Storefront frame and routes

Read AGENTS.md, docs/decisions.md (D34–D41), docs/blueprints/feature-blueprint.md section 6 (the property routes only), and the storefront app as it is now. Use packages/ui (P3-A) and property-theme (P3-B).

## Goal

Every wave 1 storefront route opens as an empty page inside the right frame, themed by its property, at 360 px and 1280 px. No page content.

## Plan first

Post the route tree, the three frames and what each holds, and which installed components and compositions each frame uses. Wait for my OK.

## Branch

`ag/p3c-storefront-frame` from the latest main. Follow AGENTS.md rule 10.

## Routes (all as empty framed pages with a heading and "Coming in phase N")

- `/` (the bare domain): the owner landing frame, in the platform theme. It keeps the Phase 2 list of demo properties under it, until Phase 9.
- `/<slug>`: the property home.
- `/<slug>/units/<unit>`
- `/<slug>/book`
- `/<slug>/inquire`
- `/<slug>/t/<token>`
- `/<slug>/find`
- `/<slug>/join`
- `/<slug>/account`
- `/<slug>/privacy`
- `/<slug>/install`

An unknown slug gets a themed not-found page; an unpublished property is not found; a paused account shows contact details only. All of this comes from packages/data (getProperty), never from the demo files.

## Frames

1. **Property frame:**
   - a header with the logo (circle or rounded, from the look), the property name and a menu;
   - the content area;
   - a footer with privacy and "Powered by Smart App PH";
   - an empty sticky bottom action-bar slot (thumb reach), so later pages can fill it.
2. **Conversation frame** for `/t/<token>`: a minimal header with no menu.
3. **Landing frame** for `/`: platform brand and theme.

**Ribbons:**

- the Phase 2 "Preview · sample data" ribbon, now using the Dice UI banner;
- the D18 demo ribbon "Demo · not a real property", on demo accounts;
- an offline banner when the browser goes offline.

Every page sets noindex while APP_ENV is not production, and on demo accounts always.

## Rules

- Build the frames from installed components and compositions. Port the food app's page-header composition only if it fits, from `gh repo clone webserbisyo/Smart-App-PH---FINAL-2026 /tmp/food-ref -- --depth 1` (read-only; delete it afterwards).
- Need a component that isn't installed? Stop and ask; do not hand-build it.
- 44 px or larger touch targets; 16 px inputs; no sideways scroll at 360 px.
- Also in this PR: fix dark `--input` from `#6f7581` to `#737985` so it clears 3:1 against dark `--muted`.
- Save this prompt verbatim to `docs/prompts/P3-C-storefront-frame.md` and add a line to `docs/prompts/README.md`.

## Verify and finish

- Update `docs/PROGRESS.md` and `docs/CHANGELOG.md`.
- `pnpm check`, `pnpm format:check`, `pnpm install --frozen-lockfile`. Open the PR, wait for green CI, squash-merge, pull main.
- List every route with its frame, plus 4 steps for me to check two demo brands on my phone.
