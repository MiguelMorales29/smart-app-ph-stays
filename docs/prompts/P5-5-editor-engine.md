# P5-5 · Page editor engine

Model: Gemini 4 Argon, High. Planning mode. After P5-2 is merged (P5-3 and P5-4 can be merged or not).

Read first: AGENTS.md, docs/prompts/P5-guide.md, Feature blueprint §7a "How the editor works" (steps 1 to 9) and decisions E1, E2, Stack register (Zustand with zundo). Contract from P5-1: `getPageEditor`, `savePageDraft`, `discardPageDraft`, `publishPropertyPage`, `getPageChanges`, and `packages/core/src/editor/preview-messages.ts`.

Port from the food app (`../Smart-App-PH---FINAL-2026`, read-only; it is the approved engine, decision E2):

- `apps/dashboard/src/features/editor/screens/editor.tsx`, `use-editor-draft.ts`, `preview-frame.tsx`, `preview-pages.tsx`, `parts-list.tsx`, `part-panel.tsx`, `phone-sheet.tsx`, `use-sheet-gestures.ts`, `editor-top-bar.tsx`, `editor-dialogs.tsx`, `parts.ts`
- `apps/storefront/src/app/[shop]/preview/page.tsx` and `apps/storefront/src/features/preview/`

## Goal

The owner opens `/editor`, sees the real property page live, picks a part, and every change saves itself, can be undone, and can be published with a plain-words list of changes. The panels themselves are P5-6; here each part opens a simple placeholder panel.

## Branch

`ag/p5-5-editor-engine` from main. One PR.

## Do

1. **State:**
   - One Zustand store (install `zustand` and `zundo`, latest stable; note versions and licences in the Stack register). The food app's editor does not use Zustand yet: port the **logic** of its `use-editor-draft.ts` (grouping, limits, save timing) into the store, not its React state. The store holds the draft, the selected part, the hovered part, the save status and the preview page.
   - `zundo`: 50 steps; a colour drag or a run of typing in one box is one step (throttle/merge like the food `use-editor-draft.ts`).
   - Server data stays in TanStack Query. The store never copies query data except the draft it edits.
2. **Autosave:**
   - Save 0.8 s after the last change through `savePageDraft` with `expectedDraftRev`; retry every 5 s after a failure.
   - Status line: Live · Draft with N changes · Saving… · Offline · Didn't save · Conflict.
   - `draft_conflict` opens a dialog: "Load the newer one" or "Keep mine" (Keep mine saves with the newer rev).
   - Leaving with unsaved changes asks first.
3. **Preview frame:**
   - `/<slug>/preview` in the storefront (noindex, `Cache-Control: no-store`, `frame-ancestors` only the dashboard origin from env) renders the P5-2 / P5-3 pages from a draft received over `postMessage`.
   - Every message is checked by origin, sender and the Zod schema.
   - Tapping a part on the preview selects it; hovering a part in the list outlines it.
   - Switches: Phone 390 / Laptop 1280 (scaled to fit), and pages Home · A unit · Booking form (placeholder) · Property info.
   - A slow preview says why after 4 s; "Try again" after 8 s.
4. **Layout:**
   - Full screen, outside the dashboard menu (a new `EditorFrame`; no sidebar, no dock).
   - Top bar: Back to dashboard, status line, Undo, Redo, a ⋯ menu (View live, Copy link, Discard draft), Publish (with the change count).
   - **Phones:**
     - A dock that never hides: Parts · Style · Pages · Publish.
     - The part list or a panel opens in a sheet **between** the preview and the dock at 35 / 55 / 85 % height (drag the handle, tap it, arrow keys). It never covers the preview completely.
     - Swiping right goes back to the list.
     - Use the Base UI drawer's snap points (`AppSheet` patterns) rather than the food app's hand-made gestures wherever Base UI covers it; port `use-sheet-gestures.ts` only for what it doesn't.
   - **Tablets:** list or panel on the left, preview on the right.
   - **From 1280 px:** list · preview · panel.
5. **Parts list:**
   - The 14 wave 1 parts in fixed order (§7a table without part 14 "Guest count").
   - Each part has a show/hide switch (where the part allows it), a done mark and a one-line value.
   - A short tip at the top until closed.
6. **Publish:**
   - A sheet with `getPageChanges` as a plain-words list.
   - Blockers shown in red with a link to fix them (no cover photo, web address taken).
   - Publish, then a success toast "Page published" with "View live".
   - Discard asks first.
7. **Keyboard:** Ctrl/⌘ Z and Shift+Ctrl/⌘ Z outside text boxes; Escape closes a panel.
8. **Entry points:** the dashboard nav "Editor" item, the onboarding Review step and the Home setup card link to `/editor`.

## Not in this task

The real panels (P5-6). Style picking, fonts, uploads. Version history or scheduled publish (later).

## Done when

- The pattern guide's definition of done (§6), plus screen recordings (or frame-by-frame screenshots) of: the phone sheet moving between 35/55/85 %, Undo of a typed run, a conflict, and publish.
- Tests: the store (undo grouping, 50-step cap), the autosave timer and retry, message validation (a message from a wrong origin is ignored).
- No console errors in the editor or the preview. Axe: no serious issues on `/editor`.
- `pnpm check` green, bundle budget passes (the editor is its own lazy chunk). PROGRESS: tick P5-5. One CHANGELOG line.
- Open the PR, wait for green CI, **do not merge**. Report the PR number.
