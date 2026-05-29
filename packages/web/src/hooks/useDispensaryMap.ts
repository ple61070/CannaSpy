// ============================================================
// useDispensaryMap — live bbox-fetching hook
// ============================================================
// Fetches dispensary GeoJSON from /api/v1/map/dispensaries
// whenever the bbox changes (debounced 300ms).
// Returns empty FeatureCollection on error — never throws.

import { useState, useEffect, useRef } from 'react'
import type { DispensaryFeatureProps } from '../components/map/types'

const API = import.meta.env.VITE_API_URL ?? ''

// Inline GeoJSON types so we don't depend on the `geojson` package
interface DispensaryPoint {
  type: 'Feature'
  geometry: { type: 'Point'; coordinates: [number, number] }
  properties: DispensaryFeatureProps
}
export interface DispensaryFeatureCollection {
  type: 'FeatureCollection'
  features: DispensaryPoint[]
}

const EMPTY: DispensaryFeatureCollection = { type: 'FeatureCollection', features: [] }
const DEBOUNCE_MS = 500

export interface DispensaryMapFilters {
  tier?: string
  type?: string
  enriched?: boolean
  q?: string
  limit?: number
  refreshKey?: number
}

export function useDispensaryMap(
  bbox: string | null,
  filters?: DispensaryMapFilters,
) {
  const [data, setData] = useState<DispensaryFeatureCollection>(EMPTY)
  const [loading, setLoading] = useState(false)
  const [count, setCount] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!bbox) return

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      // Cancel any in-flight request
      abortRef.current?.abort()
      abortRef.current = new AbortController()

      setLoading(true)
      try {
        const params = new URLSearchParams({ bbox, limit: String(filters?.limit ?? 2000) })
        if (filters?.tier) params.set('tier', filters.tier)
        if (filters?.type) params.set('type', filters.type)
        if (filters?.enriched != null) params.set('enriched', String(filters.enriched))
        if (filters?.q) params.set('q', filters.q)

        const res = await fetch(`${API}/api/v1/map/dispensaries?${params}`, {
          signal: abortRef.current.signal,
        })
        if (res.ok) {
          const json = await res.json()
          // API wraps in { success, data, count } — unwrap if needed
          const fc: DispensaryFeatureCollection = json.data ?? json
          if (fc?.type === 'FeatureCollection') {
            setData(fc)
            setCount(fc.features?.length ?? 0)
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return
        // keep previous data on network error
      } finally {
        setLoading(false)
      }
    }, DEBOUNCE_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bbox, filters?.tier, filters?.type, filters?.enriched, filters?.q, filters?.limit, filters?.refreshKey])

  return { data, loading, count }
}
