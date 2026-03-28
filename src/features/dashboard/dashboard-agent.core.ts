import type { PrismaClient } from '../../../generated/prisma/client'
import { deviceRowLabel } from '#/features/analytics/day-map/day-map.labels'

export async function dashboardAgentAlertsPreview(prisma: PrismaClient, agentId: string) {
  const agentExists = await prisma.agent.findUnique({
    where: { id: agentId },
    select: { id: true },
  })
  if (!agentExists) {
    return { ok: false as const, code: 'NOT_FOUND' as const, message: 'Agent nebyl nalezen.' }
  }

  const where = { agentId, isResolved: false as const }

  const [alerts, totalUnresolved] = await Promise.all([
    prisma.alert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        message: true,
        severity: true,
        type: true,
        createdAt: true,
      },
    }),
    prisma.alert.count({ where }),
  ])

  return {
    ok: true as const,
    alerts,
    totalUnresolved,
  }
}

type ConnectedDeviceRow = {
  deviceId: string
  label: string
  kind: string
  ipAddress: string | null
  rssi: number | null
  macAddress: string | null
}

export async function dashboardAgentOverview(prisma: PrismaClient, agentId: string) {
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    select: {
      id: true,
      name: true,
      status: true,
      lastSeenAt: true,
      locationLabel: true,
    },
  })

  if (!agent) {
    return { ok: false as const, code: 'NOT_FOUND' as const, message: 'Agent nebyl nalezen.' }
  }

  const [totalIdentifiedDevices, lastReportRow] = await Promise.all([
    prisma.device.count({
      where: { observations: { some: { agentId } } },
    }),
    prisma.rawReport.findFirst({
      where: { agentId },
      orderBy: { receivedAt: 'desc' },
      select: {
        id: true,
        receivedAt: true,
        reportedAt: true,
      },
    }),
  ])

  if (!lastReportRow) {
    return {
      ok: true as const,
      agent,
      lastReport: null,
      totalIdentifiedDevices,
      connectedDevices: [] as ConnectedDeviceRow[],
    }
  }

  const observations = await prisma.observation.findMany({
    where: { rawReportId: lastReportRow.id },
    select: {
      ipAddress: true,
      macAddress: true,
      rssi: true,
      device: {
        select: {
          id: true,
          kind: true,
          normalizedName: true,
          primaryMac: true,
          lastIpAddress: true,
          lastRssi: true,
        },
      },
    },
  })

  const byDevice = new Map<string, ConnectedDeviceRow>()

  for (const o of observations) {
    const d = o.device
    const label = deviceRowLabel({ normalizedName: d.normalizedName, primaryMac: d.primaryMac })
    const ip = o.ipAddress ?? d.lastIpAddress ?? null
    const rssi = o.rssi ?? d.lastRssi ?? null
    const mac = o.macAddress ?? d.primaryMac ?? null
    byDevice.set(d.id, {
      deviceId: d.id,
      label,
      kind: d.kind,
      ipAddress: ip,
      rssi,
      macAddress: mac,
    })
  }

  const connectedDevices = [...byDevice.values()].sort((a, b) =>
    a.label.localeCompare(b.label, 'cs'),
  )

  return {
    ok: true as const,
    agent,
    lastReport: {
      id: lastReportRow.id,
      receivedAt: lastReportRow.receivedAt,
      reportedAt: lastReportRow.reportedAt,
      connectedCount: connectedDevices.length,
    },
    totalIdentifiedDevices,
    connectedDevices,
  }
}
