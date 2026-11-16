# Database blueprint

Nov 14, 2026

This is the database plan for the first launch: 62 tables in 13 groups, built in three waves (48, 9 and 5 tables). It turns the 15-table sketch in the System blueprint into every table, column, rule and write path. Migrations are written from this page one group at a time.

## 1. What this page decides

Ten choices here go beyond the System blueprint. All ten were approved on 14 November 2026, together with the four additions in section 16 and the eight added after research, listed under the table.

| # | Choice | Why |
| --- | --- | --- |
| 1 | A booking or lease points to its row in `unit_occupancy`; it stores no dates of its own | One source of truth for dates, so the calendar and the booking can never disagree |
| 2 | The private link belongs to the conversation (`threads`), not the booking | One link type opens a booking, an inquiry or a lease |
| 3 | `customer_devices` is dropped | `push_subscriptions` already holds one row per device |
| 4 | `unit_rates` becomes three tables: stay terms, lease terms, weekday rates | Nightly and monthly renting have different columns; a weekend rate is just two weekday rows |
| 5 | "Due" and "overdue" are worked out from dates, never stored | A stored label goes stale; a date cannot |
| 6 | A hold with a proof waiting for review is extended to 72 hours | A guest who has paid must not lose the dates because the owner is slow |
| 7 | Reservation fee, advance and deposit are bills | One payment flow for everything a tenant pays |
| 8 | Rent due day is 1 to 28 | Every month has that day |
| 9 | The owner can record a cash payment | The balance on arrival is often paid in cash |
| 10 | Fourteen support tables are added | Plans, counters, idempotency keys, consents, a job log and others the sketch did not list |

**Added after research on 14 November 2026.** Desk research on Philippine hosts and landlords (Feature blueprint, section 2a) added these. They are decided.

| # | Added | Why |
| --- | --- | --- |
| 11 | `booking_guests` table and guest-list settings on `properties` | Condo buildings ask hosts for every guest's name and ID before arrival. Hosts collect them by hand in chat today |
| 12 | `saved_replies` table | Hosts answer the same questions many times a day. Airbnb gives hosts saved replies for this |
| 13 | `repair_requests` table, wave 2 | Repairs are a top tenant complaint and a top landlord task |
| 14 | Submeter readings on `bill_lines` | Utility charges are a common landlord–tenant dispute. Showing the readings and the rate settles most of them |
| 15 | `wallet_checked` on payments, `verified_at` on accounts, and rules for changing payment accounts | Fake GCash and bank screenshots, and fake booking pages, are common scams |
| 16 | Cancellation presets on `properties` | A policy written as free text cannot be worked out. With presets, the conversation can show the guest what they would get back |
| 17 | The platform Pixel tables move to wave 1 | The owner landing page and ads to owners start at launch |
| 18 | Thread links stored as a fingerprint | A leaked database no longer leaks working links |

The table count was 57 after these eight; the final round below makes it 61.

**Added on 14 November 2026, final round** (Feature blueprint, sections 7b to 7d). Decided.

| # | Added | Why |
| --- | --- | --- |
| 19 | Stamp cards replace points: `point_rules` becomes `stamp_cards`, `points_ledger` becomes `stamp_ledger`, and `rewards` and `reward_claims` are reshaped | Guests stay a few times a year; a short card of stays is reachable and owners see exactly what they give |
| 20 | `stay_reviews`, wave 1 | Guests rate a stay and are sent on to Google reviews; owners had no feedback loop |
| 21 | `data_exports`, wave 1 | A ZIP of bookings, payments and proofs before proofs are deleted at 30 days |
| 22 | `page_reports`, wave 1 | Fake staycation pages are a common scam; anyone can report a page to the super admin |
| 23 | `inspections`, wave 2 | Move-in and move-out checklists with photos settle deposit disputes |
| 24 | New columns on `properties`, `property_pages`, `payment_accounts`, `account_members`, `profiles`, `files`, `leases` and `inquiries`, and two platform settings | Each is described under its table |

The table count is now 62: 48 in wave 1 (with `meta_attribution`, added on 15 November 2026), 9 in wave 2 and 5 in wave 3.

## 2. Design rules

Every table follows these rules. The data dictionary below leaves out the four standard columns to stay readable.

**Standard columns.** `id uuid` primary key, filled by `gen_random_uuid()`. `account_id uuid not null`, pointing to `accounts`. `created_at timestamptz not null default now()`. `updated_at timestamptz` on tables whose rows change.

