To save my laptop: while you work, run only `pnpm --filter @smartapp/core test` and `pnpm --filter @smartapp/core typecheck`. Do not run `pnpm build` locally; CI runs the full check and build. Run `pnpm check` once, just before opening the pull request.

Read AGENTS.md, docs/decisions.md (D18–D25), docs/demo-media.md and the media manifest. Then read the demo brand table at the end of this prompt. Use the schemas, lists, time and pricing from packages/core. Do not read the blueprints again unless a question comes up.

## Goal

The four demo properties and the four packs (D25), written once in packages/core/src/demo. The output is rows shaped exactly like the database tables, validated by the table schemas, so the same rows feed the mock now and the seed in Phase 10, on development and on the live demo accounts.

## Plan first

Post the folder layout, the list of people, the unit list with prices, and a table of the bookings in the marketing pack (unit, guest, nights relative to today, status). Wait for my OK.

## Branch

`ag/p2d-demo-world` from the latest main. Follow AGENTS.md rule 10.

## Build in packages/core/src/demo

1. `ids.ts`: every demo id as a literal UUID starting with `dec0de` (D20), grouped by brand and table. Generate them once with a throwaway script, commit the literals, and delete the script. Add a test that ids are unique, start with the prefix, and pass Zod.
2. `brands/<slug>.ts` for ulap-suites, bahay-batis, ilaw-residences and tita-lorna-dorm. Each holds: the account (`is_demo: true`, status active), owner profile, membership, property (published), page (look from the brand table: page, button and accent colours, fonts, logo and icon file names), units, stay or lease terms, weekday rates, fees, amenities, house rules, payment accounts (`is_sample: true`; numbers like `0917 000 0000`; account names start with "SAMPLE"), listing photos (from the media manifest; the first photo is the cover; alt text from the manifest), files rows for those photos, and a subscription (trial or active as the pack needs). Sagwan Island Trips gets no data (tours are MVP B).
3. `people.ts`: one super admin; one owner per brand; extra small owners for account states (pending, trial on day 13, in grace, paused, cancelled, a new empty owner); about 24 customers with invented Filipino names (mix Tagalog, Visayan, Ilocano and Chinese-Filipino names), emails `first.last@example.com`, mobiles in the form `0917 000 xxxx`; Bea Santos joined as a member. Owner sign-in emails are `owner.<slug>@demo.invalid`.
4. `story.ts`: one builder, for example `stay({ unit, guest, checkIn: +3, nights: 2, status: "confirmed", paid: "down" })`. It produces a consistent set: the occupancy row, booking (gapless booking_no per owner), price lines from `quoteStay` (never typed by hand), booking events that follow the life cycle in core, payments with receipt numbers (gapless per owner) and proof files, a thread with a hashed token, Taglish messages, guest list rows when the property requires them, and a review for completed stays. Relative days resolve against the clock (D21). Holiday prices use the next Christmas-to-New-Year window and the next Holy Week after "today".
5. `packs/`: `marketing.ts`, `qa.ts`, `empty.ts`, `busy.ts`, and `resolveDemoWorld({ pack, clock }) => DemoWorld`, where DemoWorld is `{ [table]: Row[] }` in insert order.
   - marketing: Ulap Suites and Bahay Batis with past stays and 4–5 star reviews, a guest checked in today, confirmed stays in the next 30 days (about 65 % full, weekends nearly full), one proof in review, one fresh hold, holiday overrides, three saved replies. Ilaw and Tita Lorna's Dorm with listings and lease terms only (leases and bills are wave 2).
   - qa: every booking and payment status; an expired hold; a rejected proof then a resent one; a reused reference number; a reversed payment; a customer at the 2-hold limit; a stay ending on another's check-in day; preparation nights; minimum and maximum nights; guest lists due soon and overdue; a blocked customer; an anonymised customer; a closed thread; an unpublished property; the extra owner states; storage at 80, 95 and 100 %; a Tita Lorna lease term above the RA 9653 limits; names of 80 characters, emoji and ñ.
   - empty: the new owner with nothing yet.
   - busy: one owner with about 400 bookings over 18 months and 150 customers, made with a seeded random generator so it is the same every run.
6. `invariants.test.ts`, run for every pack at the golden clock and at today's date:
   - every row passes its table schema; every id is unique and a demo id;
   - every foreign key points at a row in the world, in the same account;
   - no two active occupancy rows overlap on a unit (this imitates the database's exclusion constraint; say so in a comment);
   - booking totals equal the sum of their lines, and lines equal quoteStay;
   - booking_no and receipt_no have no gaps per owner;
   - approved payments match the booking's paid amount;
   - every status was reached by allowed life-cycle moves;
   - every photo file exists in the media manifest; every email ends in @example.com or @demo.invalid;
   - every payment account in a demo account is is_sample.
7. A snapshot test of the marketing pack at the golden clock, so any change to the demo world shows up in review.
8. `pnpm demo:print --pack marketing` prints a short summary (counts per table, occupancy per unit for the next 30 days). Fill in docs/demo-data.md: what each pack holds, the people, how dates move, and the local-to-live path from D18 (dev seed in Phase 10; live demo accounts seeded with the marketing pack only; a reset before each recording).

## Demo brand table (from the founder's brand doc v6)

| Brand                                                                                | Type and place                                          | Units and prices                                                                                                                                                                                                                                        |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ulap Suites (ulap-suites)                                                            | Condo staycation, Tagaytay                              | Studio Fog: 2 guests, 24 sqm, ₱2,600 a night (Fri and Sat ₱3,200). 1BR Taal View: 4 guests, 36 sqm, ₱3,400 a night (Fri and Sat ₱4,200). Down payment 30 %, hold 60 minutes, moderate cancellation, guest IDs required, guest list due 48 hours before. |
| Bahay Batis (bahay-batis)                                                            | Private hot-spring house, Pansol                        | Buong Bahay: up to 20 guests, base 15, 4 bedrooms, ₱16,000 a night (Fri and Sat ₱18,000), extra guest ₱500 a night, cleaning ₱1,000. The 22-hour stay is one night (14:00 to 12:00). Down payment 50 %, dp_rebook cancellation.                         |
| Ilaw Residences (ilaw-residences)                                                    | Apartments, Kapitolyo, Pasig; pet-friendly, fiber-ready | Studio A: 22 sqm, ₱14,000 a month. 1BR B: 32 sqm, ₱20,000 a month. 1 month advance, 2 months deposit, ₱3,000 reservation fee.                                                                                                                           |
| Tita Lorna's Dorm (tita-lorna-dorm)                                                  | Bed spaces, Sampaloc; all-in rent, air-con              | Room 2A, ladies: 4 beds at ₱4,800 a bed a month. Room 3B, gents: 6 beds at ₱4,200. One unit per bed (D24), named "Room 2A · Bed 1". 1 month advance, 1 month deposit.                                                                                   |
| Amenities must match what the photos show (the alt texts in the manifest name them). |

## Not in this task

packages/data, apps, a database seed, wave 2 tables (leases, bills, inquiries), tours.

## Done when

`pnpm check` passes with the invariants and snapshot, `pnpm demo:print` works, CI is green, the PR is merged per rule 10, and PROGRESS shows "P2-D". In the same pull request, save this prompt word for word as docs/prompts/P2-D-demo-world.md and add one line to docs/prompts/README.md: prompt, branch, PR link, date. Paste the demo:print output for the marketing pack in your report.
