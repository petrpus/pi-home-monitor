/** @vitest-environment jsdom */
import { afterEach, describe, expect, it } from 'vitest'
import { readAdminListPrefs, writeAdminListPrefs } from './admin-list-preferences-cookie'

const COOKIE = 'phm_admin_list_prefs='

describe('admin-list-preferences-cookie', () => {
  afterEach(() => {
    document.cookie = `${COOKIE}; Max-Age=0; Path=/`
  })

  it('returns defaults when cookie missing', () => {
    expect(readAdminListPrefs('alerts')).toMatchObject({
      sortDir: 'desc',
      pageSize: 20,
      filterResolved: 'all',
      filterAlertAgentId: 'all',
    })
  })

  it('round-trips filterAlertAgentId for alerts', () => {
    writeAdminListPrefs('alerts', {
      ...readAdminListPrefs('alerts'),
      filterAlertAgentId: 'agent-embed-1',
    })
    expect(readAdminListPrefs('alerts').filterAlertAgentId).toBe('agent-embed-1')
  })

  it('stores per-resource slices without clobbering other resources', () => {
    writeAdminListPrefs('alerts', {
      ...readAdminListPrefs('alerts'),
      filterAlertAgentId: 'only-alerts',
    })
    writeAdminListPrefs('devices', {
      ...readAdminListPrefs('devices'),
      filterDeviceKind: 'BLE',
    })
    expect(readAdminListPrefs('alerts').filterAlertAgentId).toBe('only-alerts')
    expect(readAdminListPrefs('devices').filterDeviceKind).toBe('BLE')
    expect(readAdminListPrefs('devices').filterAlertAgentId).toBe('all')
  })
})
