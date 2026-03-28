# Pi Home Monitor — AI context (entry point)

**pi-home-monitor** is a home-network observability app: edge **agents** (e.g. on a Raspberry Pi) POST telemetry to a **TanStack Start** server; the server persists **raw reports**, normalizes **devices** and **observations**, and can raise **alerts** (MVP: new device).

Use this folder as the **first** place to load project knowledge. Follow the reading order in **AGENT_ADOPTION.md**.

## Quick links

| Doc | Purpose |
| --- | --- |
| [AGENT_ADOPTION.md](./AGENT_ADOPTION.md) | How to adopt this repo before unfamiliar work |
| [source-of-truth.md](./source-of-truth.md) | Where authoritative detail lives |
| [architecture-map.md](./architecture-map.md) | Layout, routes, server boundaries |
| [domain-map.md](./domain-map.md) | Domain language and agent-ingest rules |
| [workflow.md](./workflow.md) | Dev, test, migrate, deploy |
| [coding-rules.md](./coding-rules.md) | Conventions for this codebase |
| [dev-runtime.md](./dev-runtime.md) | Local services, ports, env |
| [design-system.md](./design-system.md) | Tokens, typography, theme |
| [ui-stack.md](./ui-stack.md) | Frameworks and UI file layout |
| [ui-patterns.md](./ui-patterns.md) | Reusable UI patterns |
| [SEPARATION.md](./SEPARATION.md) | What belongs here vs `.cursor/` vs `docs/` |

## Kit note

The shared Cursor kit’s stack profile may mention “React Router”; **this repository uses TanStack Router and TanStack Start**. Trust **ui-stack.md** and **architecture-map.md** for routing and SSR here.
