import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "#/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "#/components/ui/dialog"
import { Label } from "#/components/ui/label"
import type { AdminResourceKey } from "#/features/admin/admin-types"

export function EntityFormDialog({
  open,
  onOpenChange,
  mode,
  resource,
  row,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  mode: "create" | "update"
  resource: AdminResourceKey
  row: Record<string, unknown> | null
  onSubmit: (payload: Record<string, unknown>) => void
}) {
  const [json, setJson] = useState("{}")

  useEffect(() => {
    if (!open) return
    if (mode === "create") {
      if (resource === "alerts") {
        setJson(JSON.stringify({ type: "NEW_DEVICE", severity: "INFO", title: "Nové upozornění" }, null, 2))
      } else if (resource === "agents") {
        setJson(JSON.stringify({ name: "Agent", apiKey: "change-me-min-8-chars" }, null, 2))
      } else if (resource === "devices") {
        setJson(JSON.stringify({ kind: "NETWORK", primaryMac: "00:11:22:33:44:55" }, null, 2))
      } else setJson("{}")
    } else if (row) {
      const clone = { ...row }
      delete clone.agent
      delete clone.device
      delete clone.rawReport
      if (resource === "alerts") delete clone.agentName
      setJson(JSON.stringify(clone, null, 2))
    }
  }, [open, mode, resource, row])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Nový záznam" : "Upravit záznam"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="payload-json">Formát JSON (ověří server)</Label>
          <textarea
            id="payload-json"
            className="min-h-[200px] w-full rounded-md border border-input bg-transparent p-2 font-mono text-xs"
            value={json}
            onChange={(e) => setJson(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Zrušit
          </Button>
          <Button
            type="button"
            onClick={() => {
              try {
                onSubmit(JSON.parse(json) as Record<string, unknown>)
              } catch {
                toast.error("Neplatný JSON")
              }
            }}
          >
            Uložit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}