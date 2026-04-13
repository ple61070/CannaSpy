import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthFetch } from '../lib/useAuthFetch'

const API = import.meta.env.VITE_API_URL ?? ''

export default function BlockConfirm() {
  const authFetch = useAuthFetch()
  const navigate = useNavigate()
  const location = useLocation()
  const { competitorId, competitorName, locationIds } = location.state || {}
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    setConfirming(true)
    setError(null)
    try {
      const res = await authFetch(`${API}/api/v1/blocks`, {
        method: 'POST',
        body: JSON.stringify({ competitor_id: competitorId, location_ids: locationIds || [] }),
      })
      if (!res.ok) throw new Error('Failed to create block')
      navigate('/blocks')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setConfirming(false)
    }
  }

  if (!competitorId) {
    return (
      <div style={{ padding: 32, textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>No competitor selected.</p>
        <button className="btn btn-ghost" onClick={() => navigate('/blocks')}>Back to Block Management</button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 480, margin: '40px auto' }}>
      <div className="card" style={{ borderTop: '2px solid var(--accent-block)' }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>
          Block {competitorName}?
        </h2>

        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
          <p style={{ marginBottom: 8 }}>
            This competitor will be removed from CannaSpy's prospect list immediately and will not be contacted while your block is active.
          </p>
          <p style={{ marginBottom: 8 }}>
            Monthly cost: <span style={{ fontFamily: 'Space Mono, monospace', color: 'var(--text-primary)' }}>$100/slot</span>
          </p>
          <p>
            Effective date: <span style={{ fontFamily: 'Space Mono, monospace', color: 'var(--text-primary)' }}>Immediately</span>
          </p>
        </div>

        {error && (
          <div style={{ color: 'var(--accent-alert)', fontSize: 13, marginBottom: 16 }}>{error}</div>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={() => navigate(-1)} disabled={confirming}>
            Go back
          </button>
          <button className="btn btn-block" onClick={handleConfirm} disabled={confirming}>
            {confirming ? 'Activating...' : 'Block this rival'}
          </button>
        </div>
      </div>
    </div>
  )
}
