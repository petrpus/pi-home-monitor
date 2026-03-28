# UI stack — pi-home-monitor

## Frameworks

- **React 19**
- **TanStack Router** — file-based routes in `src/routes/`, `createFileRoute`, `Link` from `@tanstack/react-router`
- **TanStack Start** — SSR/build pipeline with Vite (`@tanstack/react-start`)
- **Tailwind CSS v4** with Vite plugin `@tailwindcss/vite`
- **lucide-react** for icons where used

## Not in this repo (yet)

- **React Hook Form** — not a dependency today; forms are minimal. If added for complex flows, document here.
- **TanStack Query** — optional for future data fetching; loaders/server functions are the TanStack Start defaults.

## File layout

| Area | Path |
| --- | --- |
| Routes | `src/routes/` (`__root.tsx`, `index.tsx`, `about.tsx`, `health.ts`, `api.ingest.ts`, …) |
| Shared components | `src/components/` (`Header`, `Footer`, `ThemeToggle`) |
| Global CSS + tokens | `src/styles.css` |
| App bootstrap | `src/main.tsx`, `src/router.tsx` |

## Routing conventions

- Root shell and document structure in **`__root.tsx`** (`shellComponent`, `head` meta).
- Use **`Link`** from TanStack Router for internal navigation (SPA); plain `<a href>` acceptable for external URLs.

## Devtools

- TanStack Router Devtools panel wired in `__root.tsx` (development ergonomics).

## SSR note

- Public pages render through TanStack Start SSR; keep heavy browser-only APIs inside `useEffect` or client-only branches.
