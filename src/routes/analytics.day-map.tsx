import { createFileRoute } from '@tanstack/react-router'
import { DayMapPage } from '#/features/analytics/day-map/DayMapPage'

export const Route = createFileRoute('/analytics/day-map')({
  component: DayMapRoute,
})

function DayMapRoute() {
  return <DayMapPage />
}
