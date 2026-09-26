# Design Brief

## Direction

Market Ledger — a warm-paper wholesale catalog system where deep forest green signals trust and electric lime marks what is live, in stock, and ready to order.

## Tone

Editorial commerce: crisp, high-contrast, and practical — the confidence of a printed trade catalog translated into a thumb-first mobile grid.

## Differentiation

Every surface is a ledger: prices, stock pills, and store status render as precise, high-contrast data marks on warm paper, so a buyer can scan and order one-handed without a single ambiguous element.

## Color Palette

| Token      | OKLCH         | Role                                            |
| ---------- | ------------- | ----------------------------------------------- |
| background | 0.985 0.006 95 | Warm paper base for all three surfaces          |
| foreground | 0.2 0.022 155  | Ink text, prices, headings                      |
| card       | 1.0 0.002 95   | Product cards, panels, table rows               |
| primary    | 0.47 0.108 158 | Deep forest green — CTAs, WhatsApp, active nav  |
| accent     | 0.88 0.19 118  | Electric lime — in-stock badges, live signals   |
| muted      | 0.945 0.012 120 | Chips, table stripes, secondary surfaces       |
| warning    | 0.8 0.14 82    | Amber paused-store banner                       |
| destructive| 0.55 0.21 27   | Out-of-stock, delete, pause actions             |

## Typography

- Display: Space Grotesk — store names, page titles, prices, metric numbers (tight tracking)
- Body: DM Sans — product titles, labels, buttons, dashboard copy
- Mono: Geist Mono — slugs, WhatsApp numbers, metric deltas, table IDs
- Scale: hero `text-3xl md:text-5xl font-display font-bold tracking-tight`, h2 `text-xl md:text-2xl font-display font-semibold`, label `text-xs font-semibold uppercase tracking-widest text-muted-foreground`, body `text-sm md:text-base`

## Elevation & Depth

Warm paper base with hairline warm-grey borders; cards lift via `shadow-subtle`, interactive/floating elements via `shadow-elevated`, and the tour button + bottom sheets via `shadow-float` — depth from layered surfaces, never glow.

## Structural Zones

| Zone             | Background        | Border            | Notes                                                       |
| ---------------- | ----------------- | ----------------- | ----------------------------------------------------------- |
| Storefront header| `bg-card`         | `border-b`        | Sticky; store name + search bar + category chip rail        |
| Paused banner    | `bg-warning/15`   | `border-warning/40` | Full-width amber strip with alert icon, above the grid     |
| Storefront grid  | `bg-background`   | —                 | 2-col mobile product cards on white; `bg-muted/40` section banding |
| Floating actions | `bg-primary`      | none              | Pill "Virtual Shop Tour" button, `shadow-float`, bottom-right |
| Dashboard shell  | `bg-sidebar`      | `border-r`        | Sidebar + `bg-card` topbar, content on `bg-background`      |
| Admin panel      | `bg-card`         | `border`          | Data-dense tables, `bg-muted/50` header rows, zebra rows    |
| Footer           | `bg-muted/40`     | `border-t`        | Compact, mobile-safe, `safe-bottom` padding                 |

## Spacing & Rhythm

Mobile-first 16px gutters (`px-4`), 12px card gaps, 24–32px section gaps, 44px minimum tap targets; dashboards tighten to 8px table cell padding for density.

## Component Patterns

- Buttons: full-width pill `rounded-full` on mobile; primary = forest green with lime-tinted hover, WhatsApp = primary with icon, secondary = `bg-secondary` outline
- Cards: `rounded-2xl` white, hairline border, `shadow-subtle`, image-top with 4:3 aspect, price in display font
- Badges: pill `rounded-full`; in-stock = lime `accent` with dark ink, out-of-stock = `destructive/15` with destructive text, paused = amber
- Chips: horizontally scrollable pill rail, active chip = `bg-primary text-primary-foreground`

## Motion

- Entrance: `animate-fade-in-up` staggered 40ms per grid card, `animate-slide-up` for bottom sheets and the video player
- Hover: `transition-smooth` 300ms on cards (lift + `shadow-elevated`), buttons darken, chips fill
- Decorative: `animate-pulse-live` on the store-status dot; `animate-shimmer` on upload/loading skeletons

## Constraints

- Mobile-first: design at 375px first, expand with `sm:`/`md:`/`lg:`; thumb-reachable primary actions
- Zero runtime cost: bundled fonts only, no CDN, no external images, no AI services
- Semantic tokens only — no raw hex, `rgb()`, or arbitrary color classes in components
- Storefront must render with zero auth; paused state is a banner, never a lock screen
- Lucide React icons exclusively

## Signature Detail

The "ledger mark": a lime in-stock pill paired with a monospaced price and a pulsing status dot — one repeatable data motif that reads identically on a buyer's phone and an admin's table.
