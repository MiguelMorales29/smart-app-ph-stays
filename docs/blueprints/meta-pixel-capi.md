# Meta Pixel, Conversions API and super admin plan

Nov 15, 2026 · @alex

One platform Pixel, run by the super admin, measures how owners find us and sign up. It never runs on owners' property pages.

## 1. At a glance

We keep the RSVP app's good parts (paired browser and server events, a delivery table) and close its gaps: no public event endpoint, every server event goes through a queue, and nothing is sent without the visitor's consent. Wave 1, slice 10, with the owner landing page.

| # | Decision | Why |
| --- | --- | --- |
| M1 | One Pixel, owned by Smart App PH, on three page types only: the owner landing page, sign-up and the setup checklist | It is for winning owners. Property pages and the rest of the dashboard never load it, so guests' and tenants' data never reaches Meta |
| M2 | Five events: `PageView`, `ViewContent`, `CompleteRegistration`, `StartTrial`, `Purchase` | All are Meta standard events, which ads can optimise for. No custom events at launch |
| M3 | Page views go from the browser only. `CompleteRegistration`, `StartTrial` and `Purchase` go from the server, with a browser copy where the owner is on the page | The server only reports what it can prove from its own records, so nobody can fake our numbers |
| M4 | Every event id is built from a database id, such as `CompleteRegistration:<account id>` | A retry or a second tab can never count twice; Meta keeps the first copy |
| M5 | Server events are written to `meta_capi_deliveries` in the same transaction as the sign-up, setup or payment, then sent by a job every minute | A slow or failing Meta call never slows or breaks an owner's action, and nothing is lost |
| M6 | The access token lives only in Railway's secret settings, never in the database or a browser | One place to change it, nothing to leak from a database copy |
| M7 | A consent choice on the owner pages gates both the Pixel and the server events | The Philippine Data Privacy Act expects opt-in consent for ad tracking |
| M8 | Pin Graph API `v27.0` and review it at every Meta release | `v24.0`, the RSVP app's default, passed its Marketing API end date on 6 October 2026 |
| M9 | `Purchase` = the owner's first plan payment the super admin approves, with the amount paid in pesos | Real money only. `CompleteRegistration` and `StartTrial` carry no value, so reports are not inflated |
| M10 | The super admin screen `/admin/pixels` sets up, tests, switches and watches everything | No redeploy to turn an event on or off; failures are visible and can be retried |
| M11 | The super admin is never a Meta visitor: no Pixel for super admin or impersonation sessions, and admin-triggered events use only the owner's saved data | The RSVP app sent admin data as client data twice: server-side in June, and from the impersonated dashboard today (section 2a) |
| M12 | Action source: `website` for `CompleteRegistration`; `other` for `StartTrial` and `Purchase` | Meta asks for an accurate source; `system_generated` is for automatic conversions, and our approvals are manual (section 3) |

## 2. What the RSVP app does today

Read on 15 November 2026 (the same Meta code as main, see 2a): `webserbisyo-rsvp`, branch `rsvp-website-production-finalization`, commit `4a38763`. Read in full: 10 of the 11 files in `src/lib/meta` (all but the one-line `index.ts`), the three `send-meta-capi-*` services, `meta-capi-delivery.ts`, `app/api/meta/events/route.ts`, `public-meta-pixel-scripts.tsx`, `save-meta-pixel.ts`, the Pixel admin actions and the 7 Meta migrations. Read in part: the first 120 of 383 lines of the admin Pixel query, and only the labels of the 702-line admin page.

**Worth keeping**

- Browser and server copies of an event share one id: the browser passes `eventID` to `fbq`, the server sends the same `event_id`.
- `Lead` and `Purchase` are sent from real records (an application saved, a payment marked paid) with fixed ids `Lead:<reference>` and `Purchase:<payment id>`.
- `meta_capi_deliveries` with a claim function: a row is claimed before sending, a stuck claim is taken over after 5 minutes, and a sent row is never sent again.
- Email, phone, names and the external id are hashed with SHA-256; `fbp`, `fbc`, IP address and user agent are sent as they are.
- Meta's reply is kept short and safe (codes, `fbtrace_id`, `events_received`), and "HTTP 200 but no events received" counts as a failure.
- The token is server-only, and the admin page shows whether server sending is ready.

**What we fix**

