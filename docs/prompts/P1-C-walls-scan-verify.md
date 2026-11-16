# P1-C Lint-wall tests, build scan and final verification

Paste everything below the line into a new Antigravity conversation (Planning mode), after P1-B is merged.

---

Read `AGENTS.md`, `docs/decisions.md`, `eslint.config.js` and `.github/workflows/check.yml`. Nothing else.

## Goal

Prove the rules work, so later phases cannot quietly break them: a test that every ESLint import wall fires, a CI step that fails if a development address ships in a production build, a root README, and a clean run from a fresh clone. This closes phase 1.

## Branch

`ag/p1c-verify` from the latest `main`.

## Not in this task

New features, new apps, new rules in `eslint.config.js`. If a wall does not fire, fix the wall (it is a bug in P1-A), and say so in the report; never loosen a test to make it pass.

## Steps

1. **`tooling`** workspace (`@smartapp/tooling`, private, `type: module`), devDependencies `eslint` (same version as the root) and `vitest` (catalog). Script `test` = `vitest run`. Turborepo picks it up through the workspace.
2. **`tooling/lint-walls.test.ts`**: uses the `ESLint` class with the repo's root config and `lintText(code, { filePath })`, so each case pretends to be a file in the right folder (no fixture files on disk). Each case expects the named rule to report:
   - `apps/dashboard/src/x.tsx` importing `@smartapp/storefront` → `no-restricted-imports`.
   - `apps/storefront/src/app/x.tsx` importing `@smartapp/dashboard` → `no-restricted-imports`.
   - `apps/api/src/x.ts` importing `@smartapp/storefront` → `no-restricted-imports`.
   - `apps/dashboard/src/x.tsx` importing `@supabase/supabase-js` → `no-restricted-imports`.
   - `packages/core/src/x.ts` importing `react` → `no-restricted-imports`.
   - `packages/core/src/x.ts` importing `@smartapp/data` → `no-restricted-imports`.
   - `packages/ui/src/x.tsx` importing `@smartapp/data` → `no-restricted-imports`.
   - `apps/storefront/src/app/x.tsx` importing `@smartapp/data/mocks/bookings` → `no-restricted-imports`.
   - `apps/dashboard/src/features/a/x.tsx` importing `../b/y` → `no-restricted-imports`.
   - `packages/core/src/x.ts` with `const n = value as number` → `@typescript-eslint/consistent-type-assertions`.
   - `packages/core/src/x.ts` with `// @ts-ignore` → `@typescript-eslint/ban-ts-comment`.
   - `packages/core/src/x.ts` with `let v: any` → `@typescript-eslint/no-explicit-any`.
   - And two allowed cases with no errors: `apps/api/src/x.ts` importing `@supabase/supabase-js`, and `apps/dashboard/src/app/x.tsx` importing `@smartapp/core`.
   Because `@supabase/supabase-js` is not installed, the test only lints text; it never resolves imports.
3. **CI build scan.** In `.github/workflows/check.yml`, after `pnpm build`, add a step that searches `apps/dashboard/dist` and `apps/storefront/.next` (excluding `*.map` files and `.next/cache`) for `localhost:3100`, `localhost:5174`, `localhost:4100` and `127.0.0.1`, and fails if it finds any. Run the same search locally first and paste the result. If the Next.js build contains one of these strings from Next's own code, show me the file and line and stop; do not add an exception on your own.
4. **Root `README.md`**: what the product is (two sentences), requirements (Node 24.14.0 from `.nvmrc`; pnpm comes from `packageManager`), the commands from `AGENTS.md`, the three local addresses, how to open the pages from a phone on the same Wi-Fi, and where the docs are (`docs/README.md`).
5. **Fresh-clone check.** In a temporary folder outside the repo: clone the branch, `pnpm install --frozen-lockfile`, `pnpm format:check`, `pnpm check`, `pnpm build`, then start `pnpm dev` and `curl` the health address and both pages. Paste the last lines of each. Delete the temporary folder after.
6. **Docs.** Tick P1-C in `docs/PROGRESS.md`, one line in `docs/CHANGELOG.md`. Add to `docs/decisions.md`: "D15 The lint walls are proven by `tooling/lint-walls.test.ts`; a new wall needs a new case in the same pull request."
7. **Pull request.** Fill the template, `gh pr create --base main`, print the link.

## Done when

1. The lint-walls test has 14 cases and all pass; temporarily breaking one wall in `eslint.config.js` makes its case fail (show this, then put the wall back).
2. The CI scan step runs and passes.
3. The fresh-clone check passes end to end.
4. CI is green.

Finish with: the pull request link, what changed, how I test it, and what I must do by hand.
