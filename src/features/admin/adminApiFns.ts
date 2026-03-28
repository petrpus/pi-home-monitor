import { createServerFn } from '@tanstack/react-start'
import { listQuerySchema, mutateBodySchema } from './admin-types'

function newOpId(): string {
  return crypto.randomUUID()
}

async function guardAdmin(): Promise<
  { ok: true } | { ok: false; operationId: string; code: string; message: string }
> {
  const operationId = newOpId()
  const sessionMod = await import('#/features/auth/sessionAdmin.server')
  try {
    await sessionMod.assertAdminSession()
    return { ok: true }
  } catch (e) {
    if (e instanceof sessionMod.AdminAuthError) {
      return { ok: false, operationId, code: e.code, message: 'Neautorizováno' }
    }
    throw e
  }
}

export const getDashboardStatsFn = createServerFn({ method: 'GET' }).handler(async () => {
  const sessionMod = await import('#/features/auth/sessionAdmin.server')
  await sessionMod.assertAdminSession()
  const { getPrismaClient } = await import('#/lib/prismaDb')
  const prisma = getPrismaClient()
  const operationId = newOpId()
  const dayAgo = new Date(Date.now() - 864e5)
  const [agents, devices, openAlerts, reportsLast24h] = await Promise.all([
    prisma.agent.count(),
    prisma.device.count(),
    prisma.alert.count({ where: { isResolved: false } }),
    prisma.rawReport.count({ where: { receivedAt: { gte: dayAgo } } }),
  ])
  return {
    ok: true as const,
    operationId,
    agents,
    devices,
    openAlerts,
    reportsLast24h,
  }
})

export const adminListFn = createServerFn({ method: 'POST' })
  .inputValidator((raw: unknown) => listQuerySchema.parse(raw))
  .handler(async ({ data }) => {
    const g = await guardAdmin()
    if (!g.ok) {
      return {
        ...g,
        rows: [] as object[],
        total: 0,
        page: 1,
        pageSize: data.pageSize,
      }
    }
    const operationId = newOpId()
    try {
      const { adminList } = await import("./admin-crud.service")
      const list = await adminList(data)
      return {
        ok: true as const,
        operationId,
        rows: list.rows as object[],
        total: list.total,
        page: list.page,
        pageSize: list.pageSize,
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Neznámá chyba'
      return {
        ok: false as const,
        operationId,
        code: 'LIST_ERROR',
        message: msg,
        rows: [] as object[],
        total: 0,
        page: data.page,
        pageSize: data.pageSize,
      }
    }
  })

export const adminMutateFn = createServerFn({ method: 'POST' })
  .inputValidator((raw: unknown) => mutateBodySchema.parse(raw))
  .handler(async ({ data }) => {
    const g = await guardAdmin()
    if (!g.ok) {
      return { ...g, result: null, clientOperationId: data.clientOperationId }
    }
    const operationId = newOpId()
    try {
      const { adminMutate } = await import("./admin-crud.service")
      const out = await adminMutate(data)
      if ('error' in out) {
        return {
          ok: false as const,
          operationId,
          code: out.error,
          message: out.detail ?? out.error,
          result: null,
          clientOperationId: data.clientOperationId,
        }
      }
      return {
        ok: true as const,
        operationId,
        result: out.result as object,
        clientOperationId: data.clientOperationId,
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Neznámá chyba'
      return {
        ok: false as const,
        operationId,
        code: 'MUTATE_ERROR',
        message: msg,
        result: null,
        clientOperationId: data.clientOperationId,
      }
    }
  })
