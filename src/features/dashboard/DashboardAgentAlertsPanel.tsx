import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { formatCzechDateTime } from '#/features/admin/admin-list/constants'
import {
  dashboardAlertSeverityLabel,
  dashboardAlertTypeLabel,
} from '#/features/dashboard/dashboard-alert-labels'
import { cn } from '#/lib/utils'

export type DashboardAlertPreviewRow = {
  id: string
  title: string
  message: string | null
  severity: string
  type: string
  createdAt: Date
}

type DashboardAgentAlertsPanelProps = {
  agentId: string
  isLoading: boolean
  alerts: DashboardAlertPreviewRow[]
  totalUnresolved: number
}

export function DashboardAgentAlertsPanel({
  agentId,
  isLoading,
  alerts,
  totalUnresolved,
}: DashboardAgentAlertsPanelProps) {
  const shown = alerts.length
  const hasMore = totalUnresolved > shown

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <CardTitle className="text-base">Upozornění</CardTitle>
          {!isLoading && totalUnresolved === 0 ? (
            <p className="text-sm text-muted-foreground">Žádná nevyřešená upozornění.</p>
          ) : null}
          {!isLoading && totalUnresolved > 0 ? (
            <p className="text-sm text-muted-foreground">
              Nevyřešených celkem:{' '}
              <span className="font-semibold tabular-nums text-foreground">{totalUnresolved}</span>
              {hasMore ? (
                <>
                  {' '}
                  (zobrazeno prvních{' '}
                  <span className="font-semibold tabular-nums text-foreground">{shown}</span>)
                </>
              ) : null}
            </p>
          ) : null}
        </div>
        <Button type="button" variant="outline" size="icon" className="shrink-0" asChild>
          <Link
            to="/admin/$resource"
            params={{ resource: 'alerts' }}
            search={{ agentId, resolved: 'no' }}
            aria-label="Otevřít upozornění v administraci"
          >
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Načítání…</p>
        ) : alerts.length === 0 ? null : (
          <ul className="divide-y divide-border rounded-lg border border-border bg-card/40">
            {alerts.map((a) => (
              <li key={a.id} className="px-3 py-3 first:rounded-t-lg last:rounded-b-lg">
                <p className="font-medium text-foreground">{a.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  <span>{dashboardAlertTypeLabel(a.type)}</span>
                  <span className="text-muted-foreground/80" aria-hidden>
                    {' · '}
                  </span>
                  <span>{dashboardAlertSeverityLabel(a.severity)}</span>
                  <span className="text-muted-foreground/80" aria-hidden>
                    {' · '}
                  </span>
                  <time
                    className="tabular-nums"
                    dateTime={new Date(a.createdAt).toISOString()}
                  >
                    {formatCzechDateTime(a.createdAt)}
                  </time>
                </p>
                {a.message ? (
                  <p className={cn('mt-2 text-sm text-muted-foreground', 'line-clamp-3')}>{a.message}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
