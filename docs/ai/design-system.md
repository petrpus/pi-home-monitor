# Design system — pi-home-monitor

Canonical UI tokens and patterns for **this** repo. Universal Cursor kit policy stays in `.cursor/docs/`.

## Typography

- **Body / UI**: **Manrope** — set via Tailwind `@theme` as `--font-sans` in `src/styles.css`.
- **Display / headings**: **Fraunces** — use class **`.display-title`** for hero-style headings (see home page).
- Fonts load from Google Fonts in `src/styles.css`.

## Color system (CSS variables)

Semantic tokens live on `:root` with a **light** default and **dark** overrides via:

- `html[data-theme="dark"]`, and
- `@media (prefers-color-scheme: dark)` for `:root:not([data-theme="light"])`.

Key tokens (light values shown; see file for dark):

| Token | Role |
| --- | --- |
| `--sea-ink` | Primary text |
| `--sea-ink-soft` | Secondary text |
| `--lagoon` / `--lagoon-deep` | Accents, links, CTAs |
| `--palm` | Supporting green |
| `--sand` / `--foam` / `--bg-base` | Background layers |
| `--surface` / `--surface-strong` | Card / panel fills |
| `--line` | Borders |
| `--header-bg` | Sticky header |
| `--chip-bg` / `--chip-line` | Pills / chips |
| `--kicker` | Uppercase label color (`.island-kicker`) |

**Theme toggle**: `src/components/ThemeToggle.tsx` sets `data-theme` on `document.documentElement`.

## Layout utilities

- **`.page-wrap`**: max-width content column (~1080px), centered.
- **`.island-shell`**: glassy card — border, gradient fill, inset highlight, shadow.
- **`.feature-card`**: variant of island for grid tiles; hover lift.
- **`.island-kicker`**: small uppercase section label.

## Motion

- **`.rise-in`**: entrance animation for staggered sections (used with inline `animationDelay` on home).

## Tailwind

- Tailwind v4 with `@import "tailwindcss"` and **`@theme`** for font family extension.
- **`@tailwindcss/typography`** plugin enabled for prose when needed.

## Code in UI

- `code` / `pre` styled globally in `src/styles.css` (rounded, bordered inline code).

When adding new screens, **reuse these variables and classes** before introducing unrelated palettes or ad hoc hex colors.
