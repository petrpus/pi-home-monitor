import { useEffect, useState } from "react"
import { Button } from "#/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "#/components/ui/dialog"
import { Input } from "#/components/ui/input"
import { Label } from "#/components/ui/label"

export function DeviceNameEditDialog({
  open,
  onOpenChange,
  row,
  onSave,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  row: Record<string, unknown> | null
  onSave: (payload: { normalizedName: string | null }) => void
}) {
  const [value, setValue] = useState("")

  useEffect(() => {
    if (!open || !row) return
    const n = row.normalizedName
    setValue(typeof n === "string" ? n : "")
  }, [open, row])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upravit název zařízení</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2 py-1">
          <Label htmlFor="device-display-name">Název</Label>
          <Input
            id="device-display-name"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Volitelný název"
            autoComplete="off"
          />
          <p className="text-xs text-muted-foreground">
            Po uložení agent při dalších hlášeních tento název nepřepíše. Prázdné pole znovu povolí název z agenta.
          </p>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Zrušit
          </Button>
          <Button
            type="button"
            onClick={() => {
              const trimmed = value.trim()
              onSave({ normalizedName: trimmed.length > 0 ? trimmed : null })
            }}
          >
            Uložit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
