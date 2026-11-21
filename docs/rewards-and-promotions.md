# Guest rewards and promotions plan

Proposed by Claude and approved for the plan by Lex on 21 Nov 2026. Decisions O11 (push campaigns), O12 (referral), O13 (discount engine and promo codes) and O14 (the five settings below) in `docs/decisions.md`. Features OW-29 to OW-37, BK-20 and MB-07 in the Feature blueprint. Built as screens in **Phase 7**, for real in **Phases 10–12**; the loyalty card (Phase 16) reuses the same engine.

**Why:** a key selling point. Owners pay for tools that bring bookings: promo codes bring sales, referral brings new guests, push notices spread the word, and the loyalty card brings guests back. Filipino guests already know vouchers and codes from Shopee, Lazada and Grab.

Research checked on 21 Nov 2026: Stripe coupons and promotion codes (a discount rule with many codes; total redemption limits; first-time-customer only; minimum amount; expiry; limit to one customer; deactivate without deleting), Shopify discount codes (one shared code vs bulk unique single-use codes; one use per customer counted by email or phone; codes without look-alike characters), Shopee seller vouchers (minimum spend, claims per buyer, dates; one seller voucher per checkout; shows how much more is needed), Booking.com Genius (levels from completed stays, discounts applied automatically, no code), GrabRewards to GrabCoins (tiers dropped in 2026 for one simple currency).

## A. Already planned (unchanged)

| Part                                     | What it does                                                                         | Phase              |
| ---------------------------------------- | ------------------------------------------------------------------------------------ | ------------------ |
| Automatic push (PL-02, BK-12)            | Booking held, payment approved or rejected, check-in reminder, rent due, new message | 7 screens, 12 real |
| Owner push notices (O11, OW-29 to OW-31) | Owner sends notices to guests who agreed to promos                                   | 7                  |
| Long-stay discounts                      | Weekly and monthly % off                                                             | Built (P4-6)       |
| Promo banners and announcements          | Pictures and text on the property page                                               | 5 (page editor)    |
| Loyalty card (section 7c)                | Stamps or points, tenant card, welcome gift, member perk, limited rewards, pause     | 16                 |

## B. Added

### 1. The discount engine (built once)

A **discount rule** says what the guest gets and when; one rule can have many **codes** (one rule "10% off" can carry a public code, a code per influencer and a Facebook code, and the owner sees which brought bookings).

- **Gives:** ₱ off, % off (optional peso cap), a free night, or a perk in words.
- **Applies when:** units; stay dates (check-in weekdays, blocked dates such as 24–31 Dec); minimum nights; minimum total; start and end; new guests only (never booked at this property); total uses; uses per guest (counted by verified phone or email); one named guest only.
- **Three ways to give it:** a **shared code** (HOLIDAY20, with a total limit), **unique codes** (a batch, each works once, no look-alike characters 0/O/1/I/L), or an **automatic deal** (no code, the price is lower).
- **Pause** without deleting; codes that run out or end can't be turned on again.

### 2. Promo codes for owners

- Owner: Promotions → New → discount → shared or unique codes → limits → preview ("Guests see −₱300") → Save → share (copy, push notice, show on the page).
- Guest: pick dates → enter the code → "Code applied −₱300" in the price, or a reason in words: "This code is for stays from 2 nights", "This code has run out", "This code ended on 31 Dec", "Book ₱800 more to use this code".
- Tenants: a code can apply to the first month or the advance.

### 3. Referral

1. After a first completed stay, each member gets a personal code and link (`/ulap-suites?ref=MARIA25`).
2. **The friend** gets a discount on a first stay, shown at once in the price. Only for someone who never booked at that property, and never with the referrer's own phone or email.
3. **The referrer** gets the reward only **after the friend's stay is completed and fully paid**: ₱ off a next stay (or stamps/points once the loyalty card exists).
4. **Tenants:** a referred tenant who signs a lease and pays the first month earns the referrer ₱ off the next rent.
5. The owner sets the amounts and a monthly limit, and can pause it.

### 4. Push notices carry codes

A notice can include a code and go to a group: everyone who agreed to promos, past guests, or members close to a reward. Only guests who ticked the (unticked) promo box get promo notices.

### 5. Results

Per code, notice and referral: used, bookings, money earned, discount given. Who referred whom is shown to the owner only.

## C. Rules

1. The server checks and works out every discount; the phone only shows it.
2. **One discount per booking.** If a code and a long-stay discount both fit, the larger wins and the guest sees which was used.
3. The discount is its own line in the price and on the receipt (`booking_lines` already has `discount` lines); the down payment and refunds use the discounted total.
4. Holding dates with a code reserves one use; an expired hold or a cancellation gives it back.
5. Counts shown to guests are worked out, never typed.

## D. When

| Phase             | What                                                                                                        |
| ----------------- | ----------------------------------------------------------------------------------------------------------- |
| 7 (screens, mock) | Discount engine, promo codes, referral, push notices with codes, results                                    |
| 10–12 (real)      | Tables: discount rules, codes, uses (redemptions), referrals, push campaigns; real push tested on an iPhone |
| 16                | The loyalty card's rewards use the same engine                                                              |
| Later             | "Regular guest" status (like Genius level 1); points shared across Smart App properties                     |

## E. Settings to confirm at the start of Phase 7 (O14, Claude's recommendation)

1. Promo push limit: **2 a week per property**.
2. Referral defaults: friend **₱200 off**, referrer **₱200 off** the next stay; owner can change both.
3. Stacking: **one discount per booking, the larger wins**.
4. Plans: Starter (₱599) gets promo codes and referral; a higher plan adds push campaigns with more sends and the results report.
5. The loyalty card **stays in Phase 16**; codes and referral bring owners value sooner.
