# UI patterns — pi-home-monitor

Reusable patterns observed in the codebase. Extend this file when you introduce new repeated layouts.

## Page structure

- Wrap main content in **`<main className="page-wrap …">`** for consistent horizontal margins and max width.
- Use **`.island-shell`** for primary content blocks (rounded ~2rem, gradient surface, border).
- Section labels: **`.island-kicker`** above headings.

## Navigation

- **Header**: sticky bar with `bg-[var(--header-bg)]`, `backdrop-blur`, bottom border `var(--line)`.
- Primary brand chip: rounded pill with `var(--chip-bg)`, `var(--chip-line)`, small gradient dot.
- Internal routes: **`Link`** with **`className="nav-link"`** for animated underline (and `.is-active` when active — follow existing header patterns).

## CTAs and links

- Primary on-page actions: rounded-full buttons/links with lagoon-tinted borders and soft fills (see home page hero buttons).
- External links: `target="_blank"` + `rel="noopener noreferrer"` (or `noreferrer` as in existing components).

## Dark mode

- Prefer **CSS variables** (`var(--sea-ink)`, etc.) so light/dark tracks `data-theme` and system preference without duplicate Tailwind classes.
- Interactive hover states: `hover:bg-[var(--link-bg-hover)]`, text shift `sea-ink-soft` → `sea-ink`.

## Accessibility

- Icon-only controls: include **`.sr-only`** text or `aria-label` / `aria-hidden` as in `Header.tsx`.
- Respect focus visibility when adding new interactive elements (Tailwind `focus-visible:` rings if native focus is suppressed).

## Marketing vs product UI

- Current pages lean **starter / marketing** (TanStack branding). When building **monitoring dashboards**, keep tokens from **design-system.md** for visual continuity.
