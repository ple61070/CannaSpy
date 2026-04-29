import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import { useAlerts } from '../hooks/useAlerts'
import { useAuthFetch } from '../lib/useAuthFetch'

const API = import.meta.env.VITE_API_URL ?? ''

/* ── types ── */
interface LocationData {
  name: string
  address?: string
  city?: string
  market_tier?: string
  dcc_license?: string
}

interface Competitor {
  competitor_id: string
  tracked_id?: string
  name: string
  status: 'block' | 'tracking' | 'blocking-you'
  distance_mi?: number
  changes_today?: number
  total_skus?: number
  shared_brand_count?: number
  blocked_days?: number
  shared_brands?: string[]
  categories?: Array<{ cat: string; you: string; them: string; shared: string }>
}

/* ── static pin positions (% coords) cycling for any number of competitors ── */
const PIN_POSITIONS = [
  { left: '31%', top: '36%' },
  { left: '23%', top: '43%' },
  { left: '63%', top: '38%' },
  { left: '55%', top: '59%' },
  { left: '38%', top: '65%' },
  { left: '72%', top: '53%' },
  { left: '24%', top: '62%' },
  { left: '42%', top: '74%' },
  { left: '68%', top: '30%' },
  { left: '18%', top: '30%' },
]

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

function pinColor(status: string) {
  if (status === 'block') return 'var(--rose)'
  if (status === 'blocking-you') return 'var(--warm)'
  return 'var(--accent)'
}

type FilterKey = 'all' | 'rivals' | 'blocked' | 'alerts'

