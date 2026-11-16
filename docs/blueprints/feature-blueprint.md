# Feature blueprint

Nov 14, 2026

This page fixes what the first launch does: 90 features, 46 routes and the flows between them. It deliberately does not choose layouts, components or wording. Each page gets its own research pass when it is built, using the checklist in section 11.

## 1. How to use this page

| This page decides | Decided later, per page |
| --- | --- |
| Which features exist, and in which wave | The layout of each screen |
| Which routes exist and who may open them | Which installed components to use |
| What each page must show and let people do | The exact words on buttons and messages |
| The order of steps in each flow | Animations and visual style |
| The rules: limits, states, who is told what | Photos, icons and illustrations |

It sits beside the Database blueprint. Every feature here names the tables or functions it uses there, so a feature cannot be built on data that does not exist.

## 2. Product rules

These ten rules settle most arguments before they start.

1. **Price before details.** A visitor sees the full price, line by line, before typing a name.
2. **No sign-in to book.** A guest books with a name, mobile and email. Joining is always optional.
3. **One conversation per booking.** Status, payment and chat live in one private place, opened by one link.
4. **The server decides.** Prices, availability and stamps are worked out on the server. The phone only shows them.
5. **A proof is a claim, not a payment.** Only the owner's approval confirms anything. The approve screen reminds the owner to check their own wallet, not the screenshot.
6. **Nothing blocks a payment.** A full storage pool, a failed notice or a tracking error never stops a customer from paying or an owner from approving.
7. **Every status has a next step.** Each state tells the person what happens now and what they can do.
8. **The owner runs it from a phone.** Every owner task works on a 360-pixel screen.
9. **One word for one thing.** Guest, member, tenant, owner. A "tenant" is always the renter, never our paying client.
10. **Later features are switches, not rewrites.** Anything in a later wave is hidden behind a per-owner switch until it ships.

## 2a. What the research found

The ten owner interviews have not been done yet. Until they are, this section is the evidence: news reports, surveys, laws, and what real Philippine listings ask of their guests. Each finding is tied to what the plan now does. Findings 7 and 8 come from US and UK surveys, because no Philippine landlord survey was found.

