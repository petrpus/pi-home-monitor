import { createFileRoute } from '@tanstack/react-router'
import {
  DEV_ADD_AGENT_PATH,
  DEV_AGENTS_API_PATH,
} from '#/features/agents/dev-register-agent.paths'

export const Route = createFileRoute(DEV_ADD_AGENT_PATH)({
  validateSearch: (raw: Record<string, unknown>) => ({
    created: typeof raw.created === 'string' ? raw.created : undefined,
    detail: typeof raw.detail === 'string' ? raw.detail : undefined,
    error:
      raw.error === 'duplicate_api_key' ||
      raw.error === 'validation' ||
      raw.error === 'internal' ||
      raw.error === 'invalid_form'
        ? raw.error
        : undefined,
  }),
  component: DevAddAgentPage,
})

function DevAddAgentPage() {
  const isDev = import.meta.env.DEV
  const { created, error, detail } = Route.useSearch()

  if (!isDev) {
    return (
      <main className="page-wrap px-4 pb-8 pt-14">
        <section className="island-shell rounded-2xl p-6">
          <p className="island-kicker mb-2">Unavailable</p>
          <h1 className="mb-3 text-xl font-semibold text-[var(--sea-ink)]">Dev agent registration</h1>
          <p className="m-0 text-sm text-[var(--sea-ink-soft)]">
            This route is only available in development builds.
          </p>
        </section>
      </main>
    )
  }

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <section className="island-shell rise-in relative overflow-hidden rounded-[2rem] px-6 py-10 sm:px-10 sm:py-12">
        <p className="island-kicker mb-3">Temporary — remove before production use</p>
        <h1 className="display-title mb-4 text-3xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-4xl">
          Register an agent
        </h1>
        <p className="mb-6 max-w-2xl text-sm text-[var(--sea-ink-soft)]">
          The API key is stored as a SHA-256 hash (same as seed and ingest). Disable this route when you
          ship a real admin flow.
        </p>

        {created ? (
          <p className="mb-6 rounded-xl border border-[rgba(47,106,74,0.35)] bg-[rgba(79,184,178,0.12)] px-4 py-3 text-sm text-[var(--sea-ink)]">
            Created agent <code className="font-mono text-[var(--lagoon-deep)]">{created}</code>. Use the API
            key you entered with <code className="font-mono">x-api-key</code> on{' '}
            <code className="font-mono">POST /api/ingest</code>.
          </p>
        ) : null}

        {error === 'duplicate_api_key' ? (
          <p className="mb-6 rounded-xl border border-[rgba(180,80,80,0.35)] bg-[rgba(255,200,200,0.2)] px-4 py-3 text-sm text-[var(--sea-ink)]">
            An agent with this API key (hash) already exists.
          </p>
        ) : null}

        {error === 'validation' ? (
          <p className="mb-6 rounded-xl border border-[rgba(180,80,80,0.35)] bg-[rgba(255,200,200,0.2)] px-4 py-3 text-sm text-[var(--sea-ink)]">
            Validation failed: {detail ?? 'check name and API key.'}
          </p>
        ) : null}

        {error === 'internal' ? (
          <p className="mb-6 rounded-xl border border-[rgba(180,80,80,0.35)] bg-[rgba(255,200,200,0.2)] px-4 py-3 text-sm text-[var(--sea-ink)]">
            Server error while creating the agent.
          </p>
        ) : null}

        {error === 'invalid_form' ? (
          <p className="mb-6 rounded-xl border border-[rgba(180,80,80,0.35)] bg-[rgba(255,200,200,0.2)] px-4 py-3 text-sm text-[var(--sea-ink)]">
            Could not read form submission.
          </p>
        ) : null}

        <form method="post" action={DEV_AGENTS_API_PATH} className="grid max-w-md gap-4">
          <label className="grid gap-1.5 text-sm font-medium text-[var(--sea-ink)]">
            Name
            <input
              name="name"
              type="text"
              required
              autoComplete="off"
              className="rounded-xl border border-[rgba(23,58,64,0.2)] bg-white/80 px-3 py-2.5 text-[var(--sea-ink)] outline-none focus:border-[rgba(50,143,151,0.5)]"
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-[var(--sea-ink)]">
            API key (plaintext; hashed server-side)
            <input
              name="apiKey"
              type="text"
              required
              autoComplete="off"
              className="rounded-xl border border-[rgba(23,58,64,0.2)] bg-white/80 px-3 py-2.5 font-mono text-sm text-[var(--sea-ink)] outline-none focus:border-[rgba(50,143,151,0.5)]"
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-[var(--sea-ink)]">
            Location label <span className="font-normal text-[var(--sea-ink-soft)]">(optional)</span>
            <input
              name="locationLabel"
              type="text"
              autoComplete="off"
              className="rounded-xl border border-[rgba(23,58,64,0.2)] bg-white/80 px-3 py-2.5 text-[var(--sea-ink)] outline-none focus:border-[rgba(50,143,151,0.5)]"
            />
          </label>
          <button
            type="submit"
            className="mt-2 w-fit rounded-full border border-[rgba(50,143,151,0.35)] bg-[rgba(79,184,178,0.18)] px-6 py-2.5 text-sm font-semibold text-[var(--lagoon-deep)] transition hover:-translate-y-0.5 hover:bg-[rgba(79,184,178,0.28)]"
          >
            Create agent
          </button>
        </form>
      </section>
    </main>
  )
}
