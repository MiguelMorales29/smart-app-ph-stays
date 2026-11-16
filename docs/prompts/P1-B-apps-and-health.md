# P1-B The three apps with placeholder pages and the API health check

Paste everything below the line into a new Antigravity conversation (Planning mode), after P1-A is merged.

---

Read `AGENTS.md` and `docs/decisions.md`. Then read `docs/blueprints/stack-register.md` section 2 only. Nothing else. Do not copy code from any other repository.

## Goal

Three apps that start, build and pass their checks, each with one placeholder page or route:

- `apps/storefront` (Next.js) at http://localhost:3100 shows "Smart App PH · Stays and Rentals · storefront".
- `apps/dashboard` (Vite + React) at http://localhost:5174 shows "Smart App PH · Stays and Rentals · dashboard".
- `apps/api` (NestJS) at http://localhost:4100/health answers `{"ok":true,"app":"Smart App PH"}`.

The two front ends take their words from `words` in `@smartapp/core`, which proves the shared package works. `pnpm dev` at the root starts all three; a phone on the same Wi-Fi can open both pages.

## Branch

`ag/p1b-apps` from the latest `main`. One commit per app.

## Not in this task

Tailwind, CSS files, the shadcn CLI, fonts, TanStack Router or Query, React Hook Form, Serwist, Supabase, sign-in, Terminus, more pages. If a step seems to need one, stop and ask.

## Versions

Same rule as P1-A: confirm with `npm view <pkg> version time --json`; if `minimumReleaseAge` refuses one, take the newest older patch of the same minor and list it in your report.

| Package | Version | Where |
|---|---|---|
| next | 16.4.6 | storefront |
| vite | 8.3.7 | dashboard dev |
| @vitejs/plugin-react | 6.3.0 | dashboard dev |
| react, react-dom, @types/react, @types/react-dom | catalog | storefront, dashboard |
| @nestjs/common, @nestjs/core, @nestjs/platform-express | 12.4.2 | api |
| @nestjs/config | 12.1.1 | api |
| @nestjs/testing | 12.4.2 | api dev |
| reflect-metadata | 0.2.2 | api |
| rxjs | 7.8.2 | api |
| helmet | 8.3.0 | api |
| zod | catalog | api |
| unplugin-swc | 2.0.0 | api dev |
| @swc/core | 1.16.22 | api dev |
| supertest | 7.3.2 | api dev |
| @types/supertest | 7.2.1 | api dev |
| @types/express | 5.0.6 | api dev |

`next` 16.4.6 passes the 7-day rule only after about 05:00 on 17 November 2026, Manila time. If it is earlier, use 16.4.5 and say so.

## Steps

1. **`apps/storefront`** (`@smartapp/storefront`). Write the files by hand from the Next.js 16 manual installation docs (no `create-next-app`, so no Tailwind, ESLint config or extra AGENTS.md come with it).
   - `package.json`: scripts `dev` = `next dev -p 3100`, `build` = `next build`, `start` = `next start -p 3100`, `typecheck` = `next typegen && tsc --noEmit` (check `next --help` that `typegen` exists in this version; if not, tell me), `test` = `vitest run --passWithNoTests`. Dependencies `next`, `react`, `react-dom`, `@smartapp/core` (`workspace:*`).
   - `next.config.ts`: `cacheComponents: true`; `allowedDevOrigins: ['192.168.*.*', '10.*.*.*']` so a phone on the Wi-Fi can load the dev page; `transpilePackages: ['@smartapp/ui', '@smartapp/data']`.
   - `tsconfig.json` extending the base, with the settings Next.js needs (`moduleResolution: bundler`, `module: esnext`, `jsx: preserve` or what Next writes, the `next` plugin, `noEmit`, `incremental`, `@/*` to `./src/*`). Let `next dev` adjust it once, then keep what it wrote and tell me what changed.
   - `src/app/layout.tsx`: `<html lang="en">`, `metadata` title "Smart App PH · Stays and Rentals", and a separate `viewport` export (`width: 'device-width'`, `initialScale: 1`, `viewportFit: 'cover'`).
   - `src/app/page.tsx`: one `<main>` with the text from `words` (no styling).
   - Turbopack is the default bundler. The first `pnpm dev` is the smoke test on the founder's macOS 12 Intel Mac: if Next fails to start or build there, stop and tell me (do not switch to webpack on your own).