| # | In the RSVP app | Risk | In ours |
| --- | --- | --- | --- |
| R1 | `POST /api/meta/events` takes any event from a browser and forwards it to Meta, checked only by the `Origin` header and a schema, with no rate limit | Anyone can script fake page views and sign-ups into our Pixel and spoil ad optimisation | No public event endpoint. The server sends only events from its own records (M3) |
| R2 | Only `Purchase` goes through the delivery table; `Lead` and the funnel events call Meta inside the visitor's request, once | A Meta outage loses those events and slows the request | Every server event goes through the queue (M5) |
| R3 | Phone numbers keep only their digits, so `0917…` is hashed without the country code | Meta asks for the country code, so these phones never match | Phones are stored and sent as `63` plus the number, leading zero dropped |
| R4 | A full name is split at the first space: "Juan Carlos dela Cruz" becomes first name "juan", last name "carlos dela cruz" | Wrong names lower matching | Send first and last name only when typed in separate fields |
| R5 | `access_token_encrypted` is saved exactly as typed, and is never used; the real token comes from an environment variable | The column name promises encryption that is not there | No token column at all (M6) |
| R6 | Event switches and test mode are environment variables (`META_CAPI_*_ENABLED`, `META_CAPI_TEST_MODE`) | Turning one off needs a redeploy | Switches and test mode live in the database and the super admin screen |
| R7 | API version defaults to `v24.0` | Past its Marketing API end date | `v27.0`, pinned and reviewed (M8) |
| R8 | `InitiateCheckout`, `SelectPlan` and `Lead` carry the plan price as their value | Reported return on ad spend looks better than it is | Value only on `Purchase` (M9) |
| R9 | `PageView` is fired from a React effect while the Pixel script loads separately after the page becomes interactive | If the effect runs first, the browser event is dropped silently while its server copy is still sent | The official snippet goes in the page head, so `fbq` queues calls from the start |
| R10 | The Pixel also loads inside the client dashboard | Tracks logged-in clients beyond the funnel | Only the three page types (M1) |
| R11 | No consent notice found on the public pages | Philippine privacy rules | Consent choice first (M7) |
| R12 | Every event, page views included, writes an audit log row | Noise that hides admin changes | The delivery table is the event log; audit logs record only admin changes |

## 2a. Lessons from the RSVP fix history, and what is still wrong

Checked on 15 November 2026 against `main` at `11cb846` (26 September 2026), the newest code. The production branch `rsvp-website-production-finalization` (`4a38763`) is a squashed copy of `main` plus one landing-page commit; its Meta code is identical. A search of all 23 branches found 37 commits whose message names Meta, CAPI, Pixel, purchase or conversion; the 11 that change Meta code were opened, plus the current versions of the files they touch: the two payment-confirmation services, the dashboard layout, the browser Purchase dialog, the public event route, the acquisition tracker and the Purchase sender.

**Fixed in RSVP, and the rule we take from it**

| # | Commit | What went wrong | Rule for ours |
| --- | --- | --- | --- |
| L1 | `a0e7ed5` (18 Jun), fixed by `35373fa` (21 Aug) | Approving an application or marking a client paid sent Meta the IP address and browser of the super admin's own request, so Meta saw Purchases coming from the admin's device | Events the super admin triggers never read request headers. They carry only the owner's data saved in `meta_attribution` |
| L2 | `0fa2f43` (18 Jun) | Two ways to confirm a payment existed; only one of them sent Purchase | One function, `review_plan_payment`, is the only way a plan payment is approved, and it queues the event |
| L3 | `4795f57` (11 Aug) | A real Meta test code was written into the test files | The test code lives only in `meta_pixels`, never in code or tests |
| L4 | `846c0bc`, `429b928` (21 Aug) | Events were lost when the Pixel script or the `_fbp` cookie was not ready, so the code waited and polled | Base code in the page head; no browser-to-server relay that depends on cookie timing |
| L5 | `2495ed1` (22 Aug) | The browser Purchase fired twice on one page | Ours has no browser Purchase (F2) |
| L6 | `70a49cd` (24 Aug) | Browser and server copies carried different extra data | Keep: both copies of `CompleteRegistration` send the same `custom_data` |

**Still wrong on `main` today**

