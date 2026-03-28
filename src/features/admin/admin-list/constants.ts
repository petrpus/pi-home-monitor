import type { AdminResourceKey } from "#/features/admin/admin-types"

/** Resources with list-only admin UI (no create/update/delete). */
export const READ_ONLY: AdminResourceKey[] = []

/** Delete and bulk-delete only (no Nový / Upravit). */
export const ADMIN_DELETE_ONLY: AdminResourceKey[] = ["rawReports"]

/** Czech short month names (capitalized), matching e.g. "1. Led 2022 17:24:31". */
const CZ_MONTHS_SHORT = [
  "Led",
  "Úno",
  "Bře",
  "Dub",
  "Kvě",
  "Čvn",
  "Čvc",
  "Srp",
  "Zář",
  "Říj",
  "Lis",
  "Pro",
] as const

export function formatCzechDateTime(d: Date): string {
  if (Number.isNaN(d.getTime())) return "—"
  const day = d.getDate()
  const month = CZ_MONTHS_SHORT[d.getMonth()]
  const year = d.getFullYear()
  const h = String(d.getHours()).padStart(2, "0")
  const min = String(d.getMinutes()).padStart(2, "0")
  const s = String(d.getSeconds()).padStart(2, "0")
  return `${day}. ${month} ${year} ${h}:${min}:${s}`
}

function columnLooksDateTime(key: string): boolean {
  return /(At|Date)$/i.test(key)
}

function tryParseCellDateTime(v: unknown, columnKey: string): Date | null {
  if (!columnLooksDateTime(columnKey)) return null
  if (v instanceof Date) {
    return Number.isNaN(v.getTime()) ? null : v
  }
  if (typeof v === "string") {
    const s = v.trim()
    if (!/^\d{4}-\d{2}-\d{2}/.test(s)) return null
    const d = new Date(s)
    return Number.isNaN(d.getTime()) ? null : d
  }
  if (typeof v === "number" && Number.isFinite(v)) {
    const d = new Date(v)
    return Number.isNaN(d.getTime()) ? null : d
  }
  return null
}

export function formatCell(v: unknown, columnKey?: string): string {
  if (v === null || v === undefined) return "—"
  if (columnKey === "isResolved" && typeof v === "boolean") return v ? "ANO" : "NE"
  if (columnKey === "nameUserSet" && typeof v === "boolean") return v ? "ANO" : "NE"
  if (columnKey === "lastRssi" && typeof v === "number") return `${v} dBm`
  if (columnKey) {
    const asDate = tryParseCellDateTime(v, columnKey)
    if (asDate) return formatCzechDateTime(asDate)
  }
  if (v instanceof Date) return formatCzechDateTime(v)
  if (typeof v === "object") return JSON.stringify(v)
  return String(v)
}

/** Visible device table columns (order); list API returns more fields for detail modal. */
export const DEVICE_TABLE_COLUMNS = [
  "normalizedName",
  "kind",
  "primaryMac",
  "lastIpAddress",
  "lastRssi",
  "vendor",
] as const

export function pickColumns(rows: object[], resource?: AdminResourceKey): string[] {
  if (!rows.length) return []
  if (resource === "devices") {
    const keys = new Set(Object.keys(rows[0]).filter((k) => k !== "id"))
    return DEVICE_TABLE_COLUMNS.filter((k) => keys.has(k))
  }
  let keys = Object.keys(rows[0]).filter((k) => k !== "id")
  if (resource === "agents") {
    keys = keys.filter((k) => k !== "createdAt" && k !== "updatedAt")
  }
  const priority = [
    "agentName",
    "deviceCount",
    "name",
    "title",
    "type",
    "severity",
    "status",
    "normalizedName",
    "kind",
    "primaryMac",
    "lastIpAddress",
    "lastRssi",
    "isResolved",
    "message",
    "createdAt",
    "observedAt",
    "receivedAt",
    "reportedAt",
  ]
  const rest = keys.filter((k) => !priority.includes(k)).sort()
  const picked = [...priority.filter((k) => keys.includes(k)), ...rest].slice(0, 12)
  return picked.length > 0 ? picked : []
}
