# Smart App PH — Stays and Rentals

Smart App PH Stays and Rentals gives small Philippine property owners their own installable booking app for nightly staycations and monthly room or apartment rentals. Owners manage listings, bookings, and leases from a single dashboard while the founder operates the platform from a super admin area.

## Requirements

- **Node.js**: `24.14.0` (pinned in `.nvmrc`; `engines.node` requires `>=24.14 <25`).
- **pnpm**: `12.18.0` (pinned in `package.json` under `packageManager`).

## Commands

- `pnpm install` — install all workspace dependencies
- `pnpm dev` — start all apps (`storefront`, `dashboard`, and `api`) in development mode
- `pnpm check` — run `typecheck`, `lint`, and `test` across the monorepo
- `pnpm build` — build all packages and applications
- `pnpm format` — format files with Prettier
- `pnpm format:check` — verify formatting with Prettier

## Local Addresses

- **Storefront (`@smartapp/storefront`)**: `http://localhost:3100`
- **Dashboard (`@smartapp/dashboard`)**: `http://localhost:5174`
- **API Health Check (`@smartapp/api`)**: `http://localhost:4100/health`

## Opening on a Phone over Wi-Fi

1. Find your Mac's local Wi-Fi IP address by running:
   ```bash
   ipconfig getifaddr en0
   ```
2. With `pnpm dev` running and your phone connected to the same Wi-Fi network, open:
   - Storefront: `http://<mac-ip>:3100`
   - Dashboard: `http://<mac-ip>:5174`

## Documentation

Project decisions, progress tracking, prompts, and blueprint snapshots live in [`docs/README.md`](./docs/README.md). Rules for AI coding agents live in [`AGENTS.md`](./AGENTS.md).
