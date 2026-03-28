import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AlertSeverity, AlertType } from '../../../generated/prisma/client'
import { hashApiKey } from '#/features/agents/agent-auth.server'
import { adminMutate } from './admin-crud.service'

const getPrismaClient = vi.hoisted(() => vi.fn())

vi.mock('#/lib/prismaDb', () => ({
  getPrismaClient,
}))

describe('adminMutate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns validation error when agent apiKey is too short', async () => {
    getPrismaClient.mockReturnValue({})

    const out = await adminMutate({
      operation: 'create',
      resource: 'agents',
      payload: { name: 'N', apiKey: 'short' },
    })

    expect(out).toMatchObject({ error: 'validation' })
    expect('detail' in out && typeof out.detail).toBe('string')
  })

  it('returns duplicate_api_key when hash already exists', async () => {
    const existingHash = hashApiKey('existing-key-123456')
    const findUnique = vi.fn().mockResolvedValue({ id: 'taken' })
    getPrismaClient.mockReturnValue({ agent: { findUnique } })

    const out = await adminMutate({
      operation: 'create',
      resource: 'agents',
      payload: { name: 'New', apiKey: 'existing-key-123456' },
    })

    expect(out).toEqual({ error: 'duplicate_api_key' })
    expect(findUnique).toHaveBeenCalledWith({
      where: { apiKeyHash: existingHash },
      select: { id: true },
    })
  })

  it('creates agent when api key is unique', async () => {
    const create = vi.fn().mockResolvedValue({
      id: 'new-id',
      name: 'Agent',
      locationLabel: null,
      status: 'ONLINE',
      lastSeenAt: null,
    })
    getPrismaClient.mockReturnValue({
      agent: {
        findUnique: vi.fn().mockResolvedValue(null),
        create,
      },
    })

    const out = await adminMutate({
      operation: 'create',
      resource: 'agents',
      payload: { name: 'Agent', apiKey: 'unique-key-123456' },
    })

    expect(out).toMatchObject({
      result: {
        id: 'new-id',
        name: 'Agent',
      },
    })
    expect(create).toHaveBeenCalledTimes(1)
  })

  it('returns validation error for invalid alert create payload', async () => {
    getPrismaClient.mockReturnValue({})

    const out = await adminMutate({
      operation: 'create',
      resource: 'alerts',
      payload: { title: '' },
    })

    expect(out).toMatchObject({ error: 'validation' })
  })

  it('rejects bulkDelete with more than 100 ids', async () => {
    getPrismaClient.mockReturnValue({})

    const out = await adminMutate({
      operation: 'bulkDelete',
      resource: 'alerts',
      ids: Array.from({ length: 101 }, (_, i) => `x${i}`),
    })

    expect(out).toMatchObject({ error: 'validation', detail: expect.stringContaining('100') })
  })

  it('throws when create is not allowed for rawReports', async () => {
    getPrismaClient.mockReturnValue({})

    await expect(
      adminMutate({
        operation: 'create',
        resource: 'rawReports',
        payload: {},
      }),
    ).rejects.toThrow(/create not allowed for resource rawReports/)
  })

  it('bulkResolve updates unresolved alerts', async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 2 })
    getPrismaClient.mockReturnValue({
      alert: { updateMany },
    })

    const out = await adminMutate({
      operation: 'bulkResolve',
      resource: 'alerts',
      ids: ['a', 'b'],
    })

    expect(out).toMatchObject({ result: { resolved: 2 } })
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['a', 'b'] }, isResolved: false },
      data: expect.objectContaining({ isResolved: true }),
    })
  })

  it('creates alert with valid payload', async () => {
    const create = vi.fn().mockResolvedValue({ id: 'al-1' })
    getPrismaClient.mockReturnValue({ alert: { create } })

    const out = await adminMutate({
      operation: 'create',
      resource: 'alerts',
      payload: {
        type: AlertType.NEW_DEVICE,
        severity: AlertSeverity.INFO,
        title: 'T',
      },
    })

    expect(out).toMatchObject({ result: { id: 'al-1' } })
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: AlertType.NEW_DEVICE,
        title: 'T',
      }),
    })
  })
})
