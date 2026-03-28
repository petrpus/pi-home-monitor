import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { DashboardPageShell } from '#/components/dashboard-page-shell'
import { DashboardShell } from '#/components/dashboard-shell'
import { Card, CardContent } from '#/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { AgentLiveStatusCell } from '#/features/admin/admin-list/AgentLiveStatusCell'
import { formatCzechDateTime } from '#/features/admin/admin-list/constants'
import { readDayMapAgentCookie, writeDayMapAgentCookie } from '#/features/analytics/day-map/day-map-agent-cookie'
import { listAgentsForDayMapFn } from '#/features/analytics/day-map/dayMapFns'
import { requireAuthOrRedirect } from '#/features/auth/require-auth'
import { DashboardAgentAlertsPanel } from '#/features/dashboard/DashboardAgentAlertsPanel'
import { DashboardAgentDevicesPanel } from '#/features/dashboard/DashboardAgentDevicesPanel'
import {
  getDashboardAgentAlertsPreviewFn,
  getDashboardAgentOverviewFn,
} from '#/features/dashboard/dashboardAgentFns'

export const Route = createFileRoute('/')({
  beforeLoad: () => requireAuthOrRedirect(),
  component: DashboardHome,
})

function DashboardHome() {
  const listAgents = useServerFn(listAgentsForDayMapFn)
  const loadOverview = useServerFn(getDashboardAgentOverviewFn)
  const loadAlertsPreview = useServerFn(getDashboardAgentAlertsPreviewFn)

  const agentsQuery = useQuery({
    queryKey: ['dashboard-agents'],
    queryFn: () => listAgents(),
  })

  const [overrideAgentId, setOverrideAgentId] = useState<string | null>(null)
  const agents = agentsQuery.data?.ok ? agentsQuery.data.agents : []

  const selectedAgentId = useMemo(() => {
    if (agents.length === 0) return null
    const ids = new Set(agents.map((a) => a.id))
    if (overrideAgentId && ids.has(overrideAgentId)) return overrideAgentId
    const fromCookie = readDayMapAgentCookie()
    if (fromCookie && ids.has(fromCookie)) return fromCookie
    return agents[0]!.id
  }, [agents, overrideAgentId])

  useEffect(() => {
    if (agents.length === 0 || !selectedAgentId) return
    const c = readDayMapAgentCookie()
    const cValid = Boolean(c && agents.some((a) => a.id === c))
    if (cValid) return
    writeDayMapAgentCookie(selectedAgentId)
  }, [agents, selectedAgentId])

  const onAgentChange = useCallback((value: string) => {
    writeDayMapAgentCookie(value)
    setOverrideAgentId(value)
  }, [])

  const overviewQuery = useQuery({
    queryKey: ['dashboard-agent-overview', selectedAgentId],
    queryFn: () => loadOverview({ data: { agentId: selectedAgentId! } }),
    enabled: Boolean(selectedAgentId),
  })

  const alertsPreviewQuery = useQuery({
    queryKey: ['dashboard-agent-alerts-preview', selectedAgentId],
    queryFn: () => loadAlertsPreview({ data: { agentId: selectedAgentId! } }),
    enabled: Boolean(selectedAgentId),
  })

  const overview = overviewQuery.data?.ok ? overviewQuery.data : null
  const alertsPreview = alertsPreviewQuery.data?.ok ? alertsPreviewQuery.data : null

  const agentRow =
    overview?.agent != null
      ? {
          status: overview.agent.status,
          lastSeenAt: overview.agent.lastSeenAt,
        }
      : null

  const lastReportDisplay =
    overview?.lastReport != null
      ? formatCzechDateTime(overview.lastReport.reportedAt ?? overview.lastReport.receivedAt)
      : null

  const agentSelect = (
    <div className="min-w-[12rem] w-full flex-1">
      {agentsQuery.isLoading ? (
        <div className="h-9 w-full animate-pulse rounded-md bg-muted" aria-hidden />
      ) : agents.length === 0 ? (
        <p className="text-xs text-muted-foreground">Žádní agenti v databázi.</p>
      ) : selectedAgentId ? (
        <Select value={selectedAgentId} onValueChange={onAgentChange}>
          <SelectTrigger id="dashboard-agent" aria-label="Vyberte agenta">
            <SelectValue placeholder="Vyberte agenta" />
          </SelectTrigger>
          <SelectContent>
            {agents.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
    </div>
  )

  return (
    <DashboardShell>
      <DashboardPageShell
        title="Přehled"
        description="Stav vybraného agenta, zařízení z posledního hlášení a nevyřešená upozornění."
        headerEnd={<div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:max-w-md">{agentSelect}</div>}
      >
        <div className="space-y-6">
          {selectedAgentId && overviewQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Načítání přehledu agenta…</p>
          ) : null}

          {overviewQuery.data && !overviewQuery.data.ok ? (
            <p className="text-sm text-destructive" role="alert">
              {overviewQuery.data.message}
            </p>
          ) : null}

          {overviewQuery.isError ? (
            <p className="text-sm text-destructive" role="alert">
              Nepodařilo se načíst přehled agenta.
            </p>
          ) : null}

          {overview?.agent != null && agentRow ? (
            <Card>
              <CardContent className="py-4">
                <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 sm:gap-x-3">
                  <span className="min-w-0 truncate text-base font-semibold text-foreground">
                    {overview.agent.name}
                  </span>
                  <span className="text-muted-foreground select-none" aria-hidden>
                    ·
                  </span>
                  <AgentLiveStatusCell row={agentRow} />
                  <span className="text-muted-foreground select-none" aria-hidden>
                    ·
                  </span>
                  {overview.lastReport ? (
                    <time
                      className="shrink-0 text-sm tabular-nums text-muted-foreground"
                      dateTime={new Date(
                        overview.lastReport.reportedAt ?? overview.lastReport.receivedAt,
                      ).toISOString()}
                    >
                      {lastReportDisplay}
                    </time>
                  ) : (
                    <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                      Zatím žádné hlášení
                    </span>
                  )}
                </div>
                {overview.agent.locationLabel ? (
                  <p className="mt-1.5 truncate text-xs text-muted-foreground">
                    {overview.agent.locationLabel}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {selectedAgentId ? (
            <DashboardAgentDevicesPanel
              isLoading={overviewQuery.isLoading}
              connectedCount={overview?.lastReport?.connectedCount ?? 0}
              totalIdentified={overview?.totalIdentifiedDevices ?? 0}
              devices={overview?.connectedDevices ?? []}
            />
          ) : null}

          {selectedAgentId ? (
            <>
              {alertsPreviewQuery.data && !alertsPreviewQuery.data.ok ? (
                <p className="text-sm text-destructive" role="alert">
                  {alertsPreviewQuery.data.message}
                </p>
              ) : null}
              {alertsPreviewQuery.isError ? (
                <p className="text-sm text-destructive" role="alert">
                  Nepodařilo se načíst upozornění.
                </p>
              ) : null}
              <DashboardAgentAlertsPanel
                agentId={selectedAgentId}
                isLoading={alertsPreviewQuery.isLoading}
                alerts={alertsPreview?.alerts ?? []}
                totalUnresolved={alertsPreview?.totalUnresolved ?? 0}
              />
            </>
          ) : null}
        </div>
      </DashboardPageShell>
    </DashboardShell>
  )
}
