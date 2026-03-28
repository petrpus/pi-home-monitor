import { describe, expect, it } from 'vitest'
import {
  agentIdSchema,
  calendarDaySchema,
  dayMapDataInputSchema,
  reportCalendarInputSchema,
} from './day-map.schema'

describe('agentIdSchema', () => {
  it('accepts short seed-style ids', () => {
    expect(agentIdSchema.parse('dev-local-agent')).toBe('dev-local-agent')
  })

  it('rejects empty string', () => {
    expect(agentIdSchema.safeParse('').success).toBe(false)
  })

  it('rejects ids longer than 128 chars', () => {
    expect(agentIdSchema.safeParse('x'.repeat(129)).success).toBe(false)
  })
})

describe('calendarDaySchema', () => {
  it('accepts YYYY-MM-DD', () => {
    expect(calendarDaySchema.parse('2025-03-28')).toBe('2025-03-28')
  })

  it('rejects non-padded month/day', () => {
    expect(calendarDaySchema.safeParse('2025-3-8').success).toBe(false)
  })
})

describe('reportCalendarInputSchema', () => {
  it('parses valid payload', () => {
    const data = reportCalendarInputSchema.parse({
      agentId: 'dev-local-agent',
      timeZone: 'Europe/Prague',
    })
    expect(data).toEqual({ agentId: 'dev-local-agent', timeZone: 'Europe/Prague' })
  })

  it('rejects invalid agentId', () => {
    expect(
      reportCalendarInputSchema.safeParse({ agentId: '', timeZone: 'UTC' }).success,
    ).toBe(false)
  })
})

describe('dayMapDataInputSchema', () => {
  it('parses valid payload', () => {
    const data = dayMapDataInputSchema.parse({
      agentId: 'dev-local-agent',
      timeZone: 'UTC',
      date: '2025-06-15',
    })
    expect(data).toEqual({
      agentId: 'dev-local-agent',
      timeZone: 'UTC',
      date: '2025-06-15',
    })
  })

  it('rejects invalid calendar day', () => {
    expect(
      dayMapDataInputSchema.safeParse({
        agentId: 'a',
        timeZone: 'UTC',
        date: '15-06-2025',
      }).success,
    ).toBe(false)
  })
})
