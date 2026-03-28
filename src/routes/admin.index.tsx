import { createFileRoute, redirect } from '@tanstack/react-router'
import { requireAuthOrRedirect } from '#/features/auth/require-auth'

export const Route = createFileRoute('/admin/')({
  beforeLoad: async () => {
    await requireAuthOrRedirect()
    throw redirect({ to: '/admin/$resource', params: { resource: 'alerts' } })
  },
})
