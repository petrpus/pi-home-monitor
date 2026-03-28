import { redirect } from '@tanstack/react-router'
import { getAuthStateFn } from '#/features/auth/adminAuthFns'

/** Redirects to /login when the admin session cookie is missing. */
export async function requireAuthOrRedirect(): Promise<void> {
  const { authenticated } = await getAuthStateFn()
  if (!authenticated) {
    throw redirect({ to: '/login' })
  }
}
