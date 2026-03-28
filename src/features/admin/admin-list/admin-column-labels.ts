/**
 * Czech table header labels for admin lists. Sort keys and API fields stay English.
 * When Prisma/schema adds new list columns, add an entry here (see project Czech UI rule).
 */
const LABELS: Record<string, string> = {
  // Alerts
  title: "Název",
  type: "Typ",
  severity: "Závažnost",
  message: "Zpráva",
  isResolved: "Vyřešeno",
  resolvedAt: "Čas vyřešení",
  agentId: "Identifikátor agenta",
  deviceId: "Identifikátor zařízení",

  // Agents
  name: "Jméno",
  locationLabel: "Popisek umístění",
  status: "Stav",
  apiKeyHash: "Otisk klíče",

  // Devices
  kind: "Druh",
  primaryMac: "Hlavní MAC",
  normalizedName: "Normalizovaný název",
  vendor: "Výrobce",
  firstSeenAt: "Poprvé viděno",

  // Raw reports
  rawReportId: "Hlášení",
  payloadVersion: "Verze datové části",
  payload: "Datová část (JSON)",

  // Shared / relations
  id: "Identifikátor",
  createdAt: "Vytvořeno",
  updatedAt: "Upraveno",
  lastSeenAt: "Naposledy viděno",
  observedAt: "Pozorováno",
  receivedAt: "Přijato",
  reportedAt: "Nahlášeno",
  agent: "Agent",
  device: "Zařízení",
  rawReport: "Hlášení",

  // Possible flattened / helper fields
  agentName: "Jméno agenta",
  deviceCount: "Počet zařízení",
}

/**
 * Last-resort label for new schema fields: readable hint without English sentences.
 */
function unknownColumnLabel(fieldKey: string): string {
  const spaced = fieldKey.replace(/([A-Z])/g, " $1").replace(/^\s+/, "")
  return `Sloupec „${spaced}“`
}

export function adminColumnLabel(fieldKey: string): string {
  return LABELS[fieldKey] ?? unknownColumnLabel(fieldKey)
}
