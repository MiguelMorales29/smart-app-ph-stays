# Hosted Previews (Vercel, D38)

Both front-end apps are configured on Vercel and run the in-memory sample world (`DATA_SOURCE=memory`, `APP_ENV=preview`) until Phase 14 (D38).

## Existing Vercel Projects

| Setting                    | Storefront                                         | Dashboard                                              |
| -------------------------- | -------------------------------------------------- | ------------------------------------------------------ |
| Project name               | `smart-app-ph-stays-storefront`                    | `smart-app-ph-stays-dashboard`                         |
| Root directory             | `apps/storefront`                                  | `apps/dashboard`                                       |
| Node.js version            | `24.x`                                             | `24.x`                                                 |
| Preview URL (`main`)       | `https://smart-app-ph-stays-storefront.vercel.app` | `https://smart-app-ph-stays-dashboard.vercel.app`      |
| Production branch tracking | `main`                                             | `main`                                                 |
| Vercel Authentication      | Disabled                                           | Disabled                                               |
| Deep-link SPA rewrite      | Not needed (Next.js App Router)                    | `apps/dashboard/vercel.json` (`/(.*)` → `/index.html`) |

Because both projects track `main`:

- Every merge to `main` refreshes the two short links above. Vercel labels these deploys "Production", but they still use `APP_ENV=preview` and sample data; the real production setup comes in Phase 14.
- Every pull request branch gets its own Preview deployment link (see below).
- The old empty `production` branch is no longer used and can be deleted.

## Environment Variables (Preview Only)

Configured on both projects for the Preview and Production environments (both run sample data until Phase 14):

- **Storefront (`smart-app-ph-stays-storefront`):**
  - `APP_ENV=preview`
  - `DATA_SOURCE=memory`
  - `NEXT_PUBLIC_APP_ENV=preview`
  - `NEXT_PUBLIC_DATA_SOURCE=memory`
  - `NEXT_PUBLIC_STOREFRONT_ORIGIN=` _(empty for same-origin `/demo-media/...` resolution)_
- **Dashboard (`smart-app-ph-stays-dashboard`):**
  - `APP_ENV=preview`
  - `DATA_SOURCE=memory`
  - `VITE_APP_ENV=preview`
  - `VITE_DATA_SOURCE=memory`
  - `VITE_STOREFRONT_ORIGIN=https://smart-app-ph-stays-storefront.vercel.app` _(or branch preview URL when testing cross-app links)_

## Finding Pull Request Preview Links

1. Open the pull request on GitHub (`MiguelMorales29/smart-app-ph-stays`).
2. Look at the **vercel** deployment status checks or the **Vercel bot comment** on the PR conversation tab — it lists both `smart-app-ph-stays-storefront` and `smart-app-ph-stays-dashboard` Preview URLs.
3. Alternatively, open the **Deployments** tab of either project in the Vercel dashboard and select the deployment matching the PR branch or commit SHA.
4. Once a PR merges to `main`, check on your phone using:
   - Storefront: `https://smart-app-ph-stays-storefront.vercel.app`
   - Dashboard: `https://smart-app-ph-stays-dashboard.vercel.app`
