# Dev runtime (this project)

Project-specific paths and services for local work. Universal patterns live under `.cursor/docs/dev-runtime.md`.

## Services

### PostgreSQL (Docker)

- **Compose file**: `docker-compose.yml` at repo root.
- **Container name**: `pi-monitoring-postgres`
- **Image**: `postgres:16`
- **Port**: **5432** → host `5432`
- **Database**: `pi_monitoring`
- **User / password**: `postgres` / `postgres` (local only)

Start:

```bash
docker compose up -d postgres
```

### Application

- **Dev**: Vite on **port 3000** (`bun run dev`).
- **Production entry**: `server.ts` listens on **`PORT`** env or **3000**.

## Environment

- **`DATABASE_URL`**: required for Prisma. Example in `.env.example`:

  `postgresql://postgres:postgres@localhost:5432/pi_monitoring?schema=public`

- **Where it is read:** `getPrismaClient()` in [`src/lib/prismaDb.ts`](../../src/lib/prismaDb.ts) uses `process.env.DATABASE_URL` only (no `dotenv` import in that module).
- **Repo-root `.env`:** [`prisma.config.ts`](../../prisma.config.ts) and [`prisma/seed.ts`](../../prisma/seed.ts) import `dotenv/config`, so Prisma CLI and seed load variables from the repository root. **`bun run …`** also loads `.env` from the project when Bun starts the process.
- **Local footgun:** If **`DATABASE_URL` is already set in your shell**, Bun’s default env behavior keeps that value and does **not** replace it with `.env`—you may hit a different database than the file suggests. Unset the variable or align shell and `.env` before running dev, migrations, or tests.

## Seed dev agent

After migrate:

```bash
bun run prisma:seed
```

Logs include `agentId` and plaintext **`apiKey`** for local ingest (`dev-local-agent-key` by default in seed). **Do not use this key in production.**

## Logs

- Server errors: console from Bun / Vite / SSR as configured. No central log path in-repo for local dev.

## Integration tests

- Require reachable Postgres and applied migrations.
- Use `bun run test:all` or `bun run test:i` (see **workflow.md**).
