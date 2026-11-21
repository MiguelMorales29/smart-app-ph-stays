# Component catalog and install plan

22 November 2026. Lex asked for every component the food app installed, plus as many compatible components as possible beyond our stack (300+ with variants), installed into `packages/ui` without breaking our structure or design. This file is the audit and the plan. The installs run as the UI-1 to UI-6 prompts in `docs/prompts/UI-library-expansion.md`.

## How we count

- **A component** is one installable file or folder (Rating, Cropper, Data Grid).
- **A variant** is a ready example of a component in a different shape (a rating with half stars, a read-only rating, a rating with a count). Registries publish these as separate installable items.
- Target: about **150 components** and **200+ variants**, so **350+ items**, each mapped to a feature.

## Rules for every install (unchanged from D34, D60)

1. Everything goes into `packages/ui` (components in `components/`, our wrappers in `compositions/`). Never into `apps/*`.
2. Install only with the pinned CLI (`pnpm dlx shadcn@4.23.0 add …`), Base UI builds only.
3. After each install, replace raw colours with our tokens (the brand guard fails otherwise), add a light and a dark sample to `/kit`, and log any edit in `docs/ui-library.md`.
4. Free, open licences only: MIT, Apache-2.0, ISC, CC0. No paid ("Pro") items.
5. Unused components cost nothing at runtime: pages import only what they use, and the bundle budget checks every PR.

## Excluded on purpose

| Source                                                                | Why                                                                                                                           |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **coss ui** (Cal.com, the successor of Origin UI, 362 items, Base UI) | Licensed **AGPL-3.0**. Using it in our closed SaaS would oblige us to publish our source. Use it only as a picture reference. |
| ReUI Pro blocks (687) and templates                                   | Paid.                                                                                                                         |
| Magic UI, Animate UI and ReUI examples that need the `motion` package | Our decision D62 keeps motion CSS-only. The food app did install `motion`. **Open question O15** below.                       |
| Radix-only libraries (Kibo UI, legacy Origin UI)                      | We use Base UI; mixing two primitive layers doubles the code and the behaviour differences.                                   |

## A. From the food app (port: same component, our tokens)

The food app (`webserbisyo/Smart-App-PH---FINAL-2026`) has these in `packages/ui` that we don't. Port them exactly as installed there (same source registry), then map to our tokens.

### A1. Components (36)

