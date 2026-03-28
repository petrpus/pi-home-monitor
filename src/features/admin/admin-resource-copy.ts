import type { AdminResourceKey } from './admin-types'

/** Czech UI labels (URLs remain English). */
export const RESOURCE_TITLE: Record<AdminResourceKey, string> = {
  alerts: 'Upozornění',
  agents: 'Agenti',
  devices: 'Zařízení',
  rawReports: 'Hlášení',
}

export const NAV: { to: string; label: string }[] = [
  { to: '/', label: 'Přehled' },
  { to: '/analytics', label: 'Analytika' },
]

export const ADMIN_LINKS: { resource: AdminResourceKey; to: string }[] = [
  { resource: 'alerts', to: '/admin/alerts' },
  { resource: 'agents', to: '/admin/agents' },
  { resource: 'devices', to: '/admin/devices' },
  { resource: 'rawReports', to: '/admin/rawReports' },
]
