-- CreateEnum
CREATE TYPE "AgentStatus" AS ENUM ('ONLINE', 'OFFLINE', 'DISABLED');

-- CreateEnum
CREATE TYPE "DeviceKind" AS ENUM ('NETWORK', 'BLUETOOTH', 'BLE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('NEW_DEVICE', 'AGENT_OFFLINE');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "apiKeyHash" TEXT NOT NULL,
    "locationLabel" TEXT,
    "status" "AgentStatus" NOT NULL DEFAULT 'ONLINE',
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RawReport" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reportedAt" TIMESTAMP(3),
    "payloadVersion" TEXT,
    "payload" JSONB NOT NULL,

    CONSTRAINT "RawReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "kind" "DeviceKind" NOT NULL,
    "primaryMac" TEXT,
    "normalizedName" TEXT,
    "vendor" TEXT,
    "firstSeenAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Observation" (
    "id" TEXT NOT NULL,
    "rawReportId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "macAddress" TEXT,
    "hostname" TEXT,
    "bluetoothName" TEXT,
    "rssi" INTEGER,
    "metadata" JSONB,

    CONSTRAINT "Observation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "type" "AlertType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "agentId" TEXT,
    "deviceId" TEXT,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Agent_apiKeyHash_key" ON "Agent"("apiKeyHash");

-- CreateIndex
CREATE INDEX "Agent_status_idx" ON "Agent"("status");

-- CreateIndex
CREATE INDEX "Agent_lastSeenAt_idx" ON "Agent"("lastSeenAt");

-- CreateIndex
CREATE INDEX "RawReport_agentId_receivedAt_idx" ON "RawReport"("agentId", "receivedAt");

-- CreateIndex
CREATE INDEX "RawReport_reportedAt_idx" ON "RawReport"("reportedAt");

-- CreateIndex
CREATE INDEX "Device_kind_idx" ON "Device"("kind");

-- CreateIndex
CREATE INDEX "Device_primaryMac_idx" ON "Device"("primaryMac");

-- CreateIndex
CREATE INDEX "Device_lastSeenAt_idx" ON "Device"("lastSeenAt");

-- CreateIndex
CREATE UNIQUE INDEX "Device_kind_primaryMac_key" ON "Device"("kind", "primaryMac");

-- CreateIndex
CREATE INDEX "Observation_agentId_observedAt_idx" ON "Observation"("agentId", "observedAt");

-- CreateIndex
CREATE INDEX "Observation_deviceId_observedAt_idx" ON "Observation"("deviceId", "observedAt");

-- CreateIndex
CREATE INDEX "Observation_macAddress_idx" ON "Observation"("macAddress");

-- CreateIndex
CREATE INDEX "Observation_ipAddress_idx" ON "Observation"("ipAddress");

-- CreateIndex
CREATE INDEX "Alert_type_createdAt_idx" ON "Alert"("type", "createdAt");

-- CreateIndex
CREATE INDEX "Alert_isResolved_createdAt_idx" ON "Alert"("isResolved", "createdAt");

-- AddForeignKey
ALTER TABLE "RawReport" ADD CONSTRAINT "RawReport_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Observation" ADD CONSTRAINT "Observation_rawReportId_fkey" FOREIGN KEY ("rawReportId") REFERENCES "RawReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Observation" ADD CONSTRAINT "Observation_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Observation" ADD CONSTRAINT "Observation_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE SET NULL ON UPDATE CASCADE;
