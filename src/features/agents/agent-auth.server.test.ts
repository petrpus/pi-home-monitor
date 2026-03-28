import { describe, expect, it } from 'vitest'
import { AgentStatus } from '../../../generated/prisma/client'
import {
  authenticateAgentByApiKey,
  hashApiKey,
  normalizeApiKey,
  verifyApiKey,
} from './agent-auth.server'

describe('agent auth helper', () => {
  it('normalizes and hashes api keys deterministically', () => {
    const key = '  my-secret-key  '
    expect(normalizeApiKey(key)).toBe('my-secret-key')
    expect(hashApiKey(key)).toBe(hashApiKey('my-secret-key'))
  })

  it('verifies matching and rejects non-matching hashes', () => {
    const key = 'agent-key'
    const hash = hashApiKey(key)
    expect(verifyApiKey(key, hash)).toBe(true)
    expect(verifyApiKey('different-key', hash)).toBe(false)
  })

  it('verifyApiKey returns false when stored hash length differs (no throw)', () => {
    expect(verifyApiKey('agent-key', 'tooshort')).toBe(false)
  })

  it('returns null when DB finds no agent for hashed key', async () => {
    const key = 'orphan-key'
    let called = false
    const db = {
      agent: {
        findFirst: async () => {
          called = true
          return null
        },
      },
    }

    const agent = await authenticateAgentByApiKey(key, db)
    expect(agent).toBeNull()
    expect(called).toBe(true)
  })

  it('authenticates by hashed key and excludes disabled agents', async () => {
    const key = 'agent-key'
    const hash = hashApiKey(key)
    const db = {
      agent: {
        findFirst: async ({
          where,
        }: {
          where: { apiKeyHash: string; status: { not: typeof AgentStatus.DISABLED } }
        }) => {
          if (where.apiKeyHash !== hash) {
            return null
          }

          return {
            id: 'agent-1',
            name: 'Agent 1',
            apiKeyHash: hash,
            locationLabel: null,
            status: AgentStatus.ONLINE,
            lastSeenAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        },
      },
    }

    const agent = await authenticateAgentByApiKey(key, db)
    expect(agent?.id).toBe('agent-1')
  })

  it('returns null for blank api key input', async () => {
    const db = {
      agent: {
        findFirst: async () => {
          throw new Error('should not be called for blank api key')
        },
      },
    }

    const agent = await authenticateAgentByApiKey('   ', db)
    expect(agent).toBeNull()
  })
})
