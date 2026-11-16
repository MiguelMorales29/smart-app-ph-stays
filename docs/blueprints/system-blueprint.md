# Smart App PH — Stays & Rentals: Project Proposal

Nov 13, 2026 · @alex

## 1. Summary

Smart App PH Stays & Rentals gives a Philippine property owner an installable booking app for guests and tenants, plus a dashboard to run it. It is a second system beside the food and retail app, on the same stack, in its own repository.

It serves two kinds of owner with one data model:

| Target | What the customer does | What the owner manages |
| --- | --- | --- |
| Staycation (short term) | Picks dates, sees the price, books, sends payment proof | Calendar, blocked dates, bookings, check-in and check-out |
| Apartment or room rental (long term) | Views a unit, asks, books a viewing, reserves, pays rent monthly | Units, tenants, lease dates, monthly bills and receipts |

The first launch (MVP A) keeps the food app's proven pattern: a PWA with web push, an in-app chat for manual payment (GCash, Maya, bank with uploaded proof), guest and member accounts, and owner-set stamp cards and rewards. A super admin area and Meta Pixel with Conversions API are in MVP A this time, carried over from the RSVP system.

**How to use this document.** It is the foundation paper. It fixes scope, data, architecture, stack, pricing and working rules. It does not design screens: each screen gets its own research pass later, checked against references, as was done for the food app. Section 16 lists every assumption and open decision that needs your yes.

**Three recommendations to decide first** (details in section 16):

1. Build the database and API for each area before its screens, one thin slice at a time. The food app has 85 recorded decisions and one migration; this system's hardest problem is double bookings, which only the database can prevent.
2. Build short term first, long term second, inside MVP A. Short term reuses the order flow almost one to one.
3. Launch at one plan, with the price set in section 6 from real hosting costs.

## 2. Background and problem

Small Philippine hosts and landlords run on marketplaces, Messenger and screenshots, and each one costs them money or control. This system gives them their own booking channel for a flat monthly fee.

