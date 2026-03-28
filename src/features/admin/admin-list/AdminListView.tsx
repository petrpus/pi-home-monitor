import { useServerFn } from "@tanstack/react-start"
import { useMutation, useQuery } from "@tanstack/react-query"
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Undo2,
  X,
} from "lucide-react"
import { useEffect, useLayoutEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { DashboardShell } from "#/components/dashboard-shell"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "#/components/ui/alert-dialog"
import { Button } from "#/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card"
import { Checkbox } from "#/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu"
import { Input } from "#/components/ui/input"
import { Label } from "#/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "#/components/ui/table"
import { RESOURCE_TITLE } from "#/features/admin/admin-resource-copy"
import { adminListFn, adminMutateFn } from "#/features/admin/adminApiFns"
import type { AdminResourceKey, MutateBody } from "#/features/admin/admin-types"
import { adminColumnLabel } from "#/features/admin/admin-list/admin-column-labels"
import {
  ADMIN_DELETE_ONLY,
  ADMIN_SYSTEM_GENERATED_ONLY,
  READ_ONLY,
  formatCell,
  pickColumns,
} from "#/features/admin/admin-list/constants"
import { AgentLiveStatusCell } from "#/features/admin/admin-list/AgentLiveStatusCell"
import { DeviceDetailDialog } from "#/features/admin/admin-list/DeviceDetailDialog"
import { DeviceKindCell } from "#/features/admin/admin-list/DeviceKindCell"
import { DeviceNameEditDialog } from "#/features/admin/admin-list/DeviceNameEditDialog"
import { EntityFormDialog } from "#/features/admin/admin-list/EntityFormDialog"
import { cn } from "#/lib/utils"
import {
  readAdminListPrefs,
  writeAdminListPrefs,
} from "#/features/admin/admin-list/admin-list-preferences-cookie"

/** 1 položka, 2–4 položky (except 12–14), otherwise položek. */
function czechPoložkaForm(n: number): "položka" | "položky" | "položek" {
  const m100 = n % 100
  if (m100 >= 11 && m100 <= 14) return "položek"
  const m10 = n % 10
  if (m10 === 1) return "položka"
  if (m10 >= 2 && m10 <= 4) return "položky"
  return "položek"
}

const PAGE_SIZE_OPTIONS: { value: number; label: string }[] = [
  { value: 10, label: "10" },
  { value: 20, label: "20" },
  { value: 50, label: "50" },
  { value: 100, label: "Vše" },
]

export function AdminEntityListPage({ resource }: { resource: AdminResourceKey }) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(20)
  const [sortBy, setSortBy] = useState<string | undefined>()
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const [search, setSearch] = useState("")
  const [searchDraft, setSearchDraft] = useState("")
  const [filterResolved, setFilterResolved] = useState<"all" | "yes" | "no">("all")
  const [filterAgentStatus, setFilterAgentStatus] = useState<"all" | "ONLINE" | "OFFLINE" | "DISABLED">("all")
  const [filterDeviceKind, setFilterDeviceKind] = useState<"all" | "NETWORK" | "BLUETOOTH" | "BLE" | "UNKNOWN">("all")
  const [filterDeviceAgentId, setFilterDeviceAgentId] = useState<"all" | string>("all")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkOpen, setBulkOpen] = useState(false)
  const [editRow, setEditRow] = useState<Record<string, unknown> | null>(null)
  const [deviceNameEditRow, setDeviceNameEditRow] = useState<Record<string, unknown> | null>(null)
  const [deviceDetailRow, setDeviceDetailRow] = useState<Record<string, unknown> | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  useEffect(() => {
    setSelected(new Set())
    setBulkOpen(false)
  }, [resource])
  useLayoutEffect(() => {
    const p = readAdminListPrefs(resource)
    setSortBy(p.sortBy)
    setSortDir(p.sortDir)
    setSearch(p.search)
    setSearchDraft(p.search)
    setPageSize(p.pageSize)
    setFilterResolved(p.filterResolved)
    setFilterAgentStatus(p.filterAgentStatus)
    setFilterDeviceKind(p.filterDeviceKind)
    setFilterDeviceAgentId(p.filterDeviceAgentId)
    setPage(1)
  }, [resource])
  useEffect(() => {
    const t = window.setTimeout(() => {
      writeAdminListPrefs(resource, {
        sortBy,
        sortDir,
        search,
        pageSize,
        filterResolved,
        filterAgentStatus,
        filterDeviceKind,
        filterDeviceAgentId,
      })
    }, 0)
    return () => window.clearTimeout(t)
  }, [
    resource,
    sortBy,
    sortDir,
    search,
    pageSize,
    filterResolved,
    filterAgentStatus,
    filterDeviceKind,
    filterDeviceAgentId,
  ])
  const listFn = useServerFn(adminListFn)
  const mutateFn = useServerFn(adminMutateFn)
  const filters = useMemo(() => {
    const f: {
      isResolved?: "all" | "yes" | "no"
      agentStatus?: "all" | "ONLINE" | "OFFLINE" | "DISABLED"
      deviceKind?: "all" | "NETWORK" | "BLUETOOTH" | "BLE" | "UNKNOWN"
      deviceAgentId?: string
    } = {}
    if (resource === "alerts" && filterResolved !== "all") f.isResolved = filterResolved
    if (resource === "agents" && filterAgentStatus !== "all") f.agentStatus = filterAgentStatus
    if (resource === "devices" && filterDeviceKind !== "all") f.deviceKind = filterDeviceKind
    if (resource === "devices" && filterDeviceAgentId !== "all") f.deviceAgentId = filterDeviceAgentId
    return Object.keys(f).length ? f : undefined
  }, [resource, filterResolved, filterAgentStatus, filterDeviceKind, filterDeviceAgentId])
  const query = useQuery({
    queryKey: ["admin-list", resource, page, pageSize, sortBy, sortDir, search, filters],
    queryFn: () =>
      listFn({
        data: { resource, page, pageSize, sortBy, sortDir, search: search || undefined, filters },
      }),
  })
  const agentsForDeviceFilterQuery = useQuery({
    queryKey: ["admin-list", "agents", "device-filter-picker"],
    queryFn: () =>
      listFn({
        data: {
          resource: "agents",
          page: 1,
          pageSize: 100,
          sortBy: "name",
          sortDir: "asc",
        },
      }),
    enabled: resource === "devices",
  })
  const mutate = useMutation({
    mutationFn: async (body: MutateBody) => {
      const toastId = body.clientOperationId ?? crypto.randomUUID()
      toast.loading("Probíhá operace…", { id: toastId })
      const res = await mutateFn({ data: body })
      if (res.ok)
        toast.success("Operace dokončena", { id: toastId, description: `Číslo operace: ${res.operationId}` })
      else toast.error("Operace selhala", { id: toastId, description: `${res.message} (${res.operationId})` })
      return res
    },
    onSettled: () => { void query.refetch(); setSelected(new Set()) },
  })
  const rows = (query.data?.ok && query.data.rows ? query.data.rows : []) as object[]
  const total = query.data?.ok ? query.data.total : 0
  const selectedUnresolvedAlertIds = useMemo(() => {
    if (resource !== "alerts") return []
    const byId = new Map<string, Record<string, unknown>>()
    for (const row of rows) {
      const rec = row as Record<string, unknown>
      byId.set(String(rec.id ?? ""), rec)
    }
    const out: string[] = []
    for (const id of selected) {
      const rec = byId.get(id)
      if (rec === undefined) out.push(id)
      else if (rec.isResolved !== true) out.push(id)
    }
    return out
  }, [resource, rows, selected])
  const cols = pickColumns(rows, resource)
  const readOnly = READ_ONLY.includes(resource)
  const deleteOnly = ADMIN_DELETE_ONLY.includes(resource)
  const showRowActions = !readOnly
  const showCreateEdit = showRowActions && !deleteOnly
  const showManualCreate = showCreateEdit && !ADMIN_SYSTEM_GENERATED_ONLY.includes(resource)
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const toggleSort = (col: string) => {
    if (sortBy === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else { setSortBy(col); setSortDir("desc") }
  }
  const searchActive = search.length > 0
  const clearSearch = () => {
    setSearch("")
    setSearchDraft("")
    setPage(1)
  }
  const colSpan = Math.max(cols.length, 1) + (showRowActions ? 2 : 0)
  return (
    <DashboardShell activeResource={resource}>
      <div className="mx-auto max-w-[1400px] space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="display-title text-2xl font-bold text-foreground md:text-3xl">{RESOURCE_TITLE[resource]}</h1>
            <p className="text-sm text-muted-foreground">
              Stránka {page} / {totalPages}, celkem {total} {czechPoložkaForm(total)}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <div className="flex flex-wrap items-end gap-2">
              <div className="flex flex-row items-center gap-2">
                <Label htmlFor="admin-page-size" className="shrink-0 text-muted-foreground">
                  Řádků
                </Label>
                <Select
                  value={String(pageSize)}
                  onValueChange={(v) => {
                    setPageSize(Number(v))
                    setPage(1)
                  }}
                >
                  <SelectTrigger id="admin-page-size" className="h-9 w-[5.5rem]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={String(opt.value)}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  disabled={page <= 1}
                  aria-label="První stránka"
                  onClick={() => setPage(1)}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  disabled={page <= 1}
                  aria-label="Předchozí stránka"
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  disabled={page >= totalPages}
                  aria-label="Další stránka"
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  disabled={page >= totalPages}
                  aria-label="Poslední stránka"
                  onClick={() => setPage(totalPages)}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <CardTitle className="text-base">Filtry</CardTitle>
            <div className="flex flex-wrap gap-2">
              {showManualCreate ? (
                <Button type="button" size="sm" className="gap-1" onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4" />Nový
                </Button>
              ) : null}
              {showRowActions && resource === "alerts" && selectedUnresolvedAlertIds.length > 0 ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    void mutate.mutateAsync({
                      operation: "bulkResolve",
                      resource: "alerts",
                      ids: selectedUnresolvedAlertIds,
                      clientOperationId: crypto.randomUUID(),
                    })
                  }}
                >
                  Vyřešit ({selectedUnresolvedAlertIds.length})
                </Button>
              ) : null}
              {showRowActions && selected.size > 0 ? (
                <Button type="button" size="sm" variant="destructive" onClick={() => setBulkOpen(true)}>
                  Smazat ({selected.size})
                </Button>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-8 py-1.5 sm:flex-row sm:flex-wrap sm:items-end">
              <div className="flex min-w-[200px] flex-1 flex-col gap-1">
                <Label htmlFor="search">Hledat</Label>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative min-w-[160px] flex-1">
                    <Input
                      id="search"
                      className={cn(searchActive && "pr-9")}
                      value={searchDraft}
                      onChange={(e) => setSearchDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && searchDraft.trim()) {
                          setSearch(searchDraft)
                          setPage(1)
                        }
                      }}
                    />
                    {searchActive ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0.5 top-1/2 h-8 w-8 -translate-y-1/2 shrink-0"
                        aria-label="Zrušit vyhledávání"
                        onClick={clearSearch}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!searchDraft.trim()}
                    onClick={() => { setSearch(searchDraft); setPage(1) }}
                  >
                    Hledat
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 sm:gap-4">
                {resource === "alerts" ? (
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="admin-filter-resolved">Vyřešeno</Label>
                    <Select
                      value={filterResolved}
                      onValueChange={(v) => {
                        setFilterResolved(v as typeof filterResolved)
                        setPage(1)
                      }}
                    >
                      <SelectTrigger id="admin-filter-resolved" className="w-[min(100%,11rem)]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Vše</SelectItem>
                        <SelectItem value="yes">Ano</SelectItem>
                        <SelectItem value="no">Ne</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}
                {resource === "agents" ? (
                  <div className="flex min-w-0 flex-col gap-1">
                    <Label htmlFor="admin-filter-agent-status">Stav (podle hlášení)</Label>
                    <Select
                      value={filterAgentStatus}
                      onValueChange={(v) => {
                        setFilterAgentStatus(v as typeof filterAgentStatus)
                        setPage(1)
                      }}
                    >
                      <SelectTrigger id="admin-filter-agent-status" className="w-full min-w-[14rem] max-w-[min(100vw-2rem,22rem)]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Vše</SelectItem>
                        <SelectItem value="ONLINE">Aktivní (hlášení do 24 h)</SelectItem>
                        <SelectItem value="OFFLINE">Neaktivní (bez hlášení 24 h)</SelectItem>
                        <SelectItem value="DISABLED">Zakázáno</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}
                {resource === "devices" ? (
                  <>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="admin-filter-device-agent">Agent</Label>
                      <Select
                        value={filterDeviceAgentId}
                        disabled={agentsForDeviceFilterQuery.isLoading}
                        onValueChange={(v) => {
                          setFilterDeviceAgentId(v)
                          setPage(1)
                        }}
                      >
                        <SelectTrigger id="admin-filter-device-agent" className="min-w-[12rem] w-[min(100%,18rem)]">
                          <SelectValue placeholder={agentsForDeviceFilterQuery.isLoading ? "Načítání…" : "Vše"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Vše</SelectItem>
                          {agentsForDeviceFilterQuery.data?.ok && agentsForDeviceFilterQuery.data.rows
                            ? (agentsForDeviceFilterQuery.data.rows as { id: string; name: string }[]).map((a) => (
                                <SelectItem key={a.id} value={a.id}>
                                  {a.name}
                                </SelectItem>
                              ))
                            : null}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="admin-filter-device-kind">Typ</Label>
                      <Select
                        value={filterDeviceKind}
                        onValueChange={(v) => {
                          setFilterDeviceKind(v as typeof filterDeviceKind)
                          setPage(1)
                        }}
                      >
                        <SelectTrigger id="admin-filter-device-kind" className="w-[min(100%,11rem)]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Vše</SelectItem>
                          <SelectItem value="NETWORK">Síť</SelectItem>
                          <SelectItem value="BLUETOOTH">BT</SelectItem>
                          <SelectItem value="BLE">BLE</SelectItem>
                          <SelectItem value="UNKNOWN">Neznámé</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader><TableRow>
                  {showRowActions ? (
                    <TableHead className="w-10">
                      <Checkbox checked={rows.length > 0 && selected.size === rows.length} onCheckedChange={(c) => { if (c === true) setSelected(new Set(rows.map((r) => String((r as Record<string, unknown>).id)))); else setSelected(new Set()) }} aria-label="Vše" />
                    </TableHead>
                  ) : null}
                  {cols.map((c) => (
                    <TableHead key={c}>
                      <button
                        type="button"
                        className="font-medium hover:underline"
                        onClick={() => {
                          toggleSort(c)
                          setPage(1)
                        }}
                      >
                        {adminColumnLabel(c)}
                        {sortBy === c ? (sortDir === "asc" ? " ^" : " v") : ""}
                      </button>
                    </TableHead>
                  ))}
                  {showRowActions ? <TableHead className="text-right w-12">Akce</TableHead> : null}
                </TableRow></TableHeader>
                <TableBody>
                  {query.isLoading ? <TableRow><TableCell colSpan={colSpan}>Načítání…</TableCell></TableRow> : null}
                  {!query.isLoading && !rows.length ? <TableRow><TableCell colSpan={colSpan}>Žádné záznamy</TableCell></TableRow> : null}
                  {rows.map((row) => {
                    const rec = row as Record<string, unknown>
                    const id = String(rec.id ?? "")
                    return (
                      <TableRow key={id}>
                        {showRowActions ? (
                          <TableCell>
                            <Checkbox checked={selected.has(id)} onCheckedChange={(c) => { setSelected((prev) => { const n = new Set(prev); if (c === true) n.add(id); else n.delete(id); return n }) }} />
                          </TableCell>
                        ) : null}
                        {cols.map((c) => (
                          <TableCell
                            key={c}
                            className={cn(
                              "max-w-[240px] truncate text-xs",
                              resource === "agents" && c === "status"
                                ? "font-sans"
                                : resource === "devices" && c === "kind"
                                  ? "font-sans"
                                  : "font-mono",
                            )}
                          >
                            {resource === "agents" && c === "status" ? (
                              <AgentLiveStatusCell row={rec} />
                            ) : resource === "devices" && c === "kind" ? (
                              <DeviceKindCell kind={rec.kind} />
                            ) : (
                              formatCell(rec[c], c)
                            )}
                          </TableCell>
                        ))}
                        {showRowActions ? (
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button type="button" variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {resource === "devices" ? (
                                  <DropdownMenuItem className="gap-2" onClick={() => setDeviceDetailRow(rec)}>
                                    <Eye className="h-4 w-4" />
                                    Zobrazit detail
                                  </DropdownMenuItem>
                                ) : null}
                                {showCreateEdit && resource === "devices" ? (
                                  <DropdownMenuItem
                                    className="gap-2"
                                    onClick={() => setDeviceNameEditRow(rec)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                    Upravit název
                                  </DropdownMenuItem>
                                ) : null}
                                {showCreateEdit && resource !== "devices" ? (
                                  <DropdownMenuItem className="gap-2" onClick={() => setEditRow(rec)}><Pencil className="h-4 w-4" />Upravit</DropdownMenuItem>
                                ) : null}
                                {resource === "alerts" && rec.isResolved !== true ? (
                                  <DropdownMenuItem
                                    className="gap-2"
                                    onClick={() => {
                                      void mutate.mutateAsync({
                                        operation: "update",
                                        resource: "alerts",
                                        id,
                                        payload: { isResolved: true },
                                        clientOperationId: crypto.randomUUID(),
                                      })
                                    }}
                                  >
                                    <CheckCircle2 className="h-4 w-4" />
                                    Vyřešit
                                  </DropdownMenuItem>
                                ) : null}
                                {resource === "alerts" && rec.isResolved === true ? (
                                  <DropdownMenuItem
                                    className="gap-2"
                                    onClick={() => {
                                      void mutate.mutateAsync({
                                        operation: "update",
                                        resource: "alerts",
                                        id,
                                        payload: { isResolved: false },
                                        clientOperationId: crypto.randomUUID(),
                                      })
                                    }}
                                  >
                                    <Undo2 className="h-4 w-4" />
                                    Zrušit vyřešení
                                  </DropdownMenuItem>
                                ) : null}
                                {showCreateEdit ? <DropdownMenuSeparator /> : null}
                                <DropdownMenuItem className="gap-2 text-destructive" onClick={() => { void mutate.mutateAsync({ operation: "delete", resource, id, clientOperationId: crypto.randomUUID() }) }}><Trash2 className="h-4 w-4" />Smazat</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        ) : null}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
      <AlertDialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Smazat vybrané?</AlertDialogTitle>
          <AlertDialogDescription>
            {resource === "rawReports"
              ? `Nevratná akce. Počet: ${selected.size}. U hlášení se smažou i navázaná pozorování a upozornění z tohoto hlášení.`
              : `Nevratná akce. Počet: ${selected.size}`}
          </AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Zrušit</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => { void mutate.mutateAsync({ operation: "bulkDelete", resource, ids: [...selected], clientOperationId: crypto.randomUUID() }); setBulkOpen(false) }}>Smazat</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {showManualCreate ? (
        <EntityFormDialog open={createOpen} onOpenChange={setCreateOpen} mode="create" resource={resource} row={null} onSubmit={(payload) => { void mutate.mutateAsync({ operation: "create", resource, payload, clientOperationId: crypto.randomUUID() }); setCreateOpen(false) }} />
      ) : null}
      {showCreateEdit ? (
        <EntityFormDialog open={Boolean(editRow)} onOpenChange={(o) => !o && setEditRow(null)} mode="update" resource={resource} row={editRow} onSubmit={(payload) => { if (!editRow?.id) return; void mutate.mutateAsync({ operation: "update", resource, id: String(editRow.id), payload, clientOperationId: crypto.randomUUID() }); setEditRow(null) }} />
      ) : null}
      {resource === "devices" ? (
        <DeviceDetailDialog
          open={Boolean(deviceDetailRow)}
          onOpenChange={(o) => !o && setDeviceDetailRow(null)}
          row={deviceDetailRow}
        />
      ) : null}
      {showCreateEdit && resource === "devices" ? (
        <DeviceNameEditDialog
          open={Boolean(deviceNameEditRow)}
          onOpenChange={(o) => !o && setDeviceNameEditRow(null)}
          row={deviceNameEditRow}
          onSave={(payload) => {
            if (!deviceNameEditRow?.id) return
            void mutate.mutateAsync({
              operation: "update",
              resource: "devices",
              id: String(deviceNameEditRow.id),
              payload,
              clientOperationId: crypto.randomUUID(),
            })
            setDeviceNameEditRow(null)
          }}
        />
      ) : null}
    </DashboardShell>
  )
}
