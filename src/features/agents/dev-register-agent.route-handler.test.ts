import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { hashApiKey } from '#/features/agents/agent-auth.server'
import { DEV_AGENTS_API_PATH } from '#/features/agents/dev-register-agent.paths'
import { handleDevRegisterAgentPost, type DevRegisterAgentDeps } from './dev-register-agent.route-handler'

function makeFormRequest(entries: Record<string, string>): Request {
  const form = new FormData()
  for (const [k, v] of Object.entries(entries)) {
    form.append(k, v)
  }
  return new Request(`http://localhost${DEV_AGENTS_API_PATH}`, { method: 'POST', body: form })
}

describe('handleDevRegisterAgentPost', () => {
  const originalNodeEnv = process.env.NODE_ENV

  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'development')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    process.env.NODE_ENV = originalNodeEnv
  })

  it('returns 404 when NODE_ENV is production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const res = await handleDevRegisterAgentPost(
      makeFormRequest({ name: 'A', apiKey: 'k' }),
      {
        findAgentByApiKeyHash: vi.fn(),
        createAgent: vi.fn(),
      },
    )
    expect(res.status).toBe(404)
  })

  it('redirects with validation error when name is missing', async () => {
    const deps: DevRegisterAgentDeps = {
      findAgentByApiKeyHash: vi.fn(),
      createAgent: vi.fn(),
    }
    const res = await handleDevRegisterAgentPost(makeFormRequest({ name: '', apiKey: 'secret' }), deps)
    expect(res.status).toBe(303)
    expect(res.headers.get('Location')).toContain('error=validation')
    expect(deps.createAgent).not.toHaveBeenCalled()
  })

  it('redirects with duplicate when hash exists', async () => {
    const hash = hashApiKey('same-key')
    const deps: DevRegisterAgentDeps = {
      findAgentByApiKeyHash: vi.fn(async (h) => (h === hash ? { id: 'existing' } : null)),
      createAgent: vi.fn(),
    }
    const res = await handleDevRegisterAgentPost(
      makeFormRequest({ name: 'New', apiKey: 'same-key' }),
      deps,
    )
    expect(res.status).toBe(303)
    expect(res.headers.get('Location')).toContain('error=duplicate_api_key')
    expect(deps.createAgent).not.toHaveBeenCalled()
  })

  it('creates agent and redirects with created id', async () => {
    const deps: DevRegisterAgentDeps = {
      findAgentByApiKeyHash: vi.fn(async () => null),
      createAgent: vi.fn(async () => ({ id: 'agent-new' })),
    }
    const res = await handleDevRegisterAgentPost(
      makeFormRequest({ name: 'Pi', apiKey: 'my-key', locationLabel: 'Garage' }),
      deps,
    )
    expect(res.status).toBe(303)
    expect(res.headers.get('Location')).toContain('created=agent-new')
    expect(deps.createAgent).toHaveBeenCalledWith({
      name: 'Pi',
      apiKeyHash: hashApiKey('my-key'),
      locationLabel: 'Garage',
    })
  })

  it('passes null location when optional empty', async () => {
    const deps: DevRegisterAgentDeps = {
      findAgentByApiKeyHash: vi.fn(async () => null),
      createAgent: vi.fn(async () => ({ id: 'a' })),
    }
    await handleDevRegisterAgentPost(makeFormRequest({ name: 'Pi', apiKey: 'k' }), deps)
    expect(deps.createAgent).toHaveBeenCalledWith({
      name: 'Pi',
      apiKeyHash: hashApiKey('k'),
      locationLabel: null,
    })
  })
})
