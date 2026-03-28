/**
 * Production HTTP server for Bun + TanStack Start.
 * Serves Vite client output (CSS/JS under /assets/, public files) from dist/client,
 * then delegates everything else to the SSR handler.
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))
const clientDir = path.resolve(root, 'dist/client')

type SsrHandler = { fetch: (req: Request) => Response | Promise<Response> }
const serverHref = new URL('./dist/server/server.js', import.meta.url).href
const mod = await import(serverHref)
const app = mod.default as SsrHandler

function resolvedClientFile(pathname: string): string | null {
  const rel = pathname.replace(/^\/+/, '')
  if (!rel || rel.includes('\0')) return null
  const fp = path.resolve(clientDir, rel)
  const base = clientDir.endsWith(path.sep) ? clientDir : clientDir + path.sep
  if (fp !== clientDir && !fp.startsWith(base)) return null
  return fp
}

const port = Number(process.env.PORT ?? 3000)

Bun.serve({
  port,
  async fetch(req: Request) {
    const url = new URL(req.url)
    const filePath = resolvedClientFile(url.pathname)
    if (filePath) {
      const file = Bun.file(filePath)
      if (await file.exists()) return new Response(file)
    }
    return app.fetch(req)
  },
})

console.log(`Listening on http://localhost:${port}`)
