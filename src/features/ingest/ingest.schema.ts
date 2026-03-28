import * as z from 'zod'
import { DeviceKind } from '../../../generated/prisma/client'

/** Treat missing, null, and whitespace-only strings as absent (scanners often send ""). */
function emptyToUndefined(value: unknown): unknown {
  if (value === undefined || value === null) {
    return undefined
  }
  if (typeof value !== 'string') {
    return value
  }
  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed
}

const optionalString = z.preprocess(
  emptyToUndefined,
  z.string().min(1).max(255).optional(),
)

const optionalMacAddress = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .regex(/^([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}$/, 'Invalid MAC address format')
    .optional(),
)

const networkDeviceSchema = z
  .object({
    macAddress: optionalMacAddress,
    ipAddress: optionalString,
    hostname: optionalString,
    name: optionalString,
    vendor: optionalString,
  })
  .strict()

const bluetoothKindSchema = z
  .enum(['BLE', 'BLUETOOTH', 'ble', 'bluetooth'])
  .optional()

const bluetoothDeviceSchema = z
  .object({
    macAddress: optionalMacAddress,
    name: optionalString,
    rssi: z.number().int().min(-200).max(50).optional(),
    vendor: optionalString,
    kind: bluetoothKindSchema,
  })
  .strict()

export const ingestRequestSchema = z
  .object({
    reportedAt: z.iso.datetime().optional(),
    payloadVersion: z.preprocess(
      emptyToUndefined,
      z.string().min(1).max(32).optional(),
    ),
    networkDevices: z.array(networkDeviceSchema).default([]),
    bluetoothDevices: z.array(bluetoothDeviceSchema).default([]),
  })
  .strict()

export type IngestRequestInput = z.infer<typeof ingestRequestSchema>

export function normalizeMacAddress(macAddress?: string): string | undefined {
  if (!macAddress) {
    return undefined
  }

  return macAddress.replaceAll('-', ':').toUpperCase()
}

export function normalizeBluetoothKind(kind?: string): typeof DeviceKind.BLE | typeof DeviceKind.BLUETOOTH {
  if (!kind) {
    return DeviceKind.BLE
  }

  return kind.toUpperCase() === DeviceKind.BLUETOOTH ? DeviceKind.BLUETOOTH : DeviceKind.BLE
}
