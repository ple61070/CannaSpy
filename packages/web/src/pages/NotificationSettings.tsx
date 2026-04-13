import { useState, useEffect } from 'react'
import { useAuthFetch } from '../lib/useAuthFetch'

const API = import.meta.env.VITE_API_URL ?? ''

interface Preferences {
  digest_frequency: 'realtime' | 'daily' | 'weekly'
  email_enabled: boolean
  push_enabled: boolean
  price_threshold_pct: number
}

const defaults: Preferences = {
  digest_frequency: 'realtime',
  email_enabled: true,
  push_enabled: true,
  price_threshold_pct: 5,
}

export default function NotificationSettings() {
  const authFetch = useAuthFetch()
  const [prefs, setPrefs] = useState<Preferences>(defaults)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    authFetch(`${API}/api/v1/settings/notifications`)
      .then((r) => r.json())
      .then((data) => {
        const d = data.data || {}
        setPrefs({
          digest_frequency: d.digest_frequency || 'realtime',
          email_enabled: d.email_enabled ?? true,
          push_enabled: d.push_enabled ?? true,
          price_threshold_pct: d.price_threshold_pct ?? 5,
        })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    await authFetch(`${API}/api/v1/settings/notifications`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prefs),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) {
    return <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: 32 }}>Loading preferences...</div>
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 24 }}>
        Notification Settings
      </h1>

      <div className="card card-trust" style={{ marginBottom: 16 }}>
        <div className="mono" style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>
          DELIVERY
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
            Alert frequency
          </label>
          <select
            value={prefs.digest_frequency}
            onChange={(e) => setPrefs((p) => ({ ...p, digest_frequency: e.target.value as any }))}
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              borderRadius: 6,
              padding: '8px 12px',
              color: 'var(--text-primary)',
              fontSize: 13,
            }}
          >
            <option value="realtime">Real-time (as detected)</option>
            <option value="daily">Daily digest</option>
            <option value="weekly">Weekly digest</option>
          </select>
        </div>

        <div style={{ marginBottom: 16, display: 'flex', gap: 24 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={prefs.email_enabled}
              onChange={(e) => setPrefs((p) => ({ ...p, email_enabled: e.target.checked }))}
              style={{ accentColor: 'var(--accent-intel)' }}
            />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Email alerts</span>
          </label>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
            Price change threshold — only alert if change &gt; X%
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="number"
              min="1"
              max="50"
              value={prefs.price_threshold_pct}
              onChange={(e) => setPrefs((p) => ({ ...p, price_threshold_pct: parseFloat(e.target.value) }))}
              style={{
                width: 80,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                borderRadius: 6,
                padding: '8px 12px',
                color: 'var(--text-primary)',
                fontSize: 13,
                fontFamily: 'Space Mono, monospace',
              }}
            />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>%</span>
          </div>
        </div>
      </div>

      <button className="btn btn-primary" onClick={handleSave}>
        {saved ? 'Preferences saved' : 'Save preferences'}
      </button>
    </div>
  )
}
