import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAlerts } from '../hooks/useAlerts'

const API = import.meta.env.VITE_API_URL ?? ''
import CompetitorRow from '../components/intelligence/CompetitorRow'
import AlertCard from '../components/shared/AlertCard'
import EmptyState from '../components/shared/EmptyState'

export default function LocationDashboard() {
  const { locationId } = useParams<{ locationId: string }>()
  const navigate = useNavigate()
  const [location, setLocation] = useState<{ name: string; address: string; dcc_license?: string } | null>(null)
  const [competitors, setCompetitors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { alerts, loading: alertsLoading, markReviewed } = useAlerts({ locationId, reviewed: 'unreviewed' })

  useEffect(() => {
    if (!locationId) return
    Promise.all([
      fetch(`${API}/api/v1/locations/${locationId}`).then((r) => r.json()),
      fetch(`${API}/api/v1/locations/${locationId}/competitors`).then((r) => r.json()),
    ]).then(([loc, comps]) => {
      setLocation(loc)
      setCompetitors(comps.competitors || [])
      setLoading(false)
    })
  }, [locationId])

  if (loading) {
    return <div style={{ color: 'var(--text-muted)', padding: 32, fontFamily: 'Space Mono, monospace', fontSize: 13 }}>Loading location data...</div>
  }

  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
          {location?.name}
        </h1>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{location?.address}</div>
        {location?.dcc_license && (
          <div className="mono" style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            DCC: {location.dcc_license}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <button className="btn btn-primary" onClick={() => navigate('/prices')}>
          Price Intelligence
        </button>
        <button className="btn btn-ghost" onClick={() => navigate('/alerts')}>
          Alert Feed
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Tracked competitors */}
        <div className="card card-intel">
          <div className="mono" style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
            TRACKED COMPETITORS — {competitors.length}
          </div>
          {competitors.length === 0 ? (
            <EmptyState screen="competitors" />
          ) : (
            competitors.map((comp) => (
              <CompetitorRow
                key={comp.tracked_id}
                competitor={{ ...comp, name: comp.name, competitor_id: comp.competitor_id }}
                onClick={() => navigate(`/blocks`)}
              />
            ))
          )}
        </div>

        {/* Location activity feed */}
        <div className="card card-alert">
          <div className="mono" style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
            UNREVIEWED ACTIVITY
          </div>
          {alertsLoading ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading activity...</div>
          ) : alerts.length === 0 ? (
            <EmptyState screen="alerts" locationCount={1} lastChecked={now} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {alerts.slice(0, 5).map((alert) => (
                <AlertCard key={alert.id} alert={alert} onReview={markReviewed} />
              ))}
              {alerts.length > 5 && (
                <button
                  className="btn btn-ghost"
                  style={{ fontSize: 12, padding: '4px 10px', alignSelf: 'flex-start' }}
                  onClick={() => navigate('/alerts')}
                >
                  View all activity
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
