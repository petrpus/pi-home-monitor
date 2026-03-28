import { PRESENCE_SEP } from './day-map.presence'

export type DayMapMatrixProps = {
  reports: { id: string; at: string }[]
  devices: { id: string; label: string; kind: string }[]
  presence: string[]
  timeZone: string
}

function formatTimeLabel(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat('cs-CZ', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso))
}

export function DayMapMatrix({ reports, devices, presence, timeZone }: DayMapMatrixProps) {
  const pres = new Set(presence)
  const hasCell = (deviceId: string, reportId: string) => pres.has(`${deviceId}${PRESENCE_SEP}${reportId}`)

  const filled = presence.length
  const total = devices.length * reports.length
  const summary =
    total === 0
      ? 'Žádná hlášení ani zařízení pro zvolený den.'
      : `Tabulka: ${devices.length} zařízení, ${reports.length} hlášení, ${filled} z ${total} políček s pozorováním.`

  if (reports.length === 0) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        Pro tento den nejsou u tohoto agenta žádná hlášení.
      </p>
    )
  }

  if (devices.length === 0) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        V hlášeních nejsou žádná normalizovaná zařízení.
      </p>
    )
  }

  return (
    <div
      className="overflow-x-auto rounded-xl border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      tabIndex={0}
      aria-label="Mřížka přítomnosti zařízení v hlášeních"
    >
      <table className="w-max min-w-full border-collapse text-sm">
        <caption className="sr-only">{summary}</caption>
        <thead>
          <tr>
            <th
              scope="col"
              className="sticky left-0 z-20 min-w-[10rem] max-w-[14rem] border border-border bg-card/95 px-2 py-2 text-left text-xs font-medium text-muted-foreground backdrop-blur-sm"
            >
              Zařízení
            </th>
            {reports.map((r) => (
              <th
                key={r.id}
                scope="col"
                className="min-w-[2.75rem] border border-border bg-card/95 px-1 py-2 text-center text-xs font-medium tabular-nums text-muted-foreground backdrop-blur-sm"
              >
                <span className="block rotate-0 whitespace-nowrap">{formatTimeLabel(r.at, timeZone)}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {devices.map((dev) => (
            <tr key={dev.id} className="border-border">
              <th
                scope="row"
                className="sticky left-0 z-10 min-w-[10rem] max-w-[14rem] border border-border bg-card px-2 py-1.5 text-left align-middle"
              >
                <span className="block truncate font-medium text-foreground" title={dev.label}>
                  {dev.label}
                </span>
                <span className="block truncate text-xs text-muted-foreground">{dev.kind}</span>
              </th>
              {reports.map((r) => {
                const on = hasCell(dev.id, r.id)
                return (
                  <td
                    key={r.id}
                    className={`border border-border p-0 text-center align-middle ${
                      on
                        ? 'bg-primary/25 ring-1 ring-inset ring-primary/35'
                        : 'bg-card ring-1 ring-inset ring-border'
                    }`}
                  >
                    <span className="sr-only">{on ? 'V hlášení' : 'Chybí'}</span>
                    <div className="mx-auto min-h-9 w-full min-w-[2.5rem]" aria-hidden />
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
