import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBlocks } from '../hooks/useBlocks'
import { useAuthFetch } from '../lib/useAuthFetch'

const API = import.meta.env.VITE_API_URL ?? ''

export default function CancellationFlow() {
  const navigate = useNavigate()
  const { blocks } = useBlocks()
  const [step, setStep] = useState(1)
  const [reason, setReason] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)
  const authFetch = useAuthFetch()

  return (
    <div style={{ maxWidth: 560, margin: '40px auto' }}>
      <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
        Cancel subscription
      </h1>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 32 }}>
        Before canceling, review what will change.
      </p>

      {/* Step 1: Active blocks consequence */}
      {step === 1 && (
        <div>
          {blocks.length > 0 && (
            <div className="card" style={{ borderTop: '2px solid var(--accent-block)', marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--accent-block)', fontFamily: 'Space Mono, monospace', marginBottom: 12 }}>
                ACTIVE BLOCKS — {blocks.length}
              </div>
              {blocks.map((block) => (
                <div key={block.id} style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  <span style={{ color: 'var(--text-primary)' }}>{block.competitor_name}</span>
                  {' '}— will be re-added to our prospect list. Our team typically follows up within 24–48 hours.
                </div>
              ))}
            </div>
          )}

          <div className="card" style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <p style={{ marginBottom: 8 }}>
                Canceling your CannaSpy subscription will:
              </p>
              <ul style={{ paddingLeft: 20, marginBottom: 0 }}>
                <li style={{ marginBottom: 4 }}>End all competitor monitoring immediately</li>
                <li style={{ marginBottom: 4 }}>Release all active blocks</li>
                <li style={{ marginBottom: 4 }}>Delete your alert history after 30 days</li>
              </ul>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => navigate(-1)}>
              Keep subscription
            </button>
            <button className="btn btn-danger" onClick={() => setStep(2)}>
              Continue with cancellation
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Alternatives */}
      {step === 2 && (
        <div>
          {/* Pause / reduce / pause-one-location alternatives removed for Sprint 0
              — they had no onClick handlers and no backing implementation. Restored
              in Sprint 6 when real handlers exist. */}

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              Reason for canceling (optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Help us understand how to improve..."
              style={{
                width: '100%',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                borderRadius: 6,
                padding: '8px 12px',
                color: 'var(--text-primary)',
                fontSize: 13,
                resize: 'vertical',
                minHeight: 80,
                outline: 'none',
              }}
            />
          </div>

          {cancelError && (
            <div style={{ marginBottom: 12, fontSize: 12, color: 'var(--accent-alert)' }}>
              {cancelError}
            </div>
          )}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => navigate(-1)}>
              Keep subscription
            </button>
            <button
              className="btn btn-danger"
              disabled={cancelling}
              onClick={async () => {
                setCancelling(true)
                setCancelError(null)
                try {
                  const res = await authFetch(`${API}/api/v1/billing/portal`, { method: 'POST' })
                  const body = await res.json()
                  if (!res.ok || !body.data?.url) {
                    setCancelError(body.error ?? 'Failed to reach billing portal. Please try again.')
                    setCancelling(false)
                    return
                  }
                  window.location.href = body.data.url
                } catch {
                  setCancelError('Failed to reach billing portal. Please try again.')
                  setCancelling(false)
                }
              }}
            >
              {cancelling ? 'Redirecting to Stripe...' : 'Cancel subscription'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
