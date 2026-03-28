import { createServerFn } from '@tanstack/react-start'
import { assertAdminSession } from '#/features/auth/sessionAdmin.server'
import { getPrismaClient } from '#/lib/prismaDb'
import { reportCalendarInputSchema, dayMapDataInputSchema } from './day-map.schema'
import { deviceRowLabel, deviceKindLabel } from './day-map.labels'
import { dedupePresence } from './day-map.presence'

/** Prisma/pg driver may return a single row object instead of a 1-element array. */
function asRowArray<T extends object>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[]
  if (raw != null && typeof raw === 'object') return [raw as T]
  return []
}

async function isPgTimeZone(prisma: ReturnType<typeof getPrismaClient>, tz: string): Promise<boolean> {
  const rows = await prisma.$queryRawUnsafe<unknown>(
    'SELECT 1 AS ok FROM pg_timezone_names WHERE name = $1 LIMIT 1',
    tz,
  )
  return asRowArray<{ ok?: number }>(rows).length > 0
}

export const listAgentsForDayMapFn = createServerFn({ method: 'GET' }).handler(async () => {
  await assertAdminSession()
  const prisma = getPrismaClient()
  const agents = await prisma.agent.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })
  return { ok: true as const, agents }
})

export const getAgentReportCalendarFn = createServerFn({ method: 'POST' })
  .inputValidator((raw: unknown) => reportCalendarInputSchema.parse(raw))
  .handler(async ({ data }) => {
    await assertAdminSession()
    const prisma = getPrismaClient()
    if (!(await isPgTimeZone(prisma, data.timeZone))) {
      return { ok: false as const, code: 'BAD_TZ' as const, message: 'Neplatné časové pásmo.', dates: [] as string[] }
    }
    const rows = await prisma.$queryRawUnsafe<{ d: string }>(
      `
      SELECT DISTINCT DATE(timezone($2::text, COALESCE("reportedAt", "receivedAt")))::text AS d
      FROM "RawReport"
      WHERE "agentId" = $1
      ORDER BY d DESC
      LIMIT 500
      `,
      data.agentId,
      data.timeZone,
    )
    const list = asRowArray<{ d: string }>(rows).map((r) => r.d)
    return { ok: true as const, dates: list }
  })

export const getDayMapDataFn = createServerFn({ method: 'POST' })
  .inputValidator((raw: unknown) => dayMapDataInputSchema.parse(raw))
  .handler(async ({ data }) => {
    await assertAdminSession()
    const prisma = getPrismaClient()
    if (!(await isPgTimeZone(prisma, data.timeZone))) {
      return {
        ok: false as const,
        code: 'BAD_TZ' as const,
        message: 'Neplatné časové pásmo.',
        reports: [] as { id: string; at: string }[],
        devices: [] as { id: string; label: string; kind: string }[],
        presence: [] as string[],
      }
    }
    const reportRows = await prisma.$queryRawUnsafe<{ id: string; at: Date }>(
      `
      SELECT r.id, COALESCE(r."reportedAt", r."receivedAt") AS at
      FROM "RawReport" r
      WHERE r."agentId" = $1
      AND COALESCE(r."reportedAt", r."receivedAt") >= ($2::date AT TIME ZONE $3::text)
      AND COALESCE(r."reportedAt", r."receivedAt") < (($2::date + interval '1 day') AT TIME ZONE $3::text)
      ORDER BY at ASC
      `,
      data.agentId,
      data.date,
      data.timeZone,
    )
    const reports = asRowArray<{ id: string; at: Date }>(reportRows)
    if (reports.length === 0) {
      return {
        ok: true as const,
        reports: [] as { id: string; at: string }[],
        devices: [] as { id: string; label: string; kind: string }[],
        presence: [] as string[],
      }
    }
    const ids = reports.map((r) => r.id)
    const observations = await prisma.observation.findMany({
      where: { rawReportId: { in: ids } },
      select: { deviceId: true, rawReportId: true },
    })
    const deviceIds = [...new Set(observations.map((o) => o.deviceId))]
    const devices = await prisma.device.findMany({
      where: { id: { in: deviceIds } },
      select: { id: true, normalizedName: true, primaryMac: true, kind: true },
    })
    const deviceRows = devices.map((d) => ({
      id: d.id,
      label: deviceRowLabel(d),
      kind: deviceKindLabel(d.kind),
    }))
    deviceRows.sort((a, b) => a.label.localeCompare(b.label, 'cs'))
    const presence = dedupePresence(observations)
    return {
      ok: true as const,
      reports: reports.map((r) => ({ id: r.id, at: r.at.toISOString() })),
      devices: deviceRows,
      presence,
    }
  })
