# Coding rules — pi-home-monitor

## TypeScript

- **Strict** typing; avoid `any`. Prefer inferred types from Zod (`z.infer`) and Prisma where practical.
- Use `#/` imports for `src/` paths (see `package.json`).

## Server vs client

- Prisma and Node crypto live on the **server** only. Keep DB access behind modules consumed from route handlers or server functions, not from arbitrary client bundles.
- `getPrismaClient()` throws if `DATABASE_URL` is missing.

## Features layout

- Place vertical slices under `src/features/<feature>/`:
  - **`* .schema.ts`** — Zod (and pure helpers like MAC normalization).
  - **`* .service.ts`** — business logic and transactions.
  - **`* .route-handler.ts`** — HTTP Request/Response mapping, dependency injection via optional `deps` for tests.
  - **`* .server.ts`** — server-only utilities (e.g. auth).
- Co-locate tests: `*.test.ts`, `*.integration.test.ts`.

## Prisma

- Client output directory: **`generated/prisma`** (see `schema.prisma` generator). Import from `../../generated/prisma/client` or paths consistent with existing files.
- Use **migrations** for schema changes; run `prisma:generate` after pulls.

## Testing

- **Vitest** with **Testing Library** for React where needed.
- Integration tests may use `RUN_INTEGRATION` gating — follow existing `ingest.integration.test.ts` patterns.
- Prefer injecting `deps` into route handlers / services for unit tests (see `handleIngestPost`).

## API errors

- Ingest returns JSON with `ok: false`, `error` code (`UNAUTHORIZED`, `INVALID_JSON`, `INVALID_PAYLOAD`, `INTERNAL_ERROR`), and appropriate HTTP status. Keep client contracts stable when changing internals.

## Lint / format

- **ESLint** via `bun run lint`; align with existing flat config and TypeScript ESLint rules.
