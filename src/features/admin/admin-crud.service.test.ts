import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AlertSeverity, AlertType } from '../../../generated/prisma/client'
import { DeviceKind } from '../../../generated/prisma/client'
import { hashApiKey } from '#/features/agents/agent-auth.server'
import { adminList, adminMutate } from './admin-crud.service'

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

describe('adminList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('applies isResolved yes filter for alerts', async () => {
    const findMany = vi.fn().mockResolvedValue([])
    const count = vi.fn().mockResolvedValue(0)
    getPrismaClient.mockReturnValue({ alert: { findMany, count } })

    await adminList({
      resource: 'alerts',
      page: 1,
      pageSize: 20,
      sortDir: 'desc',
      filters: { isResolved: 'yes' },
    })

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isResolved: true },
        skip: 0,
        take: 20,
      }),
    )
    expect(count).toHaveBeenCalledWith({ where: { isResolved: true } })
  })

  it('adds search OR for alerts', async () => {
    const findMany = vi.fn().mockResolvedValue([])
    const count = vi.fn().mockResolvedValue(0)
    getPrismaClient.mockReturnValue({ alert: { findMany, count } })

    await adminList({
      resource: 'alerts',
      page: 1,
      pageSize: 20,
      sortDir: 'desc',
      search: '  printer  ',
    })

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { title: { contains: 'printer', mode: 'insensitive' } },
            { message: { contains: 'printer', mode: 'insensitive' } },
            { agent: { name: { contains: 'printer', mode: 'insensitive' } } },
          ],
        },
      }),
    )
  })

  it('orders alerts by agent name when sortBy is agentName', async () => {
    const findMany = vi.fn().mockResolvedValue([])
    const count = vi.fn().mockResolvedValue(0)
    getPrismaClient.mockReturnValue({ alert: { findMany, count } })

    await adminList({
      resource: 'alerts',
      page: 1,
      pageSize: 20,
      sortBy: 'agentName',
      sortDir: 'asc',
    })

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { agent: { name: 'asc' } },
      }),
    )
  })

  it('maps alert rows with agentName', async () => {
    const findMany = vi.fn().mockResolvedValue([
      {
        id: 'a1',
        type: AlertType.NEW_DEVICE,
        severity: AlertSeverity.INFO,
        message: 'm',
        isResolved: false,
        createdAt: new Date('2026-01-01'),
        agent: { name: 'Pi' },
      },
    ])
    const count = vi.fn().mockResolvedValue(1)
    getPrismaClient.mockReturnValue({ alert: { findMany, count } })

    const out = await adminList({
      resource: 'alerts',
      page: 1,
      pageSize: 20,
      sortDir: 'desc',
    })

    expect(out.rows).toEqual([
      expect.objectContaining({
        id: 'a1',
        agentName: 'Pi',
        message: 'm',
        isResolved: false,
      }),
    ])
    expect(out.total).toBe(1)
  })

  it('filters agents by DISABLED status', async () => {
    const findMany = vi.fn().mockResolvedValue([])
    const count = vi.fn().mockResolvedValue(0)
    getPrismaClient.mockReturnValue({ agent: { findMany, count } })

    await adminList({
      resource: 'agents',
      page: 1,
      pageSize: 20,
      sortDir: 'desc',
      filters: { agentStatus: 'DISABLED' },
    })

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { AND: [{ status: 'DISABLED' }] },
      }),
    )
  })

  it('filters devices by kind and observing agent', async () => {
    const findMany = vi.fn().mockResolvedValue([])
    const count = vi.fn().mockResolvedValue(0)
    getPrismaClient.mockReturnValue({ device: { findMany, count } })

    await adminList({
      resource: 'devices',
      page: 1,
      pageSize: 20,
      sortDir: 'desc',
      filters: { deviceKind: 'BLE', deviceAgentId: 'agent-x' },
    })

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          kind: DeviceKind.BLE,
          observations: { some: { agentId: 'agent-x' } },
        },
      }),
    )
  })

  it('maps rawReports rows with agentName and deviceCount', async () => {
    const findMany = vi.fn().mockResolvedValue([
      {
        id: 'rr1',
        receivedAt: new Date('2026-01-02'),
        reportedAt: new Date('2026-01-01'),
        agent: { name: 'Hub' },
        _count: { observations: 3 },
      },
    ])
    const count = vi.fn().mockResolvedValue(1)
    getPrismaClient.mockReturnValue({ rawReport: { findMany, count } })

    const out = await adminList({
      resource: 'rawReports',
      page: 1,
      pageSize: 20,
      sortDir: 'desc',
    })

    expect(out.rows).toEqual([
      {
        id: 'rr1',
        agentName: 'Hub',
        deviceCount: 3,
        receivedAt: new Date('2026-01-02'),
        reportedAt: new Date('2026-01-01'),
      },
    ])
  })

  it('uses skip and take for pagination', async () => {
    const findMany = vi.fn().mockResolvedValue([])
    const count = vi.fn().mockResolvedValue(0)
    getPrismaClient.mockReturnValue({ alert: { findMany, count } })

    await adminList({
      resource: 'alerts',
      page: 3,
      pageSize: 15,
      sortDir: 'desc',
    })

    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 30, take: 15 }))
  })

  it('update alert sets resolvedAt when marking resolved', async () => {
    const update = vi.fn().mockResolvedValue({ id: 'a1' })
    getPrismaClient.mockReturnValue({ alert: { update } })

    const out = await adminMutate({
      operation: 'update',
      resource: 'alerts',
      id: 'a1',
      payload: { isResolved: true },
    })

    expect(out).toMatchObject({ result: { id: 'a1' } })
    expect(update).toHaveBeenCalledWith({
      where: { id: 'a1' },
      data: expect.objectContaining({
        isResolved: true,
        resolvedAt: expect.any(Date),
      }),
    })
  })

  it('update alert clears resolvedAt when unresolving', async () => {
    const update = vi.fn().mockResolvedValue({ id: 'a1' })
    getPrismaClient.mockReturnValue({ alert: { update } })

    await adminMutate({
      operation: 'update',
      resource: 'alerts',
      id: 'a1',
      payload: { isResolved: false },
    })

    expect(update).toHaveBeenCalledWith({
      where: { id: 'a1' },
      data: expect.objectContaining({
        isResolved: false,
        resolvedAt: null,
      }),
    })
  })

  it('delete alert calls prisma delete', async () => {
    const del = vi.fn().mockResolvedValue({})
    getPrismaClient.mockReturnValue({ alert: { delete: del } })

    const out = await adminMutate({
      operation: 'delete',
      resource: 'alerts',
      id: 'del-1',
    })

    expect(out).toEqual({ result: { id: 'del-1' } })
    expect(del).toHaveBeenCalledWith({ where: { id: 'del-1' } })
  })

  it('bulkDelete alerts uses deleteMany', async () => {
    const deleteMany = vi.fn().mockResolvedValue({ count: 2 })
    getPrismaClient.mockReturnValue({ alert: { deleteMany } })

    const out = await adminMutate({
      operation: 'bulkDelete',
      resource: 'alerts',
      ids: ['x', 'y'],
    })

    expect(out).toMatchObject({ result: { deleted: 2 } })
    expect(deleteMany).toHaveBeenCalledWith({ where: { id: { in: ['x', 'y'] } } })
  })
})
