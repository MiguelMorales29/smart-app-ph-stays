# Phase 5 research: guest pages, installing and the page editor

22 November 2026. A best-practice pass over the P5-2 to P5-7 prompts, done after P5-0, P5-0b and P5-1. Decisions D74 to D77 come from it. Sources are listed at the end.

## What we checked

The property page, the unit page, installing the property app, share previews and the page editor, against:

- usability research on hotel, travel-agency and rental sites (Baymard Institute);
- what Airbnb shows guests today and the US rule on total prices for short stays;
- Philippine booking scams (PNP Anti-Cybercrime Group, regional police, news);
- how installing works on iPhone (iOS 26) and in Facebook and Messenger;
- how theme editors (Shopify, Zoho) handle preview, selection and publishing.

## Findings and what changes

### 1. Show the total price, not only the nightly rate (D74)

- Airbnb has shown the total price with all fees (before taxes) to every guest since April 2025. In the US, the FTC rule in force since 12 May 2025 makes this the law for short-term lodging: the total, with every required fee, must be shown more prominently than other price figures. Long-term rentals are outside that rule.
- Baymard's 2026 benchmark names nightly rates without the total as the most common pricing problem on accommodation sites.
- **For us:** once dates are picked, the stay total (nights plus the cleaning fee and every other required fee) is the biggest price on the unit page and in the Reserve bar; the nightly rate is secondary. Before dates are picked, cards say "from ₱2,600 a night" and, when the unit has a required fee, "+ ₱500 cleaning fee". A required fee never appears for the first time on the booking form. Optional extras are listed by name and amount.

### 2. Checkout day can be a taken night (D75)

- A night that is taken can still be a check-out day for the stay before it. Calendars that block the whole date stop a guest from checking out on the morning another guest checks in.
- **For us:** in the unit calendar, a taken night is not selectable as a check-in night, but it is selectable as the check-out date when the nights before it are free. Minimum nights are enforced in the calendar itself (check-out dates that are too early are disabled, with the reason), and changing one date never clears the other without saying so.

### 3. Facebook and Messenger in-app browsers (D76)

- Most Filipino guests will open the property link from Facebook or Messenger. Those apps open links in their own in-app browser, which cannot install web apps, and Google blocks sign-in inside them.
- iOS 26 opens every site added to the Home Screen as a web app ("Open as Web App" is on by default), but getting there takes several taps from Safari's menu. An app added to the Home Screen keeps its own storage, separate from Safari.
- **For us:** detect the in-app browser (Facebook, Messenger, Instagram, TikTok). There the Install button explains how to open the page in Safari or Chrome (with a Copy link button) instead of showing install steps that cannot work. The `/install` page has iOS 26 steps (Share → Add to Home Screen → keep "Open as Web App" on) and steps for older iPhones and Android. Anything a guest must keep (their booking link) is shown again after installing, because the installed app does not share Safari's storage.

### 4. Scams: the page must prove it is the official one (D77)

- Police and tourism offices keep warning about fake Facebook pages that copy a resort's photos and ask for payment to a personal GCash account, sometimes claiming the real payment system is "under maintenance".
- **For us:** the trust panel (PA-10) stays and grows:
  - it shows the property's official web address (`smartapp.webserbisyo.com/<slug>`) and says this page is the official one for the property;
  - "Pay only to the accounts shown in your booking conversation. We never ask you to pay a personal GCash or bank account in chat or by text.";
  - tapping "Verified owner" opens a short sheet saying what we checked;
  - the warning when a payment account changed in the last 7 days stays;
  - "Report this page" (PA-11) stays.

### 5. Reviews and the essentials guests look for

- Baymard: 85 % of travel sites don't link to third-party reviews, and guests look for them. **For us:** "See reviews on Google" also sits in the name block, near the top, not only at the bottom. Public reviews on our page stay a later feature.
- Guests decide on the photo gallery first, then room details. **For us:** "Show all photos" groups photos by unit name. The unit page shows bed counts, bathrooms and floor area up front, and amenities as a scannable list with icons.

### 6. "Message" in wave 1

- Asking a question before booking (BK-10) and rental inquiries (RN-01) are wave 2, so `/<slug>/inquire` must not be the main contact in wave 1. **For us:** "Message" opens a contact sheet with the owner's channels (Messenger, call, text, Facebook) from Settings → Property. "Ask a question" on the unit page does the same.

### 7. The page editor

- Theme editors let a tap on the preview select a part, and keep the preview faithful to the live page. Shopify's guidance: fixed and sticky elements must not cover the selection in the preview; on a phone one tap selects and a second tap navigates.
- **For us (P5-5):** in the preview, sticky bars (the phone action bar, the top bar) stay in place but never cover the selected part's outline (the preview scrolls the part into view below them). One tap selects a part; a second tap on a link or button follows it. A "Preview as a guest" switch hides the outlines.

## What stays as planned

The page order in P5-2, area-only location, the 7 states, Cache Components and `next/image`, the ported banner carousel, the editor's draft, autosave, Undo and publish list, and the phone sheet. These match the research.

## Sources

- FTC, "Rule on Unfair or Deceptive Fees" (16 CFR 464), FAQ and Federal Register notice, January 2025; in force 12 May 2025.
- Airbnb Newsroom, "Total price display is now standard for guests worldwide", 21 April 2025.
- Baymard Institute, Travel Accommodations UX research, benchmark 2026 and "Travel site UX best practices".
- PNP Anti-Cybercrime Group and RACU-7 warnings on staycation and resort booking scams (GMA News, Philstar, SunStar, Inquirer, 2025–2026).
- WebKit, "News from WWDC25" (Open as Web App on iOS 26); MacRumors iOS 26 Safari guide.
- Notes on in-app browsers and PWA installing (Frontend Masters; WebView community thread, W3C).
- Shopify, "Theme editor best practices" and "Preview inspector best practices".
