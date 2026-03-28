import { fromZonedTime } from 'date-fns-tz'

export function formatYmdInTimeZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

/** Anchor Date for DayPicker / comparisons: noon wall-clock in `timeZone` on `ymd`. */
export function zonedNoonDate(ymd: string, timeZone: string): Date {
  return fromZonedTime(`${ymd}T12:00:00`, timeZone)
}
