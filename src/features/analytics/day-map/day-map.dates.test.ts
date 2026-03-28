import { describe, expect, it } from 'vitest'
import { formatYmdInTimeZone } from './day-map.dates'

describe('formatYmdInTimeZone', () => {
  it('formats a fixed instant in UTC deterministically', () => {
    const d = new Date('2025-06-15T14:30:00.000Z')
    expect(formatYmdInTimeZone(d, 'UTC')).toBe('2025-06-15')
  })
})
