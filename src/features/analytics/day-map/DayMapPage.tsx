import { useServerFn } from '@tanstack/react-start'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { DashboardPageShell } from '#/components/dashboard-page-shell'
import { Button } from '#/components/ui/button'
import { Calendar } from '#/components/ui/calendar'
import { Label } from '#/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '#/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import {
  getAgentReportCalendarFn,
  getDayMapDataFn,
  listAgentsForDayMapFn,
} from './dayMapFns'
import { readDayMapAgentCookie, writeDayMapAgentCookie } from './day-map-agent-cookie'
import { formatYmdInTimeZone, zonedNoonDate } from './day-map.dates'
import { DayMapMatrix } from './DayMapMatrix'

function prevEnabledDate(selected: string, sortedAsc: string[]): string | null {
  const before = sortedAsc.filter((d) => d < selected)
  return before.length > 0 ? before[before.length - 1]! : null
}

function nextEnabledDate(selected: string, sortedAsc: string[]): string | null {
  return sortedAsc.find((d) => d > selected) ?? null
}

export function DayMapPage() {
  const timeZone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC',
    [],
  )

  const listAgents = useServerFn(listAgentsForDayMapFn)
  const loadCalendar = useServerFn(getAgentReportCalendarFn)
  const loadDay = useServerFn(getDayMapDataFn)

  const agentsQuery = useQuery({
    queryKey: ['day-map-agents'],
    queryFn: () => listAgents(),
  })

  /** Explicit user choice; `null` = derive from cookie or first agent. */
  const [overrideAgentId, setOverrideAgentId] = useState<string | null>(null)
  const [selectedYmd, setSelectedYmd] = useState<string>(() => formatYmdInTimeZone(new Date(), timeZone))

  const agents = agentsQuery.data?.ok ? agentsQuery.data.agents : []

  const selectedAgentId = useMemo(() => {
    if (agents.length === 0) return null
    const ids = new Set(agents.map((a) => a.id))
    if (overrideAgentId && ids.has(overrideAgentId)) return overrideAgentId
    const fromCookie = readDayMapAgentCookie()
    if (fromCookie && ids.has(fromCookie)) return fromCookie
    return agents[0]!.id
  }, [agents, overrideAgentId])

  useEffect(() => {
    if (agents.length === 0 || !selectedAgentId) return
    const c = readDayMapAgentCookie()
    const cValid = Boolean(c && agents.some((a) => a.id === c))
    if (cValid) return
    writeDayMapAgentCookie(selectedAgentId)
  }, [agents, selectedAgentId])

  const calendarQuery = useQuery({
    queryKey: ['day-map-calendar', selectedAgentId, timeZone],
    queryFn: () =>
      loadCalendar({
        data: { agentId: selectedAgentId!, timeZone },
      }),
    enabled: Boolean(selectedAgentId),
  })

  const sortedAsc = useMemo(() => {
    const dates = calendarQuery.data?.ok ? calendarQuery.data.dates : []
    return [...dates].sort((a, b) => a.localeCompare(b))
  }, [calendarQuery.data])

  const allowedSet = useMemo(() => new Set(sortedAsc), [sortedAsc])

  const dayQuery = useQuery({
    queryKey: ['day-map-day', selectedAgentId, timeZone, selectedYmd],
    queryFn: () =>
      loadDay({
        data: { agentId: selectedAgentId!, timeZone, date: selectedYmd },
      }),
    enabled: Boolean(selectedAgentId),
  })

  const onAgentChange = useCallback((value: string) => {
    writeDayMapAgentCookie(value)
    setOverrideAgentId(value)
  }, [])

  const goPrev = useCallback(() => {
    const p = prevEnabledDate(selectedYmd, sortedAsc)
    if (p) setSelectedYmd(p)
  }, [selectedYmd, sortedAsc])

  const goNext = useCallback(() => {
    const n = nextEnabledDate(selectedYmd, sortedAsc)
    if (n) setSelectedYmd(n)
  }, [selectedYmd, sortedAsc])

  const canPrev = Boolean(prevEnabledDate(selectedYmd, sortedAsc))
  const canNext = Boolean(nextEnabledDate(selectedYmd, sortedAsc))

  const dayError =
    dayQuery.error instanceof Error
      ? dayQuery.error.message
      : dayQuery.error
        ? String(dayQuery.error)
        : null

  return (
    <DashboardPageShell
      title="Mapa dne"
      description="Přítomnost zařízení v jednotlivých hlášeních vybraného dne (podle časového pásma prohlížeče)."
    >
      <div className="island-shell flex min-w-0 flex-col gap-4 rounded-xl p-4 md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="min-w-[12rem] flex-1 space-y-2">
            <Label htmlFor="day-map-agent">Agent</Label>
            {agentsQuery.isLoading ? (
              <div
                className="h-9 w-full animate-pulse rounded-md bg-muted"
                aria-hidden
              />
            ) : agents.length === 0 ? (
              <p className="text-xs text-muted-foreground">Žádní agenti v databázi.</p>
            ) : selectedAgentId ? (
              <Select value={selectedAgentId} onValueChange={onAgentChange}>
                <SelectTrigger id="day-map-agent" aria-label="Vyberte agenta">
                  <SelectValue placeholder="Vyberte agenta" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Předchozí den s hlášením"
              disabled={!selectedAgentId || !canPrev}
              onClick={goPrev}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="min-w-[11rem] tabular-nums"
                  disabled={!selectedAgentId || calendarQuery.isLoading}
                  aria-label="Otevřít kalendář"
                >
                  {selectedYmd}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  timeZone={timeZone}
                  selected={zonedNoonDate(selectedYmd, timeZone)}
                  onSelect={(d) => {
                    if (!d) return
                    setSelectedYmd(formatYmdInTimeZone(d, timeZone))
                  }}
                  disabled={(day) => !allowedSet.has(formatYmdInTimeZone(day, timeZone))}
                />
              </PopoverContent>
            </Popover>

            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Následující den s hlášením"
              disabled={!selectedAgentId || !canNext}
              onClick={goNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {calendarQuery.data && !calendarQuery.data.ok ? (
          <p className="text-sm text-destructive" role="alert">
            {calendarQuery.data.message}
          </p>
        ) : null}

        {dayQuery.data && !dayQuery.data.ok ? (
          <p className="text-sm text-destructive" role="alert">
            {dayQuery.data.message}
          </p>
        ) : null}

        {dayQuery.isError ? (
          <p className="text-sm text-destructive" role="alert">
            Nepodařilo se načíst data mapy dne{dayError ? `: ${dayError}` : '.'}
          </p>
        ) : null}

        {selectedAgentId && dayQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Načítání dat…</p>
        ) : null}

        {selectedAgentId && dayQuery.isSuccess && dayQuery.data?.ok ? (
          <div className="min-w-0 space-y-2">
            <p className="text-xs text-muted-foreground">
              Legenda:{' '}
              <span className="inline-flex items-center gap-1">
                <span className="inline-block size-3 rounded-sm bg-primary/25 ring-1 ring-inset ring-primary/30" />{' '}
                v hlášení
              </span>
              {' · '}
              <span className="inline-flex items-center gap-1">
                <span className="inline-block size-3 rounded-sm bg-card ring-1 ring-inset ring-border" />{' '}
                chybí
              </span>
            </p>
            <DayMapMatrix
              reports={dayQuery.data.reports}
              devices={dayQuery.data.devices}
              presence={dayQuery.data.presence}
              timeZone={timeZone}
            />
          </div>
        ) : null}
      </div>
    </DashboardPageShell>
  )
}
