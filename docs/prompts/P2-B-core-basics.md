Read AGENTS.md and docs/decisions.md (D18–D25 are new). Then read only these parts of docs/blueprints/database-blueprint.md: section 2 (design rules), section 9 (life cycles), and the error codes in section 11. From docs/blueprints/feature-blueprint.md read section 10 (limits and money rules) only.

## Goal

The small, pure building blocks every later prompt uses, all in packages/core, all tested. No React, no data fetching, no new packages.

## Plan first

Post the file list and the public names you will export, then wait for my OK.

## Branch

`ag/p2b-core-basics` from the latest main. Follow AGENTS.md rule 10.

## Build in packages/core/src

1. `money/`: a branded `Centavos` integer type and a Zod schema for it (whole number, 0 or more unless a function says otherwise). Helpers: `pesos(n)` to centavos; `formatPeso` ("₱2,600", "₱2,600.50", "₱1,250,000"); `sum`; `percentOf(amount, percent)` with the rounding rule written in a comment and tested. Never use floats for stored values.
2. `time/`:
   - a branded `CalendarDate` ("YYYY-MM-DD") with a Zod schema;
   - a `Clock` interface (`now(): Date`) with `systemClock` and `fixedClock(iso)`;
   - `manilaToday(clock)`, `addDays`, `nightsBetween(checkIn, checkOut)`, `eachNight`, `weekdayOf` (0 = Sunday), `manilaWallTime(date, "14:00")` returning a Date at +08:00, and `formatManila`.
   - Use `Intl.DateTimeFormat` with `timeZone: "Asia/Manila"` (D22). Test that `manilaToday` is right at 23:59 and 00:01 Manila time, whatever time zone the test machine is in (set `process.env.TZ` in the test).
3. `errors/`: the error codes from the Database blueprint (dates_taken, price_changed, hold_limit, reference_used, invalid_move, not_allowed, not_found, plus any others it lists; list them in your plan), a closed list plus a Zod enum, an `AppError` type `{ code, message, details? }`, and a `Result<T>` type (`{ ok: true, data } | { ok: false, error }`). The words shown to people stay in the existing words file; add one plain message per code there.
4. `lists/`: every closed list the wave 1 tables use, each as an `as const` array plus a Zod enum (booking status, payment status, payment kind and method, occupancy kind, unit mode and type, cancellation presets, account status, subscription status, member role, banks, fee kind and basis, amenity group, and the rest). One file per area. If the blueprint is unclear about a list, stop and ask.
5. `lifecycles/`: the booking, payment and subscription life cycles from section 9, as data, `{ from, to, by }` rows, plus `canMove(machine, from, to, actor)` and `nextStates`. These are the only copy of the allowed moves (the Database blueprint says so). Test every allowed move and at least one refused move per state.
6. `ids/`: a `DEMO_ID_PREFIX = "dec0de"` constant, an `isDemoId` function, and a Zod `uuid` schema. Test that a sample demo id passes Zod's uuid check.

## Rules

Follow AGENTS.md hard rules 4–6. Every export has a unit test. If a blueprint value seems wrong, stop and tell me rather than changing it.

## Not in this task

Table schemas (Prompt C), demo data (Prompt D), packages/data, apps.

## Done when

`pnpm check` passes with the new tests, CI is green, the PR is merged per rule 10, and PROGRESS shows "P2-B". In the same pull request, save this prompt word for word as docs/prompts/P2-B-core-basics.md and add one line to docs/prompts/README.md: prompt, branch, PR link, date. In your report, list the error codes and life-cycle moves you found, so I can compare them with the blueprint.
