import {
  AgentStatus,
  AlertSeverity,
  AlertType,
  DeviceKind,
} from '../../../generated/prisma/client'
import { getPrismaClient } from '#/lib/prismaDb'
import {
  type IngestRequestInput,
  normalizeBluetoothKind,
  normalizeMacAddress,
} from './ingest.schema'

type TransactionDb = {
  rawReport: {
    create: (args: {
      data: {
        agentId: string
        reportedAt?: Date
        payloadVersion?: string
        payload: IngestRequestInput
      }
    }) => Promise<{ id: string }>
  }
  device: {
    findUnique: (args: {
      where: { kind_primaryMac: { kind: DeviceKind; primaryMac: string } }
      select: { id: true; nameUserSet: true }
    }) => Promise<{ id: string; nameUserSet: boolean } | null>
    create: (args: {
      data: {
        kind: DeviceKind
        primaryMac: string
        normalizedName?: string
        vendor?: string
        lastIpAddress?: string | null
        lastRssi?: number | null
        firstSeenAt: Date
        lastSeenAt: Date
      }
    }) => Promise<{ id: string }>
    update: (args: {
      where: { id: string }
      data: {
        normalizedName?: string | null
        vendor?: string
        lastSeenAt: Date
        lastIpAddress?: string
        lastRssi?: number
      }
    }) => Promise<{ id: string }>
  }
  observation: {
    create: (args: {
      data: {
        rawReportId: string
        agentId: string
        deviceId: string
        observedAt: Date
        ipAddress?: string
        macAddress?: string
        hostname?: string
        bluetoothName?: string
        rssi?: number
        metadata?: Record<string, unknown>
      }
    }) => Promise<{ id: string }>
  }
  agent: {
    update: (args: {
      where: { id: string }
      data: { lastSeenAt: Date; status: typeof AgentStatus.ONLINE }
    }) => Promise<unknown>
  }
  alert: {
    create: (args: {
      data: {
        type: typeof AlertType.NEW_DEVICE
        severity: typeof AlertSeverity.INFO
        title: string
        message: string
        agentId: string
        deviceId: string
        rawReportId: string
      }
    }) => Promise<{ id: string }>
  }
}

type IngestDb = {
  $transaction: <T>(fn: (tx: TransactionDb) => Promise<T>) => Promise<T>
}

type NormalizedInputDevice = {
  kind: DeviceKind
  macAddress?: string
  name?: string
  vendor?: string
  ipAddress?: string
  hostname?: string
  rssi?: number
  source: 'network' | 'bluetooth'
}

export type IngestResult = {
  ok: true
  agentId: string
  rawReportId: string
  processed: {
    networkDevices: number
    bluetoothDevices: number
    observationsCreated: number
    devicesCreated: number
    devicesUpdated: number
    alertsCreated: number
    skipped: number
  }
}

export function toNormalizedDevices(payload: IngestRequestInput): NormalizedInputDevice[] {
  const networkDevices: NormalizedInputDevice[] = payload.networkDevices.map((device) => ({
    kind: DeviceKind.NETWORK,
    macAddress: normalizeMacAddress(device.macAddress),
    name: device.name,
    vendor: device.vendor,
    ipAddress: device.ipAddress,
    hostname: device.hostname,
    source: 'network',
  }))

  const bluetoothDevices: NormalizedInputDevice[] = payload.bluetoothDevices.map((device) => ({
    kind: normalizeBluetoothKind(device.kind),
    macAddress: normalizeMacAddress(device.macAddress),
    name: device.name,
    vendor: device.vendor,
    rssi: device.rssi,
    source: 'bluetooth',
  }))

  return [...networkDevices, ...bluetoothDevices]
}

