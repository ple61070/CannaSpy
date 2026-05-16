import { useState, useEffect } from 'react'
import { useAuthFetch } from '../lib/useAuthFetch'

const API = import.meta.env.VITE_API_URL ?? ''

export interface PriceRow {
  competitor_id: string
  competitor_name: string
  raw_name: string       // product name as scraped (before normalization)
  price: number
  on_sale: boolean       // on_promo in API
  discount_label?: string
  last_updated: string
}

export function usePriceMatrix(locationId: string | null, category?: string, type?: string) {
  const authFetch = useAuthFetch()
  const [matrix, setMatrix] = useState<PriceRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!locationId) return
    setLoading(true)
    setError(null)
    const params = new URLSearchParams({ location_id: locationId })
    if (category) params.set('category', category)
    if (type && type !== 'both') params.set('type', type)

    authFetch(`${API}/api/v1/prices/matrix?${params}`)
      .then((r) => r.json())
      .then((data) => {
        const rows = (data.data?.matrix || []).map((r: any) => ({
          ...r,
          price: parseFloat(r.price),
        }))
        setMatrix(rows)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [locationId, category, type])

  return { matrix, loading, error }
}
