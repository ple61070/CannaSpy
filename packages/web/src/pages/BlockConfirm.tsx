import { useState, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthFetch } from '../lib/useAuthFetch'

const API = import.meta.env.VITE_API_URL ?? ''

interface LocItem {
  id: string
  name: string
  tier: 'Elite' | 'Hot' | 'Competitive' | 'Standard'
  rate: number
  selected: boolean
}

const TIER_COLOR: Record<string, { bg: string; color: string }> = {
  Elite: { bg: 'rgba(211,150,166,0.14)', color: 'var(--rose)' },
  Hot: { bg: 'rgba(211,150,166,0.14)', color: 'var(--rose)' },
  Competitive: { bg: 'rgba(84,132,164,0.12)', color: 'var(--slate)' },
  Standard: { bg: 'var(--surface-3)', color: 'var(--text-3)' },
}

const DEFAULT_LOCS: LocItem[] = [
  { id: 'weho', name: 'WeHo Flagship', tier: 'Elite', rate: 200, selected: true },
  { id: 'dtla', name: 'DTLA Flagship', tier: 'Elite', rate: 200, selected: false },
  { id: 'sf', name: 'SoMa SF', tier: 'Elite', rate: 200, selected: false },
  { id: 'oak', name: 'Oakland', tier: 'Hot', rate: 200, selected: false },
  { id: 'sd', name: 'San Diego', tier: 'Competitive', rate: 150, selected: true },
  { id: 'lb', name: 'Long Beach', tier: 'Competitive', rate: 150, selected: false },
  { id: 'kor', name: 'Koreatown', tier: 'Competitive', rate: 150, selected: true },
  { id: 'culver', name: 'Culver City', tier: 'Standard', rate: 100, selected: false },
  { id: 'pas', name: 'Pasadena', tier: 'Standard', rate: 100, selected: false },
  { id: 'corona', name: 'Corona', tier: 'Standard', rate: 100, selected: false },
]

