# UI stack — pi-home-monitor

## Frameworks

- **React 19**
- **TanStack Router** — file-based routes in `src/routes/`, `createFileRoute`, `Link` from `@tanstack/react-router`
- **TanStack Start** — SSR/build pipeline with Vite (`@tanstack/react-start`)
- **Tailwind CSS v4** with Vite plugin `@tailwindcss/vite`
- **lucide-react** for icons where used

## Data fetching

- **TanStack Query** — admin tables and dashboard stats (`@tanstack/react-query`).
- **React Hook Form** — not used yet; admin entity forms use JSON textarea + server Zod validation.

## File layout

| Area | Path |
| --- | --- |
| Routes | `src/routes/` (`__root.tsx`, `index.tsx`, `login.tsx`, `analytics*`, `admin*`, `health.ts`, `api.ingest.ts`, …) |
| Shared components | `src/components/` (`dashboard-shell`, `ThemeToggle`, `ui/*`) |
| Global CSS + tokens | `src/styles.css` |
| App bootstrap | `src/main.tsx`, `src/router.tsx` |

## Routing conventions

- Root shell and document structure in **`__root.tsx`** (`shellComponent`, `head` meta).
- Use **`Link`** from TanStack Router for internal navigation (SPA); plain `<a href>` acceptable for external URLs.

## Devtools

- TanStack Router Devtools panel wired in `__root.tsx` (development ergonomics).

## SSR note

- Public pages render through TanStack Start SSR; keep heavy browser-only APIs inside `useEffect` or client-only branches.


## Admin dashboard (current)

- **UI:** Czech copy; **routes** in English (`/login`, `/analytics`, `/admin/...`). Shell: `src/components/dashboard-shell.tsx`, providers in `src/components/app-providers.tsx`.
- **Components:** Shadcn-style primitives under `src/components/ui/` (Button, Card, Table, Dialog, etc.) using tokens from `docs/ai/design-system.md` + CSS variables in `src/styles.css`.
- **Data:** `@tanstack/react-query`, `sonner` toasts; server mutations via `createServerFn` (`adminAuthFns.ts`, `adminApiFns.ts`).
- **Extending admin entities:** see [admin-crud-registry.md](./admin-crud-registry.md).
