# Tours (MVP B)

Added on 15 November 2026. **Status: planned for MVP B. Nothing here is built in MVP A**, but section 12 lists the few things MVP A must get right now so tours can be added later without rework.

A tour is the third listing type, beside staycations and rentals. **A tour is a package sold per head on fixed dates the owner sets. Many separate groups join the same date until its seats run out.** Example: a 2-day, 1-night Anawangin Cove joiner tour every weekend, ₱2,299 per head with van transfer, ₱500 per head down payment, "non-refundable but transferable".

## 1. At a glance

| # | Decision | Why |
| --- | --- | --- |
| T1 | Tours are a third listing type in the **same repo, database and three apps**, not a separate system | Payments with proof, chat, customers, rewards, reviews, the page editor and super admin are reused. A second repo would mean building and fixing all of them twice |
| T2 | **MVP B**, built after calendar sync, and only if interviews with five tour operators confirm the need (section 16) | Keeps MVP A small; seat counting and per-head pricing are new logic |
| T3 | Turned on per owner by the super admin with `accounts.tours_enabled` | Same pattern as every MVP B module: one module at a time, behind a per-owner switch |
| T4 | A tour belongs to a **property**, which acts as the owner's business page. A tour-only operator has a property with no units | Reuses the slug, logo, page editor, payment accounts and policies. The screens call it "business page" when the owner has no units |
| T5 | What is sold is a **seat on a departure** (one tour date), not a unit on a night. Seats are counted inside one SQL function under a row lock | Two people racing for the last seats can never both get them |
| T6 | Prices are **per head, by price option** (with van, with meals, walk-in, child). The down payment is a fixed amount per head, a percentage, or the full price | This is how Philippine joiner tours are priced |
| T7 | Vans are optional. A departure may have vehicles with seats. A walk-in option takes a slot but no van seat | Matches "3rd van open slots" and "walk-in / own vehicle" guests |
| T8 | When the **customer** cancels, the tour's cancellation preset applies. "Non-refundable but transferable" is a preset; a transfer is a change of guest name before a cutoff | The most common policy in tour posts |
| T9 | When the **owner** cancels a departure (too few joiners, weather, a closed site), every booking gets a full refund or a move to another date. "Non-refundable" never applies to the owner's own cancellation | Fair to customers and protects us from complaints |
| T10 | Guest **names** are kept per seat for the manifest. **No ID photos** | The resort, the boat and the van need names; ID photos are the most sensitive data and are not needed |
| T11 | DOT accreditation is the owner's legal duty. The tour may show an optional accreditation number; we do not verify it | Under RA 9593 tour operators are primary tourism enterprises (section 14) |
| T12 | Platform Meta tracking does not change. Owners still get no Pixel of their own | Tours are an owner feature; our Pixel only tracks owners signing up for Smart App PH |

## 2. The three listing types

|  | Rental (long term) | Staycation (short term) | Tour (fixed dates) |
| --- | --- | --- | --- |
| What the customer buys | Months in one unit | Nights in one unit | A seat on one trip date |
| Price | Per month | Per night | Per head, by price option |
| Who else shares it | Nobody; one tenant per unit | Nobody; one group per unit per night | Many separate groups on the same date |
| What stops overselling | Date-range lock on `unit_occupancy` | Date-range lock on `unit_occupancy` | Seat count on `tour_departures`, under a row lock |
| How booking starts | Inquiry, viewing, reservation | Hold, then down payment proof | Hold seats, then down payment proof |
| How it ends | Move-out and deposit | Checkout | Tour end date, then review |
| Tables | `units`, `leases`, `bills` | `units`, `bookings` | `tours`, `tour_departures`, `tour_bookings` |

An owner can offer any mix of the three from one account. The business page shows a tab for each type the owner has listed.

## 3. A real post, mapped to the app

The Anawangin Cove post Lex shared (15 November 2026) is a typical joiner tour. Each part maps to a feature:

