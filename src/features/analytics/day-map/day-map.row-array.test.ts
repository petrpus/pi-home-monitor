import { describe, expect, it } from 'vitest'

/**
 * Mirrors `asRowArray` in `dayMapFns.ts` for Prisma/pg single-row vs array shapes.
 * Kept local so tests do not load server-fn module graph.
 */
function asRowArray<T extends object>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[]
  if (raw != null && typeof raw === 'object') return [raw as T]
  return []
}

describe('asRowArray (Prisma raw row normalization)', () => {
  it('returns arrays unchanged', () => {
    const rows = [{ id: '1' }, { id: '2' }]
    expect(asRowArray<{ id: string }>(rows)).toEqual(rows)
  })

  it('wraps a single row object', () => {
    expect(asRowArray<{ ok: number }>({ ok: 1 })).toEqual([{ ok: 1 }])
  })

  it('returns empty array for null', () => {
    expect(asRowArray(null)).toEqual([])
  })

  it('returns empty array for undefined', () => {
    expect(asRowArray(undefined)).toEqual([])
  })
})
