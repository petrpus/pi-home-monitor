import { createFileRoute } from '@tanstack/react-router'
import { DashboardShell } from '#/components/dashboard-shell'
import { DayMapPage } from '#/features/analytics/day-map/DayMapPage'
import { requireAuthOrRedirect } from '#/features/auth/require-auth'

export const Route = createFileRoute('/day-map')({
  beforeLoad: () => requireAuthOrRedirect(),
  component: DayMapRoute,
})

function DayMapRoute() {
  return (
    <DashboardShell>
      <DayMapPage />
    </DashboardShell>
  )
}
