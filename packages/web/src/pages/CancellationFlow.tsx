import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBlocks } from '../hooks/useBlocks'

export default function CancellationFlow() {
  const navigate = useNavigate()
  const { blocks } = useBlocks()
  const [step, setStep] = useState(1)
  const [reason, setReason] = useState('')

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
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 16 }}>
              Consider these alternatives before canceling:
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Pause for 30 days', desc: 'Monitoring stops but your blocks stay active and data is preserved.' },
                { label: 'Reduce slot count', desc: 'Remove some tracked or blocked competitors to lower your monthly cost.' },
                { label: 'Pause one location', desc: 'Suspend a specific location without affecting your others.' },
              ].map((alt) => (
                <div key={alt.label} className="card" style={{ cursor: 'pointer' }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>
                    {alt.label}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{alt.desc}</div>
                </div>
              ))}
            </div>
          </div>

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

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => navigate(-1)}>
              Keep subscription
            </button>
            <button
              className="btn btn-danger"
              onClick={() => {
                // TODO: Call cancellation API
                navigate('/command-center')
              }}
            >
              Cancel subscription
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
