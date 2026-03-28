import * as z from 'zod'

export const dashboardAgentOverviewInputSchema = z.object({
  agentId: z.string().min(1),
})
