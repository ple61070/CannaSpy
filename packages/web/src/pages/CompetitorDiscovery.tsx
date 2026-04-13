import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthFetch } from '../lib/useAuthFetch'

const API = import.meta.env.VITE_API_URL ?? ''

interface Competitor {
  id?: string
  google_place_id: string
  name: string
  address: string
  distance_miles?: number
  platform?: string
}

interface Selection {
  competitor: Competitor
  action: 'track' | 'block'
}

export default function CompetitorDiscovery() {
  const authFetch = useAuthFetch()
  const navigate = useNavigate()
  const [locations, setLocations] = useState<Array<{ id: string; name: string }>>([])
  const [selectedLocationId, setSelectedLocationId] = useState<string>('')
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [selections, setSelections] = useState<Map<string, Selection>>(new Map())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    authFetch(`${API}/api/v1/locations`)
      .then((r) => r.json())
      .then((data) => {
        setLocations(data.locations)
        if (data.locations.length > 0) setSelectedLocationId(data.locations[0].id)
      })
  }, [])

  const handleDiscover = async () => {
    if (!selectedLocationId) return
    setLoading(true)
    setSelections(new Map())
    try {
      const res = await authFetch(`${API}/api/v1/locations/${selectedLocationId}/discover`)
      const data = await res.json()
      setCompetitors(data.data?.competitors || [])
    } catch {
      setCompetitors([])
    } finally {
      setLoading(false)
    }
  }

  const setSelection = (comp: Competitor, action: 'track' | 'block' | null) => {
    const key = comp.id || comp.google_place_id
    setSelections((prev) => {
      const next = new Map(prev)
      if (action === null) {
        next.delete(key)
      } else {
        next.set(key, { competitor: comp, action })
      }
      return next
    })
  }

  const handleLaunch = async () => {
    if (!selections.size) return
    setSaving(true)
    try {
      for (const [, sel] of selections) {
        let competitorId = sel.competitor.id

        if (!competitorId) {
          // Competitor not yet in DB — create it first
          const compRes = await authFetch(`${API}/api/v1/competitors`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: sel.competitor.name,
              address: sel.competitor.address,
              google_place_id: sel.competitor.google_place_id,
              platform: sel.competitor.platform || 'unknown',
            }),
          })
          const compData = await compRes.json()
          competitorId = compData.data?.id || compData.id
        }

        if (!competitorId) continue

        // Track or block at this location
        await authFetch(`${API}/api/v1/locations/${selectedLocationId}/competitors`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ competitor_id: competitorId, slot_type: sel.action }),
        })
      }
      navigate('/command-center')
    } finally {
      setSaving(false)
    }
  }

  const trackCount = [...selections.values()].filter((s) => s.action === 'track').length
  const blockCount = [...selections.values()].filter((s) => s.action === 'block').length
  const estimatedCost = (trackCount + blockCount) * 100

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, color: 'var(--accent-intel)', fontFamily: 'Space Mono, monospace', marginBottom: 8 }}>
          SETUP · STEP 2 OF 2
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
          Identify your rivals
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          Select which competitor dispensaries to track or block. Tracking monitors their prices and promotions. Blocking suppresses them from the platform entirely.
        </p>
      </div>

      {/* Location selector + scan button */}
      <div style={{ marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
        {locations.length > 1 && (
          <select
            value={selectedLocationId}
            onChange={(e) => setSelectedLocationId(e.target.value)}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 6,
              padding: '8px 12px',
              color: 'var(--text-primary)',
              fontSize: 13,
            }}
          >
            {locations.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        )}
        <button className="btn btn-ghost" onClick={handleDiscover} disabled={loading || !selectedLocationId}>
          {loading ? 'Scanning...' : 'Scan nearby dispensaries'}
        </button>
      </div>

      {/* Competitor list */}
      {competitors.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
            {loading ? 'Scanning nearby dispensaries...' : 'Click "Scan nearby dispensaries" to discover rivals in your market.'}
          </div>
          {!loading && (
            <button className="btn btn-primary" onClick={handleDiscover}>
              Scan nearby dispensaries
            </button>
          )}
        </div>
      ) : (
        <div style={{ marginBottom: 24 }}>
          {competitors.map((comp) => {
            const key = comp.id || comp.google_place_id
            const sel = selections.get(key)
            return (
              <div key={key} className="card" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>{comp.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {comp.address}{comp.distance_miles ? ` · ${comp.distance_miles.toFixed(1)} mi` : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn"
                    style={{
                      fontSize: 12,
                      padding: '5px 12px',
                      background: sel?.action === 'track' ? 'var(--accent-intel)' : 'transparent',
                      color: sel?.action === 'track' ? '#fff' : 'var(--text-secondary)',
                      border: `1px solid ${sel?.action === 'track' ? 'var(--accent-intel)' : 'var(--border-default)'}`,
                    }}
                    onClick={() => setSelection(comp, sel?.action === 'track' ? null : 'track')}
                  >
                    Track
                  </button>
                  <button
                    className="btn"
                    style={{
                      fontSize: 12,
                      padding: '5px 12px',
                      background: sel?.action === 'block' ? 'var(--accent-block)' : 'transparent',
                      color: sel?.action === 'block' ? '#fff' : 'var(--text-secondary)',
                      border: `1px solid ${sel?.action === 'block' ? 'var(--accent-block)' : 'var(--border-default)'}`,
                    }}
                    onClick={() => setSelection(comp, sel?.action === 'block' ? null : 'block')}
                  >
                    Block this rival
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {selections.size > 0 && (
        <div style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
          borderRadius: 6,
          padding: '12px 16px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {trackCount > 0 && <span>{trackCount} tracking</span>}
            {trackCount > 0 && blockCount > 0 && <span style={{ color: 'var(--text-muted)' }}> · </span>}
            {blockCount > 0 && <span style={{ color: 'var(--accent-block)' }}>{blockCount} blocked</span>}
          </div>
          <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 12, color: 'var(--text-primary)' }}>
            ${estimatedCost}/mo
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          className="btn btn-primary"
          onClick={handleLaunch}
          disabled={saving || selections.size === 0}
        >
          {saving ? 'Launching...' : 'Confirm & launch monitoring'}
        </button>
      </div>
    </div>
  )
}
