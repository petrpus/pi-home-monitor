# Source of truth

Authoritative references for this repository. Prefer these over guessing from file names alone.

## Product and API (human-oriented)

| Topic | Location |
| --- | --- |
| Run, build, test commands; ingest API examples | Repository root [README.md](../../README.md) |
| Environment template | [.env.example](../../.env.example) |

## Database

| Topic | Location |
| --- | --- |
| Schema, enums, relations | [prisma/schema.prisma](../../prisma/schema.prisma) |
| Dev agent seed (fixed id + API key) | [prisma/seed.ts](../../prisma/seed.ts) |

## Runtime and deployment

| Topic | Location |
| --- | --- |
| Production HTTP entry (Bun + static + SSR) | [server.ts](../../server.ts) |
| Zerops build/run | [zerops.yml](../../zerops.yml) |
| Local Postgres (Docker) | [docker-compose.yml](../../docker-compose.yml) |

## Application code

| Topic | Location |
| --- | --- |
| Prisma client singleton (adapter-pg, `DATABASE_URL`) | [src/lib/prismaDb.ts](../../src/lib/prismaDb.ts) |
| Ingest Zod schema + MAC normalization | [src/features/ingest/ingest.schema.ts](../../src/features/ingest/ingest.schema.ts) |
| Ingest transaction + device/observation/alert logic | [src/features/ingest/ingest.service.ts](../../src/features/ingest/ingest.service.ts) |
| Ingest HTTP handler (auth + validation) | [src/features/ingest/ingest.route-handler.ts](../../src/features/ingest/ingest.route-handler.ts) |
| Agent API key hash + lookup | [src/features/agents/agent-auth.server.ts](../../src/features/agents/agent-auth.server.ts) |
| File routes | [src/routes/](../../src/routes/) |
| Global styles and design tokens | [src/styles.css](../../src/styles.css) |

## AI navigation (summaries)

| Topic | Location |
| --- | --- |
| Structure and boundaries | [architecture-map.md](./architecture-map.md) |
| Domain language and rules | [domain-map.md](./domain-map.md) |
| Commands and verification | [workflow.md](./workflow.md) |

## Deeper long-form docs

There is no separate `docs/` tree yet beyond this `docs/ai/` set. When you add runbooks (e.g. operations, security reviews), link them from here and from **README.md** in this folder.
