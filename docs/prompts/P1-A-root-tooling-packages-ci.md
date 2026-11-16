# P1-A Root, tooling, shared packages and CI

Paste everything below the line into a new Antigravity conversation (Planning mode).

---

Read `AGENTS.md` and `docs/decisions.md`. Then read `docs/blueprints/stack-register.md` sections 1, 2, 5 and 6 only. Nothing else. This repository holds only docs so far. Do not copy code from any other repository.

## Goal

The root of an empty but correct monorepo: workspace, Turborepo, shared TypeScript, ESLint with the import walls, Prettier, Vitest, three empty shared packages, and a GitHub Actions check. No apps yet (that is P1-B). At the end, `pnpm install --frozen-lockfile`, `pnpm format:check` and `pnpm check` pass on the founder's Mac and in CI.

## Branch

`ag/p1a-root` from the latest `main`. One commit per step below.

## Not in this task

Apps, Tailwind, the shadcn CLI, fonts, Supabase, TanStack, React Hook Form, Playwright, git hooks, any UI. If a step seems to need one of these, stop and ask.

## Versions

Pin exactly. These were the newest releases at least 7 days old on 2026-11-16. Before installing, run `npm view <pkg> version time --json` for each and confirm. If pnpm refuses one because of `minimumReleaseAge`, use the newest older patch of the same minor, and list every change in your final report. Never go up a major or minor without asking.

| Package                        | Version | Where                                                      |
| ------------------------------ | ------- | ---------------------------------------------------------- |
| pnpm                           | 12.18.0 | `packageManager`                                           |
| turbo                          | 2.11.10 | root dev                                                   |
| typescript                     | 6.0.3   | catalog (stay on 6.0.x: typescript-eslint supports `<6.1`) |
| @types/node                    | 24.19.2 | catalog (follows Node 24, never 25 or 26)                  |
| eslint                         | 10.14.0 | root dev                                                   |
| @eslint/js                     | 10.0.1  | root dev                                                   |
| typescript-eslint              | 8.72.2  | root dev                                                   |
| eslint-plugin-react-hooks      | 7.1.1   | root dev                                                   |
| @next/eslint-plugin-next       | 16.4.6  | root dev                                                   |
| prettier                       | 3.9.10  | root dev                                                   |
| vitest                         | 5.1.0   | catalog                                                    |
| zod                            | 4.6.7   | catalog                                                    |
| react, react-dom               | 19.3.1  | catalog (used from P1-B)                                   |
| @types/react, @types/react-dom | 19.3.0  | catalog (used from P1-B)                                   |

Two of these pass the 7-day rule only on 17 November 2026, Manila time: `typescript-eslint` 8.72.2 after about 01:10 and `@next/eslint-plugin-next` 16.4.6 after about 04:30. Earlier than that, use 8.72.1 and 16.4.5 and say so.

## Steps

1. **Root files.**
   - `package.json`: name `smart-app-ph-stays`, `private: true`, `type: module`, `packageManager: pnpm@12.18.0`, `engines.node: ">=24.14 <25"`. Scripts: `dev` = `turbo run dev`, `build` = `turbo run build`, `check` = `turbo run typecheck lint test`, `typecheck` = `turbo run typecheck`, `lint` = `eslint .`, `test` = `turbo run test`, `format` = `prettier --write .`, `format:check` = `prettier --check .`.
   - `pnpm-workspace.yaml` holds every pnpm setting (there is no `.npmrc`): packages `apps/*`, `packages/*`, `tooling`; `savePrefix: ''`; `engineStrict: true`; `minimumReleaseAge: 10080`; a `catalog:` with typescript, @types/node, vitest, zod, react, react-dom, @types/react, @types/react-dom; `allowBuilds:` listing only packages pnpm itself reports as needing a build script (tell me which). No `overrides` unless `pnpm audit --prod` fails; then stop and show me the advisories.
   - `.nvmrc` = `24.14.0`. `.editorconfig` (UTF-8, LF, 2 spaces, final newline).
   - `turbo.json`: use `tasks` (never `pipeline`); `"agentGuidance": false` (so Turborepo never writes into `AGENTS.md`); `globalEnv: ["NODE_ENV"]`; `build` depends on `^build` with outputs `dist/**`, `.next/**`, `!.next/cache/**` and env `NEXT_PUBLIC_*`, `VITE_*`; `typecheck` and `test` depend on `^build`; a root task `"//#lint": {}` so `turbo run lint` runs the one root ESLint; `dev` depends on `^build`, `persistent: true`, `cache: false`. Read `turbo --help` and the Turborepo docs for 2.11 before writing it.
   - `tsconfig.base.json`: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `target` ES2022, `module` and `moduleResolution` NodeNext, `skipLibCheck`, `forceConsistentCasingInFileNames`, `declaration`, `declarationMap`, `sourceMap`, `isolatedModules`.
   - `.gitignore`: `.env*` except `.env.example`, `node_modules/`, `dist/`, `.next/`, `.turbo/`, `build/`, `coverage/`, `.DS_Store`, `*.pem`, `*.tsbuildinfo`, `next-env.d.ts`.
   - `.prettierrc.json`: `semi: true`, `singleQuote: true`, `trailingComma: "all"`, `printWidth: 100`. No plugins (the Tailwind plugin comes in phase 3). `.prettierignore`: lockfile, `dist`, `.next`, `.turbo`, `node_modules`, `coverage`, `docs/blueprints` (exported snapshots are kept as exported).
   - `.vscode/extensions.json` recommending the ESLint and Prettier extensions.