export default function BlockConfirm() {
  const navigate = useNavigate()
  const location = useLocation()
  const authFetch = useAuthFetch()

  // Competitor passed via router state, fall back to static demo
  const competitor = (location.state as { competitorName?: string; competitorId?: string } | null) ?? {}
  const competitorName = competitor.competitorName ?? 'MedMen West Hollywood'
  const competitorId = competitor.competitorId ?? ''

  const [locs, setLocs] = useState<LocItem[]>(DEFAULT_LOCS)
  const [confirming, setConfirming] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [toastVisible, setToastVisible] = useState(false)

  const selected = useMemo(() => locs.filter((l) => l.selected), [locs])
  const total = useMemo(() => selected.reduce((s, l) => s + l.rate, 0), [selected])

  // Billing preview calculations
  const today = new Date()
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  const daysRemaining = daysInMonth - today.getDate() + 1
  const dailyRate = total / daysInMonth
  const prorated = Math.round(dailyRate * daysRemaining)
  const perDay = Math.round(dailyRate)

  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)
  const earliestExit = new Date(today.getFullYear(), today.getMonth() + 2, 1)
  const fmtDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const fmtDateShort = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  function toggleLoc(id: string) {
    setLocs((prev) => prev.map((l) => l.id === id ? { ...l, selected: !l.selected } : l))
  }

  function toggleAll() {
    const allSelected = locs.every((l) => l.selected)
    setLocs((prev) => prev.map((l) => ({ ...l, selected: !allSelected })))
  }

  function showToast(msg: string) {
    setToastMsg(msg)
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 2600)
  }

  async function handleConfirm() {
    if (!selected.length || confirming) return
    setConfirming(true)
    try {
      await authFetch(`${API}/api/v1/blocks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competitorId, locationIds: selected.map((l) => l.id) }),
      })
    } catch {
      // proceed regardless
    }
    showToast(`Block activated — ${competitorName} blocked at ${selected.length} location${selected.length > 1 ? 's' : ''}`)
    setTimeout(() => navigate('/blocks'), 1800)
  }

  // Group selected by tier for breakdown
  const tierGroups = useMemo(() => {
    const g: Record<string, { count: number; rate: number }> = {}
    selected.forEach((l) => {
      if (!g[l.tier]) g[l.tier] = { count: 0, rate: l.rate }
      g[l.tier].count++
    })
    return g
  }, [selected])

  const btnLabel = selected.length === 0
    ? 'Select at least one location'
    : `Confirm — pay $${prorated.toLocaleString()} today, then $${total.toLocaleString()}/mo from ${fmtDate(nextMonth)}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '100vh', fontFamily: 'var(--sans)' }}>
      {/* Topbar */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '0 24px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0' }}>
          <div onClick={() => navigate('/blocks')} style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', cursor: 'pointer', transition: 'opacity 0.2s' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 12, height: 12 }}><polyline points="15 18 9 12 15 6" /></svg>
            Back to Block Management
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Block Confirm</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)' }}>{competitorName} · Step 1 of 2</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '32px 24px', maxWidth: 780, margin: '0 auto', width: '100%' }}>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--rose)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, boxShadow: '0 0 0 3px rgba(211,150,166,0.25)' }}>1</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 600, color: 'var(--rose)', letterSpacing: '0.06em' }}>Select locations</div>
          </div>
          <div style={{ flex: 1, height: 1, background: 'var(--border-2)', margin: '0 8px' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--surface-3)', color: 'var(--text-3)', border: '1.5px solid var(--border-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700 }}>2</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.06em' }}>Confirm & activate</div>
          </div>
        </div>

        {/* Rival card */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, boxShadow: 'var(--card-shadow)', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: '#c88a20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0 }}>MM</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', marginBottom: 3 }}>{competitorName}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)' }}>0.8 mi · WeHo market · Currently tracking · 12 changes this week</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            {[{ n: '1,847', l: 'Total SKUs' }, { n: '12', l: 'Changes this week' }, { n: '0.8 mi', l: 'Nearest location' }].map((s) => (
              <div key={s.l} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 700, color: 'var(--text-1)', lineHeight: 1, marginBottom: 3 }}>{s.n}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Location selector */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, boxShadow: 'var(--card-shadow)', marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>Select locations to block at</div>
          <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 16 }}>Block hides this rival from every location you select. Each location is one slot at the market rate for that area.</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span onClick={toggleAll} style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', cursor: 'pointer', transition: 'opacity 0.2s' }}>
              {locs.every((l) => l.selected) ? 'Deselect all' : 'Select all'}
            </span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)' }}>{selected.length} of {locs.length} selected</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
            {locs.map((l) => (
              <div
                key={l.id}
                onClick={() => toggleLoc(l.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', borderRadius: 8,
                  border: `1.5px solid ${l.selected ? 'var(--rose)' : 'var(--border)'}`,
                  background: l.selected ? 'var(--rose-soft)' : 'var(--surface-2)',
                  cursor: 'pointer', transition: 'all 0.2s', userSelect: 'none',
                }}
              >
                <div style={{
                  width: 18, height: 18, borderRadius: 4,
                  border: `1.5px solid ${l.selected ? 'var(--rose)' : 'var(--border-2)'}`,
                  background: l.selected ? 'var(--rose)' : 'var(--surface)',
                  flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s',
                }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" style={{ width: 10, height: 10, opacity: l.selected ? 1 : 0, transition: 'opacity 0.2s' }}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)', flex: 1 }}>{l.name}</div>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 9, padding: '2px 6px', borderRadius: 4, background: TIER_COLOR[l.tier].bg, color: TIER_COLOR[l.tier].color }}>{l.tier}</span>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', flexShrink: 0 }}>${l.rate}/mo</div>
              </div>
            ))}
          </div>
        </div>

        {/* Cost summary */}
        <div style={{ background: 'linear-gradient(135deg,rgba(211,150,166,0.12),rgba(211,150,166,0.05))', border: '1px solid rgba(211,150,166,0.3)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--rose)', marginBottom: 6 }}>Monthly block cost</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 36, fontWeight: 700, color: 'var(--rose)', lineHeight: 1 }}>${total.toLocaleString()}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>per month · billed with your current subscription</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--rose)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Slots added</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 28, fontWeight: 700, color: 'var(--rose)' }}>{selected.length}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)' }}>of 80 total</div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(211,150,166,0.2)', paddingTop: 14 }}>
            {Object.entries(tierGroups).map(([tier, { count, rate }]) => (
              <div key={tier} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', fontSize: 12 }}>
                <span style={{ color: 'var(--text-2)' }}>{count} location{count > 1 ? 's' : ''} × ${rate}/slot ({tier} rate)</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600, color: 'var(--text-1)' }}>${(count * rate).toLocaleString()}/mo</span>
              </div>
            ))}
            {selected.length === 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', fontSize: 12 }}>
                <span style={{ color: 'var(--text-3)' }}>No locations selected</span>
              </div>
            )}
            <div style={{ borderTop: '1px solid rgba(211,150,166,0.25)', marginTop: 6, paddingTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 700, fontSize: 12 }}>
              <span style={{ color: 'var(--text-1)', fontWeight: 700 }}>Total added to monthly bill</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, color: 'var(--rose)' }}>+${total.toLocaleString()}/mo</span>
            </div>
          </div>
        </div>

        {/* What happens */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 24, boxShadow: 'var(--card-shadow)' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 14 }}>What happens when you confirm</div>
          {[
            { label: 'Block activates immediately', desc: `${competitorName} is removed from our active prospect list across all selected locations. No outbound sales contact will be made to them.` },
            { label: 'Prorated charge today + full charge on the 1st', desc: "You'll be charged a prorated amount for the remaining days of this month, then the full slot rate on the 1st of each month going forward. Each slot carries a one-month minimum commitment — the earliest you can cancel and stop billing is the 1st of the month after your first full billing month." },
            { label: 'Tracking continues as normal', desc: "You continue to see their prices, promotions, and catalog changes in your intelligence dashboard. The block only affects their access to CannaSpy — not your visibility into them." },
            { label: 'Cancelling the block has consequences', desc: `If you cancel this block in the future, ${competitorName.split(' ')[0]} will be added back to our active prospect list. They will be able to access CannaSpy after subscribing. Full details are shown before any cancellation.` },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, padding: '10px 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, color: 'var(--accent)', flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)', marginBottom: 2 }}>{s.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.6 }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Billing preview */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 20, boxShadow: 'var(--card-shadow)' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 14 }}>
            Billing preview — today is {today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
            <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Today ({today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 700, color: 'var(--rose)', lineHeight: 1, marginBottom: 3 }}>${prorated.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: 'var(--text-2)' }}>Prorated · {daysRemaining} days × ${perDay}/day</div>
            </div>
            <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>{fmtDateShort(nextMonth)}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 700, color: 'var(--text-1)', lineHeight: 1, marginBottom: 3 }}>${total.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: 'var(--text-2)' }}>First full month · {selected.length} slots</div>
            </div>
            <div style={{ background: 'var(--accent-soft)', border: '1px solid rgba(9,161,161,0.2)', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Earliest exit</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 700, color: 'var(--accent)', lineHeight: 1, marginBottom: 3 }}>{fmtDateShort(earliestExit)}</div>
              <div style={{ fontSize: 11, color: 'var(--text-2)' }}>Cancel before {fmtDateShort(earliestExit)} to stop {fmtDateShort(nextMonth)} billing</div>
            </div>
          </div>
          <div style={{ padding: '10px 14px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11, color: 'var(--text-2)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--text-1)' }}>Slots auto-renew on the 1st of each month.</strong> One-month minimum per slot — the earliest you can cancel and stop billing is {fmtDateShort(earliestExit)}. After that, cancel before the 1st of any month to stop the following month's charge. No action needed to keep slots active.
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 32 }}>
          <button
            onClick={() => navigate('/blocks')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '12px 24px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid var(--border-2)', background: 'var(--surface-3)', color: 'var(--text-1)', transition: 'all 0.2s' }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selected.length || confirming}
            style={{
              flex: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              padding: '12px 24px', borderRadius: 8, fontSize: 13, fontWeight: 700,
              cursor: selected.length && !confirming ? 'pointer' : 'not-allowed',
              fontFamily: 'var(--sans)',
              background: 'var(--rose)', border: '1.5px solid var(--rose)', color: '#fff',
              opacity: selected.length && !confirming ? 1 : 0.4,
              transition: 'all 0.2s',
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 14, height: 14 }}>
              <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
            {confirming ? 'Activating…' : btnLabel}
          </button>
        </div>
      </div>

      {/* Toast */}
      <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: `translateX(-50%) translateY(${toastVisible ? 0 : 80}px)`, background: 'var(--text-1)', color: 'var(--surface)', padding: '9px 18px', borderRadius: 20, fontSize: 12, fontWeight: 600, fontFamily: 'var(--mono)', zIndex: 9000, transition: 'transform 0.3s cubic-bezier(.2,.8,.2,1), opacity 0.3s', opacity: toastVisible ? 1 : 0, pointerEvents: 'none' }}>
        {toastMsg}
      </div>
    </div>
  )
}
