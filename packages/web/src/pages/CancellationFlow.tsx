import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthFetch } from '../lib/useAuthFetch'

const API = import.meta.env.VITE_API_URL ?? ''

type Step = 1 | 2 | 3
type ReasonKey = 'price' | 'not-using' | 'missing' | 'switching' | 'closing' | 'other' | null

const STEP_LABELS: Record<number, string> = { 1: 'Reason', 2: 'Consequences', 3: 'Confirm' }

// ── Sub-components ──────────────────────────────────────────────────────────

function CcIcon({ type, children }: { type: 'teal' | 'rose' | 'warm' | 'danger'; children: React.ReactNode }) {
  const colors: Record<string, { bg: string; color: string }> = {
    teal: { bg: 'var(--accent-soft)', color: 'var(--accent)' },
    rose: { bg: 'var(--rose-soft)', color: 'var(--rose)' },
    warm: { bg: 'var(--warm-soft)', color: 'var(--warm)' },
    danger: { bg: 'var(--danger-soft)', color: 'var(--danger)' },
  }
  return (
    <div style={{
      width: 28, height: 28, borderRadius: 8,
      background: colors[type].bg, color: colors[type].color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, marginTop: 1,
    }}>
      {children}
    </div>
  )
}

function CcRow({ type, title, desc }: { type: 'teal' | 'rose' | 'warm' | 'danger'; title: string; desc: string }) {
  const icons: Record<string, React.ReactNode> = {
    teal: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 13, height: 13 }}><polyline points="20 6 9 17 4 12" /></svg>,
    rose: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 13, height: 13 }}><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>,
    warm: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 13, height: 13 }}><circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" /></svg>,
    danger: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 13, height: 13 }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
  }
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 12,
      padding: '12px 20px',
      borderBottom: '1px solid var(--border)',
    }}>
      <CcIcon type={type}>{icons[type]}</CcIcon>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)', marginBottom: 2 }}>{title}</div>
        <div style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.6 }}>{desc}</div>
      </div>
    </div>
  )
}

// ── Main component ──────────────────────────────────────────────────────────

