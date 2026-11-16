# Docs

| File           | What it is                                                | Who reads it                                      |
| -------------- | --------------------------------------------------------- | ------------------------------------------------- |
| `../AGENTS.md` | The rule book for AI coders                               | Every task                                        |
| `decisions.md` | Build decisions made in this repo                         | When a prompt says so, and before changing a rule |
| `PROGRESS.md`  | Which phase and task is done                              | Every task (tick one line)                        |
| `CHANGELOG.md` | One line per merged task                                  | Every task (add one line)                         |
| `prompts/`     | The prompts pasted into the AI coder, kept for the record | The founder                                       |
| `blueprints/`  | Dated Markdown snapshots of the Claude Doc tabs           | Only when a prompt names one                      |

## Blueprint snapshots

The master plan is the Claude Doc "Smart App PH — Stays & Rentals: Project Proposal". Its tabs are exported as Markdown into `blueprints/` with these names:

| Tab                              | File                    |
| -------------------------------- | ----------------------- |
| Build roadmap                    | `build-roadmap.md`      |
| Stack register                   | `stack-register.md`     |
| AI handoff brief                 | `ai-handoff-brief.md`   |
| System blueprint (Proposal)      | `system-blueprint.md`   |
| Database blueprint               | `database-blueprint.md` |
| Feature blueprint                | `feature-blueprint.md`  |
| Meta Pixel, CAPI and super admin | `meta-pixel-capi.md`    |
| Tours (MVP B)                    | `tours-mvp-b.md`        |

The Capstone paper and Knowledge base tabs are not needed for building and stay in the Claude Doc.

When a tab changes, export it again and replace the file in the same pull request as the work that needed it. Diagrams in the Claude Doc may not survive the export; the tables and text are what agents use.
