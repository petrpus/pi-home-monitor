import { createFileRoute } from '@tanstack/react-router'
import { AdminEntityListPage } from '#/features/admin/AdminEntityListPage'
import { parseAdminListSearch } from '#/features/admin/admin-list-url-search'
import { adminResourceKeySchema } from '#/features/admin/admin-types'
import { requireAuthOrRedirect } from '#/features/auth/require-auth'

export const Route = createFileRoute('/admin/$resource')({
  beforeLoad: () => requireAuthOrRedirect(),
  validateSearch: parseAdminListSearch,
  component: AdminResourceRoute,
})

function AdminResourceRoute() {
  const { resource } = Route.useParams()
  const urlSearchDefaults = Route.useSearch()
  const parsed = adminResourceKeySchema.safeParse(resource)
  if (!parsed.success) {
    return (
      <div className="p-6">
        <p className="text-destructive">Neznámý typ: {resource}</p>
      </div>
    )
  }
  return (
    <AdminEntityListPage resource={parsed.data} urlSearchDefaults={urlSearchDefaults} />
  )
}