export default function LocationDashboard() {
  const authFetch = useAuthFetch()
  const { locationId } = useParams<{ locationId: string }>()
  const navigate = useNavigate()

  const [location, setLocation] = useState<LocationData | null>(null)
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterKey>('all')
  const [filterOpen, setFilterOpen] = useState(false)

  const { alerts, loading: alertsLoading, markReviewed } = useAlerts({ locationId, reviewed: 'unreviewed' })

  useEffect(() => {
    if (!locationId) return
    Promise.all([
      authFetch(`${API}/api/v1/locations/${locationId}`).then((r) => r.json()),
      authFetch(`${API}/api/v1/locations/${locationId}/competitors`).then((r) => r.json()),
    ])
      .then(([loc, comps]) => {
        setLocation(loc)
        setCompetitors(comps.competitors || [])
        setLoading(false)
      })
      .catch((err) => {
        console.error('[LocationDashboard] load error', err)
        setLoading(false)
      })
  }, [locationId, authFetch])

  const selectedComp = competitors.find((c) => c.competitor_id === selectedId) ?? null

  const filteredCompetitors = competitors.filter((c) => {
    if (filter === 'all') return true
    if (filter === 'blocked') return c.status === 'block'
    if (filter === 'rivals') return c.status === 'tracking'
    return true
  })

  const blockedCount = competitors.filter((c) => c.status === 'block').length
  const trackedCount = competitors.filter((c) => c.status === 'tracking').length
  const unreviewedCount = alertsLoading ? 0 : alerts.length
  const mrr = competitors.length * 100

  const locationName = location?.name ?? 'Location'
  const marketTier = location?.market_tier ?? 'Market'

  const closeDetail = useCallback(() => setSelectedId(null), [])

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          fontFamily: 'var(--mono)',
          fontSize: 12,
          color: 'var(--text-3)',
          letterSpacing: '0.08em',
        }}
      >
        Pulling latest intelligence…
      </div>
    )
  }

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* ── DETAIL PANEL ── */}
      <div
        style={{
          width: selectedComp ? 420 : 0,
          overflow: 'hidden',
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          flexShrink: 0,
          transition: 'width 0.32s cubic-bezier(.2,.8,.2,1)',
          zIndex: 8,
          boxShadow: selectedComp ? '4px 0 24px rgba(0,0,0,0.18)' : 'none',
        }}
      >
        {selectedComp && (
          <div style={{ width: 420, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', flexShrink: 0 }}>
            {/* detail head */}
            <div
              style={{
                padding: '15px 17px 13px',
                borderBottom: '1px solid var(--border)',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
              }}
            >
              <button
                onClick={closeDetail}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'var(--surface-3)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  color: 'var(--text-2)',
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                {selectedComp.status === 'block' && (
                  <div
                    style={{
                      display: 'inline-block',
                      fontFamily: 'var(--mono)',
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      padding: '3px 8px',
                      borderRadius: 4,
                      marginBottom: 5,
                      background: 'rgba(211,150,166,0.12)',
                      color: 'var(--rose)',
                    }}
                  >
                    BLOCKED
                  </div>
                )}
                {selectedComp.status === 'blocking-you' && (
                  <div
                    style={{
                      display: 'inline-block',
                      fontFamily: 'var(--mono)',
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      padding: '3px 8px',
                      borderRadius: 4,
                      marginBottom: 5,
                      background: 'rgba(246,201,146,0.15)',
                      color: 'var(--warm)',
                    }}
                  >
                    BLOCKING YOU
                  </div>
                )}
                {selectedComp.status === 'tracking' && (
                  <div
                    style={{
                      display: 'inline-block',
                      fontFamily: 'var(--mono)',
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      padding: '3px 8px',
                      borderRadius: 4,
                      marginBottom: 5,
                      background: 'rgba(9,161,161,0.10)',
                      color: 'var(--accent)',
                    }}
                  >
                    TRACKING
                  </div>
                )}
                <div
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 10,
                    color: 'var(--text-2)',
                    letterSpacing: '0.05em',
                    marginBottom: 4,
                  }}
                >
                  {selectedComp.name.toUpperCase()}
                  {selectedComp.distance_mi ? ` · ${selectedComp.distance_mi} MI` : ''}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', lineHeight: 1.3, letterSpacing: '-0.01em' }}>
                  {selectedComp.name}
                </div>
              </div>
            </div>

            {/* detail scroll */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 17px', minHeight: 0 }}>
              {/* block/blocking-you strip */}
              {selectedComp.status === 'block' && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    background: 'rgba(211,150,166,0.08)',
                    border: '1px solid rgba(211,150,166,0.2)',
                    borderRadius: 8,
                    padding: '9px 13px',
                    marginBottom: 14,
                  }}
                >
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--rose)', flexShrink: 0 }} />
                  <div style={{ fontSize: 11, color: 'var(--rose)', fontWeight: 600 }}>Blocked — cannot access CannaSpy</div>
                  {selectedComp.blocked_days && (
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', marginLeft: 'auto' }}>
                      {selectedComp.blocked_days} days
                    </div>
                  )}
                </div>
              )}
              {selectedComp.status === 'blocking-you' && (
                <div
                  style={{
                    background: 'var(--warm-soft)',
                    borderBottom: '1px solid rgba(212,144,10,0.25)',
                    padding: '10px 13px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    marginBottom: 14,
                    borderRadius: 8,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--warm)" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                  </svg>
                  <div style={{ flex: 1, fontSize: 11, color: 'var(--text-2)', lineHeight: 1.5 }}>
                    <strong style={{ color: 'var(--warm)' }}>This rival is blocking your account.</strong> Pricing and catalog data are unavailable while their block is active.
                  </div>
                </div>
              )}

              {/* stats grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginBottom: 14 }}>
                {[
                  { value: selectedComp.changes_today ?? '—', label: 'Changes today', color: selectedComp.changes_today ? 'var(--accent)' : 'var(--text-3)' },
                  { value: selectedComp.total_skus ?? '—', label: 'Total SKUs', color: 'var(--text-1)' },
                  { value: selectedComp.shared_brand_count ?? '—', label: 'Shared brands', color: 'var(--text-1)' },
                  { value: selectedComp.distance_mi ? `${selectedComp.distance_mi} mi` : '—', label: 'Distance', color: 'var(--text-1)' },
                ].map((s) => (
                  <div
                    key={s.label}
                    style={{
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      padding: '9px 11px',
                    }}
                  >
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 19, fontWeight: 700, color: s.color, lineHeight: 1, marginBottom: 2 }}>
                      {s.value}
                    </div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* shared brands */}
              {selectedComp.shared_brands && selectedComp.shared_brands.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 8 }}>
                    Shared brands
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {selectedComp.shared_brands.map((brand) => (
                      <div key={brand} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-2)', width: 80, flexShrink: 0 }}>
                          {brand}
                        </div>
                        <div style={{ flex: 1, height: 6, background: 'var(--surface-3)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: '50%', borderRadius: 3, background: 'var(--accent)' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* categories */}
              {selectedComp.categories && selectedComp.categories.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 8 }}>
                    Category breakdown
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                    <thead>
                      <tr>
                        {['Category', 'You', 'Them', 'Shared'].map((h) => (
                          <th
                            key={h}
                            style={{
                              fontFamily: 'var(--mono)',
                              fontSize: 9,
                              letterSpacing: '0.1em',
                              textTransform: 'uppercase',
                              color: 'var(--text-3)',
                              padding: '5px 7px',
                              borderBottom: '1px solid var(--border)',
                              textAlign: 'left',
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedComp.categories.map((row) => (
                        <tr key={row.cat}>
                          <td style={{ padding: '7px', borderBottom: '1px solid var(--border)', color: 'var(--text-1)' }}>{row.cat}</td>
                          <td style={{ padding: '7px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-2)' }}>{row.you}</td>
                          <td style={{ padding: '7px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-2)' }}>{row.them}</td>
                          <td style={{ padding: '7px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)' }}>{row.shared}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* detail footer */}
            <div style={{ padding: '13px 17px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 7, flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: 7 }}>
                <button
                  style={{
                    flex: 1,
                    padding: '9px 12px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'var(--sans)',
                    border: '1.5px solid var(--border-2)',
                    background: 'var(--surface-3)',
                    color: 'var(--text-1)',
                  }}
                  onClick={() => navigate('/prices')}
                >
                  View price matrix →
                </button>
                {selectedComp.status === 'tracking' && (
                  <button
                    style={{
                      flex: 1,
                      padding: '9px 12px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'var(--sans)',
                      border: '1.5px solid var(--rose)',
                      background: 'transparent',
                      color: 'var(--rose)',
                    }}
                    onClick={() => navigate('/blocks')}
                  >
                    Block this rival
                  </button>
                )}
                {selectedComp.status === 'block' && (
                  <button
                    style={{
                      flex: 1,
                      padding: '9px 12px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'var(--sans)',
                      border: '1.5px solid var(--border-2)',
                      background: 'var(--surface-3)',
                      color: 'var(--text-1)',
                    }}
                    onClick={() => navigate('/blocks')}
                  >
                    Manage block →
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── LIST PANEL ── */}
      <div
        style={{
          width: 360,
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          flexShrink: 0,
          zIndex: 5,
          boxShadow: '2px 0 16px rgba(0,0,0,0.12)',
        }}
      >
        {/* location header */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0, background: 'var(--surface-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>
              {locationName}
            </div>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', cursor: 'pointer' }}
              onClick={() => navigate('/command-center')}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              All locations
            </div>
          </div>
          {/* KPI stats strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
            {[
              { n: unreviewedCount, label: 'Alerts', color: unreviewedCount > 0 ? 'var(--danger)' : 'var(--text-1)' },
              { n: trackedCount + blockedCount, label: 'Tracked', color: 'var(--text-1)' },
              { n: blockedCount, label: 'Blocked', color: blockedCount > 0 ? 'var(--rose)' : 'var(--text-1)' },
              { n: `$${mrr.toLocaleString()}`, label: 'MRR', color: 'var(--accent)' },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  background: 'var(--surface-3)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '7px 8px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 700, color: s.color, lineHeight: 1 }}>
                  {s.n}
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 2 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* health strip — shared brand chips */}
        {competitors.length > 0 && (
          <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 7 }}>
              Rivals at this location
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(72px,1fr))', gap: 5 }}>
              {competitors.slice(0, 8).map((c) => (
                <div
                  key={c.competitor_id}
                  onClick={() => setSelectedId(c.competitor_id)}
                  style={{
                    background: 'var(--surface-3)',
                    border: `1px solid ${selectedId === c.competitor_id ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 6,
                    padding: '6px 7px',
                    textAlign: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 8.5, color: 'var(--text-3)', letterSpacing: '0.06em', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.name.split(' ')[0].toUpperCase()}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--mono)',
                      fontSize: 10,
                      fontWeight: 700,
                      color:
                        c.status === 'block'
                          ? 'var(--rose)'
                          : c.status === 'blocking-you'
                          ? 'var(--warm)'
                          : 'var(--text-3)',
                    }}
                  >
                    {c.status === 'block' ? 'blocked' : c.status === 'blocking-you' ? 'blocks you' : `${c.shared_brand_count ?? 0} shared`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* filter bar */}
        <div
          style={{
            padding: '8px 14px',
            borderBottom: '1px solid var(--border)',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Filter</span>
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setFilterOpen((o) => !o)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 11px',
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 600,
                  border: `1.5px solid ${filter !== 'all' ? 'var(--accent)' : 'var(--border-2)'}`,
                  background: filter !== 'all' ? 'var(--accent)' : 'var(--surface)',
                  color: filter !== 'all' ? '#fff' : 'var(--text-1)',
                  cursor: 'pointer',
                  fontFamily: 'var(--sans)',
                  whiteSpace: 'nowrap',
                }}
              >
                {filter === 'all' ? 'All' : filter === 'blocked' ? 'Blocked' : filter === 'rivals' ? 'Rivals' : 'Alerts'}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {filterOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 5px)',
                    left: 0,
                    background: 'var(--surface)',
                    border: '1px solid var(--border-2)',
                    borderRadius: 8,
                    boxShadow: '0 8px 32px rgba(30,60,80,0.14)',
                    zIndex: 200,
                    minWidth: 160,
                    padding: 5,
                  }}
                >
                  {(['all', 'rivals', 'blocked'] as FilterKey[]).map((f) => (
                    <div
                      key={f}
                      onClick={() => { setFilter(f); setFilterOpen(false) }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '7px 10px',
                        borderRadius: 6,
                        fontSize: 12,
                        color: filter === f ? 'var(--accent)' : 'var(--text-1)',
                        fontWeight: filter === f ? 700 : 400,
                        cursor: 'pointer',
                        background: 'transparent',
                        fontFamily: 'var(--sans)',
                      }}
                    >
                      {f === 'all' ? 'All' : f === 'blocked' ? 'Blocked' : 'Rivals'}
                      {filter === f && <span style={{ marginLeft: 'auto', fontSize: 11 }}>✓</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
            {unreviewedCount} unreviewed
          </div>
        </div>

        {/* scrollable list */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {/* unreviewed alerts section */}
          {!alertsLoading && alerts.length > 0 && (filter === 'all') && (
            <>
              <div
                style={{
                  padding: '7px 16px 4px',
                  fontFamily: 'var(--mono)',
                  fontSize: 9,
                  fontWeight: 500,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--text-3)',
                  background: 'var(--surface-2)',
                  borderBottom: '1px solid var(--border)',
                  position: 'sticky',
                  top: 0,
                  zIndex: 2,
                }}
              >
                Unreviewed Alerts
              </div>
              {alerts.slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 11,
                    padding: '11px 16px',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                  onClick={() => markReviewed(alert.id)}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 3,
                      background: alert.alert_type?.includes('promo') ? 'var(--warm)' : 'var(--danger)',
                    }}
                  />
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: 1,
                      background: 'rgba(224,90,106,0.15)',
                      color: 'var(--danger)',
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                    </svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6, marginBottom: 2 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)', lineHeight: 1.3 }}>
                        {alert.competitor_name} — price change
                      </div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.4, marginBottom: 4 }}>
                      {alert.location_name}
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontFamily: 'var(--mono)',
                          fontSize: 9,
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: 'rgba(224,90,106,0.12)',
                          color: 'var(--danger)',
                        }}
                      >
                        ALERT
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* competitors section */}
          {filteredCompetitors.length > 0 && (
            <>
              <div
                style={{
                  padding: '7px 16px 4px',
                  fontFamily: 'var(--mono)',
                  fontSize: 9,
                  fontWeight: 500,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--text-3)',
                  background: 'var(--surface-2)',
                  borderBottom: '1px solid var(--border)',
                  position: 'sticky',
                  top: 0,
                  zIndex: 2,
                }}
              >
                {filter === 'blocked' ? 'Blocked Rivals' : 'Tracked Rivals'}
              </div>
              {filteredCompetitors.map((c) => (
                <div
                  key={c.competitor_id}
                  onClick={() => setSelectedId((prev) => (prev === c.competitor_id ? null : c.competitor_id))}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 11,
                    padding: '11px 16px',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    position: 'relative',
                    background: selectedId === c.competitor_id ? 'var(--accent-soft)' : 'transparent',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 3,
                      background: selectedId === c.competitor_id ? 'var(--accent)' : 'transparent',
                    }}
                  />
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: 1,
                      background:
                        c.status === 'block'
                          ? 'rgba(211,150,166,0.12)'
                          : c.status === 'blocking-you'
                          ? 'rgba(246,201,146,0.15)'
                          : 'var(--surface-3)',
                      color:
                        c.status === 'block'
                          ? 'var(--rose)'
                          : c.status === 'blocking-you'
                          ? 'var(--warm)'
                          : 'var(--text-2)',
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      {c.status === 'block' || c.status === 'blocking-you' ? (
                        <>
                          <circle cx="12" cy="12" r="10" />
                          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                        </>
                      ) : (
                        <>
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </>
                      )}
                    </svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6, marginBottom: 2 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)', lineHeight: 1.3 }}>{c.name}</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {c.distance_mi ? `${c.distance_mi} mi` : '—'}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.4, marginBottom: 4 }}>
                      {c.shared_brand_count != null ? `${c.shared_brand_count} shared brands` : ''}{' '}
                      {c.changes_today != null ? `· ${c.changes_today} changes today` : ''}{' '}
                      · {c.status === 'block' ? 'Blocked' : c.status === 'blocking-you' ? 'Blocking you' : 'Tracking'}
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontFamily: 'var(--mono)',
                          fontSize: 9,
                          padding: '2px 6px',
                          borderRadius: 4,
                          background:
                            c.status === 'block'
                              ? 'rgba(211,150,166,0.10)'
                              : c.status === 'blocking-you'
                              ? 'rgba(246,201,146,0.12)'
                              : 'rgba(9,161,161,0.10)',
                          color:
                            c.status === 'block'
                              ? 'var(--rose)'
                              : c.status === 'blocking-you'
                              ? 'var(--warm)'
                              : 'var(--accent)',
                        }}
                      >
                        {c.status === 'block' ? 'BLOCKED' : c.status === 'blocking-you' ? 'BLOCKING YOU' : 'TRACKING'}
                      </span>
                      {c.shared_brand_count != null && c.shared_brand_count > 0 && (
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(224,90,106,0.12)', color: 'var(--danger)' }}>
                          {c.shared_brand_count} shared
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {filteredCompetitors.length === 0 && alerts.length === 0 && (
            <div style={{ padding: '24px 16px', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)', lineHeight: 1.65 }}>
              No rivals currently suppressed.
              <br />
              Add a block to start building your moat.
            </div>
          )}
        </div>
      </div>

      {/* ── MAP AREA ── */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          background: 'var(--map-bg)',
          minWidth: 0,
        }}
        onClick={() => setFilterOpen(false)}
      >
        {/* grid */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(var(--map-grid) 1px,transparent 1px),linear-gradient(90deg,var(--map-grid) 1px,transparent 1px)',
            backgroundSize: '36px 36px',
          }}
        />

        {/* city blocks */}
        {[
          { t: '4%',  l: '4%',  w: '17%', h: '15%', v: 'base' },
          { t: '4%',  l: '24%', w: '13%', h: '11%', v: 'alt'  },
          { t: '4%',  l: '40%', w: '19%', h: '13%', v: 'base' },
          { t: '4%',  l: '62%', w: '15%', h: '17%', v: 'park' },
          { t: '4%',  l: '80%', w: '16%', h: '11%', v: 'alt'  },
          { t: '24%', l: '4%',  w: '11%', h: '19%', v: 'base' },
          { t: '24%', l: '18%', w: '15%', h: '17%', v: 'alt'  },
          { t: '24%', l: '62%', w: '13%', h: '15%', v: 'base' },
          { t: '24%', l: '78%', w: '18%', h: '19%', v: 'alt'  },
          { t: '50%', l: '4%',  w: '19%', h: '17%', v: 'park' },
          { t: '50%', l: '26%', w: '13%', h: '13%', v: 'base' },
          { t: '50%', l: '42%', w: '17%', h: '19%', v: 'alt'  },
          { t: '50%', l: '62%', w: '15%', h: '15%', v: 'base' },
          { t: '50%', l: '80%', w: '16%', h: '17%', v: 'alt'  },
          { t: '74%', l: '4%',  w: '13%', h: '20%', v: 'alt'  },
          { t: '74%', l: '20%', w: '19%', h: '18%', v: 'base' },
          { t: '74%', l: '42%', w: '15%', h: '20%', v: 'park' },
          { t: '74%', l: '60%', w: '17%', h: '20%', v: 'alt'  },
          { t: '74%', l: '80%', w: '16%', h: '20%', v: 'base' },
        ].map((b, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: b.t,
              left: b.l,
              width: b.w,
              height: b.h,
              borderRadius: 3,
              background:
                b.v === 'park'
                  ? 'var(--map-park)'
                  : b.v === 'alt'
                  ? 'var(--map-block-2)'
                  : 'var(--map-block)',
            }}
          />
        ))}

        {/* roads */}
        {[
          { top: '20.5%', left: 0, right: 0, height: 5 },
          { top: '46.5%', left: 0, right: 0, height: 5 },
          { top: '70.5%', left: 0, right: 0, height: 5 },
        ].map((r, i) => (
          <div key={i} style={{ position: 'absolute', top: r.top, left: r.left, right: r.right, height: r.height, background: 'var(--map-road)' }} />
        ))}
        {[
          { left: '37%', top: 0, bottom: 0, width: 5 },
          { left: '60%', top: 0, bottom: 0, width: 5 },
        ].map((r, i) => (
          <div key={i} style={{ position: 'absolute', left: r.left, top: r.top, bottom: r.bottom, width: r.width, background: 'var(--map-road)' }} />
        ))}
        {[
          { left: '16%', top: 0, bottom: 0, width: 3 },
          { left: '78%', top: 0, bottom: 0, width: 3 },
        ].map((r, i) => (
          <div key={i} style={{ position: 'absolute', left: r.left, top: r.top, bottom: r.bottom, width: r.width, background: 'var(--map-road-minor)' }} />
        ))}

        {/* map topbar */}
        <div style={{ position: 'absolute', top: 14, left: 14, right: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 20, pointerEvents: 'none' }}>
          <div
            style={{
              background: 'var(--surface)',
              backdropFilter: 'blur(10px)',
              border: '1px solid var(--border-2)',
              borderRadius: 24,
              padding: '7px 16px',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text-1)',
              boxShadow: 'var(--card-shadow)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: 'var(--accent)',
                animation: 'lpulse 2s ease-in-out infinite',
                flexShrink: 0,
              }}
            />
            {locationName} · {marketTier}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { dot: 'var(--danger)', text: `${unreviewedCount} alerts` },
              { dot: 'var(--accent)', text: `${trackedCount} tracked` },
              { dot: 'var(--rose)',   text: `${blockedCount} blocked` },
            ].map((p) => (
              <div
                key={p.text}
                style={{
                  background: 'var(--surface)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid var(--border-2)',
                  borderRadius: 20,
                  padding: '5px 12px',
                  fontFamily: 'var(--mono)',
                  fontSize: 10,
                  color: 'var(--text-2)',
                  boxShadow: 'var(--card-shadow)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <div style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: p.dot }} />
                {p.text}
              </div>
            ))}
          </div>
        </div>

        {/* center pin (your location) */}
        <div style={{ position: 'absolute', left: '48%', top: '50%', transform: 'translate(-50%,-50%)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
          <div style={{ position: 'relative', width: 14, height: 14 }}>
            <div style={{ width: 14, height: 14, background: '#5484A4', borderRadius: '50%', border: '3px solid white', boxShadow: '0 2px 10px rgba(84,132,164,0.5)' }} />
            <div
              style={{
                position: 'absolute',
                top: -6,
                left: -6,
                width: 26,
                height: 26,
                borderRadius: '50%',
                background: 'rgba(84,132,164,0.18)',
                animation: 'cpulse 2.2s ease-out infinite',
              }}
            />
          </div>
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border-2)',
              borderRadius: 6,
              padding: '3px 10px',
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--text-1)',
              whiteSpace: 'nowrap',
              boxShadow: 'var(--card-shadow)',
              fontFamily: 'var(--mono)',
              letterSpacing: '0.04em',
            }}
          >
            {locationName.split(' ').slice(0, 2).join(' ').toUpperCase()}
          </div>
        </div>

        {/* competitor pins */}
        {competitors.map((c, idx) => {
          const pos = PIN_POSITIONS[idx % PIN_POSITIONS.length]
          const isSelected = selectedId === c.competitor_id
          const bgColor = pinColor(c.status)
          const abbr = initials(c.name)
          return (
            <div
              key={c.competitor_id}
              onClick={() => setSelectedId((prev) => (prev === c.competitor_id ? null : c.competitor_id))}
              style={{
                position: 'absolute',
                left: pos.left,
                top: pos.top,
                transform: `translate(-50%,-100%) scale(${isSelected ? 1.1 : 1})`,
                zIndex: isSelected ? 20 : 8,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                transition: 'all 0.2s cubic-bezier(.4,0,.2,1)',
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50% 50% 50% 0',
                  transform: 'rotate(-45deg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: bgColor,
                  boxShadow: isSelected
                    ? '0 0 0 4px rgba(255,255,255,0.28),0 6px 20px rgba(0,0,0,0.35)'
                    : c.status === 'blocking-you'
                    ? '0 0 0 3px rgba(212,144,10,0.28),0 4px 12px rgba(212,144,10,0.3)'
                    : '0 4px 12px rgba(0,0,0,0.22)',
                  border: '2px solid rgba(255,255,255,0.4)',
                  position: 'relative',
                }}
              >
                <span
                  style={{
                    transform: 'rotate(45deg)',
                    fontFamily: 'var(--mono)',
                    fontSize: 9,
                    fontWeight: 700,
                    color: '#fff',
                  }}
                >
                  {abbr}
                </span>
              </div>
              <div
                style={{
                  marginTop: 5,
                  background: 'var(--surface)',
                  border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border-2)'}`,
                  borderRadius: 6,
                  padding: '2px 8px',
                  fontSize: 10,
                  fontWeight: 600,
                  color: c.status === 'blocking-you' ? 'var(--warm)' : isSelected ? 'var(--accent)' : 'var(--text-1)',
                  whiteSpace: 'nowrap',
                  boxShadow: 'var(--card-shadow)',
                  textAlign: 'center',
                }}
              >
                {c.name.split(' ')[0]}
              </div>
            </div>
          )
        })}

        {/* legend */}
        <div
          style={{
            position: 'absolute',
            bottom: 14,
            left: 14,
            background: 'var(--surface)',
            backdropFilter: 'blur(8px)',
            border: '1px solid var(--border-2)',
            borderRadius: 8,
            padding: '9px 14px',
            boxShadow: 'var(--card-shadow)',
            zIndex: 20,
          }}
        >
          {[
            { color: 'var(--danger)', label: 'Critical alert' },
            { color: '#c88a20',       label: 'High alert' },
            { color: 'var(--accent)', label: 'Tracking' },
            { color: 'var(--rose)',   label: 'Blocked' },
            { color: 'var(--warm)',   label: 'Blocking you' },
          ].map((l) => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4, fontSize: 10, color: 'var(--text-2)' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, background: l.color }} />
              {l.label}
            </div>
          ))}
        </div>

        {/* zoom controls */}
        <div style={{ position: 'absolute', bottom: 14, right: 14, display: 'flex', flexDirection: 'column', gap: 4, zIndex: 20 }}>
          {['+', '−'].map((z) => (
            <div
              key={z}
              style={{
                width: 30,
                height: 30,
                background: 'var(--surface)',
                border: '1px solid var(--border-2)',
                borderRadius: 7,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-2)',
                fontSize: 15,
                boxShadow: 'var(--card-shadow)',
                userSelect: 'none',
              }}
            >
              {z}
            </div>
          ))}
        </div>

        {/* keyframes injected via style tag */}
        <style>{`
          @keyframes lpulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.75)} }
          @keyframes cpulse { 0%{transform:scale(0.6);opacity:0.9} 100%{transform:scale(1.9);opacity:0} }
        `}</style>
      </div>
    </div>
  )
}
