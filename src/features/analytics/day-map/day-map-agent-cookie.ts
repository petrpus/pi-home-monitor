const COOKIE_NAME = 'phm_day_map_agent_id'
const MAX_AGE_SEC = 365 * 24 * 60 * 60

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

export function readDayMapAgentCookie(): string | null {
  return readCookieRaw(COOKIE_NAME)
}

export function writeDayMapAgentCookie(agentId: string): void {
  if (typeof document === 'undefined') return
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:'
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(agentId)}; Path=/; Max-Age=${MAX_AGE_SEC}; SameSite=Lax${secure ? '; Secure' : ''}`
}
