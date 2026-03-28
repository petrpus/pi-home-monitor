# Domain map

## Product intent

**Pi Home Monitor** collects periodic snapshots from **agents** scanning local network and Bluetooth surfaces. The server stores immutable **raw reports**, derives **devices** and **observations**, and records **alerts** when appropriate.

## Core entities (Prisma)

| Model | Meaning |
| --- | --- |
| **Agent** | Registered edge reporter; authenticated by **API key** (stored as SHA-256 **hash** only). Has `status`, `lastSeenAt`, optional `locationLabel`. |
| **RawReport** | One ingest payload per request: `payload` JSON, `reportedAt`, `payloadVersion`, link to agent. |
| **Device** | Stable identity: `kind` (NETWORK, BLUETOOTH, BLE, UNKNOWN) + **`primaryMac`** (unique per kind). `firstSeenAt` / `lastSeenAt`, optional `normalizedName` / `vendor`. **`nameUserSet`**: when `true`, ingest must not overwrite `normalizedName` from the agent payload (admin “edit name” sets this). **`lastIpAddress`**: last IPv4/IPv6 from a network scan (not cleared when a report omits IP). **`lastRssi`**: last RSSI in dBm from Bluetooth/BLE scans. |
| **Observation** | One sighting: links `rawReport`, `agent`, `device`, `observedAt`, plus snapshot fields (IP, hostname, RSSI, etc.). |
| **Alert** | MVP usage: **NEW_DEVICE** when a device row is first created from ingest. |

Enums also include `AgentStatus`, `AlertSeverity`, etc. — see `prisma/schema.prisma`.

## Ingest API

- **POST** `/api/ingest`
- Header: **`x-api-key`**: raw key (trimmed); matched against `hashApiKey(key)` in DB.
- Body: JSON matching `ingestRequestSchema` — `reportedAt` (optional ISO datetime), `payloadVersion`, `networkDevices[]`, `bluetoothDevices[]`.

### Identity and normalization

- **MAC addresses**: optional in payload; normalized to **uppercase colon** form. Entries **without** a MAC after normalization are **skipped** for `Device` / `Observation` (still stored inside raw JSON) to avoid unsafe identity collisions.
- **Bluetooth kind**: string enum normalized to Prisma `DeviceKind` BLE vs BLUETOOTH; default BLE when absent.

### Transactional behavior (ingest)

1. Create `RawReport` with full payload.
2. For each normalized device with MAC: find or create `Device` by `(kind, primaryMac)`; on **create**, set initial `lastIpAddress` / `lastRssi` from the payload when present (same rules as updates) and add **NEW_DEVICE** alert.
3. On **update**, set `normalizedName` from the payload only if **`nameUserSet` is false**; always refresh `vendor`, `lastSeenAt`, and connectivity snapshots: **`lastIpAddress`** when the entry is from a network scan and includes an IP; **`lastRssi`** when the entry is Bluetooth/BLE and includes RSSI (omitting IP/RSSI in a later report does not clear stored values).
4. Create `Observation` per processed device.
5. Update agent `lastSeenAt` to observation time.

## Auth

- Only **disabled** agents are excluded (`status != DISABLED`).
- Use **timing-safe** compare when verifying key material (`agent-auth.server.ts`).

## Glossary

| Term | Definition |
| --- | --- |
| Agent | Pi-side or lab client posting ingest |
| Raw report | Stored JSON exactly as accepted (plus metadata) |
| Observation | Per-device row tied to one report |
| Skipped | Device entries without MAC not normalized into Device/Observation |
