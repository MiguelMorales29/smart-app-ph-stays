# Phase 5 guide: public pages and the page editor

Eight prompts for Antigravity, run in order. Each one is one branch and one pull request. Claude checks every PR before it is merged (D70).

## What Phase 5 delivers

- **Guests:** the property page (`/<slug>`) and the unit page (`/<slug>/units/<unit>`) built from the published page, in the owner's colours and fonts, on phone and desktop.
- **Installing:** each property installs as its own app (name, icon, splash), with an install page, share previews, an offline page and a privacy page.
- **Owners:** the full-screen page editor (`/editor`) with a live preview, autosave, Undo, publish, and the 14 wave 1 parts.
- **Before all that:** the Phase 4 fixes Lex found on his iPhone (dock, Edit unit rows, badges, Preview switch, spacing).

Reserving dates, the booking form and payment stay in Phase 6. Buttons that lead there go to the existing placeholders.

## The prompts

| #     | Prompt                                                              | Model (Antigravity)            | Size | Depends on |
| ----- | ------------------------------------------------------------------- | ------------------------------ | ---- | ---------- |
| P5-0  | Dock with +, Edit unit rows, badges, Preview switch, spacing        | Gemini 4 Argon, Medium         | M    | —          |
| P5-0b | Units page, unit cards and dock polish (round 2, D73)               | Gemini 4 Argon, Medium         | M    | P5-0       |
| P5-1  | Data contract for the pages and the editor                          | Gemini 4 Argon, Medium         | M    | —          |
| P5-2  | Property page                                                       | Gemini 4 Argon, Medium         | L    | P5-1       |
| P5-2b | Property page structure, round 2 (D79 to D82)                       | Gemini 4 Argon or Neon, Medium | M    | P5-2       |
| P5-3  | Unit page                                                           | Gemini 4 Argon, Medium         | M    | P5-2       |
| P5-4  | Install, splash, share, offline, privacy                            | Gemini Flash, High             | M    | P5-2       |
| P5-5  | Editor engine (store, preview, autosave, Undo, publish, phone dock) | Gemini 4 Argon, High           | L    | P5-2       |
| P5-6  | Editor parts (the 14 panels)                                        | Gemini 4 Argon, Medium         | L    | P5-5       |
| P5-7  | Tests and close-out                                                 | Gemini Flash, High             | M    | all        |

P5-0 and P5-1 can run in parallel (different files). Everything else in order.

## Rules for every Phase 5 prompt

1. **Read first:** AGENTS.md, docs/pattern-guide.md, docs/research/phase-5-guest-pages.md, docs/decisions.md (D60 to D77), the files the prompt names. Load the repo skills `smartapp-ui`, `smartapp-ui-writing`, `smartapp-ui-check`.
2. **Reuse before building.** The food app's working code is the reference. At the start of any prompt that ports from it, clone it read-only: `rm -rf /tmp/food-ref && gh repo clone webserbisyo/Smart-App-PH---FINAL-2026 /tmp/food-ref` (always the latest main; never edit it). Each prompt names the exact files to port. Port means: copy the logic, rename to this app's words, use our tokens and compositions, keep its tests.
3. **Components:** sourcing order D60. Our compositions first (`packages/ui/src/compositions`), then installed components, then shadcn / ReUI / Dice UI (Base UI builds) with the pinned CLI. Ask before adding any other package. Never hand-build something a listed library has. Read how an installed component animates, scrolls and shows selection before wiring it (the Phase 4 lesson).
4. **Storefront looks:** the property's own colours through `PropertyTheme` and `--property-*` tokens; light only; text contrast fixed by `packages/core/src/theme/palette.ts`. The dashboard keeps the platform look (D61).
5. **Words:** sentence case, plain English for Filipino owners and guests, ₱1,500, "Fri, 12 Dec" (skill `smartapp-ui-writing`).
6. **Every page has 7 states:** loading, empty, error with retry, offline, not found, paused owner, long text and big amounts. Check them with the demo packs (`?pack=empty|busy|error|slow|offline`).
7. **Never** weaken `eslint.config.js` or `tsconfig`, never push to `main`, never merge.

## The loop for each prompt

1. New Antigravity conversation, the model in the table, Planning mode. Paste the whole prompt file.
2. Read its plan. It must list only what the prompt asks, name the branch, and name the food app files it will port. Reply "OK" or correct it.
3. It builds, runs `pnpm check`, opens the PR, and waits for green CI. **It does not merge.**
4. Send Claude: "Review PR #N".
5. **Claude checks** (D70):
   - the diff: the prompt's scope only, no rule broken, no hand-built library component, tokens not raw colours, tests added;
   - the Vercel preview of the PR at 390 px and 1280 px, light and dark: layout, words, states, motion, console errors;
   - axe on the new pages.
     Claude posts the findings on the PR as a numbered list.
6. Fixes: paste Claude's list into the **same** Antigravity conversation. Repeat 3 to 5.
7. When Claude says "ready", merge (Squash and merge), then the next prompt in a **new** conversation.

## After Phase 5

The Phase 5 gate is Lex opening the property page, installing it on his iPhone, and editing and publishing the page from the phone. Then Phase 6.
