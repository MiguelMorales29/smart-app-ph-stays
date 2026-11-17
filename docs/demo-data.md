## What the demo world is

The demo world in `packages/core/src/demo` is the single source of truth for demo rows across all 48 Wave 1 tables. Every row is shaped identically to its PostgreSQL table row and validated by the Zod table schemas in `packages/core/src/schemas/tables`.

- **Deterministic IDs (`D20`):** Every demo UUID is a committed literal starting with `dec0de` (`dec0de<area><table-4hex>-4000-8000-<12hex>`), identical across local memory mocks, development seeds, and fenced live demo accounts.
- **Four demo brands:**
  - **Ulap Suites (`ulap-suites`, Tagaytay City):** Short-stay condo staycation (`Studio Fog` at ₱2,600 weeknight / ₱3,200 Fri–Sat; `1BR Taal View` at ₱3,400 weeknight / ₱4,200 Fri–Sat). 30% down payment, 60-minute hold, `moderate` cancellation, guest IDs required 48 hours before check-in. Look: `#F9FAFF` page, `#6167C6` brand, `#E68B3C` accent, `#E8ECFF` card, `fraunces-figtree`.
  - **Bahay Batis (`bahay-batis`, Calamba City / Pansol):** Short-stay private hot-spring house (`Buong Bahay`, base 15 guests / max 20, ₱16,000 weeknight / ₱18,000 Fri–Sat, ₱500/night extra guest fee, ₱1,000 cleaning fee). 50% down payment, `dp_rebook` cancellation. Look: `#FEF9F1` page, `#008481` brand, `#FA776B` accent, `#D5F4F2` card, `unbounded-plus-jakarta`.
  - **Ilaw Residences (`ilaw-residences`, Pasig City / Kapitolyo):** Long-term pet-friendly, fiber-ready apartments (`Studio A` 22 sqm at ₱14,000/month; `1BR B` 32 sqm at ₱20,000/month; 1 month advance, 2 months deposit, ₱3,000 reservation fee). Look: `#FCFAF6` page, `#293241` brand, `#DF9200` accent, `#E9EDF5` card, `sora-sora`.
  - **Tita Lorna's Dorm (`tita-lorna-dorm`, Manila / Sampaloc):** Long-term bed spaces, one unit per bed (`D24`): `Room 2A · Bed 1..4` (ladies, ₱4,800/month) and `Room 3B · Bed 1..6` (gents, ₱4,200/month), 1 month advance, 1 month deposit. Look: `#FFF9F3` page, `#BF4700` brand, `#2F6AE0` accent, `#FFE7DE` card, `young-serif-plus-jakarta`.
