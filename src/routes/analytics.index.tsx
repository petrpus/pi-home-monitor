import { createFileRoute, Link } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'

export const Route = createFileRoute('/analytics/')({
  component: AnalyticsHub,
})

function AnalyticsHub() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="display-title text-3xl font-bold">Analytika</h1>
      <p className="text-muted-foreground">Vyberte oblast.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Link to="/analytics/day-map" className="no-underline">
          <Card className="h-full transition-colors hover:border-primary">
            <CardHeader>
              <CardTitle className="text-base">Mapa dne</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Přítomnost zařízení v hlášeních podle dne
            </CardContent>
          </Card>
        </Link>
        <Link to="/analytics/$section" params={{ section: 'network' }} className="no-underline">
          <Card className="h-full transition-colors hover:border-primary">
            <CardHeader>
              <CardTitle className="text-base">Síť</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">Brzy</CardContent>
          </Card>
        </Link>
        <Link to="/analytics/$section" params={{ section: 'bluetooth' }} className="no-underline">
          <Card className="h-full transition-colors hover:border-primary">
            <CardHeader>
              <CardTitle className="text-base">Bluetooth</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">Brzy</CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
