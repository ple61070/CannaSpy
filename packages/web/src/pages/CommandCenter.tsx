import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAlerts } from '../hooks/useAlerts'

const API = import.meta.env.VITE_API_URL ?? ''
import { useBlocks } from '../hooks/useBlocks'
import AlertCard from '../components/shared/AlertCard'
import EmptyState from '../components/shared/EmptyState'

export default function CommandCenter() {
  const navigate = useNavigate()
  const { alerts, loading: alertsLoading, markReviewed } = useAlerts({ limit: 5 })
  const { blocks, loading: blocksLoading } = useBlocks()
  const [locationCount, setLocationCount] = useState(0)

  useEffect(() => {
    fetch(`${API}/api/v1/locations`)
      .then((r) => r.json())
      .then((d) => setLocationCount(d.total || 0))
  }, [])

  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const unreviewedCount = alerts.filter((a) => !a.reviewed).length

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)' }}>
            Command Center
          </h1>
          <span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {new Date().toLocaleDateString()} · {now}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
        {/* Alert summary */}
        <div className="card card-alert" style={{ minHeight: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Recent Intelligence
            </span>
            {unreviewedCount > 0 && (
              <span className="mono" style={{ fontSize: 11, color: 'var(--accent-alert)', background: 'rgba(212,83,126,0.1)', padding: '2px 8px', borderRadius: 10 }}>
                {unreviewedCount} unreviewed
              </span>
            )}
          </div>

          {alertsLoading ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Pulling latest intelligence...</div>
          ) : alerts.length === 0 ? (
            <EmptyState screen="alerts" locationCount={locationCount} lastChecked={now} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {alerts.slice(0, 5).map((alert) => (
                <AlertCard key={alert.id} alert={alert} onReview={markReviewed} />
              ))}
              <button
                className="btn btn-ghost"
                style={{ fontSize: 12, padding: '4px 10px', alignSelf: 'flex-start', marginTop: 4 }}
                onClick={() => navigate('/alerts')}
              >
                View all alerts
              </button>
            </div>
          )}
        </div>

        {/* Blocks summary */}
        <div className="card card-block" style={{ minHeight: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Active Blocks
            </span>
            {!blocksLoading && blocks.length > 0 && (
              <span className="mono" style={{ fontSize: 11, color: 'var(--accent-block)', background: 'rgba(186,117,23,0.1)', padding: '2px 8px', borderRadius: 10 }}>
                {blocks.length} suppressed
              </span>
            )}
          </div>

          {blocksLoading ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading block status...</div>
          ) : blocks.length === 0 ? (
            <EmptyState screen="blocks" />
          ) : (
            <div>
              {blocks.slice(0, 3).map((block) => (
                <div key={block.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{block.competitor_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{block.competitor_address}</div>
                  </div>
                  <span className="mono" style={{ fontSize: 10, color: 'var(--accent-block)', background: 'rgba(186,117,23,0.1)', padding: '2px 6px', borderRadius: 3 }}>
                    BLOCKED
                  </span>
                </div>
              ))}
              {blocks.length > 3 && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                  +{blocks.length - 3} more blocked
                </div>
              )}
              <button
                className="btn btn-ghost"
                style={{ fontSize: 12, padding: '4px 10px', marginTop: 12 }}
                onClick={() => navigate('/blocks')}
              >
                Manage blocks
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick nav grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {[
          { label: 'Price Intelligence', path: '/prices', accent: 'var(--accent-intel)', desc: 'Live price matrix across tracked rivals' },
          { label: 'Promotions', path: '/promotions', accent: 'var(--accent-block)', desc: 'Active deals and discounts from competitors' },
          { label: 'Block Management', path: '/blocks', accent: 'var(--accent-block)', desc: 'Rivals you\'ve suppressed from the platform' },
          { label: 'Alert Feed', path: '/alerts', accent: 'var(--accent-alert)', desc: 'Real-time competitor change detection' },
          { label: 'Locations', path: '/locations', accent: 'var(--accent-intel)', desc: 'Your dispensary locations and monitoring nodes' },
          { label: 'Billing', path: '/billing', accent: 'var(--accent-roi)', desc: 'Slot usage and monthly cost breakdown' },
        ].map((item) => (
          <div
            key={item.path}
            className="card"
            style={{
              cursor: 'pointer',
              borderTop: `2px solid ${item.accent}`,
              transition: 'background 0.1s',
            }}
            onClick={() => navigate(item.path)}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-surface)')}
          >
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>
              {item.label}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
