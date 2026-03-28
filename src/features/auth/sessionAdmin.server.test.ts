import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getAdminPasswordFromEnv,
  getAdminSessionConfig,
  safeEqualString,
} from './sessionAdmin.server'

describe('safeEqualString', () => {
  it('returns true for identical strings', () => {
    expect(safeEqualString('secret', 'secret')).toBe(true)
  })

  it('returns false for different strings of equal length', () => {
    expect(safeEqualString('secret-a', 'secret-b')).toBe(false)
  })

  it('returns false when lengths differ', () => {
    expect(safeEqualString('short', 'longer')).toBe(false)
  })
})

describe('getAdminPasswordFromEnv', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns password when ADMIN_PASSWORD is valid', () => {
    vi.stubEnv('ADMIN_PASSWORD', '12345678')
    expect(getAdminPasswordFromEnv()).toBe('12345678')
  })

  it('throws when ADMIN_PASSWORD is missing', () => {
    vi.stubEnv('ADMIN_PASSWORD', '')
    expect(() => getAdminPasswordFromEnv()).toThrow(/ADMIN_PASSWORD/)
  })

  it('throws when ADMIN_PASSWORD is too short', () => {
    vi.stubEnv('ADMIN_PASSWORD', '1234567')
    expect(() => getAdminPasswordFromEnv()).toThrow(/8/)
  })
})

describe('getAdminSessionConfig', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  const secret32 = 'a'.repeat(32)

  it('returns config when SESSION_SECRET is long enough', () => {
    vi.stubEnv('SESSION_SECRET', secret32)
    const cfg = getAdminSessionConfig()
    expect(cfg.name).toBe('admin')
    expect(cfg.password).toBe(secret32)
    expect(cfg.cookie).toMatchObject({ httpOnly: true })
  })

  it('throws when SESSION_SECRET is missing', () => {
    vi.stubEnv('SESSION_SECRET', '')
    expect(() => getAdminSessionConfig()).toThrow(/SESSION_SECRET/)
  })

  it('throws when SESSION_SECRET is too short', () => {
    vi.stubEnv('SESSION_SECRET', 'x'.repeat(31))
    expect(() => getAdminSessionConfig()).toThrow(/32/)
  })
})