| # | Finding | Evidence | What the plan does |
| --- | --- | --- | --- |
| 1 | Staycation scams are common, so guests are wary of paying a stranger | The CICC counted at least 6,462 staycation scam reports in 2025 and 2,820 in the first quarter of 2026 ([GMA News](https://www.gmanetwork.com/news/topstories/nation/981394/cicc-staycation-scam/story/)). Fake pages copy real resorts' Facebook pages ([Philstar](https://www.philstar.com/cebu-news/2026/05/27/2530855/public-urged-watch-booking-scams)) | A Verified owner badge after the super admin checks the owner (SA-09). The page lives on our domain. The payment panel says to pay only the accounts shown there, and flags recently changed accounts (PA-10) |
| 2 | Fake payment screenshots are common | GCash says a payment counts only once it shows in your own transaction history, and warns of AI-made fake receipts ([GCash via Mynt](https://mynt.com.ph/newsroom/gcash-warns-public-on-emerging-ai-generated-fake-receipts-scams-urges-users-to-always-check-transactions-tab)). BDO gives sellers the same advice ([BDO](https://bdo.com.ph/node/64820)) | Approving a GCash, Maya or bank payment needs the owner to tick that they saw it in their own history. A reference number works only once |
| 3 | Condo buildings require a guest list and IDs before arrival | Metro Manila condo listings ask for each guest's name and valid ID ahead of time, often by a deadline tied to the admin office's hours, plus a car plate for parking ([Pasay listing](https://airbnb.com/h/quietcorneratshore), [Mandaluyong listing](https://www.airbnb.com/rooms/1158575988135262044)) | A guest list form in the conversation, with a due time. IDs are private and deleted 7 days after checkout (BK-14) |
| 4 | "Down payment kept, dates can be moved" is a common local policy | Several Philippine stay terms keep the down payment but allow a new date within a window ([example](https://globit-transient.vercel.app/terms), [another](https://sites.google.com/view/balay-ni-manang/terms-conditions)). Airbnb rebuilt its own presets in October 2025 ([Hostaway](https://www.hostaway.com/vacation-rental-guide/airbnb-host-cancellation-policy/)) | Six cancellation presets, one of them "down payment kept, one date change". The app shows the guest what they would get back before they confirm (BK-15) |
| 5 | Hosts answer the same questions all day | Airbnb gives hosts saved and scheduled quick replies for check-in, directions and house rules ([Airbnb Help](https://www.airbnb.ca/help/article/2898)) | Saved replies with placeholders (OW-21). The automatic notices already cover booking confirmed, check-in and checkout |
| 6 | Hosts rely on helpers | Busy Philippine listings name several co-hosts ([example listing](https://www.airbnb.com/rooms/983018497619521540)) | Staff sign-in with a caretaker role in wave 2 (OW-22). A caretaker cannot approve money, change prices or change payment accounts |
| 7 | Late rent is a landlord's main worry, and reminders help | In a 2025 survey, nearly nine in ten landlords counted rent as late within a week of the due date ([RentRedi](https://rentredi.com/blog/most-landlords-consider-rent-late-within-a-week-survey-shows/)) | Already planned: bills 7 days ahead, reminders before and after the due day, and a collection report |
| 8 | Repairs are a top tenant complaint and a top landlord task | 62% of tenants in one UK survey had repairs left undone ([Mashroom](https://mashroom.com/blog/landlord-tenant-relationships-15717)). 38% of self-managing landlords named upkeep their biggest challenge ([Baselane](https://www.baselane.com/resources/self-managing-landlord-statistics)) | Repair requests in the tenant's conversation, with a status (RN-07) |
| 9 | Submeter charges cause disputes in apartments and boarding houses | Philippine legal guides say tenants should be able to see the readings, the rate and the formula ([Lawyer Philippines](https://www.lawyer-philippines.com/articles/landlord-water-and-electricity-charges-through-a-submeter)) | Utility lines on a bill show the start and end readings and the rate (RN-08) |
| 10 | The law limits what a landlord may collect up front | RA 9653 allows at most 1 month of advance and 2 months of deposit on covered units, and is extended to 31 December 2026 ([RentScout](https://rentscout.ph/blog/tenant-rights-philippines-rent-control-act-guide)) | The lease form warns above those limits |

**Interview guide, for when the interviews happen.** Five staycation hosts and five landlords, about 20 minutes each. Ask about their last real case, not their opinions, and write down their exact words.

1. Walk me through your last booking, or your last new tenant, from the first message to the money in your account.
2. Where did it go wrong, or take the longest?
3. How do you check that a payment is real?
4. Have you had a double booking, a no-show or a fake proof? What happened?
5. What do your building or barangay ask of you and your guests?
6. Who helps you, and what can they do without you?
7. What do you use today: Facebook, Airbnb, a notebook, a spreadsheet? What would make you stop using it?
8. What would make ₱599 a month worth it, and what would make it not worth it?

After the ten, mark each finding above as confirmed, changed or wrong, and update the feature list.

## 3. Roles

| Can do | Guest | Member | Tenant | Owner | Super admin |
| --- | --- | --- | --- | --- | --- |
| Browse a property and see prices | Yes | Yes | Yes | Yes | Yes |
| Reserve, upload a proof, chat on their own booking | Yes | Yes | Yes |  |  |
| See all their bookings in one list |  | Yes | Yes |  |  |
| Collect stamps and claim rewards |  | Yes | Yes |  |  |
| See a lease, bills and receipts |  |  | Yes |  |  |
| Manage units, prices, calendar and bookings |  |  |  | Yes |  |
| Approve or reject payments |  |  |  | Yes |  |
| Edit and publish the property page |  |  |  | Yes |  |
| See activity and storage for their own account |  |  |  | Yes |  |
| Approve, pause or suspend owner accounts |  |  |  |  | Yes |
| Review plan payments, switch features, read all logs |  |  |  |  | Yes |

A tenant is a member with an active lease. Staff sign-ins with their own permissions come later; every API route already checks a named permission, so staff add rows, not code.

## 4. Guests and members

&#91;embedded content: guest to member to tenant · one customer record\]

There is no public chat and no sign-in wall. A guest reaches their booking through a private link; a member can also reach it by signing in.

|  | Guest | Member | Tenant |
| --- | --- | --- | --- |
| Signs in | No | 6-digit email code, no password | Same as a member |
| Opens a conversation | By its private link | By the link, or from the account | Same as a member |
| Sees past bookings | Only the one the link opens | All of them at that owner | All, plus the lease |
| Details | Typed each time; the phone remembers them | Saved on the account | Saved |
| Stamp cards and rewards | None | Earned and spent, per owner | Same as a member |
| Bills and receipts | Not applicable | Not applicable | Yes |

**Rules**

1. **Email is the identity.** A guest booking joins a member only through its private link or the same verified email, never through a phone number alone.
2. **Joining moves nothing.** The customer record gains a sign-in. Past bookings with that email appear in the account at once.
3. **Stamps stay with one owner.** A member of one owner is a new customer at another owner, with separate stamp cards.
4. **A lost link is recoverable.** "Find my booking" takes an email and re-sends the links. It always answers "If we found bookings, we sent them", so nobody can test which emails have booked.
5. **An existing tenant is invited.** The owner adds the tenant and the lease; the tenant gets an email link, enters a code, and sees the lease.
6. **Leaving is possible.** A member can ask for their details to be removed. The name, email and mobile are blanked; the owner keeps the booking as a business record.
7. **Abuse has three answers.** The owner can hide a message, close a conversation or block a customer. The owner cannot delete a message or a payment.

**Links are replaced, not re-sent.** The database keeps only a fingerprint of each private link, so it cannot send the same link twice. "Find my booking" and the owner's "new link" both make a fresh link and email it; the old one stops working. A guest who forwarded the old link to a companion has to share the new one.

## 5. Feature catalog

Every feature has a fixed ID. **Wave** matches the Database blueprint: 1 is the booking core, 2 is rentals, 3 is rewards and tracking. **M** is a must for that wave; **S** is a should, and may slip to just after it. New features are added at the end of a group so IDs never change.

### Property app (PA)

| ID | Feature | Wave | Pri | Uses |
| --- | --- | --- | --- | --- |
| PA-01 | Property home: photos, units, amenities, house rules, map link, contact, share link and QR | 1 | M | `get_property` |
| PA-02 | Short-stay unit page: gallery, details, calendar with taken dates greyed, guest count, price breakdown | 1 | M | `get_unit_calendar`, `quote_stay` |
| PA-03 | Long-term unit page: rent, inclusions, date available, advance and deposit terms | 2 | M | `unit_lease_terms` |
| PA-04 | Dates and guests kept in the web address, so a shared link opens the same search | 1 | S |  |
| PA-05 | Install as an app with the property's own name and icon; iPhone steps | 1 | M |  |
| PA-06 | Offline page. Dates and prices are never shown from a saved copy | 1 | M |  |
| PA-07 | Privacy page and consent lines | 1 | M | `customer_consents` |
| PA-08 | Share preview: title, description and image per property and unit | 1 | S |  |
| PA-09 | Paused account shows contact details only; an unpublished property is not found | 1 | M | `v_subscription_state` |
| PA-10 | Trust panel: Verified owner badge, how to pay safely, recently changed payment accounts flagged | 1 | M | `accounts`, `payment_accounts` |
| PA-11 | Report this page: fake page, wrong payment account or scam attempt; goes to the super admin | 1 | S | `page_reports`, `report_page` |

### Booking and payment (BK)

| ID | Feature | Wave | Pri | Uses |
| --- | --- | --- | --- | --- |
| BK-01 | Price worked out on the server, rechecked at Reserve, with "the price changed" when it differs | 1 | M | `quote_stay` |
| BK-02 | Reserve with name, mobile and email; a timed hold with a countdown | 1 | M | `create_booking_hold` |
| BK-03 | Conversation page from a private link: status, what to do next, the owner's payment details | 1 | M | `get_thread` |
| BK-04 | Upload a proof with reference number and amount; it shows as a proof card | 1 | M | `submit_payment` |
| BK-05 | Result of the review; receipt; voucher with QR, saved as an image | 1 | M | `get_thread` |
| BK-06 | Arrival details shown only after the booking is confirmed | 1 | M | `arrival_info` |
| BK-07 | Chat messages with the owner | 1 | M | `post_message` |
| BK-08 | Cancel before check-in, with the owner's policy shown first | 1 | M | `cancel_booking` |
| BK-09 | Find my booking: re-send links by email | 1 | M |  |
| BK-10 | Ask a question before booking | 1 | S | `create_inquiry` |
| BK-11 | Weekly and monthly discounts shown in the breakdown | 1 | S | `quote_stay` |
| BK-12 | Notify me: web push for status changes | 1 | S | `push_subscriptions` |
| BK-13 | Ask to change dates in the chat; the owner moves the booking | 1 | S | `change_booking_dates` |
| BK-14 | Guest list and IDs for building registration, with a due time and a parking plate | 1 | S | `booking_guests` |
| BK-15 | Cancellation presets: before confirming, the guest sees what comes back or how to move the dates | 1 | M | `properties` |
| BK-16 | Rate your stay (1 to 5 stars and a note) from the private link after checkout, then the owner's Google review link | 1 | S | `stay_reviews`, `submit_review` |

### Members and rewards (MB)

| ID | Feature | Wave | Pri | Uses |
| --- | --- | --- | --- | --- |
| MB-01 | Join with a 6-digit email code; past bookings are linked | 1 | M | `join_as_member` |
| MB-02 | Account: bookings, saved details, consents, remove my details | 1 | M | `customers` |
| MB-03 | Stamp or point cards: balance, progress and history | 3 | M | `v_customer_stamps` |
| MB-04 | Rewards: see what is unlocked, claim it, show the code and QR, use a discount at booking | 3 | M | `redeem_reward` |
| MB-05 | Welcome stamp or points, and the member perk, on joining | 3 | S | `stamp_cards`, `stamp_ledger` |
| MB-06 | Tenant card: a stamp for each rent bill paid in full by its due date; private to the tenant | 3 | S | `stamp_cards`, `stamp_ledger` |

### Rentals, customer side (RN)

| ID | Feature | Wave | Pri | Uses |
| --- | --- | --- | --- | --- |
| RN-01 | Inquiry and viewing request | 2 | M | `create_inquiry`, `viewings` |
| RN-02 | Reserve a unit with a reservation fee and proof | 2 | M | `reserve_unit` |
| RN-03 | Tenant home: lease summary, the current bill, history, receipts | 2 | M | `v_bill_balance` |
| RN-04 | Pay rent with proof | 2 | M | `submit_payment` |
| RN-05 | Rent reminders by push and email | 2 | M | `remind_rent` |
| RN-06 | Move-out summary: deductions and deposit returned | 2 | S | `lease_deductions` |
| RN-07 | Repair requests from the tenant, with a photo and a status | 2 | S | `repair_requests` |
| RN-08 | Utility lines from submeter readings, shown to the tenant | 2 | S | `bill_lines` |
| RN-09 | Lease renewal reminders and a late fee rule; a warning when a renewal raises rent above the rent cap | 2 | S | `leases`, `remind_lease_end`, `add_late_fees` |
| RN-10 | Move-in and move-out checklist with photos, confirmed by the tenant | 2 | S | `inspections`, `save_inspection` |
| RN-11 | Rental application details on an inquiry: occupants, move-in date, work, pets, a short note | 2 | S | `inquiries` |

### Owner dashboard (OW)

| ID | Feature | Wave | Pri | Uses |
| --- | --- | --- | --- | --- |
| OW-01 | Sign up, wait for approval, sign in | 1 | M | `accounts` |
| OW-02 | Setup checklist: property, unit, photos, price, payment accounts, rules, publish | 1 | M | Listing tables |
| OW-03 | Home: arrivals and departures today, proofs to check, holds running out, rent due, unread messages | 1 | M | Views |
| OW-04 | Calendar: every unit on one timeline; block dates; add a manual booking; move a booking | 1 | M | `unit_occupancy` |
| OW-05 | Bookings: board by status, and a detail page | 1 | M | `bookings` |
| OW-06 | Payments: proofs to review, approve or reject with a reason, record cash or a refund, receipts | 1 | M | `review_payment` |
| OW-07 | Inbox: all conversations, unread first; hide, close, block | 1 | M | `threads` |
| OW-08 | Units: details, photos in order, amenities, terms, arrival details | 1 | M | Listing tables |
| OW-09 | Prices: base rate, weekday rates, dated prices, fees, discounts, preparation nights | 1 | M | Price tables |
| OW-10 | Guests and members: list, history, private notes | 1 | S | `customers` |
| OW-11 | Editor: draft and publish the property page: brand and 60/30/10 colours, install look (icon and splash), sections and web address (section 7a) | 1 | M | `property_pages` |
| OW-12 | Settings: payment accounts, policies, notices, privacy contact | 1 | M |  |
| OW-13 | Plan: trial, due and overdue banners; pay the plan with proof; storage used | 1 | M | `subscription_payments` |
| OW-14 | Activity list for the account | 1 | S | `audit_logs` |
| OW-15 | Tenants: leases, add an existing tenant, bills, extra bill lines, move-out | 2 | M | Rental functions |
| OW-16 | Inquiries and viewings, inside the Inbox | 2 | M | `viewings` |
| OW-17 | Reports: occupancy, average nightly rate, collection on time; export CSV | 2 | S | Views |
| OW-18 | Stamp cards: goal, milestones, limited pieces, pause; fix stamps; mark a reward as given | 3 | M | Loyalty tables |
| OW-19 | Alerts to the owner by email, and by push when installed | 1 | M | `notifications_outbox` |
| OW-20 | Share tools: copy link, QR, printable QR poster | 1 | S |  |
| OW-21 | Saved replies with placeholders, one tap in any conversation | 1 | S | `saved_replies` |
| OW-22 | Staff sign-in with a caretaker role | 2 | S | `account_members` |
| OW-23 | Property settings: name, web address with old links redirected, contact, exact location on or off | 1 | M | `properties`, `change_slug` |
| OW-24 | Reply and viewing hours: up to 4 ranges a day, closed dates | 1 | S | `properties` |
| OW-25 | Owner account: picture, password by email code, light or dark look, sign out everywhere, delete request | 1 | M | `profiles` |
| OW-26 | Storage meter with warnings at 80, 95 and 100 %, and a ZIP export of bookings, payments and proofs | 1 | M | `files`, `data_exports`, `create_export` |
| OW-27 | Duplicate a unit, bulk actions with Undo, and sample data to replace | 1 | S | `duplicate_unit` |
| OW-28 | Copy a listing for Facebook: text with price, highlights and the page link | 1 | S | `units` |

### Super admin (SA)

| ID | Feature | Wave | Pri | Uses |
| --- | --- | --- | --- | --- |
| SA-01 | Owners: approve, suspend, close | 1 | M | `approve_account` |
| SA-02 | Plans, and plan payments to review | 1 | M | `review_plan_payment` |
| SA-03 | Usage per owner: storage, units, activity | 1 | M | `v_account_usage` |
| SA-04 | Audit log across all owners | 1 | M | `audit_logs` |
| SA-05 | Health: timed jobs and failed notices | 1 | M | `job_runs` |
| SA-06 | Feature switches per owner | 1 | S | `account_features` |
| SA-07 | Meta pixels and event switches | 1 | M | Tracking tables |
| SA-08 | Overview: owners by state, monthly income | 1 | S | Views |
| SA-09 | Owner verification: identity and right to rent checked, badge switched on | 1 | M | `accounts` |

### Platform (PL)

| ID | Feature | Wave | Pri | Uses |
| --- | --- | --- | --- | --- |
| PL-01 | Email: codes, receipts, alerts | 1 | M | Outbox |
| PL-02 | Web push through the outbox | 1 | S | Outbox |
| PL-03 | Request limits and hold limits | 1 | M |  |
| PL-04 | Timed jobs with a run log | 1 | M | `job_runs` |
| PL-05 | Demo properties and a seed command | 1 | M |  |
| PL-06 | The kit page for builders | 1 | M |  |
| PL-07 | Platform Meta Pixel and Conversions API, run by the super admin to reach owners | 1 | S | Tracking tables |
| PL-08 | Funnel events | 3 | S | `funnel_events` |
| PL-09 | Owner landing page: what the product does, plans and prices, a sign-up button | 1 | M | `plans` |

## 6. Sitemap

&#91;embedded content: sitemap · 3 apps and an owner landing page, 42 routes\]

The System blueprint listed 27 routes. Thirteen are added here, each for a gap found while writing the flows. One is renamed: the conversation link is `/t/<token>`, because the same link type now opens a booking, a question or a lease.

| Added route | Why |
| --- | --- |
| `/find` | A guest who lost the email can get the links again |
| `/privacy` | The consent line needs a page to link to |
| `/signup` | Owners must be able to apply without us creating the account |
| `/` on the bare domain | Ads and links aimed at owners need a page that explains the product and prices before sign-up. The platform Pixel lives here |
| `/inbox` | Questions and rental conversations had no home in the dashboard |
| `/reports` | The numbers in the System blueprint had no page |
| `/rewards` | Rewards need their own list, apart from guests |
| `/settings/payments`, `/policies`, `/notices`, `/plan`, `/activity` | Settings was one route for five different jobs |
| `/admin` | An overview before the lists |
| `/admin/health` | Timed jobs and failed notices need to be visible |
| `/settings/team` | Staff sign-ins need a place to invite and remove helpers |
| `/settings/property` | The property's name, web address and contact need one home (F1 to F29) |
| `/settings/hours` | Reply and viewing hours are set apart from the page editor |
| `/settings/account` | The owner's own sign-in, picture and look |
| `/settings/storage` | Storage limits and data export, as in the food app |

**Every route**

| App | Route | Who | Wave |
| --- | --- | --- | --- |
| Property app, bare domain | `/` with no property in the address | Owners we want to win | 1 |
| Property | `/` | Anyone | 1 |
| Property | `/units/<unit>` | Anyone | 1; long-term units in 2 |
| Property | `/book` | Guest | 1 |
| Property | `/inquire` | Guest | 1 for questions; viewings in 2 |
| Property | `/t/<token>` | Whoever holds the link | 1 |
| Property | `/find` | Anyone | 1 |
| Property | `/join` | Guest | 1 |
| Property | `/account` | Member | 1; stamp cards in 3 |
| Property | `/account/lease` | Tenant | 2 |
| Property | `/privacy` | Anyone | 1 |
| Property | `/install` | Anyone | 1 |
| Dashboard | `/signup`, `/login` | Owner | 1 |
| Dashboard | `/onboarding` | Owner | 1 |
| Dashboard | `/home` | Owner | 1 |
| Dashboard | `/calendar` | Owner | 1 |
| Dashboard | `/bookings` | Owner | 1 |
| Dashboard | `/payments` | Owner | 1 |
| Dashboard | `/inbox` | Owner | 1 |
| Dashboard | `/units` | Owner | 1 |
| Dashboard | `/guests` | Owner | 1 |
| Dashboard | `/tenants` | Owner | 2 |
| Dashboard | `/reports` | Owner | 2 |
| Dashboard | `/rewards` | Owner | 3 |
| Dashboard | `/editor` | Owner | 1 |
| Dashboard | `/settings` and its five pages | Owner | 1 |
| Super admin | `/admin`, `/admin/owners`, `/admin/plans`, `/admin/usage`, `/admin/audit`, `/admin/health`, `/admin/flags` | Founder | 1 |
| Super admin | `/admin/pixels` | Founder | 1 |
| Builders | `/kit` | Builders | 1 |
| Dashboard | `/settings/team` | Owner | 2 |
| Dashboard | `/settings/property` | Owner | 1 |
| Dashboard | `/settings/hours` | Owner | 1 |
| Dashboard | `/settings/account` | Owner | 1 |
| Dashboard | `/settings/storage` | Owner | 1 |

**Menu order in the dashboard (proposed).** The order follows how often an owner needs each page. It is confirmed in the research pass for the dashboard shell, and later features take fixed places so the order never reshuffles.

| Order | Item | Count shown beside it | On the phone |
| --- | --- | --- | --- |
| 1 | Home | Things that need the owner | Tab 1 |
| 2 | Calendar |  | Tab 2 |
| 3 | Bookings | Holds and bookings in review | Tab 3 |
| 4 | Inbox | Unread conversations | Tab 4 |
| 5 | Payments | Proofs waiting | More |
| 6 | Units |  | More |
| 7 | Guests |  | More |
| 8 | Tenants (wave 2) | Late bills | More |
| 9 | Reports (wave 2) |  | More |
| 10 | Rewards (wave 3) | Rewards to hand over | More |
| 11 | Editor | A dot when a draft is unpublished | More |
| 12 | Settings | A dot when setup is incomplete | More |

## 7. Page briefs

Each brief says what a page is for, what it must show and what people can do there. How it looks is decided in that page's research pass.

**Every page handles the same seven states:** loading, empty with one action, an error with a way to retry, offline, not found, a paused owner account, and long text or large amounts. Only extra states are listed below.

### Property app

| Route | Job | Must show | People can | Extra states |
| --- | --- | --- | --- | --- |
| `/` on the bare domain | Win new owners | What the product does for staycations and rentals; plans and prices from the plans table; a demo property; a privacy link | Read, open the demo, go to sign-up | Consent banner for the platform Pixel |
| `/` | Sell the property in one screen | Photos, name, place, units with a "from" price, amenities, house rules, map link, contact, the Verified owner badge | Open a unit, share, install | No units listed yet |
| `/units/<unit>` short stay | Turn interest into a reservation | Gallery, details, calendar with taken dates greyed, guest count, full price breakdown, cancellation preset in plain words, whether IDs will be asked for | Pick dates and guests, reserve, ask a question | Dates just taken; below minimum nights; too many guests |
| `/units/<unit>` long term | Turn interest into an inquiry | Rent, inclusions, date available, advance and deposit, minimum lease | Ask, request a viewing, reserve | Unit already rented |
| `/book` | Take the fewest details needed | The price again, name, mobile, email, consent line, the hold length | Reserve | Price changed; hold limit reached |
| `/inquire` | Start a question or a viewing | Unit, message box, optional date, contact details | Send |  |
| `/t/<token>` | Be the one place for a booking | Status and next step, countdown while held, payment details with "pay only to these accounts", proof cards, guest list card when asked, chat, receipt, voucher, arrival details once confirmed | Upload a proof, send the guest list, chat, see what a cancellation returns and cancel, join, turn on notices, ask for a new link | Expired; cancelled; closed conversation |
| `/find` | Recover lost links | One email box | Ask for the links | Always the same answer |
| `/join` | Add a sign-in | Email, then a 6-digit code | Join | Wrong or expired code |
| `/account` | Give members one home | Bookings, saved details, consents; stamp cards and rewards in wave 3 | Open a booking, edit details, remove my details | No bookings yet |
| `/account/lease` | Show a tenant what they owe | Lease summary, the current bill with meter readings, due date, history, receipts, open repair requests | Pay with proof, chat, report a repair | Bill late; lease ended |
| `/privacy` | Explain what is kept and why | The owner's contact, what is collected, how long it is kept |  |  |
| `/install` | Help people install and allow notices | Steps for the phone in hand | Install, allow notices | Already installed |

### Owner dashboard

| Route | Job | Must show | The owner can | Extra states |
| --- | --- | --- | --- | --- |
| `/signup`, `/login` | Let owners in | One generic error for any failed sign-in | Apply, sign in | Waiting for approval |
| `/onboarding` | Get to a published page fast | A checklist of seven steps with what is done | Do each step, publish |  |
| `/home` | Answer "what needs me now?" | Arrivals and departures today, proofs to check, holds running out, rent due, unread messages | Jump to each item | Nothing needs you |
| `/calendar` | Show who is where | Every unit on one timeline; holds, bookings, blocks and leases told apart | Block dates, add a manual booking, move a booking | Dates taken on a move |
| `/bookings` | Work through bookings | Bookings by status; a detail with guest, dates, price lines, payments, guest list, history | Confirm arrival, complete, cancel, open the conversation, copy the guest list for the building, unlock the list |  |
| `/payments` | Review money claims | Proofs waiting, oldest first; the amount expected; the reference | Approve after ticking "I saw it in my own history", reject with a reason, record cash, record a refund, reverse | Reference already used |
| `/inbox` | Keep up with conversations | Unread first; what each is about | Reply, use a saved reply, hide a message, close, block a customer |  |
| `/units` | Manage what is rented | Units with status; details, photos, amenities, terms, prices, arrival details | Add, edit, reorder photos, set prices, list or unlist, archive | Unit limit of the plan reached |
| `/guests` | Know the customers | List with stays and totals; a detail with history and a private note | Add a note, block |  |
| `/tenants` | Run leases | Leases by state; bills with balance and days late; open repair requests | Add a tenant, activate, add bill lines with meter readings, void a bill, update a repair, end a lease |  |
| `/reports` | Show how the business is doing | Occupancy, average nightly rate, collection on time, for a chosen period | Change the period, export CSV | Not enough data yet |
| `/rewards` | Run the stamp cards | Rules, rewards, claims to hand over | Set the cards, add rewards, pause or limit them, mark as given, fix stamps | Programme off |
| `/editor` | Shape the public page | The 15 sections with a done mark; the draft beside a live preview; what differs from the live page; contrast warnings | Edit each section, change the web address, publish, discard | Someone else published first; contrast fails; web address taken |
| `/settings/payments` | Tell customers where to pay | GCash, Maya and bank accounts with QR images; a warning that changes are shown to guests with open bookings | Add, edit, turn off | No account yet: bookings cannot be paid |
| `/settings/policies` | Set the rules of the stay | Cancellation preset and its settings, guest list and ID requirement with its due time, house rules, arrival details, saved replies, privacy contact | Edit |  |
| `/settings/notices` | Choose how to be told | Email address for alerts; push on this device | Change, test | Push not possible on this browser |
| `/settings/plan` | Keep the account paid | Plan, state, paid through, storage used, payment history | Pay with proof | Trial ending; overdue; paused |
| `/settings/activity` | Show who did what | Actions with time and actor | Filter |  |
| `/settings/team` | Invite helpers | Each helper, their role and last sign-in | Invite by email, change a role, remove | Empty: only the owner can sign in |
| `/settings/property` | Keep the property's details right | Name, web address, contact, exact location switch | Change name and contact, change the web address (old links keep working), hide the exact location | Address change: warns that old links redirect |
| `/settings/hours` | Say when they reply and show units | Reply and viewing hours per day, closed dates | Up to 4 ranges a day, copy a day to others, add closed dates | Empty: "Replies any time" |
| `/settings/account` | Look after their own sign-in | Picture, email, look, signed-in devices | Change picture, change password by email code, pick light, dark or system, sign out everywhere, ask to delete | Delete request: waits 7 days and can be cancelled |
| `/settings/storage` | Know the space used and take data out | Meter by kind, warnings at 80, 95 and 100 % | Remove old proofs, ask for a ZIP export | Export preparing; ready for 24 hours; full: uploads stop |

### Super admin

| Route | Job | Must show | The founder can |
| --- | --- | --- | --- |
| `/admin` | See the platform at a glance | Owners by state, plan payments waiting, failed jobs, income this month | Jump to each |
| `/admin/owners` | Control who is on the platform | Owners with state, verified or not, units, last sign-in | Verify after a video call (ID and right to rent seen, a note saved, no image kept), approve, suspend, close, open as read-only |
| `/admin/plans` | Keep plans and payments right | Plans; plan payments to review | Approve, reject, add a plan |
| `/admin/usage` | Spot heavy or idle owners | Storage, bookings and leases per owner | Sort, export |
| `/admin/audit` | Trace any action | Every audit line | Filter by owner, actor, action |
| `/admin/health` | Know the system is running | Each timed job's last run and failures; failed notices | Re-queue a failed notice |
| `/admin/flags` | Switch features per owner | Each switch and who has it | Turn on or off |
| `/admin/pixels` | Manage tracking | The platform Pixel, its status (Off, Test, Live) and whether the token is set; each event's browser and server switch; deliveries and health | Add, test, go live |

## 7a. Page editor

Decided on 14 November 2026 (decisions E1 to E9 at the end of this section). **Cross-checked line by line against the food app's built editor** (repo commit `df7c1b7`: `apps/dashboard/src/features/editor`, `packages/core/src/schemas/editor.ts` and `storefront.ts`, the banner carousel and splash in `packages/ui` and `apps/storefront`, decisions T72 to T79, R41, R42, R51). Rows marked **Reuse** copy its working code and rules; **New** rows are additions for rentals.

### How the editor works

1. The editor opens full screen outside the dashboard menu. The preview is the real property page in a frame at `/<slug>/preview` (no search indexing, never cached, framed only by the dashboard). The draft reaches it over `postMessage` on one channel; every message is checked by origin, sender and Zod. (Reuse T72, E13)
2. Tapping a part on the preview opens its panel; pointing at a part in the list outlines it on the preview.
3. The preview switches between Phone (390 px) and Laptop (1280 px), scaled to fit, and between pages: Home, a unit page, the booking form and Property info. A slow load says why after 4 seconds; Try again shows after 8. (Reuse T72, T78)
4. Saving: the draft saves itself 0.8 seconds after the last change and retries every 5 seconds after a failure. A status line says Live, Draft with N changes, Saving, Offline, Didn't save or Conflict. Leaving with unsaved changes asks first. (Reuse E1)
5. Undo and Redo keep 50 steps (Ctrl or ⌘ Z outside text boxes); a colour drag or a run of typing in one box is one step. (Reuse E14)

   The editor's state (the draft, the selected part, the save status and the Undo history) lives in one Zustand store, with `zundo` for Undo and Redo, so a colour drag or fast typing re-renders only what changed. Data from the API stays in TanStack Query. The food editor moves to this first; see the Stack register.
6. Saves carry `draft_rev` (the food app's `baseVersion`). An older one gets `draft_conflict`, answered with "Load the newer one" or "Keep mine". (Reuse E3)
7. Publish first lists every change in plain words ("Fonts: Café", "Banner 2 photo"), then `publish_property_page` copies the draft to `published` and counts `version` up (the food app's `contentVersion`). Discard asks first. The top bar's menu has View live, Copy link and Discard. (Reuse E2)
8. Phones: a dock that never hides (Sections, Style, Pages, Publish with the change count). The list, a part or the pages open in a sheet docked between the preview and the dock, never over the preview, at 35, 55 or 85 % height (drag or tap the handle, arrow keys too); a finger swiping right goes back to the list. Tablets: list or panel on the left. Computers: list, preview and panel side by side. (Reuse T78)
9. A short tip sits at the top of the list until the owner closes it.

**Readability is fixed for the owner, not blocked** (Reuse T76 C1 and C2). Any colour is allowed. Words switch to black or white, whichever reads at 4.5 to 1. Buttons keep their colour and only get lighter or darker until their words read at 4.5 to 1 and the button stands out 3 to 1 from the page and cards. A 60 · 30 · 10 strip shows five checks: buttons, links, body text, cards and "stands out". **Publishing is blocked only when** there is no cover photo or the web address is taken. **Warnings:** About is empty, no FAQ, no logo (initials show instead).

### The sections

| # | Part | The owner sets | Rules | Wave | Source |
| --- | --- | --- | --- | --- | --- |
| 1 | Style: logo and colours | Logo: trimmed and made square on upload, at least 256 px, "Remove white background", circle or rounded frame. Tagline up to 80. Pick one of 8 styles made from the logo (Soft tint, Clean white, Warm paper, Colour pair, Night, Deep, Ink and colour, Big colour, with a Best match) and "More like this" tweaks. Fine-tune the page (60), cards (30) and buttons (10) with swatches or any colour (HEX, RGB, HSL, eyedropper, copy). "Tap your logo": a magnifier over the logo to pick a colour, since the eyedropper is missing on iPhone | Worked out on the device; nothing goes to an AI. Light or dark follows the page colour; there is no switch. A logo that blends into the page gets a thin ring. The panel shows the logo in the 4 places guests see it: top of the page, app icon, opening screen, shared link | 1 | Reuse T73, T76 |
| 2 | Fonts | One of 8 pairs: Malinaw (default), Friendly, Street, Café, Elegant, Bakery, Playful, Modern | Self-hosted; guests download only the property's pair | 1 | Reuse T79 |
| 3 | Install look | Home-screen name up to 12 characters; splash colour (default the 60); splash animation; show name or tagline | See "Splash and app icon" below | 1 (animations in wave 2) | Extends R51, which has the page colour and a fade only |
| 4 | Hero photos | Cover and the order of the first 5 photos | Phone: swipe with a "1 / 12" counter, never moves by itself. Larger screens: 1 large and 4 small with "Show all photos" | 1 | New |
| 5 | Promo banners | Up to 3 photos cropped to 16:9 (1600 × 900); title up to 40; one line up to 90; photo description up to 120 (required, for screen readers); one button to a unit, a promo or Rewards; move up or down; 3, 5, 7 or 10 seconds a slide. The title and line can also be typed straight onto the preview | The food carousel as is: dots fill like a timer; pauses on hover, drag and focus; stops off-screen; a Pause button; nothing moves for visitors who ask for reduced motion; the carousel code loads only for 2 or more slides | 1 | Reuse E9, R41, R42, T78 |
| 6 | Announcement | Text up to 200; tone (info, warning, success); optional end date (ends at midnight, Manila time) | Writing a message turns the part on | 1 | Reuse E10 |
| 7 | About and host | About up to 600; host display name, photo and languages | Hosting since, usual reply time and the Verified badge are worked out, never typed | 1 | About Reuse; host card New |
| 8 | Units | Up to 4 featured units and their order; stays and rentals grouped | Prices come from the terms, with a "Change in Units" link | 1 | Like best sellers (owned part, E12) |
| 9 | Highlights | Up to 6 amenities shown at the top | Picked from the amenities list | 1 | New |
| 10 | Rules and policies | Show or hide | "Change in Settings" link | 1 | Owned part (E12) |
| 11 | Location and contact | Show or hide | Address, pin, area-only switch, phone, Messenger, Facebook, Google review link and other socials live in Settings, with a link. Area only by default; the exact address goes out after payment | 1 | Food pattern (contact in Settings, show-address switch); area-only New |
| 12 | Times | Show or hide | Check-in and check-out from the property; reply and viewing hours from Settings | 1 | Owned part, like the food app's hours |
| 13 | FAQ | Up to 10 questions, answers up to 300 | Can be filled from saved replies with one tap | 1 | New |
| 14 | Guest count | Show or hide "N guests stayed" | Counted from completed stays; shown from 5 | 2 | Adapted from the members count (T82) |
| 15 | Share and search | Title up to 60; description up to 155; share picture (made from cover, name and logo, or uploaded at 1200 × 630); hide from search while setting up |  | 1 | New |

The order of the parts is fixed and follows the page from top to bottom; each part has a show or hide switch (Reuse E11). Reordering parts, starting looks, version history and scheduled publish come later.

### Splash and app icon

The splash has two layers.

- **Layer 1, drawn by the phone.** Android builds it from the manifest's name, `background_color` and icon. iPhones need a launch picture for each screen size, so the server draws them at `/<slug>/splash/<w>x<h>`, as the food app does. Neither can be animated.
- **Layer 2, drawn by our app.** A full-screen cover in the same colour that plays the chosen animation and fades out when the first screen is ready. Both layers share one colour, so the hand-over cannot be seen.

**Rules**

1. The default splash colour is the 60 colour (the page colour). The owner can choose another; the logo and name must pass contrast on it.
2. The manifest's `background_color` and `theme_color` both use the splash colour.
3. Animations: None, Fade (default), Logo pulse, Logo rise, Progress line. CSS only; no uploaded animations or video, for speed and safety.
4. Shown only in the installed app (`display-mode: standalone`), only on a cold start, never between pages.
5. It never holds the page back: it leaves as soon as the first screen is ready, after 1.2 seconds at most.
6. For visitors who ask for reduced motion it is a still cover with no animation.
7. The app icon is the logo on the splash colour, because iPhones show see-through parts as black. A maskable version keeps the logo inside the safe zone. Sizes 192, 512 and 180 (Apple).
8. Phones that installed the app earlier may keep the old icon and splash until the manifest refreshes; the editor says so.

### Web address

1. Wave 1 keeps the planned address `stay.webserbisyo.com/<slug>` (System blueprint 8.4), the same path style as the food app. One certificate, no DNS work per owner, and each property still installs as its own app through its own manifest, with `id` and `scope` set to `/<slug>/`.
2. The owner can change the slug through `change_slug`: 3 to 40 characters, a–z, 0–9 and hyphens, no reserved word (admin, api, app, host, stay, www, help, login and others). Old slugs keep redirecting permanently, so printed QR codes and shared links keep working. Up to 3 changes a year.
3. No subdomains such as `<slug>.webserbisyo.com`. A wildcard needs its own certificate and DNS setup and a reserved list against our own subdomains, and gives owners little more than the path.
4. An owner's own domain (`www.theirplace.com`) is a paid add-on in wave 3, added through the Vercel Domains API: the owner adds a DNS record, we verify it, Vercel issues the certificate. Vercel's Pro plan allows unlimited custom domains per project (Hobby stops at 50) and limits additions to 100 an hour, so a simple queue is enough.

### Decisions

| # | Proposal | Why |
| --- | --- | --- |
| E1 | The 15 parts above, in a fixed order with show or hide switches | Same shape as the food app (E11), plus what rental sites need |
| E2 | Reuse the food editor's engine whole: preview frame, autosave, Undo, conflict answers, Publish list, phone dock and sheet | Already built and approved; only the parts and words change |
| E3 | Reuse Style (8 styles from the logo, fine-tune, magnifier, logo clean-up) and Fonts (8 pairs) as they are | Same reason; works on the device with no AI |
| E4 | Banners reuse the food carousel; hero photos never move by themselves | Changed from the first draft of this section, which kept banners still by default. The food carousel already has a Pause button and stays still for reduced motion, which is what WCAG 2.2.2 asks. Hero photos are a gallery, and NN/g found people miss content in moving carousels |
| E5 | Contact, location and hours live in Settings; the editor only shows or hides them and links there | The food app does the same (E12, T64), so one fact has one home |
| E6 | Two-layer splash, colour from the 60 by default, 5 CSS animations | Extends R51 without slowing the app or breaking on iPhone |
| E7 | Location shows the area only until payment | Safety for the owner and the building |
| E8 | Path address at launch, slug changes with redirects, own domain in wave 3, no subdomains | Least setup at launch |
| E9 | Numbers an owner could fake are worked out (prices, reply time, Verified, hosting since); `draft_rev` and `version` work like the food app's `baseVersion` and `contentVersion` | Trust, after the scam findings in section 2a; the version pair is proven code |

## 7b. Cross-check against the food app's code (every other page)

Done on 14 November 2026 against repo commit `df7c1b7`. Read: all owner-facing and customer-facing words in `packages/core/src/words.ts` (4,094 lines, which list every label, limit and message the pages show), the dashboard routes, the Settings sections and rules (`rules/settings.ts`), the sign-up form, the Insights page and the one database migration. A second, full pass the same day read every core rule file (packages/core/src/rules, 5,010 lines), the remaining words (checkout, catalog), the comments and logic of every owner screen (Settings, Orders, Members, Home, Catalog, the shell) and every guest screen (receipt, checkout, My orders, Rewards, Join, Account, Install, Shop info, Privacy, Home, Location), and the food app's ux.md, decisions.md, api.md and the security and business sections of SYSTEM.md. Rows F20 to F29 come from that pass, and F3 was corrected by it. Purely food parts were left out: basket, delivery fees, add-ons, variants and the kitchen ticket. **Before this, every page except the editor had been checked against the food app's documents only.**

**Two facts first.**

1. **The food app's backend is not built yet.** The API has sign-in only, and the database has one migration (`profiles`). Every other screen runs on mock data in `packages/data`. So our Database blueprint cannot be checked against real food tables; it was checked against the food app's Zod schemas in `packages/core` instead.
2. **Insights is an empty page** in the food app. Our `/reports` (OW-17) has nothing to copy from.

### What matched

Sign-in with email and password for owners; 6-digit email codes for customers (MB-01); pay with a screenshot and a reference, checked by hand, with "check it in your own GCash or Maya first" (our `wallet_checked`); proof photos deleted 30 days after the order (`PROOF_KEEP_DAYS = 30`), as in our limits; the plan states trial, active, due, overdue and paused, paid by GCash or Maya with proof; storage per owner (500 MB in the food app); install with iPhone steps; the offline page; the privacy page under RA 10173; the demo flag.

### What is missing or different

| # | Area | The food app has (code) | Our blueprint has | Proposal |
| --- | --- | --- | --- | --- |
| F1 | Settings layout | 9 sections in 3 groups (Your shop, You, Plan), each with a one-line status in the list; one save bar on every page (Unsaved, Discard, Save), a "Leave without saving?" check, "You're offline, Save waits", a "Customers see" preview beside the form | 6 settings pages with no shared pattern written down | Reuse the pattern. Groups: **Your property** (Property, Hours, Payments, Policies), **You** (Account, Notifications), **Plan** (Plan, Storage), **Team** (Team, Activity) |
| F2 | `/settings/property` (new) | Name; the link with Copy and Share QR; mobile (accepts 0917…, 917…, +63…), Messenger username, Facebook page, Google review link; address with "Show the address" switch; map pin from a pasted Google Maps link; a pickup note | Nowhere. Section 7a now sends contact and location here, so the page must exist | Add. Our slug can change with redirects (E8); the food app keeps its link fixed so printed QR codes work, and our redirects keep that promise |
| F3 | `/settings/hours` (new) | Opening hours, up to 4 times a day (28 in all), "Copy Monday to all days", overlap checks; no range runs past midnight: a late night ends at 12 MN and the next day starts at 12 MN; up to 60 closed dates with a reason | Reply and viewing hours only as columns (section 7a) | Add, for reply hours and viewing hours. Closed dates stay as calendar blocks |
| F4 | `/settings/account` (new) | Name; email (fixed for now); picture (faces, make your own, or a photo kept at 256 px); change password with a 6-digit email code; Light, Dark or System look saved on the device; "Sign out on every device"; "Ask to delete my account" (answered within 2 working days) | Nothing for the owner's own account | Add, as is |
| F5 | `/settings/storage` (new) | A meter by kind (photos, proofs, look, QR, profile); safe clean-ups (proofs on finished orders older than 7 days, photos on archived items, proofs already in a saved copy), each with a confirm and "Save a copy first"; unused uploads cleared every night; **Save a copy**: a ZIP of orders and payments as spreadsheets plus proof photos, for this month, last month or everything, link valid 24 hours, then an offer to free the space | "Storage used" on the Plan page only | Add, as bookings and payments. Owners need their proofs before the 30-day delete; this is the only way to keep them |
| F6 | Notifications | Email switches per kind (new order, payment to check, storage at 80 % and full, plan due 7 days and 1 day before) and a "Send to" address that can be a shared inbox | One email and push on the device | Add the per-kind switches and the "Send to" address |
| F7 | Payments | Cash, cash on delivery, GCash, Maya, **up to 3 bank accounts picked from a bank list**, **QR Ph**; QR images kept sharp at 1,000 px; a "Sample details, replace them" warning; at least one way must stay on | GCash, Maya and bank with QR | Add QR Ph, up to 3 banks from a list, the sample warning and "keep one on". Cash stays for walk-in rentals |
| F8 | Plan | One plan with a price per month; Pay now or **Pay ahead** for 1 or more months; "Send exactly ₱X to"; the 13-digit reference; "checked within 1 working day"; a "What's included" list; payment history | Pay with proof, banners, storage | Add Pay ahead with a months picker and the included list |
| F9 | Owner Home | Greeting with one story line; setup checklist; **Needs you**, worst first; a period picker (today, yesterday, 7 days, 30 days, this month, custom; 60 days kept); money split into Paid, To check and Not paid; **"Where it is"**: money per payment account (GCash, Maya, each bank by its last 4 digits); coming up in the next 7 days | "What needs me now?" only | Add "Where it is" and the period picker; owners match these totals against their own GCash and bank apps. Add "Coming up: next 7 days of arrivals" |
| F10 | Bookings and payments | Search by name, number or code; reject a proof with 4 reason chips that write a full sentence the owner can edit (amount does not match, photo not clear, wrong account, not received); cancel with reason chips the customer sees; after a time change, "Tell them on Messenger" copies a ready message; Undo after a move; a sound switch for new orders; print a slip; a private owner note; an activity list | Reject with a reason; cancel; notes | Add the reason chips, the search, Undo, the sound switch and the copied Messenger message after a date change |
| F11 | Conversation page (the receipt) | Pay card with countdown, Copy amount, Copy account and QR; proofs shrunk on the phone with sizes shown; retries when back online; **3 proofs per order, a new one only after a rejection**; Save as image, Print or PDF, Share link; the saved copy shown offline with "last updated"; **Rate your order (1 to 5 stars, a note up to 300) and "Review us on Google"** | Most of this, but no limits on proofs, no rating and no Google review link | Add the proof limit, the copy buttons, Save as image and **rate your stay with the Google review link**. Offline shows the saved conversation read-only; availability and prices still never come from a saved copy |
| F12 | Customer account and "My bookings" | Active and Past tabs with the next step; "Order again"; for guests, the list saved on this phone with a prompt to join; sign out on this phone | Bookings, saved details, consents, remove my details | Add Active and Past, "Book again" and the on-this-phone list for guests. Keep our self-service "remove my details" (stronger than the food app's "contact the shop") |
| F13 | Guests and members | Filters (ready, almost, regulars, quiet, new, guests) with the rule under each; sort; search by name, mobile or code; a private note; history; member QR at the counter | List, history, notes | Add filters for rentals (upcoming, staying now, returning with 2 or more stays, quiet, members, guests), sort and search |
| F14 | Rewards | A **stamp card**, not points: stamps per order, a goal of 4 to 20, a welcome stamp, a cap per day, week or month, rewards as peso off, a free item or a prize, "Fix stamps" (3 changes a day, with a reason) | Stamp cards for stays and tenants (wave 3, section 7c) | Supports the open question to switch to stamps per stay; waiting for Lex |
| F15 | Units | The item editor's "Visible / Hidden / Sold out" state line; **Copy this item**; "Add another" after saving; a live preview card; unsaved bar | Details, photos in order, amenities, terms | Add **Duplicate unit** (condo owners list many near-identical units) and the live preview card |
| F16 | Install and updates | "New version ready, Refresh"; a test notification; "Notifications are off in your browser" | iPhone steps | Add the update banner and the test notification |
| F17 | Privacy page | A short **Tagalog summary** ("Sa madaling salita") above the full notice; a contents list; last updated | Privacy page | Add the Tagalog summary |
| F18 | Uploads | 15 MB, JPEG, PNG or WebP; a clear HEIC message; shrunk on the device with a before-and-after slider | 15 MB limit | Add the HEIC message and the before-and-after compare |
| F19 | Shell and demo | An online or offline dot on the owner's picture; Share my shop in the menu; "Demo · bookings are not real" ribbon on demo pages | Share tools (OW-20); demo flag | Add the dot and the demo ribbon |
| F20 | Owner sign-in | Show or hide password; **forgot password by a 6-digit email code** (no links); separate Setup, **Pending** and **Suspended** screens; the account state is checked again every 30 seconds and when the tab comes back | Sign up, wait for approval, sign in (OW-01) | Add forgot-password by code, the Suspended screen and the 30-second recheck, so a suspended owner is locked out without signing in again |
| F21 | Reserve form (the food app's checkout) | One page in numbered cards (how, who, pay); **Remember me on this phone**; a **Recommended** way to pay; the consent line linking the privacy notice; the button says why it can't be pressed (offline, closed, fix something); "Finish or cancel your other order first"; re-quoted before sending; a time that filled up reopens the picker at that day; a retry with the same key returns the same order; back from the receipt never returns to a spent form; a short "sending" moment with Skip | Reserve with name, mobile and email; timed hold (BK-02) | Add Remember me, Recommended, the reasons on a disabled button, the slot-taken reopen and the no-way-back-to-a-spent-form rule. Email stays required for us, because the private link is sent by email |
| F22 | Feedback rules on every owner page (food `docs/ux.md` section 8) | Reversible actions happen at once with **Undo** in a toast; only actions that can't be undone ask first, with a red button naming the action; Save buttons go verb → spinner → check; Copy shows a check for 1.5 s, with a fallback that says how to copy by hand; toasts move to the top while a sheet is open; a menu needs at least two actions; Save never moves the owner; lists keep search and filters in the address; the saved row is outlined for a moment; Enter moves to the next field, only Save saves | Seven page states only | Adopt these as shared rules in section 7, so every page behaves the same |
| F23 | App feel on phones (food `docs/ux.md` sections 1, 2 and 9) | One nav per device (dock on phones, sidebar from 1024 px); 16 px inputs so iPhone doesn't zoom; `100dvh`; the dock hides while the keyboard is open; bottom sheets instead of dialogs on phones; fade-and-rise page changes, off for reduced motion; skeletons in the shape of the content; **pull to refresh** on Home and the guest pages; one motion plan with fixed durations; forgiving input ("₱120", "120.50", references ignore spaces) | Not written down | Adopt as shared rules |
| F24 | Owner lists (Units, Guests) | Select mode with bulk actions and Undo; **archive instead of delete** once something has orders, delete only if it never had any; a restored item comes back hidden; a **Sample data** banner with "Remove samples" so a new owner starts with a filled page | Archive, list or unlist | Add bulk actions with Undo, "delete only if never booked", restore-as-hidden, and sample data for new owners |
| F25 | Bookings calendar (the food app's T85) | Each booking card coloured by who booked (member, first booking, guest) with an icon and a word; closed times shaded; full times washed red; drag only onto an open time, with a 10-second Undo; day headers with count and total; the tab title shows the open count; a new booking glows for 2 seconds with a soft chime | Every unit on one timeline; block dates; move a booking (OW-04) | Add the who-booked colours, the Undo after a move, the count in the tab title and the new-booking glow and chime |
| F26 | Plan details (the food app's T67) | 14-day trial; pay for **1, 3 or 6 months**; **one pending payment at a time**; reference at least 6 characters, never reused; due 7 days before the end; 7 days of grace; then paused | Trial, due, overdue, paused; pay with proof | Add the 1, 3 or 6 months choice and "one pending payment at a time". The price stays open |
| F27 | Install and notifications (the food app's N36, T32) | The install card shows only **after joining or the first order**, never on a first visit; "Hide this" keeps it away 30 days per shop; Notify me asks permission only on its own tap; the home-screen name is cut to 12 characters; a new version waits for the customer's Refresh tap; checkout, receipts and anything with a private link are never cached | Install with iPhone steps (PA-05) | Add these timing and caching rules |
| F28 | Files register (the food app's api.md) | Every stored file has a row (owner, kind, path, bytes, used by), so the storage meter is a sum, not a bucket scan; uploads not confirmed within an hour are removed; exports are CSV with a byte-order mark and formula-safe cells | A `files` table with kinds and the 15 MB limit | Add "used by", the 1-hour clean-up of unconfirmed uploads, and formula-safe CSV for every export |
| F29 | Customer rewards pages (the food app's Rewards and Join) | A member QR for the counter; the history with a coloured dot per kind; a prize code with its own QR; confetti once per reward on each phone; join shows the masked email ("j\*\*\*@example.com"); a wrong code clears the boxes; resend after 60 seconds | Stamp cards, wave 3 | Use these when the rewards choice (F14) is made |

**F1 to F29 are approved and merged (14 November 2026):** the 4 owner routes `/settings/property`, `/settings/hours`, `/settings/account` and `/settings/storage` (46 routes in all); OW-23 to OW-28, PA-11 and BK-16 in the catalog; and in the Database blueprint `stay_reviews`, `data_exports`, `page_reports`, the `notify` switches on `account_members`, and `qr_ph` with a bank list on `payment_accounts`. Start here, the sitemap and the AI handoff brief carry the new counts.

## 7c. Rewards: stamps or points, for stays and tenants

Decided on 14 November 2026, wave 3; points added as a second mode the same day at Lex's request. Tables: `stamp_cards`, `rewards`, `stamp_ledger`, `reward_claims` (the names stay; a card in points mode uses the same tables).

**Two modes, one card each.** Each property can run one card for stays and one for tenants, and each card picks a mode:

- **Stamps** (recommended for stays) count visits: "3 stays, then a free night". Easy to understand and to reach for guests who come back a few times a year. In Oracle's hotel loyalty survey, 78 % of guests preferred immediate benefits to collecting points.
- **Points** count pesos: "1 point per ₱100 paid". Fairer when spending varies a lot (one night against seven, or rents of different sizes), and the guest chooses which reward to spend on.

The mode is picked when the card is first turned on and locks once anyone has earned on it, so no balance changes meaning. An owner can still run stamps for stays and points for tenants.

| Setting | Stamps mode | Points mode |
| --- | --- | --- |
| Earned on a stay | 1 per completed, fully paid stay; optional extra stamp every N nights (at most 3 a stay); optional minimum total | 1 to 20 points per full ₱100 of a completed, fully paid stay |
| Earned on rent | 1 per bill paid in full by its due date | The points for the bill's amount, if paid in full by its due date |
| Rewards | Up to 3 milestones on the way to a goal of 2 to 12 stamps (default 3 for stays, 6 for tenants); the goal restarts the card | Up to 10 rewards, each with a point cost; the guest spends points to claim one and can claim again later |
| Reward kinds | Amount off, percent off (with an optional peso cap), a free night (stays only), a perk in words (early check-in, late checkout, a welcome basket) or a custom prize the owner describes | The same |
| Welcome gift | 1 stamp on joining, on or off | 0 to 500 points on joining |
| Member perk | Stays only, given at once on joining: 1 to 20 % off, an amount off, or a perk in words | The same |
| Cap | Optional: at most N stamps a month per guest | Optional: at most N points a month per guest |
| Ending | Ready rewards can end after a number of months | The same, and points can expire after 6 to 36 months with no new points |
| Limited pieces, pause, off | The rules below | The same |

**How pause, limits and public counts work**

1. **Paused:** nothing new is earned; guests keep their stamps or points and ready rewards and can still use them. If the owner picks a date, the card turns on again by itself. The page says "Paused until 5 January".
2. **Off:** the card is hidden from the page, but balances and ready rewards are still honoured. The owner's switch never takes away what a guest earned.
3. **Limited:** each reward can have a number of pieces, and can be one per customer. A claim holds a piece; a cancelled claim gives back the piece and the stamps or points. When none are left the guest keeps the balance and the reward says "All claimed" until the owner adds pieces.
4. **Public counts are worked out, never typed:** "Only 20", then "5 left" at 20 % or less, then "All 20 claimed". The owner cannot type a fake count.
5. **What is public:** the stays card (how to earn, its rewards and their costs, pieces left) and the member count, shown from 5 members. Names and balances are never shown. The tenant card shows only in the tenant's own pages, because how someone pays rent is private.
6. **Fixes:** plus or minus 1 stamp, or up to 100 points, with a reason; at most 3 changes per guest a day; Undo for 10 seconds. A change to the goal, a milestone or a point cost shows its effect before saving and never takes back a ready reward.
7. **Points expiry:** members get a reminder 14 days before; their history shows one line for what expired.

**Screens.** Owner: `/rewards` (pick the mode with the recommendation shown, set rewards, pause, pieces left, give a reward) and the member's page (balance, history, fix). Guest: the card on the property page, the balance and rewards in the account (with a Claim button for points rewards), the code and QR, and a discount switch when reserving.

## 7d. Final research: long-term rentals and trust

Done on 14 November 2026 against TurboTenant (a US small-landlord tool), Philippine listing sites, Philippine scam reports and the 2026 rent control rule. Decided.

| Found | What we do | Feature |
| --- | --- | --- |
| Small-landlord tools send rent and lease-end reminders and add late fees by themselves | A reminder 60 days before a lease ends; a late fee rule the owner sets, added once to an unpaid bill and removable | RN-09 |
| Move-in and move-out condition reports with photos prevent deposit fights | A checklist per lease, up to 40 items with photos, confirmed by the tenant; a deduction can point to an item | RN-10 |
| Pre-screen questions: move-in date, occupants, pets, work | Optional application details on a rental inquiry; no ID images kept | RN-11 |
| The most common Philippine rental scam is a "reservation fee" sent by GCash for a unit never seen, found through Facebook and Messenger | The trust panel (PA-10), plus a "Report this page" link that goes to the super admin | PA-11 |
| Owners already list on Facebook groups and Marketplace | A button that copies a ready listing text with price, highlights and the page link | OW-28 |
| Reviews bring direct bookings | A private "Rate your stay" link after checkout, then the owner's Google review link | BK-16 |
| For 2026, covered units at ₱10,000 a month or less with the same tenant may rise by at most 1 % (NHSB Resolution 2024-01, in force to 31 December 2026) | A warning on a renewal above the cap, never a block; the cap is a platform setting, so the 2027 rule needs no code | RN-09 |

**Not taken:** tenant credit and background checks (no fair Philippine equivalent), e-signature and autopay (later, with a payment gateway).

## 8. Main flows

### Booking a stay

&#91;embedded content: booking a stay · 7 steps across customer, owner and system\]

The guest does four things and the owner does one. If the owner rejects the proof, the flow returns to step 4 with the reason shown and the hold clock restarted. If nobody pays in time, the hold expires and the dates are free again.

### Renting a unit

&#91;embedded content: renting a unit · 8 steps, with a monthly loop\]

Steps 5 to 7 repeat every month until move-out. An existing tenant skips steps 1 to 3: the owner adds the lease and the tenant is invited by email.

### Shorter flows

**An owner starts**

1. Applies with a name, email, mobile and password.
2. Waits. The founder approves in super admin and the 14-day trial begins.
3. Follows the setup checklist: property, first unit, photos, price, payment accounts, house rules and arrival details.
4. Previews the page and publishes it.
5. Shares the link and QR.
6. Pays the plan with proof before the trial ends.

**The owner reviews a payment**

1. Gets an alert: a proof is waiting.
2. Opens it and sees the amount expected, the amount claimed and the reference.
3. Checks their own GCash, Maya or bank for that reference.
4. Approves, or rejects with a reason the customer will read.
5. On approval the booking is confirmed and the receipt is sent without further action.

**A guest cancels**

1. Opens the conversation and chooses Cancel.
2. Reads the owner's cancellation policy and confirms.
3. The dates are freed at once and the owner is told.
4. If money is due back, the owner sends it outside the app and records the refund.

**A booking is moved**

1. The guest asks for new dates in the chat.
2. The owner moves the booking on the calendar.
3. The database checks the new dates. If they are taken, nothing changes.
4. The price is worked out again and both sides see the difference.

**An owner's plan lapses**

1. Seven days before the paid period ends, a banner and an email say payment is due.
2. After the end date, a 7-day grace period starts and the banner turns urgent.
3. After the grace period the account is paused. The property page shows contact details only, and no new bookings can be made.
4. Existing bookings and conversations keep working. Nothing is deleted.
5. An approved plan payment lifts the pause at once.

## 9. Conversation, payment and notice rules

### The conversation

A conversation holds three kinds of line, and they must look different from one another.

| Line | Written by | Example |
| --- | --- | --- |
| Chat bubble | Customer or owner | "Can we check in at 1 PM?" |
| Status line | The system | "Booking confirmed" |
| Proof card | Customer, then updated by the owner's decision | Amount, method, reference, up to 3 images, and its state |

| Rule | Value |
| --- | --- |
| Who can write | The customer with the link or signed in, and the owner. A closed conversation is read-only |
| Editing and deleting | Neither side can edit or delete. The owner can hide a message; its text is kept in case of a dispute |
| Length | 2,000 characters; one photo per message |
| Speed limit | 30 messages a minute per conversation |
| Refresh | The page checks for new lines every 15 seconds and when it regains focus, as the food app decided. Live streaming is later |
| Closing | By the owner, or automatically 30 days after checkout or move-out |
| Unread | Each side has a read mark; the dashboard counts unread conversations |

### The proof card

| Rule | Value |
| --- | --- |
| Needs | Amount, method, reference number, date paid, one to three images |
| One at a time | A booking or bill can have one proof waiting. A new one is possible after a decision |
| States | Waiting, approved, rejected with the owner's reason, reversed |
| Reference | Compared without spaces or dashes. A reference already used at that owner is refused |
| Images | Private. Shown through links that last five minutes. Deleted 30 days after approval; the card then says the image was removed |
| Part payments | Allowed. The booking confirms when approved payments reach the down payment; the balance stays visible |
| Cash | The owner records it; no proof is needed |

**Approving needs a real check.** For GCash, Maya or bank payments, the approve step asks the owner to confirm they saw the money in their own app or bank history. The screenshot alone is never enough.

**Other cards in the conversation**

| Card | When it shows | Who acts |
| --- | --- | --- |
| Guest list | The property asks for IDs. It shows after the hold, with the due time | The guest fills it in; the owner can unlock it |
| Cancellation preview | The guest taps Cancel. It shows the preset, the amount that would come back, or the date-change option | The guest confirms |
| Payment details changed | The owner adds or edits a payment account while this booking is open | Nobody; it is a status line |
| Repair request (wave 2) | A tenant reports a problem | The owner updates the status |

The owner's reply box has saved replies one tap away.

### Who is told what

Email is the record and push is a bonus. A push message never carries a name, an amount or an address; it states what happened and links to the conversation.

| Event | Customer | Owner | Wave |
| --- | --- | --- | --- |
| Dates held | Email with the private link; push | Email; push | 1 |
| Hold has 15 minutes left | Push |  | 1 |
| Hold expired | Email | Shown on Home | 1 |
| Proof uploaded |  | Email; push | 1 |
| Proof waiting 24 hours |  | Reminder | 1 |
| Payment approved | Email with receipt; push |  | 1 |
| Proof rejected | Email with the reason; push |  | 1 |
| New message | Push; email if unread after 10 minutes | The same | 1 |
| Check-in tomorrow | Email; push | Shown on Home | 1 |
| Booking cancelled | Email; push | Email; push | 1 |
| Viewing requested or confirmed | Email; push | Email; push | 2 |
| Rent bill issued | Email; push |  | 2 |
| Rent due in 3 days, due today | Push; email on the due day |  | 2 |
| Rent late by 1, 3 and 7 days | Email; push | Email on day 1; shown on Home | 2 |
| Trial ending, plan due, overdue, paused |  | Email; banner | 1 |
| Sign-in code | Email |  | 1 |
| Guest list due within 24 hours, not sent | Email; push |  | 1 |
| Guest list sent |  | Push; shown on the booking | 1 |
| Payment account added or changed | Status line in open conversations | Email | 1 |
| Repair request opened or updated | Push | Email; push | 2 |

**Push rules**

1. Permission is asked only after a tap on "Notify me", and only once a booking exists. It is never asked on first load.
2. On iPhone, push works on iOS 16.4 or later and only after the app is added to the Home Screen ([WebKit](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)). The install page explains this.
3. There are two service workers, because there are two apps. The property app uses Serwist for Next.js ([Next.js PWA guide](https://nextjs.org/docs/app/guides/progressive-web-apps)). The dashboard uses Serwist's Vite plugin ([Serwist: Vite](https://serwist.pages.dev/docs/vite/getting-started)). The Vite plugin is a new package and needs your yes.
4. Both apps register a device through the API. The API sends through the outbox with the `web-push` library.
5. A device that the push service reports as gone is switched off, not retried.
6. Marketing messages are not in the first launch. They need the marketing consent and are a later feature.

## 10. Business rules, account states, reports and tracking

### Limits in one place

Every number below is enforced by the server. A page may show the limit, but it never decides it. The values match the Database blueprint; where the two differ, the Database blueprint wins.

| Rule | Value | Who sets it |
| --- | --- | --- |
| Hold time before payment | 60 minutes by default; 15 minutes to 24 hours | Owner, per unit |
| Hold time once a proof is uploaded | 72 hours, so the owner has time to check | Platform |
| Unpaid holds per customer, per owner | 2 | Platform |
| Down payment | 10% to 100% of the total | Owner, per unit |
| Stay length | 1 to 30 nights by default | Owner, per unit |
| Preparation nights after a stay | 0 to 2 | Owner, per unit |
| Weekly and monthly discount | Stays of 7 nights or more; stays of 28 nights or more | Owner, per unit |
| How far ahead dates open | 365 days by default | Owner, per unit |
| Rent due day | Day 1 to 28 of the month | Owner, per lease |
| Rent bill issued | 7 days before the due day | Platform |
| Upload size | 15 MB; images only for photos and proofs | Platform |
| Storage per owner | 2 GB. Notice at 80%. New photos refused at 100%. Proofs always accepted | Plan |
| Proof images kept | 30 days after approval | Platform |
| Plan | ₱599 a month, 5 units included, ₱100 for each extra unit, 14-day trial | Super admin |
| Cancellation | One of six presets | Owner, per property |
| Guest list due | 48 hours before check-in by default; 0 to 168 | Owner, per property |
| Guest ID images kept | 7 days after checkout | Platform |
| Up-front money on a covered lease | A warning above 1 month advance or 2 months deposit (RA 9653) | Platform |

### Money rules

1. **Pesos only.** Amounts are stored in centavos and shown in pesos.
2. **Philippine time only.** A night, a due day and "today" all mean Manila time, whatever the phone's clock says.
3. **The price is frozen at the hold.** The booking keeps its own copy of every price line. A later price change never alters an existing booking.
4. **The app moves no money.** Customers pay the owner directly. The app records the proof, the decision and the receipt. A payment gateway is a later feature.
5. **Refunds are recorded, not sent.** The owner sends the money outside the app and records it.
6. **Receipts are numbered without gaps**, per owner. A receipt is an acknowledgement of payment. It is not a BIR official receipt, and the receipt page must say so.
7. **Nothing paid is deleted.** A wrong payment is reversed with a reason, and both lines stay visible.

### Account states

The database stores four plan states: trial, active, paused and cancelled. "Due" and "grace" are worked out from the paid-until date, so they can never disagree with it.

| State | The owner can | Visitors see |
| --- | --- | --- |
| Waiting for approval | Set up everything | Nothing; the page is not public |
| Trial, 14 days | Everything | The full property page |
| Active | Everything | The full property page |
| Due, 7 days before the paid period ends | Everything; a banner shows | The full property page |
| Grace, 7 days after it ends | Everything; the banner is urgent | The full property page |
| Paused | Reply, review payments, manage existing bookings, pay the plan | Contact details only; no new bookings |
| Cancelled | Sign in and export | Nothing |

A demo account is a separate flag. It is never billed, never paused, and never counted in platform totals.

### Reports

The first launch has no report page. Home shows counts only. Reports arrive in wave 2.

| Report | The question it answers | How it is worked out |
| --- | --- | --- |
| Occupancy | How full was I? | Nights booked ÷ nights open. Blocked nights are not open |
| Average nightly rate | What did a night earn? | Stay income ÷ nights booked |
| Income per open night | Am I pricing well? | Stay income ÷ nights open. Hotels call this RevPAR. I added it because occupancy and rate can each look good while income falls |
| Income by month | What came in? | Approved payments minus reversals, by method |
| Online against manual | Is the app bringing bookings? | Bookings made by guests ÷ all bookings |
| Collection on time | Do tenants pay on time? | Bills paid on or before the due day ÷ bills due |
| Unpaid rent | Who owes what? | Open bills grouped by days late: 1 to 7, 8 to 30, over 30 |

**Report rules**

1. Every figure comes from a database view. A page never adds or divides.
2. Each report opens on this month and has a date range and a unit filter.
3. Each report exports to CSV.
4. Charts use the chart set already installed (EvilCharts on Recharts). Which chart suits which report is decided in that page's research step.
5. Every chart has the same numbers in a table beneath it, for screen readers and for small phones.

The super admin has four of their own: owners by state, plan income by month, usage per owner, and job health.

### Tracking

Tracking has two parts. Its main job is to help Smart App PH win owners through ads. It does not track an owner's guests for anyone's ads. The full Meta plan, decided on 15 November 2026, is in Meta Pixel, CAPI and super admin.

| Part | What it is | Who uses it | Wave |
| --- | --- | --- | --- |
| Platform Meta Pixel and Conversions API | One Pixel owned by Smart App PH. It runs only on our own pages for owners: the landing page, sign-up and setup. It tells Meta which ads bring owners who sign up and pay | The super admin, for ads that reach staycation and rental owners | 1 |
| Funnel events | Our own count of a guest's steps on a property page: property viewed, unit viewed, dates picked, booking started, dates held, proof uploaded, booking confirmed. No names, no contact details, never sent to Meta | The owner, as a drop-off report; the super admin, in total | 3 |

| Owner's step | Meta event | Sent from |
| --- | --- | --- |
| Opens the landing page, sign-up or setup | PageView | Browser |
| Scrolls to the plans on the landing page | ViewContent | Browser |
| Finishes sign-up after the email code | CompleteRegistration | Browser and server, one event id |
| Is approved by the super admin; the trial starts | StartTrial | Server only |
| First plan payment approved | Purchase, with the amount in pesos | Server only |

**Tracking rules**

1. **Our pages only.** The platform Pixel never loads on a property page, a booking page or a conversation page.
2. **Consent first.** Nothing goes to Meta, from the browser or the server, until the visitor agrees on the consent bar. The choice is stored and can be changed from the footer.
3. **Purchase means approved.** It is sent when the super admin approves the plan payment, not when a proof is uploaded.
4. **One id for both paths.** When an event goes from the browser and the server, both carry the same event id and name, which is how Meta counts it once ([Meta: deduplication](https://developers.facebook.com/docs/marketing-api/conversions-api/deduplicate-pixel-and-server-events)).
5. **The super admin switches each event on or off**, sets the Pixel to Off, Test or Live, and sees every delivery.
6. **A tracking failure never blocks anything.** Server events wait in `meta_capi_deliveries` and a job sends and retries them; nothing calls Meta inside an owner's request.
7. **Owner Pixels are a later feature.** The Pixel table already allows a Pixel per owner or per property, so adding them later needs no new table.
8. **The super admin is never tracked.** A super admin session, or a super admin viewing an owner's account, never loads the Pixel, and events the super admin triggers carry only the owner's saved data.

## 11. Build order and the research step for each page

### Build order

The work is cut into slices. Each slice ends with something a person can click through on a phone, from the database up to the screen. No slice builds a layer on its own.

**Order of work, updated 16 November 2026.** The slices and their order stay as they are. Inside a wave, the screens are now built first on mock data, and the database and API for the same slices follow; the Build roadmap tab has the phases. A slice is still done only when it runs on the real database, as the checklist below says.

**Wave 1: booking core**

| Slice | Ends with | Feature groups |
| --- | --- | --- |
| 1. Foundation | An owner signs up, the super admin approves, the owner signs in | OW-01, SA, PL-03, PL-04 |
| 2. Listing | An owner adds a property, a unit, photos, prices and payment accounts | OW-02, OW-08, OW-09, OW-12 |
| 3. Public page | A visitor opens the property and unit pages; the owner edits and publishes | PA, OW-11, OW-20 |
| 4. Dates | A visitor picks dates, sees the price and holds them; the owner blocks dates and adds a manual booking | BK, OW-04 |
| 5. Conversation and payment | The guest uploads a proof; the owner approves; a receipt is issued | BK, OW-06, OW-07 |
| 6. Notices | Email for every event in section 9; push on both apps | PL-01, PL-02, OW-19 |
| 7. Daily work | Home, the bookings board, guests, the activity list | OW-03, OW-05, OW-10, OW-14, OW-21 |
| 8. Members | A guest joins with an email code and sees their bookings | MB |
| 9. Plans | Trial, plan payment, pause; the super admin's plans, usage, health and audit pages | OW-13, SA |
| 10. Pilot ready | The owner landing page, demo data, the install and privacy pages, limits tested, a pilot owner live | PL-05, PL-07, PL-09, PA |

Slice 4 is the one that must not slip. It holds the rule the whole product stands on: two people can never hold the same night.

**Wave 2: rentals.** Inquiries and viewings, then reserving a unit, then leases and move-in, then monthly bills with utility readings and rent payments, then repair requests and the tenant's page, then staff sign-ins and reports.

**Wave 3: rewards and the funnel.** Stamp cards for stays and tenants (section 7c), then the funnel report. The owner landing page and the platform Meta Pixel are in wave 1, slice 10.

**A slice is done when**

- [ ] The migration, its security rules and its tests are in one change.
- [ ] The API endpoints are written into the API contract.
- [ ] Every page in the slice has its loading, empty, error and offline states.
- [ ] It works on a 360-pixel screen, with a keyboard, and on a slow connection.
- [ ] The wording has been read aloud once by someone who did not write it.
- [ ] Demo data covers it.
- [ ] This page and the Database blueprint still match what was built.

### The research step for each page

This page names no components on purpose. Before a page is built, it gets one short research pass. The pass turns a page brief into a page spec.

| Step | What to do | Output |
| --- | --- | --- |
| 1. Read | The page brief in section 7, the features it serves, and the product rules in section 2 | A one-line goal for the page |
| 2. Data | Find its tables, functions and error codes in the Database blueprint | The list of reads and writes |
| 3. References | Look at three to five live products that have this page. Note what to copy and what to avoid | A short reference note with screenshots |
| 4. Reuse | Check the food app for a pattern that already solves it | Reuse, adapt, or new |
| 5. Spec | Write the fields, checks, states, empty states, wording and error messages | The page spec |
| 6. Components | Choose from the installed UI set. This is the first point where a component is named | The component list |
| 7. Contract | Add the page's endpoints to the API contract | Contract entries |
| 8. Build | Build with the AI, one slice of the page at a time | Working page |
| 9. Check | The ten product rules, the accessibility list, the speed budget, a real phone | Pass or a fix list |
| 10. Write back | If a decision changed, update this page or the Database blueprint first | Docs that still tell the truth |

**What to give the AI at the start of a page**

1. The AI handoff brief tab.
2. The page's row from section 7 and its features from section 5.
3. The matching tables and functions from the Database blueprint.
4. The page spec from step 5.

Give it nothing else from these documents. A smaller context makes fewer wrong guesses.

## 12. Decisions and what is still open

Decided on 14 November 2026, on the founder's instruction to answer these as co-founder.

| Point | Decision |
| --- | --- |
| The added routes and the dashboard menu order | Approved, with `/settings/team` and the owner landing page added |
| Notice timings | Approved as written |
| New packages | Yes to `@serwist/vite` with `@serwist/window`, `@nestjs/schedule` and `@nestjs/throttler`. Each goes into the Stack register with an exact version before it is installed |
| Cancellation policies | Six presets, defined in the Database blueprint under `properties` |
| Language | English at launch, in plain words. Every label lives in one strings file per app, so Filipino can be added without touching pages. Owners write their own content in any language |
| Staff sign-ins | Wave 2, with one fixed caretaker role (OW-22) |
| Receipts and the BIR | The app's receipt stays an acknowledgement and says so. Owners issue their own BIR receipts outside the app |
| Push on iPhone | Not a decision but a test: on a real iPhone in slice 6, before push is promised to owners |
| The platform Pixel | Moved to wave 1, slice 10, with the owner landing page |
| Owner interviews | Replaced for now by section 2a. Still worth doing before the pilot |
| Page editor E1 to E9 | Approved as written in section 7a |
| Code cross-check F1 to F29 | Approved and merged into the catalog, routes, briefs and Database blueprint |
| Rewards | Stamp cards, not points: one card for stays and one for tenants per property, up to 3 milestones, limited pieces with public counts, pause until a date (section 7c) |
| Final research | Report this page (PA-11), rate your stay (BK-16), lease reminders and late fee (RN-09), move-in and move-out checklist (RN-10), application details (RN-11), Facebook listing copy (OW-28) (section 7d) |
| Rent increase cap | A warning, never a block, using a platform setting: 1 % in 2026 for covered units |
| Points mode | Added on Lex's request: each card picks stamps or points (section 7c); stamps stay the recommended default for stays |

**Still open**

- [ ] The API contract. It is the next document.
- [ ] The ten owner interviews, using the guide in section 2a.
- [ ] Re-check the rent cap when the NHSB sets the rule for 2027 (the current one ends 31 December 2026).
- [ ] An accountant to confirm how long payment proofs and receipts must be kept.

Later features, already allowed for in the database: public reviews on the page, promotions, co-hosts, calendar sync with other sites, a payment gateway with autopay, e-signature, marketing messages and live chat.

**Tours are MVP B.** The third listing type (per-head packages on fixed dates) is planned in the Tours (MVP B) tab, with its own features, routes and tests. None of its pages are in the 46 routes above. Its section 12 lists six small rules the MVP A build must follow so tours can be added later.

Nothing on this page has been built or tested.

## 13. Sources

Opened on 14 November 2026.

- WebKit: [Web Push for Web Apps on iOS and iPadOS](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)
- Next.js: [Progressive Web Apps guide](https://nextjs.org/docs/app/guides/progressive-web-apps)
- Serwist: [Getting started with Vite](https://serwist.pages.dev/docs/vite/getting-started). The page shows a service worker file that we write ourselves. It does not show a push example, so push in the dashboard is unproven until slice 6.
- Meta: [Handling duplicate Pixel and Conversions API events](https://developers.facebook.com/docs/marketing-api/conversions-api/deduplicate-pixel-and-server-events) and the [Pixel standard events reference](https://developers.facebook.com/docs/meta-pixel/reference)
- The Database blueprint tab, for every limit, table and function named here
- The food app repository, read-only, for the shape of the feature catalog and the two-door rule

* Research in section 2a: [GMA News on CICC staycation scam reports](https://www.gmanetwork.com/news/topstories/nation/981394/cicc-staycation-scam/story/), [GCash advisory via Mynt](https://mynt.com.ph/newsroom/gcash-warns-public-on-emerging-ai-generated-fake-receipts-scams-urges-users-to-always-check-transactions-tab), [Airbnb quick replies](https://www.airbnb.ca/help/article/2898), [Hostaway on Airbnb cancellation policies](https://www.hostaway.com/vacation-rental-guide/airbnb-host-cancellation-policy/), [RentRedi landlord survey](https://rentredi.com/blog/most-landlords-consider-rent-late-within-a-week-survey-shows/), [RentScout on RA 9653](https://rentscout.ph/blog/tenant-rights-philippines-rent-control-act-guide), and the listings and terms linked in the table

- Vercel multi-tenant domains and limits: [Concepts](https://vercel.com/docs/platforms/multi-tenant-platforms/concepts), [Limits](https://vercel.com/docs/platforms/multi-tenant-platforms/limits)
- Manifest colours and splash: [web.dev, Add a web app manifest](https://web.dev/add-manifest)
- Moving carousels: [Texas A&M summary of NN/g findings](https://web.tamu.edu/?p=1845)
- Direct booking site features: [Hostaway direct booking](https://get.hostaway.com/direct-booking/)

* Oracle hotel loyalty survey, 78 % prefer immediate benefits: [Lodging Magazine](https://lodgingmagazine.com/oracle-study-reveals-travelers-perceptions-of-hotel-loyalty-programs/)
* TurboTenant features (reminders, late fees, renewals): [turbotenant.com](https://www.turbotenant.com/property-management/simple-free-property-management/)
* Rental scams in the Philippines: [RentScout](https://rentscout.ph/blog/how-to-spot-rental-scams-philippines)
* Rent control 2026: [NHSB Resolution 2024-01 (PDF)](https://philpropertyexpert.com/public/NHSB_Resolution_2024-01_Rent-Control-2025-2026.pdf), [RentScout on the extension](https://rentscout.ph/blog/ra-9653-rent-control-act-extensions-philippines-2026)