export async function ingestAgentReport(
  args: {
    agentId: string
    payload: IngestRequestInput
  },
  db?: IngestDb,
): Promise<IngestResult> {
  const observedAt = args.payload.reportedAt ? new Date(args.payload.reportedAt) : new Date()
  const allDevices = toNormalizedDevices(args.payload)

  const ingestDb = db ?? (getPrismaClient() as unknown as IngestDb)

  return ingestDb.$transaction(async (tx) => {
    const rawReport = await tx.rawReport.create({
      data: {
        agentId: args.agentId,
        reportedAt: observedAt,
        payloadVersion: args.payload.payloadVersion,
        payload: args.payload,
      },
    })

    let observationsCreated = 0
    let devicesCreated = 0
    let devicesUpdated = 0
    let alertsCreated = 0
    let skipped = 0

    for (const inputDevice of allDevices) {
      const macAddress = inputDevice.macAddress
      if (!macAddress) {
        skipped += 1
        continue
      }

      const existingDevice = await tx.device.findUnique({
        where: {
          kind_primaryMac: {
            kind: inputDevice.kind,
            primaryMac: macAddress,
          },
        },
        select: { id: true, nameUserSet: true },
      })

      const connectivity: { lastIpAddress?: string; lastRssi?: number } = {}
      if (inputDevice.source === 'network' && inputDevice.ipAddress) {
        connectivity.lastIpAddress = inputDevice.ipAddress
      }
      if (inputDevice.source === 'bluetooth' && typeof inputDevice.rssi === 'number') {
        connectivity.lastRssi = inputDevice.rssi
      }

      const device = existingDevice
        ? await tx.device.update({
            where: { id: existingDevice.id },
            data: {
              ...(existingDevice.nameUserSet
                ? {}
                : { normalizedName: inputDevice.name }),
              vendor: inputDevice.vendor,
              lastSeenAt: observedAt,
              ...connectivity,
            },
          })
        : await tx.device.create({
            data: {
              kind: inputDevice.kind,
              primaryMac: macAddress,
              normalizedName: inputDevice.name,
              vendor: inputDevice.vendor,
              lastIpAddress:
                inputDevice.source === 'network' && inputDevice.ipAddress
                  ? inputDevice.ipAddress
                  : null,
              lastRssi:
                inputDevice.source === 'bluetooth' && typeof inputDevice.rssi === 'number'
                  ? inputDevice.rssi
                  : null,
              firstSeenAt: observedAt,
              lastSeenAt: observedAt,
            },
          })

      if (existingDevice) {
        devicesUpdated += 1
      } else {
        devicesCreated += 1
        await tx.alert.create({
          data: {
            type: AlertType.NEW_DEVICE,
            severity: AlertSeverity.INFO,
            title: 'New device detected',
            message: `New ${inputDevice.kind.toLowerCase()} device ${macAddress} seen by agent ${args.agentId}.`,
            agentId: args.agentId,
            deviceId: device.id,
            rawReportId: rawReport.id,
          },
        })
        alertsCreated += 1
      }

      await tx.observation.create({
        data: {
          rawReportId: rawReport.id,
          agentId: args.agentId,
          deviceId: device.id,
          observedAt,
          ipAddress: inputDevice.ipAddress,
          macAddress,
          hostname: inputDevice.hostname,
          bluetoothName: inputDevice.source === 'bluetooth' ? inputDevice.name : undefined,
          rssi: inputDevice.rssi,
          metadata: {
            source: inputDevice.source,
          },
        },
      })
      observationsCreated += 1
    }

    await tx.agent.update({
      where: { id: args.agentId },
      data: { lastSeenAt: observedAt, status: AgentStatus.ONLINE },
    })

    return {
      ok: true,
      agentId: args.agentId,
      rawReportId: rawReport.id,
      processed: {
        networkDevices: args.payload.networkDevices.length,
        bluetoothDevices: args.payload.bluetoothDevices.length,
        observationsCreated,
        devicesCreated,
        devicesUpdated,
        alertsCreated,
        skipped,
      },
    }
  })
}
