import { describe, expect, it } from 'vitest'
import { dashboardAgentOverviewInputSchema } from './dashboard-agent.schema'

describe('dashboardAgentOverviewInputSchema', () => {
  it('parses non-empty agentId', () => {
    expect(dashboardAgentOverviewInputSchema.parse({ agentId: 'cuid' })).toEqual({
      agentId: 'cuid',
    })
  })

  it('rejects empty agentId', () => {
    const r = dashboardAgentOverviewInputSchema.safeParse({ agentId: '' })
    expect(r.success).toBe(false)
  })
})
