import { describe, expect, it } from 'vitest'
import { DeviceKind } from '../../../generated/prisma/client'
import {
  ingestRequestSchema,
  normalizeBluetoothKind,
  normalizeMacAddress,
} from './ingest.schema'

describe('ingestRequestSchema', () => {
  it('defaults missing device arrays to empty', () => {
    const parsed = ingestRequestSchema.parse({})
    expect(parsed.networkDevices).toEqual([])
    expect(parsed.bluetoothDevices).toEqual([])
  })

  it('rejects invalid mac address format', () => {
    const parsed = ingestRequestSchema.safeParse({
      networkDevices: [{ macAddress: 'bad-mac' }],
    })

    expect(parsed.success).toBe(false)
  })

  it('rejects invalid reportedAt datetime', () => {
    const parsed = ingestRequestSchema.safeParse({
      reportedAt: 'not-a-date',
    })

    expect(parsed.success).toBe(false)
  })

  it('rejects invalid rssi range', () => {
    const parsed = ingestRequestSchema.safeParse({
      bluetoothDevices: [{ rssi: -999 }],
    })

    expect(parsed.success).toBe(false)
  })

  it('rejects unknown top-level fields (strict object)', () => {
    const parsed = ingestRequestSchema.safeParse({
      unknownField: 'value',
    })

    expect(parsed.success).toBe(false)
  })

  it('accepts empty-string optional fields as absent (scanner payloads)', () => {
    const parsed = ingestRequestSchema.safeParse({
      networkDevices: [
        {
          macAddress: 'AA:BB:CC:DD:EE:FF',
          hostname: '',
          name: '   ',
          vendor: '',
        },
      ],
    })

    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.networkDevices[0].hostname).toBeUndefined()
      expect(parsed.data.networkDevices[0].name).toBeUndefined()
      expect(parsed.data.networkDevices[0].vendor).toBeUndefined()
    }
  })
})

describe('normalizers', () => {
  it('normalizes mac address to uppercase colon format', () => {
    expect(normalizeMacAddress('aa-bb-cc-dd-ee-ff')).toBe('AA:BB:CC:DD:EE:FF')
  })

  it('normalizes bluetooth kind values', () => {
    expect(normalizeBluetoothKind('bluetooth')).toBe(DeviceKind.BLUETOOTH)
    expect(normalizeBluetoothKind('ble')).toBe(DeviceKind.BLE)
  })
})
