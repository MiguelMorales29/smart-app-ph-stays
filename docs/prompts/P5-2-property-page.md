# P5-2 · Property page

Model: Gemini 4 Argon, Medium. Planning mode. After P5-1 is merged.

Read first: AGENTS.md, docs/prompts/P5-guide.md, Feature blueprint §7 (`/` brief), §7a "The sections" (parts 4 to 15) and decisions E4, E5, E7, E9. Files: `apps/storefront/src/app/[slug]/`, `components/frames/PropertyFrame.tsx`, `packages/ui/src/compositions/property-theme.tsx`, `packages/core/src/theme/palette.ts`.

Port from the food app (`../Smart-App-PH---FINAL-2026`, read-only):

- `packages/ui/src/compositions/banner-carousel.tsx` and `banner-carousel-slides.tsx` (the timer dots, Pause, reduced motion, loads only for 2+ slides)
- `apps/storefront/src/features/home/components/announcement-strip.tsx`, `home-hero.tsx`, `home-info-card.tsx`, `home-sections.tsx`, `shop-footer.tsx` (structure and the show/hide part switch)

## Goal

A guest opens `/<slug>` on a phone and understands the place, sees its units with prices, and knows how to book or ask, in under 10 seconds. It is built only from `getProperty` (published page), in the owner's colours and fonts.

## Branch

`ag/p5-2-property-page` from main. One PR.

## The page, top to bottom (each part honours its show/hide switch in `look.sections`)

1. **Top bar:** logo (circle or rounded, initials if none), property name, Share button (Web Share; copy link as the fallback), Install button when installable (P5-4 wires the prompt; show it now with the `/install` link).
2. **Announcement** (part 6): one strip with its tone icon; hidden after its end date (Manila midnight); dismiss for this visit only.
3. **Hero photos** (part 4):
   - Phone: a full-width swipe gallery with a "1 / 12" counter; it never moves by itself (E4).
   - From 768 px: 1 large + 4 small photos with "Show all photos".
   - Both open a full-screen viewer (swipe, arrows, Escape, the photo description read out).
   - Use the shadcn **Carousel** (Embla; install it with the pinned CLI; `embla-carousel-react` 8.6.0 is in the Stack register). The ported banner carousel also needs `embla-carousel-autoplay` 8.6.0 (MIT), the same version the food app uses.
4. **Name block:** name, tagline, area (town and province, never the exact address, E7), the Verified owner badge when verified, "from ₱X a night".
5. **Promo banners** (part 5): the ported carousel, only when 2+ banners; 1 banner shows as a still card.
6. **Units** (part 8):
   - The featured units first (`draft.units` order), then the rest.
   - Grouped "Stays" and "Monthly rentals" when both exist.
   - A unit card shows a photo, name, type, guests, beds, "from ₱X a night" (or "₱X a month") and goes to the unit page.
   - Phone: a vertical list of large cards; from 768 px a 2-column grid; from 1280 px 3 columns.
7. **Highlights** (part 9): up to 6 amenities with icons, one row that wraps.
8. **About and host** (part 7): about text (clamped at 6 lines with "Read more"), host card with photo, name, languages, "Hosting since 2024", "Usually replies within an hour" (all worked out, E9).
9. **Rules and policies** (part 10): check-in and check-out times, the cancellation preset in plain words, house rules, "IDs are asked before arrival" when on.
10. **Location and contact** (part 11):
    - The area only, with a "Exact address is shared after payment" line.
    - Contact buttons: Call, Messenger, Facebook, and others only when set.
    - The Google review link as "See reviews on Google".
11. **Times** (part 12): reply hours and viewing hours in plain words ("Replies 9 AM–6 PM, Mon–Sat").
12. **FAQ** (part 13): accordion (the installed one; it animates its height), one open at a time.
13. **Trust panel** (PA-10):
    - "Pay only to the accounts shown in your booking conversation. We never ask you to pay anywhere else."
    - Show a warning line when a payment account changed in the last 7 days.
    - "Report this page" (PA-11) opens a sheet with three reasons and a note (the `reportPage` operation).
14. **Footer:** privacy link, "Made with Smart App PH", demo label on demo accounts.
15. **Sticky action bar on phones:**
    - "Check dates" (goes to the first unit, or to the units list when there are several) and "Message".
    - It never covers the last section, and it respects the home indicator.

## Rules

- Server-rendered (Next.js 16, Cache Components on); images with `next/image`, sizes set, the cover `priority`, others lazy. Lighthouse mobile performance at least 90 on the Ulap Suites demo.
- Owner colours only through `PropertyTheme` / `--property-*`; no raw colours; light only. Fonts from the draft's pair, self-hosted (decision E3).
- Paused account: contact details only (PA-09). Unpublished: not found. No units: "No units listed yet" with the Message button.
- Words follow `smartapp-ui-writing`.

## Not in this task

The unit page (P5-3), installing/splash/manifest (P5-4), preview frame (P5-5), booking (Phase 6).

## Done when

- The pattern guide's definition of done (§6), with screenshots of 2 brands (Ulap Suites, Tita Lorna Dorm) at 390 px and 1280 px.
- All 7 states checked with the packs. Axe: no serious issues. The carousel pauses on focus and stays still with reduced motion.
- Lighthouse mobile score in the PR. `pnpm check` green, baselines regenerated after checking. PROGRESS: tick P5-2. One CHANGELOG line.
- Open the PR, wait for green CI, **do not merge**. Report the PR number.
