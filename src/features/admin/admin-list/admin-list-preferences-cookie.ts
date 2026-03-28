import * as z from 'zod'
import type { AdminResourceKey } from '#/features/admin/admin-types'

const COOKIE_NAME = 'phm_admin_list_prefs'
const MAX_AGE_SEC = 365 * 24 * 60 * 60

const resourcePrefsSchema = z.object({
  sortBy: z.string().optional(),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().default(''),
  pageSize: z.number().int().min(1).max(100).default(20),
  filterResolved: z.enum(['all', 'yes', 'no']).default('all'),
  filterAgentStatus: z.enum(['all', 'ONLINE', 'OFFLINE', 'DISABLED']).default('all'),
  filterDeviceKind: z.enum(['all', 'NETWORK', 'BLUETOOTH', 'BLE', 'UNKNOWN']).default('all'),
  filterDeviceAgentId: z.union([z.literal('all'), z.string().min(1)]).default('all'),
})

export type AdminListResourcePrefs = z.infer<typeof resourcePrefsSchema>

const storeSchema = z.record(z.string(), resourcePrefsSchema.partial())

function readCookieRaw(name: string): string | null {
  if (typeof document === 'undefined') return null
  const parts = document.cookie.split(';').map((c) => c.trim())
  const prefix = `${name}=`
  for (const part of parts) {
    if (!part.startsWith(prefix)) continue
    const raw = part.slice(prefix.length)
    try {
      const v = decodeURIComponent(raw)
      return v.length > 0 ? v : null
    } catch {
      return null
    }
  }
  return null
}

const DEFAULT_ADMIN_LIST_PREFS: AdminListResourcePrefs = {
  sortBy: undefined,
  sortDir: 'desc',
  search: '',
  pageSize: 20,
  filterResolved: 'all',
  filterAgentStatus: 'all',
  filterDeviceKind: 'all',
  filterDeviceAgentId: 'all',
}

function parseStore(raw: string | null): Partial<Record<AdminResourceKey, Partial<AdminListResourcePrefs>>> {
  if (!raw) return {}
  try {
    const parsed: unknown = JSON.parse(raw)
    const r = storeSchema.safeParse(parsed)
    if (!r.success) return {}
    const out: Partial<Record<AdminResourceKey, Partial<AdminListResourcePrefs>>> = {}
    for (const key of ['alerts', 'agents', 'devices', 'rawReports'] as const) {
      const slice = r.data[key]
      if (!slice || typeof slice !== 'object') continue
      const parsed = resourcePrefsSchema.partial().safeParse(slice)
      if (parsed.success) out[key] = parsed.data
    }
    return out
  } catch {
    return {}
  }
}

export function readAdminListPrefs(resource: AdminResourceKey): AdminListResourcePrefs {
  const raw = readCookieRaw(COOKIE_NAME)
  const store = parseStore(raw)
  const slice = store[resource]
  return { ...DEFAULT_ADMIN_LIST_PREFS, ...slice }
}

export function writeAdminListPrefs(resource: AdminResourceKey, prefs: AdminListResourcePrefs): void {
  if (typeof document === 'undefined') return
  const raw = readCookieRaw(COOKIE_NAME)
  const store = { ...parseStore(raw), [resource]: prefs }
  const json = JSON.stringify(store)
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:'
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(json)}; Path=/; Max-Age=${MAX_AGE_SEC}; SameSite=Lax${secure ? '; Secure' : ''}`
}
