Read AGENTS.md, docs/decisions.md and docs/PROGRESS.md. Nothing else.

## Goal

Housekeeping before Phase 3, so the rule book is current and works for every AI coder (Antigravity, Codex, Claude Code). Docs only: no code changes.

## Plan first

Post the exact text changes, then wait for my OK.

## Branch

`ag/p3-0-housekeeping` from the latest main. Follow AGENTS.md rule 10.

## Steps

1. AGENTS.md:
   - Change "Where we are" to Phase 3 (look and app frames).
   - Say Phase 2 is done: the demo world is in packages/core/src/demo, the data layer in packages/data, and the switches are described in docs/demo-data.md.
   - Add one line: "Decisions in docs/decisions.md override the blueprint snapshots in docs/blueprints/."
     Change nothing else in AGENTS.md.
2. Create CLAUDE.md at the repo root with one line: "Read and follow AGENTS.md. It is the rule book for every AI coder in this repository."
3. docs/README.md: rewrite it as a short map of the docs folder, one line per file or folder saying what it is the source of truth for (decisions.md, PROGRESS.md, CHANGELOG.md, demo-data.md, demo-media.md, demo-media-manifest.csv, blueprints/, prompts/).
4. Add `.obsidian/` to .gitignore. Docs keep normal markdown links, never [[wiki links]].
5. Add "Phase 3" with P3-0 to P3-E to PROGRESS and tick P3-0; one CHANGELOG line; save this prompt word for word as docs/prompts/P3-0-housekeeping.md and add its line to docs/prompts/README.md.

## Not in this task

Any code, packages, Tailwind, components or tools.

## Done when

`pnpm format:check` passes, CI is green, and the PR is merged per rule 10. Do not run pnpm build locally; CI runs it.