| In the post | In our app |
| --- | --- |
| "2D1N Anawangin Tour + Capones or Camara Island" | A tour with `days` 2 and `nights` 1, and itinerary steps per day |
| ₱2,299 with van, no food; ₱2,599 with van and 3 meals; ₱1,699 walk-in with 3 meals | Three price options. The walk-in option has `uses_transport` off |
| "March 7-8 (4th van open slots)" | A departure with four vehicles; the page shows "Van 4 filling, 6 seats left" |
| Long lists of weekend dates, March to August | Bulk-created departures: every Saturday from a start date to an end date, plus extra dates |
| "Holy week tour" | A departure label, with an optional price change for that date |
| Package inclusions, exclusions, things to bring, notes | Content items, each with a kind |
| Seasonal events: fire dancing, comedy show, foam party | Highlights |
| Banana boat, kayak, dragon boat "(optional, own account)" | Add-ons marked "pay on site": shown with a price, never charged in the app |
| "500/head down payment" | Down payment mode `per_head`, ₱500 |
| "Non refundable but transferable to another person" | Preset `non_refundable_transferable` |
| "Exclusive/private tours available anytime" | Private tour request (B2, section 4) |
| "We also accept walk in, with own vehicle guests" | The walk-in price option, and manual bookings typed by the owner |
| "Open for solo, couple, team, friends or family. No age restriction" | `min_age` left empty |
| "PM us" and phone numbers | The booking's in-app conversation; the owner's Messenger link stays on the page |
| "800+ positive reviews" | Tour reviews, only from completed bookings |
| "Travel light (1 bag only)", "no electricity" | Notes, shown on the page and in the confirmation |

## 4. Scope

**B1, the first tours release:**

1. Tour editor: details, price options, itinerary, inclusions, exclusions, things to bring, notes, highlights, pickup points, add-ons, photos, policies.
2. Departures: one at a time or in bulk, with capacity, vans, minimum headcount, booking cutoff and an optional price change.
3. Seat holds, booking, and down payment with proof, through the same payment flow as stays.
4. Guest names per seat, the guest-list cutoff, and seat transfers.
5. Customer cancellation by preset; owner cancellation of a whole departure with refund or move.
6. Moving a booking to another date.
7. Minimum headcount: "needs 4 more to run", then "guaranteed".
8. Manifest per departure, grouped by van and pickup point, printable and downloadable as CSV.
9. Tour day: tick who arrived, record balance payments, mark no-shows.
10. Reviews, stamps or points, reminders.

**B2, later:** private or exclusive tour requests with a quote; promo codes for tours; a waitlist when a date is full; automatic child and senior prices; SMS reminders (this follows the SMS module).

**Not planned:** selling other operators' tours for a commission (that would make us a travel agency), an online payment gateway (it follows the MVP B payments module), fleet scheduling beyond seat counts, and travel insurance.

## 5. How a customer books a tour

1. Opens the owner's business page, the Tours tab, and picks a tour.
2. Sees upcoming dates with seats left ("Sat 7 Mar to Sun 8 Mar, 6 seats left in Van 4"), price options, itinerary, inclusions, exclusions, things to bring and the policy.
3. Picks a date, how many people per price option, a pickup point (only when an option uses the van) and any add-ons paid online.
4. Enters the lead guest's name, mobile and email. Other guests' names can be given now or later, until the guest-list cutoff.
5. Taps Reserve. The seats are held for the tour's hold time. The page shows the total, the down payment due now, the balance and when it is due.
6. Pays the down payment by GCash, Maya or bank and uploads proof, exactly as for a stay. The booking moves to "in review".
7. The owner approves. The booking is confirmed. The confirmation shows the meeting point, pickup time, things to bring and the coordinator's contact.
8. A reminder goes out the day before. On the tour day the coordinator ticks the guests. After the end date the booking completes, the customer earns a stamp or points, and is asked for a review.

**Statuses:** `held`, `in_review`, `confirmed`, `completed`, `cancelled`, `expired`, `no_show`. These are the stay statuses with `checked_in` replaced by a per-guest tick and `no_show` added.

## 6. How the owner runs tours

