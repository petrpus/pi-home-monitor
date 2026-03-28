import { describe, expect, it } from 'vitest'
import { GET } from './health.route-handler'

describe('GET /health', () => {
  it('returns 200 ok with plain text and no-store cache', async () => {
    const response = await GET()

    expect(response.status).toBe(200)
    expect(await response.text()).toBe('ok')
    expect(response.headers.get('content-type')).toBe('text/plain; charset=utf-8')
    expect(response.headers.get('cache-control')).toBe('no-store')
  })

  it('returns a successful response without redirect headers', async () => {
    const response = await GET()

    expect(response.ok).toBe(true)
    expect(response.headers.get('location')).toBeNull()
  })
})
