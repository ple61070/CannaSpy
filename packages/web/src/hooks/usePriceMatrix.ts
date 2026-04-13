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

export function usePriceMatrix(locationId: string | null, category?: string) {
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

    authFetch(`${API}/api/v1/prices/matrix?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setMatrix(data.data?.matrix || [])
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [locationId, category])

  return { matrix, loading, error }
}
