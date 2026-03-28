import { createFileRoute } from '@tanstack/react-router'
import { AdminEntityListPage } from '#/features/admin/AdminEntityListPage'
import { adminResourceKeySchema } from '#/features/admin/admin-types'
import { requireAuthOrRedirect } from '#/features/auth/require-auth'

export const Route = createFileRoute('/admin/$resource')({
  beforeLoad: () => requireAuthOrRedirect(),
  component: AdminResourceRoute,
})

function AdminResourceRoute() {
  const { resource } = Route.useParams()
  const parsed = adminResourceKeySchema.safeParse(resource)
  if (!parsed.success) {
    return (
      <div className="p-6">
        <p className="text-destructive">Neznamy typ: {resource}</p>
      </div>
    )
  }
  return <AdminEntityListPage resource={parsed.data} />
}