2. **ESLint** (`eslint.config.js`, flat config, the only ESLint config in the repo; Prettier owns formatting, so no style rules):
   - Ignores: `**/dist/**`, `**/.next/**`, `**/node_modules/**`, `**/.turbo/**`, `**/coverage/**`, `docs/**`, `**/next-env.d.ts`.
   - `@eslint/js` recommended and `typescript-eslint` recommended (not the type-checked presets: they are too slow on the founder's Mac).
   - `linterOptions.reportUnusedDisableDirectives: "error"`.
   - Rules: `@typescript-eslint/consistent-type-assertions` with `assertionStyle: "never"`; `@typescript-eslint/ban-ts-comment` banning `ts-ignore`, `ts-expect-error` and `ts-nocheck`; `@typescript-eslint/consistent-type-imports` (`prefer: type-imports`, `fixStyle: separate-type-imports`); `@typescript-eslint/no-explicit-any: error`.
   - React Hooks recommended rules for `**/*.{tsx,jsx}`. The Next plugin's `recommended` and `core-web-vitals` rules for `apps/storefront/**`.
   - Import walls with `no-restricted-imports` patterns, each with a clear message:
     - `apps/dashboard/**` may not import `@smartapp/storefront*`, `@smartapp/api*`, `**/storefront/**`, `**/api/**`.
     - `apps/storefront/**` may not import `@smartapp/dashboard*`, `@smartapp/api*`, `**/dashboard/**`, `**/api/**`.
     - `apps/api/**` may not import `@smartapp/dashboard*`, `@smartapp/storefront*`, `**/dashboard/**`, `**/storefront/**`.
     - Everything except `apps/api/**` may not import `@supabase/*`.
     - `packages/core/**` may not import `react`, `react-dom`, `react/*`, `@smartapp/ui*`, `@smartapp/data*`.
     - `packages/ui/**` may not import `@smartapp/data*`.
     - `apps/**` may not import `**/mocks/**` or `@smartapp/data/mocks*` (screens never import mock files).
     - `apps/dashboard/src/features/**` may not import another feature (`**/features/**`, `@/features/**`, `../*/**`); shared code goes in `apps/dashboard/src/app/`.
   - ESLint applies only the last matching `no-restricted-imports` per file, so write each file group's walls as one combined entry. Say in your plan how you did it.
3. **`packages/core`** (`@smartapp/core`): builds to `dist/` with `tsc` (the API needs compiled JavaScript). `package.json` with `type: module`, `sideEffects: false`, `exports` pointing at `dist` (types and import), scripts `build` = `tsc`, `dev` = `tsc --watch --preserveWatchOutput`, `typecheck` = `tsc --noEmit`, `test` = `vitest run`. Dependency `zod` (catalog); devDependencies `typescript` and `vitest` (catalog). `tsconfig.json` extends the base with `outDir: dist`, `rootDir: src`, and test files left out of the build. `src/index.ts` re-exports `src/words.ts`, which holds `export const words = { appName: 'Smart App PH', productName: 'Stays and Rentals' } as const;`. One test `src/words.test.ts` that checks both names are non-empty.
4. **`packages/data`** (`@smartapp/data`) and **`packages/ui`** (`@smartapp/ui`): source packages (no build step), `type: module`, `sideEffects: false`, `exports` pointing at `./src/index.ts`, scripts `typecheck` = `tsc --noEmit` and `test` = `vitest run --passWithNoTests`, devDependencies `typescript` and `vitest` (catalog), and a `tsconfig.json` extending the base. Each has `src/index.ts` with `export {};` and a one-paragraph `README.md`: data = "the only functions screens call for data; mock adapters from phase 2, the API from phase 11"; ui = "tokens, one stylesheet and installed components from phase 3". `packages/data/src/mocks/README.md`: "Mock adapters live here from phase 2. Screens never import this folder."
5. **CI** (`.github/workflows/check.yml`): on pull requests to `main` and pushes to `main`; `concurrency` with `cancel-in-progress`; Ubuntu; checkout, pnpm (version from `packageManager`), Node from `.nvmrc` with the pnpm cache; then in order: `pnpm install --frozen-lockfile`, `pnpm audit --prod`, `pnpm format:check`, `pnpm check`, `pnpm build`. Use the current major version of each GitHub action; check each action's README and name the versions in your plan. `permissions: contents: read`.
6. **Docs.** Tick P1-A in `docs/PROGRESS.md`, add one line to `docs/CHANGELOG.md`. Record in `docs/decisions.md` (Phase 1 section) any version you had to change and the `allowBuilds` list.
7. **Pull request.** Fill `.github/pull_request_template.md`. `gh pr create --base main`. Print the link.

## Done when

1. `pnpm install --frozen-lockfile`, `pnpm format:check` and `pnpm check` pass locally (paste the last lines of each).
2. `pnpm check` runs `typecheck` and `test` in the three packages and the root ESLint once.
3. The CI check on the pull request is green.
4. No package outside the table above was added. No rule from steps 1 and 2 was left out or loosened.

Finish with: the pull request link, what changed, how I test it, and what I must do by hand.
