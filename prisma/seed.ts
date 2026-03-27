import 'dotenv/config'
import { createHash } from 'node:crypto'
import { PrismaPg } from '@prisma/adapter-pg'
import { AgentStatus, PrismaClient } from '../generated/prisma/client'

const DEV_AGENT_NAME = 'Dev Raspberry Pi Agent'
const DEV_AGENT_LOCATION = 'Local dev'
const DEV_AGENT_API_KEY = 'dev-local-agent-key'
const DEV_AGENT_ID = 'dev-local-agent'

function hashApiKey(rawApiKey: string): string {
  return createHash('sha256').update(rawApiKey.trim()).digest('hex')
}

async function main() {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error('DATABASE_URL is required')
  }

  const adapter = new PrismaPg({ connectionString })
  const prisma = new PrismaClient({ adapter })

  const apiKeyHash = hashApiKey(DEV_AGENT_API_KEY)

  const agentById = await prisma.agent.findUnique({
    where: { id: DEV_AGENT_ID },
  })

  let agent

  if (agentById) {
    agent = await prisma.agent.update({
      where: { id: DEV_AGENT_ID },
      data: {
        name: DEV_AGENT_NAME,
        locationLabel: DEV_AGENT_LOCATION,
        status: AgentStatus.ONLINE,
        apiKeyHash,
      },
    })
  } else {
    const agentByApiKeyHash = await prisma.agent.findUnique({
      where: { apiKeyHash },
    })

    if (agentByApiKeyHash) {
      agent = await prisma.agent.update({
        where: { id: agentByApiKeyHash.id },
        data: {
          id: DEV_AGENT_ID,
          name: DEV_AGENT_NAME,
          locationLabel: DEV_AGENT_LOCATION,
          status: AgentStatus.ONLINE,
        },
      })
    } else {
      agent = await prisma.agent.create({
        data: {
          id: DEV_AGENT_ID,
          name: DEV_AGENT_NAME,
          locationLabel: DEV_AGENT_LOCATION,
          status: AgentStatus.ONLINE,
          apiKeyHash,
        },
      })
    }
  }

  console.log('Seeded dev agent')
  console.log(`agentId=${agent.id}`)
  console.log(`apiKey=${DEV_AGENT_API_KEY}`)

  await prisma.$disconnect()
}

main().catch((error) => {
  console.error('Seeding failed', error)
  process.exit(1)
})