| Component                                                                                                                               | Source             | Our use (feature, phase)                                                                                |
| --------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------- |
| action-bar                                                                                                                              | Dice UI            | Bulk actions on Units, Bookings, Guests (P5-0b, Phase 8)                                                |
| aspect-ratio                                                                                                                            | shadcn             | Photo frames, banners 16:9 (Phase 5)                                                                    |
| attachment                                                                                                                              | ReUI               | Payment proof, chat files (Phase 7)                                                                     |
| avatar-group                                                                                                                            | Dice UI            | Guests on a booking, team (Phase 8)                                                                     |
| badge-overflow                                                                                                                          | Dice UI            | Amenity chips "+3" (Phase 5)                                                                            |
| bubble, message                                                                                                                         | ReUI               | Booking conversation (Phase 7)                                                                          |
| button-group                                                                                                                            | shadcn             | Split buttons, segmented actions                                                                        |
| carousel                                                                                                                                | shadcn             | Hero gallery (P5-2 installs it)                                                                         |
| chart, evilcharts                                                                                                                       | shadcn, EvilCharts | Reports, Home stats (Phase 8, 9)                                                                        |
| checkbox-group                                                                                                                          | Dice UI            | Amenities, filters                                                                                      |
| collapsible                                                                                                                             | shadcn             | "Read more", FAQ rows                                                                                   |
| compare-slider                                                                                                                          | Dice UI            | Before/after photo edits (P5-6 logo background removal)                                                 |
| cropper                                                                                                                                 | Dice UI            | Photo crop 16:9, logo square, profile circle (P5-6, Phase 8)                                            |
| gauge, stat, number-ticker                                                                                                              | Dice UI, Magic UI  | Occupancy and money on Home (Phase 8)                                                                   |
| hitbox                                                                                                                                  | food app           | Bigger tap areas on small controls                                                                      |
| input, select                                                                                                                           | shadcn             | Plain fields and selects                                                                                |
| input-otp                                                                                                                               | shadcn             | Email codes (sign-up uses its own today)                                                                |
| marker, marquee                                                                                                                         | ReUI, Dice UI      | Map pin label; announcements                                                                            |
| pending                                                                                                                                 | food app           | Busy state on any button                                                                                |
| qr-code                                                                                                                                 | Dice UI            | Share page QR, payment QR (P5-4, Phase 7)                                                               |
| rating                                                                                                                                  | ReUI               | Rate your stay (BK-16)                                                                                  |
| reui/color-picker                                                                                                                       | ReUI               | Owner colours (P5-6)                                                                                    |
| reui/data-grid                                                                                                                          | ReUI               | Bookings and guests tables (Phase 8)                                                                    |
| reui/emoji-picker                                                                                                                       | ReUI               | Chat (Phase 7)                                                                                          |
| reui/event-calendar                                                                                                                     | ReUI               | Owner calendar with all units (Phase 6)                                                                 |
| reui/frame, icon-stack, icon-tile                                                                                                       | ReUI               | Settings tiles, empty pictures                                                                          |
| reui/kanban                                                                                                                             | ReUI               | Bookings board (Phase 8)                                                                                |
| reui/scrollspy                                                                                                                          | ReUI               | Long settings and property info pages                                                                   |
| reui/timeline                                                                                                                           | ReUI               | Booking history, activity (Phase 8)                                                                     |
| scroller                                                                                                                                | Dice UI            | Horizontal chip rows with fades                                                                         |
| status                                                                                                                                  | Dice UI            | Online, paused, open dots                                                                               |
| time-picker                                                                                                                             | Dice UI            | Check-in and check-out times (Settings, Phase 6)                                                        |
| visually-hidden-input                                                                                                                   | food app           | Accessible custom inputs                                                                                |
| skip-nav                                                                                                                                | food app           | Keyboard "skip to content"                                                                              |
| animated-list, blur-fade, border-beam, shine-border, progressive-blur, pulsating-button, word-rotate, animated-shiny-text, grid-pattern | Magic UI           | Owner landing page and celebrations (Phase 9) — **only if O15 allows `motion`**; otherwise CSS versions |

### A2. Compositions worth porting (17)

`avatar-maker`, `face-picker`, `face-customiser`, `person-avatar`, `avatar-theme` (the "Your picture" sheet with faces, colours, Surprise me, and the photo cropper; Phase 8 profile photo), `copy-button`, `count-up`, `drawn-check`, `heart-toggle`, `info-list`, `messenger-icon`, `otp-resend`, `page-header`, `preview-panel`, `responsive-sheet`, `scroll-hint`, `slot-chips`. Also the vendored `booking-slot-calendar` and `week-strip-calendar` (Phase 6 date picking).

The DiceBear styles the faces use (`adventurer`, `lorelei`, `micah`, `open-peeps`, `pixel-art`, `thumbs`; MIT code, CC0 or CC BY 4.0 art, credited on screen) come with them.

## B. shadcn (Base UI) components we still lack (16)

Combobox, Command, Context Menu, Hover Card, Kbd, Menubar, Navigation Menu, Pagination, Resizable, Slider, Sonner (we keep our toast; install only if it replaces it), Toggle Group variants, Input OTP, Select, Chart, Collapsible. (Some overlap with A; install once.)

## C. ReUI free primitives, Base UI builds (27)

Alert, Autocomplete, Badge, Cascader, Code Block, Color Picker, Data Grid, Date Selector, Emoji Picker, Event Calendar, File Type, Filters, Frame, Gantt, Icon Stack, Icon Tile, Kanban, Number Field, Phone Input, Rating, Scrollspy, Signature Pad, Sortable, Stepper, Time Picker, Timeline, Tree.

