/** Time window in which a successful ingest counts the agent as reachable (live). */
export const AGENT_LIVE_WINDOW_MS = 24 * 60 * 60 * 1000

export type AgentActivityPresence = "live" | "stale" | "disabled"

/**
 * Derives UI presence from stored `Agent.status` and `lastSeenAt` (after last successful report).
 * `DISABLED` always wins; otherwise freshness uses `AGENT_LIVE_WINDOW_MS`.
 */
export function getAgentActivityPresence(
  dbStatus: string,
  lastSeenAt: unknown,
  nowMs: number = Date.now(),
): AgentActivityPresence {
  if (dbStatus === "DISABLED") return "disabled"
  const ms = parseLastSeenMs(lastSeenAt)
  if (ms === null) return "stale"
  return nowMs - ms <= AGENT_LIVE_WINDOW_MS ? "live" : "stale"
}

function parseLastSeenMs(v: unknown): number | null {
  if (v instanceof Date) {
    const t = v.getTime()
    return Number.isNaN(t) ? null : t
  }
  if (typeof v === "string") {
    const t = new Date(v).getTime()
    return Number.isNaN(t) ? null : t
  }
  return null
}

export function agentReportFreshnessThreshold(atMs: number = Date.now()): Date {
  return new Date(atMs - AGENT_LIVE_WINDOW_MS)
}
