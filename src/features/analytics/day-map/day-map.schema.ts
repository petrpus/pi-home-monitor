import * as z from 'zod'

/** IANA time zone name; validated again against pg_timezone_names on the server. */
export const ianaTimeZoneSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[A-Za-z0-9_/.+-]+$/)

export const calendarDaySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

/** Prisma `Agent.id` is arbitrary string (seed uses short ids like `dev-local-agent`). */
export const agentIdSchema = z.string().min(1).max(128)

export const listAgentsDayMapInputSchema = z.object({})

export const reportCalendarInputSchema = z.object({
  agentId: agentIdSchema,
  timeZone: ianaTimeZoneSchema,
})

export const dayMapDataInputSchema = z.object({
  agentId: agentIdSchema,
  timeZone: ianaTimeZoneSchema,
  date: calendarDaySchema,
})