New to us beyond the food app: **Autocomplete** (barangay and city fields), **Cascader** (province → city → barangay), **Date Selector** (date range with presets for reports), **Filters** (bookings and guests filters, Phase 8), **Signature Pad** (lease signing, Phase 15), **Gantt** (unit occupancy across months, Phase 15), **Tree** (properties → units, Phase 8 switcher), **File Type** icons.

## D. Dice UI components (51, Base UI default)

Already installed: Banner, Circular Progress, File Upload, Mask Input, Responsive Dialog, Sortable, Stepper. From A: Action Bar, Avatar Group, Badge Overflow, Checkbox Group, Compare Slider, Cropper, Gauge, Marquee, QR Code, Rating, Scroller, Stat, Status, Time Picker, Timeline.

New to us: **Angle Slider**, **Color Swatch** (owner colours), **Combobox**, **Command Stack**, **Data Table**, **Editable** (inline rename of units), **Faceted** filters, **Key Value** (fees list editor), **Kbd**, **Listbox**, **Masonry** (photo grid), **Media Player** (property video, later), **Mention** (team chat, later), **Phone Input**, **Presentation**, **Query Builder** (reports, later), **Relative Time Card** ("2 hours ago" with the exact time on hover), **Scroll Spy**, **Segmented Input** (OTP-like codes), **Selection Toolbar**, **Speed Dial** (an option for the dock + menu), **Stack**, **Swap** (icon swap states), **Tags Input** (house rules, languages), **Tour** (first-time owner walkthrough, Phase 8).

## E. Variants (200+)

From ReUI's free examples (1,265 across 87 categories) and Dice UI's examples, pick the variants each feature needs, so the agent installs a ready example instead of hand-building one:

| Feature area                   | Variants to install (count)                                                                                  |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Buttons, badges, chips, status | loading, icon-only, split, count badge, dot, outline/soft tones (30)                                         |
| Inputs and fields              | peso money, phone +63, OTP, password strength, search with clear, character counter, tags, time (35)         |
| Selects and pickers            | combobox with search, multi-select chips, cascader province/city, date range with presets, month picker (25) |
| Calendars                      | range with nightly prices, check-out-only days, multi-month, week strip, agenda, event calendar views (20)   |
| Photos and files               | cropper shapes, drag-drop upload, sortable grid, compare slider, masonry, lightbox carousel (20)             |
| Lists, tables, grids           | data grid with selection, column visibility, virtual rows, row actions, empty and loading rows (25)          |
| Feedback                       | toasts with undo, alert tones, banners, empty states, skeleton layouts, progress (25)                        |
| Navigation                     | tabs (pill, underline), breadcrumbs, pagination, scrollspy, stepper (vertical, horizontal), tour (20)        |
| Chat and money                 | message bubbles, attachments, receipt card, rating with note, QR card (15)                                   |

## F. Mapping to the front-end phases

| Phase   | Components it will use                                                                                                                           |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| 5 (now) | carousel, aspect-ratio, badge-overflow, collapsible, qr-code, color-picker, color swatch, cropper, compare-slider, sortable, masonry, tags input |
| 6       | event-calendar, date selector, booking-slot and week-strip calendars, time-picker, phone input, autocomplete, cascader                           |
| 7       | message, bubble, attachment, emoji picker, file upload, qr-code, rating, relative time card                                                      |
| 8       | data grid, filters, faceted, kanban, timeline, avatar group, action bar, chart, stat, gauge, tree, tour, avatar maker                            |
| 9       | charts, pricing cards, landing effects (motion decision O15)                                                                                     |
| 15      | gantt, signature pad, key value, query builder                                                                                                   |

## Open question

**O15 (Lex):** the food app installed the `motion` package for Magic UI effects and EvilCharts. Our D62 keeps motion CSS-only. Options: (a) keep CSS-only and use CSS versions of the effects; (b) allow `motion` only inside lazily loaded pieces (owner landing page, celebrations, charts), never in the first load of the dashboard or the property page. Recommended: (b), with the bundle budget enforcing it.
