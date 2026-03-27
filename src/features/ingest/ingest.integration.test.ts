import { beforeAll, describe, expect, it } from 'vitest'
import { DeviceKind } from '../../../generated/prisma/client'
import { hashApiKey } from '#/features/agents/agent-auth.server'
import { handleIngestPost } from './ingest.route-handler'
import { getPrismaClient } from '#/lib/prisma.server'

const runIntegration = process.env.RUN_INTEGRATION === '1'
const describeIf = runIntegration ? describe : describe.skip

const TEST_AGENT_ID = 'integration-ingest-agent'
const TEST_API_KEY = 'integration-ingest-agent-key'
const TEST_MAC_NETWORK = 'AA:AA:AA:AA:AA:AA'
const TEST_MAC_BLE = 'BB:BB:BB:BB:BB:BB'
const TEST_PAYLOAD_VERSION = 'integration-test-v1'

describeIf('ingest integration', () => {
  beforeAll(async () => {
    const prisma = getPrismaClient()

    await prisma.agent.upsert({
      where: { id: TEST_AGENT_ID },
      update: {
        name: 'Integration Test Agent',
        apiKeyHash: hashApiKey(TEST_API_KEY),
      },
      create: {
        id: TEST_AGENT_ID,
        name: 'Integration Test Agent',
        status: 'ONLINE',
        apiKeyHash: hashApiKey(TEST_API_KEY),
      },
    })
  })

  it('persists raw report, devices and observations end-to-end', async () => {
    const prisma = getPrismaClient()

    await prisma.alert.deleteMany({
      where: {
        OR: [
          { device: { primaryMac: TEST_MAC_NETWORK } },
          { device: { primaryMac: TEST_MAC_BLE } },
        ],
      },
    })
    await prisma.observation.deleteMany({
      where: {
        OR: [{ macAddress: TEST_MAC_NETWORK }, { macAddress: TEST_MAC_BLE }],
      },
    })
    await prisma.rawReport.deleteMany({
      where: { payloadVersion: TEST_PAYLOAD_VERSION },
    })
    await prisma.device.deleteMany({
      where: {
        OR: [
          { kind: DeviceKind.NETWORK, primaryMac: TEST_MAC_NETWORK },
          { kind: DeviceKind.BLE, primaryMac: TEST_MAC_BLE },
        ],
      },
    })

    const request = new Request('http://localhost/api/ingest', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': TEST_API_KEY,
      },
      body: JSON.stringify({
        reportedAt: '2026-03-27T10:00:00.000Z',
        payloadVersion: TEST_PAYLOAD_VERSION,
        networkDevices: [
          {
            macAddress: TEST_MAC_NETWORK,
            ipAddress: '192.168.1.20',
            hostname: 'integration-printer.local',
            name: 'Integration Printer',
            vendor: 'TestVendor',
          },
        ],
        bluetoothDevices: [
          {
            macAddress: TEST_MAC_BLE,
            name: 'Integration Headphones',
            rssi: -55,
            kind: 'BLE',
            vendor: 'TestVendor',
          },
        ],
      }),
    })

    const response = await handleIngestPost(request)
    const body = (await response.json()) as {
      ok: boolean
      processed: { observationsCreated: number; devicesCreated: number }
      rawReportId: string
    }

    expect(response.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.processed.observationsCreated).toBe(2)
    expect(body.processed.devicesCreated).toBe(2)

    const rawReport = await prisma.rawReport.findUnique({
      where: { id: body.rawReportId },
    })
    expect(rawReport).not.toBeNull()
    expect(rawReport?.payloadVersion).toBe(TEST_PAYLOAD_VERSION)

    const networkDevice = await prisma.device.findUnique({
      where: {
        kind_primaryMac: {
          kind: DeviceKind.NETWORK,
          primaryMac: TEST_MAC_NETWORK,
        },
      },
    })
    const bleDevice = await prisma.device.findUnique({
      where: {
        kind_primaryMac: {
          kind: DeviceKind.BLE,
          primaryMac: TEST_MAC_BLE,
        },
      },
    })

    expect(networkDevice).not.toBeNull()
    expect(bleDevice).not.toBeNull()
  })
})
