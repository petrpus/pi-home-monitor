import * as z from 'zod'
import { AgentStatus, Prisma } from '../../../generated/prisma/client'
import { agentReportFreshnessThreshold } from '#/features/agents/agent-activity'
import { hashApiKey } from '#/features/agents/agent-auth.server'
import { getPrismaClient } from '#/lib/prismaDb'
import type { AdminResourceKey, ListQuery, MutateBody } from './admin-types'

const MAX_BULK = 100

function buildOrderBy<T extends string>(
  sortBy: string | undefined,
  sortDir: 'asc' | 'desc',
  allowed: readonly T[],
  fallbackField: T,
  fallbackDir: 'asc' | 'desc',
): Record<string, 'asc' | 'desc'> {
  const field = (sortBy && allowed.includes(sortBy as T) ? sortBy : fallbackField) as T
  const dir = sortBy && allowed.includes(sortBy as T) ? sortDir : fallbackDir
  return { [field]: dir }
}

function alertListOrderBy(
  sortBy: string | undefined,
  sortDir: 'asc' | 'desc',
): Prisma.AlertOrderByWithRelationInput {
  if (sortBy === 'agentName') {
    return { agent: { name: sortDir } }
  }
  return buildOrderBy(
    sortBy,
    sortDir,
    ['createdAt', 'type', 'severity', 'isResolved'] as const,
    'createdAt',
    'desc',
  )
}

/**
 * Shared Prisma where + equivalent SQL fragments for agent admin list (kept in sync for raw ORDER BY).
 * UI “Stav” sorts by activity presence (see `getAgentActivityPresence`), not raw `status` enum alone.
 */
function agentAdminListWhereAndSql(
  q: ListQuery,
  staleBefore: Date,
): { where: Prisma.AgentWhereInput; sqlFragments: Prisma.Sql[] } {
  const and: Prisma.AgentWhereInput[] = []
  const sqlFragments: Prisma.Sql[] = []

  if (q.filters?.agentStatus && q.filters.agentStatus !== 'all') {
    if (q.filters.agentStatus === 'DISABLED') {
      and.push({ status: AgentStatus.DISABLED })
      sqlFragments.push(Prisma.sql`status = ${AgentStatus.DISABLED}`)
    } else if (q.filters.agentStatus === 'ONLINE') {
      and.push({
        status: { not: AgentStatus.DISABLED },
        lastSeenAt: { gte: staleBefore },
      })
      sqlFragments.push(
        Prisma.sql`(status <> ${AgentStatus.DISABLED} AND "lastSeenAt" >= ${staleBefore})`,
      )
    } else if (q.filters.agentStatus === 'OFFLINE') {
      and.push({
        status: { not: AgentStatus.DISABLED },
        OR: [{ lastSeenAt: null }, { lastSeenAt: { lt: staleBefore } }],
      })
      sqlFragments.push(
        Prisma.sql`(status <> ${AgentStatus.DISABLED} AND ("lastSeenAt" IS NULL OR "lastSeenAt" < ${staleBefore}))`,
      )
    }
  }

  const term = q.search?.trim()
  if (term) {
    and.push({
      OR: [
        { name: { contains: term, mode: 'insensitive' } },
        { locationLabel: { contains: term, mode: 'insensitive' } },
      ],
    })
    const pattern = `%${term}%`
    sqlFragments.push(Prisma.sql`(name ILIKE ${pattern} OR "locationLabel" ILIKE ${pattern})`)
  }

  return {
    where: and.length ? { AND: and } : {},
    sqlFragments,
  }
}

function rawReportListOrderBy(
  sortBy: string | undefined,
  sortDir: 'asc' | 'desc',
): Prisma.RawReportOrderByWithRelationInput {
  if (sortBy === 'agentName') {
    return { agent: { name: sortDir } }
  }
  if (sortBy === 'deviceCount') {
    return { observations: { _count: sortDir } }
  }
  return buildOrderBy(
    sortBy,
    sortDir,
    ['receivedAt', 'reportedAt'] as const,
    'receivedAt',
    'desc',
  )
}

