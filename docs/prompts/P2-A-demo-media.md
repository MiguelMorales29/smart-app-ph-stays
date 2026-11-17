Read AGENTS.md, docs/decisions.md and docs/PROGRESS.md. Nothing else yet.

## Goal

The demo photos and logos sit in the wrong place: `.github/stays-demo-assets 6/` (with a space in the name), uncommitted on `main`. Move them to their real home, add a check that keeps them tidy, and record the Phase 2 decisions below.

## Step 0: report the real state, then stop for my OK

1. Run `git status --porcelain | head -50`, `git status --porcelain | wc -l` and `git branch --show-current`.
2. Tell me exactly what is uncommitted. I expect only the untracked folder `.github/stays-demo-assets 6/`, holding `bahay-batis/`, `ilaw-residences/`, `sagwan-trips/`, `tita-lorna-dorm/`, `ulap-suites/`, `manifest.csv` and `README.md`. If anything else is modified or untracked, list it and stop: do not stash, delete or commit it.
3. List what is in `docs/blueprints/`. Prompts B to F need `database.md`, `feature.md` and `system.md` there. If any is missing, say so in the plan.
4. Post your plan and wait for my OK.

## Branch

`ag/p2a-demo-media`, created from the current `main` with the untracked folder carried along (`git switch -c` keeps untracked files). Never commit on `main`. Follow AGENTS.md rule 10 for the pull request and merge.

## Steps

1. Move the folder to `apps/storefront/public/demo-media/` (the files will be served at `/demo-media/<slug>/...`). Move `README.md` to `docs/demo-media.md`; nothing but images and SVGs may sit in `public/`. Move `manifest.csv` to `apps/storefront/public/demo-media/manifest.csv` only if Next.js will not serve it as a page; otherwise put it in `docs/demo-media-manifest.csv` and say which you chose.
2. Delete junk files (`.DS_Store`, `Thumbs.db`, `__MACOSX`). Do not rename, re-encode, resize or crop any image. The 4:3 photos stay 4:3 (decision D23).
3. Add `tooling/check-demo-media.ts` and run it in `pnpm check`. It fails when:
   - a file in the manifest is missing, or a file is not in the manifest;
   - a name breaks the pattern `<slug>/{banners,photos,brand}/<name>-<width>.<webp|png|svg>`. Read the real names first and match the pattern to them. If they do not follow one pattern, stop and show me;
   - a WebP or PNG is over 600 KB;
   - an alt text is empty or over 160 characters.
4. Add `demo-media` to the reserved slugs if a reserved-slug list exists. If none exists, write it into the decision text so Prompt C adds it.
5. Record the decisions below in `docs/decisions.md` exactly as written, numbered from the next free number (I expect D18), and say they were approved by the founder on today's date. Replace the Phase 1 note, if there is one, that says demo data never reaches live.
6. Add the open points O4–O8 below to the open list in `docs/decisions.md`.
7. Create `docs/demo-data.md` with three headings only: "What the demo world is", "Packs", "From local to live". Prompt D fills it.
8. Tick nothing in PROGRESS except "P2-A"; add one line to CHANGELOG.

## Decisions to record

- D18 Demo accounts on live, fenced. Demo rows live only in accounts with `is_demo = true`, and every demo id starts with `dec0de`. The seed refuses any other id, and writing to live needs an explicit `--live` flag. Demo accounts are never billed, paused, counted in platform totals, sent to Meta, or emailed (the outbox drops them). Their pages are noindex and show a "Demo · not a real property" ribbon. Their payment accounts are `is_sample`. Only allow-listed test emails can finish a booking; others see "This is a demo" with a sign-up link. The CI rule is "no demo row outside a demo account", not "no demo data on live".
- D19 The mock lives in packages/data as a memory adapter behind one DataSource interface. Screens call packages/data only. The HTTP adapter and NestJS endpoints come in Phase 11 behind the same interface. The seed runs through the API's services from Phase 10.
- D20 Demo ids are literal UUIDs written once and committed, identical in every environment.
- D21 The demo world is built from an injectable Manila clock with dates relative to today. Golden test clock: 2026-12-10T10:00:00+08:00.
- D22 Manila time uses the built-in Intl API (Asia/Manila) and the +08:00 offset; no date library in Phase 2.
- D23 Demo media lives in apps/storefront/public/demo-media and is served at /demo-media. Photos stay 4:3; screens crop with CSS. Screens get image URLs only from packages/data. On live, the seed uploads the same files to Supabase Storage.
- D24 A bed space is one unit per bed ("Room 2A · Bed 1") until O4 is decided.
- D25 Demo packs: marketing (the only pack allowed on live), qa (development only), empty, busy.

## Open points to record

- O4 How bed spaces count toward the plan's 5 included units.
- O5 Day-use stays (for example a Pansol day swim, 8 am to 5 pm) have no model.
- O6 Unbounded and Young Serif are not in the 8 owner font pairs.
- O7 Check that the five demo brand names are not real businesses before public videos.
- O8 The RA 9653 rent cap is extended only to 31 December 2026; the lease warning must be easy to change.

## Not in this task

Code in packages, image editing, new packages, Sagwan tour data.

## Done when

The media is under apps/storefront/public/demo-media, `.github` holds only GitHub files, `pnpm check` runs the media check and passes, the decisions and open points are recorded, CI is green, and the pull request is merged per rule 10. Report the number of files moved and their total size.
