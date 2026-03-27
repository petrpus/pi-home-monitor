import { describe, expect, it } from 'vitest'
import { DeviceKind } from '../../../generated/prisma/client'
import { ingestAgentReport, toNormalizedDevices } from './ingest.service'
import type { IngestRequestInput } from './ingest.schema'

describe('toNormalizedDevices', () => {
  it('normalizes mixed network and bluetooth payload', () => {
    const payload: IngestRequestInput = {
      reportedAt: '2026-03-27T10:00:00.000Z',
      payloadVersion: '1',
      networkDevices: [{ macAddress: 'aa:bb:cc:dd:ee:ff', ipAddress: '192.168.1.10' }],
      bluetoothDevices: [{ macAddress: '11:22:33:44:55:66', kind: 'ble' }],
    }

    const normalized = toNormalizedDevices(payload)
    expect(normalized).toHaveLength(2)
    expect(normalized[0].kind).toBe(DeviceKind.NETWORK)
    expect(normalized[0].macAddress).toBe('AA:BB:CC:DD:EE:FF')
    expect(normalized[1].kind).toBe(DeviceKind.BLE)
  })
})

describe('ingestAgentReport', () => {
  it('creates raw report, devices, observations and alerts', async () => {
    const devicesByUnique = new Map<string, { id: string; kind: DeviceKind; primaryMac: string }>()
    const observationCreates: Array<{ rawReportId: string; deviceId: string }> = []
    const alertCreates: Array<{ deviceId: string }> = []
    const agentUpdates: Array<{ id: string }> = []

    const tx = {
      rawReport: {
        create: async () =>
          ({
            id: 'raw-1',
          }) as { id: string },
      },
      device: {
        findUnique: async ({
          where,
        }: {
          where: { kind_primaryMac: { kind: DeviceKind; primaryMac: string } }
        }) => {
          const key = `${where.kind_primaryMac.kind}:${where.kind_primaryMac.primaryMac}`
          return devicesByUnique.get(key) ?? null
        },
        create: async ({
          data,
        }: {
          data: { kind: DeviceKind; primaryMac: string }
        }) => {
          const device = {
            id: `device-${devicesByUnique.size + 1}`,
            kind: data.kind,
            primaryMac: data.primaryMac,
          }
          devicesByUnique.set(`${data.kind}:${data.primaryMac}`, device)
          return device
        },
        update: async ({ where }: { where: { id: string } }) => {
          for (const value of devicesByUnique.values()) {
            if (value.id === where.id) {
              return value
            }
          }

          throw new Error('Device not found')
        },
      },
      observation: {
        create: async ({ data }: { data: { rawReportId: string; deviceId: string } }) => {
          observationCreates.push({ rawReportId: data.rawReportId, deviceId: data.deviceId })
          return {} as { id: string }
        },
      },
      agent: {
        update: async ({ where }: { where: { id: string } }) => {
          agentUpdates.push({ id: where.id })
          return {}
        },
      },
      alert: {
        create: async ({ data }: { data: { deviceId: string } }) => {
          alertCreates.push({ deviceId: data.deviceId })
          return {} as { id: string }
        },
      },
    }

    const db = {
      $transaction: async <T>(fn: (trx: typeof tx) => Promise<T>) => fn(tx),
    }

    const result = await ingestAgentReport(
      {
        agentId: 'agent-1',
        payload: {
          reportedAt: '2026-03-27T10:00:00.000Z',
          payloadVersion: '1',
          networkDevices: [
            { macAddress: 'aa:bb:cc:dd:ee:ff', ipAddress: '192.168.1.10', name: 'Printer' },
            { ipAddress: '192.168.1.11' },
          ],
          bluetoothDevices: [{ macAddress: '11:22:33:44:55:66', name: 'Headphones', kind: 'BLE' }],
        },
      },
      db,
    )

    expect(result.ok).toBe(true)
    expect(result.processed.devicesCreated).toBe(2)
    expect(result.processed.devicesUpdated).toBe(0)
    expect(result.processed.observationsCreated).toBe(2)
    expect(result.processed.skipped).toBe(1)
    expect(alertCreates).toHaveLength(2)
    expect(observationCreates).toHaveLength(2)
    expect(agentUpdates).toEqual([{ id: 'agent-1' }])
  })

  it('updates an existing device and does not create new-device alert', async () => {
    const existingKey = `${DeviceKind.NETWORK}:AA:BB:CC:DD:EE:FF`
    const devicesByUnique = new Map<string, { id: string; kind: DeviceKind; primaryMac: string }>([
      [existingKey, { id: 'device-existing', kind: DeviceKind.NETWORK, primaryMac: 'AA:BB:CC:DD:EE:FF' }],
    ])
    let alertCalls = 0

    const tx = {
      rawReport: { create: async () => ({ id: 'raw-1' }) },
      device: {
        findUnique: async ({
          where,
        }: {
          where: { kind_primaryMac: { kind: DeviceKind; primaryMac: string } }
        }) => devicesByUnique.get(`${where.kind_primaryMac.kind}:${where.kind_primaryMac.primaryMac}`) ?? null,
        create: async () => {
          throw new Error('should not create a new device')
        },
        update: async ({ where }: { where: { id: string } }) => ({ id: where.id }),
      },
      observation: { create: async () => ({ id: 'obs-1' }) },
      agent: { update: async () => ({}) },
      alert: {
        create: async () => {
          alertCalls += 1
          return { id: 'alert-1' }
        },
      },
    }

    const db = {
      $transaction: async <T>(fn: (trx: typeof tx) => Promise<T>) => fn(tx),
    }

    const result = await ingestAgentReport(
      {
        agentId: 'agent-1',
        payload: {
          reportedAt: '2026-03-27T10:00:00.000Z',
          payloadVersion: '1',
          networkDevices: [{ macAddress: 'AA:BB:CC:DD:EE:FF', name: 'Updated name' }],
          bluetoothDevices: [],
        },
      },
      db,
    )

    expect(result.processed.devicesCreated).toBe(0)
    expect(result.processed.devicesUpdated).toBe(1)
    expect(result.processed.alertsCreated).toBe(0)
    expect(alertCalls).toBe(0)
  })

  it('propagates transaction failures', async () => {
    const db = {
      $transaction: async <T>(fn: (tx: object) => Promise<T>) => {
        void fn
        throw new Error('transaction failed')
      },
    }

    await expect(
      ingestAgentReport(
        {
          agentId: 'agent-1',
          payload: {
            reportedAt: '2026-03-27T10:00:00.000Z',
            payloadVersion: '1',
            networkDevices: [],
            bluetoothDevices: [],
          },
        },
        db as unknown as Parameters<typeof ingestAgentReport>[1],
      ),
    ).rejects.toThrow('transaction failed')
  })
})