1. **Create a tour** in a short wizard: details, price options, what is included, itinerary, pickup points, policy, photos. It starts as a draft.
2. **Add dates.** One date at a time, or repeat: "every Saturday from 7 March to 29 August, except 18 April". Each date gets a capacity, vans, a minimum headcount and a booking cutoff. Holy Week can carry a label and a higher price.
3. **Watch dates fill.** The departures list shows, per date: seats sold, held and left; seats per van; headcount against the minimum.
4. **Approve payments** in the same review queue as stays.
5. **Open the manifest** for a date: guests grouped by van and pickup point, lead mobile, paid and balance, notes. Print it or download a CSV for the resort, the boat crew or the LGU.
6. **On the tour day:** tick each guest who arrived, record cash or GCash balance payments, mark no-shows.
7. **When something changes:** move a booking to another date, change a guest's name for a transfer, add a van, or cancel the whole date.

## 7. Seats and vans

**The counting rules:**

1. Seats taken on a departure = the people on its bookings that are `held` (not yet expired), `in_review` or `confirmed`.
2. A price option with `counts_as_seat` off (for example an infant on a lap) adds no seat.
3. Van seats taken = only the people on options with `uses_transport` on.
4. A new booking fits when seats taken plus the new people stay within `capacity`, **and** van seats taken plus the new van riders stay within the total seats of the departure's vehicles.
5. If `capacity` is empty, only the van seats limit the date. A departure with no capacity and no vehicles cannot be opened.
6. Adding a van raises the van seats at once. Removing a van is refused if the remaining seats would be fewer than the riders already booked.
7. "Van 3 filling" means the first vehicle in sort order that still has free seats. The owner assigns bookings to vans on the manifest; a booking's group always stays in one van, and auto-assign fills Van 1 first.

**Why a row lock:** if two customers tap Reserve for the last two seats at the same moment, the function locks that departure's row, so the second request waits, sees the seats are gone and gets `departure_full`. The counters are changed only by the SQL functions in section 10.

```sql
-- inside hold_tour_seats, all or nothing
select capacity, seats_taken, transport_taken
  from tour_departures
 where id = p_departure_id and status = 'open'
   for update;                       -- the second caller waits here

-- van seats = sum of this departure's vehicles
if p_capacity is not null and v_seats_taken + p_pax > p_capacity
   or v_transport_taken + p_riders > v_van_seats then
  raise exception 'departure_full' using errcode = 'P0001';
end if;

update tour_departures
   set seats_taken = seats_taken + p_pax,
       transport_taken = transport_taken + p_riders
 where id = p_departure_id;
-- then insert tour_bookings, lines and guests; expiring a hold gives the seats back
```

## 8. Money

1. **Total** = each price option's price times its number of people, plus add-ons paid online. Prices are copied into the booking's lines, so editing a tour never changes an existing booking.
2. **Departure price change:** `price_adjust_centavos` on a departure adds to (or takes from) every option's per-head price on that date, for Holy Week or a long weekend.
3. **Down payment** (`required_centavos`): `per_head` (₱500 × people), `percent` (for example 30%), or `full`.
4. **Balance:** either paid on the tour day to the coordinator (the owner records it with the existing `record_owner_payment`), or due a set number of days before (the customer uploads proof again; a reminder goes out).
5. **Customer cancels:** the tour's preset decides what is refunded: `flexible`, `moderate`, `firm`, `non_refundable`, `non_refundable_transferable` or `custom` with the owner's own words. A refund is recorded by the owner as a `refund` payment, as with stays. The app moves no money.
6. **Transfer:** before `transfer_cutoff_hours`, the lead guest or the owner replaces a guest's name. The old name is kept as inactive and the change is logged. No money changes.
7. **Move to another date:** the owner (or the customer, if the preset allows a rebook) moves a booking to another departure of the same tour that has seats. Both departures are locked in one step. A price difference becomes a line.
8. **Owner cancels a departure:** every active booking on it is cancelled with `cancelled_by = owner`, the customer is told in the conversation and by notice, and is offered a full refund or a move. The preset never applies here.
9. **Minimum headcount:** the date shows "needs 4 more to run" until `min_pax` is reached, then "guaranteed". If the minimum is not reached by the decision time (default 72 hours before), the owner is alerted to run it anyway or cancel the date.

