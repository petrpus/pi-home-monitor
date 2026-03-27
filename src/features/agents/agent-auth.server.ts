import { createHash, timingSafeEqual } from 'node:crypto'
import { AgentStatus, type Agent } from '../../../generated/prisma/client'
import { getPrismaClient } from '#/lib/prisma.server'

type AgentAuthDb = {
  agent: {
    findFirst: (args: {
      where: {
        apiKeyHash: string
        status: { not: typeof AgentStatus.DISABLED }
      }
    }) => Promise<Agent | null>
  }
}

export function normalizeApiKey(rawApiKey: string): string {
  return rawApiKey.trim()
}

export function hashApiKey(rawApiKey: string): string {
  const normalizedApiKey = normalizeApiKey(rawApiKey)
  return createHash('sha256').update(normalizedApiKey).digest('hex')
}

export function verifyApiKey(rawApiKey: string, storedApiKeyHash: string): boolean {
  const incomingHash = hashApiKey(rawApiKey)
  const incomingBuffer = Buffer.from(incomingHash, 'utf8')
  const storedBuffer = Buffer.from(storedApiKeyHash, 'utf8')

  if (incomingBuffer.length !== storedBuffer.length) {
    return false
  }

  return timingSafeEqual(incomingBuffer, storedBuffer)
}

export async function authenticateAgentByApiKey(
  rawApiKey: string,
  db?: AgentAuthDb,
): Promise<Agent | null> {
  const normalizedApiKey = normalizeApiKey(rawApiKey)
  if (!normalizedApiKey) {
    return null
  }

  const apiKeyHash = hashApiKey(normalizedApiKey)

  const authDb = db ?? (getPrismaClient() as unknown as AgentAuthDb)

  return authDb.agent.findFirst({
    where: {
      apiKeyHash,
      status: { not: AgentStatus.DISABLED },
    },
  })
}