2. **`apps/dashboard`** (`@smartapp/dashboard`). Write the files by hand (no `create-vite`, which adds a linter and demo files).
   - `package.json`: scripts `dev` = `vite`, `build` = `tsc -b && vite build`, `preview` = `vite preview --port 5174`, `typecheck` = `tsc -b`, `test` = `vitest run --passWithNoTests`. Dependencies `react`, `react-dom`, `@smartapp/core`.
   - `vite.config.ts`: `@vitejs/plugin-react`; `server: { port: 5174, strictPort: true, host: true }` (host true listens on the Wi-Fi address); `preview` the same port; alias `@` to `./src`.
   - `tsconfig.json` with project references to `tsconfig.app.json` (browser code, `jsx: react-jsx`, `moduleResolution: bundler`, `lib` DOM) and `tsconfig.node.json` (the Vite config), both extending the base.
   - `index.html`: `lang="en"`, title "Smart App PH · Dashboard", viewport meta `width=device-width, initial-scale=1, viewport-fit=cover`.
   - `src/main.tsx` renders `src/App.tsx` in `StrictMode`; `App.tsx` shows one `<main>` with the text from `words`.
3. **`apps/api`** (`@smartapp/api`), NestJS 12 written by hand, ESM.
   - `package.json`: `type: module`; scripts `dev` = `tsc -p tsconfig.build.json && (tsc --watch --preserveWatchOutput -p tsconfig.build.json & node --watch --env-file-if-exists=.env.local dist/main.js)`, `build` = `tsc -p tsconfig.build.json`, `start` = `node dist/main.js`, `typecheck` = `tsc --noEmit`, `test` = `vitest run`. Never run the `.ts` files directly: decorators need the build. If `--env-file-if-exists` is not in Node 24.14, tell me.
   - `tsconfig.json` extends the base with `experimentalDecorators`, `emitDecoratorMetadata`, `outDir: dist`, `rootDir: src`, `types: ["node"]`; `tsconfig.build.json` excludes tests. Relative imports end in `.js`.
   - `src/env.ts`: a Zod schema for `NODE_ENV` (`development | test | production`, default `development`), `PORT` (number, default 4100) and `CORS_ORIGINS` (default `http://localhost:3100,http://localhost:5174`), and a `validateEnv` function for `ConfigModule.forRoot({ isGlobal: true, validate })`. The app must not start with a bad environment.
   - `src/main.ts`: `import 'reflect-metadata'` first; `NestFactory.create(AppModule)`; `helmet()`; CORS for the listed origins only; JSON body limit 100 kB; `enableShutdownHooks()`; listen on `PORT`. Modules never import Express types.
   - `src/health/health.controller.ts`: `GET /health` returns `{ ok: true, app: words.appName }` (from `@smartapp/core`).
   - `vitest.config.ts` with `unplugin-swc` (for decorator metadata), `environment: node`.
   - `test/health.e2e.test.ts` with `@nestjs/testing` and supertest: `GET /health` answers 200 with exactly `{ ok: true, app: 'Smart App PH' }`; an unknown route answers 404.
   - `.env.example` with `PORT=4100`, `CORS_ORIGINS=http://localhost:3100,http://localhost:5174`, `NODE_ENV=development`. No real `.env.local` is committed.
4. **Root.** `pnpm dev` starts all three through Turborepo (core builds first). Add `.vscode/settings.json` only if a tool needs it; say why.
5. **Docs.** Tick P1-B in `docs/PROGRESS.md`, one line in `docs/CHANGELOG.md`, and add to `docs/decisions.md` any version or setting you had to change.
6. **Pull request.** Fill the template, `gh pr create --base main`, print the link.

## Done when

1. `pnpm install --frozen-lockfile`, `pnpm format:check`, `pnpm check` and `pnpm build` pass locally and in CI.
2. `pnpm dev` starts all three; http://localhost:3100 and http://localhost:5174 show their text; `curl http://localhost:4100/health` returns `{"ok":true,"app":"Smart App PH"}`.
3. The browser console on both pages has 0 errors and 0 React warnings.
4. The API test passes, including the 404.
5. Your report lists the Wi-Fi addresses to try from a phone: `http://<this Mac's IP>:3100` and `:5174` (find the IP with `ipconfig getifaddr en0`).

Finish with: the pull request link, what changed, how I test it (including the phone check), and what I must do by hand.
