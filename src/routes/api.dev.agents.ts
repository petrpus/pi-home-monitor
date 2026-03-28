/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { createFileRoute } from '@tanstack/react-router'
import { handleDevRegisterAgentPost } from '#/features/agents/dev-register-agent.route-handler'

/** Dev-only: POST form or API to register an agent (plaintext API key → hashed). */
export const Route = createFileRoute('/api/dev/agents')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => handleDevRegisterAgentPost(request),
    },
  },
})
