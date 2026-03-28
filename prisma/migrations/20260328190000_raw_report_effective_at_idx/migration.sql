-- Expression index for day-map and calendar queries: filter/sort by effective report instant per agent.
CREATE INDEX "RawReport_agent_effective_at_idx" ON "RawReport" ("agentId", (COALESCE("reportedAt", "receivedAt")));
