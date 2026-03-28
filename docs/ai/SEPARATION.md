# Separation: `.cursor/` vs `docs/ai/` vs `docs/`

This matches **.cursor/context/project-docs-contract.md**.

## `.cursor/`

Shared **AI tooling**: rules, agents, commands, generic stack baselines. It may be symlinked from a central kit.

- **Must not** contain descriptions of *this* app’s domain, product name specifics beyond generic examples, or this repo’s architecture.
- **May** reference `docs/ai/` paths so agents know where project knowledge lives.

## `docs/ai/`

**Project knowledge for agents and humans**: overview, architecture map, domain map, workflow, coding rules, UI stack, design system, local dev runtime, adoption order, source-of-truth index.

- Keep files **accurate** when behavior changes; stale AI context is worse than none.
- Prefer small, navigable pages over one huge document.

## `docs/` (optional depth)

Long-lived **authoritative** documentation: deep architecture notes, security reviews, runbooks, ADRs. Not required for the kit to function; **source-of-truth.md** should link anything you add here.

## Rule of thumb

If a sentence is true only for **pi-home-monitor** (ingest, agents, Prisma models, Zerops service names), it belongs in **docs/ai** or **docs/**, not in `.cursor/context/`.
