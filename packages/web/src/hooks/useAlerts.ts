import { useState, useEffect } from 'react'
import { useAuthFetch } from '../lib/useAuthFetch'

const API = import.meta.env.VITE_API_URL ?? ''

export interface Alert {
  id: string
  alert_type: string
  competitor_name: string
  location_name?: string
  old_value: string | null
  new_value: string | null
  confidence: string
  reviewed: boolean
  created_at: string
}

interface UseAlertsOptions {
  locationId?: string
  // 'unreviewed' (default) = only unreviewed, 'all' = all, 'reviewed' = reviewed only
  reviewed?: 'unreviewed' | 'all' | 'reviewed'
  limit?: number
  type?: string  // 'storefront' | 'delivery' — filter by competitor business_type
}

export function useAlerts(options: UseAlertsOptions = {}) {
  const authFetch = useAuthFetch()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAlerts = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (options.locationId) params.set('location_id', options.locationId)
      if (options.limit) params.set('limit', String(options.limit))
      if (options.type && options.type !== 'both') params.set('type', options.type)

      if (options.reviewed === 'all') {
        params.set('reviewed', 'all')  // API shows all when value is non-true/false
      } else if (options.reviewed === 'reviewed') {
        params.set('reviewed', 'true')
      }
      // 'unreviewed' or undefined: no param — API defaults to unreviewed only

      const res = await authFetch(`${API}/api/v1/alerts?${params}`)
      if (!res.ok) throw new Error('Failed to fetch alerts')
      const data = await res.json()
      setAlerts(data.data?.alerts || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const markReviewed = async (alertId: string) => {
    await authFetch(`${API}/api/v1/alerts/${alertId}/reviewed`, { method: 'PATCH' })
    setAlerts((prev) => prev.map((a) => a.id === alertId ? { ...a, reviewed: true } : a))
  }

  useEffect(() => { fetchAlerts() }, [options.locationId, options.reviewed, options.type])

  return { alerts, loading, error, markReviewed, refetch: fetchAlerts }
}
