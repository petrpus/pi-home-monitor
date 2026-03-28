import type { AdminListUrlSearchDefaults } from '#/features/admin/admin-types'

/** URL search on `/admin/$resource` (deep-link from dashboard, bookmarks). */
export function parseAdminListSearch(raw: Record<string, unknown>): AdminListUrlSearchDefaults {
  const agentId =
    typeof raw.agentId === 'string' && raw.agentId.length > 0 ? raw.agentId : undefined
  const resolved =
    raw.resolved === 'all' || raw.resolved === 'yes' || raw.resolved === 'no'
      ? raw.resolved
      : undefined
  return { agentId, resolved }
}