## 9. Database

Twelve new tables, all in a new build wave after MVP A. Every table has the standard columns (`id`, `account_id`, `created_at`, `updated_at` where rows change) and owner-isolation rules like every other table.

**`tours`** One tour package.

| Column | Type | Rule |
| --- | --- | --- |
| `property_id` | uuid | To `properties` (the business page) |
| `slug` | text | Unique within the property |
| `name` | text | 1 to 80 |
| `summary`, `description` | text | Up to 200 and 4,000 |
| `destination` | text | For example "Anawangin Cove, San Antonio, Zambales" |
| `days`, `nights` | smallint | Days 1 to 30; nights 0 to `days` |
| `meeting_info` | text | Where and when to meet; shown only after a booking is confirmed |
| `min_age` | smallint | Optional |
| `dp_mode`, `dp_value` | text, integer | `per_head` (centavos), `percent` (1 to 100) or `full` |
| `balance_due`, `balance_due_days` | text, smallint | `on_tour_day`, or `before` with 1 to 30 days |
| `hold_minutes` | smallint | Default the same as stays |
| `booking_cutoff_hours` | smallint | No new bookings this close to the start; default 24 |
| `guest_list_due_hours` | smallint | All names due this close to the start; default 24 |
| `transfer_cutoff_hours` | smallint | Name changes allowed until this close; default 24 |
| `cancellation_preset`, `cancellation_note` | text | Includes `non_refundable_transferable`; note required for `custom` |
| `decision_hours` | smallint | When to alert if the minimum is not met; default 72 |
| `dot_accreditation_no` | text | Optional, shown on the page, not verified |
| `status`, `sort_order`, `archived_at` |  | `draft`, `listed`, `unlisted`; archived instead of deleted |

**`tour_content_items`** Itinerary steps and lists.

| Column | Type | Rule |
| --- | --- | --- |
| `tour_id` | uuid | To `tours` |
| `kind` | text | `itinerary`, `inclusion`, `exclusion`, `bring`, `note`, `highlight` |
| `day_no`, `time_label` | smallint, text | Itinerary only, for example day 1, "6:00 AM" |
| `body` | text | 1 to 300 |
| `sort_order` | integer |  |

**`tour_price_options`** The per-head tiers.

| Column | Type | Rule |
| --- | --- | --- |
| `tour_id` | uuid | To `tours` |
| `name`, `details` | text | 1 to 60; up to 200 ("With van, 3 meals") |
| `price_centavos` | bigint | Above zero |
| `uses_transport` | boolean | Takes a van seat |
| `counts_as_seat` | boolean | Default true; false for an infant on a lap |
| `max_per_booking` | smallint | Optional |
| `status`, `sort_order` |  | `active` or `hidden`; hidden instead of deleted once used |

**`tour_addons`** Extras.

| Column | Type | Rule |
| --- | --- | --- |
| `tour_id` | uuid | To `tours` |
| `name` | text | 1 to 60 |
| `price_centavos` | bigint | Zero or more |
| `per` | text | `person` or `booking` |
| `pay_where` | text | `online` (added to the total) or `on_site` (shown only) |
| `status`, `sort_order` |  |  |

**`tour_pickup_points`**

| Column | Type | Rule |
| --- | --- | --- |
| `tour_id` | uuid | To `tours` |
| `name` | text | 1 to 80, for example "Cubao, Farmers Plaza" |
| `pickup_time` | time | Local time on the first day |
| `map_url` | text | Optional |
| `sort_order` | integer |  |

**`tour_departures`** One date of a tour.

| Column | Type | Rule |
| --- | --- | --- |
| `tour_id` | uuid | To `tours` |
| `starts_on`, `ends_on` | date | `ends_on` = `starts_on` + `days` − 1, set on insert |
| `start_time` | time | Optional, for day tours with several slots |
| `label` | text | Optional, up to 40 ("Holy Week") |
| `capacity` | smallint | Optional overall limit |
| `min_pax` | smallint | At least 1 |
| `price_adjust_centavos` | bigint | Default 0; may be negative but never below any option's price |
| `seats_taken`, `transport_taken` | smallint | Kept only by the functions in section 10 |
| `status` | text | `open`, `closed`, `cancelled`, `completed` |
| `guaranteed_at`, `cancelled_at`, `cancel_reason` |  | Set by the matching move |

