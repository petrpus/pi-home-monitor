import { createServerFn } from '@tanstack/react-start'

export const getAuthStateFn = createServerFn({ method: 'GET' }).handler(async () => {
  const { getSession } = await import('@tanstack/react-start/server')
  const sessionMod = await import('#/features/auth/sessionAdmin.server')
  const s = await getSession(sessionMod.getAdminSessionConfig())
  return { authenticated: Boolean(s.data?.admin) }
})

export const loginFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { password: string }) => data)
  .handler(async ({ data }: { data: { password: string } }) => {
    const sessionMod = await import('#/features/auth/sessionAdmin.server')
    const expected = sessionMod.getAdminPasswordFromEnv()
    if (!sessionMod.safeEqualString(data.password, expected)) {
      return { ok: false as const, error: 'invalid_password' }
    }
    await sessionMod.setAdminSession()
    return { ok: true as const }
  })

export const logoutFn = createServerFn({ method: 'POST' }).handler(async () => {
  const sessionMod = await import('#/features/auth/sessionAdmin.server')
  await sessionMod.clearAdminSessionCookie()
  return { ok: true as const }
})
