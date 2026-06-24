---
name: burjo-panel-design-system
description: Burjo Minang Owner/Kasir panel redesign — palette decisions and design tokens
metadata:
  type: project
---

Owner Panel + Kasir POS were redesigned (2026-06) to match the landing page's premium Minang restaurant identity. The shared design tokens live in `tailwind.config.js` (the `bm` color namespace, `shadow-soft`/`shadow-elevated`, `page-enter`/`shimmer`/`pulse-dot`/`star-pop` animations) and `resources/css/app.css` (`--bm-*` CSS vars, `.bm-eyebrow`, `.bm-gold-underline`, `.bm-top-accent`, `.bm-skeleton`).

**User's explicit palette decisions (chosen over the spec's literal values):**
- **Hybrid red:** deep maroon `#990000` for large solid areas (sidebar, header, dark cards); brighter `#DC2626`/`#B91C1C` for buttons & small accents. (The landing page itself uses `#990000`/`#7a0000`.)
- **Bright gold** `#FACC15` for accents/ornaments (matches the `✦` Divider), NOT the muted antique gold `#D4A853` in the older `gold` config namespace.

**Why:** keep panels visually aligned with the public landing page while letting CTAs pop.

**How to apply:** for new panel UI, reuse the `bm-*` Tailwind classes and the shared primitives in `Components/ui` (`Button` with `variant`/`pill`, `Badge`, `Card`, `SectionHeader`, `Skeleton`) and `Components/Owner/StatCard`. Headings use `font-serif` (Playfair Display); body stays Figtree. No `framer-motion`/`lucide-react` — animations are Tailwind keyframes/CSS, icons are inline SVG. Stack: Laravel + Inertia + React 18 (TS) + Tailwind 3 + Recharts; build with `npm run build` (client + SSR).