Key: unique `(tour_id, starts_on, start_time)` with nulls not distinct.

**`tour_departure_vehicles`**

| Column | Type | Rule |
| --- | --- | --- |
| `departure_id` | uuid | To `tour_departures` |
| `label` | text | "Van 1" |
| `seats` | smallint | 1 to 60 |
| `plate`, `driver_name` | text | Optional, for the manifest |
| `sort_order` | integer |  |

**`tour_bookings`** One group's booking on one date.

| Column | Type | Rule |
| --- | --- | --- |
| `property_id`, `tour_id`, `departure_id`, `customer_id` | uuid |  |
| `booking_no` | bigint | Its own counter per owner, shown as T-0001; unique `(account_id, booking_no)` |
| `status` | text | See section 5 |
| `source`, `source_note` | text | `direct` or `manual` |
| `pax`, `riders` | smallint | Seats and van seats this booking takes |
| `pickup_point_id`, `vehicle_id` | uuid | Optional |
| `total_centavos`, `required_centavos` | bigint | Sum of lines; the down payment |
| `balance_due_on` | date | When `balance_due` is `before` |
| `expires_at` | timestamptz | Holds only |
| `guest_note` | text | Up to 500 |
| `reward_claim_id` | uuid | Optional, to `reward_claims` |
| `moved_from_departure_id` | uuid | Set when moved |
| `confirmed_at`, `completed_at`, `cancelled_at`, `cancelled_by`, `cancel_reason` |  | As in `bookings` |
| `guest_list_submitted_at` | timestamptz | As in `bookings` |

**`tour_booking_lines`** The price, line by line.

| Column | Type | Rule |
| --- | --- | --- |
| `tour_booking_id` | uuid |  |
| `kind` | text | `option`, `addon`, `adjustment`, `discount`, `reward` |
| `ref_id` | uuid | The option or add-on, when there is one |
| `label` | text | Copied at booking time |
| `unit_centavos`, `quantity`, `amount_centavos` | bigint, smallint, bigint | A discount is negative |

**`tour_booking_guests`** One row per seat.

| Column | Type | Rule |
| --- | --- | --- |
| `tour_booking_id`, `price_option_id` | uuid |  |
| `full_name` | text | 1 to 80 |
| `is_lead` | boolean | Exactly one lead per booking |
| `mobile` | text | Required for the lead |
| `age` | smallint | Optional; only if the owner turns it on |
| `emergency_contact` | text | Optional |
| `active`, `transferred_at` | boolean, timestamptz | A transfer makes the old row inactive and adds a new one |
| `checked_in_at` | timestamptz | Ticked on the tour day |

**`tour_booking_events`** Append-only history, same columns as `booking_events`, with `tour_booking_id`.

**`tour_reviews`** Same columns and rules as `stay_reviews`, with `tour_booking_id`, unique.

**Changes to existing tables:**

| Table | Change |
| --- | --- |
| `accounts` | Add `tours_enabled` boolean, default false, set only by the super admin |
| `payments` | Add `tour_booking_id`; the rule becomes "exactly one of `booking_id`, `bill_id`, `tour_booking_id`" |
| `threads` | Add `tour_booking_id` |
| `stamp_ledger` | Add `tour_booking_id`, unique, so a tour earns once |
| `reward_claims` | Add `used_on_tour_booking_id` |
| `files` | `used_by_table` also allows `tours` |
| Notice kinds | Add tour notices: confirmed, reminder, date guaranteed, date cancelled, balance due |

## 10. SQL functions and timed jobs

