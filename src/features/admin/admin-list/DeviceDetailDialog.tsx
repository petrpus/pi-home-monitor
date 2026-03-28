import { Button } from "#/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "#/components/ui/dialog"
import { DeviceKindCell } from "#/features/admin/admin-list/DeviceKindCell"
import { adminColumnLabel } from "#/features/admin/admin-list/admin-column-labels"
import { formatCell } from "#/features/admin/admin-list/constants"

/** All device scalar fields for the detail view (order). */
const DEVICE_DETAIL_FIELDS = [
  "id",
  "kind",
  "primaryMac",
  "normalizedName",
  "nameUserSet",
  "vendor",
  "lastIpAddress",
  "lastRssi",
  "firstSeenAt",
  "lastSeenAt",
  "createdAt",
  "updatedAt",
] as const

export function DeviceDetailDialog({
  open,
  onOpenChange,
  row,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  row: Record<string, unknown> | null
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Detail zařízení</DialogTitle>
        </DialogHeader>
        {row ? (
          <dl className="grid gap-3 py-1 text-sm">
            {DEVICE_DETAIL_FIELDS.map((key) => {
              const raw = row[key]
              const label = adminColumnLabel(key)
              return (
                <div key={key} className="grid gap-1">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="min-w-0 font-mono text-xs text-foreground">
                    {key === "kind" ? (
                      <DeviceKindCell kind={raw} />
                    ) : (
                      formatCell(raw, key)
                    )}
                  </dd>
                </div>
              )
            })}
          </dl>
        ) : null}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Zavřít
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
