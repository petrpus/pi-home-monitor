# Admin CRUD registry (extending the schema)

This document explains how to add or change **admin-managed** models after you evolve the Prisma schema. UI copy stays **Czech**; code comments and docs are **English**.

## Overview

- **List / mutate RPC:** `src/features/admin/adminApiFns.ts` (`adminListFn`, `adminMutateFn`, `getDashboardStatsFn`). Handlers run on the server only; Prisma and session checks are loaded dynamically so the client bundle stays clean.
- **Business rules + Prisma:** `src/features/admin/admin-crud.service.ts` — add a `switch` branch per `AdminResourceKey` for `list` and `mutate` behavior.
- **Allowed keys and validation:** `src/features/admin/admin-types.ts` — extend `ADMIN_RESOURCE_KEYS`, `listQuerySchema` filters, and `mutateBodySchema` if needed.
- **Czech UI:** `src/features/admin/admin-resource-copy.ts` (nav/titles), `src/features/admin/admin-list/admin-column-labels.ts` (table headers per field key), and list UI under `src/features/admin/admin-list/`.
- **Devices list (Zařízení):** Column order is fixed in `src/features/admin/admin-list/constants.ts` (`DEVICE_TABLE_COLUMNS`): **Název** (`normalizedName`), **Druh** (`kind`), **Hlavní MAC**, **Posl. IP**, **Posl. RSSI**, **Výrobce** (`vendor`). Row menu: **Zobrazit detail** (read-only modal with full scalar fields) and **Upravit název** (updates `normalizedName` and sets **`nameUserSet`** when a non-empty name is saved; clearing the name clears the flag so ingest can set the name again—see **domain-map.md** for ingest rules).
- **Agent “active” in UI:** `lastSeenAt` within **24 hours** counts as reachable (green); otherwise red. Constants live in `src/features/agents/agent-activity.ts`. List filters **Aktivní / Neaktivní** use the same rule (not the stale `Agent.status` alone). Successful ingest sets `status` to `ONLINE` and refreshes `lastSeenAt`.
- **Session / login:** `src/features/auth/sessionAdmin.server.ts` (server-only), RPC entrypoints in `src/features/auth/adminAuthFns.ts`.

## Steps to add a new admin resource

1. **Migrate Prisma** — add the model and run `bun run prisma:migrate`.
2. **Register the key** — add a literal to `ADMIN_RESOURCE_KEYS` in `admin-types.ts` and a title in `admin-resource-copy.ts`.
3. **List + filters** — in `admin-crud.service.ts`, implement `case 'yourKey':` for `adminList` (sort whitelist, `where`, `search` fields). Keep filters **allowlisted** (no raw client `where` JSON).
4. **Mutations** — in `adminMutate`, add `create` / `update` / `delete` / `bulkDelete` only where domain allows it. Validate payloads with **Zod** schemas in the same file (same pattern as `alertCreateSchema`).
5. **Routes** — add a link in `ADMIN_LINKS` pointing to `/admin/<key>` (URL must match the resource string).
6. **Manual test** — login, open the table, exercise create/edit/delete and bulk delete; confirm Sonner toasts show **operation IDs**.

## Security notes

- Never expose `Agent.apiKeyHash` or similar secrets in `select` / list responses.
- `POST /api/ingest` remains **agent `x-api-key` only** — unrelated to admin session.
- Use strong `SESSION_SECRET` (32+) and `ADMIN_PASSWORD` in production; set them in your host (e.g. Zerops) as secrets.

## Prisma client import

- Use `#/lib/prismaDb` (not a `*.server.ts` filename) for modules that are **imported** from RPC wrappers consumed on the client, so TanStack Start does not reject the graph. Pure server route handlers may keep using the same module.
