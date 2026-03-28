/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { createFileRoute } from '@tanstack/react-router'
import { GET } from '#/features/health/health.route-handler'

export const Route = createFileRoute('/health')({
  server: {
    handlers: {
      GET: async () => GET(),
    },
  },
})
