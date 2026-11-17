Read AGENTS.md and docs/decisions.md. Then read docs/blueprints/database-blueprint.md sections 4, 5, 7, 8 (only the parts marked wave 1), 11 and 13, and docs/blueprints/feature-blueprint.md section 5 (the wave 1 feature IDs only). Use what Prompt B added in packages/core.

## Goal

Three things, all in packages/core, that survive into the real system unchanged:

1. A Zod schema for every wave 1 table, shaped exactly like the database row, so a demo row can later be inserted as is.
2. An operation contract: every function the wave 1 screens will call, with its input, output, error codes and who may call it. Phase 11 builds the NestJS routes from it.
3. A pure price calculator with golden cases that the real SQL `quote_stay` must match in Phase 10.

## Plan first

Count the wave 1 tables in the Database blueprint and tell me the number (I expect 48). If it is not 48, stop and show me the list. Post the file layout and the operation list, then wait for my OK.

## Branch

`ag/p2c-schemas-contract` from the latest main. Follow AGENTS.md rule 10.

## Build in packages/core/src

1. `schemas/tables/`: one file per area (listing, price, customers, stays, money, chat, files, platform, notify, tracking).
   - One schema per table, named `<table>Row`, with snake_case keys matching the columns, every CHECK written as a Zod rule (lengths, ranges, closed lists from `lists/`), money as Centavos, and dates as CalendarDate.
   - Timestamps are ISO strings and uuids are uuid strings. Nullable columns are `.nullable()`, not optional.
   - Include `accounts.is_demo` and `payment_accounts.is_sample`.
   - Add a test per area that a hand-written valid row passes and three broken rows fail.
2. `schemas/views/`: the read shapes that the read functions return (get_property, get_unit_calendar, quote_stay, get_thread), plus the owner lists the wave 1 screens need (home counts, bookings board, payments to review, inbox, calendar timeline) and the admin owners list. Build each from the row schemas (pick, extend); do not re-type fields.
3. `contract/operations.ts`: one entry per operation, `{ name, access, input, output, errors, idempotent, featureIds }`.
   - `access` is one of public, guest_token, member, owner, super_admin, system.
   - Start with: getProperty, getUnitCalendar, quoteStay, createBookingHold, getThread, postMessage, submitPayment, findMyBooking, cancelBooking, ownerHome, listBookings, getBooking, reviewPayment, recordOwnerPayment, setBlock, releaseBlock, createManualBooking, changeBookingDates, listThreads, listOwnerAccounts, approveAccount, expireHolds.
   - Add any others the wave 1 SQL functions in section 11 need, and list them in your plan.
   - Every write that can repeat takes an `idempotencyKey`. createBookingHold also takes the `expectedTotal` it was shown, so a stale price gives price_changed.
4. `pricing/quoteStay.ts`: a pure function from (unit stay terms, weekday rates, rate overrides, fees, check-in, check-out, adults, children) to price lines and totals.
   - Night rate order: dated override, then weekday rate, then base.
   - Apply the extra-guest fee above base_guests, the cleaning fee and the weekly or monthly discount (only the larger one applies; check the blueprint and stop if it says otherwise). Then the down payment from down_payment_percent.
   - Refuse with a typed reason when nights are under the minimum or over the maximum, guests are over max_guests, the date is inside advance notice, or it is beyond the booking window.
   - Golden cases in `pricing/golden.ts`, at least 15 with exact centavo answers worked out by hand in comments: a weeknight, a weekend, a holiday override, crossing into an override, 7 and 28 nights, extra guests, every refusal, and a 10 % and a 100 % down payment.
5. Add `demo-media` and the app's route names to a `RESERVED_SLUGS` list if Prompt A did not.

## Rules

Do not invent columns. If the blueprint is silent or two sections disagree, stop and ask. No `any`, no casts.

## Not in this task

Demo data, packages/data, NestJS, SQL.

## Done when

`pnpm check` passes, CI is green, the PR is merged per rule 10, and PROGRESS shows "P2-C". In the same pull request, save this prompt word for word as docs/prompts/P2-C-schemas-contract.md and add one line to docs/prompts/README.md: prompt, branch, PR link, date. Your report lists the table count, the operation list with access levels, and any blueprint gap you found.
