import { useState, useEffect } from 'react'
import { useAlerts } from '../hooks/useAlerts'
import { useAuthFetch } from '../lib/useAuthFetch'
import AlertCard from '../components/shared/AlertCard'
import EmptyState from '../components/shared/EmptyState'

const API = import.meta.env.VITE_API_URL ?? ''

const ALERT_TYPES = ['', 'price_drop', 'price_increase', 'new_promo', 'promo_ended', 'new_sku', 'sku_removed', 'new_competitor']

interface Location { id: string; name: string }

export default function AlertFeed() {
  const authFetch = useAuthFetch()
  const [filterType, setFilterType] = useState('')
  const [filterLocationId, setFilterLocationId] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [locations, setLocations] = useState<Location[]>([])

  const { alerts, loading, markReviewed } = useAlerts({
    locationId: filterLocationId || undefined,
    reviewed: showAll ? 'all' : 'unreviewed',
  })

  useEffect(() => {
    authFetch(`${API}/api/v1/locations`)
      .then((r) => r.json())
      .then((d) => setLocations(d.locations || []))
  }, [authFetch])

  const filtered = filterType ? alerts.filter((a) => a.alert_type === filterType) : alerts
  const unreviewedCount = alerts.filter((a) => !a.reviewed).length
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  const selectStyle: React.CSSProperties = {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-default)',
    borderRadius: 6,
    padding: '6px 10px',
    color: 'var(--text-primary)',
    fontSize: 12,
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
            Alert Feed
          </h1>
          {!showAll && unreviewedCount > 0 && (
            <div className="mono" style={{ fontSize: 12, color: 'var(--accent-alert)' }}>
              {unreviewedCount} unreviewed
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {locations.length > 0 && (
            <select value={filterLocationId} onChange={(e) => setFilterLocationId(e.target.value)} style={selectStyle}>
              <option value="">All locations</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          )}
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={selectStyle}>
            <option value="">All types</option>
            {ALERT_TYPES.slice(1).map((t) => (
              <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <button
            className={`btn ${showAll ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: 12 }}
            onClick={() => setShowAll((p) => !p)}
          >
            {showAll ? 'Unreviewed only' : 'Show all'}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading intelligence feed...</div>
      ) : filtered.length === 0 ? (
        <EmptyState screen="alerts" locationCount={locations.length} lastChecked={now} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((alert) => (
            <AlertCard key={alert.id} alert={alert} onReview={markReviewed} />
          ))}
        </div>
      )}
    </div>
  )
}
