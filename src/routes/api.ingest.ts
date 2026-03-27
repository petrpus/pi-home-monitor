/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { createFileRoute } from '@tanstack/react-router'
import { handleIngestPost } from '#/features/ingest/ingest.route-handler'

export const Route = createFileRoute('/api/ingest')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => handleIngestPost(request),
    },
  },
})
