import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthFetch } from '../lib/useAuthFetch'

const API = import.meta.env.VITE_API_URL ?? ''

interface Location {
  id: string
  name: string
  address: string
  dcc_license?: string
  active: boolean
}

export default function LocationManagement() {
  const authFetch = useAuthFetch()
  const navigate = useNavigate()
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    authFetch(`${API}/api/v1/locations`)
      .then((r) => r.json())
      .then((data) => { setLocations(data.locations || []); setLoading(false) })
  }, [])

  const toggleActive = async (id: string, active: boolean) => {
    await authFetch(`${API}/api/v1/locations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ active: !active }),
    })
    setLocations((prev) => prev.map((l) => l.id === id ? { ...l, active: !active } : l))
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)' }}>
          Location Management
        </h1>
        <button className="btn btn-primary" onClick={() => navigate('/setup/locations')}>
          Add location
        </button>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading locations...</div>
      ) : locations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 64 }}>
          <div style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 16 }}>
            No locations configured. Add your first dispensary location to begin monitoring.
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/setup/locations')}>
            Add location
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {locations.map((loc) => (
            <div key={loc.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: loc.active ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {loc.name}
                  </span>
                  <span style={{
                    fontSize: 10,
                    fontFamily: 'Space Mono, monospace',
                    color: loc.active ? 'var(--accent-intel)' : 'var(--text-muted)',
                    background: loc.active ? 'rgba(29, 158, 117, 0.1)' : 'var(--bg-elevated)',
                    padding: '1px 5px',
                    borderRadius: 3,
                  }}>
                    {loc.active ? 'ACTIVE' : 'PAUSED'}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{loc.address}</div>
                {loc.dcc_license && (
                  <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {loc.dcc_license}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-ghost"
                  style={{ fontSize: 12 }}
                  onClick={() => navigate(`/locations/${loc.id}`)}
                >
                  View dashboard
                </button>
                <button
                  className="btn btn-ghost"
                  style={{ fontSize: 12 }}
                  onClick={() => toggleActive(loc.id, loc.active)}
                >
                  {loc.active ? 'Pause' : 'Resume'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
