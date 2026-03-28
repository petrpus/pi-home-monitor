import { describe, expect, it } from 'vitest'
import {
  AGENT_LIVE_WINDOW_MS,
  agentReportFreshnessThreshold,
  getAgentActivityPresence,
} from './agent-activity'

describe('getAgentActivityPresence', () => {
  it('returns disabled when DB status is DISABLED', () => {
    expect(getAgentActivityPresence('DISABLED', new Date(), 1_000_000)).toBe('disabled')
  })

  it('returns stale when lastSeenAt is null', () => {
    expect(getAgentActivityPresence('ONLINE', null, 1_000_000)).toBe('stale')
  })

  it('returns live when lastSeenAt is within the live window', () => {
    const nowMs = 10_000_000
    const lastSeenAt = new Date(nowMs - 60_000)
    expect(getAgentActivityPresence('ONLINE', lastSeenAt, nowMs)).toBe('live')
  })

  it('returns stale when lastSeenAt is older than the live window', () => {
    const nowMs = 10_000_000
    const lastSeenAt = new Date(nowMs - AGENT_LIVE_WINDOW_MS - 1)
    expect(getAgentActivityPresence('ONLINE', lastSeenAt, nowMs)).toBe('stale')
  })

  it('accepts ISO string lastSeenAt', () => {
    const nowMs = Date.parse('2026-03-28T12:00:00.000Z')
    const lastSeenAt = '2026-03-28T11:00:00.000Z'
    expect(getAgentActivityPresence('ONLINE', lastSeenAt, nowMs)).toBe('live')
  })
})

describe('agentReportFreshnessThreshold', () => {
  it('subtracts the live window from the reference time', () => {
    const atMs = 50_000_000
    const threshold = agentReportFreshnessThreshold(atMs)
    expect(threshold.getTime()).toBe(atMs - AGENT_LIVE_WINDOW_MS)
  })
})
