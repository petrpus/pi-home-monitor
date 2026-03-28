import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../../generated/prisma/client'

const globalForPrisma = globalThis as unknown as { prismaClient?: PrismaClient }

export function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prismaClient) {
    return globalForPrisma.prismaClient
  }

  const datasourceUrl = process.env.DATABASE_URL
  if (!datasourceUrl) {
    throw new Error('DATABASE_URL is required to initialize PrismaClient')
  }

  const adapter = new PrismaPg({ connectionString: datasourceUrl })
  const prismaClient = new PrismaClient({ adapter })

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prismaClient = prismaClient
  }

  return prismaClient
}