| # | Where | Flaw | Effect | Ours |
| --- | --- | --- | --- | --- |
| F1 | `dashboard/layout.tsx`, `payment-confirmed-dialog.tsx` | The Pixel loads on every client dashboard page with no check for impersonation. When the super admin impersonates a client and opens the dashboard home, the browser Purchase fires from the admin's browser, with the admin's cookies and the client's hashed details | Meta links the client's Purchase to the admin's device and ad history; the client's own browser later fires it again | The Pixel never loads when the session is a super admin or an impersonation (checked on the server before the page is sent), and never on the dashboard except `/onboarding` |
| F2 | `payment-confirmed-dialog.tsx` | The browser Purchase fires whenever the client first opens the dashboard within 14 days of payment, but Meta only merges the browser and server copies within 48 hours | A client who logs in on day 3 is counted as two Purchases | No browser Purchase; the server copy is the only one |
| F3 | `admin-workflow.schema.ts`, `purchase-event-time.ts` | `paidAt` is typed by the admin as any date and time, past or future, and becomes the Purchase `event_time` | A date more than 7 days back makes Meta reject the request, and every retry fails the same way; a future date is also wrong | `paid_at` stays the business record, but it cannot be in the future. Meta's `event_time` = `paid_at` when it is within 6 days 20 hours; if older, the earliest time Meta accepts (now minus 6 days 20 hours), and the row is marked `time_clamped`. `paid_at` also goes in `custom_data` |
| F4 | `send-meta-capi-purchase.ts` | Purchase is sent as `website`, with the `/apply/success` address and the browser data from application time, although it happens later in the admin screen | Meta gets a page visit that never happened at that time | `other`, with the owner's saved `fbc`, `fbp`, email and phone |
| F5 | `api/meta/events/route.ts`, `send-meta-capi-acquisition-event.ts` | The public route accepts a reference code from any browser, looks up that applicant's email and phone, and sends them to Meta with the sender's IP and cookies. It is guarded only by the `Origin` header and a 4 KB size limit | Anyone who knows a reference code can tie a real person's identity to their own device in Meta's data | No public event route. Identity comes only from the signed-in owner or server records, never from a value the browser sends |
| F6 | `payment-confirmed-dialog.tsx` | Customer details are passed in the `track` call's options instead of `fbq('init')`, where Meta's advanced-matching docs place them; the phone is hashed without `63`; the full name is split at the first space | Matching data that may be ignored or wrong | No customer data in the browser at all |
| F7 | the route and every server action | The visitor's IP is the first value of `x-forwarded-for` | On hosts that add to that header rather than replace it, a visitor can set it | NestJS `trust proxy` set for Railway, so the API reads the address Railway saw |
| F8 | Purchase and Lead senders | Lead and the funnel events still call Meta inside the visitor's request; only Purchase uses the delivery table | Lost events when Meta is slow | Every server event through the queue |

**Super admin safety rules (added to sections 6 and 7)**

1. A request made by a super admin, or while impersonating, never renders the Pixel and never adds browser data to `meta_attribution`.
2. `queue_meta_event` records `triggered_by` (`owner`, `super_admin` or `job`). For `super_admin` it copies browser data only from `meta_attribution`.
3. An owner action done by the super admin while impersonating queues nothing.
4. **Send test event** uses the test code and a made-up test identity, never a real owner's data.

## 3. Meta's rules that shape the plan

Each row comes from a Meta developer page opened on 15 November 2026 (links in section 12).

