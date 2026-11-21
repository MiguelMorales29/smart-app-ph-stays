# P5-4 · Install, splash, share previews, offline and privacy

Model: Gemini Flash, High. Planning mode. After P5-2 is merged.

Read first: AGENTS.md, docs/prompts/P5-guide.md, Feature blueprint §7a "Splash and app icon" (rules 1 to 8) and "Web address", PA-05 to PA-08, Stack register (Serwist). Files: `apps/storefront/src/app/[slug]/install/page.tsx`, `privacy/page.tsx`, `layout.tsx`.

Port from the food app (`/tmp/food-ref`, read-only; clone it there first with `gh repo clone webserbisyo/Smart-App-PH---FINAL-2026 /tmp/food-ref` if it is missing):

- `apps/storefront/src/app/[shop]/manifest.webmanifest/route.ts`
- `apps/storefront/src/app/[shop]/splash/[size]/route.ts`
- `apps/storefront/src/features/install/` (`app-splash.tsx`, `install-card.tsx`, `install-watcher.tsx`, `offline-screen.tsx`, `install-rules.ts` with its test, `install-store.ts`, `cache-rules.ts`)

Leave out `push.ts` and `app-worker.tsx` push parts; push is Phase 12.

## Goal

Each property installs as its own app with its own name, icon and splash, on Android and iPhone. Shared links show a good preview. The page is honest when offline.

## Branch

`ag/p5-4-install-share` from main. One PR.

## Do

1. **Manifest per property:**
   - `/<slug>/manifest.webmanifest` with `id` and `scope` = `/<slug>/`, `start_url` = `/<slug>/?source=app`, `name` (property name), `short_name` (`install.homeScreenName`), `display: standalone`, `background_color` and `theme_color` = splash colour, icons 192 / 512 plus a maskable 512.
   - Linked from the `[slug]` layout.
2. **Icons:** `/<slug>/icon/<size>` draws the logo on the splash colour (never transparent; iPhones show transparency as black), the maskable one inside the safe zone, and the Apple 180 px touch icon. Initials on the splash colour when there is no logo.
3. **iPhone launch pictures:** `/<slug>/splash/<w>x<h>` for the current iPhone sizes, with the `apple-touch-startup-image` links in the layout.
4. **Our splash (layer 2):**
   - The ported `app-splash.tsx`: shown only in standalone mode, only on a cold start, the same colour as layer 1.
   - Animations None or Fade in wave 1. `install.splashAnimation` true means Fade; Logo pulse, Logo rise and Progress line are wave 2.
   - It leaves when the first screen is ready, at most 1.2 s. Still for reduced motion.
5. **`/install` page (PA-05):** steps for the phone in hand (Android: the install prompt or the menu; iPhone Safari: Share → Add to Home Screen, with simple drawings, not screenshots); "Already installed" state. The Install button in the top bar from P5-2 uses the same rules.
6. **Share previews (PA-08):**
   - A generated Open Graph picture per property (`opengraph-image`): cover photo, name, area, logo, 1200 × 630.
   - Per unit: the unit cover and name.
   - Title and description from the page's `seo` part, with good defaults.
   - `hideFromSearch` adds `noindex`.
7. **Offline (PA-06):**
   - Serwist caches the app frame and photos only.
   - Offline, the property page shows the last saved copy with a banner "You're offline. Prices and dates show again when you're back."
   - Dates, prices and the Reserve button are never shown from a saved copy.
   - An offline page for routes never visited.
8. **Privacy page (PA-07):** the owner's privacy contact, what is collected and why, how long it is kept, from the property's policies; plain words.

## Not in this task

Push notices (Phase 12). Wave 2 splash animations. Custom domains (wave 3).

## Done when

- Lighthouse PWA checks pass on Ulap Suites (installable, maskable icon, theme colour).
- Screenshots: the manifest JSON, the 3 icons, one iPhone launch picture, the install page on iPhone and Android sizes, a share preview for a property and a unit (open the OG image URL).
- Offline checked in Chrome DevTools: no price or date is shown from cache.
- `pnpm check` green. PROGRESS: tick P5-4. One CHANGELOG line.
- Open the PR, wait for green CI, **do not merge**. Report the PR number.
