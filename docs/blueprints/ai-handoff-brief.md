# AI handoff brief: Smart App PH Stays and Rentals

Paste everything below into a new AI chat. Then ask for the next step.

---

You are helping build MVP A of a real estate booking and rent app for the Philippines, called Smart App PH Stays and Rentals. It is a capstone and a real product. The founder is Alexander Morales. Work from the other tabs of the project document. Two are the core for building: the Database blueprint (62 tables, every column, the SQL functions, security, the order of migrations) and the Feature blueprint (90 features, 46 routes, a brief for every page, the rules and limits). Where either differs from the System blueprint, it wins. The Build roadmap gives the order of work, phase by phase. The rest are the System blueprint (the overall plan), the Capstone paper, the Knowledge base (the rules per course, with sources) and the Stack register (exact versions). The Feature blueprint names no components on purpose: do the ten-step research pass in its section 11 before building a page. Ask before changing a decision that is marked open.

**Scope.** Short stays (staycations, per night, down payment through chat) and long-term rentals (apartments, rooms, bed-spaces; monthly bills). Guest and member accounts, owner-set stamp cards and rewards, super admin, web push, and one platform Meta Pixel with Conversions API run by the super admin on our own owner landing, sign-up and setup pages, to win owners through ads (owners get no Pixel of their own at launch; the tab Meta Pixel, CAPI and super admin is the plan to build it from). Payment is manual with proof (GCash, Maya, bank) reviewed by the owner. Calendar sync to Airbnb is MVP B, and it is our own iCal import and export, not a connector. Tours (per-head packages on fixed dates) are a third listing type in MVP B: do not build them, but follow the six rules in section 12 of the Tours (MVP B) tab so they can be added later.

**Rewards.** One card for stays and one for tenants per property, each in stamps mode (milestones) or points mode (rewards with a point cost), with limited pieces whose counts are worked out by the server, and pause until a date (Feature blueprint, section 7c). **How to build a slice.** Follow the Build roadmap tab (order changed on 16 November 2026). Inside a wave, the screens come first, on mock data that uses the shared Zod schemas and is reached only through packages/data. A page on mock data is "UI approved", not done. Then, for the same slices: the API contract (routes, inputs, outputs, error codes), the migration, the SQL functions with their tests, and the API, and the mock data is switched off. A slice is done only on the real database. Never let a screen write dates, money or stamps directly.

**Stack (exact, from the food app).** pnpm 12.8.1; Turborepo 2.11.7; Node 24.14; TypeScript 6.0.3. Property app: Next.js 16.4.2 with Serwist 9.5.13. Dashboard: Vite 8.3.4 with TanStack Router and Query, and Zustand for the page editor's state only (API data never goes in a store). API: NestJS 12.1.2 on Express, Helmet, jose, Zod 4.6.6. Database: Supabase Postgres with the btree\_gist extension. Hosting: Vercel for the two front ends, Railway for the API and outbox worker. Full list in the Stack register.

**Rules that do not bend.**

1. Browser to NestJS API to Postgres. Screens never call Supabase directly. Row-level security is a backup, never the only guard.
2. A room cannot be double booked. The database prevents it with an exclusion constraint on a unit's occupancy (gist; half-open date range, first night to checkout day). Mock data only imitates this rule; the database is what enforces it.
3. Money is whole centavos. Dates are Manila calendar dates. Ledgers are append-only. Each booking stores a price snapshot.
4. Every write that can repeat carries an idempotency key. Notifications and Meta events leave through one transactional outbox.
5. Mock data lives only in `packages/data/src/mocks` and `packages/core/src/demo`. Screens never import mocks.
6. Every requirement has an ID and an acceptance test. Every screen has its loading, empty, error and success states.
7. Owner ID comes from the verified membership, never from the request. Every read is tested for cross-owner leaks.
8. Dependencies: exact versions, a seven-day release age, and each new one written in the Stack register first.
9. Standards cited, not invented: ISO/IEC 25010:2023 for quality, OWASP Top 10:2025 and OWASP API Top 10 2023 for security, Core Web Vitals at the 75th percentile, WCAG 2.2 AA, Nielsen's heuristics, SUS (68 floor, 80 goal).

**Open items (not decided).** All 13 decisions in section 16.1 of the Proposal were approved as recommended on 14 November 2026. Calendar sync stays in MVP B, on the assumption that the first hosts are not on Airbnb. Still open: Launch gates: the NPC registration duty for a sole proprietor, Vercel's commercial terms for the Hobby plan, and BIR registration and the city business permit are not yet researched. The school's own capstone manual has not been seen, so the paper follows the common format.

**How to work with me.** Give the answer first. Cite a source for each standard or fact, and say which ones were not opened. If a source cannot be reached, stop and say so, and say how to fix access (for example, a domain or network setting). Mark assumptions. Do not invent a figure. Keep the scope list closed: one item in, one item out.

**Next step to ask for.** Phases 1 to 4 are done. Phase 5 (public pages and the page editor) runs as the prompts in `docs/prompts/P5-guide.md`, P5-0 to P5-7, in order; Claude reviews each pull request before it is merged (D70). The repo's `AGENTS.md` and `docs/PROGRESS.md` always say where the build is.
