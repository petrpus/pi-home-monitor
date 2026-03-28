import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { DeviceKindCell } from '#/features/admin/admin-list/DeviceKindCell'
import { cn } from '#/lib/utils'

/** Skloňování „aktivní“ u počtu zařízení (např. 1 aktivní, 6 aktivních). */
function czechAktivniDevices(n: number): 'aktivní' | 'aktivních' {
  const m100 = n % 100
  if (m100 >= 11 && m100 <= 14) return 'aktivních'
  const m10 = n % 10
  if (m10 === 1) return 'aktivní'
  if (m10 >= 2 && m10 <= 4) return 'aktivní'
  return 'aktivních'
}

export type DashboardConnectedDevice = {
  deviceId: string
  label: string
  kind: string
  ipAddress: string | null
  rssi: number | null
  macAddress: string | null
}

type DashboardAgentDevicesPanelProps = {
  isLoading: boolean
  connectedCount: number
  totalIdentified: number
  devices: DashboardConnectedDevice[]
}

export function DashboardAgentDevicesPanel({
  isLoading,
  connectedCount,
  totalIdentified,
  devices,
}: DashboardAgentDevicesPanelProps) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <CardTitle className="text-base">Zařízení</CardTitle>
          {!isLoading ? (
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold tabular-nums text-foreground">{connectedCount}</span>{' '}
              {czechAktivniDevices(connectedCount)} /{' '}
              <span className="font-semibold tabular-nums text-foreground">{totalIdentified}</span> celkem
            </p>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Načítání…</p>
        ) : devices.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            V posledním hlášení nejsou žádná zařízení.
          </p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {devices.map((d) => (
              <li
                key={d.deviceId}
                className={cn(
                  'rounded-lg border border-border bg-card/80 p-3 shadow-sm',
                  'min-w-0',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate font-medium text-foreground" title={d.label}>
                    {d.label}
                  </p>
                  <DeviceKindCell kind={d.kind} />
                </div>
                {d.ipAddress ? (
                  <p className="mt-1 truncate font-mono text-xs text-muted-foreground" title={d.ipAddress}>
                    IP {d.ipAddress}
                  </p>
                ) : null}
                {d.macAddress ? (
                  <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground" title={d.macAddress}>
                    MAC {d.macAddress}
                  </p>
                ) : null}
                {typeof d.rssi === 'number' ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">RSSI {d.rssi} dBm</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