- **People (`people.ts`):**
  - 1 super admin: `Demo Platform Admin` (`admin@demo.invalid`).
  - 4 brand owners (`owner.<slug>@demo.invalid`): `Mara Villanueva` (Ulap Suites), `Jun Mercado` (Bahay Batis), `Clarisse Tan-Chua` (Ilaw Residences), `Lorna Macaraeg` (Tita Lorna's Dorm).
  - 6 extra state owners for QA and empty states: `Ramon Dela Cruz` (pending), `Tessa Panganiban` (trial on day 13), `Noel Catacutan` (in grace), `Bong Soriano` (paused), `Mylene Javier` (cancelled), `Kiko Bautista` (new empty owner).
  - 24 customers with invented Tagalog, Visayan, Ilocano, and Chinese-Filipino names (`first.last@example.com`, digits-only mobiles `09170000201`–`09170000224`); `Bea Santos` has a joined member profile (`bea.santos@example.com`).
- **How dates move (`D21`):**
  - `resolveDemoWorld({ pack, clock })` computes `today = manilaToday(clock)` in `Asia/Manila` (`+08:00`) and resolves every check-in, check-out, hold expiry, payment timestamp, message, and audit log relative to `today`.
  - Holiday rate overrides automatically anchor to the next Christmas-to-New-Year window (`Dec 20`–`Jan 2`) and the next Holy Week (`Maundy Thursday`–`Easter Sunday`) on or after `today`.
  - Snapshot and deterministic tests pin the golden test clock (`2026-12-10T10:00:00+08:00`), while `invariants.test.ts` runs against both the golden clock and `systemClock`.

## Packs

- **`marketing`:** The default pack for local development, screenshots, product demos, and live demo accounts.
  - Ulap Suites and Bahay Batis have 27 bookings across past completed stays (with 4–5 star published and unpublished reviews), today's moves (`Studio Fog` checking in today as `checked_in`; `1BR Taal View` checking out today as `checked_in`), confirmed stays over the next 30 days (~67.8% short-stay occupancy, weekends full), 1 proof in review (`in_review`), 2 active holds (`held`), 1 expired hold, 1 cancelled booking, 1 owner-recorded cash balance payment on Bahay Batis, holiday rate overrides, and 6 saved replies (3 per short-stay brand).
  - Ilaw Residences and Tita Lorna's Dorm include published listings, photos, amenities, house rules, and lease terms (Wave 2 adds leases, bills, and inquiries).
- **`qa`:** Development-only pack exercising edge cases across every status and rule:
  - Every booking status (`held`, `in_review`, `confirmed`, `checked_in`, `completed`, `cancelled`, `expired`) and payment status (`submitted`, `approved`, `rejected`, `reversed`).
  - Rejected payment proof followed by a resent proof, reused reference number (`QAREF777888`), reversed payment with replacement, customer at the 2-hold limit, back-to-back stay starting on another stay's check-out day, `prep_nights = 1` buffer on `1BR Taal View`, `min_nights = 2` and `max_nights = 14` on `Studio Fog`, guest lists due soon and overdue, blocked customer, anonymised customer, closed thread, hidden message, unpublished property with `old_slugs`, extra owner account states, storage usage at 80%, 95%, and 100% of plan quota, a Tita Lorna lease term exceeding RA 9653 deposit/advance limits, and an 80-character customer name containing emoji and `ñ`.
- **`empty`:** The newly approved owner (`Kiko Bautista`, `owner.empty@demo.invalid`) on a fresh trial with zero properties, units, customers, or bookings, used to test first-run empty states and onboarding wizards.
- **`busy`:** High-volume stress-test pack on Ulap Suites with 400 bookings over 18 months (`-360` to `+180` days) and 150 customers, generated with a deterministic seeded PRNG (`mulberry32`) so every run produces identical rows with zero active occupancy overlaps.

Inspect any pack in the terminal with:

```bash
pnpm demo:print --pack marketing
pnpm demo:print --pack qa
pnpm demo:print --pack empty
pnpm demo:print --pack busy
```

## From local to live

Following `D18` and `D19`:

1. **Phase 2–9 (local memory adapter):** `packages/data` loads `resolveDemoWorld({ pack, clock })` into memory behind the `DataSource` interface so screens run with zero database setup.
2. **Phase 10 (local & staging database seed):** The seed script feeds the exact `DemoWorld` rows through the API / database seed pipeline and uploads the files in `apps/storefront/public/demo-media` (mapped by `docs/demo-media-manifest.csv`) to Supabase Storage.
3. **Live demo accounts (`--live`):**
   - Only the `marketing` pack may be seeded on live (`D25`), and the seed command requires an explicit `--live` flag and refuses any row whose `id` does not start with `dec0de` or whose account does not have `is_demo = true`.
   - Demo accounts are fenced (`D18`): never billed, never paused by jobs, excluded from platform revenue/owner totals, excluded from Meta Pixel/CAPI delivery, and dropped by the notifications outbox so no real emails are sent.
   - Public demo pages emit `noindex`, show a `"Demo · not a real property"` ribbon, mark all payment accounts `is_sample = true`, and allow only allow-listed test emails to complete a booking hold.
   - Before each founder video or sales demo, a reset command restores the `dec0de` demo accounts to a fresh `marketing` pack anchored to that day's Manila date.