| Function | Called when | What it does, all or nothing |
| --- | --- | --- |
| `hold_tour_seats` | A customer taps Reserve | Locks the departure, checks cutoff, status and seats, saves the customer, takes the seats, writes lines and guests, numbers the booking, opens the thread, queues notices |
| `create_manual_tour_booking` | The owner types a booking | Same seat check; saves it as confirmed |
| `submit_payment`, `review_payment` | Existing | Also accept `tour_booking_id`; approval confirms the tour booking |
| `submit_tour_guest_list` | The lead sends names | Checks the count against `pax`, saves names, locks the list |
| `transfer_tour_seat` | A name changes before the cutoff | Makes the old guest row inactive, adds the new one, writes an event |
| `move_tour_booking` | A booking changes date | Locks both departures in id order, moves the seats, adds a price-difference line |
| `cancel_tour_booking` | The customer or owner cancels one booking | Gives the seats back, sets the status, queues notices |
| `cancel_departure` | The owner cancels a date | Cancels every active booking with `cancelled_by = owner`, posts a message in each conversation, queues notices |
| `set_departure_vehicles` | The owner adds or removes a van | Refuses if seats would fall below riders already booked |
| `create_departures` | The owner adds dates in bulk | Makes one row per date; skips dates that already exist |
| `mark_tour_guest`, `complete_tour_booking` | Tour day and after | Ticks guests, marks no-shows, completes bookings, adds the stamp or points |

| Job | When | What it does |
| --- | --- | --- |
| `expire_holds` (existing) | Every minute | Also expires tour holds and gives their seats back |
| `tour_day_jobs` | Hourly | Sends the day-before reminder and balance reminders, marks dates guaranteed, alerts the owner at `decision_hours` if the minimum is not met, completes dates whose end has passed |

## 11. Pages and routes

**Property app (customers):**

| Route | Page |
| --- | --- |
| `/<slug>` | Business page; a Tours tab appears when the owner has a listed tour |
| `/<slug>/tours/<tour>` | Tour page: photos, price options, dates with seats left, itinerary, inclusions, exclusions, things to bring, policy, reviews |
| `/<slug>/tours/<tour>/book?date=` | Choose people per option, pickup point, add-ons, lead guest; then Reserve |
| Existing payment and booking pages | Show tour bookings too: pay, upload proof, guest names, conversation |
| `/my/trips` (existing list) | Lists stays and tours together |

**Owner dashboard:**

| Route | Page |
| --- | --- |
| `/tours` | List of tours with next date and seats sold |
| `/tours/new`, `/tours/<id>` | Tour editor |
| `/tours/<id>/dates` | Departures calendar and list; add one date or repeat |
| `/tours/<id>/dates/<date id>` | One date: fill by van, bookings, minimum headcount, cancel date |
| `/tours/<id>/dates/<date id>/manifest` | Manifest by van and pickup point; print and CSV; tour-day ticks |
| Existing bookings inbox and payment queue | Include tour bookings, marked "Tour" |

**Super admin:** a switch to turn tours on per owner, and tours counted in the platform reports.

## 12. What MVP A must do now so tours are not locked out

These cost almost nothing in MVP A and avoid rework later:

1. Write every "exactly one of" rule with `num_nonnulls(...) = 1`, for example `check (num_nonnulls(booking_id, bill_id) = 1)` on `payments`. Adding `tour_booking_id` later is then a one-line change.
2. Keep notice kinds, cancellation presets and file `used_by_table` values as closed lists that can grow (a `CHECK` plus one Zod enum), never hard-coded in screens.
3. Name the shared payment, thread and stamp code by what it does ("the thing being paid for"), not by "booking", so a third kind slots in.
4. Let a property exist and publish with zero units. A tour-only operator needs this.
5. Leave room on the business page for a third tab; do not assume every listing is a unit.
6. Keep `hold_minutes`, cutoffs and reminders as settings, not constants.

Nothing else for tours is built, tested or migrated in MVP A.

## 13. Rewards, reviews, chat and tracking

1. **Rewards:** a completed tour booking earns from the same stamp card or points rule as a stay. A reward can be used on a tour booking as a `reward` line.
2. **Reviews:** one per completed tour booking, within 30 days of the end date; the tour page shows the average and recent reviews.
3. **Chat:** every tour booking has its own conversation, with the same proof cards as stays.
4. **Tracking:** no change. The platform Pixel tracks only owners signing up for Smart App PH.