| Topic | What Meta's docs say | What we do |
| --- | --- | --- |
| Endpoint | `POST https://graph.facebook.com/{version}/{pixel id}/events`, token as the `access_token` query parameter, up to 1,000 events in `data` per request ([Using the API](https://developers.facebook.com/docs/marketing-api/conversions-api/using-the-api)) | Our job sends up to 50 per request; the token is stripped from every log and from Sentry |
| Deduplication | A browser `eventID` must match the server `event_id`, and the event names must match. Meta keeps the first copy, but only if the second arrives within 48 hours of the first ([Deduplicate](https://developers.facebook.com/docs/marketing-api/conversions-api/deduplicate-pixel-and-server-events)) | Same id and name on both sides (M4); browser copies fire seconds after the server write |
| Event time | Unix seconds; up to 7 days in the past. One event older than 7 days rejects the whole request ([Server event](https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/server-event)) | We keep the original time on retries and stop retrying at 6 days and 20 hours, marking the row `expired` |
| Website events | `event_source_url` and `client_user_agent` are required when `action_source` is `website` ([Server event](https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/server-event), [Customer information](https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/customer-information-parameters)) | `CompleteRegistration` is a `website` event and carries both. `StartTrial` and `Purchase` happen when the super admin approves, so they are `other` |
| Hashing | Email, phone, names, city, country and similar are SHA-256 hashed after normalising; phone must include the country code; IP, user agent, `fbp` and `fbc` must not be hashed ([Customer information](https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/customer-information-parameters)) | Email lowercased and trimmed; phone as `639171234567`; country `ph`; external id = hashed account id |
| Weak data | Since v13.0, events whose only customer data is a broad mix (such as city, state, country and gender) are rejected ([Best practices](https://developers.facebook.com/docs/marketing-api/conversions-api/best-practices)) | Every server event has a hashed email and external id at least |
| Click and browser ids | `fbc` = `fb.1.<time in ms>.<fbclid>`, never change the case of `fbclid`; `fbp` = the `_fbp` cookie; refresh them as they change ([fbp and fbc](https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/fbp-and-fbc)) | The sign-up and payment forms send the current cookies; the API builds `fbc` from a kept `fbclid` when no cookie exists |
| Match quality | Event Match Quality is scored out of 10; only matched events are used for attribution and optimisation ([Best practices](https://developers.facebook.com/docs/marketing-api/conversions-api/best-practices)) | Send email, phone, IP, user agent, `fbp` and `fbc` whenever the owner gave consent |
| Test events | `test_event_code` shows events in the Test Events window. Events sent with it are not dropped: they still count for targeting and measurement ([Using the API](https://developers.facebook.com/docs/marketing-api/conversions-api/using-the-api)) | Test with our own accounts only, and turn test mode off before ads run |
| Token | Made in Events Manager (Settings, Conversions API, Generate access token) or by a system user; no App Review needed ([Get started](https://developers.facebook.com/docs/marketing-api/conversions-api/get-started)) | Lex generates it once; it goes into Railway secrets |
| Consent | `fbq('consent', 'revoke')` before `init` holds Pixel fires until `fbq('consent', 'grant')`, and revoke must run on every page ([Consent](https://developers.facebook.com/docs/meta-pixel/implementation/gdpr)) | Our consent choice drives these two calls (M7) |
| Advanced matching | Values passed to `fbq('init', id, {...})` are hashed by the Pixel itself ([Advanced matching](https://developers.facebook.com/docs/meta-pixel/advanced/advanced-matching)) | Not used at launch: customer data goes server-side only, so it never sits in page code |
| Versions | v26.0 came out on 29 July 2026; Marketing API v24.0 ended on 6 October 2026 ([Versions](https://developers.facebook.com/docs/graph-api/changelog/versions)); v27.0 came out on 4 November 2026 ([news report](https://www.relevantaudience.com/meta/meta-marketing-api-v27-product-showcase-device-expansion-defaults/)) | Pin `v27.0` (M8) |
| Standard events | `Purchase` requires `value` and `currency`; `CompleteRegistration`, `StartTrial` and `ViewContent` take them optionally ([Standard events](https://developers.facebook.com/docs/meta-pixel/reference)) | Value and `PHP` only on `Purchase` |
| Action source | `system_generated` means a conversion that happened automatically, such as an auto-pay renewal; `other` means one that happened in a way not listed. The sender agrees the value is accurate. Offline events should not be `website` ([Server event](https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/server-event), [Best practices](https://developers.facebook.com/documentation/ads-commerce/conversions-api/best-practices)) | Our plan payments are bank or e-wallet transfers checked by a person, so `StartTrial` and `Purchase` are `other`. Changed from `system_generated` on 15 November 2026 |
| Ad credit for server-only events | Every action source allows ad measurement and custom audiences; only matched events are used for attribution; Meta recommends sending `fbc` with every server event and keeping the `_fbc` cookie 90 days ([Server event](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/server-event), [fbp and fbc](https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/fbp-and-fbc)) | Every server event sends the owner's saved `fbc`, `fbp`, hashed email, phone and external id. Our 90-day keep in `meta_attribution` matches the cookie's life. A server-built `fbc` uses subdomain index 1 and the time `fbclid` was first seen, in milliseconds |
| Source address | `event_source_url` is required for website events and should match the verified domain ([Server event](https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/server-event)) | Verify `webserbisyo.com` in Meta Business Settings (setup step 2); `CompleteRegistration` sends the real `/signup` address the owner used |

## 4. Events we send

Five standard events follow an owner from first visit to first payment. Nothing is sent before consent.

| Event | When | Where | Browser | Server | Event id | Data |
| --- | --- | --- | --- | --- | --- | --- |
| `PageView` | Any of the three page types loads | `smartapp.webserbisyo.com/<slug>`, `host.webserbisyo.com/signup`, `/onboarding` | Yes | No | none | none |
| `ViewContent` | The landing page's plans section scrolls into view, once per visit | Landing page | Yes | No | random | `content_name: "plans"` |
| `CompleteRegistration` | The owner's account is created after the email code | `/signup` | Yes, after the API answers | Yes, `website` | `CompleteRegistration:<account id>` | `status: true`, `content_name` = property type picked (`stays`, `rentals`, `both`) |
| `StartTrial` | The super admin approves the account and the trial starts (`approve_account`) | Admin screen | No | Yes, `other` | `StartTrial:<account id>` | none |
| `Purchase` | The super admin approves the owner's first plan payment (`review_plan_payment`) | Admin screen | No | Yes, `other` | `Purchase:<subscription payment id>` | `value` = amount paid in pesos, `currency: "PHP"`, `content_name` = plan and months |

**Customer data on server events**: hashed email (`em`), hashed phone (`ph`, as `63…`), hashed external id (the account id), hashed country `ph`, hashed city (`ct`, from the owner's first property, lowercase with no spaces), and, when collected at sign-up, `client_ip_address`, `client_user_agent`, `fbp` and `fbc`. First and last name only if the sign-up form has separate fields.

**Why `StartTrial` and `Purchase` have no browser copy**: the super admin approves them, sometimes hours later, so there is no owner page to fire them from. The server events carry the `fbp` and `fbc` saved at sign-up so Meta can still link them to the ad click. Until paid plans pile up, ads should optimise for `CompleteRegistration`.

**Renewals**: only the first approved payment is a `Purchase`. Renewals happen without an ad, so sending them would credit ads for money they did not bring. A refund sends nothing at launch.

**Purchase time**: the super admin may enter an earlier `paid_at`, and it is kept as the record. Meta's `event_time` is `paid_at` when that is within the last 6 days 20 hours; if it is older, the earliest time Meta accepts is sent instead and the delivery row is marked `time_clamped`, so the Purchase is still counted, close to when it happened. `paid_at` also rides in `custom_data`. A `paid_at` in the future is refused by `review_plan_payment` (RSVP flaw F3).

## 5. How an event travels

&#91;embedded content: how an event travels · browser, API, queue, job, Meta\]

The browser talks to Meta directly only for its own copies, and only after consent. Everything the server knows goes through the queue, so an owner's sign-up or a payment approval never waits on Meta.

## 6. Super admin flow

One screen, `/admin/pixels`, takes the Pixel from nothing to live in about 15 minutes, then watches it. Only the super admin opens it; every change writes an audit line with who, when, and the old and new value (never the token).

**Setup, once**

1. In Meta Business Settings, create the Pixel under Smart App PH's business account.
2. In Meta Business Settings, add and verify `webserbisyo.com`, so the addresses our events report match a domain Meta knows is ours.
3. In Events Manager, Settings, Conversions API, choose Generate access token.
4. Put the token in Railway as `META_CAPI_TOKEN` and redeploy the API. The screen then shows "Token set" and the last 4 characters.
5. On `/admin/pixels`, enter the Pixel ID (digits only, checked) and save. Status: **Off**.
6. In Events Manager, open Test events and copy the test code. Paste it on the screen and switch status to **Test**.
7. Press **Send test event**. The API sends one `PageView` with the test code at once (not through the queue) and shows Meta's answer: events received, `fbtrace_id` or the error.
8. Open the landing page in a private window, accept ads cookies, sign up with a test email, and watch `PageView` and `CompleteRegistration` arrive in Test events, each marked as received from both browser and server. Approve the test account and check that `StartTrial` arrives.
9. Switch status to **Live**. The test code is cleared, and a banner on every admin page stops saying "Pixel in test mode".

**The screen**

| Part | Shows | Can do |
| --- | --- | --- |
| Connection | Pixel ID, status (Off, Test, Live), token set or missing with last 4 characters, API version and its end date when Meta publishes one | Save Pixel ID, change status, paste test code, send a test event |
| Events | The five events, each with browser and server switches, sent and failed in the last 24 hours, last sent time | Turn each channel on or off; `PageView` and `ViewContent` have no server switch |
| Deliveries | The last 200 server events: event, id, owner, status, attempts, HTTP code, events received, `fbtrace_id`, Meta's message | Filter by status; retry a failed or expired row (the same id, so Meta keeps one copy) |
| Health | Red, amber or green, with the reason | Open the failing rows |

**Health rules**, checked every hour

- Red: token missing while status is Live; or more than 20 % of the last hour's sends failed; or a row has waited more than 1 hour.
- Amber: status is Test for more than 3 days; or no event sent in 7 days while owners signed up; or the pinned API version ends within 60 days.
- Red sends one email to the super admin, at most once every 6 hours.
- The super admin's own browser never runs the Pixel: a super admin session or an impersonation removes the base code on the server before the page is sent, and owner actions done while impersonating queue nothing (section 2a, F1).

**Pixel status**

&#91;embedded content: Pixel status · Off, Test, Live\]

Events sent in Test still count in Meta (section 3), so Test uses our own accounts only, and Live is a deliberate step.

## 7. Database

These are the four Tracking tables, merged into the Database blueprint on 15 November 2026, including the new `meta_attribution`. All four are wave 1; only the super admin can read them, and only the API writes them.

**`meta_pixels`** One row at launch.

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

No token column: the token is `META_CAPI_TOKEN` in Railway (M6).

**`meta_event_switches`** One row per event.

| Column | Type | Rule |
| --- | --- | --- |
| `pixel_ref`, `event_name` | uuid, text | Primary key. `PageView`, `ViewContent`, `CompleteRegistration`, `StartTrial`, `Purchase` |
| `browser_enabled` | boolean | Default false. Always false for `StartTrial` and `Purchase` |
| `server_enabled` | boolean | Default false. Always false for `PageView` and `ViewContent` |

**`meta_attribution`** What links an owner to an ad click. One row per account; kept 90 days.

| Column | Type | Rule |
| --- | --- | --- |
| `account_id` | uuid | Primary key |
| `ads_consent` | boolean | The choice on the consent bar at sign-up |
| `consent_at` | timestamptz |  |
| `fbp`, `fbc` | text | As read from the cookies, or `fbc` built from `fbclid`; up to 256 each |
| `client_ip`, `user_agent` | inet, text | From the sign-up request, user agent up to 512 |
| `captured_at`, `refreshed_at` | timestamptz | `refreshed_at` moves when the payment form sends newer cookies |

The `clear_meta_attribution` job empties `fbp`, `fbc`, `client_ip` and `user_agent` 90 days after `captured_at`. Without consent, only `ads_consent = false` and `consent_at` are kept.

**`meta_capi_deliveries`** The queue and the log of server events.

| Column | Type | Rule |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `pixel_ref` | uuid | To `meta_pixels` |
| `event_name`, `event_id` | text | Unique `(pixel_ref, event_name, event_id)` |
| `account_id` | uuid | The owner it is about |
| `entity_type`, `entity_id` | text, uuid | `accounts` or `subscription_payments` |
| `event_time` | timestamptz | When it happened; never changes on retry |
| `payload` | jsonb | The exact event as sent, customer data already hashed; IP, user agent, `fbp` and `fbc` removed after 90 days |
| `is_test` | boolean | Sent with the test code |
| `triggered_by` | text | `owner`, `super_admin` or `job`. For `super_admin`, browser data comes only from `meta_attribution` (RSVP lesson L1) |
| `time_clamped` | boolean | True when a `paid_at` older than 6 days 20 hours was sent as the earliest time Meta accepts |
| `status` | text | `pending`, `sending`, `sent`, `failed`, `expired` |
| `attempts`, `next_attempt_at` | smallint, timestamptz |  |
| `claim_token`, `claimed_at` | uuid, timestamptz | A claim older than 5 minutes may be taken over |
| `http_status`, `events_received`, `fbtrace_id`, `last_error` |  | `last_error` up to 240 characters |
| `created_at`, `sent_at` | timestamptz |  |

**Functions and jobs**

| Name | Kind | Does |
| --- | --- | --- |
| `queue_meta_event` | function, called inside the sign-up transaction, `approve_account` and `review_plan_payment` | Adds a `pending` row only if the Pixel is `test` or `live`, the event's server switch is on, and the owner gave consent |
| `claim_meta_deliveries` | function | Claims up to 50 due rows with `for update skip locked` and returns them |
| `meta_capi_send` | job, every minute | Sends claimed rows, then marks `sent`, `failed` (next try after 1, 5, 30, 120 and 360 minutes) or `expired` |
| `meta_health_check` | job, hourly | Works out the health rules in section 6 |
| `clear_meta_attribution` | job, daily | The 90-day clean-up above |

## 8. Privacy and consent

The Philippines has no cookie-specific rule yet, but law-firm guides read the Data Privacy Act as needing prior opt-in consent for behavioural ad targeting ([Baker McKenzie](https://resourcehub.bakermckenzie.com/en/resources/global-data-and-cyber-handbook/asia-pacific/philippines/topics/cookies-online-tracking-and-direct-marketing), [Legal 500](https://www.legal500.com/developments/thought-leadership/philippines-cookies-similar-technologies/)). So we ask first, on our own pages only.

1. **A consent bar** on the landing page, `/signup` and `/onboarding`: "We use Meta's Pixel to see which ads bring owners to us. Allow?" with two equal buttons, **Allow** and **Only needed cookies**, and a link to the privacy notice. Nothing is pre-ticked.
2. **Before a choice**, the Pixel's base code runs with `fbq('consent', 'revoke')` before `init`, on every page, so nothing reaches Meta. **Allow** calls `fbq('consent', 'grant')`. The choice is kept on the device for 180 days and can be changed from a footer link.
3. **The same choice gates the server.** The sign-up request sends it; it is saved in `meta_attribution`. With no consent, `queue_meta_event` adds nothing for that owner, ever. Changing to Allow later starts from the next event.
4. **What we never send**: anything from property pages, guests, tenants, bookings, payments proofs, messages or chats; the owner's name split from one field; plain-text email or phone.
5. **The privacy notice** names Meta Pixel and the Conversions API, what is sent (hashed email and phone, account id, IP, browser, cookie ids), why (ads that reach owners), how long (90 days for click data) and how to say no.
6. **Deletion**: when an owner's account is deleted, their `meta_attribution` row goes with it, and their delivery rows lose the payload.

**Ads note**: our ads sell software to owners, so they are not housing ads, but Meta now applies housing rules automatically when it detects housing content in an ad ([news report](https://denote.net/blog/meta-ads-policy-update-2026)). Show the dashboard and the owner's phone in creatives, not rooms for rent.

## 9. Failures, retries and monitoring

No owner ever waits on Meta: the owner's action commits with a `pending` row, and the job does the rest.

| What goes wrong | What happens |
| --- | --- |
| Meta answers 5xx, times out (10 s), or the network fails | Row back to `failed`; next try after 1, 5, 30, 120, then 360 minutes, the same `event_id` each time |
| Meta answers 4xx (bad token, bad data) | Row `failed` with Meta's message; no automatic retry, because it will fail again. Health turns red |
| HTTP 200 but `events_received` is 0 | Treated as failed, like the RSVP app |
| A row is older than 6 days 20 hours | `expired`, never sent; Meta would reject the whole batch |
| The job crashes mid-send | The claim is taken over after 5 minutes; Meta drops a second copy of the same id |
| Token missing or Pixel `off` | Nothing is queued while `off`; rows queued before stay `pending` until the token is back |
| Super admin changes a switch | Only new events follow it; queued rows still send |

Logs never contain the token, the URL with the token, or customer data before hashing. Sentry's breadcrumb filter removes `access_token` from any URL.

## 10. Build order and test checklist

Built in wave 1, slice 10, with the owner landing page, after sign-up, account approval and plan payments exist.

1. Migration: the four tables, their checks, row-level security (super admin read only), and `queue_meta_event` with pgTAP tests.
2. API: the hashing helper (email, phone `63…`, external id) with unit tests against Meta's examples; the sender job; `/admin/pixels` endpoints; the test-event button.
3. Hook `queue_meta_event` into the sign-up transaction, `approve_account` and `review_plan_payment`.
4. Pages: the consent bar and the Pixel base code in the head of the three page types; the browser `CompleteRegistration` with the server's id.
5. Admin screen, health job, clean-up job.

**Done when**

- [ ] A test sign-up shows `PageView` and `CompleteRegistration` in Meta's Test events, the latter once, from browser and server
- [ ] Approving the test account and a test payment shows `StartTrial` and `Purchase` with the right value in pesos
- [ ] With **Only needed cookies**, nothing reaches Meta from the browser or the server
- [ ] Stopping the sender for 10 minutes, then restarting it, sends every queued event once
- [ ] A wrong token turns health red and emails the super admin
- [ ] The token never appears in logs, Sentry, the database or the browser
- [ ] Event Match Quality is visible for `CompleteRegistration` in Events Manager after real sign-ups
- [ ] Test mode is off before the first ad runs
- [ ] Signed in as super admin, and while impersonating an owner, the Pixel helper shows no Pixel on any page, and no browser event leaves
- [ ] Approving a payment with a `paid_at` 10 days back still sends `Purchase`, with the earliest accepted time as `event_time` and `time_clamped` set; a future `paid_at` is refused; Test events shows the source as `other`
- [ ] The server event for an approval carries the owner's saved IP and browser, never the super admin's
- [ ] Nothing a browser sends can make the server look up and send someone else's email or phone

## 11. Decisions and open questions

Decided on 15 November 2026 as co-founder, on Lex's instruction: M1 to M10 above, and these changes to the Database blueprint:

| Change | Detail |
| --- | --- |
| New table `meta_attribution` | Wave 1, Tracking group; 62 tables in all |
| `meta_pixels` | Drop `token_encrypted` and `is_active`; add `status`, `api_version` |
| `meta_event_switches` | Drop `test_mode` (now on the Pixel); events become `PageView`, `ViewContent`, `CompleteRegistration`, `StartTrial`, `Purchase` |
| `meta_capi_deliveries` | Add `account_id`, `entity_type`, `entity_id`, `event_time`, `payload`, `is_test`, `next_attempt_at`, claim columns, `events_received`, `fbtrace_id`; status `expired` |
| Functions and jobs | `queue_meta_event`, `claim_meta_deliveries`; jobs `meta_capi_send`, `meta_health_check`, `clear_meta_attribution` |

**Still open**

- [ ] Lex creates Smart App PH's Meta Business account and the Pixel, and generates the token and verifies the domain (section 6, steps 1 to 4).
- [ ] Does the sign-up form ask first and last name in separate fields? If yes, we send `fn` and `ln` too.
- [ ] A lawyer reads the privacy notice and consent text before launch.
- [ ] Later: owner Pixels on property pages (the `scope` column is ready), and a `Contact` event for the landing page's chat button.

## 12. Sources

Meta developer pages, opened 15 November 2026:

- [Conversions API: using the API](https://developers.facebook.com/docs/marketing-api/conversions-api/using-the-api)
- [Server event parameters](https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/server-event)
- [Customer information parameters](https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/customer-information-parameters)
- [Deduplicate Pixel and server events](https://developers.facebook.com/docs/marketing-api/conversions-api/deduplicate-pixel-and-server-events)
- [fbp and fbc](https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/fbp-and-fbc)
- [Conversions API best practices](https://developers.facebook.com/docs/marketing-api/conversions-api/best-practices)
- [Conversions API get started](https://developers.facebook.com/docs/marketing-api/conversions-api/get-started)
- [Meta Pixel standard events](https://developers.facebook.com/docs/meta-pixel/reference)
- [Meta Pixel consent](https://developers.facebook.com/docs/meta-pixel/implementation/gdpr)
- [Meta Pixel advanced matching](https://developers.facebook.com/docs/meta-pixel/advanced/advanced-matching)
- [Graph API versions](https://developers.facebook.com/docs/graph-api/changelog/versions)

Other pages:

- [Server event parameters, newer documentation page](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/server-event) and [Best practices, newer page](https://developers.facebook.com/documentation/ads-commerce/conversions-api/best-practices) (opened 15 November 2026, evening)

* [Relevant Audience: Marketing API v27 release](https://www.relevantaudience.com/meta/meta-marketing-api-v27-product-showcase-device-expansion-defaults/) (Meta's version page we opened did not list v27 yet)
* [Baker McKenzie: Philippines cookies and online tracking](https://resourcehub.bakermckenzie.com/en/resources/global-data-and-cyber-handbook/asia-pacific/philippines/topics/cookies-online-tracking-and-direct-marketing)
* [Legal 500: Philippines cookies](https://www.legal500.com/developments/thought-leadership/philippines-cookies-similar-technologies/)
* [Denote: Meta ads policy update 2026](https://denote.net/blog/meta-ads-policy-update-2026)

Repository: `github.com/webserbisyo/webserbisyo-rsvp`, branch `rsvp-website-production-finalization`, commit `4a38763` (files in section 2).
