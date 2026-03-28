import type { DeviceKind } from '../../../../generated/prisma/client'

const KIND_LABEL: Record<DeviceKind, string> = {
  NETWORK: 'Síť',
  BLUETOOTH: 'Bluetooth',
  BLE: 'BLE',
  UNKNOWN: 'Neznámé',
}

export function deviceKindLabel(kind: DeviceKind): string {
  return KIND_LABEL[kind] ?? kind
}

export function deviceRowLabel(device: {
  normalizedName: string | null
  primaryMac: string | null
}): string {
  const n = device.normalizedName?.trim()
  if (n) return n
  if (device.primaryMac) return device.primaryMac
  return '—'
}
