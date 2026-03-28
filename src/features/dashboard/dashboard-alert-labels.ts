/** Czech UI labels for alert enums (wire values stay English). */
const ALERT_TYPE_LABEL: Record<string, string> = {
  NEW_DEVICE: 'Nové zařízení',
  AGENT_OFFLINE: 'Agent nedostupný',
}

const ALERT_SEVERITY_LABEL: Record<string, string> = {
  INFO: 'Informace',
  WARNING: 'Varování',
  CRITICAL: 'Kritické',
}

export function dashboardAlertTypeLabel(type: string): string {
  return ALERT_TYPE_LABEL[type] ?? type
}

export function dashboardAlertSeverityLabel(severity: string): string {
  return ALERT_SEVERITY_LABEL[severity] ?? severity
}
