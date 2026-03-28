import { describe, expect, it } from 'vitest'
import { dedupePresence, presenceKey } from './day-map.presence'

describe('presenceKey', () => {
  it('joins ids with separator', () => {
    expect(presenceKey('dev1', 'rep1')).toBe('dev1\trep1')
  })
})

describe('dedupePresence', () => {
  it('dedupes duplicate pairs', () => {
    const out = dedupePresence([
      { deviceId: 'a', rawReportId: 'r1' },
      { deviceId: 'a', rawReportId: 'r1' },
      { deviceId: 'b', rawReportId: 'r1' },
    ])
    expect(out).toEqual(['a\tr1', 'b\tr1'])
  })
})
