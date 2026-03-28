import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useQuery } from '@tanstack/react-query'
import { DashboardPageShell } from '#/components/dashboard-page-shell'
import { DashboardShell } from '#/components/dashboard-shell'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { requireAuthOrRedirect } from '#/features/auth/require-auth'
import { getDashboardStatsFn } from '#/features/admin/adminApiFns'

export const Route = createFileRoute('/')({
  beforeLoad: () => requireAuthOrRedirect(),
  component: DashboardHome,
})

function DashboardHome() {
  const statsFn = useServerFn(getDashboardStatsFn)
  const q = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => statsFn(),
  })
  const s = q.data

  return (
    <DashboardShell>
      <DashboardPageShell title="Přehled" description="Domácí síťový monitoring">
        {q.isLoading ? <p className="text-sm text-muted-foreground">Načítání…</p> : null}
        {s?.ok ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Agenti</CardTitle></CardHeader>
              <CardContent className="text-3xl font-bold">{s.agents}</CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Zařízení</CardTitle></CardHeader>
              <CardContent className="text-3xl font-bold">{s.devices}</CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Otevřená upozornění</CardTitle></CardHeader>
              <CardContent className="text-3xl font-bold">{s.openAlerts}</CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Hlášení 24 h</CardTitle></CardHeader>
              <CardContent className="text-3xl font-bold">{s.reportsLast24h}</CardContent>
            </Card>
          </div>
        ) : null}
      </DashboardPageShell>
    </DashboardShell>
  )
}