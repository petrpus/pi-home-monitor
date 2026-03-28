import { Bluetooth, HelpCircle, Radio, Wifi } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "#/lib/utils"

/** Wire/API values — must stay aligned with Prisma `DeviceKind` (do not import Prisma in client bundles). */
const DEVICE_KIND_VALUES = ["NETWORK", "BLUETOOTH", "BLE", "UNKNOWN"] as const
type DeviceKindValue = (typeof DEVICE_KIND_VALUES)[number]

const KIND_UI: Record<
  DeviceKindValue,
  { Icon: LucideIcon; label: string; iconClass: string }
> = {
  NETWORK: {
    Icon: Wifi,
    label: "Síť",
    iconClass: "text-[var(--lagoon)]",
  },
  BLUETOOTH: {
    Icon: Bluetooth,
    label: "Bluetooth",
    iconClass: "text-[var(--lagoon-deep)]",
  },
  BLE: {
    Icon: Radio,
    label: "BLE",
    iconClass: "text-[var(--lagoon)]",
  },
  UNKNOWN: {
    Icon: HelpCircle,
    label: "Neznámé",
    iconClass: "text-muted-foreground",
  },
}

function asDeviceKind(value: unknown): DeviceKindValue {
  if (typeof value !== "string") return "UNKNOWN"
  return (DEVICE_KIND_VALUES as readonly string[]).includes(value)
    ? (value as DeviceKindValue)
    : "UNKNOWN"
}

export function DeviceKindCell({ kind }: { kind: unknown }) {
  const key = asDeviceKind(kind)
  const cfg = KIND_UI[key]
  const { Icon, label, iconClass } = cfg
  return (
    <span
      className="inline-flex max-w-full items-center gap-1.5 font-sans text-xs text-foreground"
      title={label}
    >
      <Icon className={cn("h-4 w-4 shrink-0", iconClass)} aria-hidden />
      <span className="truncate">{label}</span>
    </span>
  )
}
