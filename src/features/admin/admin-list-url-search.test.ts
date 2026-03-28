import { describe, expect, it } from 'vitest'
import { parseAdminListSearch } from './admin-list-url-search'

describe('parseAdminListSearch', () => {
  it('returns empty defaults for empty raw', () => {
    expect(parseAdminListSearch({})).toEqual({})
  })

  it('parses non-empty agentId', () => {
    expect(parseAdminListSearch({ agentId: 'cuid123' })).toEqual({ agentId: 'cuid123' })
  })

  it('ignores empty agentId string', () => {
    expect(parseAdminListSearch({ agentId: '' })).toEqual({})
  })

  it('parses resolved when valid', () => {
    expect(parseAdminListSearch({ resolved: 'no' })).toEqual({ resolved: 'no' })
    expect(parseAdminListSearch({ resolved: 'yes' })).toEqual({ resolved: 'yes' })
    expect(parseAdminListSearch({ resolved: 'all' })).toEqual({ resolved: 'all' })
  })

  it('ignores invalid resolved', () => {
    expect(parseAdminListSearch({ resolved: 'maybe' })).toEqual({})
    expect(parseAdminListSearch({ resolved: true })).toEqual({})
  })

  it('combines agentId and resolved', () => {
    expect(parseAdminListSearch({ agentId: 'a1', resolved: 'no' })).toEqual({
      agentId: 'a1',
      resolved: 'no',
    })
  })
})
