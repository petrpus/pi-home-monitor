import { describe, expect, it, vi } from 'vitest'
import { AgentStatus } from '../../../generated/prisma/client'
import { handleIngestPost } from './ingest.route-handler'

const mockAgent = {
  id: 'agent-1',
  name: 'Agent 1',
  apiKeyHash: 'hash',
  locationLabel: null,
  status: AgentStatus.ONLINE,
  lastSeenAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('handleIngestPost', () => {
  it('returns 401 for missing api key header', async () => {
    const request = new Request('http://localhost/api/ingest', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'content-type': 'application/json' },
    })

    const response = await handleIngestPost(request, {
      authenticateAgentByApiKey: vi.fn(),
      ingestAgentReport: vi.fn(),
    })

    expect(response.status).toBe(401)
  })

  it('returns 401 for invalid api key', async () => {
    const request = new Request('http://localhost/api/ingest', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'content-type': 'application/json', 'x-api-key': 'bad-key' },
    })

    const response = await handleIngestPost(request, {
      authenticateAgentByApiKey: vi.fn(async () => null),
      ingestAgentReport: vi.fn(),
    })

    expect(response.status).toBe(401)
  })

  it('returns 400 for invalid json', async () => {
    const request = new Request('http://localhost/api/ingest', {
      method: 'POST',
      body: '{bad json',
      headers: { 'content-type': 'application/json', 'x-api-key': 'good-key' },
    })

    const response = await handleIngestPost(request, {
      authenticateAgentByApiKey: vi.fn(async () => mockAgent),
      ingestAgentReport: vi.fn(),
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({ error: 'INVALID_JSON' })
  })

  it('returns 400 for invalid payload', async () => {
    const request = new Request('http://localhost/api/ingest', {
      method: 'POST',
      body: JSON.stringify({ networkDevices: [{ macAddress: 'BAD' }] }),
      headers: { 'content-type': 'application/json', 'x-api-key': 'good-key' },
    })

    const response = await handleIngestPost(request, {
      authenticateAgentByApiKey: vi.fn(async () => mockAgent),
      ingestAgentReport: vi.fn(),
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({ error: 'INVALID_PAYLOAD' })
  })

  it('returns 500 when ingest service throws', async () => {
    const request = new Request('http://localhost/api/ingest', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'content-type': 'application/json', 'x-api-key': 'good-key' },
    })

    const response = await handleIngestPost(request, {
      authenticateAgentByApiKey: vi.fn(async () => mockAgent),
      ingestAgentReport: vi.fn(async () => {
        throw new Error('db failed')
      }),
    })

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toMatchObject({ error: 'INTERNAL_ERROR' })
  })

  it('returns 200 for valid request', async () => {
    const request = new Request('http://localhost/api/ingest', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'content-type': 'application/json', 'x-api-key': 'good-key' },
    })

    const response = await handleIngestPost(request, {
      authenticateAgentByApiKey: vi.fn(async () => mockAgent),
      ingestAgentReport: vi.fn(async () => ({
        ok: true as const,
        agentId: mockAgent.id,
        rawReportId: 'raw-1',
        processed: {
          networkDevices: 0,
          bluetoothDevices: 0,
          observationsCreated: 0,
          devicesCreated: 0,
          devicesUpdated: 0,
          alertsCreated: 0,
          skipped: 0,
        },
      })),
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({ ok: true, agentId: 'agent-1' })
  })
})
