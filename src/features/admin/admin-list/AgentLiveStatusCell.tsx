import { getAgentActivityPresence } from "#/features/agents/agent-activity"
import { cn } from "#/lib/utils"

const LABELS: Record<ReturnType<typeof getAgentActivityPresence>, string> = {
  live: "Aktivní",
  stale: "Neaktivní",
  disabled: "Zakázáno",
}

export function AgentLiveStatusCell({ row }: { row: Record<string, unknown> }) {
  const dbStatus = String(row.status ?? "")
  const presence = getAgentActivityPresence(dbStatus, row.lastSeenAt)

  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        aria-hidden
        className={cn(
          "inline-block size-2.5 shrink-0 rounded-full border border-black/15 dark:border-white/15",
          "shadow-[inset_0_1px_2px_rgba(255,255,255,0.55),inset_0_-1px_2px_rgba(0,0,0,0.12),0_2px_5px_rgba(0,0,0,0.2),0_1px_0_rgba(255,255,255,0.15)]",
          presence === "live" &&
            "bg-emerald-500 shadow-[inset_0_1px_2px_rgba(255,255,255,0.5),inset_0_-1px_2px_rgba(0,0,0,0.15),0_2px_6px_rgba(16,185,129,0.55),0_1px_0_rgba(255,255,255,0.2)]",
          presence === "stale" &&
            "bg-red-500 shadow-[inset_0_1px_2px_rgba(255,255,255,0.45),inset_0_-1px_2px_rgba(0,0,0,0.2),0_2px_6px_rgba(239,68,68,0.5),0_1px_0_rgba(255,255,255,0.12)]",
          presence === "disabled" &&
            "bg-zinc-400 dark:bg-zinc-500 shadow-[inset_0_1px_2px_rgba(255,255,255,0.4),inset_0_-1px_2px_rgba(0,0,0,0.12),0_2px_5px_rgba(0,0,0,0.18)]",
        )}
      />
      <span className="font-medium text-foreground">{LABELS[presence]}</span>
    </span>
  )
}