export default function CancellationFlow() {
  const navigate = useNavigate()
  const authFetch = useAuthFetch()

  const [step, setStep] = useState<Step>(1)
  const [reason, setReason] = useState<ReasonKey>(null)
  const [otherText, setOtherText] = useState('')
  const [acknowledged, setAcknowledged] = useState(false)
  const [done, setDone] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [toastVisible, setToastVisible] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  function showToast(msg: string) {
    setToastMsg(msg)
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 2800)
  }

  function goStep(n: Step) {
    setStep(n)
    window.scrollTo(0, 0)
  }

  async function submitCancel() {
    if (!acknowledged) return
    setSubmitting(true)
    try {
      await authFetch(`${API}/api/v1/billing/cancel`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason, otherText }) })
    } catch {
      // proceed to done state regardless — UI-only for now
    }
    setSubmitting(false)
    setDone(true)
    window.scrollTo(0, 0)
  }

  // ── STEP BAR ─────────────────────────────────────────────────────────────

  function StepBar() {
    return (
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: '14px 28px',
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        gap: 0,
      }}>
        {([1, 2, 3] as Step[]).map((i) => {
          const isDone = i < step
          const isActive = i === step
          return (
            <React.Fragment key={i}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700,
                  flexShrink: 0,
                  transition: 'all 0.2s',
                  background: isDone ? 'var(--accent)' : isActive ? 'var(--danger)' : 'var(--surface-3)',
                  color: isDone || isActive ? '#fff' : 'var(--text-3)',
                  border: isDone || isActive ? 'none' : '1.5px solid var(--border-2)',
                  boxShadow: isActive ? '0 0 0 3px rgba(224,90,106,0.2)' : 'none',
                }}>
                  {isDone
                    ? <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" style={{ width: 11, height: 11 }}><polyline points="20 6 9 17 4 12" /></svg>
                    : i}
                </div>
                <div style={{
                  fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 600,
                  color: isActive ? 'var(--danger)' : isDone ? 'var(--text-3)' : 'var(--text-3)',
                }}>
                  {STEP_LABELS[i]}
                </div>
              </div>
              {i < 3 && (
                <div style={{
                  flex: 1, height: 1,
                  background: i < step ? 'var(--accent)' : 'var(--border-2)',
                  margin: '0 10px',
                  transition: 'background 0.2s',
                }} />
              )}
            </React.Fragment>
          )
        })}
      </div>
    )
  }

  // ── REASON OPTIONS ────────────────────────────────────────────────────────

  const REASONS: { key: ReasonKey; label: string; sub: string }[] = [
    { key: 'price', label: 'Price — too expensive for the value', sub: 'The subscription cost is not justified by the intelligence it provides.' },
    { key: 'not-using', label: 'Not using it enough', sub: 'We signed up but the team has not integrated it into our workflow.' },
    { key: 'missing', label: 'Missing features we need', sub: 'The product does not cover something important to our operation.' },
    { key: 'switching', label: 'Switching to another tool', sub: 'We found an alternative that better fits our needs.' },
    { key: 'closing', label: 'Business change — closing locations or consolidating', sub: 'Our footprint is shrinking and we no longer need this level of coverage.' },
    { key: 'other', label: 'Other', sub: '' },
  ]

  // ── DONE STATE ────────────────────────────────────────────────────────────

  if (done) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        textAlign: 'center', padding: '60px 28px',
        fontFamily: 'var(--sans)',
        minHeight: '100vh',
        background: 'radial-gradient(ellipse 1200px 700px at 15% -5%,var(--bg-g1),transparent),radial-gradient(ellipse 900px 500px at 85% 5%,var(--bg-g2),transparent),var(--bg)',
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 20,
          background: 'var(--surface)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 20, boxShadow: 'var(--card-shadow)',
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 28, height: 28, color: 'var(--text-2)' }}>
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em', marginBottom: 8 }}>
          Cancellation confirmed
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-2)', maxWidth: 420, margin: '0 auto 28px', lineHeight: 1.7 }}>
          Your subscription is cancelled. Access continues through Apr 30. All blocks remain in place until May 1 — we will notify both rivals when the block period ends.
        </div>
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '18px 20px',
          maxWidth: 420, width: '100%', marginBottom: 28,
          textAlign: 'left', boxShadow: 'var(--card-shadow)',
        }}>
          {[
            { label: 'Access ends', val: 'Apr 30, 2026' },
            { label: 'Blocks release', val: 'May 1, 2026' },
            { label: 'Data retained until', val: 'Jul 30, 2026' },
            { label: 'Final invoice', val: '$14,025 (Apr 1 — paid)' },
            { label: 'Confirmation email', val: 'Sent to your account email' },
          ].map((row, idx, arr) => (
            <div key={row.label} style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '6px 0', fontSize: 12,
              borderBottom: idx < arr.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <span style={{ color: 'var(--text-2)' }}>{row.label}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600, color: 'var(--text-1)' }}>{row.val}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              padding: '10px 20px', borderRadius: 8, fontSize: 12, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'var(--sans)',
              border: '1.5px solid var(--border-2)', background: 'var(--surface-3)', color: 'var(--text-1)',
              transition: 'all 0.2s',
            }}
          >
            Back to dashboard
          </button>
          <button
            onClick={() => { showToast('Reactivating… redirecting to billing'); setTimeout(() => navigate('/billing'), 1200) }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              padding: '10px 20px', borderRadius: 8, fontSize: 12, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'var(--sans)',
              border: '1.5px solid var(--accent)', background: 'var(--accent)', color: '#fff',
              boxShadow: '0 4px 18px rgba(9,161,161,0.32)', transition: 'all 0.2s',
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
              <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-.18-5.27" />
            </svg>
            Reactivate subscription
          </button>
        </div>
        {/* Toast */}
        <div style={{
          position: 'fixed', bottom: 24, left: '50%',
          transform: `translateX(-50%) translateY(${toastVisible ? 0 : 80}px)`,
          background: 'var(--text-1)', color: 'var(--surface)',
          padding: '9px 18px', borderRadius: 20,
          fontSize: 12, fontWeight: 600, fontFamily: 'var(--mono)',
          zIndex: 9000,
          transition: 'transform 0.3s cubic-bezier(.2,.8,.2,1), opacity 0.3s',
          opacity: toastVisible ? 1 : 0,
          pointerEvents: 'none',
        }}>
          {toastMsg}
        </div>
      </div>
    )
  }

  // ── MAIN WIZARD ───────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '100vh', fontFamily: 'var(--sans)' }}>
      {/* Topbar */}
      <div style={{
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        padding: '0 28px', position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0' }}>
          <div
            onClick={() => navigate('/billing')}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)',
              cursor: 'pointer', flexShrink: 0, transition: 'opacity 0.2s',
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 12, height: 12 }}>
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to Billing
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
              Cancel subscription
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)' }}>
              Step {step} of 3 · {STEP_LABELS[step]}
            </div>
          </div>
        </div>
      </div>

      {/* Step bar */}
      <StepBar />

      {/* ═══ STEP 1 — REASON ═══ */}
      {step === 1 && (
        <div style={{ flex: 1, padding: '36px 28px', maxWidth: 640, margin: '0 auto', width: '100%' }}>
          {/* Account summary */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 12, padding: 20,
            boxShadow: 'var(--card-shadow)',
            marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 16,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: 'linear-gradient(135deg,#09A1A1,#F6C992)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', marginBottom: 3 }}>Acme Dispensary Group</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)' }}>Member since Jan 2026 · 10 locations · Elite market</div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 16, flexShrink: 0 }}>
              {[
                { n: '81', l: 'Slots', color: 'var(--text-1)' },
                { n: '2', l: 'Active blocks', color: 'var(--rose)' },
                { n: '$14,025', l: 'Monthly', color: 'var(--text-1)' },
              ].map((s) => (
                <div key={s.l} style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.n}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Reason selector */}
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 12 }}>Why are you cancelling?</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {REASONS.map((r) => (
              <div
                key={r.key}
                onClick={() => setReason(r.key)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '12px 16px', borderRadius: 8,
                  border: `1.5px solid ${reason === r.key ? 'var(--danger)' : 'var(--border-2)'}`,
                  background: reason === r.key ? 'var(--danger-soft)' : 'var(--surface)',
                  cursor: 'pointer', transition: 'all 0.2s', userSelect: 'none',
                }}
              >
                <div style={{
                  width: 18, height: 18, borderRadius: '50%',
                  border: `1.5px solid ${reason === r.key ? 'var(--danger)' : 'var(--border-2)'}`,
                  background: reason === r.key ? 'var(--danger)' : 'var(--surface-3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, marginTop: 1, transition: 'all 0.2s',
                }}>
                  <div style={{
                    width: 7, height: 7, borderRadius: '50%', background: '#fff',
                    opacity: reason === r.key ? 1 : 0, transition: 'opacity 0.2s',
                  }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 2 }}>{r.label}</div>
                  {r.key !== 'other' && (
                    <div style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.5 }}>{r.sub}</div>
                  )}
                  {r.key === 'other' && (
                    <textarea
                      value={otherText}
                      onChange={(e) => setOtherText(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      rows={2}
                      placeholder="Tell us more (optional)..."
                      style={{
                        width: '100%', marginTop: 8, padding: '8px 12px',
                        borderRadius: 8, border: '1.5px solid var(--border-2)',
                        background: 'var(--surface-2)', fontFamily: 'var(--sans)',
                        fontSize: 12, color: 'var(--text-1)', resize: 'none', outline: 'none',
                        transition: 'border-color 0.2s',
                      }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 40 }}>
            <button
              onClick={() => navigate('/billing')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                padding: '12px 24px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'var(--sans)',
                border: '1.5px solid var(--border-2)', background: 'var(--surface-3)', color: 'var(--text-1)',
                transition: 'all 0.2s',
              }}
            >
              Keep subscription
            </button>
            <button
              onClick={() => reason && goStep(2)}
              disabled={!reason}
              style={{
                flex: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                padding: '12px 24px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                cursor: reason ? 'pointer' : 'not-allowed', fontFamily: 'var(--sans)',
                border: '1.5px solid rgba(224,90,106,0.3)', background: 'transparent', color: 'var(--danger)',
                opacity: reason ? 1 : 0.35, transition: 'all 0.2s',
              }}
            >
              Continue
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 14, height: 14 }}>
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ═══ STEP 2 — CONSEQUENCES ═══ */}
      {step === 2 && (
        <div style={{ flex: 1, padding: '36px 28px', maxWidth: 640, margin: '0 auto', width: '100%' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>What happens when you cancel</div>
          <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 18 }}>
            Review all changes before confirming. Your subscription remains active through Apr 30 — cancellation takes effect May 1.
          </div>

          {/* Consequences card */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 12, boxShadow: 'var(--card-shadow)',
            marginBottom: 16, overflow: 'hidden',
          }}>
            <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 3 }}>Account changes</div>
              <div style={{ fontSize: 11, color: 'var(--text-2)' }}>Effective May 1 — end of current billing period</div>
            </div>
            <div>
              <CcRow type="teal" title="Intelligence access active through Apr 30" desc="Pricing, promotions, and catalog monitoring continue normally through the end of the current billing period. No access is revoked early." />
              <CcRow type="teal" title="All historical data retained" desc="Your 4 months of pricing history, competitor intelligence, and alert records are stored in your account for 90 days after cancellation. No data is deleted immediately." />
              <CcRow type="rose" title="Intelligence access ends May 1" desc="Live price monitoring, promo tracking, alert feed, and the competitor dashboard are deactivated on May 1. You will not receive any further competitor intelligence after this date." />
              <CcRow type="warm" title="All active blocks release May 1" desc="Your 2 active blocks on STIIIZY and Off The Charts will be released. Both dispensaries will be added to our active prospect list and contacted within 24–48 hours. If they subscribe, they will be able to access CannaSpy intelligence." />
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '12px 20px',
              }}>
                <CcIcon type="danger">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 13, height: 13 }}>
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </CcIcon>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)', marginBottom: 2 }}>No refund for remaining days in April</div>
                  <div style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.6 }}>The April invoice of $14,025 has been paid and will not be refunded. Cancelling now stops future billing — it does not reverse the current period charge.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Blocks releasing */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 12, boxShadow: 'var(--card-shadow)',
            marginBottom: 20, overflow: 'hidden',
          }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>Blocks releasing on May 1</div>
              <div style={{
                fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700,
                padding: '3px 9px', borderRadius: 12,
                background: 'var(--rose-soft)', color: 'var(--rose)',
                border: '1px solid rgba(211,150,166,0.3)',
              }}>2 active blocks</div>
            </div>
            {[
              { initials: 'ST', bg: '#3d7a8a', name: 'STIIIZY West Hollywood', meta: '47 days blocked · 10 locations · WeHo / DTLA / SoMa SF', slots: '10 slots released', cost: '$2,000/mo removed' },
              { initials: 'OT', bg: '#6b5b95', name: 'Off The Charts DTLA', meta: '22 days blocked · 8 locations · DTLA / Koreatown / Long Beach', slots: '8 slots released', cost: '$1,600/mo removed' },
            ].map((b) => (
              <div key={b.initials} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 20px', borderBottom: '1px solid var(--border)',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: b.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0,
                }}>{b.initials}</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)', marginBottom: 2 }}>{b.name}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)' }}>{b.meta}</div>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, color: 'var(--rose)' }}>{b.slots}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)' }}>{b.cost}</div>
                </div>
                <div style={{
                  fontFamily: 'var(--mono)', fontSize: 9, padding: '3px 8px', borderRadius: 6,
                  background: 'var(--warm-soft)', color: 'var(--warm)',
                  border: '1px solid rgba(212,144,10,0.2)', whiteSpace: 'nowrap',
                }}>Added to prospect list May 1</div>
              </div>
            ))}
          </div>

          {/* Billing impact */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 12, boxShadow: 'var(--card-shadow)',
            marginBottom: 20, overflow: 'hidden',
          }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>Billing impact</div>
            </div>
            {[
              { label: 'April invoice (already paid)', val: '$14,025 — no refund', color: 'var(--text-1)' },
              { label: 'May 1 and beyond', val: '$0 — no further charges', color: 'var(--accent)' },
              { label: 'Data retained until', val: 'Jul 30 (90 days)', color: 'var(--text-1)' },
            ].map((row, idx, arr) => (
              <div key={row.label} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 20px', fontSize: 12,
                borderBottom: idx < arr.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <span style={{ color: 'var(--text-2)' }}>{row.label}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600, color: row.color }}>{row.val}</span>
              </div>
            ))}
          </div>

          {/* Pause alternative */}
          <div style={{
            background: 'var(--accent-soft)',
            border: '1px solid rgba(9,161,161,0.2)',
            borderRadius: 12, padding: '18px 20px', marginBottom: 20,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 7 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
                <circle cx="12" cy="12" r="10" /><line x1="10" y1="15" x2="10" y2="9" /><line x1="14" y1="15" x2="14" y2="9" />
              </svg>
              Consider pausing instead
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 12 }}>
              If your concern is cost or workflow, pausing suspends billing and monitoring without releasing your blocks. Your rivals remain blocked, your data is preserved, and you can reactivate at any time with no loss of competitive position.
            </div>
            <button
              onClick={() => showToast('Pause option — contact your account manager to set up')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 8,
                background: 'var(--accent)', color: '#fff',
                fontSize: 12, fontWeight: 700, cursor: 'pointer',
                fontFamily: 'var(--sans)', border: 'none', transition: 'all 0.2s',
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 12, height: 12 }}>
                <circle cx="12" cy="12" r="10" /><line x1="10" y1="15" x2="10" y2="9" /><line x1="14" y1="15" x2="14" y2="9" />
              </svg>
              Pause subscription instead
            </button>
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 40 }}>
            <button
              onClick={() => navigate('/billing')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                padding: '12px 24px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'var(--sans)',
                border: '1.5px solid var(--accent)', background: 'var(--accent)', color: '#fff',
                boxShadow: '0 4px 18px rgba(9,161,161,0.32)', transition: 'all 0.2s',
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Keep subscription
            </button>
            <button
              onClick={() => goStep(3)}
              style={{
                flex: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                padding: '12px 24px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'var(--sans)',
                border: '1.5px solid rgba(224,90,106,0.3)', background: 'transparent', color: 'var(--danger)',
                transition: 'all 0.2s',
              }}
            >
              Continue to confirm
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 14, height: 14 }}>
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ═══ STEP 3 — CONFIRM ═══ */}
      {step === 3 && (
        <div style={{ flex: 1, padding: '36px 28px', maxWidth: 640, margin: '0 auto', width: '100%' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>Final confirmation</div>
          <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 20 }}>
            Cancellation is processed immediately. Your subscription remains active through Apr 30.
          </div>

          {/* Compact summary */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 12, boxShadow: 'var(--card-shadow)',
            marginBottom: 16, overflow: 'hidden',
          }}>
            <CcRow type="teal" title="Access continues through Apr 30" desc="Full platform access and monitoring remain active for the remainder of the billing period." />
            <CcRow type="warm" title="Blocks on STIIIZY and Off The Charts release May 1" desc="Both rivals will be contacted by our sales team within 24–48 hours. If they contact CannaSpy directly before then, they will receive a response." />
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              padding: '12px 20px',
            }}>
              <CcIcon type="danger">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 13, height: 13 }}>
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </CcIcon>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)', marginBottom: 2 }}>No refund for April</div>
                <div style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.6 }}>$14,025 already paid. No further charges after May 1.</div>
              </div>
            </div>
          </div>

          {/* Acknowledgement checkbox */}
          <div
            onClick={() => setAcknowledged(!acknowledged)}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              background: acknowledged ? 'var(--danger-soft)' : 'var(--surface)',
              border: `1.5px solid ${acknowledged ? 'var(--danger)' : 'var(--border-2)'}`,
              borderRadius: 8, padding: '14px 16px',
              marginBottom: 20, cursor: 'pointer', transition: 'all 0.2s',
            } as React.CSSProperties}
          >
            <div style={{
              width: 20, height: 20, borderRadius: 5,
              border: `1.5px solid ${acknowledged ? 'var(--danger)' : 'var(--border-2)'}`,
              background: acknowledged ? 'var(--danger)' : 'var(--surface-3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, marginTop: 1, transition: 'all 0.2s',
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" style={{ width: 11, height: 11, opacity: acknowledged ? 1 : 0, transition: 'opacity 0.2s' }}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-1)', lineHeight: 1.6 }}>
              I understand that cancelling will release all active blocks on May 1, that both STIIIZY and Off The Charts will be contacted and may subsequently access CannaSpy, and that the April invoice will not be refunded.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 40 }}>
            <button
              onClick={() => navigate('/billing')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                padding: '12px 24px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'var(--sans)',
                border: '1.5px solid var(--accent)', background: 'var(--accent)', color: '#fff',
                boxShadow: '0 4px 18px rgba(9,161,161,0.32)', transition: 'all 0.2s',
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Keep subscription
            </button>
            <button
              onClick={submitCancel}
              disabled={!acknowledged || submitting}
              style={{
                flex: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                padding: '12px 24px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                cursor: acknowledged && !submitting ? 'pointer' : 'not-allowed', fontFamily: 'var(--sans)',
                border: '1.5px solid rgba(224,90,106,0.3)', background: 'transparent', color: 'var(--danger)',
                opacity: acknowledged && !submitting ? 1 : 0.35, transition: 'all 0.2s',
              }}
            >
              {submitting ? 'Cancelling…' : 'Cancel subscription'}
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      <div style={{
        position: 'fixed', bottom: 24, left: '50%',
        transform: `translateX(-50%) translateY(${toastVisible ? 0 : 80}px)`,
        background: 'var(--text-1)', color: 'var(--surface)',
        padding: '9px 18px', borderRadius: 20,
        fontSize: 12, fontWeight: 600, fontFamily: 'var(--mono)',
        zIndex: 9000,
        transition: 'transform 0.3s cubic-bezier(.2,.8,.2,1), opacity 0.3s',
        opacity: toastVisible ? 1 : 0,
        pointerEvents: 'none',
      }}>
        {toastMsg}
      </div>
    </div>
  )
}
