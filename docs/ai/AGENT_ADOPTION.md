# Agent adoption — pi-home-monitor

Before architecture-sensitive, security-sensitive, or domain-heavy changes, read project context in this order:

1. **README.md** (this folder) — product snapshot and navigation.
2. **This file** — adoption contract (you are here).
3. **source-of-truth.md** — canonical pointers; open linked files for the area you touch.
4. **architecture-map.md** — if you change routes, SSR handlers, or feature layout.
5. **domain-map.md** — if you touch ingest, agents, devices, observations, alerts, or identity (MAC) rules.
6. **coding-rules.md** — TypeScript, imports, tests, Prisma.
7. **dev-runtime.md** — local Postgres, ports, env when running or debugging.
8. **design-system.md**, **ui-stack.md**, **ui-patterns.md** — before non-trivial UI work.

## Domain Agent (when to use)

Invoke domain-focused review when changing:

- Ingest payload shape, normalization, or MAC / device identity rules.
- Agent API key handling, hashing, or status semantics.
- Prisma models or migrations for `Agent`, `RawReport`, `Device`, `Observation`, or `Alert`.
- Alert creation rules or new alert types.

Financial ledgers, billing, or unrelated domains are **out of scope** for this app; still use care for anything that affects **data integrity** or **auth**.

## After changes

- Run **typecheck** and **lint**; run **tests** for the feature you touched (see **workflow.md**).
- Integration tests for ingest require Postgres and migrations (see **dev-runtime.md**).
