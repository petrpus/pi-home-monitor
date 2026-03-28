import { getPrismaClient } from '#/lib/prisma.server'
import { hashApiKey } from '#/features/agents/agent-auth.server'
import { DEV_ADD_AGENT_PATH } from '#/features/agents/dev-register-agent.paths'
import { devRegisterAgentFormSchema } from '#/features/agents/dev-register-agent.schema'
import type { Agent } from '../../../generated/prisma/client'

export type DevRegisterAgentDeps = {
  findAgentByApiKeyHash: (apiKeyHash: string) => Promise<Pick<Agent, 'id'> | null>
  createAgent: (data: {
    name: string
    apiKeyHash: string
    locationLabel: string | null
  }) => Promise<Pick<Agent, 'id'>>
}

function defaultDeps(): DevRegisterAgentDeps {
  const prisma = getPrismaClient()
  return {
    findAgentByApiKeyHash: (apiKeyHash) =>
      prisma.agent.findUnique({ where: { apiKeyHash }, select: { id: true } }),
    createAgent: (data) =>
      prisma.agent.create({
        data: {
          name: data.name,
          apiKeyHash: data.apiKeyHash,
          locationLabel: data.locationLabel,
        },
        select: { id: true },
      }),
  }
}

function isDevRegisterEnabled(): boolean {
  return process.env.NODE_ENV !== 'production'
}

function formEntryToString(value: FormDataEntryValue | null): string {
  if (value === null || typeof value !== 'string') {
    return ''
  }
  return value.trim()
}

export async function handleDevRegisterAgentPost(
  request: Request,
  deps: DevRegisterAgentDeps = defaultDeps(),
): Promise<Response> {
  if (!isDevRegisterEnabled()) {
    return new Response('Not Found', { status: 404 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return Response.redirect(`${DEV_ADD_AGENT_PATH}?error=invalid_form`, 303)
  }

  const parsed = devRegisterAgentFormSchema.safeParse({
    name: formEntryToString(formData.get('name')),
    apiKey: formEntryToString(formData.get('apiKey')),
    locationLabel: formEntryToString(formData.get('locationLabel')) || undefined,
  })

  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    const code = issue?.message ?? 'validation'
    return Response.redirect(
      `${DEV_ADD_AGENT_PATH}?error=validation&detail=${encodeURIComponent(code)}`,
      303,
    )
  }

  const { name, apiKey, locationLabel } = parsed.data
  const apiKeyHash = hashApiKey(apiKey)

  const existing = await deps.findAgentByApiKeyHash(apiKeyHash)
  if (existing) {
    return Response.redirect(`${DEV_ADD_AGENT_PATH}?error=duplicate_api_key`, 303)
  }

  try {
    const agent = await deps.createAgent({
      name,
      apiKeyHash,
      locationLabel: locationLabel ?? null,
    })
    return Response.redirect(`${DEV_ADD_AGENT_PATH}?created=${encodeURIComponent(agent.id)}`, 303)
  } catch (error) {
    console.error('Dev register agent failed', {
      message: error instanceof Error ? error.message : String(error),
    })
    return Response.redirect(`${DEV_ADD_AGENT_PATH}?error=internal`, 303)
  }
}