export async function adminList(q: ListQuery): Promise<{
  rows: unknown[]
  total: number
  page: number
  pageSize: number
}> {
  const prisma = getPrismaClient()
  const skip = (q.page - 1) * q.pageSize
  const take = q.pageSize

  switch (q.resource) {
    case 'alerts': {
      const where: Prisma.AlertWhereInput = {}
      if (q.filters?.isResolved === 'yes') where.isResolved = true
      if (q.filters?.isResolved === 'no') where.isResolved = false
      const term = q.search?.trim()
      if (term) {
        where.OR = [
          { title: { contains: term, mode: 'insensitive' } },
          { message: { contains: term, mode: 'insensitive' } },
          { agent: { name: { contains: term, mode: 'insensitive' } } },
        ]
      }
      const orderBy = alertListOrderBy(q.sortBy, q.sortDir)
      const [rawRows, total] = await Promise.all([
        prisma.alert.findMany({
          where,
          orderBy,
          skip,
          take,
          select: {
            id: true,
            type: true,
            severity: true,
            message: true,
            isResolved: true,
            createdAt: true,
            agent: { select: { name: true } },
          },
        }),
        prisma.alert.count({ where }),
      ])
      const rows = rawRows.map((r) => ({
        id: r.id,
        agentName: r.agent?.name ?? null,
        type: r.type,
        severity: r.severity,
        message: r.message,
        isResolved: r.isResolved,
        createdAt: r.createdAt,
      }))
      return { rows, total, page: q.page, pageSize: q.pageSize }
    }
    case 'agents': {
      const staleBefore = agentReportFreshnessThreshold()
      const { where, sqlFragments } = agentAdminListWhereAndSql(q, staleBefore)
      const select = {
        id: true,
        name: true,
        locationLabel: true,
        status: true,
        lastSeenAt: true,
      } satisfies Prisma.AgentSelect

      if (q.sortBy === 'status') {
        type AgentListRow = {
          id: string
          name: string
          locationLabel: string | null
          status: string
          lastSeenAt: Date | null
        }
        const whereClause =
          sqlFragments.length > 0
            ? Prisma.sql`WHERE ${Prisma.join(sqlFragments, ' AND ')}`
            : Prisma.empty
        const presenceOrder =
          q.sortDir === 'asc'
            ? Prisma.sql`ORDER BY (CASE WHEN status = ${AgentStatus.DISABLED} THEN 2 WHEN "lastSeenAt" IS NULL OR "lastSeenAt" < ${staleBefore} THEN 1 ELSE 0 END) ASC, name ASC`
            : Prisma.sql`ORDER BY (CASE WHEN status = ${AgentStatus.DISABLED} THEN 2 WHEN "lastSeenAt" IS NULL OR "lastSeenAt" < ${staleBefore} THEN 1 ELSE 0 END) DESC, name ASC`
        const [rows, total] = await Promise.all([
          prisma.$queryRaw<AgentListRow[]>`
            SELECT id, name, "locationLabel", status, "lastSeenAt"
            FROM "Agent"
            ${whereClause}
            ${presenceOrder}
            OFFSET ${skip} LIMIT ${take}
          `,
          prisma.agent.count({ where }),
        ])
        return { rows, total, page: q.page, pageSize: q.pageSize }
      }

      const orderBy = buildOrderBy(
        q.sortBy,
        q.sortDir,
        ['name', 'status', 'lastSeenAt'] as const,
        'lastSeenAt',
        'desc',
      )
      const [rows, total] = await Promise.all([
        prisma.agent.findMany({ where, orderBy, skip, take, select }),
        prisma.agent.count({ where }),
      ])
      return { rows, total, page: q.page, pageSize: q.pageSize }
    }
    case 'devices': {
      const where: Prisma.DeviceWhereInput = {}
      if (q.filters?.deviceKind && q.filters.deviceKind !== 'all') {
        where.kind = q.filters.deviceKind
      }
      if (q.filters?.deviceAgentId) {
        where.observations = { some: { agentId: q.filters.deviceAgentId } }
      }
      const term = q.search?.trim()
      if (term) {
        where.OR = [
          { primaryMac: { contains: term, mode: 'insensitive' } },
          { normalizedName: { contains: term, mode: 'insensitive' } },
          { vendor: { contains: term, mode: 'insensitive' } },
          { lastIpAddress: { contains: term, mode: 'insensitive' } },
        ]
      }
      const orderBy = buildOrderBy(
        q.sortBy,
        q.sortDir,
        [
          'createdAt',
          'lastSeenAt',
          'kind',
          'primaryMac',
          'lastIpAddress',
          'lastRssi',
          'normalizedName',
        ] as const,
        'lastSeenAt',
        'desc',
      )
      const deviceSelect = {
        id: true,
        kind: true,
        primaryMac: true,
        normalizedName: true,
        nameUserSet: true,
        vendor: true,
        lastIpAddress: true,
        lastRssi: true,
        firstSeenAt: true,
        lastSeenAt: true,
        createdAt: true,
        updatedAt: true,
      } satisfies Prisma.DeviceSelect
      const [rows, total] = await Promise.all([
        prisma.device.findMany({ where, orderBy, skip, take, select: deviceSelect }),
        prisma.device.count({ where }),
      ])
      return { rows, total, page: q.page, pageSize: q.pageSize }
    }
    case 'rawReports': {
      const where: Prisma.RawReportWhereInput = {}
      const term = q.search?.trim()
      if (term) {
        where.OR = [
          { id: { contains: term } },
          { agent: { name: { contains: term, mode: 'insensitive' } } },
        ]
      }
      const orderBy = rawReportListOrderBy(q.sortBy, q.sortDir)
      const [rawRows, total] = await Promise.all([
        prisma.rawReport.findMany({
          where,
          orderBy,
          skip,
          take,
          select: {
            id: true,
            receivedAt: true,
            reportedAt: true,
            agent: { select: { name: true } },
            _count: { select: { observations: true } },
          },
        }),
        prisma.rawReport.count({ where }),
      ])
      const rows = rawRows.map((r) => ({
        id: r.id,
        agentName: r.agent.name,
        deviceCount: r._count.observations,
        receivedAt: r.receivedAt,
        reportedAt: r.reportedAt,
      }))
      return { rows, total, page: q.page, pageSize: q.pageSize }
    }
    default: {
      const _exhaustive: never = q.resource
      throw new Error(`Unsupported resource: ${_exhaustive}`)
    }
  }
}

const alertUpdateSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  message: z.string().max(5000).optional().nullable(),
  isResolved: z.boolean().optional(),
})

const agentCreateSchema = z.object({
  name: z.string().min(1).max(200),
  apiKey: z.string().min(8).max(500),
  locationLabel: z.string().max(500).optional().nullable(),
})

const agentUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  locationLabel: z.string().max(500).optional().nullable(),
  status: z.enum([AgentStatus.ONLINE, AgentStatus.OFFLINE, AgentStatus.DISABLED]).optional(),
})

const deviceUpdateSchema = z.object({
  normalizedName: z.string().max(500).optional().nullable(),
  vendor: z.string().max(500).optional().nullable(),
})

function assertMutableResource(
  resource: AdminResourceKey,
  op: string,
  allowed: readonly AdminResourceKey[],
) {
  if (!allowed.includes(resource)) {
    throw new Error(`${op} not allowed for resource ${resource}`)
  }
}

export async function adminMutate(
  body: MutateBody,
): Promise<{ result: unknown } | { error: string; detail?: string }> {
  const prisma = getPrismaClient()

  switch (body.operation) {
    case 'create': {
      switch (body.resource) {
        case 'agents': {
          const parsed = agentCreateSchema.safeParse(body.payload)
          if (!parsed.success) {
            return { error: 'validation', detail: parsed.error.message }
          }
          const apiKeyHash = hashApiKey(parsed.data.apiKey)
          const dup = await prisma.agent.findUnique({ where: { apiKeyHash }, select: { id: true } })
          if (dup) {
            return { error: 'duplicate_api_key' }
          }
          const row = await prisma.agent.create({
            data: {
              name: parsed.data.name,
              apiKeyHash,
              locationLabel: parsed.data.locationLabel ?? null,
            },
            select: {
              id: true,
              name: true,
              locationLabel: true,
              status: true,
              lastSeenAt: true,
            },
          })
          return { result: row }
        }
        default:
          assertMutableResource(body.resource, 'create', ['agents'])
          return { error: 'unsupported' }
      }
    }
    case 'update': {
      switch (body.resource) {
        case 'alerts': {
          const parsed = alertUpdateSchema.safeParse(body.payload)
          if (!parsed.success) {
            return { error: 'validation', detail: parsed.error.message }
          }
          const data: Prisma.AlertUpdateInput = { ...parsed.data }
          if (parsed.data.isResolved === true) {
            data.resolvedAt = new Date()
          }
          if (parsed.data.isResolved === false) {
            data.resolvedAt = null
          }
          const row = await prisma.alert.update({ where: { id: body.id }, data })
          return { result: row }
        }
        case 'agents': {
          const parsed = agentUpdateSchema.safeParse(body.payload)
          if (!parsed.success) {
            return { error: 'validation', detail: parsed.error.message }
          }
          const row = await prisma.agent.update({
            where: { id: body.id },
            data: parsed.data,
            select: {
              id: true,
              name: true,
              locationLabel: true,
              status: true,
              lastSeenAt: true,
            },
          })
          return { result: row }
        }
        case 'devices': {
          const parsed = deviceUpdateSchema.safeParse(body.payload)
          if (!parsed.success) {
            return { error: 'validation', detail: parsed.error.message }
          }
          const data: Prisma.DeviceUpdateInput = {}
          if (parsed.data.vendor !== undefined) {
            data.vendor = parsed.data.vendor
          }
          if (parsed.data.normalizedName !== undefined) {
            const trimmed = parsed.data.normalizedName?.trim()
            data.normalizedName = trimmed && trimmed.length > 0 ? trimmed : null
            data.nameUserSet = Boolean(trimmed && trimmed.length > 0)
          }
          const row = await prisma.device.update({
            where: { id: body.id },
            data,
          })
          return { result: row }
        }
        default:
          assertMutableResource(body.resource, 'update', ['alerts', 'agents', 'devices'])
          return { error: 'unsupported' }
      }
    }
    case 'delete': {
      assertMutableResource(body.resource, 'delete', ['alerts', 'agents', 'devices', 'rawReports'])
      switch (body.resource) {
        case 'alerts': {
          await prisma.alert.delete({ where: { id: body.id } })
          return { result: { id: body.id } }
        }
        case 'agents': {
          await prisma.agent.delete({ where: { id: body.id } })
          return { result: { id: body.id } }
        }
        case 'devices': {
          await prisma.device.delete({ where: { id: body.id } })
          return { result: { id: body.id } }
        }
        case 'rawReports': {
          await prisma.rawReport.delete({ where: { id: body.id } })
          return { result: { id: body.id } }
        }
        default:
          return { error: 'unsupported' }
      }
    }
    case 'bulkDelete': {
      if (body.ids.length > MAX_BULK) {
        return { error: 'validation', detail: `Max ${MAX_BULK} ids` }
      }
      assertMutableResource(body.resource, 'bulkDelete', ['alerts', 'agents', 'devices', 'rawReports'])
      switch (body.resource) {
        case 'alerts': {
          const res = await prisma.alert.deleteMany({ where: { id: { in: body.ids } } })
          return { result: { deleted: res.count } }
        }
        case 'agents': {
          const res = await prisma.agent.deleteMany({ where: { id: { in: body.ids } } })
          return { result: { deleted: res.count } }
        }
        case 'devices': {
          const res = await prisma.device.deleteMany({ where: { id: { in: body.ids } } })
          return { result: { deleted: res.count } }
        }
        case 'rawReports': {
          const res = await prisma.rawReport.deleteMany({ where: { id: { in: body.ids } } })
          return { result: { deleted: res.count } }
        }
        default:
          return { error: 'unsupported' }
      }
    }
    case 'bulkResolve': {
      if (body.ids.length > MAX_BULK) {
        return { error: 'validation', detail: `Max ${MAX_BULK} ids` }
      }
      if (body.resource !== 'alerts') {
        return { error: 'unsupported' }
      }
      const res = await prisma.alert.updateMany({
        where: { id: { in: body.ids }, isResolved: false },
        data: { isResolved: true, resolvedAt: new Date() },
      })
      return { result: { resolved: res.count } }
    }
    default: {
      const _e: never = body
      throw new Error(`Unsupported operation: ${_e}`)
    }
  }
}