| Rule | In practice | Source |
| --- | --- | --- |
| Owner isolation | Every owner-owned table has `account_id`. A child also repeats it in its foreign key, as `(account_id, unit_id)` pointing to `units (account_id, id)`, so a row can never point into another owner's data | Our rule |
| Constraints first | A rule the database can check is a constraint: not null, check, unique, foreign key, exclusion | [PostgreSQL: Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html) |
| Text | `text` with a length check. No `varchar(n)`, no `char(n)` | [PostgreSQL wiki: Don't Do This](https://wiki.postgresql.org/wiki/Don%27t_Do_This) |
| Time | An instant is `timestamptz`. A stay day or due day is a `date` in Manila time. A range of days is a `daterange`, first day in, last day out | Same wiki; [Range Types](https://www.postgresql.org/docs/current/rangetypes.html) |
| Money | Whole centavos in `bigint`, named `*_centavos`. No float, no `money` type | [Numeric Types](https://www.postgresql.org/docs/current/datatype-numeric.html); same wiki |
| Closed lists | `text` with a `CHECK`, mirrored by one Zod enum. No Postgres enum types | Food app rule 5 |
| Names | Lower case with underscores; tables plural | Same wiki |
| Deleting | Rows with history are never deleted. Listings are archived with `archived_at`. Parents of money rows use `ON DELETE RESTRICT` | PostgreSQL: Constraints |
| Ledgers | Payments, stamps, events, consents and audit lines are append-only. A correction is a new row | Food app design rule |
| Snapshots | A booking or bill keeps its own lines and total. Later price edits never change it | System blueprint 7.4 |
| JSON | `jsonb` only for a document that changes as one piece: a page draft, an outbox payload, an audit detail | [JSON Types](https://www.postgresql.org/docs/current/datatype-json.html) |
| Third normal form | Nothing derivable is stored, except snapshots and a status kept in step by one SQL function | System blueprint 7.4 |
| Triggers | Two only: create a profile on sign-up, and set `updated_at`. No trigger carries a business rule | Food app rule 13 |
| Security in the same file | Row-level security, grants and policies sit in the migration that creates the table | Food app rule 8; [Supabase: hardening the Data API](https://supabase.com/docs/guides/database/hardening-data-api) |

## 3. The map

&#91;embedded content: table map · 13 groups, 3 build waves\]

Wave 1 is everything a guest needs to book a stay and pay, and everything you need to run it. Each wave is a set of migrations you approve before it is written.

| Group | Tables | Wave |
| --- | --- | --- |
| Platform | `profiles`, `platform_admins`, `accounts`, `account_members`, `plans`, `subscriptions`, `subscription_payments`, `feature_flags`, `account_features`, `account_counters`, `idempotency_keys`, `audit_logs`, job\_runs, data\_exports, page\_reports | 1 |
| Listing | `properties`, `property_pages`, `units`, `unit_stay_terms`, `unit_lease_terms`, `listing_photos`, `amenities`, `unit_amenities`, `house_rules`, `payment_accounts` | 1 |
| Price | `weekday_rates`, `rate_overrides`, `unit_fees` | 1 |
| Occupancy | `unit_occupancy` | 1 |
| Customers | `customers`, `customer_consents` | 1 |
| Short stay | `bookings`, `booking_lines`, `booking_events`, `booking_guests`, stay\_reviews | 1 |
| Money | `payments`, `payment_proofs` | 1 |
| Chat | `threads`, `messages`, `saved_replies` | 1 |
| Notify | `push_subscriptions`, `notifications_outbox` | 1 |
| Files | `files` | 1 |
| Long term | `inquiries`, `viewings`, `leases`, `lease_events`, `lease_deductions`, `bills`, `bill_lines`, `repair_requests`, inspections | 2 |
| Loyalty | `stamp_cards, stamp``_ledger`, `rewards`, `reward_claims` | 3 |
| Tracking | `meta_pixels`, `meta_event_switches`, `meta_attribution`, `meta_capi_deliveries`, `funnel_events` | 1 for the four Pixel tables; 3 for funnel events |

## 4. The core idea: one table claims dates

A hold, a booking, an owner's block and a lease are all rows in `unit_occupancy`, and the database refuses any two active rows that share a night on the same unit. No screen, API check or lock is trusted to do this.

&#91;embedded content: two guests, one unit · the second overlapping hold is refused\]

Both requests reach the database. The first insert is saved. The second fails with error code `23P01`, and the API turns that into the message "Those dates were just taken".

```sql
create extension if not exists btree_gist;

create table public.unit_occupancy (
  id            uuid primary key default gen_random_uuid(),
  account_id    uuid not null,
  unit_id       uuid not null,
  during        daterange not null,     -- [first night, checkout day + buffer)
  buffer_nights smallint not null default 0
                check (buffer_nights between 0 and 7),
  kind          text not null
                check (kind in ('hold','booking','block','lease')),
  active        boolean not null default true,
  expires_at    timestamptz,            -- holds only
  note          text check (char_length(note) <= 200),
  created_by    uuid references public.profiles (id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  released_at   timestamptz,
  foreign key (account_id, unit_id)
    references public.units (account_id, id) on delete restrict,
  check (not isempty(during) and lower(during) is not null
         and lower_inc(during) and not upper_inc(during)),
  check ((kind = 'hold') = (expires_at is not null)),
  check (active or released_at is not null),
  exclude using gist (unit_id with =, during with &&) where (active)
);
```

The `btree_gist` extension is what lets one constraint mix "same unit" with "overlapping dates" ([PostgreSQL: btree\_gist](https://www.postgresql.org/docs/current/btree-gist.html)).

| Situation | What happens to the row |
| --- | --- |
| Guest taps Reserve | A `hold` row is inserted with `expires_at` = now + the unit's hold minutes |
| The unit needs cleaning time | The range is stretched by `buffer_nights` past checkout, so the next guest cannot arrive inside it |
| Guest uploads a proof | `expires_at` moves to now + 72 hours, so the owner has time to review |
| Owner approves | The same row's `kind` changes to `booking` and `expires_at` is cleared |
| Owner rejects | `expires_at` is reset to now + the unit's hold minutes |
| Hold runs out | `active` becomes false and `released_at` is set. The dates are free |
| Booking is cancelled | Same as above. The row stays as history |
| Stay is completed | Nothing. Past rows stay active; they cannot clash with future dates |
| Dates are changed | `during` is updated on the same row. The constraint checks the new dates |
| Owner blocks dates | A `block` row with a note, for repairs or a booking taken elsewhere |
| Lease starts | A `lease` row. An open-ended lease has no end date |

**Expired holds are cleared in two places.** The booking function first releases stale holds on that unit, so an expired hold never blocks a new guest. A timed API job sweeps the rest every few minutes.

**Availability is one query.** A unit is free for a range when no active row overlaps it: `where unit_id = $1 and active and during && daterange($2, $3)`. The calendar reads the same rows.

**Only SQL functions write this table.** No role has insert, update or delete rights on it.

## 5. Booking core: listing, price, customers, stays, money, chat, files

&#91;embedded content: entity relationship diagram · booking core, 12 tables\]

*The diagram predates two tables added after research: `booking_guests` (many per booking) and `saved_replies` (many per owner account). Their columns are below.*

A booking is created only after its dates are claimed, and it keeps a pointer to that claim. Payments, price lines and the conversation all point to the booking.

Each table below lists its own columns. The standard columns from section 2 are left out.

### Listing

**`properties`** One place an owner rents out. Its slug is the web address.

| Column | Type | Rule |
| --- | --- | --- |
| `slug` | text | Unique across the platform. Lower-case letters, digits and hyphens, 3 to 60 |
| `name` | text | 1 to 80 |
| `tagline` | text | Optional, up to 80; set in the editor |
| `description` | text | Up to 4,000 |
| `address_line` | text | Street and building |
| `barangay` | text | Optional |
| `city`, `province`, `region` | text | Required. City is also sent to Meta |
| `country` | text | Default `PH` |
| `latitude`, `longitude` | numeric(9,6) | Optional; both or neither |
| `map_url` | text | Optional link to a map |
| `checkin_time`, `checkout_time` | time | Defaults 14:00 and 12:00 |
| `arrival_info` | text | How to get in: directions, door code, Wi-Fi. Shown only after a booking is confirmed |
| `cancellation_preset`, `cancellation_note` | text | Preset: `flexible`, `moderate`, `firm`, `dp_rebook`, `non_refundable` or `custom`. The note holds the owner's own words; it is required for `custom` |
| `privacy_contact` | text | Email shown on the privacy page |
| `logo_file_id` | uuid | Optional, to `files` |
| `status` | text | `draft`, `published`, `unpublished` |
| `published_at`, `archived_at` | timestamptz | Archived instead of deleted |
| `rebook_min_days`, `rebook_within_months` | smallint | For the `dp_rebook` preset. Defaults 7 and 6: a date change must be asked 7 days before check-in, for a new date within 6 months |
| `guest_ids_required` | boolean | True when the building asks for every guest's name and ID before arrival. Default false |
| `guest_list_due_hours` | smallint | How long before check-in the list must be in. 0 to 168, default 48 |

**Cancellation presets.** The app works out what the guest gets back and shows it in the conversation before they confirm a cancellation. The owner still sends any refund outside the app and records it.

| Preset | The guest gets back |
| --- | --- |
| `flexible` | Everything paid, if cancelled 1 day or more before check-in. Nothing after |
| `moderate` | Everything, if 5 days or more before. Half after that, until check-in |
| `firm` | Everything, if 30 days or more before. Half from 30 to 7 days before. Nothing in the last 7 days |
| `dp_rebook` | The down payment is kept, but the guest may move the dates once, within the limits in `rebook_min_days` and `rebook_within_months`. Anything paid above the down payment comes back. This is a common policy among Philippine staycation hosts |
| `non_refundable` | Nothing |
| `custom` | What the owner wrote in `cancellation_note`. The app shows it but works nothing out |

The names follow Airbnb's, but the rules are simplified. Under any preset, the owner can move a booking free of charge, for example when a storm signal stops travel.

`cancel_booking` works out the amount from the preset and saves it on the cancellation event, so the owner sees the same figure the guest saw. The guest list is unlocked by the owner through `submit_guest_list` with an unlock flag; there is no direct edit.

**`property_pages`** The page editor's draft and the version the public sees.

| Column | Type | Rule |
| --- | --- | --- |
| `property_id` | uuid | Primary key, to `properties` |
| `draft` | jsonb | One JSON checked by the shared `PropertyPageDraft` schema in `packages/core`; its keys are listed under this table |
| `published` | jsonb | A copy of the draft at the last publish; empty until then |
| `version` | integer | Counts up on each publish. The page, app icon, manifest and launch pictures carry it, so caches refresh after a publish |
| `draft_updated_at`, `published_at` | timestamptz |  |
| `published_by` | uuid | To `profiles` |

**Added 14 November 2026 with the page editor (Feature blueprint, section 7a); decided.**

- `draft_rev` integer, not null, default 0. Counts up on each draft save. A save that carries an older number is refused, so two tabs cannot overwrite each other. `version` now only counts publishes, and `publish_property_page` refuses a publish when someone published first.
- **Keys of `draft` and `published`** (shaped like the food app's `StorefrontContent`): `logo`, `tagline` (up to 80) and `about` (up to 600), which Publish copies to `properties`; `look` with `brandColor`, `pageColor`, `cardColor`, `logoShape` (circle or rounded), `fontPair` (8 pairs), `banners` (up to 3: photo, alt up to 120, title up to 40, line up to 90, one link), `bannerSeconds` (3 to 10, default 5), `announcement` (text up to 200, tone info, warning or success, end date) and `sections` (one show or hide switch per part); `install` (home-screen name up to 12, splash colour, splash animation, show name, show tagline); `hero` (cover and order of the first five photos); `host` (display name, photo file, languages); `units` (up to 4 featured unit ids); `highlights` (up to 6 amenity ids); `faq` (up to 10); `seo` (title up to 60, description up to 155, share picture file, hide from search). Light or dark is worked out from `pageColor`, so it is not stored.
- **Not stored here on purpose:** check-in and check-out times, house rules, prices, the cancellation preset, reply time and the Verified badge. The page reads them live from their own tables, so the page can never disagree with a booking.
- **On `properties`:** `old_slugs text[]` (wave 1; old addresses keep redirecting; a GIN index lets `change_slug` check them). The slug is changed only through `change_slug`, never by a direct edit. Settings-owned facts the page shows: `contact jsonb` (phone, Messenger, Facebook, Instagram, TikTok, Viber, WhatsApp, Google review link), `show_exact_location boolean` default false, `reply_hours jsonb` and `viewing_hours jsonb` (up to 4 ranges a day, none past midnight, the same rules as the food app's Hours). `custom_domain text unique` and `domain_verified_at timestamptz` arrive in wave 3.

**`units`** One bookable space: a whole place, a room or a bed.

| Column | Type | Rule |
| --- | --- | --- |
| `property_id` | uuid | To `properties` |
| `slug` | text | Unique within the property |
| `name` | text | 1 to 80 |
| `mode` | text | `short_stay` or `long_term`. Fixed once the unit has a booking or lease |
| `unit_type` | text | `entire_place`, `private_room`, `bed_space` |
| `description` | text | Up to 4,000 |
| `max_guests` | smallint | At least 1 |
| `bedrooms`, `beds` | smallint | Zero or more |
| `bathrooms` | numeric(3,1) | Allows 1.5 |
| `floor_area_sqm` | numeric(6,1) | Optional |
| `arrival_info` | text | Unit-specific arrival details. Shown only after a booking is confirmed |
| `sort_order` | integer | Order on the property page |
| `status` | text | `draft`, `listed`, `unlisted` |
| `archived_at` | timestamptz | Archived instead of deleted |

Keys: unique `(property_id, slug)`; unique `(account_id, id)` for owner-safe foreign keys; unique `(id, mode)` so a terms table can require the right mode.

**`unit_stay_terms`** Booking rules for a short-stay unit. One row per unit.

| Column | Type | Rule |
| --- | --- | --- |
| `unit_id` | uuid | Primary key. Its foreign key is `(unit_id, mode)` with `mode` fixed to `short_stay` |
| `base_nightly_centavos` | bigint | Above zero |
| `base_guests` | smallint | Guests covered by the nightly rate |
| `min_nights`, `max_nights` | smallint | Defaults 1 and 30 |
| `prep_nights` | smallint | 0 to 2. Nights kept empty after each stay for cleaning. Default 0 |
| `weekly_discount_percent` | smallint | 0 to 90. Applied to stays of 7 nights or more |
| `monthly_discount_percent` | smallint | 0 to 90. Applied to stays of 28 nights or more |
| `down_payment_percent` | smallint | 10 to 100. 100 means full payment |
| `hold_minutes` | integer | 15 to 1,440. Default 60 |
| `advance_notice_days` | smallint | Earliest check-in from today. Default 0 |
| `booking_window_days` | smallint | How far ahead dates open. Default 365 |

**`unit_lease_terms`** Renting terms for a long-term unit. One row per unit.

| Column | Type | Rule |
| --- | --- | --- |
| `unit_id` | uuid | Primary key. Foreign key `(unit_id, mode)` with `mode` fixed to `long_term` |
| `monthly_rent_centavos` | bigint | Above zero |
| `min_lease_months` | smallint | At least 1 |
| `advance_months`, `deposit_months` | smallint | Zero or more |
| `reservation_fee_centavos` | bigint | Zero or more |
| `available_from` | date | First day a tenant can move in |
| `inclusions` | text | What the rent covers |

**Rent Control Act check.** Under RA 9653, the landlord of a covered unit may ask for at most 1 month of advance rent and 2 months of deposit. The current extension runs to 31 December 2026 ([RentScout summary](https://rentscout.ph/blog/tenant-rights-philippines-rent-control-act-guide)). Coverage depends on the rent, so the form warns, but does not block, when `advance_months` is above 1 or `deposit_months` is above 2. The rent ceiling for coverage is a platform setting, because it changes with each extension.

**`listing_photos`** Photos of a property or a unit.

| Column | Type | Rule |
| --- | --- | --- |
| `property_id` | uuid | To `properties` |
| `unit_id` | uuid | Empty for a property-level photo |
| `file_id` | uuid | To `files` |
| `alt_text` | text | Up to 160, for screen readers |
| `sort_order` | integer | The first photo is the cover |

**`amenities`** and **`unit_amenities`** A shared list of amenities, and which unit has which.

| Column | Type | Rule |
| --- | --- | --- |
| `amenities.account_id` | uuid | Empty for the platform's list; set for an owner's own entry |
| `amenities.code` | text | Unique per list |
| `amenities.label`, `icon` | text | The icon is a Lucide name |
| `amenities.grp` | text | `essentials`, `comfort`, `kitchen`, `bathroom`, `safety`, `outdoor`, `other` |
| `amenities.sort_order`, `is_active` | integer, boolean |  |
| `unit_amenities.unit_id`, `amenity_id` | uuid | Together they are the primary key |

**`house_rules`** One rule per row, per property.

| Column | Type | Rule |
| --- | --- | --- |
| `property_id` | uuid | To `properties` |
| `body` | text | 1 to 200 |
| `sort_order` | integer |  |

**`payment_accounts`** Where customers send money: the owner's GCash, Maya or bank details.

| Column | Type | Rule |
| --- | --- | --- |
| `method` | text | `gcash`, `maya`, `bank` |
| `bank_name` | text | Required when the method is `bank` |
| `account_name`, `account_number` | text | Shown only after a hold is placed |
| `qr_file_id` | uuid | Optional QR image, to `files` |
| `instructions` | text | Optional, up to 300 |
| `is_active`, `sort_order` | boolean, integer |  |

**Added 14 November 2026:** `method` also allows `qr_ph`; `bank` (text) from a closed list (BDO, BPI, Metrobank, Landbank, PNB, Security Bank, UnionBank, RCBC, China Bank, EastWest, GoTyme, SeaBank, other bank), required for banks; at most 3 bank accounts and one of each other method per owner; `is_sample` (boolean) for demo details the owner must replace. At least one way to pay stays on.

**Changing where money goes.** A new or edited payment account is labelled "new" on the property page for 7 days. The owner also gets an email, the change appears in the activity list, and guests with an open booking see a status line in their conversation. Together these catch a stolen login that swaps in a different account number.

### Price

A night's price is the first match of three: a dated override, then a weekday rate, then the unit's base rate. Fees are added after the nights.

**`weekday_rates`** A different price for chosen days of the week. A weekend rate is two rows.

| Column | Type | Rule |
| --- | --- | --- |
| `unit_id` | uuid | To `units` |
| `iso_weekday` | smallint | 1 (Monday) to 7 (Sunday). The night's own day |
| `nightly_centavos` | bigint | Above zero |

Key: unique `(unit_id, iso_weekday)`.

**`rate_overrides`** A price for exact dates, such as a holiday.

| Column | Type | Rule |
| --- | --- | --- |
| `unit_id` | uuid | To `units` |
| `during` | daterange | First night in, last night out |
| `nightly_centavos` | bigint | Above zero |
| `label` | text | Optional, such as "Holy Week" |

Rule: an exclusion constraint stops two overrides on one unit from overlapping.

**`unit_fees`** Extra charges the owner sets.

| Column | Type | Rule |
| --- | --- | --- |
| `unit_id` | uuid | To `units` |
| `code` | text | `cleaning`, `extra_guest`, `other` |
| `label` | text | Shown on the price breakdown |
| `amount_centavos` | bigint | Zero or more |
| `basis` | text | `per_stay`, `per_night`, `per_extra_guest_per_night` |
| `is_active`, `sort_order` | boolean, integer |  |

### Customers

**`customers`** One row per person per owner account. A guest and a member are the same row; joining only fills `profile_id`.

| Column | Type | Rule |
| --- | --- | --- |
| `profile_id` | uuid | Empty for a guest. Set when the person joins with an email code |
| `full_name` | text | 1 to 80 |
| `email` | text | Required, stored in lower case |
| `mobile` | text | Required, digits with an optional leading plus |
| `status` | text | `active` or `blocked`. A blocked customer cannot place a hold |
| `owner_note` | text | Private to the owner, up to 500 |
| `anonymised_at` | timestamptz | Set when the person asks for deletion: name, email and mobile are blanked, bookings stay |

Keys: unique `(account_id, email)`; unique `(account_id, profile_id)` where a profile is set.

**`customer_consents`** Append-only record of every consent given or withdrawn.

| Column | Type | Rule |
| --- | --- | --- |
| `customer_id` | uuid | To `customers` |
| `kind` | text | `privacy_notice`, `marketing`, `ad_audience` |
| `granted` | boolean | False records a withdrawal |
| `source` | text | `booking_form`, `inquiry_form`, `account_page`, `owner_recorded` |
| `notice_version` | text | Which privacy text the person saw |

The current answer is the newest row per customer and kind.

### Short stay

**`bookings`** One stay. Its dates live in its occupancy row.

| Column | Type | Rule |
| --- | --- | --- |
| `property_id`, `unit_id` | uuid | To `properties` and `units` |
| `customer_id` | uuid | To `customers` |
| `occupancy_id` | uuid | Required and unique, to `unit_occupancy`. The source of the dates |
| `booking_no` | bigint | Counts up per owner with no gaps. Unique `(account_id, booking_no)` |
| `status` | text | `held`, `in_review`, `confirmed`, `checked_in`, `completed`, `cancelled`, `expired` |
| `source` | text | `direct` from the property app, or `manual` typed by the owner |
| `source_note` | text | For manual bookings, such as "walk-in" |
| `adults`, `children` | smallint | Adults at least 1. The sum cannot exceed the unit's `max_guests` |
| `nights` | smallint | Copied at booking time |
| `total_centavos` | bigint | The sum of the booking's lines |
| `required_centavos` | bigint | What must be approved to confirm: the down payment |
| `guest_note` | text | Optional request, up to 500 |
| `reward_claim_id` | uuid | Optional, to `reward_claims` (wave 3) |
| `confirmed_at`, `checked_in_at`, `checked_out_at`, `cancelled_at` | timestamptz | Set by the matching move |
| `cancelled_by` | text | `customer`, `owner`, `system` |
| `cancel_reason` | text | Up to 300 |
| `vehicle_plate` | text | Optional, up to 15. For building parking passes |
| `guest_list_submitted_at` | timestamptz | Set when the guest sends the list; the list is then locked unless the owner unlocks it |

The amount paid and the balance are not stored. They are the sum of approved payments.

**`booking_guests`** Everyone staying, for the building's guest registration. Used only when the property turns on `guest_ids_required`.

| Column | Type | Rule |
| --- | --- | --- |
| `booking_id` | uuid | To `bookings` |
| `full_name` | text | 1 to 80 |
| `is_minor` | boolean | A child without an ID |
| `id_file_id` | uuid | Optional, to `files`. Private, and deleted 7 days after checkout |
| `sort_order` | smallint | The booker is 0 |

A government ID image is sensitive personal information under the Data Privacy Act. It is asked for only when the building needs it, the form states why, and the image is deleted on schedule.

Check-in is the start of the occupancy range. Checkout is its end minus the buffer nights.

**`stay_reviews`** (wave 1) A guest's rating of a completed stay.

| Column | Type | Rule |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `account_id`, `booking_id`, `customer_id` | uuid | Owner-safe keys; unique `(booking_id)` |
| `stars` | smallint | 1 to 5 |
| `note` | text | Optional, up to 300 |
| `note_hidden` | boolean | The owner may hide the note from the property page. The stars always count, and nothing is ever edited |
| `created_at` | timestamptz | Allowed from checkout until 30 days after |

Only a completed stay can be rated, once, through the guest's private link. The property page shows the average and the latest notes once there are 3 ratings; after rating, the guest sees the owner's Google review link when one is set.

**`booking_lines`** The price a guest agreed to, line by line. Never edited after the hold.

| Column | Type | Rule |
| --- | --- | --- |
| `booking_id` | uuid | To `bookings` |
| `kind` | text | `night`, `fee`, `discount` |
| `label` | text | As shown to the guest |
| `stay_date` | date | The night, for `night` lines |
| `quantity` | smallint | At least 1 |
| `unit_centavos` | bigint | Price for one |
| `amount_centavos` | bigint | Quantity times price. Negative only for a discount |
| `sort_order` | integer |  |

**`booking_events`** Append-only history of a booking.

| Column | Type | Rule |
| --- | --- | --- |
| `booking_id` | uuid | To `bookings` |
| `type` | text | `created`, `proof_submitted`, `payment_approved`, `payment_rejected`, `confirmed`, `checked_in`, `completed`, `cancelled`, `expired`, `dates_changed`, `note` |
| `from_status`, `to_status` | text | Empty when the status did not change |
| `actor_kind` | text | `customer`, `owner`, `staff`, `system` |
| `actor_profile_id` | uuid | Empty for a guest or the system |
| `detail` | jsonb | Ids and amounts only, no personal data |

### Money

**`payments`** Every amount a customer says they paid, and every refund the owner records.

| Column | Type | Rule |
| --- | --- | --- |
| `customer_id` | uuid | To `customers` |
| `booking_id`, `bill_id` | uuid | Exactly one of the two is set |
| `kind` | text | `payment` or `refund`. A refund is recorded by the owner; the system moves no money |
| `amount_centavos` | bigint | Above zero |
| `method` | text | `gcash`, `maya`, `bank`, `cash`, `other` |
| `reference_no` | text | As the customer typed it. Required unless the method is `cash` or `other` |
| `reference_norm` | text | The reference in upper case with spaces and dashes removed. Uniqueness is checked on this, so `1234 5678` and `12345678` count as the same |
| `paid_on` | date | The day the customer says they paid |
| `status` | text | `submitted`, `approved`, `rejected`, `reversed` |
| `submitted_by` | text | `customer` or `owner` |
| `reviewed_by`, `reviewed_at` | uuid, timestamptz | Who decided and when |
| `reject_reason` | text | Required on a rejection, up to 300 |
| `receipt_no` | bigint | Given on approval, counting up per owner |
| `wallet_checked` | boolean | Must be true to approve a GCash, Maya or bank payment: the owner confirms they saw the money in their own app or bank history, not just the screenshot |

Keys: unique `(account_id, method, reference_norm)` while a payment is submitted or approved, so a reference works once per owner. Unique `(account_id, receipt_no)`.

**Room for tours (added 15 November 2026).** Write the "exactly one of the two" rule as `check (num_nonnulls(booking_id, bill_id) = 1)`. Tours in MVP B add `tour_booking_id` here, to `threads`, `stamp_ledger` and `reward_claims`, and 12 tables of their own; with this form the change to `payments` is one line. No tour table is created in MVP A. The full list is in section 9 of the Tours (MVP B) tab.

A payment row is never deleted and its amount never changes. Only its status moves, through one SQL function, and each move writes an event.

**`payment_proofs`** The screenshots attached to a payment.

| Column | Type | Rule |
| --- | --- | --- |
| `payment_id` | uuid | To `payments` |
| `file_id` | uuid | To `files` |
| `sort_order` | integer | At most 3 per payment, checked by the function |

### Chat

**`threads`** One conversation per booking, inquiry or lease. It holds the private link.

| Column | Type | Rule |
| --- | --- | --- |
| `customer_id` | uuid | To `customers` |
| `booking_id` | uuid | Set for a stay; unique |
| `inquiry_id`, `lease_id` | uuid | Set for a question or a rental. When an inquiry becomes a lease, the same thread gains the lease |
| `token_hash` | bytea | Unique. The SHA-256 fingerprint of a 43-character link token. The token itself is never stored: it is shown once when made, and a new link replaces the old one |
| `status` | text | `open` or `closed`. A closed thread can be read but not written to |
| `closed_at` | timestamptz | Set by the owner, or by a timed job 30 days after checkout or move-out |
| `last_message_at` | timestamptz | For sorting the inbox |
| `customer_read_at`, `owner_read_at` | timestamptz | For unread marks |

Rule: a thread belongs to a booking or to a rental, never both, and never neither.

**The link in the first email.** Because only the fingerprint is stored, the function that opens a thread returns the token once, and the API puts the full link into the email's outbox row encrypted with the API's key. The link is wiped from the row as soon as the email is sent, and a sent row keeps no link.

**`messages`** Append-only lines in a thread.

| Column | Type | Rule |
| --- | --- | --- |
| `thread_id` | uuid | To `threads` |
| `sender_kind` | text | `customer`, `owner`, `system` |
| `sender_profile_id` | uuid | Empty for a guest or the system |
| `kind` | text | `text`, `event` (a status line), `payment` (a proof card) |
| `body` | text | Up to 2,000 |
| `payment_id` | uuid | Set on a `payment` message |
| `file_id` | uuid | Optional photo |
| `hidden_at`, `hidden_by` | timestamptz, uuid | Set when the owner hides an abusive message. The text stays stored in case of a dispute |

**`saved_replies`** The owner's ready answers, added to a conversation with one tap.

| Column | Type | Rule |
| --- | --- | --- |
| `title` | text | 1 to 40 |
| `body` | text | Up to 2,000. May use `{guest_name}`, `{unit_name}`, `{checkin_date}`, `{checkout_date}` and `{balance}` |
| `sort_order` | integer |  |

The API fills in the placeholders before the message is saved, so a sent message never changes.

### Files

**`files`** One row per stored file. It is how storage is measured and how files are deleted on time.

| Column | Type | Rule |
| --- | --- | --- |
| `bucket` | text | `listing-media`, `payment-proofs`, `documents` |
| `path` | text | Unique. `<account>/<folder>/<uuid>.<ext>`, never renamed |
| `purpose` | text | `unit_photo`, `property_photo`, `logo`, `payment_qr`, `proof`, `subscription_proof`, `reward_image`, `message_photo` |
| `mime` | text | Checked by the API from the file's first bytes |
| `size_bytes` | bigint | Counts toward the owner's storage pool |
| `width`, `height` | integer | For images |
| `uploaded_by_kind` | text | `owner`, `customer`, `system` |
| `customer_id`, `uploaded_by_profile` | uuid | Who uploaded, when known |
| `status` | text | `pending` until the upload is confirmed, then `ready`, later `deleted` |
| `delete_after` | timestamptz | Set for proofs: 30 days after approval |
| `deleted_at` | timestamptz | When the stored file was removed |

**Added 14 November 2026:** `used_by_table` and `used_by_id` (what the file belongs to, so the storage meter is a sum and a clean-up knows what it removes) and `confirmed_at`. A file not confirmed within an hour is removed by the `clean_uploads` job.

## 6. Rentals: inquiries, leases and bills

&#91;embedded content: entity relationship diagram · rentals, 12 tables\]

*The diagram predates `repair_requests`, added after research: many per lease, each linked to the tenant's conversation. Its columns are below.*

Rentals reuse the booking core. A tenant is a customer, a lease claims the unit in the same occupancy table, and rent is paid through the same payments table.

**`inquiries`** A question about any unit, before booking or renting. It opens the thread.

| Column | Type | Rule |
| --- | --- | --- |
| `property_id`, `unit_id`, `customer_id` | uuid | To their tables |
| `inquiry_no` | bigint | Counts up per owner |
| `message` | text | Up to 1,000 |
| `move_in_on` | date | Optional |
| `occupants` | smallint | Optional |
| `status` | text | `new`, `viewing`, `reserved`, `converted`, `closed` |
| `closed_reason` | text | Up to 300 |

**Added 14 November 2026 (wave 2):** application details for rentals, all optional: `occupants` (1 to 20), `move_in_on`, `occupation` (up to 80), `pets` (boolean) and `about` (up to 300). No ID images are kept.

**`viewings`** A visit time asked for by the customer and decided by the owner.

| Column | Type | Rule |
| --- | --- | --- |
| `inquiry_id` | uuid | To `inquiries` |
| `starts_at` | timestamptz | The proposed time |
| `status` | text | `requested`, `confirmed`, `done`, `no_show`, `cancelled` |
| `note` | text | Up to 300 |
| `decided_by`, `decided_at` | uuid, timestamptz | The owner's decision |

**`leases`** One tenant renting one unit. Its dates live in its occupancy row.

| Column | Type | Rule |
| --- | --- | --- |
| `property_id`, `unit_id`, `customer_id` | uuid | To their tables |
| `inquiry_id` | uuid | Optional. Empty when the owner adds an existing tenant |
| `occupancy_id` | uuid | Required and unique, to `unit_occupancy` |
| `lease_no` | bigint | Counts up per owner |
| `status` | text | `reserved`, `active`, `ended`, `cancelled` |
| `occupants` | smallint | People living in the unit. At least 1 |
| `monthly_rent_centavos` | bigint | Copied from the unit's terms, then owned by the lease |
| `due_day` | smallint | 1 to 28. Defaults to the move-in day, capped at 28 |
| `advance_months` | smallint | Months of rent paid at move-in |
| `deposit_centavos` | bigint | The deposit held |
| `reservation_fee_centavos` | bigint | Zero or more |
| `first_rent_due_on` | date | The first monthly bill, after the advance months |
| `notes` | text | Up to 1,000 |
| `activated_at` | timestamptz | When move-in was recorded |
| `ended_on` | date | The actual move-out day |
| `end_reason` | text | Up to 300 |
| `deposit_returned_centavos` | bigint | Recorded at move-out. Cannot exceed the deposit |

**Added 14 November 2026 (wave 2):** `late_fee` (centavos, optional), `late_fee_after_days` (1 to 15, default 5) and `renew_reminder_days` (default 60). The `add_late_fees` job adds the fee as a bill line once; the owner can remove it. A rent increase on renewal warns when it is above the platform's `rent_increase_cap` for a covered unit (for 2026: 1 % for units at ₱10,000 a month or less with the same tenant); like the deposit warning, it never blocks.

**`lease_deductions`** What was taken from the deposit, one line each.

| Column | Type | Rule |
| --- | --- | --- |
| `lease_id` | uuid | To `leases` |
| `label` | text | Such as "Unpaid electricity" |
| `amount_centavos` | bigint | Above zero |
| `sort_order` | integer |  |

**`lease_events`** Append-only history of a lease and its bills. Same columns as `booking_events`, with `lease_id` and an optional `bill_id`.

**`bills`** Something the tenant owes: a reservation fee, the move-in amount, or a month's rent.

| Column | Type | Rule |
| --- | --- | --- |
| `lease_id` | uuid | To `leases` |
| `bill_no` | bigint | Counts up per owner |
| `kind` | text | `reservation`, `move_in`, `rent`, `other` |
| `period_start`, `period_end` | date | Required for rent. First day in, last day out |
| `due_on` | date | The day payment is expected |
| `status` | text | `issued`, `in_review`, `paid`, `void` |
| `total_centavos` | bigint | The sum of the bill's lines |
| `issued_at`, `paid_at` | timestamptz |  |
| `void_reason` | text | Required when voided |

Key: unique `(lease_id, period_start)` for rent bills. Running the monthly job twice can never make two bills for one month.

"Overdue" is not a status. A bill is overdue when it is still `issued` and today is past `due_on`.

**`bill_lines`** The bill, line by line. The owner can add lines until the bill is paid.

| Column | Type | Rule |
| --- | --- | --- |
| `bill_id` | uuid | To `bills` |
| `kind` | text | `rent`, `advance`, `deposit`, `reservation`, `water`, `electricity`, `internet`, `penalty`, `other`, `credit` |
| `label` | text | As shown to the tenant |
| `amount_centavos` | bigint | Negative only for a credit |
| `sort_order` | integer |  |
| `meter_start`, `meter_end` | numeric(12,2) | Optional submeter readings for `water` or `electricity`. End is not below start |
| `unit_rate_centavos` | bigint | Price per kWh or cubic metre. When the three are set, the amount must equal (end − start) × rate, rounded |

**How money flows through a lease**

1. **Reservation.** A lease is created as `reserved` with a hold on the unit and a `reservation` bill.
2. **Move-in.** The owner activates the lease. A `move_in` bill charges the advance and the deposit.
3. **Monthly rent.** From `first_rent_due_on`, a timed job issues one `rent` bill per month, seven days before it is due.
4. **Move-out.** The owner records the end date, the deductions and the deposit returned. The occupancy row is cut to the end date, which frees the unit.

**`repair_requests`** (wave 2) A tenant's report of something broken.

| Column | Type | Rule |
| --- | --- | --- |
| `lease_id` | uuid | To `leases` |
| `thread_id` | uuid | To `threads`. The request shows as a card in the tenant's conversation |
| `title` | text | 1 to 80 |
| `details` | text | Up to 1,000 |
| `photo_file_id` | uuid | Optional, to `files` |
| `status` | text | `open`, `in_progress`, `done`, `closed` |
| `done_at`, `closed_at` | timestamptz |  |
| `cost_note` | text | Optional. If the tenant must pay, the owner adds a bill line |

**`inspections`** (wave 2) The move-in and move-out checklist of a lease.

| Column | Type | Rule |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `account_id`, `lease_id` | uuid | Owner-safe keys; unique `(lease_id, kind)` |
| `kind` | text | `move_in` or `move_out` |
| `items` | jsonb | Up to 40 rows: area, condition (`good`, `fair`, `damaged`), a note up to 200 and up to 3 photo file ids |
| `tenant_ack_at` | timestamptz | When the tenant confirmed it in their own page |
| `done_at`, `done_by` |  |  |

The move-out list is shown beside the move-in list, and a deduction can point to the item it is for.

Not in the first launch: splitting a month by days. The owner adds a line or a credit by hand.

## 7. Platform: accounts, plans and safety tables

&#91;embedded content: entity relationship diagram · platform, 12 tables\]

A person signs in once and can belong to one or more owner accounts. What they may do comes from `account_members`, never from the web address or the request.

**`profiles`** One row per signed-in person, created by a trigger when Supabase Auth creates the user.

| Column | Type | Rule |
| --- | --- | --- |
| `id` | uuid | Primary key, the same id as the Auth user |
| `full_name` | text | 1 to 80 |

**Added 14 November 2026:** `avatar` (jsonb): a face, a made picture, initials or a photo file, checked by kind. Light, dark or system look is kept on the device, not here.

**`platform_admins`** Who may open super admin. No app role can read or write this table.

| Column | Type | Rule |
| --- | --- | --- |
| `profile_id` | uuid | Primary key, to `profiles` |
| `created_by` | uuid | Who granted it |

**`accounts`** The owner account: the paying client.

| Column | Type | Rule |
| --- | --- | --- |
| `name` | text | Business or owner name, 1 to 80 |
| `status` | text | `pending`, `active`, `suspended`, `closed` |
| `is_demo` | boolean | True for demo properties. A CI check stops demo data from reaching live |
| `contact_email`, `contact_mobile` | text | For us to reach the owner |
| `notify_email` | text | Where booking alerts go. Defaults to the contact email |
| `timezone` | text | `Asia/Manila`. Stored so a later market needs no schema change |
| `currency` | text | `PHP`, for the same reason |
| `approved_at`, `approved_by` | timestamptz, uuid | Set in super admin |
| `verified_at`, `verified_by` | timestamptz, uuid | Set by the super admin after checking the owner's identity and their right to rent the place. Shows the Verified owner badge |
| `verification_note` | text | Up to 300. What was checked, such as "ID and condo admin letter seen on video call". No ID image is stored |

**`account_members`** Links a profile to an owner account.

| Column | Type | Rule |
| --- | --- | --- |
| `profile_id` | uuid | To `profiles` |
| `role` | text | `owner` or `staff`. Staff sign-ins arrive later; the column is ready |
| `status` | text | `active` or `removed` |

**Added 14 November 2026:** `notify` (jsonb): switches for new booking, payment to check, storage at 80 % and full, and plan due, plus a `send_to` email that may be a shared inbox.

Key: unique `(account_id, profile_id)`.

**Staff in wave 2.** A member with `role = 'staff'` (shown as "caretaker") can read the account, run check-in and checkout, block dates, chat, use saved replies and handle guest lists. The money functions, and edits to prices, payment accounts and the team, refuse staff. The API checks the role first and each function checks it again.

**`plans`** What we sell. Changing a price is a new row, not a code change.

| Column | Type | Rule |
| --- | --- | --- |
| `code` | text | Unique, such as `standard` |
| `name` | text | Shown to owners |
| `price_centavos` | bigint | 59900 at launch |
| `included_units` | integer | 5 at launch |
| `extra_unit_centavos` | bigint | 10000 at launch |
| `storage_bytes` | bigint | 2 GB at launch |
| `trial_days` | integer | 14 at launch |
| `is_active` | boolean | Old plans are switched off, not deleted |

**`subscriptions`** One per owner account.

| Column | Type | Rule |
| --- | --- | --- |
| `account_id` | uuid | Unique |
| `plan_id` | uuid | To `plans` |
| `status` | text | `trial`, `active`, `paused`, `cancelled` |
| `trial_ends_on` | date | Set at approval |
| `paid_through` | date | The last day covered by approved payments |
| `extra_units` | integer | Units above the plan's included number |
| `paused_at` | timestamptz |  |

"Due" and "overdue" are worked out: due from 7 days before `paid_through`, overdue after it. A timed job pauses the account once the 7-day grace ends.

**`subscription_payments`** An owner's plan payment, with proof, approved in super admin.

| Column | Type | Rule |
| --- | --- | --- |
| `subscription_id` | uuid | To `subscriptions` |
| `months` | smallint | 1, 3 or 6 |
| `amount_centavos` | bigint | Above zero |
| `method` | text | `gcash`, `maya`, `bank` |
| `reference_no` | text | Unique per method unless rejected |
| `proof_file_id` | uuid | To `files` |
| `status` | text | `submitted`, `approved`, `rejected` |
| `reviewed_by`, `reviewed_at`, `reject_reason` | uuid, timestamptz, text |  |
| `covers_from`, `covers_to` | date | Set on approval |

**`feature_flags`** and **`account_features`** The list of switches, and which owner has which on.

| Column | Type | Rule |
| --- | --- | --- |
| `feature_flags.key` | text | Primary key, such as `loyalty` or `calendar_sync` |
| `feature_flags.description` | text |  |
| `feature_flags.default_enabled` | boolean | Used when an owner has no row |
| `account_features.flag_key` | text | To `feature_flags`. Primary key with `account_id` |
| `account_features.enabled` | boolean |  |
| `account_features.set_by`, `set_at` | uuid, timestamptz |  |

**`account_counters`** The last number given, per owner and kind. Numbers have no gaps because the row is updated inside the same transaction that uses the number.

| Column | Type | Rule |
| --- | --- | --- |
| `kind` | text | `booking`, `inquiry`, `lease`, `bill`, `receipt`. Primary key with `account_id` |
| `last_value` | bigint | Starts at 0 |

**`idempotency_keys`** Remembers a request so a repeat returns the first answer.

| Column | Type | Rule |
| --- | --- | --- |
| `scope` | text | The action, such as `booking.create` |
| `key` | text | Sent by the phone. Unique with `scope` |
| `account_id` | uuid | Optional |
| `request_hash` | text | The same key with a different request is refused |
| `response_status`, `response_body` | smallint, jsonb | Returned on a repeat |
| `expires_at` | timestamptz | Removed by a timed job after 48 hours |

**`audit_logs`** Append-only record of owner, staff and super admin actions.

| Column | Type | Rule |
| --- | --- | --- |
| `account_id` | uuid | Empty for a platform action |
| `actor_kind` | text | `owner`, `staff`, `super_admin`, `customer`, `system` |
| `actor_profile_id` | uuid | Optional |
| `action` | text | Such as `payment.approve` |
| `entity_table`, `entity_id` | text, uuid | What was acted on |
| `detail` | jsonb | Ids and old and new values. No names, emails, phones or tokens |

**`data_exports`** (wave 1) A ZIP the owner asked for in Settings › Storage.

| Column | Type | Rule |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `account_id` | uuid | Owner |
| `range` | text | `this_month`, `last_month` or `everything` |
| `parts` | text\[\] | `bookings`, `payments`, `proofs` |
| `status` | text | `preparing`, `ready`, `failed`, `expired` |
| `file_id` | uuid | The private ZIP in `files` |
| `expires_at` | timestamptz | 24 hours after it is ready |
| `created_by`, `created_at` |  |  |

One export can be preparing per owner. Spreadsheets are CSV with a byte-order mark, and any cell starting with `=`, `+`, `-` or `@` gets a leading apostrophe so it never runs as a formula.

**`page_reports`** (wave 1) A report that a property page may be fake or unsafe.

| Column | Type | Rule |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `property_id` | uuid | The page reported |
| `reason` | text | `fake_page`, `wrong_payment_account`, `scam_attempt` or `other` |
| `details` | text | Up to 500 |
| `reporter_email` | text | Optional |
| `status` | text | `new`, `reviewing`, `closed` |
| `created_at`, `closed_at`, `closed_by` |  |  |

Public, through the API only, at most 3 reports an hour per device. The owner does not see reports; the super admin works them from `/admin/owners`.

## 8. Rewards, notices and tracking

&#91;embedded content: entity relationship diagram · rewards, notices and tracking, 12 tables\]

These three areas share one habit: nothing is trusted to happen once. Stamps are added by ledger lines, notices wait in a queue, and each Meta event has one delivery row.

### Notify (wave 1)

**`push_subscriptions`** One row per device that asked for notifications.

| Column | Type | Rule |
| --- | --- | --- |
| `audience` | text | `customer` or `owner` |
| `customer_id`, `profile_id` | uuid | One of them, matching the audience |
| `property_id` | uuid | For a customer: the property they subscribed on |
| `endpoint` | text | Unique. The browser's push address |
| `p256dh`, `auth_key` | text | Keys from the browser, needed to send |
| `last_success_at` | timestamptz |  |
| `revoked_at` | timestamptz | Set when the push service says the device is gone |

**`notifications_outbox`** Every push and email waits here until it is sent.

| Column | Type | Rule |
| --- | --- | --- |
| `account_id` | uuid | Empty for platform notices |
| `channel` | text | `push` or `email` |
| `template` | text | Such as `booking.confirmed` |
| `customer_id`, `profile_id`, `to_email` | uuid, uuid, text | Who it is for |
| `payload` | jsonb | Ids and a link. A push never carries a name, amount or address |
| `dedupe_key` | text | Unique, built from the event, such as `booking.confirmed:<booking id>:customer` |
| `status` | text | `pending`, `sending`, `sent`, `failed`, `dead` |
| `attempts` | smallint |  |
| `next_attempt_at` | timestamptz | Each retry waits longer |
| `last_error`, `sent_at` | text, timestamptz |  |

A row is written in the same transaction as the booking or payment it announces, so a notice can never exist without its event, or the other way round ([transactional outbox](https://microservices.io/patterns/data/transactional-outbox.html)).

### Loyalty: stamp and point cards (wave 3)

Decided on 14 November 2026 (Feature blueprint, section 7c): **each card runs in stamps mode or points mode.** Each property can run two cards, one for stays and one for tenants. Stamps count visits and are the recommended default for staycations; points count pesos and suit varied spending. The table names stay as they are for both modes.

**`stamp_cards`** One card per property and audience.

| Column | Type | Rule |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `account_id`, `property_id` | uuid | Owner-safe keys; unique `(property_id, audience)` |
| `audience` | text | `stays` or `tenants` |
| `status` | text | `off`, `on` or `paused`; default `off` |
| `mode` | text | `stamps` or `points`; default `stamps`. Set when the card is first turned on; locked once the card has any `earned` or `welcome` line |
| `paused_until` | date | Optional. A paused card turns on again by itself on this Manila date |
| `goal` | smallint | Stamps mode: stamps to fill the card, 2 to 12. Default 3 for stays, 6 for tenants |
| `min_total` | integer | Optional, centavos. A stay below it earns no stamp. Stays only |
| `extra_stamp_nights` | smallint | Optional, 2 to 14. A long stay earns 1 more stamp for each full block of this many nights, at most 3 stamps per stay. Stays only |
| `cap_per_month` | smallint | Optional. Most stamps (1 to 10) or points (1 to 5,000) one guest earns in a Manila month |
| `points_per_100` | smallint | Points mode: 1 to 20 points for each full ₱100 of a completed, fully paid stay or an on-time bill |
| `welcome_points` | smallint | Points mode: 0 to 500 points on joining while the card is on |
| `points_expire_months` | smallint | Points mode, optional, 6 to 36: a member's points expire after this many months with no new points |
| `welcome_stamp` | boolean | Stamps mode: 1 stamp on joining while the card is on. Default false |
| `member_perk` | jsonb | Optional, checked by schema: `percent_off` (1 to 20), `amount_off` (centavos) or `perk` (text up to 60). Shown and applied on every booking by a member |
| `reward_valid_months` | smallint | Optional, 1 to 24. A ready reward must be used within this many months; empty means no end |
| `updated_at`, `updated_by` |  |  |

**`rewards`** Stamps mode: up to 3 milestones on a card. Points mode: up to 10 rewards, each with a point cost.

| Column | Type | Rule |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `account_id`, `card_id` | uuid | Owner-safe keys |
| `at_stamps` | smallint | Stamps mode only: 1 up to the card's goal; unique `(card_id, at_stamps)`; one reward always sits at the goal |
| `cost_points` | integer | Points mode only: 10 to 100,000 points to claim it. Exactly one of `at_stamps` and `cost_points` is set, matching the card's mode |
| `kind` | text | `amount_off`, `percent_off`, `free_night` (stays only), `perk` or `prize` (a custom prize the owner describes in `title` and `details`) |
| `amount` | integer | Centavos, for `amount_off` |
| `percent` | smallint | 1 to 50, for `percent_off` |
| `value_cap` | integer | Optional centavos cap for `percent_off` and `free_night` (a free night takes off the cheapest night of the stay, up to this) |
| `title`, `details` | text | Up to 60 and 200, such as "Late check-out until 2 PM" |
| `pieces_total` | integer | Optional; empty means unlimited. Never set below the claims holding a piece |
| `one_per_customer` | boolean | Default false |
| `status` | text | `active` or `archived` |

**`stamp_ledger`** Append-only. A balance is the sum of a customer's lines on a card, counted in stamps or points by the card's mode.

| Column | Type | Rule |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `account_id`, `card_id`, `customer_id` | uuid | Owner-safe keys |
| `kind` | text | `welcome`, `earned`, `used`, `returned`, `reversed`, `given`, `removed`, `undone`, `expired` |
| `delta` | integer | Plus or minus |
| `booking_id`, `bill_id`, `claim_id` | uuid | Where it came from |
| `reason` | text | For `given` and `removed`: `counter`, `correction`, `goodwill` or `other` |
| `note` | text | Private, up to 200 |
| `created_by`, `created_at` |  |  |

Keys: one `earned` line per booking and per bill; one `welcome` line per customer and card. Pending stamps are worked out from confirmed stays still to come, never stored.

**`reward_claims`** A reward a member has reached.

| Column | Type | Rule |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `account_id`, `reward_id`, `customer_id` | uuid | Owner-safe keys |
| `code` | text | 6 characters without 0, O, 1, I or L; unique per owner; shown with a QR |
| `status` | text | `ready`, `used`, `given`, `cancelled`, `expired` |
| `expires_at` | timestamptz | From `reward_valid_months`, else empty |
| `used_on_booking_id`, `used_on_bill_id` | uuid | Where a discount was taken off |
| `cancel_reason` | text |  |
| `created_at`, `used_at` | timestamptz |  |

**How a card works**

1. **Stays:** stamps or points are earned when `complete_booking` (or the `complete_stays` job) completes a fully paid stay; in points mode the stay earns `points_per_100` for each full ₱100 of its paid total. Before that they show as pending. A stay cancelled or refunded afterwards takes them back as `reversed`.
2. **Tenants:** one stamp, or the points for its amount, for each bill paid in full by its due date, at the moment the payment is approved. A late bill earns none.
3. Stamps mode: reaching a milestone creates a claim; reaching the goal also takes the goal's stamps off as `used`, and the card starts again; extra stamps carry over. Points mode: the member picks a reward and `redeem_reward` takes its cost off as `used` at once; it needs enough points, and a cancelled claim returns them.
4. A discount is used by switching it on when reserving (or on the next bill for tenants): `quote_stay` takes it off, and the claim becomes `used` when the booking is confirmed. If that booking is cancelled before the stay, the claim is `ready` again. A perk or prize is marked `given` by the owner at check-in.
5. **Paused:** no new stamps and no welcome stamp; stamps and ready rewards stay usable. `paused_until` turns it on again by itself. **Off:** the card is hidden from guests; balances and ready rewards are kept and still honoured.
6. **Limited pieces:** a claim holds a piece; a cancelled claim gives the piece and the stamps back. When none are left the milestone says "All claimed", the guest keeps the stamps, and the card does not start again until the owner adds pieces or changes the reward.
7. **Public counts are worked out, never typed:** "Only 20", then "5 left" at 20 % or less, then "All 20 claimed". The stays card, its rewards and the pieces left show on the property page, and the member count shows from 5 members. Names are never shown. The tenant card shows only in a tenant's own pages.
8. A change to the goal or a milestone shows its effect first (how many rewards become ready, how many members would need more stamps). Ready claims are never taken back.
9. Manual changes: plus or minus 1 stamp, or up to 100 points, with a reason and a private note, at most 3 changes per guest per Manila day, Undo for 10 seconds (the server accepts 15). The owner's own email never earns.
10. **Points expiry:** with `points_expire_months` set, the `expire_points` job writes one `expired` line for the whole balance of a member with no new points in that time, after a reminder 14 days before.

Views: `v_customer_stamps` (balance, pending and ready claims per card) and `v_reward_stock` (pieces left).

### Tracking (Pixel tables in wave 1, funnel events in wave 3)

**Who the Pixel is for.** At launch there is one Pixel, owned by Smart App PH and run by the super admin. It sits only on our own pages for owners (the landing page, sign-up and setup) and helps our ads reach staycation and rental owners. Owners do not get their own Pixel at launch. The `scope` column already allows one later, so that feature needs no new table.

Decided on 15 November 2026; the full plan, with the research and the RSVP code review, is in Meta Pixel, CAPI and super admin.

**`meta_pixels`** The platform Pixel's settings. The token is not stored here.

| Column | Type | Rule |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `scope` | text | `platform` only at launch; `account` and `property` added later for owner Pixels |
| `account_id`, `property_id` | uuid | Null for the platform Pixel |
| `pixel_id` | text | Digits only, 10 to 20 |
| `status` | text | `off`, `test` or `live`; default `off` |
| `test_event_code` | text | Required when `test`, cleared when `live` |
| `api_version` | text | Default `v27.0` |
| `updated_at`, `updated_by` |  |  |

**`meta_event_switches`** Each event on or off, per pixel.

| Column | Type | Rule |
| --- | --- | --- |
| `pixel_ref`, `event_name` | uuid, text | Primary key. `PageView`, `ViewContent`, `CompleteRegistration` (sign-up done), `StartTrial` (account approved), `Purchase` (first plan payment approved) |
| `browser_enabled` | boolean | Default false. Always false for `StartTrial` and `Purchase` |
| `server_enabled` | boolean | Default false. Always false for `PageView` and `ViewContent` |

**`meta_capi_deliveries`** The queue and the log of server events. A row is written in the same transaction as the sign-up or approval it reports.

| Column | Type | Rule |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `pixel_ref` | uuid | To `meta_pixels` |
| `event_name`, `event_id` | text | Unique `(pixel_ref, event_name, event_id)`; the id is built from a database id, such as `Purchase:<subscription payment id>` |
| `account_id` | uuid | The owner it is about |
| `entity_type`, `entity_id` | text, uuid | `accounts` or `subscription_payments` |
| `event_time` | timestamptz | When it happened; never changes on retry. For Purchase: paid\_at if within the last 6 days 20 hours, otherwise the earliest time Meta accepts, with time\_clamped set |
| `payload` | jsonb | The event as sent, customer data already hashed |
| `is_test` | boolean | Sent with the test code |
| `status` | text | `pending`, `sending`, `sent`, `failed`, `expired` (older than 6 days 20 hours) |
| `attempts`, `next_attempt_at` | smallint, timestamptz |  |
| `claim_token`, `claimed_at` | uuid, timestamptz | A claim older than 5 minutes may be taken over |
| `http_status`, `events_received`, `fbtrace_id`, `last_error` |  |  |
| `created_at`, `sent_at` | timestamptz |  |
| `triggered_by` | text | `owner`, `super_admin` or `job`. A super admin's request never supplies IP, browser or cookies; they come only from `meta_attribution` |
| `action_source`, `time_clamped` | text, boolean | `website` for `CompleteRegistration`; `other` for `StartTrial` and `Purchase`, which are approved by hand |

**`meta_attribution`** What links an owner to an ad click. One row per account; click data kept 90 days.

| Column | Type | Rule |
| --- | --- | --- |
| `account_id` | uuid | Primary key |
| `ads_consent`, `consent_at` | boolean, timestamptz | The choice on the consent bar. Without consent no server event is queued for this owner |
| `fbp`, `fbc` | text | From the cookies, or `fbc` built from `fbclid`; up to 256 each |
| `client_ip`, `user_agent` | inet, text | From the sign-up request |
| `captured_at`, `refreshed_at` | timestamptz |  |

The `clear_meta_attribution` job empties `fbp`, `fbc`, `client_ip` and `user_agent` after 90 days, and strips them from delivery payloads.

**`funnel_events`** Anonymous steps for the booking funnel. Deleted after 90 days.

| Column | Type | Rule |
| --- | --- | --- |
| `id` | bigint | An identity column, since this table grows fastest |
| `property_id`, `unit_id` | uuid | Unit is optional |
| `session_id` | text | Random per visit. Not tied to a person |
| `event` | text | `property_view`, `unit_view`, `quote`, `checkout_start`, `hold`, `inquiry`, `proof_submitted`, `confirmed` |
| `occurred_at` | timestamptz |  |

## 9. Life cycles

Four records have a status, and each status can change only in the ways drawn here. The list of allowed moves lives once in `packages/core`; the database checks the status values, and the SQL functions refuse any other move.

&#91;embedded content: life cycles · booking, payment, lease and bill\]

**Booking**

| From | To | When | Who | What else happens |
| --- | --- | --- | --- | --- |
| (new) | `held` | Guest taps Reserve | Customer | Occupancy hold, price lines, thread, notices |
| (new) | `confirmed` | Owner types a manual booking | Owner | Occupancy booking |
| `held` | `in_review` | A proof is submitted | Customer | Hold extended to 72 hours |
| `in_review` | `confirmed` | Approved payments reach `required_centavos` | Owner | Hold becomes a booking; receipt; notices |
| `in_review` | `held` | The proof is rejected | Owner | Hold clock restarts |
| `held`, `in_review` | `expired` | The hold runs out | System | Dates freed |
| `held`, `in_review`, `confirmed` | `cancelled` | Either side cancels | Customer or owner | Dates freed; any refund is recorded by the owner |
| `confirmed` | `checked_in` | Arrival is recorded | Owner |  |
| `confirmed`, `checked_in` | `completed` | Checkout is recorded, or the day after checkout passes | Owner or system | Stamps are earned; a rating is asked for |

**Payment**

| From | To | When | Who | What else happens |
| --- | --- | --- | --- | --- |
| (new) | `submitted` | A proof is uploaded | Customer | Booking or bill moves to `in_review` |
| (new) | `approved` | The owner records cash | Owner | Receipt number |
| `submitted` | `approved` | The owner confirms the money arrived | Owner | Receipt number; notices; a tenant stamp when a bill is paid on time |
| `submitted` | `rejected` | The owner cannot find the money | Owner | A reason is required; the reference can be used again |
| `approved` | `reversed` | An approval was a mistake | Owner | A reason is required; stamps from it are reversed; the booking or bill is recalculated |

**Lease**

| From | To | When | Who | What else happens |
| --- | --- | --- | --- | --- |
| (new) | `reserved` | A reservation is started | Customer or owner | Occupancy hold; reservation bill |
| (new) | `active` | The owner adds an existing tenant | Owner | Occupancy lease |
| `reserved` | `active` | Move-in is recorded | Owner | Move-in bill; monthly bills begin |
| `reserved` | `cancelled` | The hold runs out or either side cancels | Either or system | Unit freed |
| `active` | `ended` | Move-out is recorded | Owner | Occupancy cut to the end date; deductions listed |

**Bill**

| From | To | When | Who | What else happens |
| --- | --- | --- | --- | --- |
| (new) | `issued` | The monthly job runs, or the owner makes a bill | System or owner | Notice to the tenant |
| `issued` | `in_review` | A proof is submitted | Customer |  |
| `in_review` | `paid` | Approved payments reach the bill total | Owner | Receipt; a tenant stamp when paid on time; notices |
| `in_review` | `issued` | The proof is rejected, or only part was approved | Owner | The balance stays due |
| `issued` | `void` | The bill was a mistake | Owner | A reason is required |

**Subscription.** `trial` to `active` when the first plan payment is approved. `active` to `paused` when the grace period ends. `paused` to `active` when a payment is approved. Any state to `cancelled` by the owner's request.

## 10. Data flows, level 2

The System blueprint draws the whole system at level 1. These two diagrams open the three processes that carry money and dates. Each sub-process becomes one SQL function in section 11.

&#91;embedded content: level 2 data flow · processes 3 and 4, booking and payment\]

Steps 3.2 and 3.3 are one transaction, so a booking cannot exist without its dates. Steps 4.3 to 4.5 are one transaction, so an approval, the confirmed booking, and the receipt all happen or none do.

| No. | Goes back out | To |
| --- | --- | --- |
| 3.1 | A fresh total, or "the price changed" | Customer |
| 3.2 | "Those dates were just taken" when the claim fails | Customer |
| 3.3 | Booking number, private link, payment instructions | Customer |
| 3.4 | Push and email: new booking | Customer and owner |
| 4.2 | "That reference was already used" | Customer |
| 4.3 | The reason, when rejected | Customer |
| 4.5 | Receipt, check-in details, pending stamps | Customer |

&#91;embedded content: level 2 data flow · process 6, the lease cycle\]

| No. | Sub-process | Input | Output | Stores |
| --- | --- | --- | --- | --- |
| 6.1 | Open the inquiry | Message, move-in date, contact details | Inquiry number, private link | Inquiries, threads |
| 6.2 | Schedule the viewing | Requested time; owner's answer | Confirmed viewing | Viewings |
| 6.3 | Reserve the unit | Reservation request | Reserved lease, hold, reservation bill | Leases, occupancy, bills |
| 6.4 | Activate the lease | Rent, due day, advance, deposit | Active lease, move-in bill | Leases, occupancy, bills |
| 6.5 | Issue monthly bills | Today's date, active leases | One rent bill per lease per month | Bills, bill lines |
| 6.6 | Remind and flag late bills | Bills past their due date | Reminders to the tenant; late list for the owner | Outbox |
| 6.7 | End the lease | End date, deductions, deposit returned | Ended lease, freed unit | Leases, occupancy, deductions |

## 11. Write paths

&#91;embedded content: write paths · 3 callers, 1 API, 2 doors\]

The API has two ways to reach the database, the same split the food app uses. Simple owner edits go through the owner's own session, where row-level security applies. Anything that touches dates, money, stamps or running numbers goes through a SQL function, because only a function can change several tables in one transaction.

**Door 1: what an owner may edit directly.** `properties`, `property_pages`, `units`, the two terms tables, `listing_photos`, `unit_amenities`, `house_rules`, `payment_accounts`, `weekday_rates`, `rate_overrides`, `unit_fees`, `rewards`, `stamp_cards`, saved replies, and the note on a customer. Owners can read every other table of their own account but cannot write to it.

**Door 2: the SQL functions.** Each is `security definer` with an empty search path, can be run only by the API's service role, and takes the owner account and the actor as arguments.

| Function | Called when | What it does, all or nothing |
| --- | --- | --- |
| `create_booking_hold` | A guest taps Reserve | Releases stale holds on the unit, checks the hold limit, saves the customer, claims the dates, writes the price lines, numbers the booking, opens the thread, queues notices |
| `create_manual_booking` | The owner types a booking | Claims the dates as a booking and saves it as confirmed |
| `set_block`, `release_block` | The owner blocks or frees dates | Adds or releases a block row |
| `change_booking_dates` | The owner moves a stay | Updates the date range, replaces the price lines, writes an event |
| `submit_payment` | A proof is uploaded | Checks the reference, saves the payment and files, moves the booking or bill to review, extends the hold |
| `review_payment` | The owner approves or rejects | Sets the status and receipt number, confirms the booking or pays the bill, adds a tenant stamp when a bill is paid by its due date, queues notices |
| `record_owner_payment` | The owner records cash or a refund | Saves an approved payment or refund and recalculates the balance |
| `reverse_payment` | An approval was a mistake | Marks it reversed, reverses stamps, recalculates the booking or bill |
| `cancel_booking` | Either side cancels | Frees the dates, sets the status, queues notices |
| `mark_checked_in`, `complete_booking` | Arrival and checkout | Moves the status and writes an event |
| `expire_holds` | Timed job | Releases every hold past its time and expires its booking or reservation |
| `create_inquiry` | A visitor asks about a unit | Saves the customer, the inquiry and the thread |
| `reserve_unit` | A reservation starts | Creates the reserved lease, the hold and the reservation bill |
| `activate_lease` | Move-in is recorded | Turns the hold into a lease row, issues the move-in bill |
| `issue_rent_bills` | Timed job, daily | Creates the next rent bill for each active lease. Safe to run twice |
| `set_bill_lines`, `void_bill` | The owner edits a bill | Changes lines and the total while the bill is unpaid |
| `end_lease` | Move-out is recorded | Cuts the date range, saves deductions and the deposit returned |
| `redeem_reward` | A member claims a reward their stamps unlocked, or spends points on one | Checks the card, the stamps or points, and any limited pieces left (one per customer), writes the claim and the ledger line |
| `approve_account`, `review_plan_payment`, `pause_late_accounts` | Super admin and a timed job | Starts the trial, extends `paid_through`, pauses after the grace period |
| `claim_outbox_batch`, `finish_outbox_item` | The sender job | Hands out unsent rows so two senders never take the same one; records the result |
| `submit_guest_list` | A guest sends names, IDs and a plate number | Checks the count against the booking, saves the guests, locks the list, queues a notice to the owner |
| `rotate_thread_link` | The owner or customer asks for a new link | Makes a new token, stores only its fingerprint, returns the token once; the old link stops working |
| `open_repair_request`, `update_repair_request` | A tenant reports a problem; the owner updates it (wave 2) | Saves the request, posts a card in the conversation, queues notices |
| `publish_property_page` | The owner presses Publish | Checks the draft against the shared schema and the contrast rules, refuses a stale `version`, copies the draft to `published`, counts `version` up, writes an audit line |
| `change_slug` | The owner changes the web address | Checks the format and reserved words, refuses any slug that is current or old on any property, allows 3 changes a year, moves the old slug into `old_slugs` |
| `give_reward` | The owner hands over a perk or prize | Marks the claim given, writes the ledger line when it closes the card, queues a notice |
| `adjust_stamps` | The owner fixes a guest's stamps | Plus or minus 1 stamp or up to 100 points, with a reason and a private note; refuses a 4th change that Manila day and any balance below 0; accepts Undo for 15 seconds |
| `cancel_claim` | The owner cancels a claim | Gives back the piece and the stamps, with a reason |
| `submit_review` | The guest rates a completed stay from the private link | One per booking, within 30 days of checkout; returns the Google review link when the owner has one |
| `create_export` | The owner asks for a ZIP | Refuses a second one while one is preparing; the API builds the file and marks it ready |
| `report_page` | Anyone reports a property page | Saves the report and alerts the super admin; rate-limited |
| `duplicate_unit` | The owner copies a unit | Copies details, terms, amenities, prices and photo references into a new unlisted unit; never bookings or occupancy |
| `save_inspection` | The owner saves a move-in or move-out list (wave 2) | Saves the list and asks the tenant to confirm it |
| `queue_meta_event` | Inside the sign-up transaction, `approve_account` and `review_plan_payment` | Adds a pending delivery only if the Pixel is in test or live, the event's server switch is on and the owner gave consent |
| `claim_meta_deliveries` | The Meta sender job | Hands out up to 50 due rows with `for update skip locked` |

**Read and chat functions.** Public pages are also served through functions, so no table is ever opened to the browser's role. This follows the food app's schema plan.

| Function | Called when | Returns or does |
| --- | --- | --- |
| `get_property` | Someone opens a property link | The published page, its listed units, rules and amenities. Never arrival details or payment accounts |
| `get_unit_calendar` | A unit page loads | The taken date ranges for the booking window, with no guest details |
| `quote_stay` | Dates and guests are picked | The price lines and total, worked out on the server |
| `get_thread` | A private link is opened | The booking or inquiry, its status, messages, payment cards and, once confirmed, arrival details |
| `post_message` | Either side sends a message | Saves the message and queues a notice. Refused on a closed thread |
| `hide_message`, `close_thread`, `block_customer` | The owner deals with abuse | Hides one message, closes one conversation, or stops a customer from placing holds |
| `join_as_member` | A guest enters an email code | Links the profile to the customer row and to past bookings with that verified email |

**Guests and members.** A guest has no database session. The API reads for them through the service role, and every such query must filter by the thread's private token or by the member's own customer rows. One automated test per query proves a guest cannot read another guest's booking.

**Errors the functions raise.** The API turns each into a fixed code, and the screens word the message from the code.

| Code | Cause |
| --- | --- |
| `dates_taken` | The exclusion constraint refused the dates |
| `price_changed` | The quote no longer matches the current rates |
| `hold_limit` | The customer already has two unpaid holds with this owner |
| `reference_used` | That payment reference is already on another payment |
| `invalid_move` | The status cannot change that way |
| `not_allowed` | The account is paused, or the customer is blocked |
| `not_found` | Also used when the row belongs to another owner |

## 12. Security, files and retention

Row-level security is on for all 62 tables, in the migration that creates each one. It is the backup guard; the API's own checks come first.

**Who can do what**

| Database role | Used by | Rights |
| --- | --- | --- |
| `anon` | Nobody. The browser never calls Supabase | No rights on any table or function |
| `authenticated` | The API, acting as a signed-in owner (door 1) | Reads its own account's rows; edits door-1 tables only; never deletes |
| `service_role` | The API only, for SQL functions, guest reads and timed jobs | Skips row-level security, so the key lives only in the API's settings |

**Policy classes**

| Class | Tables | An owner can | Policy |
| --- | --- | --- | --- |
| A. Owner-edited | The door-1 tables in section 11 | Read, add, change | `account_id` is one of the caller's active memberships |
| B. Owner-read | Bookings, lines, events, occupancy, payments, proofs, customers, threads, messages, leases, bills, ledgers, claims, files, the account's own subscription and audit lines | Read only | Same test, for select only |
| C. Service only | `platform_admins`, `account_counters`, `idempotency_keys`, `push_subscriptions`, `notifications_outbox`, `meta_pixels`, `meta_event_switches`, `meta_attribution`, `meta_capi_deliveries`, `funnel_events` | Nothing | No policy, so no rows |
| D. Shared lists | `plans`, `feature_flags`, platform `amenities` | Read | Open to any signed-in owner |

The membership test is one helper function, `private.my_account_ids()`, wrapped in a `select` so Postgres works it out once per query. Every table has an index that starts with `account_id`, which Supabase names as the main speed rule for policies ([Supabase: Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)).

A table with row-level security on and no policy returns no rows ([PostgreSQL: Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)). That is what protects class C.

**Three checks run in CI.** Every table in `public` has row-level security on. No table grants anything to `anon`. For each table, a second owner's session reads zero rows of the first owner's data.

**Secrets in rows**

| Value | How it is kept |
| --- | --- |
| Thread private token | 32 random bytes, shown as 43 characters. Only its SHA-256 fingerprint is stored, and it is never written to logs |
| Meta access token | Kept only in Railway secrets as `META_CAPI_TOKEN`. Never in the database, a log or a browser |
| Push keys | Service-only table |
| Passwords and email codes | Held by Supabase Auth, not in our tables |

**File storage**

| Bucket | Public | Holds | Path | Kept |
| --- | --- | --- | --- | --- |
| `listing-media` | Read | Photos, logos, payment QR images, reward images | `<account>/<property>/<uuid>.webp` | Until the owner removes it |
| `payment-proofs` | No | Customer proofs. The owner views them through 5-minute signed links | `<account>/<payment>/<uuid>.webp` | 30 days after approval |
| `documents` | No | Reserved for lease documents | `<account>/<lease>/<uuid>.pdf` | Not used at launch |

An upload has three steps. The API saves a `files` row as `pending` and returns a signed upload address. The browser uploads the file. The API then checks the stored file's size and real type, and marks the row `ready`. Limits: 15 MB, images only for proofs and photos.

**How long data is kept**

| Data | Kept | Removed by |
| --- | --- | --- |
| Payment proofs | 30 days after approval | Timed job deletes the stored file and marks the `files` row |
| Idempotency keys | 48 hours | Timed job |
| Funnel events | 90 days | Timed job |
| Sent outbox rows | 30 days | Timed job |
| Bookings, payments, bills, ledgers | Kept | Never deleted while the account is open. After an account closes, kept 5 years, the preservation period for books under the Ease of Paying Taxes Act, then deleted |
| Customer details | Until the person asks | The row is anonymised; bookings stay |
| Audit lines | 2 years |  |
| Guest ID images | 7 days after checkout | Timed job `delete_guest_ids`. Names stay with the booking |
| Repair photos | 90 days after the request is closed | Timed job |

Database backups do not include stored files, and the Pro plan keeps seven daily backups ([Supabase: Backups](https://supabase.com/docs/guides/platform/backups)). A deleted photo cannot be restored from a backup.

## 13. Indexes, build order, tests and growth

**Index rules.** Every foreign key column is indexed. Every index used by an owner's list starts with `account_id`. Lists page by `(created_at, id)`, never by page number, so they stay fast as they grow ([Use The Index, Luke](https://use-the-index-luke.com/no-offset)).

| Table | Index | Serves |
| --- | --- | --- |
| `unit_occupancy` | GiST `(unit_id, during)` where active, made by the constraint | Availability, the calendar, the overlap rule |
| `unit_occupancy` | `(expires_at)` where it is an active hold | The hold sweep |
| `bookings` | `(account_id, status, created_at desc)` | The booking board |
| `bookings` | `(customer_id)`, unique `(occupancy_id)` | A member's history; the date lookup |
| `payments` | `(account_id, status, created_at desc)` | Proofs waiting for review |
| `payments` | `(booking_id)`, `(bill_id)` | Balances |
| `bills` | `(account_id, status, due_on)` | Rent due and late lists |
| `threads` | unique `(token_hash)`; `(account_id, last_message_at desc)` | Opening a link; the inbox |
| `messages` | `(thread_id, created_at, id)` | Reading a thread in order |
| `customers` | unique `(account_id, email)` | Finding a returning guest |
| `notifications_outbox` | `(next_attempt_at)` where pending or failed | The sender job |
| `audit_logs`, `funnel_events` | `(account_id, created_at desc)` | Activity lists and the funnel |

**Build order.** One migration file per step. Each file holds the tables, constraints, indexes, row-level security, grants and policies together.

| Wave | File | Contents |
| --- | --- | --- |
| 1 | 0001 foundation | Lock down default rights, `private` schema, `btree_gist`, `profiles`, `platform_admins`, the membership helper, the `updated_at` trigger |
| 1 | 0002 platform | Accounts, members, plans, subscriptions, plan payments, flags, counters, idempotency keys, audit log, job log |
| 1 | 0003 files | `files` and the three buckets |
| 1 | 0004 listing | Properties, pages, units, both terms tables, photos, amenities, rules, payment accounts |
| 1 | 0005 price | Weekday rates, overrides, fees |
| 1 | 0006 customers | Customers and consents |
| 1 | 0007 stays | Occupancy, bookings, lines, events, guest lists |
| 1 | 0008 money | Payments and proofs |
| 1 | 0009 chat | Threads, messages, saved replies |
| 1 | 0010 notify | Push subscriptions, the outbox, and the platform Meta Pixel tables (pixels, switches, attribution, deliveries) |
| 1 | 0011 booking functions | The SQL functions for stays, payments, chat and jobs |
| 2 | 0012 rentals | Inquiries, viewings, leases, deductions, bills, lines, lease events, repair requests |
| 2 | 0013 rental functions | The SQL functions for leases and bills |
| 3 | 0014 loyalty | Rules, ledger, rewards, claims and their functions |
| 3 | 0015 funnel | Funnel events |

An applied migration is never edited. A later change is a new file, made in three safe steps: add the new shape beside the old, move the code and data across, then remove the old ([Fowler: Parallel Change](https://martinfowler.com/bliki/ParallelChange.html)).

**Tests that must pass before a wave is done**

| Test | Proves |
| --- | --- |
| Twenty holds sent at once for the same nights | Exactly one succeeds |
| The same booking request sent twice with one key | One booking, same answer |
| A second owner reads each table | Zero rows of the first owner's data |
| A guest opens another guest's link token | Not found |
| The monthly bill job run twice | One bill per lease per month |
| A payment approved twice | One receipt number; one stamp per booking or bill |
| Balance compared with the sum of approved payments | They match on every booking and bill |
| Every table checked for row-level security | None is missing it |
| A backup restored into a spare project | The data comes back |

**Growth.** The System blueprint assumes 60 bookings a month per owner. One booking writes about 27 rows across occupancy, booking, lines, events, payments, messages and notices. At 100 owners that is about 162,000 rows a month, or about 1.9 million a year. This is small for Postgres and fits the plan's 8 GB.

No table is partitioned at launch. PostgreSQL's own rule of thumb is to partition once a table is larger than the server's memory ([PostgreSQL: Table Partitioning](https://www.postgresql.org/docs/current/ddl-partitioning.html)). The first candidates, by month, are `funnel_events`, `messages`, `notifications_outbox` and `audit_logs`.

## 14. Monitoring and housekeeping

The system watches itself through three things: a log of who did what, a log of every timed job, and views that add up usage. Owners see their own account; you see all of them.

**`job_runs`** One row per run of a timed job. Service-only, kept 30 days.

| Column | Type | Rule |
| --- | --- | --- |
| `job` | text | The job's name, from the list below |
| `started_at`, `finished_at` | timestamptz |  |
| `status` | text | `running`, `ok`, `failed` |
| `rows_affected` | integer | How much the run did |
| `error` | text | The failure message, without personal data |

**Timed jobs.** All run inside the API. When a second API copy is added, each job first takes a database lock so it still runs once.

| Job | Runs | Does |
| --- | --- | --- |
| `send_outbox` | Every minute | Sends waiting push and email; retries with a longer wait each time |
| `expire_holds` | Every 5 minutes | Frees holds past their time |
| `remind_proof_review` | Hourly | Tells the owner about proofs waiting more than 24 hours |
| `complete_stays` | Daily | Marks stays completed the day after checkout |
| `issue_rent_bills` | Daily | Issues rent bills due in 7 days |
| `remind_rent` | Daily | Reminds the tenant 3 days before, on the day, and 1, 3 and 7 days late |
| `pause_late_accounts` | Daily | Pauses owner accounts whose grace period ended |
| `close_old_threads` | Daily | Closes conversations 30 days after checkout or move-out |
| `delete_old_proofs` | Daily | Removes proof files past their 30 days |
| `delete_orphan_files` | Daily | Removes uploads never confirmed within 24 hours |
| `purge_old_rows` | Daily | Clears expired idempotency keys, old funnel events, sent outbox rows and old job runs |
| `delete_guest_ids` | Daily | Removes guest ID images 7 days after checkout |
| `remind_guest_list` | Hourly | Reminds the guest when the list is due within 24 hours and not yet sent |
| `resume_cards` | Daily | Turns paused stamp cards back on when `paused_until` is reached |
| `expire_claims` | Daily | Reminds members 14 days before a reward ends, then marks it expired |
| `clean_uploads` | Hourly | Removes files never confirmed within an hour |
| `expire_exports` | Hourly | Marks exports expired after 24 hours and deletes the ZIP |
| `remind_lease_end` | Daily (wave 2) | Reminds the owner and the tenant `renew_reminder_days` before a lease ends |
| `add_late_fees` | Daily (wave 2) | Adds the lease's late fee once to a bill still unpaid after `late_fee_after_days` |
| `expire_points` | Daily (wave 3) | Reminds members 14 days before, then expires the points of members with no new points for `points_expire_months` |
| `meta_capi_send` | Every minute | Sends due Meta events; retries after 1, 5, 30, 120 and 360 minutes; marks rows older than 6 days 20 hours expired |
| `meta_health_check` | Hourly | Works out red, amber or green for `/admin/pixels` and emails the super admin on red |
| `clear_meta_attribution` | Daily | Removes click data older than 90 days |

**Views.** Totals are worked out, never stored.

| View | Gives |
| --- | --- |
| `v_booking_balance` | Approved payments minus refunds, and what is still owed, per booking |
| `v_bill_balance` | The same per bill, plus days late |
| `v_customer_stamps` | A member's stamp balance, pending stamps and ready rewards |
| `v_account_storage` | Bytes used per owner and the plan's limit |
| `v_account_usage` | Units, bookings and leases in the last 30 days, last sign-in |
| `v_subscription_state` | Trial, active, due, overdue or paused, from the dates |

**Who sees what**

| Signal | The owner sees | You see in super admin |
| --- | --- | --- |
| Actions taken | An activity list for their account: who approved, rejected, cancelled or changed prices | The same across all owners |
| Storage | Used against their plan's 2 GB | Every owner's use, largest first |
| Notices that failed | A mark on the booking when the customer's email bounced | Counts of failed and dead outbox rows |
| Timed jobs | Nothing | Last run, last failure and rows handled for each job |
| Meta events | Nothing at launch; owners have no Pixel | Sent and failed counts for the platform Pixel |
| Plan | Trial, due and overdue banners | Every account's state and payments to review |

**Storage limits.** At 80% of the plan's storage the owner gets a notice. At 100%, new photos are refused. Payment proofs are always accepted, because a full storage pool must never block a customer from paying.

**Outside the database.** The API has a health address and writes logs with a request number and no personal data. An uptime check and an error-alert tool are still to be chosen; they are listed in section 18.

## 15. Moving hosts later

The data and its rules can move to another Postgres host as they are. Sign-in, file storage and the security policies are tied to Supabase and would need rework. Nothing here has been tested by an actual move.

| Part | Today | Tied to the host? | A move to AWS means | Effort |
| --- | --- | --- | --- | --- |
| Tables, constraints, indexes | Postgres on Supabase | No | Dump and restore into Amazon RDS or Aurora. `btree_gist` is on [AWS's supported list](https://docs.aws.amazon.com/AmazonRDS/latest/PostgreSQLReleaseNotes/postgresql-extensions.html) | Low |
| SQL functions | Plain Postgres functions | No | Nothing | Low |
| Security policies | Use Supabase's sign-in id and its roles | Yes | Rewrite one helper function and create matching roles | Medium |
| Sign-in | Supabase Auth | Yes | A different sign-in service. Owners reset passwords; customers use email codes, so they have nothing to move | High |
| Files | Supabase Storage | Yes | Copy the files to S3 and change one module | Medium |
| How the API queries | `supabase-js` | Yes | Swap for a Postgres driver inside the data layer | Medium |
| API | NestJS on Railway | No | Any container host | Low |
| Property app | Next.js on Vercel | Partly | Runs as a Node server or in Docker. With more than one copy it needs a shared cache, and the proxy must allow streaming ([Next.js: self-hosting](https://nextjs.org/docs/app/guides/self-hosting)) | Medium |
| Dashboard | Vite static files on Vercel | No | Any static host | Low |

**Five rules that keep the door open.** They cost nothing now.

1. Only the API imports Supabase code. This is already food app rule 4.
2. Inside the API, feature modules use three small interfaces: sign-in, file store and database. Only those three files know Supabase exists.
3. No Supabase-only database features: no Realtime, edge functions or database cron. This is already food app rule 13.
4. Every policy calls one helper to learn who is asking. Only that helper names Supabase's function.
5. `files` stores a path, never a full web address.

NestJS does not make a move easy by itself. These rules do, and NestJS is where they are enforced. My advice is not to plan a move: Supabase can grow with larger compute long before a move pays for itself.

## 16. Checked against Airbnb and the rental tools

Airbnb's host calendar has about fifteen booking settings. This design had eight of them, four are added here, and the rest are placed in a later release. The settings come from Airbnb's host guides ([availability settings](https://www.airbnb.com/resources/hosting-homes/a/update-your-availability-settings-708), [pricing tips](https://www.airbnb.com/resources/hosting-homes/a/six-ways-to-prepare-for-low-season-700)) and a host tool's [list of Airbnb settings](https://help.hosttools.com/en/articles/15684344-what-airbnb-settings-can-i-edit-in-host-tools), read through search results, not from inside a host account.

| Airbnb setting | In this design | Decision |
| --- | --- | --- |
| Minimum and maximum nights | Yes |  |
| Advance notice | Yes, in days | A same-day cut-off hour is later |
| Availability window | Yes |  |
| Weekend price | Yes, as any weekday | More flexible than Airbnb's |
| Custom price for dates | Yes |  |
| Extra-guest fee, cleaning fee, other fees | Yes | A pet fee is an `other` fee |
| House rules | Yes, as text |  |
| Block dates by hand | Yes |  |
| Preparation time between stays | **Added** | `prep_nights`, held by the occupancy buffer |
| Weekly and monthly discounts | **Added** | Two percent columns on the stay terms |
| Message the host before booking | **Added** | An inquiry can be opened on any unit |
| Arrival instructions after booking | **Added** | `arrival_info` on the property and the unit |
| Early-bird, last-minute and custom promotions | No | Later, with promo codes |
| Minimum nights by weekday; no check-in on chosen days | No | Later |
| Guest controls for children, infants, pets, events | Text only | Structured later |
| Security deposit for a stay | No | Later. Leases already have a deposit |
| Calendar feed in and out | No | MVP B, as decided |
| Reviews | No | Later; a private rating first |
| Co-hosts | No | Later, as staff sign-ins |
| Automatic pricing | No | Not planned |

**Rental tools.** The two Philippine tools in the System blueprint issue bills each month and approve a proof in one tap. This design does both. Lease documents with e-signature, online card payment and maintenance requests are later.

**From the food app's own schema plan.** Three ideas were taken: a normalised payment reference, a version number on the page draft, and a demo flag on accounts. One thing differs on purpose: money is `bigint` here and `integer` there, because a year of rent in centavos is a large number.

## 17. Ready for later features

Each later feature adds tables or values. None changes a row that already exists.

| Later feature | What changes |
| --- | --- |
| Online payment gateway | A new `payment_intents` table; `payments.method` gains `gateway`; the system approves instead of the owner |
| Calendar feeds | A new `calendar_feeds` table; `unit_occupancy.kind` gains `external` |
| Staff sign-ins | `account_members.role` already allows `staff`; a new permissions table |
| Room types with a count | A new `unit_types` table; `units` gains an optional link to it |
| Promo codes and promotions | A new `promos` table; `booking_lines` already has `discount` lines |
| Add-ons at booking | `unit_fees` gains an optional flag; lines already carry fees |
| Reviews | A`lready in wave 1 as stay_reviews (addition 20)` |
| Meter readings | A new `meter_readings` table; bill lines already have water and electricity |
| SMS | `notifications_outbox.channel` gains `sms` |
| Lease documents | The `documents` bucket is reserved; a new `lease_documents` table |
| A second country | `accounts.timezone` and `currency` already exist |
| Heavy reports | A read copy of the database; the views do not change |
| Time-ordered ids | Postgres 18 adds `uuidv7()` for new tables ([PostgreSQL: UUID functions](https://www.postgresql.org/docs/current/functions-uuid.html)) |

## 18. Decisions and what is still open

Decided on 14 November 2026, on the founder's instruction to answer these as co-founder.

| Point | Decision |
| --- | --- |
| The ten choices in section 1 and the four additions in section 16 | Approved |
| The thread's private link | Store only a SHA-256 fingerprint. A link is shown once when it is made; "new link" replaces it. A leaked database cannot open anyone's conversation |
| Proposed timings: 72-hour review hold, 30-day proof deletion, reminder days | Approved as written |
| How long records are kept | Audit lines: 2 years. Money records: while the account is open, then 5 years after it closes, matching the 5-year preservation period for books under the Ease of Paying Taxes Act ([KPMG](https://kpmg.com/ph/en/home/insights/2025/03/ensuring-compliance-preservation-and-examination-of-books-of-accounts.html)). An accountant should confirm this |
| Uptime check and error alerts | Sentry's free Developer plan for errors, plus its one free uptime check on the API's health address ([Sentry](https://blog.sentry.io/uptime-monitoring-now-ga)). Timed jobs report to `job_runs` and `/admin/health` |
| Database tests | pgTAP for rules inside the database: overlaps, row-level security, functions. API tests for guest reads by link and for every endpoint's owner check |
| Postgres version | Checked: the three existing Supabase projects all run Postgres 17 |
| Rewards | Stamp cards for stays and tenants instead of points, with up to 3 milestones, limited pieces with public counts, pause until a date, and a member perk (addition 19) |
| Final additions 20 to 24 | Approved: ratings, exports, page reports, inspections and the new columns |
| Points mode | Added on Lex's request (14 November 2026): each card picks stamps or points; stamps stay the recommended default for stays |
| Meta Pixel and Conversions API | Decided on 15 November 2026 in its own tab: one consented Pixel on owner pages, server events through a queue, the token in Railway secrets, new table `meta_attribution` (62 tables) |
| Lessons from the RSVP app's Meta bugs | No Pixel for super admin or impersonation sessions; admin-triggered events use only saved owner data (`triggered_by`); `review_plan_payment` refuses a future paid date; no browser Purchase (15 November 2026) |

**Tested on 14 November 2026.** The occupancy table in section 4 was run on a local Postgres 16 server against 14 cases, and every case behaved as designed:

- Overlapping dates were refused with code 23P01, and stays back to back were allowed.
- A preparation night blocked the next check-in, and an open-ended lease blocked later bookings.
- A released hold freed its dates.
- A row pointing at another owner's unit was refused.
- The checks on holds and releases held.
- Two sessions racing for the same dates: the second waited for the first, then was refused.

No other SQL on this page has been run.

**Still open**

- [ ] Run the rest of the SQL on the development project in the first migration task, and fix what fails.
- [ ] Have an accountant confirm the record-keeping periods.

## 19. Sources

Opened on 14 November 2026.

- PostgreSQL documentation: [Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html), [Range Types](https://www.postgresql.org/docs/current/rangetypes.html), [btree\_gist](https://www.postgresql.org/docs/current/btree-gist.html), [Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html), [Numeric Types](https://www.postgresql.org/docs/current/datatype-numeric.html), [JSON Types](https://www.postgresql.org/docs/current/datatype-json.html), [Index Types](https://www.postgresql.org/docs/current/indexes-types.html), [Transaction Isolation](https://www.postgresql.org/docs/current/transaction-iso.html), [Table Partitioning](https://www.postgresql.org/docs/current/ddl-partitioning.html), [UUID functions](https://www.postgresql.org/docs/current/functions-uuid.html)
- [PostgreSQL wiki: Don't Do This](https://wiki.postgresql.org/wiki/Don%27t_Do_This)
- Supabase documentation: [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security), [Hardening the Data API](https://supabase.com/docs/guides/database/hardening-data-api), [Database Migrations](https://supabase.com/docs/guides/deployment/database-migrations), [Backups](https://supabase.com/docs/guides/platform/backups), [Storage access control](https://supabase.com/docs/guides/storage/security/access-control)
- [microservices.io: Transactional outbox](https://microservices.io/patterns/data/transactional-outbox.html)
- [Use The Index, Luke: paging without offset](https://use-the-index-luke.com/no-offset)
- [Martin Fowler: Parallel Change](https://martinfowler.com/bliki/ParallelChange.html)
- [Next.js: self-hosting](https://nextjs.org/docs/app/guides/self-hosting)

* RA 9653 deposit limits and extension: [RentScout guide](https://rentscout.ph/blog/tenant-rights-philippines-rent-control-act-guide) (secondary source)
* Book preservation period: [KPMG Philippines](https://kpmg.com/ph/en/home/insights/2025/03/ensuring-compliance-preservation-and-examination-of-books-of-accounts.html)
* Fake e-wallet receipts: [GCash advisory via Mynt](https://mynt.com.ph/newsroom/gcash-warns-public-on-emerging-ai-generated-fake-receipts-scams-urges-users-to-always-check-transactions-tab)
* Sentry uptime monitoring: [Sentry blog](https://blog.sentry.io/uptime-monitoring-now-ga)

Read through search results, not opened in full: the AWS extension list and the three Airbnb and host-tool pages linked in sections 15 and 16.

From your repositories: the food app's `AGENTS.md`, `docs/SYSTEM.md` section 7, `docs/SMART_APP_PH_BLUEPRINT.md` section 13 and its first migration, at commit `df7c1b7`; and sections 3 to 11 of the System blueprint tab.
