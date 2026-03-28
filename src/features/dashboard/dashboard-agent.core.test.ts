import { describe, expect, it, vi } from 'vitest'
import {
  AgentStatus,
  AlertSeverity,
  AlertType,
  DeviceKind,
} from '../../../generated/prisma/client'
import { dashboardAgentAlertsPreview, dashboardAgentOverview } from './dashboard-agent.core'

describe('dashboardAgentAlertsPreview', () => {
  it('returns NOT_FOUND when agent does not exist', async () => {
    const prisma = {
      agent: { findUnique: vi.fn().mockResolvedValue(null) },
    } as never

    const out = await dashboardAgentAlertsPreview(prisma, 'missing')

    expect(out).toMatchObject({ ok: false, code: 'NOT_FOUND' })
  })

  it('returns up to 5 unresolved alerts and total count', async () => {
    const findMany = vi.fn().mockResolvedValue([
      {
        id: 'a1',
        title: 't',
        message: 'm',
        severity: AlertSeverity.INFO,
        type: AlertType.NEW_DEVICE,
        createdAt: new Date(),
      },
    ])
    const count = vi.fn().mockResolvedValue(7)
    const prisma = {
      agent: { findUnique: vi.fn().mockResolvedValue({ id: 'ag1' }) },
      alert: { findMany, count },
    } as never

    const out = await dashboardAgentAlertsPreview(prisma, 'ag1')

    expect(out).toMatchObject({ ok: true, totalUnresolved: 7 })
    if (out.ok !== true) throw new Error('expected ok')
    expect(out.alerts).toHaveLength(1)
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { agentId: 'ag1', isResolved: false },
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
    )
    expect(count).toHaveBeenCalledWith({ where: { agentId: 'ag1', isResolved: false } })
  })
})

describe('dashboardAgentOverview', () => {
  it('returns NOT_FOUND when agent does not exist', async () => {
    const prisma = {
      agent: { findUnique: vi.fn().mockResolvedValue(null) },
    } as never

    const out = await dashboardAgentOverview(prisma, 'x')

    expect(out).toMatchObject({ ok: false, code: 'NOT_FOUND' })
  })

  it('returns empty connected devices when agent has no reports', async () => {
    const agent = {
      id: 'ag1',
      name: 'Hub',
      status: AgentStatus.ONLINE,
      lastSeenAt: null,
      locationLabel: null,
    }
    const prisma = {
      agent: {
        findUnique: vi.fn().mockResolvedValue(agent),
      },
      device: { count: vi.fn().mockResolvedValue(3) },
      rawReport: { findFirst: vi.fn().mockResolvedValue(null) },
    } as never

    const out = await dashboardAgentOverview(prisma, 'ag1')

    expect(out).toMatchObject({
      ok: true,
      agent,
      lastReport: null,
      totalIdentifiedDevices: 3,
      connectedDevices: [],
    })
  })

  it('dedupes observations by device and sorts labels with cs locale', async () => {
    const agent = {
      id: 'ag1',
      name: 'Hub',
      status: AgentStatus.ONLINE,
      lastSeenAt: null,
      locationLabel: null,
    }
    const lastReportRow = {
      id: 'rr1',
      receivedAt: new Date('2026-01-02'),
      reportedAt: new Date('2026-01-01'),
    }
    const findUnique = vi.fn().mockResolvedValue(agent)
    const findManyObs = vi.fn().mockResolvedValue([
      {
        ipAddress: null,
        macAddress: null,
        rssi: null,
        device: {
          id: 'd1',
          kind: DeviceKind.NETWORK,
          normalizedName: 'Beta',
          primaryMac: null,
          lastIpAddress: null,
          lastRssi: null,
        },
      },
      {
        ipAddress: null,
        macAddress: null,
        rssi: null,
        device: {
          id: 'd1',
          kind: DeviceKind.NETWORK,
          normalizedName: 'Beta',
          primaryMac: null,
          lastIpAddress: null,
          lastRssi: null,
        },
      },
      {
        ipAddress: null,
        macAddress: null,
        rssi: null,
        device: {
          id: 'd2',
          kind: DeviceKind.BLE,
          normalizedName: 'Álpha',
          primaryMac: 'AA:BB:CC:DD:EE:01',
          lastIpAddress: null,
          lastRssi: null,
        },
      },
    ])
    const prisma = {
      agent: { findUnique },
      device: { count: vi.fn().mockResolvedValue(2) },
      rawReport: { findFirst: vi.fn().mockResolvedValue(lastReportRow) },
      observation: { findMany: findManyObs },
    } as never

    const out = await dashboardAgentOverview(prisma, 'ag1')

    expect(out.ok).toBe(true)
    if (out.ok !== true || !out.lastReport) throw new Error('expected ok with lastReport')
    expect(out.lastReport.connectedCount).toBe(2)
    expect(out.connectedDevices.map((c) => c.label)).toEqual(['Álpha', 'Beta'])
  })
})
