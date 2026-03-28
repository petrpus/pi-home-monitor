import { timingSafeEqual } from 'node:crypto'
import {
  clearSession,
  getSession,
  updateSession,
} from '@tanstack/react-start/server'
import type { SessionConfig } from '@tanstack/react-start/server'

export type AdminSessionData = {
  admin?: boolean
}

export function getAdminSessionConfig(): SessionConfig {
  const password = process.env.SESSION_SECRET
  if (!password || password.length < 32) {
    throw new Error(
      'SESSION_SECRET is required and must be at least 32 characters (see .env.example).',
    )
  }

  return {
    name: 'admin',
    password,
    cookie: {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    },
    maxAge: 60 * 60 * 24 * 7,
  }
}

export function getAdminPasswordFromEnv(): string {
  const p = process.env.ADMIN_PASSWORD
  if (!p || p.length < 8) {
    throw new Error('ADMIN_PASSWORD is required and must be at least 8 characters.')
  }
  return p
}

export function safeEqualString(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'utf8')
  const bb = Buffer.from(b, 'utf8')
  if (ab.length !== bb.length) {
    return false
  }
  return timingSafeEqual(ab, bb)
}

export class AdminAuthError extends Error {
  readonly code = 'UNAUTHORIZED' as const
  constructor() {
    super('UNAUTHORIZED')
    this.name = 'AdminAuthError'
  }
}

export async function assertAdminSession(): Promise<void> {
  const session = await getSession<AdminSessionData>(getAdminSessionConfig())
  if (!session.data?.admin) {
    throw new AdminAuthError()
  }
}

export async function clearAdminSessionCookie(): Promise<void> {
  await clearSession(getAdminSessionConfig())
}

export async function setAdminSession(): Promise<void> {
  await updateSession<AdminSessionData>(getAdminSessionConfig(), { admin: true })
}
