import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthFetch } from '../lib/useAuthFetch'

const API = import.meta.env.VITE_API_URL ?? ''

interface LocationForm {
  name: string
  address: string
  dcc_license: string
  lat?: number
  lng?: number
}

const emptyForm: LocationForm = { name: '', address: '', dcc_license: '' }

export default function LocationWizard() {
  const authFetch = useAuthFetch()
  const navigate = useNavigate()
  const [locations, setLocations] = useState<LocationForm[]>([])
  const [current, setCurrent] = useState<LocationForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAdd = () => {
    if (!current.name || !current.address) return
    setLocations((prev) => [...prev, current])
    setCurrent(emptyForm)
  }

  const handleSaveAll = async () => {
    const toSave = current.name ? [...locations, current] : locations
    if (!toSave.length) return

    setSaving(true)
    setError(null)
    try {
      for (const loc of toSave) {
        const res = await authFetch(`${API}/api/v1/locations`, {
          method: 'POST',
          body: JSON.stringify(loc),
        })
        if (!res.ok) throw new Error('Failed to save location')
      }
      navigate('/setup/competitors')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const totalCost = (locations.length + (current.name ? 1 : 0)) * 100

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, color: 'var(--accent-intel)', fontFamily: 'Space Mono, monospace', marginBottom: 8 }}>
          SETUP · STEP 1 OF 2
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
          Add your dispensary locations
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          Each location is an independent monitoring node. Add all locations you want to start tracking from.
        </p>
      </div>

      {/* Added locations */}
      {locations.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          {locations.map((loc, i) => (
            <div key={i} className="card" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{loc.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{loc.address}</div>
              </div>
              <button
                className="btn btn-ghost"
                style={{ fontSize: 11, padding: '3px 8px' }}
                onClick={() => setLocations((prev) => prev.filter((_, j) => j !== i))}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add location form */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
            Location name
          </label>
          <input
            type="text"
            value={current.name}
            onChange={(e) => setCurrent((p) => ({ ...p, name: e.target.value }))}
            placeholder="e.g. West Hollywood Flagship"
            style={{
              width: '100%',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              borderRadius: 6,
              padding: '8px 12px',
              color: 'var(--text-primary)',
              fontSize: 13,
              outline: 'none',
            }}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
            Street address
          </label>
          <input
            type="text"
            value={current.address}
            onChange={(e) => setCurrent((p) => ({ ...p, address: e.target.value }))}
            placeholder="123 Main St, Los Angeles, CA"
            style={{
              width: '100%',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              borderRadius: 6,
              padding: '8px 12px',
              color: 'var(--text-primary)',
              fontSize: 13,
              outline: 'none',
            }}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
            DCC license number <span style={{ color: 'var(--text-muted)' }}>(optional)</span>
          </label>
          <input
            type="text"
            value={current.dcc_license}
            onChange={(e) => setCurrent((p) => ({ ...p, dcc_license: e.target.value }))}
            placeholder="C10-0000000-LIC"
            style={{
              width: '100%',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              borderRadius: 6,
              padding: '8px 12px',
              color: 'var(--text-primary)',
              fontSize: 13,
              fontFamily: 'Space Mono, monospace',
              outline: 'none',
            }}
          />
        </div>
        <button
          className="btn btn-ghost"
          onClick={handleAdd}
          disabled={!current.name || !current.address}
        >
          + Add another location
        </button>
      </div>

      {/* Cost preview */}
      {totalCost > 0 && (
        <div style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
          borderRadius: 6,
          padding: '10px 16px',
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 12,
        }}>
          <span style={{ color: 'var(--text-secondary)' }}>Starting slot budget estimate</span>
          <span style={{ fontFamily: 'Space Mono, monospace', color: 'var(--text-primary)' }}>
            ${totalCost}/mo at base rate
          </span>
        </div>
      )}

      {error && (
        <div style={{ color: 'var(--accent-alert)', fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          className="btn btn-primary"
          onClick={handleSaveAll}
          disabled={saving || (locations.length === 0 && !current.name)}
        >
          {saving ? 'Saving...' : 'Continue to competitor discovery'}
        </button>
      </div>
    </div>
  )
}
