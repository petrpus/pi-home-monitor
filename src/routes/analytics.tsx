import { createFileRoute, Outlet } from '@tanstack/react-router'
import { DashboardShell } from '#/components/dashboard-shell'
import { requireAuthOrRedirect } from '#/features/auth/require-auth'

export const Route = createFileRoute('/analytics')({
  beforeLoad: () => requireAuthOrRedirect(),
  component: AnalyticsLayout,
})

function AnalyticsLayout() {
  return (
    <DashboardShell>
      <Outlet />
    </DashboardShell>
  )
}
