# Workflow

## Prerequisites

- **Bun** (project scripts assume `bun`).
- **PostgreSQL** for app + integration tests — easiest via `docker compose` (see **dev-runtime.md**).

## Install and env

```bash
bun install
cp .env.example .env   # if needed; set DATABASE_URL
```

## Database

```bash
bun run prisma:migrate   # dev migrations
bun run prisma:generate  # client (also in build)
bun run prisma:seed      # dev agent + API key (see seed output)
```

## Development server

```bash
bun run dev
```

Default port **3000** (see `package.json` `dev` script).

## Production-style run (after build)

```bash
bun run build
bun run start            # bun ./server.ts, PORT from env
```

## Quality gates

```bash
bun run typecheck
bun run lint
bun run test             # unit tests; excludes integration unless RUN_INTEGRATION=1
bun run test:all         # all tests including integration (needs DB)
bun run test:i           # ingest integration only
```

The test runner wraps **Vitest** and sets `RUN_INTEGRATION=1` when `-a` / `--all` is passed (`scripts/test-runner.ts`).

## Deploy

- **Zerops**: `zerops.yml` — Bun build, `prisma generate`, Vite build, start `bun ./server.ts` on port 3000, `DATABASE_URL` from linked Postgres service.
