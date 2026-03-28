import { describe, expect, it } from 'vitest'
import { listQuerySchema, mutateBodySchema } from './admin-types'

describe('listQuerySchema', () => {
  it('applies defaults for page, pageSize, and sortDir', () => {
    const parsed = listQuerySchema.parse({ resource: 'agents' })
    expect(parsed).toMatchObject({
      resource: 'agents',
      page: 1,
      pageSize: 20,
      sortDir: 'desc',
    })
  })

  it('rejects invalid resource', () => {
    const r = listQuerySchema.safeParse({ resource: 'unknown' })
    expect(r.success).toBe(false)
  })

  it('rejects page below 1', () => {
    const r = listQuerySchema.safeParse({ resource: 'alerts', page: 0 })
    expect(r.success).toBe(false)
  })

  it('rejects pageSize above 100', () => {
    const r = listQuerySchema.safeParse({ resource: 'devices', pageSize: 101 })
    expect(r.success).toBe(false)
  })

  it('accepts optional filters', () => {
    const parsed = listQuerySchema.parse({
      resource: 'alerts',
      filters: {
        isResolved: 'yes',
        agentStatus: 'ONLINE',
        deviceKind: 'BLE',
        deviceAgentId: 'agent-1',
      },
    })
    expect(parsed.filters).toEqual({
      isResolved: 'yes',
      agentStatus: 'ONLINE',
      deviceKind: 'BLE',
      deviceAgentId: 'agent-1',
    })
  })
})

describe('mutateBodySchema', () => {
  it('parses create', () => {
    const parsed = mutateBodySchema.parse({
      operation: 'create',
      resource: 'agents',
      payload: { name: 'A', apiKey: '12345678' },
    })
    expect(parsed.operation).toBe('create')
    expect(parsed.resource).toBe('agents')
  })

  it('parses update with id', () => {
    const parsed = mutateBodySchema.parse({
      operation: 'update',
      resource: 'devices',
      id: 'dev-1',
      payload: {},
    })
    expect(parsed).toMatchObject({ operation: 'update', id: 'dev-1' })
  })

  it('parses delete', () => {
    const parsed = mutateBodySchema.parse({
      operation: 'delete',
      resource: 'alerts',
      id: 'a1',
    })
    expect(parsed.operation).toBe('delete')
  })

  it('parses bulkDelete with id bounds', () => {
    const parsed = mutateBodySchema.parse({
      operation: 'bulkDelete',
      resource: 'rawReports',
      ids: ['x', 'y'],
    })
    expect(parsed.operation).toBe('bulkDelete')
    if (parsed.operation !== 'bulkDelete') {
      throw new Error('expected bulkDelete')
    }
    expect(parsed.ids).toEqual(['x', 'y'])
  })

  it('rejects bulkDelete with empty ids', () => {
    const r = mutateBodySchema.safeParse({
      operation: 'bulkDelete',
      resource: 'alerts',
      ids: [],
    })
    expect(r.success).toBe(false)
  })

  it('rejects bulkDelete with more than 100 ids', () => {
    const r = mutateBodySchema.safeParse({
      operation: 'bulkDelete',
      resource: 'alerts',
      ids: Array.from({ length: 101 }, (_, i) => `id-${i}`),
    })
    expect(r.success).toBe(false)
  })

  it('parses bulkResolve only for alerts', () => {
    const parsed = mutateBodySchema.parse({
      operation: 'bulkResolve',
      resource: 'alerts',
      ids: ['a', 'b'],
    })
    expect(parsed.resource).toBe('alerts')
  })

  it('rejects bulkResolve for non-alerts resource', () => {
    const r = mutateBodySchema.safeParse({
      operation: 'bulkResolve',
      resource: 'agents',
      ids: ['a'],
    })
    expect(r.success).toBe(false)
  })

  it('rejects update with empty id', () => {
    const r = mutateBodySchema.safeParse({
      operation: 'update',
      resource: 'agents',
      id: '',
      payload: {},
    })
    expect(r.success).toBe(false)
  })
})
