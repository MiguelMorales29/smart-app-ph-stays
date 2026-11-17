# Phase 1 guide: repository and stack

Three prompts for Antigravity, run in order: P1-A, P1-B, P1-C. Each one is one branch and one pull request. Before them, do step 0 by hand.

## Step 0. Set up by hand (about 20 minutes)

1. **Create the repository** on GitHub: owner `webserbisyo`, name `smart-app-ph-stays`, **Private**, and leave "Add a README", ".gitignore" and "license" all off (it must be empty).
2. **Clone it** next to the food app:
   ```
   cd ~/Project
   git clone https://github.com/webserbisyo/smart-app-ph-stays.git
   cd smart-app-ph-stays
   ```
3. **Copy in the starter pack**: unzip `smart-app-ph-stays-starter.zip` and copy its contents (`AGENTS.md`, `docs/`, `.github/`) into this folder. Hidden folders like `.github` are hidden in Finder; press Cmd+Shift+. to show them.
4. **Export the blueprint snapshots.** In the Claude Doc, open each tab below, use Export → Markdown, and save it into `docs/blueprints/` with this name:
   - Build roadmap → `build-roadmap.md`
   - Stack register → `stack-register.md`
   - AI handoff brief → `ai-handoff-brief.md`
   - System blueprint (Proposal) → `system-blueprint.md`
   - Database blueprint → `database-blueprint.md`
   - Feature blueprint → `feature-blueprint.md`
   - Meta Pixel, CAPI and super admin → `meta-pixel-capi.md`
   - Tours (MVP B) → `tours-mvp-b.md`
5. **Check your tools** in Terminal (paste the output to Claude if anything looks wrong):
   ```
   node -v          # must be v24.14.0
   pnpm -v          # any 12.x; the repo switches to 12.18.0 itself
   gh auth status   # must say Logged in to github.com
   git config user.name && git config user.email
   ```
6. **First commit** (the only time anything goes straight to `main`):
   ```
   git add -A
   git commit -m "docs: starter docs, blueprint snapshots and phase 1 prompts"
   git push origin main
   ```
7. **Open the folder in Antigravity.** Model: Gemini 4 Argon, Medium. Use Planning mode, so the agent posts a plan and waits. In the agent settings, have terminal commands ask for your review, at least for `git push` and anything that deletes files.

## Running each prompt

1. Start a **new** Antigravity conversation for each prompt. A fresh, small context makes fewer wrong guesses.
2. Paste the whole prompt file (everything below its line).
3. Read the plan it posts. Check it against "Review the plan" below, then reply "OK" or with your corrections.
4. When it reports back, check "Review the result" below.
5. Wait for the green tick on the pull request (GitHub → Pull requests → Checks).
6. Merge it yourself (Squash and merge), then in Terminal: `git checkout main && git pull`.
7. Paste the agent's final report to Claude if anything looked odd. Then run the next prompt.

## Review the plan (every prompt)

- Does it list only the packages in the prompt's table?
- Does it name a branch `ag/p1...` and say it will open a pull request, never push to `main`?
- Does it skip anything the prompt says "Not in this task"?
- For scaffolders or GitHub actions, does it name the versions or flags it will use?

## Review the result

- **P1-A:** the pull request shows `turbo.json`, `pnpm-workspace.yaml`, `eslint.config.js`, `tsconfig.base.json`, three folders in `packages/` and `.github/workflows/check.yml`. CI is green.
- **P1-B:** run `pnpm dev`. Open http://localhost:3100 and http://localhost:5174 on the Mac, then `http://<your Mac's IP>:3100` and `:5174` on your phone (same Wi-Fi). Open http://localhost:4100/health. Each shows its text.
- **P1-C:** the report shows 14 lint-wall cases passing, a wall it broke on purpose failing, and the fresh-clone check passing.

## Red flags: stop and paste to Claude

- It edited `eslint.config.js`, a tsconfig or a test to make a check pass.
- It added a package that is not in the table, or a `^` in a version.
- It pushed to `main`, or skipped the pull request.
- It switched Next.js to webpack, or changed the Node version, on its own.
- It says "done" without pasting the command output.

## Prompt log

- [P1-A](P1-A-root-tooling-packages-ci.md) · `ag/p1a-root` · [PR #1](https://github.com/MiguelMorales29/smart-app-ph-stays/pull/1) · 2026-11-16
- [P1-B](P1-B-apps-and-health.md) · `ag/p1b-apps` · [PR #3](https://github.com/MiguelMorales29/smart-app-ph-stays/pull/3) · 2026-11-16
- [P1-C](P1-C-walls-scan-verify.md) · `ag/p1c-verify` · [PR #4](https://github.com/MiguelMorales29/smart-app-ph-stays/pull/4) · 2026-11-16
- [P2-A](P2-A-demo-media.md) · `ag/p2a-demo-media` · [PR #5](https://github.com/MiguelMorales29/smart-app-ph-stays/pull/5) · 2026-11-17
- [P2-B](P2-B-core-basics.md) · `ag/p2b-core-basics` · [PR #6](https://github.com/MiguelMorales29/smart-app-ph-stays/pull/6) · 2026-11-17
- [P2-C](P2-C-schemas-contract.md) · `ag/p2c-schemas-contract` · [PR #7](https://github.com/MiguelMorales29/smart-app-ph-stays/pull/7) · 2026-11-17
- [P2-D](P2-D-demo-world.md) · `ag/p2d-demo-world` · [PR #8](https://github.com/MiguelMorales29/smart-app-ph-stays/pull/8) · 2026-11-17
- [P2-E](P2-E-data-layer.md) · `ag/p2e-data-layer` · [PR #9](https://github.com/MiguelMorales29/smart-app-ph-stays/pull/9) · 2026-11-17
- [P2-F](P2-F-switches.md) · `ag/p2f-switches` · [PR #10](https://github.com/MiguelMorales29/smart-app-ph-stays/pull/10) · 2026-11-17
- [P3-0](P3-0-housekeeping.md) · `ag/p3-0-housekeeping` · 2026-11-18
- [P3-A](P3-A-ui-foundation.md) · `ag/p3a-ui-foundation` · [PR #12](https://github.com/MiguelMorales29/smart-app-ph-stays/pull/12) · 2026-11-18
- [P3-B](P3-B-theme-engine.md) · `ag/p3b-theme-engine` · 2026-11-18