| Who | How they work today | What goes wrong |
| --- | --- | --- |
| Staycation host | Lists on Airbnb, Booking.com or Agoda; also takes bookings on a Facebook page and Messenger | Airbnb now takes a single 15.5% host fee on the whole booking ([Hostaway](https://www.hostaway.com/airbnb-host-only-fee-what-to-know-about-the-15-percent-host-fee)). Messenger bookings have no calendar, so dates get double booked. The guest belongs to the platform, not the host. |
| Apartment or room landlord | Fills units through Facebook groups and referrals; collects rent by GCash, Maya, bank or cash | Rent is tracked in notebooks, spreadsheets and folders of payment screenshots. Late payers are chased by chat. Receipts are written by hand. |
| Guest or tenant | Asks by chat, waits for a reply, sends a screenshot | No clear price, no proof that the date is held, no record of what was paid. |

The working habits in the second column are the founder's premise and are **assumed**, not measured. Section 14 plans five owner interviews per target before any screen is built.

**Problem statement.** A small owner has no affordable tool that (1) shows true availability and price, (2) holds a date while a manual payment is checked, (3) keeps one record per guest or tenant, and (4) brings the same customer back without paying a commission again.

**Position.** This is the owner's own app, not a marketplace. A host can keep an Airbnb listing for reach and send repeat and direct guests here. There is no search across owners in the first launch.

**Two rule sets shape the product:**

- Short-term hosts are being pushed toward a mayor's permit and Department of Tourism accreditation, and many condominiums restrict short stays. The app records an owner's permit details but does not check them. This comes from search results only and needs a proper legal read before launch.
- Long-term residential leases are covered by the Rent Control Act for units at ₱10,000 a month and below, extended through 31 December 2026 with a 1% increase cap for 2026 ([NHSB Resolution 2024-01](https://philpropertyexpert.com/public/NHSB_Resolution_2024-01_Rent-Control-2025-2026.pdf)). The widely cited limit of one month advance and two months deposit comes from the Act itself, which I did not open today. The lease form defaults to that limit and warns above it.

## 3. Objectives and scope

**General objective.** Build a multi-owner booking and rental system where a guest can book a stay, or a tenant can rent a unit, from a link in under three minutes, and the owner can run the business from a phone.

**Specific objectives for MVP A**

1. No two confirmed stays, holds, blocks or leases overlap on one unit. The database enforces this, not the screen.
2. A guest sees the full price before giving any personal detail.
3. A manual payment moves from uploaded proof to approved in one owner tap, with a receipt and a push notice to the customer.
4. Every monthly rent bill is created by the system on its due cycle, never typed twice.
5. Each owner's data is invisible to every other owner, proven by one cross-owner test per table.
6. Storefront pages score 90 or more on Lighthouse mobile and stay inside a first-load JavaScript budget.
7. The founder can approve owners, record plan payments and see storage use from a super admin screen, without SQL.

### 3.1 MVP A: shared core (both targets)

| Area | In MVP A |
| --- | --- |
| Property page | One installable page per property: photos, units, amenities, house rules, location link, share link and QR |
| Accounts | Guest checkout by default. Member sign-in with a 6-digit email code, no passwords for customers |
| Chat and manual payment | One thread per booking, inquiry or lease. The customer uploads a payment proof in the thread; the owner approves or rejects with a reason |
| Web push | Booking held, payment approved or rejected, check-in reminder, rent due, rent overdue, new message |
| Stamp cards and rewards | The owner switches a stamp card on, sets how stamps are earned, and sets rewards: a peso or percent discount, a free night, a perk or a prize (Feature blueprint, section 7c) |
| Owner dashboard | Home, Calendar, Bookings, Units, Tenants, Guests and members, Payments, Editor, Settings |
| Super admin | Owner approval, plans and plan payments, storage and usage, Meta pixels, feature switches, audit log |
| Tracking | Meta Pixel in the browser and Conversions API from the server, for our own marketing funnel and for each owner's property page |
| Kit | A `/kit` page that shows every installed component and pattern |

### 3.2 MVP A: short term (staycation)

- Date range picker with unavailable dates greyed out, minimum and maximum nights, guest count
- Price per night with a weekend rate, date overrides for holidays, cleaning fee and extra guest fee; a line-by-line breakdown before booking
- A hold on the dates while payment is checked, with an expiry the owner sets
- Down payment or full payment, set by the owner as a percent
- Owner-blocked dates and manual bookings, so a booking taken on Airbnb or by phone still blocks the calendar
- Check-in details released only after payment is approved; a voucher page with QR, saved as an image
- Cancellation policy shown as the owner's text; refunds are recorded, never processed, by the system

### 3.3 MVP A: long term (apartment, room, bed space)

- Unit page with monthly rent, inclusions, date available, minimum lease, advance and deposit terms
- Inquiry thread and a viewing schedule the owner confirms
- Reservation with a reservation payment and proof
- Lease record: tenant, start and end, monthly rent, due day, advance paid, deposit held
- Monthly bills created on the due cycle, with optional extra lines the owner types (water, electricity, internet)
- Tenant pays with proof, the owner approves, the tenant gets a receipt; overdue bills are flagged and reminded
- Move-out record with deposit returned and deductions listed

### 3.4 MVP B (after launch, one module at a time behind a per-owner switch)

| Group | Modules |
| --- | --- |
| Listing types | Tours, the third listing type: tour packages sold per head on fixed dates, with seat counts, vans, pickup points and a manifest. Added 15 November 2026; full plan in the Tours (MVP B) tab |
| Payments | Online payment gateway with automatic confirmation; refunds through the gateway |
| Calendar | Calendar sync with Airbnb and Booking.com; seasons and bulk price rules; promo codes |
| Operations | Staff logins and roles; cleaning and maintenance tasks; meter readings and utility billing; lease documents and e-signature |
| Growth | Public reviews; add-ons at booking (extra bed, late checkout, a day trip); referral rewards; point tiers and expiry |
| Platform | A discovery page across owners; SMS reminders; native app shell; tax-ready reports; AI helpers |

### 3.5 Out of scope for MVP A

Property sales, a marketplace search, channel management, automatic refunds, identity verification, tax filing, and any feature that moves money through us.

## 4. Users and roles

Five roles use the system in MVP A, and one word is reserved from the start: **tenant always means the person renting a unit**. The paying client of Smart App PH is called an **owner account**, never a tenant, in code, tables and screens.

| Role | Who | Signs in with | Can do |
| --- | --- | --- | --- |
| Guest | Anyone with the property link | Nothing; a booking link and token | Browse, see prices, book, upload proof, chat on their own booking |
| Member | A guest who joined | 6-digit email code | Everything a guest can, plus saved details, booking history, stamp cards and rewards across that owner's properties |
| Tenant | A member with an active lease | 6-digit email code | See the lease, bills and receipts; pay rent with proof; chat with the owner |
| Owner | The paying client | Email and password; Google later | Manage properties, units, prices, calendar, bookings, leases, bills, payments, members, the page editor and settings |
| Super admin | The founder | Email and password plus a platform role | Approve and suspend owners, record plan payments, see usage, manage pixels and feature switches, read audit logs |

Staff logins with named permissions are MVP B. Until then one owner login runs each account.

### 4.1 Guest and member data

A guest gives the least data that makes a booking work, and a member adds only what saves them typing next time.

| Data | Guest | Member | Rule |
| --- | --- | --- | --- |
| Name, mobile, email | Typed per booking, remembered on the phone | Saved on the account | Email is required for a booking link and receipt |
| Booking and payment history | Reached only through each booking's private link | Listed in the account | A guest booking joins a member only by its booking token or the same verified email, never by phone number alone |
| Stamps | None | Earned and spent per owner account | Stamps never cross between owners |
| Push subscription | Per device, per property, after tapping Notify me | Same, tied to the member | A push message never carries personal details in its text |
| Marketing consent | Unticked box at booking | Unticked box, changeable in the account | Needed before any promo message or ad audience use |
| Valid ID photo | Only if the owner asks for one | Same | Private storage, visible to that owner only, deleted a set number of days after checkout or move-out |
| Lease details | Not applicable | Tenant only | Visible to the tenant and the owner |

The ID photo row is the most sensitive item in the system. If pilot owners can work without it, leave it out of MVP A.

## 5. Existing systems and what we adapt

No reviewed product gives a small Philippine owner both a commission-free booking page and a rent ledger in one installable app; each covers one half. Prices were read from the linked pages on 13 November 2026 and change often.

| Product | Covers | Price seen | Strength | Gap we fill |
| --- | --- | --- | --- | --- |
| Airbnb | Short term, marketplace | 15.5% of the whole booking, paid by the host ([Hostaway](https://www.hostaway.com/airbnb-host-only-fee-what-to-know-about-the-15-percent-host-fee)) | Reach, trust, payments | Commission on every stay; the guest stays Airbnb's customer |
| [Lodgify](https://www.lodgify.com/comparisons/lodgify-alternatives/) | Short term, own website plus channel sync | From US$14 a month; own website from US$26 (Starter), US$42 (Professional) | Mature direct-booking site and calendar sync | Dollar pricing, card-first payments, no GCash proof flow, no rent ledger |
| Smoobu | Short term, channel sync | From about €29 a month plus 0.9% per booking, or about €35 with no fee (same Lodgify page) | Simple calendar sync | Same gaps as Lodgify |
| [Renthuzz](https://www.producthunt.com/products/renthuzz) | Long term, rent collection, Philippines | Free up to 5 units | Auto monthly bills; tenant uploads proof, landlord approves in one tap | No public unit page, no short stays, no rewards |
| [ManageYourCondo](https://www.producthunt.com/products/manageyourcondo) | Long term, property management, Philippines | From ₱1,500 a month | Online rent by GCash, Maya or card; lease e-sign; maintenance | Priced for managers, not single owners; no short stays |
| Facebook page and Messenger | Both | Free | Every customer already has it | No calendar, no price logic, no record |
| Spreadsheet and screenshots | Long term | Free | Familiar | No reminders, no receipts, easy to lose |

Feature notes for Airbnb, Messenger and spreadsheets are **assumed** from common use. The two Philippine products were read from their Product Hunt pages only, not tested.

**What we adapt**

| From | Pattern we take | How ours differs |
| --- | --- | --- |
| Booking marketplaces | Greyed-out dates, a price breakdown before any form, house rules to accept, a voucher after booking | One owner's units only; payment by proof, checked by the owner |
| Lodgify and Smoobu | The owner's own page with zero commission; blocking dates from other channels | Manual block first, automatic sync in MVP B |
| Renthuzz | Bills made by the system each cycle; proof upload then one-tap approval | The same flow also serves short stays, in one thread per booking |
| Smart App PH food app | Order thread with payment photos, receipt with QR, stamp card, per-shop installable app, owner editor | Orders become bookings and bills; stamps stay stamps, earned per stay or per rent bill paid on time |
| WebSerbisyo RSVP | Super admin area, Meta Pixel scopes, Conversions API delivery ledger | Same design, moved behind the NestJS API |

**Where we must be at least as good:** date picking, price clarity and speed to a held booking. **Where we do not compete in MVP A:** marketplace reach, automatic payments, calendar sync.

## 6. Feasibility and pricing

The recommended launch price is one plan at ₱599 a month for up to 5 units, which covers the system's own hosting at 6 paying owners. All peso figures use ₱63 to US$1, the rough November 2026 rate.

### 6.1 Feasibility

| Test | Finding | Risk |
| --- | --- | --- |
| Technical | The stack is already running in the food app's front end. Postgres has a built-in way to forbid overlapping date ranges ([Supabase](https://supabase.com/blog/range-columns.md)) | The NestJS and database side is unproven: the food app has one migration and no wired area yet |
| Economic | Fixed hosting is about US$50 to 55 a month on its own, or about US$15 more if it shares the food app's hosting accounts | Low. Costs stay flat until about 100 owners |
| Legal | We never hold customer money, so no payment licence is needed in MVP A. Owners keep their own permits | Data privacy duties for ID photos and tenant records are not researched yet |
| Operational | One founder with AI coding agents; plan payments checked by hand | Manual plan billing gets heavy past about 50 owners |
| Schedule | Short term reuses the order flow; long term adds a billing cycle | Building both targets at once doubles the hardest parts |

### 6.2 Monthly hosting cost at launch

| Item | Plan | US$ a month | What it includes |
| --- | --- | --- | --- |
| [Supabase](https://supabase.com/pricing) | Pro | 25 | US$10 compute credit, 8 GB database, 100 GB file storage, 250 GB egress, 100,000 monthly active users, daily backups kept 7 days |
| Vercel | Pro, one seat | 20 | Pro is US$20 a month and includes US$20 of usage credit (vercel.com/pricing, opened 14 November 2026). That page does not say whether the free Hobby plan allows commercial use; third-party pages say it does not. Confirm before launch |
| [Railway](https://docs.railway.com/pricing/plans) | Hobby | 5 or more | US$5 of usage included; billed on real usage above that |
| [Resend](https://resend.com/docs/knowledge-base/what-is-resend-pricing) | Free | 0 | 3,000 emails a month, 100 a day; Pro is US$20 for 50,000 |
| Domain | Already owned | 0 | Subdomains of webserbisyo.com |

Total: US$50 to 55, about ₱3,150 to ₱3,465 a month. This excludes the founder's time, taxes and ad spend.

### 6.3 Break-even

| Price | Owners needed, own hosting | Owners needed, hosting shared with the food app |
| --- | --- | --- |
| ₱399 | 8 to 9 | 3 |
| ₱599 | 6 | 2 |
| ₱799 | 4 to 5 | 2 |

At ₱599, 30 owners bring ₱17,970 against about ₱3,465 of hosting. At 100 owners revenue is ₱59,900; hosting rises to roughly ₱5,000 once email and database compute are upgraded (estimate).

### 6.4 Proposed launch plan

| Item | Included at ₱599 a month |
| --- | --- |
| Units | Up to 5 units (a unit is one bookable room, apartment or bed space) |
| Extra units | ₱100 each per month (open, see section 16) |
| Bookings, leases, members | Unlimited, with 0% commission |
| Storage | One 2 GB pool for unit photos, payment proofs and documents |
| Compute | Shared database and API; fair-use request limits from section 10 |
| Features | Installable property app, calendar, chat with payment proof, web push, stamp cards and rewards, page editor |
| Trial | 14 days |
| Paying | GCash or Maya to Smart App PH with a proof, for 1, 3 or 6 months; approved in super admin |
| States | Trial, active, due (7 days before the end), overdue (7-day grace), paused (page shows contact details only) |

**Why ₱599.**

- A host who pays Airbnb 15.5% loses ₱310 on a ₱2,000 night. Two direct nights a month cover the fee; three at ₱1,500.
- For a landlord with 5 rooms it is about ₱120 a unit a month.
- It sits far under the dollar tools (Lodgify Starter is about ₱1,640) and under ManageYourCondo's ₱1,500.

**Value check, added 14 November 2026.** Airbnb takes 15.5% of the booking subtotal from most hosts. ₱599 equals that fee on about ₱3,865 of bookings, which is roughly two nights at Metro Manila's average nightly rate of ₱2,077. An owner who takes more than two direct nights a month pays less with this system. Sources are in section 5 of the Knowledge base tab.

**Why not ₱399.** The food app's price was set for shops with small orders. A single stay is worth far more than a single food order, and ₱399 needs 8 to 9 owners to break even.

**Why not ₱799 yet.** Willingness to pay is untested, and Renthuzz is free up to 5 units on the long-term side. A landlord who only wants a rent ledger may not pay at all. Pilot interviews should test ₱599 against a cheaper rentals-only option.

### 6.5 What 2 GB and shared compute mean per owner

| Measure | Estimate | Basis |
| --- | --- | --- |
| Unit photos | About 44 MB for 5 units | 30 photos a unit, 300 KB each after compression (assumed) |
| Room left for proofs and documents | About 1.9 GB | 2 GB minus photos |
| Our cost if an owner goes over | About ₱1.34 per extra GB a month | Supabase overage of US$0.0213 per GB |
| Owners that fit the included 100 GB | 50 at a full 2 GB each | Most will use far less |
| Database growth | About 0.9 MB an owner a month; 1 GB a year for 100 owners | 60 bookings a month, 15 rows each, 1 KB a row (assumed) |

Raw page views are not stored in our database. Only booking-funnel events are, which keeps growth near this estimate.

## 7. System analysis and design

The design rests on one rule: every claim on a unit's dates, whether a hold, a booking, an owner block or a lease, is one row in one table, and the database refuses any overlap. Everything else in this section follows from that.

### 7.1 Functional requirements

| ID | Requirement | Target |
| --- | --- | --- |
| FR-01 | An owner creates properties and units with photos, amenities, rules and prices | Both |
| FR-02 | A visitor sees which dates a unit is free without signing in | Short |
| FR-03 | The system quotes a total for a date range and guest count, line by line | Short |
| FR-04 | A booking request places a timed hold on the dates | Short |
| FR-05 | A customer uploads a payment proof with a reference number; a reference works once per owner account | Both |
| FR-06 | An owner approves or rejects a proof with a reason; approval confirms the booking or marks the bill paid | Both |
| FR-07 | An unpaid hold expires and frees its dates | Short |
| FR-08 | An owner blocks dates and records bookings taken elsewhere | Short |
| FR-09 | A visitor asks about a unit and requests a viewing time | Long |
| FR-10 | An owner creates a lease from an inquiry: tenant, term, rent, due day, advance, deposit | Long |
| FR-11 | The system creates each rent bill on its due cycle and marks it overdue after the due day | Long |
| FR-12 | Each booking, inquiry and lease has one message thread shared by customer and owner | Both |
| FR-13 | A customer joins as a member with an email code and sees history and stamps | Both |
| FR-14 | Stamps are earned by owner-set card rules; every change is a ledger line | Both |
| FR-15 | Status changes send a push notice to subscribed devices and an email where needed | Both |
| FR-16 | A super admin approves owners, records plan payments and switches features per owner | Platform |
| FR-17 | Funnel events go to Meta from the browser and the server with one shared event ID | Platform |
| FR-18 | An owner edits the property page as a draft and publishes it | Both |

### 7.2 Non-functional requirements

| Quality | Target |
| --- | --- |
| Correctness | Totals, availability and stamps are computed on the server; the phone is never trusted |
| Isolation | Row-level security on every table, plus the same check in the API |
| Performance | Lighthouse mobile 90 or more on the property and unit pages; first-load JavaScript at or under 250 KB gzipped |
| Reliability | Separate live database with daily backups before the first paying owner; a double tap never makes two bookings |
| Privacy | Proofs and ID photos in private storage with timed deletion; no customer data in logs |
| Accessibility | WCAG AA contrast, 44 px touch targets, 16 px inputs, reduced-motion respected |
| Compatibility | Chrome 111 and Safari 16.4 or newer; 360 to 1280 px with no sideways scroll |
| Maintainability | One command checks types, lint and tests; exact package versions; every decision recorded |

### 7.3 Process model

The system has four outside parties that send or receive data: the customer (guest, member or tenant), the owner, the super admin, and outside services (Meta, the email service, browser push services). Money moves between the customer and the owner outside the system; only the proof enters it.

| Process | Input | Output | Main data stores |
| --- | --- | --- | --- |
| P1 Manage listings | Owner's unit details, photos, prices | Published property page | properties, units, rates |
| P2 Check availability and quote | Dates, guests | Free or not; price breakdown | unit\_occupancy, rates |
| P3 Book and hold | Guest details, quote | Held booking with expiry; booking link | bookings, unit\_occupancy |
| P4 Verify payment | Proof and reference; owner's decision | Confirmed booking or paid bill; receipt | payments, payment\_proofs |
| P5 Run the stay | Check-in, check-out, cancellation | Completed or cancelled booking | bookings, booking\_events |
| P6 Run the lease | Inquiry, viewing, lease terms | Active lease; monthly bills | inquiries, leases, bills |
| P7 Reward | Paid stays and bills; owner's rules | Stamps and reward claims | stamp\_ledger, rewards |
| P8 Message and notify | Chat messages, status changes | Push and email | notifications\_outbox, push\_subscriptions |
| P9 Administer platform | Owner sign-ups, plan payments | Approved, paused or suspended accounts | accounts, subscriptions, audit\_logs |
| P10 Track | Funnel events with consent | Events to Meta, deduplicated | meta\_pixels, meta\_capi\_deliveries |

Each process becomes one NestJS module. The diagrams below use the Gane and Sarson symbols: a rounded box is a process, a plain box is an outside party, and a box open on the right is a data store.

**Context diagram**

&#91;embedded content: context diagram · 1 system, 4 outside parties\]

The context diagram fixes the boundary. Anything not drawn here, such as a payment gateway or a calendar feed, is outside MVP A.

**Level 1 data flow diagram**

&#91;embedded content: level 1 data flow diagram · 10 processes, 9 stores, 4 outside parties\]

Each row is one process with the data it takes in, the data it gives back and the stores it reads or writes. Owners get the same notices from process 8 as customers, and process 4 also marks a rent bill paid in D5.

**Rules these diagrams follow** ([Lucid](https://lucid.co/diagram/dfd/tutorial), [Wikipedia](https://en.wikipedia.org/wiki/Data-flow_diagram))

- Every process has at least one input and one output.
- Data reaches a store only through a process. No party writes to a store directly.
- The diagrams are balanced: every flow that crosses the boundary on the context diagram appears on level 1, split into its parts.
- A data flow diagram shows no decisions or loops. Those live in the state diagram below and in the API.
- Any change to a process or store updates these diagrams in the same pull request.

**Level 2: the two riskiest processes, broken down**

| No. | Sub-process | Input | Output | Stores |
| --- | --- | --- | --- | --- |
| 3.1 | Recheck the quote | Accepted quote, dates, guests | Fresh total, or "price changed" | D1 |
| 3.2 | Claim the dates | Unit and date range | One hold row, or "dates taken" | D2 |
| 3.3 | Create the booking | Guest details, price snapshot, idempotency key | Booking number and private link | D3 |
| 3.4 | Queue the notices | New booking | Outbox rows for customer and owner | D7 |
| 4.1 | Receive the proof | File, reference number, amount | Pending payment | D4 |
| 4.2 | Check the reference | Reference number | Accepted, or "already used" | D4 |
| 4.3 | Record the decision | Owner's approve or reject, with a reason | Approved or rejected payment, one event line | D4 |
| 4.4 | Update what was paid | Approved payment | Confirmed booking or paid bill; the hold becomes a booking | D2, D3, D5 |
| 4.5 | Issue receipt and stamps | Approved payment | Receipt, stamp line, notices | D4, D6, D7 |

Steps 3.2 and 3.3 run in one database transaction, so a booking can never exist without its dates.

&#91;embedded content: short-term booking lifecycle · 5 states, 2 exits\]

A short-term booking moves left to right. Its dates stay claimed from Held until it is completed, expired or cancelled. A rejected proof returns it to Held, and the hold's clock keeps running.

### 7.4 Data model

**Replaced on 14 November 2026.** The Database blueprint tab now holds the full data model: 54 tables with every column, the diagrams and the SQL functions. Where it differs from this section, the Database blueprint is correct. This section is kept as the first sketch.

**Rules**

- Every table carries `account_id` and has row-level security, grants and policies in the same migration.
- Money is whole centavos. Stay dates are calendar dates in Manila time, never timestamps.
- A date range is half-open: first night up to, not including, checkout day. A checkout day can be the next guest's check-in day.
- Closed lists (status, kind, mode) are a `CHECK` in the database and one Zod enum in code.
- Ledgers (payments, stamps, booking events, audit) are append-only: no update or delete grants. A correction is a new line.
- A booking stores a snapshot of the prices it was quoted. Later price edits never change an old booking.
- Third normal form by default. A stored total is allowed only where it is a snapshot or a ledger balance.

**The overlap rule**

```sql
create extension if not exists btree_gist;

create table unit_occupancy (
  id          uuid primary key default gen_random_uuid(),
  account_id  uuid not null,
  unit_id     uuid not null,
  during      daterange not null,   -- [first night, checkout day)
  kind        text not null check (kind in ('hold','booking','block','lease')),
  active      boolean not null default true,
  expires_at  timestamptz,          -- holds only
  exclude using gist (unit_id with =, during with &&) where (active)
);
```

A booking, block or lease each owns exactly one row here. An expired hold is switched to inactive by the API inside the same transaction that tries the next booking, and a scheduled API job sweeps the rest. No database cron or trigger carries a rule.

**Entities**

| Group | Tables | Notes |
| --- | --- | --- |
| Platform | accounts, account\_members, profiles, subscriptions, subscription\_payments, feature\_flags, audit\_logs | The owner's access comes from account\_members, never from the URL |
| Listing | properties, units, unit\_photos, amenities, unit\_amenities, house\_rules | A unit has one mode: short stay or long term |
| Price | unit\_rates, rate\_overrides, unit\_fees | Nightly and weekend rate, monthly rent, dated overrides, cleaning and extra-guest fees |
| Occupancy | unit\_occupancy | The only place dates are claimed |
| Customers | customers, customer\_devices | One customer row per owner account; links to a profile when they join |
| Short term | bookings, booking\_events | Status, guests, price snapshot, hold expiry, private token, source |
| Long term | inquiries, viewings, leases, bills, bill\_lines | A bill belongs to one lease and one period |
| Money | payments, payment\_proofs | A payment points to one booking or one bill, enforced by a check |
| Chat | threads, messages | One thread per booking, inquiry or lease |
| Loyalty | stamp\_cards, stamp\_ledger, rewards, reward\_claims | Balance is the sum of the ledger |
| Notify | push\_subscriptions, notifications\_outbox | Outbox rows are retried until sent |
| Tracking | meta\_pixels, meta\_capi\_deliveries | Scope is platform, account or property |
| Files | files | Size per owner for the storage pool |

Identical rooms (five of the same room type) are five unit rows in MVP A. A room-type inventory count is a later change and is listed in section 16.

**Entity relationship diagram**

&#91;embedded content: entity relationship diagram · 15 core tables\]

A booking or a lease never stores its own dates as the source of truth. Each owns one row in `unit_occupancy`, and that table is where the database refuses an overlap. The remaining tables in the list above hang off these 15 in the same way and are drawn on their table pages.

**Normalisation check** ([Microsoft Learn](https://learn.microsoft.com/en-us/office/troubleshoot/access/database-normalization-description))

| Form | Rule | How this model meets it |
| --- | --- | --- |
| First | One value per cell and a key on every row | Photos, amenities, fees and bill lines are child tables, never a list inside a column |
| Second | Every column depends on the whole key | Every table has a single-column `id`; the join table `unit_amenities` holds only the pair |
| Third | No column depends on another non-key column | An address lives on `properties` only; a customer's name lives on `customers` only |
| Allowed exception | A stored total that is a snapshot or a ledger balance | The price snapshot on a booking, the total on an issued bill |

**Data dictionary.** Phase 1 writes one page per table group in `docs/database/`. Each page lists every column with its type, its rule, an example value and the policy that guards it. No migration is written before its page is approved.

### 7.5 Key algorithms

| Problem | Approach | Cost |
| --- | --- | --- |
| Is a range free? | Range-overlap lookup on the GiST index behind the exclusion constraint | Logarithmic in the unit's rows |
| Two guests book the same dates at once | Both inserts hit the constraint; the second fails with a clear error code | No application lock needed |
| Price a stay | Walk each night once; pick the override, else weekend, else base rate; add fees | Linear in nights |
| Double tap on Book | An idempotency key from the phone; the same key returns the first result | One unique index |
| Booking numbers | A per-account counter row updated in the booking transaction | Gap-free, no sequence |
| Monthly bills | A scheduled API job creates the next bill per active lease; a unique key on lease and period makes reruns safe | Linear in active leases |
| Stamps | Computed from paid bookings and bills by the owner's rule; reversed by a ledger line if the payment is undone | Linear in payments |

### 7.6 Object model

| Concept | Where | Why |
| --- | --- | --- |
| Value objects: Money, DateRange, Quote | `packages/core` | One tested place for centavo maths and range logic, shared by the API and the screens |
| State machines: booking, bill, lease, subscription | `packages/core` | Allowed moves are data, so the API and the screens cannot disagree |
| Mode packs: short stay, long term | `packages/core` | Words and behaviour come from the pack, never from an `if` on the mode scattered in screens |
| Pricing and stamp card rules | Strategy objects in `packages/core` | New rule types in MVP B are added, not edited in |
| Modules per process | `apps/api` | Each owns its routes, service and tests; only the API talks to the database |

### 7.7 Sitemap

**Replaced on 14 November 2026.** The Feature blueprint tab now holds the sitemap: 40 routes, with a brief for every page. Where it differs from this section, the Feature blueprint is correct.

The system has three apps and 27 planned routes. Route names are for planning; each screen's layout comes from its own research pass.

| App | Route | Who | Purpose |
| --- | --- | --- | --- |
| Property app | `/` | Anyone | Property home: photos, units, rules, location |
| Property app | `/units/<unit>` | Anyone | Unit page: dates and price (short stay) or rent and terms (long term) |
| Property app | `/book` | Guest | Details, price breakdown, place the hold |
| Property app | `/b/<token>` | Guest | Booking thread: status, proof upload, chat, voucher |
| Property app | `/inquire` | Guest | Inquiry and viewing request |
| Property app | `/join` | Guest | 6-digit email code |
| Property app | `/account` | Member | History, stamps, rewards, saved details |
| Property app | `/account/lease` | Tenant | Lease, bills, receipts, pay rent |
| Property app | `/install` | Anyone | Install and notification steps |
| Dashboard | `/login`, `/onboarding` | Owner | Sign in; first property setup |
| Dashboard | `/home` | Owner | Today: arrivals, proofs to check, rent due |
| Dashboard | `/calendar` | Owner | Occupancy, blocked dates, manual bookings |
| Dashboard | `/bookings` | Owner | Booking board and detail |
| Dashboard | `/units` | Owner | Units, photos, prices |
| Dashboard | `/tenants` | Owner | Leases, bills, move-out |
| Dashboard | `/guests` | Owner | Guests, members, stamps |
| Dashboard | `/payments` | Owner | Proofs, approvals, receipts |
| Dashboard | `/editor` | Owner | Property page draft and publish |
| Dashboard | `/settings` | Owner | Payment accounts, policies, stamp card rules, plan |
| Super admin | `/admin/owners` | Founder | Approve, pause, suspend |
| Super admin | `/admin/plans` | Founder | Plan payments and states |
| Super admin | `/admin/usage` | Founder | Storage and activity per owner |
| Super admin | `/admin/pixels` | Founder | Meta pixels and event switches |
| Super admin | `/admin/flags` | Founder | Feature switches per owner |
| Super admin | `/admin/audit` | Founder | Audit log |
| Development only | `/kit` | Builders | Every installed component and pattern |

### 7.8 Main flows

**A guest books a stay** (processes 2, 3, 4, 5, 8)

1. Opens the property link and picks a unit.
2. Picks dates and guests; sees the full price.
3. Types name, mobile and email; taps Reserve. The dates are held.
4. Pays the owner by GCash, Maya or bank, outside the app.
5. Uploads the proof and reference number in the booking thread.
6. The owner approves. The booking is confirmed and a receipt is sent.
7. Gets check-in details and a voucher; is invited to join and install.
8. Checks in and out. A stamp is added if the owner runs a stamp card.

**A tenant rents a unit** (processes 6, 4, 8)

1. Opens a unit page and sends an inquiry or a viewing request.
2. The owner confirms a viewing time in the thread.
3. Pays a reservation with proof; the owner approves.
4. The owner creates the lease: term, rent, due day, advance, deposit.
5. The system creates each month's bill and reminds the tenant.
6. The tenant pays with proof; the owner approves; a receipt is issued.
7. At move-out the owner records deductions and the deposit returned.

**An owner starts** (processes 9, 1)

1. Signs up and waits for approval.
2. The founder approves in super admin; the 14-day trial starts.
3. Adds a property, its units, photos and prices.
4. Adds payment accounts and house rules, then publishes.
5. Shares the link and QR.
6. Pays the plan with proof before the trial ends.

### 7.9 Demo and test data

Demo data has one source and two uses, so a screen can never look finished on data the database does not hold.

| Item | Rule |
| --- | --- |
| Fixtures | Four demo properties live in `packages/core/src/demo`, typed by the same Zod schemas the API uses |
| Seed | One script loads those fixtures into the development database through the API's own services |
| Mock adapters | Allowed only for `/kit` and unit tests, in `packages/data/src/mocks`. Screens never import them |
| Done | A screen counts as done only against the seeded development database |
| Reset | One command wipes and reseeds the development database; it can never run against live |

**Updated 16 November 2026.** During the screens-first stage of each wave (Build roadmap tab), the mock adapters in `packages/data` also feed the screens. Two rows above still hold: screens never import the mocks themselves, and a screen counts as done only against the seeded development database.

The food app kept mock adapters as the data source for every screen. Here the seed replaces them from the first slice.

## 8. Architecture and integration

The system is a strict three-tier design: browser, then the NestJS API, then Postgres. No screen ever calls Supabase directly, including for login.

&#91;embedded content: system architecture · 3 clients, 1 API, 3 stores, outside services\]

The API is the single place where rules live, so a rule can never differ between the property app and the dashboard. Row-level security in the database is the backup, never the only guard.

### 8.1 Layers

| Layer | Technology | Host | Rule |
| --- | --- | --- | --- |
| Property app | Next.js App Router, installable through Serwist | Vercel | Light theme; each property has its own manifest so it installs as its own app |
| Owner dashboard and super admin | Vite, React, TanStack Router and Query | Vercel | Super admin is a separate route tree, loaded only for the platform role |
| API | NestJS on Express, Zod-validated input | Railway | Every route is marked public or guarded; the owner account comes from membership, never from the URL or body |
| Data | Postgres, Auth and Storage on Supabase | Supabase, Singapore | Schema changes only through migration files |

### 8.2 Repository shape

A new repository with the same layout as the food app, started from a cleaned copy of its foundation (tooling, lint walls, tokens, installed UI parts), not from its feature code.

| Folder | Holds |
| --- | --- |
| `apps/storefront` (named `apps/stays` until 16 November 2026) | The property app |
| `apps/dashboard` | Owner dashboard, super admin, `/kit` |
| `apps/api` | NestJS modules, one per process in section 7.3 |
| `packages/core` | Zod schemas, value objects, state machines, mode packs, words, error codes |
| `packages/ui` | Tokens, one stylesheet, installed components |
| `packages/data` | API client, query hooks, mock adapters |
| `supabase/migrations` | SQL only |
| `docs` | The document set in section 14 |

The alternative is to add these apps to the food monorepo and share `packages/ui`. It saves duplicate component work but ties this system to a repository whose backend is not yet proven. Section 16 lists this as a decision.

### 8.3 Integrations

| Service | Direction | Used for | If it fails |
| --- | --- | --- | --- |
| Supabase Auth | API to Supabase | Owner passwords, customer email codes | Sign-in shows one generic error; nothing else stops |
| Supabase Storage | API issues a signed upload; the browser uploads the file | Photos, proofs, documents | The upload is retried; the booking is already saved |
| Resend | API to Resend, through the outbox | Email codes, receipts, owner alerts | Outbox retries; the booking page still shows the status |
| Web push | API to browser push services, through the outbox | Status notices | Dropped quietly; push is a bonus, the booking link is the record |
| Meta Conversions API | API to Meta, through the delivery ledger | Server-side funnel events | Marked failed and retried; never blocks a booking or a payment approval |
| Payment gateway, calendar sync | MVP B | Automatic confirmation, Airbnb calendars | Not built in MVP A |

Every outgoing call goes through a queue table and carries a stable ID, so a retry can never send the same thing twice with a different meaning.

### 8.4 Environments and domains

| Environment | Database | Purpose |
| --- | --- | --- |
| Development | Supabase free project | Building and demos; demo properties only |
| Live | Separate Supabase Pro project | Real owners; created before the first paying owner |

Proposed addresses, all on the domain already owned: `stay.webserbisyo.com/<property>` for the property app, `host.webserbisyo.com` for the dashboard, `api-stay.webserbisyo.com` for the API.

### 8.5 Growth path

| Stage | Owners | What changes |
| --- | --- | --- |
| Build | 0 | Free tiers; API runs locally |
| Launch | 1 to about 100 | Supabase Pro, Vercel Pro, Railway Hobby, Resend free |
| Growth | About 100 to 300 | Larger database compute; Resend Pro; a shared store for rate limits once the API runs as more than one copy |
| Scale | 300 and up | Images served from a CDN or cheaper object storage; a job queue; a read replica for reports |

Each step is a configuration change, not a rewrite, because the API keeps no state in memory, files sit behind one module, and outgoing work already passes through a queue table.

## 9. Stack and dependencies

The stack is the food app's, carried over as pinned in its repository on 13 November 2026, plus a short list of additions this system needs. Every version is rechecked against the official docs in the new repository's first task.

### 9.1 Carried over

| Layer | Packages and pinned versions |
| --- | --- |
| Workspace | pnpm 12.8.1, Turborepo 2.11.7, Node 24.14 (pinned for the founder's Mac), TypeScript 6.0.3 |
| Property app | Next.js 16.4.2, React 19.3.0, Serwist 9.5.13 with `@serwist/turbopack`, Tailwind CSS 4.3.3 |
| Dashboard | Vite 8.3.4, TanStack Router 1.170.42, TanStack Query 5.104.1, React Hook Form 7.89.0, Zod 4.6.6 |
| API | NestJS 12.1.2 on Express, `@nestjs/config`, Terminus health checks, Helmet 8.3.0, jose 6.2.12, supabase-js 2.117.3 |
| Database | Postgres on Supabase, Supabase CLI 2.120.0 for migrations |
| Quality | ESLint 10.12.0, Prettier 3.9.10 with the Tailwind plugin, Vitest 5.0.3, Playwright 1.64.1 smoke tests in CI |

### 9.2 UI libraries: what each one is and what we use it for

| Library | What it is | Use in this system |
| --- | --- | --- |
| shadcn on Base UI | A command-line tool that copies component source into `packages/ui`; Base UI supplies the accessible behaviour underneath | Buttons, dialogs, sheets, forms, tabs, tables: the base of every screen |
| ReUI | A shadcn-compatible registry of richer parts | Event Calendar for the owner's Calendar, Kanban for the booking board, Data Grid, Sortable, Color Picker |
| DiceUI | A shadcn-compatible registry of utility parts | Photo cropper, action bar for bulk actions, avatar group |
| Magic UI | A registry of small animated parts | Number ticker and CSS-only effects, used sparingly |
| EvilCharts | Chart components from a shadcn registry, built on Recharts and Motion | Dashboard Home and Payments charts, loaded lazily |
| Recharts | The charting engine under the chart parts | Bars, areas, rings |
| Opensource UI | A registry used for the week strip and booking-slot picker | Viewing-time picker for long-term inquiries |
| Lucide | The one icon set | Every interface icon; a status is always icon, word and colour |
| Simple Icons | Brand marks | Payment and social logos |
| DiceBear | A library that draws an avatar from a seed, in many styles | Default faces for customers and owners; some styles need a credit line |
| Storyset | Free illustration sets from Freepik that require a credit | Optional art for empty and welcome states. The food app mostly chose Fluent Emoji 3D (MIT) to avoid the credit; decide per use and recheck the licence |
| Motion | Animation library | Short moments under 400 ms, off for reduced motion, loaded lazily |
| tw-animate-css | CSS animation utilities | Open and close animations for shadcn parts |
| Embla Carousel | Touch carousel | Unit photo galleries, the most used part in this system |
| react-day-picker, date-fns, `@date-fns/tz` | Calendar picker and date maths with time zones | Date-range picker and Manila dates |
| TanStack Table and Virtual | Table logic and long-list rendering | Bookings, tenants, bills lists |
| dnd-kit | Drag and drop | Photo order, calendar moves, board columns |
| input-otp | One-time-code input | The 6-digit email code |
| qrcode | QR generator | Voucher and share QR |
| canvas-confetti | Confetti burst | Reward moments only |
| Fontsource | Self-hosted variable fonts | Property font pairs without a font CDN |
| Material Color Utilities | Palette maths from one colour | Property theme from the owner's logo or brand colour |

### 9.3 Additions to approve

Each needs your yes and a version check on the day it is installed.

| Need | Candidate | Why |
| --- | --- | --- |
| Request limits | [`@nestjs/throttler`](https://docs.nestjs.com/security/rate-limiting) | The official NestJS rate limiter; limits per route |
| Timed jobs | `@nestjs/schedule` | Hold expiry sweep, monthly bills and reminders, with no database cron |
| Sending web push | `web-push` | Sends push from the API; Serwist handles the receiving side |
| Full-screen photos | A lightbox from an installed registry, on top of Embla | Swipe and zoom on unit photos |
| Search state in the link | `nuqs` | Dates and guest count live in the address, so a shared link opens the same search |
| Map | A plain link to Google Maps at launch | No map code to load; an embedded map is MVP B |
| Calendar feeds, online payments | Chosen in MVP B | Not installed in MVP A |

### 9.4 Dependency rules

- Exact versions, no `^`; no release younger than 7 days unless it fixes a security issue.
- Components come from the installed registries through the shadcn CLI. A hand-written component needs your yes first.
- Every install updates the component registry document and gets a section on `/kit` in the same change.
- No new package without your yes, except what the shadcn CLI adds with a planned component.

## 10. Security and privacy

First launch ships with a basic rate limiter, owner isolation tested per table, safe file handling and an audit log. Anything heavier waits for MVP B.

### 10.1 Threats and controls

| Threat | Control in MVP A |
| --- | --- |
| One owner sees another's data | `account_id` on every table, row-level security, the same check in the API, and one cross-owner test per table. Another owner's page answers Not found |
| Guessing a password or email code | Rate limit on sign-in routes; one generic error for every failed sign-in; codes expire and allow few tries |
| Someone holds every date to block a rival | A cap on unpaid holds per customer; holds expire; the owner can require a down payment |
| Fake payment screenshot | A reference number works once per owner account; the owner checks their own wallet; every approval is logged. A picture alone never confirms anything |
| Harmful or huge uploads | File type checked from its first bytes, 15 MB cap, compressed on the phone, private storage, short-lived signed links |
| Leaked keys | Secrets only in environment variables checked at start; never in the repository, which is public; the database service key lives only in the API |
| Script injection through owner text | Owner text is rendered as text, never as HTML; security headers from Helmet |
| Requests from other sites | Allow-list of our own origins on the API; session cookies that scripts cannot read |
| A bad package release | Exact versions, 7-day minimum release age, security overrides, an audit step in CI |
| Super admin mistakes | Every super admin action writes an audit line with who, what and when |

### 10.2 Rate limiter plan

Built with `@nestjs/throttler`, which counts requests in the API's memory by default and needs proxy awareness to see the real visitor address ([NestJS docs](https://docs.nestjs.com/security/rate-limiting)). One API copy runs at launch, so memory counting is enough. The numbers are starting points to tune from logs.

| Route group | Limit | Counted per |
| --- | --- | --- |
| Public pages data: property, availability, quote | 120 a minute | Visitor address |
| Create booking or inquiry | 5 per 10 minutes | Visitor address and device |
| Request an email code, sign in | 5 per 15 minutes | Visitor address and email |
| Ask for an upload link | 20 an hour | Booking or bill |
| Send a message | 30 a minute | Thread |
| Owner dashboard routes | 300 a minute | Signed-in user |
| Tracking events | 60 a minute | Visitor address |

Business limits sit beside these and are stored rules, not request counts: at most 2 unpaid holds per customer per owner account, at most 3 proof files per payment, and a maximum hold length the owner cannot exceed.

### 10.3 Privacy plan

| Item | Rule |
| --- | --- |
| Consent | One line at booking that links to the property's privacy page; separate unticked boxes for promos and for ad audiences |
| Payment proofs | Private; deleted 30 days after approval unless the owner exports them first |
| ID photos | Only if the owner turns the request on; deleted 7 days after checkout or move-out (proposed) |
| Lease and bill records | Kept while the lease is active; retention after move-out is an open legal question |
| Push messages | Never contain names, amounts or addresses; they say a status and link to the booking |
| Logs | No customer names, emails, phone numbers or tokens |
| Customer requests | A member can see, correct and delete their account data; bookings stay with the owner as business records |

Philippine data privacy duties (registration, privacy notice wording, breach steps) were not researched for this proposal. They are a launch gate in section 16.

## 11. Data, tracking and Meta Pixel

Two funnels are tracked: ours (an owner signs up and pays) and each property's (a visitor books or inquires). The browser Pixel and the server Conversions API send the same event with one shared ID, so Meta counts it once.

### 11.1 Pixel scopes

| Scope | Whose Pixel | Runs on | Never on |
| --- | --- | --- | --- |
| Platform | Smart App PH | Our marketing and owner sign-up pages | Property pages, dashboard, super admin, login |
| Account or property | The owner's own Pixel ID and token | That owner's property pages | Any other owner's pages; dashboard |

The owner pastes a Pixel ID and access token in Settings. The token is stored encrypted and is never sent back to a browser.

### 11.2 Short-term event map

Meta's travel ads use four events with the parameters below ([Meta hotel events](https://developers.facebook.com/documentation/ads-commerce/marketing-api/hotel-ads/events.md)).

| Step in our app | Event | Parameters |
| --- | --- | --- |
| Property page opened with dates | `Search` | `city`, `region`, `country` (required); `checkin_date`, `checkout_date`; `content_ids` of the units shown |
| Unit page | `ViewContent` | `content_ids` (required); dates; `num_adults`, `num_children` |
| Booking form opened | `InitiateCheckout` | `content_ids` (required); dates; guests |
| Dates held | `BookingRequested` (custom) | Unit, dates, quoted total |
| Owner approves the proof | `Purchase`, server only | `content_ids`, `value`, `currency` PHP (required); dates |

`content_type` is `hotel` on all four standard events. Dates go as `YYYY-MM-DD`.

### 11.3 Long-term event map

Meta's real estate ads use the same four standard events with listing parameters ([Meta real estate events](https://developers.facebook.com/documentation/ads-commerce/marketing-api/real-estate-ads/audience)).

| Step in our app | Event | Parameters |
| --- | --- | --- |
| Units list | `Search` | `content_ids`; `city`, `region`, `country`; `listing_type` `for_rent_by_owner` |
| Unit page | `ViewContent` | `content_ids` (required); `property_type` (`apartment`, `condo`, `house`, `other`); `availability` `for_rent`; `lease_start_date` |
| Inquiry sent | `Lead` | Unit, monthly rent as value |
| Viewing requested | `Schedule` | Unit |
| Reservation started | `InitiateCheckout` | `content_ids` |
| Owner approves the reservation proof | `Purchase`, server only | `content_ids`, `value`, `currency` |

Meta limits ad targeting for housing in some countries. Whether that applies to Philippine campaigns was not checked and should be confirmed before owners run rental ads.

### 11.4 Rules carried over from the RSVP system

- **One ID per event.** The ID is built from a stable reference, for example `Lead:<inquiry reference>` or `Purchase:<payment id>`, and is the same in the browser and on the server.
- **A delivery ledger.** One row per provider, event name and event ID, unique. The server claims the row before calling Meta and records pending, sending, sent or failed. A retry can never create a second event.
- **Each server event behind its own switch, off by default.** Turn on one at a time in test mode with a test event code, then go live.
- **Tracking never blocks business.** A failed or disabled send never undoes a booking or a payment approval.
- **Manual payments are honest.** `Purchase` is sent when the owner approves, with the stored amount, and without the owner's own address or browser details.
- **No personal data in logs.** The audit line holds the event name, ID and result only.

What changes: the logic moves from Next.js server code into a NestJS tracking module, and the scopes become platform, account and property.

### 11.5 Our own numbers

Every figure is computed from bookings, bills, payments and the stamp ledger. Nothing is typed in or stored twice.

| Metric | Formula | For |
| --- | --- | --- |
| Occupancy | Booked nights divided by available nights | Short term |
| Average nightly rate | Stay revenue divided by booked nights | Short term |
| Request-to-confirmed rate | Confirmed bookings divided by booking requests | Short term |
| Hold expiry rate | Expired holds divided by all holds | Short term |
| Lead time and length of stay | Median days from booking to check-in; median nights | Short term |
| Repeat guest rate | Guests with 2 or more completed stays divided by guests with 1 or more | Short term |
| On-time collection | Bills paid by the due day divided by bills issued | Long term |
| Days late | Median days between due day and approved payment | Long term |
| Vacancy | Days a long-term unit had no active lease | Long term |
| Activation | Owners who publish a unit within 7 days of sign-up | Platform |
| Trial to paid, monthly churn, monthly recurring revenue | Standard subscription measures | Platform |

Two rules from the food app carry over: use rolling windows (last 30 days) so the first of the month never looks empty, and use medians for typical values because one long stay distorts an average.

A small funnel-events table (event, unit, time, anonymous session) is kept for 90 days to draw the booking funnel. Reports run as plain SQL views behind the API; owners can export CSV.

## 12. UX approach and the kit page

No screen is designed in this proposal. Each area gets its own research pass, then a proposal you approve, then the build; this section fixes the bar every screen must clear.

### 12.1 How each area is designed

1. Research references for that one area (design galleries, component showcases, the products in section 5) and note what works.
2. Cross-check against what is already installed and shown on `/kit`. Prefer an installed part over a new one.
3. Write a short proposal with options and a recommendation. You pick.
4. Build it against the API contract for that area.
5. Retest as two different owners: a staycation host and an apartment landlord.

### 12.2 Principles

| Principle | Rule in this system |
| --- | --- |
| Show the system's state | A booking or bill always shows its status as icon, word and colour. A held date shows its expiry time |
| Speak the user's words | Reserve, down payment, advance, deposit, due date. Plain English with local words where natural |
| Prevent the error | Unavailable dates cannot be picked. A price is rechecked before a booking is placed |
| Undo over confirm | A reversible action happens at once with Undo in a toast. A confirm box is only for what cannot be undone |
| One main action per screen | One primary button, placed where a thumb reaches |
| Recognise, do not recall | Remembered guest details, last dates searched, the tenant's current bill on the first screen |
| Consistency | One booking card and one bill card used on every list, panel, calendar and receipt |
| Fast feedback | Skeletons instead of spinners; a button shows saving, then saved |

### 12.3 The bar for every screen

- States: loading, empty with one action, error with Try again, offline, paused account, very long text, very large amounts
- Sizes: 360 to 1280 px with no sideways scroll; 44 px touch targets; 16 px input text
- Motion: under 400 ms and off when the device asks for reduced motion
- Contrast: every text pair at WCAG AA, including on an owner's brand colours
- Proof: screenshots at 390 and 1280 px, zero console errors, on a short-term and a long-term demo property

### 12.4 Install and push

On iPhone and iPad, a web app can ask for notification permission only after it is added to the Home Screen, on iOS 16.4 or later, and only from a tap ([WebKit](https://webkit.org/?p=13878)). So push is a bonus. The booking link and the email receipt are the record every customer can rely on. The install card appears after a first booking or after joining, with the steps for iPhone.

### 12.5 The kit page

The `/kit` page works as in the food app: every installed component has a section, every reusable pattern for an area is added before that area's screens are built, and it never ships to customers. It is where a new agent or AI learns what exists before writing anything.

Four demo properties drive the kit and every test: two short-term (a condo staycation and a private house) and two long-term (an apartment building and a boarding house with bed spaces). Their names and photos are yours to choose.

### 12.6 Usability check before launch

Five people per target complete set tasks on their own phones: book two nights and send a proof; find and pay this month's rent. Record task time, errors and a System Usability Scale score, as planned in the food app's research document.

## 13. Lessons from the food and retail build

The food app got its rules, tooling and screens right, and its order of work wrong: four weeks in, every screen runs on mock data and no area is wired to the database. This system keeps the first and reverses the second. These findings come from both repositories' own documents and package files; I did not read every source file.

### 13.1 Keep

| Practice | Evidence in the food repository |
| --- | --- |
| A decision log with IDs, dates and your exact words | `docs/decisions.md`, decisions T1 to T85 |
| Rules enforced by tools, not by trust | Import walls and token-only styling in ESLint, with tests for the walls themselves; CI on every change |
| One schema for screens, mocks and API | Zod schemas in `packages/core`; `docs/api.md` as the contract |
| Library-first components with a registry and `/kit` | `docs/components.md`; the hand-written list is short and approved |
| Careful package hygiene | Exact versions, 7-day release age, recorded security overrides |
| Strict three tiers | Decision T34: no Supabase calls from screens, no rules hidden in triggers |
| Error codes and words in one place | Closed error list; `words.ts` |
| Proposal, your pick, then build | Every large page has an approved proposal behind it |

### 13.2 Change

| What went wrong | Evidence | Rule for this system |
| --- | --- | --- |
| Screens first, data last | Phases 2 and 3 are complete; phase 4 (backend) has one unticked line. One migration exists, dated 18 October. Every feature box in the README is still unticked because a tick needs the real database | Build each area as a thin slice: tables, API, then screen. The occupancy tables come first of all |
| MVP A kept growing | Advance ordering, a kitchen view, a style designer, font pairs and avatar sets were all added after the scope was accepted on 18 October (T48, T52, T76, T79, T80). The system paper's own first risk is "scope grows again" | Section 3 is the list. A new idea goes to a parking list. To add one item to MVP A, remove one |
| Documents outgrew their own rule | The rule says docs stay short. The blueprint is 163 KB, the component registry 154 KB, the decision log 86 KB with single decisions several hundred words long | A size budget per document. A decision is one line that links to its proposal |
| Documents disagree | Price is "open: ₱599 or ₱799" in three documents while decision T67 sets ₱399. The research document plans a Supabase Realtime order feed that T34 and T53 forbid | One home per fact. A decision that changes an earlier one edits the earlier line. A document check closes every area |
| The quality gate was removed | Decision T40 allowed pushing to main without running checks, to spare a slow laptop. Later fixes include a toaster mounted only on `/kit` (T43) and a colour block that broke contrast (T44) | Main stays protected. CI on the pull request is the gate, so the laptop never has to run it |
| Polish before proof | Three storefront rounds and a final polish of every page, all on mock data | One polish round per area, after it runs on real data |
| Admin and tracking deferred | The founder approves shops by SQL; Pixel and Conversions API are MVP B | Both are in MVP A here, kept small |
| A budget set late | First-load JavaScript measured 286.6 KB; the budget was raised to 300 KB to fit it | The 250 KB budget is checked in CI from the first screen |
| Decision numbers collided | Several entries note they were "planned as" a different number | One counter, taken when the decision is written |

### 13.3 From the RSVP system

| Lesson | Detail |
| --- | --- |
| Reuse the design, not the code | RSVP is a single Next.js app with server actions, Radix parts and `^` version ranges. This system has a NestJS API, Base UI parts and exact versions |
| The tracking design is proven | Event IDs from stable references, a delivery ledger, one switch per event, and a test mode |
| A database ledger document helps, until it bloats | RSVP has 66 migrations and a 90 KB database blueprint. Keep ours as one page per table group |

### 13.4 Constraints that stay

Your Mac pins Node at 24.14 and cannot run Docker, so some packages stay on older versions and database types come from CI. These go on one environment page in the new repository so no agent rediscovers them.

## 14. Methodology, roadmap and working rules

The build runs in ten phases, each closed by a test on the real development database, not by a screen that looks finished. No dates are set; the order and the exit tests are the plan.

### 14.1 Methodology

The project uses a descriptive and developmental design: describe the problem with owner interviews and a review of existing systems, build the system in short slices, then evaluate it against a published quality model. This is the chapter a capstone paper calls Methodology.

| Part | Method used here | Output |
| --- | --- | --- |
| Research design | Descriptive (interviews, competitor review, review of our two older repositories) plus developmental (build, test, evaluate) | Sections 2, 5 and 13 |
| Respondents | Purposive sampling: 5 staycation hosts and 5 landlords for interviews; 5 guests and 5 tenants for usability tests | Interview notes; test records |
| Why 5 per group | Five testers of one kind find about 85% of usability problems, and two distinct groups need at least 3 to 4 each ([Nielsen Norman Group](https://www.nngroup.com/articles/why-you-only-need-to-test-with-5-users/)) | Two groups of 5 |
| Data gathering | Semi-structured interview guide; observation of how owners take bookings today; document analysis | Confirmed or corrected assumptions in section 16.4 |
| Development model | Iterative and incremental. Each area is one vertical slice: tables, then API, then screen | One working area per iteration |
| Borrowed from Scrum | A goal per iteration, an ordered backlog (section 14.2), a review with you at the end, and a Definition of Done ([Scrum Guide 2020](https://scrumguides.org/scrum-guide.html)) | The task steps in section 14.4 |
| Not borrowed | Daily meetings and the three Scrum roles, because one founder works with AI agents | The review seats in section 14.5 |
| Analysis and design tools | Context diagram, level 1 data flow diagram, entity relationship diagram, state diagram, data dictionary, architecture diagram | Sections 7 and 8; docs/database/ |
| Testing levels | Unit tests, API tests on the real development database, one cross-owner test per table, browser smoke tests, usability tests | A passing exit test per phase |
| Evaluation | ISO/IEC 25010:2023 product quality model, plus the System Usability Scale for customers | The table below |
| Statistical treatment | Frequency and percentage, weighted mean on a 5-point scale, and the standard SUS score | Section 12.6 and the launch report |
| Ethics | Written consent before every interview and test; no real customer data in test records | Section 10.3 |

**Definition of Done for every slice.** Work is not done until all six are true:

1. Its exit test passes on the real development database.
2. The cross-owner test still passes.
3. CI is green on the pull request.
4. The diagrams and table pages still match the code.
5. Any new pattern is on `/kit`.
6. Decisions and progress are recorded in one line each.

**Evaluation plan.** ISO/IEC 25010:2023 names nine quality characteristics ([ISO](https://www.iso.org/standard/78176.html)). Each one has a measure in this project. The nine names are written from my knowledge of the standard; the ISO page confirms the count, and the full text is paid.

| Characteristic | How this project measures it |
| --- | --- |
| Functional suitability | Each of FR-01 to FR-18 has a passing acceptance test |
| Performance efficiency | Lighthouse mobile 90 or more; LCP 2.5 s or less, INP 200 ms or less, CLS 0.1 or less at the 75th percentile ([web.dev](https://web.dev/articles/defining-core-web-vitals-thresholds)); first-load JavaScript 250 KB or less |
| Compatibility | Works on Chrome 111 and Safari 16.4 or newer, from 360 to 1280 px |
| Interaction capability | SUS of 68 or more as the floor and 80 as the goal; task completion and time; WCAG 2.2 AA checks |
| Reliability | Daily backups restored once in a drill; the double-tap and hold-expiry tests pass |
| Security | The checklist in section 10 and the cross-owner test |
| Maintainability | One command runs types, lint and tests; module walls are enforced by lint |
| Flexibility | The same build runs on development and live from configuration only; features switch per owner |
| Safety | No physical risk. Harm to money records is covered by append-only ledgers |

A SUS score of 68 is the average across about 500 studies, so 68 is the lowest acceptable result and 80 is the goal ([UXPA Magazine](https://oldmagazine.uxpa.org/sustified)).

Owners and three IT evaluators answer a 5-point questionnaire built on the nine characteristics. Customers answer the 10-item SUS after the usability tasks.

### 14.2 Phases

| Phase | Work | Done when |
| --- | --- | --- |
| 0. Validate | Five owner interviews per target; settle the open decisions in section 16 | You sign off scope and price |
| 1. Foundation documents | Requirements, data flow diagrams, entity diagram, table pages, API contract for the first area | The database document is reviewed line by line |
| 2. Repository foundation | New repository from the cleaned foundation; CI; sign-in; owner accounts; the cross-owner test harness; `/kit`; demo properties | Checks are green and the cross-owner test fails when a policy is removed |
| 3. Listing and availability | Properties, units, prices, occupancy, quote: tables, API, then screens | A visitor sees real free dates and a real price |
| 4. Booking and payment | Hold, thread, proof, approval, voucher, push and email | A full booking completes between two phones |
| 5. Owner tools | Calendar, booking board, blocked dates, manual bookings, unit editor | An owner runs a day without help |
| 6. Members and stamps | Join, history, stamp card rules, rewards | Stamps earned from a paid stay unlock rewards used on the next |
| 7. Super admin, plans, tracking | Owner approval, plan payments, storage view, pixels, Lead and Purchase events | You onboard an owner with no SQL |
| 8. Long term | Rental unit pages, inquiry and viewing, lease, bills, rent payment | One full monthly bill cycle runs for a test lease |
| 9. Launch | Live database and backups, privacy pages, usability tests, pilot owners | The first owner pays |

### 14.3 Document set

These files live in the new repository so any person or AI can pick the project up cold.

| Document | Holds |
| --- | --- |
| `README.md` | What the system is, how to run it, the feature list (a box is ticked only when it works on the real database) |
| `AGENTS.md` | One page of rules for any AI agent: shape, commands, hard rules, the steps of every task |
| `docs/PROPOSAL.md` | This paper |
| `docs/SCOPE.md` | The MVP A list, the parking list, MVP B |
| `docs/database/` | Entity diagram, data flow diagrams, one page per table group |
| `docs/api.md` | The contract for each area, written before its screens |
| `docs/decisions.md` | One line per decision, linked to its proposal |
| `docs/ux.md`, `docs/design-tokens.md` | The screen bar from section 12; tokens |
| `docs/components.md` | The component registry |
| `docs/research/` | One file per area's research pass |
| `docs/environment.md` | Machine limits and pinned versions |
| `docs/PROGRESS.md`, `docs/CHANGELOG.md` | One line per task |
| `docs/prompts/` | The prompt used for each task |

### 14.4 Working rules

- One task, one branch, one pull request. CI is the gate. You merge.
- A migration needs your explicit yes, and only you apply it to a hosted database.
- Every task: a short plan, your OK, the build, checks, screenshots, one line in progress, decisions recorded.
- An agent stops and asks when something has no clear home or two documents disagree. It never picks silently.
- Nothing important lives only in a chat. If it matters, it is in the repository.

### 14.5 Roles every task is checked against

One person and AI agents do the work, so each task is reviewed from these seats before it is called done.

| Seat | Question it asks |
| --- | --- |
| Product manager | Is this on the MVP A list, and what is the acceptance test? |
| Systems analyst | Which requirement and which process does it serve? Are the diagrams still true? |
| Data engineer | Is the table normalised, constrained and isolated? Can every report number be recomputed from ledgers? |
| Software architect | Does it keep the three tiers and the module boundaries? |
| Backend engineer | Is the rule in the API, validated, idempotent and tested? |
| Frontend engineer | Installed parts only, all states, inside the JavaScript budget? |
| UX designer | Does it clear the screen bar for both targets on a phone? |
| Security engineer | Guarded route, rate limit, no data in logs, safe files? |
| QA | Does the exit test pass on the real database, and does the cross-owner test still pass? |
| Operations | Can it be deployed, backed up and rolled back? |
| Business owner | Does it help an owner earn or save more than ₱599 a month? |

## 15. Course mapping

Each course in the brief shows up as a concrete part of this plan. The researched rule for each topic, written against PostgreSQL, Supabase, NestJS and TypeScript and with its source, is in the Knowledge base tab. Your school's own syllabi were not read.

| Course | Topics applied | Where in this paper |
| --- | --- | --- |
| Systems Analysis and Design | Requirements, feasibility study, data flow diagrams, entity modelling, normalisation, state diagrams | Sections 6.1, 7.1 to 7.4; `docs/database/` |
| Systems Integration and Architecture 1 and 2 | Layered architecture, one API as the integration point, contracts, queued outgoing calls, safe retries, environments | Section 8 |
| Object-Oriented Programming | Value objects, encapsulated state machines, strategy objects instead of scattered conditions, modules with one job | Section 7.6 |
| Data Structures and Algorithms | Interval overlap, tree indexes, queues, idempotency keys, cost of each operation | Section 7.5 |
| Quantitative Methods | Break-even, capacity estimates, medians and rolling windows, ratio metrics | Sections 6.3, 6.5, 11.5 |
| Network Security | Access control, isolation, rate limiting, safe uploads, secrets, audit trails | Section 10 |
| Web Systems and Technologies | HTTP and JSON APIs, server rendering and single-page apps, service workers, installable web apps, accessibility | Sections 8.1, 12.3, 12.4 |
| Platform Technologies | Hosting choices, runtime versions, CI, environments, machine limits | Sections 8.4, 8.5, 9.1, 13.4 |
| Integrative Programming | TypeScript across three tiers with SQL underneath; outside services joined through one contract and one queue | Sections 8.3, 11 |
| Human Computer Interaction 1 and 2 | Usability principles, research before design, prototypes, usability testing with a standard score | Section 12 |
| Introduction to Computing | How data is represented (money as whole centavos, dates without time zones), ethics and privacy | Sections 7.4, 10.3 |
| Technopreneurship | Problem and customer, competitor review, pricing, unit economics, validation before building | Sections 2, 5, 6 |

## 16. Open decisions and assumptions

Thirteen choices need your yes or no before phase 1; each has a recommendation so a plain "yes to all" is a valid answer.

### 16.1 Decisions for you

**Decided by the founder on 14 November 2026: yes to all 13 as recommended.** Two notes. Decision 7: calendar sync stays in MVP B, on the assumption that our first hosts are not on Airbnb or are leaving it; the promise to owners is "no double booking for bookings made in your app", and bookings taken elsewhere are entered as manual blocks. The interviews will ask whether hosts list on Airbnb, and this is revisited if most do. Decision 13: the working title is kept for now.

| # | Decision | Recommendation | Why |
| --- | --- | --- | --- |
| 1 | Order of work | Tables, API, then screen, one area at a time | The food app shows what screens-first costs; double bookings are a database problem |
| 2 | Order of targets | Short term first, long term second, both inside MVP A | Short term reuses the order flow; long term adds billing cycles |
| 3 | Price | ₱599 a month for up to 5 units; ₱100 per extra unit | Breaks even at 6 owners; test it in the phase 0 interviews |
| 4 | Repository | A new repository from a cleaned copy of the food app's foundation | Keeps this system free of a backend that is not yet proven |
| 5 | Database | Its own Supabase projects, development and live | Own backups and limits; about US$10 a month more if it shares the food app's organisation |
| 6 | Super admin | A guarded area inside the dashboard app | One app to maintain; the API still enforces the platform role |
| 7 | Airbnb calendar sync | First MVP B module | If most pilot hosts also list on Airbnb, swap it into MVP A in place of another item |
| 8 | ID photos | Leave out of MVP A | The most sensitive data in the system; add only if pilot owners cannot work without it |
| 9 | Identical rooms | One unit row per physical room | Simple and safe; a room-type count is a later change |
| 10 | Stamp rule | 1 stamp per completed, paid stay; for tenants, 1 per bill paid on time (Feature blueprint, section 7c) | One rule both targets understand; the owner sets the rate |
| 11 | Pay on arrival | Allowed for the balance after a down payment, never to hold dates | An unpaid hold is how calendars get blocked |
| 12 | Addresses | `stay.`, `host.` and `api-stay.` on webserbisyo.com | Uses the domain already owned |
| 13 | Product name | Yours to choose | "Stays & Rentals" is a working title only |

### 16.2 The gap in the brief (closed)

Closed on 14 November 2026. The sentence "Also make sure to document and plan like the" continues into the course list and the expert roles. Both are now in the Knowledge base tab, and the paper in capstone chapter format is in the Capstone paper tab.

### 16.3 Not yet researched: gates before launch

- [ ] Philippine data privacy: NPC Circular 2022-04 on registration was read, and sections 11 and 16 of the Data Privacy Act were read through secondary summaries. Whether this business must register, and the rules for ID photos, are still to confirm with a lawyer
- [ ] Exact permit and accreditation wording owners should see for short stays
- [ ] The Rent Control Act's status after 31 December 2026, and its advance and deposit section read from the Act itself
- [ ] Whether Meta's housing ad limits apply to Philippine campaigns
- [ ] Storyset's current licence terms, if any Storyset art is used
- [ ] Vercel's commercial-use terms for the free plan (the Pro price is confirmed), and every package version on install day

Added on 14 November 2026:

- [ ] Business registration: the DTI business name fee is ₱200 to ₱2,000 by territory plus ₱30 stamp tax. BIR registration and the city business permit are not researched
- [ ] Airbnb's fee was read from secondary sources; open Airbnb's own fee page before quoting it to owners
- [ ] The full text of ISO/IEC 25010:2023 is paid; the nine characteristic names come from secondary sources

### 16.4 Assumptions used

| Assumption | Used in |
| --- | --- |
| ₱63 to US$1 | All peso conversions in section 6 |
| Owners' current habits (Messenger, screenshots, notebooks) | Section 2; to be confirmed in interviews |
| 30 photos a unit at 300 KB; 60 bookings a month per owner | Section 6.5 |
| One API copy at launch | Section 10.2 |
| Prices read on 13 November 2026 | Sections 5 and 6 |

## 17. Sources

Pages and repositories opened on 13 November 2026.

**Your repositories and site**

- [Smart-App-PH---FINAL-2026](https://github.com/webserbisyo/Smart-App-PH---FINAL-2026), main at commit `df7c1b7`: README, AGENTS, `docs/decisions.md`, `docs/PROGRESS.md`, `docs/RESEARCH.md`, `docs/SYSTEM.md`, every `package.json`
- [webserbisyo-rsvp](https://github.com/webserbisyo/webserbisyo-rsvp/tree/rsvp-website-production-finalization), branch `rsvp-website-production-finalization` at commit `4a38763`: `docs/marketing-tracking-seo.md`, `PROJECT_STATUS.md`, the Meta Pixel and delivery-ledger migrations, the admin routes
- [webserbisyo-rsvp.vercel.app](https://webserbisyo-rsvp.vercel.app/)

**Stack documentation**

- [Supabase pricing](https://supabase.com/pricing), [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security.md), [Supabase range columns](https://supabase.com/blog/range-columns.md)
- [NestJS rate limiting](https://docs.nestjs.com/security/rate-limiting)
- [Serwist for Next.js](https://serwist.pages.dev/docs/next/getting-started)
- [Next.js docs](https://nextjs.org/docs), [Vite guide](https://vite.dev/guide/), [React reference](https://react.dev/reference/react), [TypeScript docs](https://www.typescriptlang.org/docs/)
- [WebKit: Web Push for Web Apps on iOS and iPadOS](https://webkit.org/?p=13878)

**Tracking**

- [Meta hotel ads events](https://developers.facebook.com/documentation/ads-commerce/marketing-api/hotel-ads/events.md)
- [Meta real estate ads audience and events](https://developers.facebook.com/documentation/ads-commerce/marketing-api/real-estate-ads/audience)

**Market and rules**

- [Hostaway on Airbnb's host-only fee](https://www.hostaway.com/airbnb-host-only-fee-what-to-know-about-the-15-percent-host-fee)
- [Lodgify and alternatives, with prices](https://www.lodgify.com/comparisons/lodgify-alternatives/)
- [Renthuzz on Product Hunt](https://www.producthunt.com/products/renthuzz), [ManageYourCondo on Product Hunt](https://www.producthunt.com/products/manageyourcondo)
- [NHSB Resolution 2024-01, rent control 2025 to 2026](https://philpropertyexpert.com/public/NHSB_Resolution_2024-01_Rent-Control-2025-2026.pdf)

**Read from search results only, not opened**

- Railway and Resend prices (their own documentation pages), the exchange rate, and Philippine short-stay permit rules. Vercel's Pro price was confirmed on vercel.com on 14 November 2026

**Added on 14 November 2026.** The sources for the course rules are listed in section 14 of the Knowledge base tab. The studies behind the capstone chapters are in the references of the Capstone paper tab. Two pages could not be opened and are named there.
