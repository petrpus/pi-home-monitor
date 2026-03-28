import { createServerFn } from '@tanstack/react-start'
import { assertAdminSession } from '#/features/auth/sessionAdmin.server'
import { getPrismaClient } from '#/lib/prismaDb'
import { dashboardAgentAlertsPreview, dashboardAgentOverview } from './dashboard-agent.core'
import { dashboardAgentOverviewInputSchema } from './dashboard-agent.schema'

export const getDashboardAgentOverviewFn = createServerFn({ method: 'POST' })
  .inputValidator((raw: unknown) => dashboardAgentOverviewInputSchema.parse(raw))
  .handler(async ({ data }) => {
    await assertAdminSession()
    return dashboardAgentOverview(getPrismaClient(), data.agentId)
  })

export const getDashboardAgentAlertsPreviewFn = createServerFn({ method: 'POST' })
  .inputValidator((raw: unknown) => dashboardAgentOverviewInputSchema.parse(raw))
  .handler(async ({ data }) => {
    await assertAdminSession()
    return dashboardAgentAlertsPreview(getPrismaClient(), data.agentId)
  })
