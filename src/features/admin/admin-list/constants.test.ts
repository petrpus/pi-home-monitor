import { describe, expect, it } from "vitest"
import { DEVICE_TABLE_COLUMNS, pickColumns } from "#/features/admin/admin-list/constants"

describe("pickColumns", () => {
  it("orders device columns with DEVICE_TABLE_COLUMNS and omits hidden fields", () => {
    const row = {
      id: "d1",
      normalizedName: "Hub",
      kind: "NETWORK",
      primaryMac: "AA:BB:CC:DD:EE:FF",
      lastIpAddress: "10.0.0.1",
      lastRssi: null,
      vendor: "Acme",
      nameUserSet: false,
      firstSeenAt: new Date(),
      lastSeenAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const cols = pickColumns([row], "devices")
    expect(cols).toEqual([...DEVICE_TABLE_COLUMNS])
    expect(cols).not.toContain("nameUserSet")
    expect(cols).not.toContain("createdAt")
  })

  it("drops device columns missing on the row", () => {
    const row = { id: "d1", normalizedName: null, kind: "BLE", primaryMac: "11:22:33:44:55:66" }
    const cols = pickColumns([row], "devices")
    expect(cols).toEqual(["normalizedName", "kind", "primaryMac"])
  })
})
