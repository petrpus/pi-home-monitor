import * as z from 'zod'

export const ADMIN_RESOURCE_KEYS = [
  'alerts',
  'agents',
  'devices',
  'rawReports',
] as const

export type AdminResourceKey = (typeof ADMIN_RESOURCE_KEYS)[number]

export const adminResourceKeySchema = z.enum(ADMIN_RESOURCE_KEYS)

export const listQuerySchema = z.object({
  resource: adminResourceKeySchema,
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
  filters: z
    .object({
      isResolved: z.enum(['all', 'yes', 'no']).optional(),
      agentStatus: z.enum(['ONLINE', 'OFFLINE', 'DISABLED', 'all']).optional(),
      deviceKind: z.enum(['NETWORK', 'BLUETOOTH', 'BLE', 'UNKNOWN', 'all']).optional(),
      /** Devices that have at least one observation from this agent */
      deviceAgentId: z.string().min(1).optional(),
    })
    .optional(),
})

export type ListQuery = z.infer<typeof listQuerySchema>

export const mutateBodySchema = z.discriminatedUnion('operation', [
  z.object({
    operation: z.literal('create'),
    resource: adminResourceKeySchema,
    payload: z.record(z.string(), z.unknown()),
    clientOperationId: z.string().optional(),
  }),
  z.object({
    operation: z.literal('update'),
    resource: adminResourceKeySchema,
    id: z.string().min(1),
    payload: z.record(z.string(), z.unknown()),
    clientOperationId: z.string().optional(),
  }),
  z.object({
    operation: z.literal('delete'),
    resource: adminResourceKeySchema,
    id: z.string().min(1),
    clientOperationId: z.string().optional(),
  }),
  z.object({
    operation: z.literal('bulkDelete'),
    resource: adminResourceKeySchema,
    ids: z.array(z.string().min(1)).min(1).max(100),
    clientOperationId: z.string().optional(),
  }),
  z.object({
    operation: z.literal('bulkResolve'),
    resource: z.literal('alerts'),
    ids: z.array(z.string().min(1)).min(1).max(100),
    clientOperationId: z.string().optional(),
  }),
])

export type MutateBody = z.infer<typeof mutateBodySchema>
