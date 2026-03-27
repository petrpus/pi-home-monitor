import type { Agent } from '../../../generated/prisma/client'
import { authenticateAgentByApiKey } from '#/features/agents/agent-auth.server'
import { ingestRequestSchema } from '#/features/ingest/ingest.schema'
import { ingestAgentReport } from '#/features/ingest/ingest.service'

type HandlerDeps = {
  authenticateAgentByApiKey: (apiKey: string) => Promise<Agent | null>
  ingestAgentReport: typeof ingestAgentReport
}

const defaultDeps: HandlerDeps = {
  authenticateAgentByApiKey,
  ingestAgentReport,
}

export async function handleIngestPost(
  request: Request,
  deps: HandlerDeps = defaultDeps,
): Promise<Response> {
  const apiKey = request.headers.get('x-api-key')
  if (!apiKey) {
    return Response.json(
      { ok: false, error: 'UNAUTHORIZED', message: 'Missing x-api-key header' },
      { status: 401 },
    )
  }

  const agent = await deps.authenticateAgentByApiKey(apiKey)
  if (!agent) {
    return Response.json({ ok: false, error: 'UNAUTHORIZED', message: 'Invalid API key' }, { status: 401 })
  }

  let requestBody: unknown
  try {
    requestBody = await request.json()
  } catch {
    return Response.json({ ok: false, error: 'INVALID_JSON', message: 'Invalid JSON body' }, { status: 400 })
  }

  const parsedPayload = ingestRequestSchema.safeParse(requestBody)
  if (!parsedPayload.success) {
    return Response.json(
      {
        ok: false,
        error: 'INVALID_PAYLOAD',
        issues: parsedPayload.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          code: issue.code,
          message: issue.message,
        })),
      },
      { status: 400 },
    )
  }

  try {
    return Response.json(await deps.ingestAgentReport({ agentId: agent.id, payload: parsedPayload.data }))
  } catch (error) {
    console.error('Ingest failed', {
      agentId: agent.id,
      message: error instanceof Error ? error.message : String(error),
    })
    return Response.json({ ok: false, error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
