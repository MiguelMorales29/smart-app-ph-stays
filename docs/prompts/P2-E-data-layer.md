Read AGENTS.md and docs/decisions.md (D19 above all). Then read packages/core's contract/operations.ts, errors, lifecycles, pricing and demo. From docs/blueprints/database-blueprint.md read section 4 (the occupancy rule) and section 11 (write paths) again.

## Goal

packages/data becomes the only thing screens call for data (D19). It gets a memory adapter that answers from the demo world and imitates the database rules, and a contract test suite written once: it runs against the memory adapter now and against the real API in Phase 11. This is the roadmap's "done when" test: reading and writing demo bookings through packages/data with no screen.

## Plan first

Post the folder layout, the DataSource type, how a session (who is asking) is passed, and the list of contract tests. Wait for my OK.

## Branch

`ag/p2e-data-layer` from the latest main. Follow AGENTS.md rule 10.

## Build in packages/data/src

1. `source.ts`: a `DataSource` type with one method per operation in the core contract. Inputs and outputs come from the contract's Zod schemas, and every method returns `Result<T>`. A `Session` is one of: `{ role: "guest" }`, `{ role: "guest", threadToken }`, `{ role: "member", customerId, accountId }`, `{ role: "owner", accountId, profileId }`, or `{ role: "super_admin", profileId }`. Every call checks its input against the contract and validates its output against the contract (in tests and development).
2. `mocks/memory.ts`: `createMemorySource({ pack, clock, latencyMs?, failWith? })`. It builds its store from `resolveDemoWorld` and imitates each database rule, with a comment saying so:
   - overlap on a unit gives dates_taken (checkout day free; preparation nights block);
   - more than 2 unpaid holds per customer per owner gives hold_limit;
   - expired holds are released first, using the clock;
   - a proof extends the hold to 72 hours;
   - a reused reference per account and method (normalised) gives reference_used;
   - moves are checked against lifecycles (invalid_move);
   - an expectedTotal that differs from quoteStay gives price_changed;
   - the same idempotencyKey returns the first result;
   - booking and receipt numbers have no gaps;
   - another owner's record gives not_found;
   - a guest token opens only its own thread;
   - a role without access gives not_allowed.
3. `client.ts`: `getDataSource()` picks the adapter from configuration given by the app. It reads no environment itself. The memory adapter is loaded with a dynamic `import()` so a build that does not use it does not bundle it or the demo world.
4. `media.ts`: `mediaUrl(file)` turns a files row into a URL. In memory mode it is `/demo-media/...` on the storefront origin (the base URL comes from the app's configuration). In Phase 11 it becomes Supabase Storage.
5. `contract-tests/`: `runContractTests(makeSource)`, a function taking a factory, with at least these cases, all on the qa pack at the golden clock:
   - a quote matches the golden cases;
   - a hold appears on the calendar;
   - an overlapping hold gives dates_taken; a stay starting on the checkout day succeeds; preparation nights block;
   - a third unpaid hold gives hold_limit;
   - a hold expires after its minutes when the clock moves on, and the dates are free again;
   - a proof extends the hold to 72 hours; a reused reference gives reference_used;
   - approval without the wallet check is refused as the blueprint says (if it names no code, stop and ask);
   - approval confirms the booking, and the balance equals the sum of approvals;
   - a double approval gives invalid_move and nothing is counted twice;
   - a stale expectedTotal gives price_changed;
   - the same idempotencyKey twice gives one booking;
   - an owner reading another owner's booking gets not_found; a guest token opens only its thread;
   - cancelling a completed booking gives invalid_move;
   - booking and receipt numbers stay gapless after failed calls;
   - findMyBooking answers the same for a known and an unknown email.
     Run it from `memory.contract.test.ts`. Write a comment at the top saying Phase 11 runs the same suite against the HTTP adapter and the seeded development database.

## Rules

Screens never import from mocks/ (the lint wall already enforces this; prove it with the existing wall test). No React here: query hooks come with the screens. No new packages.

## Not in this task

Switches, placeholder pages, NestJS endpoints, the HTTP adapter.

## Done when

`pnpm check` passes with every contract test, CI is green, the PR is merged per rule 10, and PROGRESS shows "P2-E". In the same pull request, save this prompt word for word as docs/prompts/P2-E-data-layer.md and add one line to docs/prompts/README.md: prompt, branch, PR link, date. Your report lists each contract test with pass or fail.
