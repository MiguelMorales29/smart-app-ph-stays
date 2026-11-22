# Property page structure, round 2 (P5-2b)

22 November 2026, from Lex's review of the P5-2 screenshots (Ulap Suites, Tita Lorna's Dorm, Ilaw Residences at 390 px and 1280 px) and a second research pass. Decisions D79 to D82; built by `docs/prompts/P5-2b-property-structure.md` after P5-2 is merged.

## What works (keep)

- The two-button bottom bar on phones ("Check dates", "Message"): simple and easy to learn.
- Install in the top bar, the announcement strip, the "1 / 17" gallery counter, the Verified owner badge with the area, the owner's font pair.

## What to change

### 1. Navigation: section tabs, not separate pages (D79)

The food app's shop has several pages (Home, Menu, Rewards), so its top bar shows them as a pill group in the middle with the account button on the right. A property page is one long page plus unit pages, so the equivalent is **section tabs** that jump within the page.

- **Phone top bar:** logo and name (tap = back to top) on the left; on the right at most three controls: Install (hidden once installed), **Your booking** (person icon → "Find my booking" now, the member page in Phase 8), and the menu. Share moves into the menu and next to the name block, so the bar isn't crowded.
- **Section tabs:** after the hero scrolls away, a slim sticky row appears under the top bar: Units · About · Rules · Location · FAQ (only the parts that are shown). The current section is highlighted as you scroll (ReUI Scrollspy). The row scrolls sideways on narrow phones with edge fades.
- **Desktop (from 1024 px):** the same section links sit in the middle of the top bar (like the food app's centre pill group); on the right: Install, Your booking, and a filled **Check dates** button.
- **The menu (sheet):** Share, Install, Find my booking, Privacy, Report this page, and the Preview switch on demo builds. The floating Preview pill is hidden when the menu exists (same rule as D68 in the dashboard; it covered unit photos in the P5-2 screenshots).

### 2. Desktop: full-width layout with top-bar actions (D80)

From 1024 px the property page stays full width (no sticky right-hand booking card):

- **Full-width content:** gallery, name block (keeping `"from ₱X a night"` / `"a month"` under the name on all screen sizes), promo banners, units (3 columns), highlights, about and host, rules, location, times, FAQ, trust panel.
- **Top bar actions:** from 1024 px the top bar holds the centre section-link pill group and, on the right, Install, Your booking, **Message** (opens the contact sheet), filled **Check dates** (single unit: its page; several: the unit chooser sheet), and Menu.

### 3. Units section & quick look (D81)

- **Bed spaces grouped by room.** Tita Lorna's Dorm showed one card per bed, with the same photo repeated. Show one card per room: `"Room 2A · Ladies · 4 beds"`, `"from ₱4,800 a month"`, linking to the room's first bed.
- **Stays and Monthly rentals** as two tabs when a property has both (a segmented control), not one long mixed list.
- **Cards:** photo area uses the installed `Carousel` (swipe on phones, small hover arrows on desktop, dots, `+N` photo count; only the first photo loads with the page and the rest load on swipe), name, `"Whole place · 2 guests · 1 bed"`, price, one highlight chip. Optional owner-controlled autoplay (`look.unitCardAutoplay` default `false`, `look.unitCardSeconds` `5 | 7 | 10` default `7`): only cards in view play, staggered one card at a time, paused on hover/touch/focus and under reduced motion, with one Pause control for the Units section and next-photo-only preloading. Grid: phone 1 column (first 4 cards, then `"Show all N units"` revealing the rest in place), tablet 2 columns, desktop 3 columns.
- **Quick look:** tapping a unit card opens a lazy-loaded sheet on phones / dialog on desktop with a photo carousel showing each photo's description, facts (guests, beds, bathrooms, floor area), top 6 amenities, clamped description with `"Read more"`, price, and `"Check dates"` + `"See full details"` buttons (both going to the unit page).
- **Promo banners:** `look.bannerAutoplay` (default `true`) lets owners turn banner autoplay off while keeping manual arrows and dots; desktop subtitles clamp cleanly with an ellipsis.
- **"Show all photos"** on phones too (a button under the gallery), opening the full viewer grouped by unit.

### 4. Installing on iPhone: a guide that looks like Safari (D82)

iPhones never show an install prompt, and iOS 26 moved Share behind the ⋯ button, so installing takes several taps. The Install button on iPhone opens a step-by-step sheet whose pictures look like the guest's own Safari:

1. "Tap ⋯" with a drawing of Safari's bottom bar and the ⋯ button circled. A pulsing arrow also points at the real ⋯ position on screen (bottom right in the compact and bottom layouts; a toggle "My address bar is at the top" switches the drawings and the arrow).
2. "Tap Share" with a drawing of the menu.
3. "Scroll down and tap Add to Home Screen" with a drawing of the share list (and "Can't see it? Scroll the list, or tap Edit Actions").
4. "Keep Open as Web App on, then tap Add" with a drawing of that screen, showing the property's own icon and home-screen name.

- **Older iPhones (before iOS 26):** "Tap Share at the bottom → Add to Home Screen → Add".
- **Chrome on iPhone:** Share (top right) → Add to Home Screen.
- **Facebook, Messenger, Instagram, TikTok:** "Open in Safari first" with Copy link (D76).
- **Android Chrome:** the real install prompt (one tap).
- The drawings are our own components (light and dark), not screenshots, so they stay sharp and can be updated when Safari changes.
- **When to suggest it:** the top-bar Install is always there; the friendly nudge sheet appears only on a second visit or after a booking is confirmed (the receipt), never on the first screen. Dismissed means not shown again for 30 days.

## Components to use (installed or from the catalog)

Scrollspy (ReUI) for the section tabs; Scroller (Dice UI) for the sideways row; Segmented control for Stays / Monthly; Carousel and Dialog for the viewer; Sheet for the menu, the contact sheet and the iPhone guide; Stepper (vertical) for the guide steps; Avatar for the host; Badge for Verified and room availability; Empty for "No units listed yet".

## References used

- 21st.dev community (12,000+ components; Navigation 534, Galleries 326, Cards 1,400+, CTAs 359): used for ideas only, because the site does not state a licence per component; anything copied must come from an author page that says MIT, Apache-2.0, ISC or CC0.
- iOS 26 Safari: ⋯ → Share → scroll to Add to Home Screen; "Open as Web App" on by default (MacRumors, Apple Community, Glide community note that the old "tap Share" instructions are now wrong).
- Airbnb's listing page (two columns with a sticky booking card on desktop, a bottom bar on phones) and the food app's shop top bar (centre pill group, account on the right).
