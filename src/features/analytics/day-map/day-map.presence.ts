export const PRESENCE_SEP = '\t' as const

export function presenceKey(deviceId: string, rawReportId: string): string {
  return `${deviceId}${PRESENCE_SEP}${rawReportId}`
}

export function dedupePresence(
  observations: { deviceId: string; rawReportId: string }[],
): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const o of observations) {
    const k = presenceKey(o.deviceId, o.rawReportId)
    if (seen.has(k)) continue
    seen.add(k)
    out.push(k)
  }
  return out
}
