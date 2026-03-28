import { createFileRoute } from '@tanstack/react-router'
import { DashboardShell } from '#/components/dashboard-shell'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { requireAuthOrRedirect } from '#/features/auth/require-auth'

const ANALYTICS_SECTION_TITLE: Record<string, string> = {
  network: 'Síť',
  bluetooth: 'Bluetooth',
}

export const Route = createFileRoute('/analytics/$section')({
  beforeLoad: () => requireAuthOrRedirect(),
  component: AnalyticsSection,
})

function AnalyticsSection() {
  const { section } = Route.useParams()
  const sectionTitle = ANALYTICS_SECTION_TITLE[section] ?? section
  return (
    <DashboardShell>
      <Card className="mx-auto max-w-xl">
        <CardHeader>
          <CardTitle>Analytika: {sectionTitle}</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">Tato stránka je zatím prázdná.</CardContent>
      </Card>
    </DashboardShell>
  )
}
