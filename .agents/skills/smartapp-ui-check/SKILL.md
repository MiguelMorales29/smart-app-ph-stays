---
name: smartapp-ui-check
description: How to check UI work in Smart App PH before calling it done - brand guard, screenshot baselines and the responsive UI scan that opens every route at phone, tablet and desktop sizes in light and dark. Use this skill at the end of any task that changed a page, frame, component, style, token or route in apps/dashboard, apps/storefront or packages/ui, when the Screenshots CI check fails, and when you need to regenerate screenshot baselines after an intended visual change.
---

# Checking Smart App PH UI

"It builds" is not the same as "it looks right". In Phase 3 the build was green while the sidebar covered the dev bar, a banner showed brown in dark mode and a slug crashed the storefront. These checks exist so that a person never has to be the first to find that kind of problem.

The founder's laptop is slow, so the heavy checks run in GitHub Actions, not locally. Your job is to run the light checks, push, and read what CI reports.

## 1. Local (fast)

```
pnpm format:check
pnpm check
```

`pnpm check` includes `tooling/brand-guard.test.ts`. If it fails, the message names the file, the line and the token to use instead. Fix the colour; don't add `brand-guard-ignore` unless the colour is genuinely data (a QR code, an owner's chosen colour in a preview) and say why in the pull request.

## 2. CI on the pull request (automatic)

Two jobs must be green before merging (`gh pr checks <number> --watch`):

- **Check**: format, typecheck, lint, unit tests, preview and production builds, and the production build scan (no demo data, dev switches or kit code in production bundles).
- **Screenshots**: Playwright in the official container, two parts:
  - `tooling/e2e/screenshots.e2e.ts` compares 24 key screens with the baselines in `tooling/e2e/__screenshots__/`.
  - `tooling/e2e/ui-scan.e2e.ts` opens every dashboard route (read from `apps/dashboard/src/features/kit/route-catalog.ts`, so add new routes there) and every storefront route at 360, 768 and 1280 px, dashboard in light and dark. A page fails on JavaScript or console errors, failed requests, or sideways scrolling.

## 3. Reading the results

Whether it passes or fails, the Screenshots job uploads the **ui-scan-report** artifact: `report.md` plus a screenshot of every page.

```
gh run download <run-id> -n ui-scan-report -D /tmp/ui-scan
```

Then read `/tmp/ui-scan/report.md` and open the screenshots of the screens you touched. Hard problems must be fixed. Soft findings (text covered by another layer, tap targets under 24 px) need judgement: fix them if a real person would be blocked, otherwise mention them in the pull request. Look at the images yourself; the scan cannot tell you that something is ugly or confusing.

When the screenshot comparison fails, the `playwright-screenshot-diffs` artifact shows expected, actual and the difference for each failing screen.

## 4. When you changed the look on purpose

Baselines come only from CI (D40), never from a laptop, because fonts render differently on macOS.

1. Push your branch, then run `gh workflow run update-screenshots.yml --ref <branch>`.
2. Wait for it to finish (`gh run list --workflow update-screenshots.yml --branch <branch>`). It commits the new PNGs to your branch.
3. `git pull`, look at the changed PNGs, and confirm each change is the one you intended. An unexpected change is a bug, not a new baseline.
4. Commits pushed by the workflow do not start CI, so push one empty commit to re-run the checks: `git commit --allow-empty -m "ci: rerun checks after baselines" && git push`.
5. Merge only when Check and Screenshots are green on that latest commit.

## 5. Optional local scan

Only if the founder asks, or you are on a fast machine: `pnpm --filter @smartapp/tooling exec playwright install chromium`, then `pnpm --filter @smartapp/tooling test:e2e ui-scan`. It builds both apps first, so it takes several minutes.