## 14. Rules and legal

1. **DOT accreditation.** RA 9593, the Tourism Act of 2009, makes accreditation mandatory for primary tourism enterprises, which include tour operators and tourist transport operators, and the DILG has told LGUs to issue permits to operate only to accredited ones. Our terms say the owner is responsible. The tour editor has an optional accreditation number that appears on the page. We do not check it. Not legal advice; the lawyer reviewing our terms should confirm the wording.
2. **Site fees.** Environmental, entrance and overnight fees belong to the owner's package and price. We only display what the owner writes.
3. **Privacy.** Names, the lead's mobile and an optional emergency contact only. No ID photos for tours. Manifests are visible only to the owner and their staff. Guest rows follow the same retention rule as stay guest lists.
4. **No money held.** As with stays, customers pay the owner directly; the app records proof.

## 15. Acceptance tests

1. Two customers reserve the last 2 seats at the same moment: exactly one succeeds, the other gets `departure_full`.
2. A walk-in booking does not use van seats; a with-van booking is refused when the vans are full even if `capacity` has room.
3. A hold that expires gives its seats back within one run of `expire_holds`.
4. Editing a price option does not change existing bookings.
5. A transfer before the cutoff changes the name, keeps the old row inactive, and changes no money; after the cutoff it is refused.
6. Cancelling a departure cancels every active booking with `cancelled_by = owner` and posts a message in each conversation.
7. A booking cannot be made after `booking_cutoff_hours`, or on a `closed` or `cancelled` date.
8. `payments` refuses a row with both `booking_id` and `tour_booking_id`.
9. Removing a van that would leave fewer seats than riders is refused.
10. Owner A cannot read or change Owner B's tours, dates, bookings or manifests.
11. Bulk-adding "every Saturday from 7 March to 29 August" twice creates no duplicates.
12. A completed tour booking adds exactly one stamp; reversing its payment takes it back.

## 16. Before building: interview five tour operators

1. How do you take bookings now (Messenger, Google Sheets, a notebook)? What goes wrong most?
2. How do you decide how many vans to book, and when do you add one?
3. What is your down payment, and when is the balance paid?
4. What happens when not enough people join? How often does that happen?
5. Do customers transfer seats? How do you track it?
6. Who needs your guest list (resort, boat, LGU, driver), and in what form?
7. Do you use pickup points? How many per trip?
8. Do you also offer private tours, and how do you price them?
9. Do you also rent out rooms or units? (This tells us how many would use stays and tours together.)
10. Would you pay for this, and how much a month?

If at least three of the five would use it and the answers fit section 4, build B1. If not, park it.

## 17. Still open

1. The Smart App PH plan price for tour operators: same plans as hosts, or a tours add-on.
2. Whether B1 includes private tour requests or leaves them for B2.
3. The default hold time for tours, once interviews show how fast people pay.
4. Whether age per guest is needed at all; it stays off by default.

## 18. Sources

- [Republic Act 9593 accreditation: Palawan Daily News](https://palawandailynews.com/city-news/city-tourism-chief-asks-tourism-establishments-to-get-accredited), [DILG Calabarzon on permits only for accredited enterprises](https://calabarzon.dilg.gov.ph/dilg-to-lgus-issue-permit-to-operate-to-tourism-enterprises-with-dot-accreditation-only/) and [Occidental Mindoro tourism office list of primary enterprises](https://tourism.occidentalmindoro.gov.ph/?p=1116) (opened 15 November 2026)
- Tour booking software features used as a checklist: [Bókun](https://www.bokun.io/?p=570) (price categories), [Xola](https://www.xola.com/tour-management-software) (minimum and maximum per outing, cutoff times), [PHPTRAVELS tours](https://phptravels.com/features/tours) and [group tours](https://phptravels.com/features/group-tours) (departures, seats, cutoffs, minimum to run), [RentalTide](https://rentaltide.com/tour-departures) (minimum headcount before confirming) (opened 15 November 2026)
- The Anawangin Cove tour post, as text attached by Lex on 15 November 2026. The Facebook link itself could not be opened.
