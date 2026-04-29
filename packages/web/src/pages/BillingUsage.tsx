import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthFetch } from '../lib/useAuthFetch'

const API = import.meta.env.VITE_API_URL ?? ''

interface UsageData {
  tracking_slots: number
  blocking_slots: number
  total_slots: number
  monthly_cost: number
  next_tier_at: number | null
}

const LOCS = [
  { name: 'WeHo Flagship',     market: 'Elite',       mktClass: 'elite', track: 6, block: 2, rate: 250 },
  { name: 'DTLA Flagship',     market: 'Hot',         mktClass: 'hot',   track: 7, block: 2, rate: 200 },
  { name: 'SoMa SF',           market: 'Elite',       mktClass: 'elite', track: 5, block: 1, rate: 250 },
  { name: 'Mission SF',        market: 'Elite',       mktClass: 'elite', track: 6, block: 2, rate: 250 },
  { name: 'Oakland Telegraph', market: 'Hot',         mktClass: 'hot',   track: 7, block: 2, rate: 200 },
  { name: 'Long Beach DT',     market: 'Competitive', mktClass: 'comp',  track: 6, block: 2, rate: 150 },
  { name: 'Sacramento',        market: 'Competitive', mktClass: 'comp',  track: 5, block: 2, rate: 150 },
  { name: 'San Diego',         market: 'Hot',         mktClass: 'hot',   track: 7, block: 3, rate: 200 },
  { name: 'Beverly Hills',     market: 'Elite',       mktClass: 'elite', track: 6, block: 2, rate: 250 },
  { name: 'Riverside',         market: 'Standard',    mktClass: 'std',   track: 4, block: 0, rate: 100 },
]
const DISCOUNT = 0.85

const INVOICES = [
  { date: 'Apr 1', desc: '81 slots · 15% discount', amount: '$14,025' },
  { date: 'Mar 1', desc: '76 slots · 15% discount', amount: '$13,158' },
  { date: 'Feb 1', desc: '68 slots · 10% discount', amount: '$11,628' },
  { date: 'Jan 1', desc: '52 slots · 10% discount', amount: '$9,234' },
]

const mktBadgeColor: Record<string, { bg: string; color: string }> = {
  elite: { bg: 'rgba(211,150,166,0.14)', color: 'var(--rose)' },
  hot:   { bg: 'rgba(212,144,10,0.12)',  color: 'var(--warm)' },
  comp:  { bg: 'rgba(84,132,164,0.12)',  color: 'var(--slate)' },
  std:   { bg: 'var(--surface-3)',       color: 'var(--text-2)' },
}

export default function BillingUsage() {
  const authFetch = useAuthFetch()
  const navigate = useNavigate()
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [toast, setToast] = useState('')
  const [toastVisible, setToastVisible] = useState(false)
  let toastTimer: ReturnType<typeof setTimeout>

  useEffect(() => {
    authFetch(`${API}/api/v1/billing/usage`)
      .then(r => r.json())
      .then(d => setUsage(d.data || null))
      .catch(() => {})
  }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    setToastVisible(true)
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => setToastVisible(false), 2400)
  }

  const handlePortal = async () => {
    setPortalLoading(true)
    try {
      const res = await authFetch(`${API}/api/v1/billing/portal`, { method: 'POST' })
      const d = await res.json()
      const url = d.url || d.data?.url
      if (url) window.location.href = url
      else showToast('Opening billing portal…')
    } catch {
      showToast('Opening billing portal…')
    }
    setPortalLoading(false)
  }

  const trackSlots = usage?.tracking_slots ?? 63
  const blockSlots = usage?.blocking_slots ?? 18
  const totalSlots = usage?.total_slots ?? 81
  const mrr = usage?.monthly_cost ?? 14025

  const trackPct = Math.min((trackSlots / 100) * 100, 100)
  const blockPct = Math.min((blockSlots / 40) * 100, 100)

  const locTotalSlots = LOCS.reduce((s, l) => s + l.track + l.block, 0)
  const locTotalCost = LOCS.reduce((s, l) => s + Math.round((l.track + l.block) * l.rate * DISCOUNT), 0)

  const discountTiers = [
    { range: '1–9 slots',   pct: '0%',  barW: 15,  active: totalSlots < 10 },
    { range: '10–19 slots', pct: '5%',  barW: 35,  active: totalSlots >= 10 && totalSlots < 20 },
    { range: '20–49 slots', pct: '10%', barW: 65,  active: totalSlots >= 20 && totalSlots < 50 },
    { range: '50+ slots',   pct: '15%', barW: 100, active: totalSlots >= 50 },
  ]
  const activeDiscount = discountTiers.find(t => t.active)?.pct ?? '0%'
  const savings = Math.round(mrr / DISCOUNT * (1 - DISCOUNT))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', minWidth: 0 }}>

      {/* TOPBAR */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '0 28px', flexShrink: 0, backdropFilter: 'blur(12px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', textDecoration: 'none' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            Back
          </Link>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Billing &amp; Slot Usage</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', marginLeft: 2 }}>Catalyst Group MSO · Next billing May 1</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => showToast('Invoice downloaded')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid var(--border-2)', background: 'var(--surface-3)', color: 'var(--text-1)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download invoice
            </button>
            <button onClick={handlePortal} disabled={portalLoading} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', background: 'var(--accent)', border: '1.5px solid var(--accent)', color: '#fff', boxShadow: 'var(--btn-shadow)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
              {portalLoading ? 'Opening…' : 'Manage payment'}
            </button>
          </div>
        </div>
      </div>

      {/* CONTENT SCROLL */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', minHeight: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, maxWidth: 1100 }}>

          {/* LEFT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Hero card */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: 'var(--card-shadow)', padding: 24, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, background: 'radial-gradient(circle,var(--bg-g1),transparent 70%)', pointerEvents: 'none' }} />
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, padding: '3px 10px', borderRadius: 20, background: 'rgba(9,161,161,0.12)', color: 'var(--accent)', border: '1px solid rgba(9,161,161,0.22)', display: 'inline-flex', alignItems: 'center', gap: 5, width: 'fit-content' }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', animation: 'lpulse 2s ease-in-out infinite', flexShrink: 0, display: 'inline-block' }} />
                    Active subscription
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em', marginTop: 4 }}>À La Carte Plan</div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)' }}>$100–$250 per slot · {LOCS.length} active locations · {activeDiscount} volume discount applied</div>
                </div>
                <div style={{ textAlign: 'right' as const }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 36, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.03em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>${mrr.toLocaleString()}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginTop: 3 }}>Monthly recurring</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-2)', marginTop: 2 }}>Next charge May 1, 2026</div>
                </div>
              </div>

              {/* Slot cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderLeft: '3px solid var(--accent)', borderRadius: 8, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: 'var(--accent)' }}>Track slots</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>of 100 max</div>
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 28, fontWeight: 700, lineHeight: 1, color: 'var(--accent)', fontVariantNumeric: 'tabular-nums' }}>{trackSlots}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-2)', marginTop: 4 }}>{trackSlots} slots × avg $148/slot = ${Math.round(trackSlots * 148).toLocaleString()}/mo</div>
                  <div style={{ marginTop: 10, height: 5, background: 'var(--surface-3)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 3, background: 'var(--accent)', width: `${trackPct}%`, transition: 'width 0.6s cubic-bezier(.4,0,.2,1)' }} />
                  </div>
                </div>
                <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderLeft: '3px solid var(--rose)', borderRadius: 8, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: 'var(--rose)' }}>Block slots</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>of 40 max</div>
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 28, fontWeight: 700, lineHeight: 1, color: 'var(--rose)', fontVariantNumeric: 'tabular-nums' }}>{blockSlots}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-2)', marginTop: 4 }}>{blockSlots} slots × avg $205/slot = ${Math.round(blockSlots * 205).toLocaleString()}/mo</div>
                  <div style={{ marginTop: 10, height: 5, background: 'var(--surface-3)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 3, background: 'var(--rose)', width: `${blockPct}%`, transition: 'width 0.6s cubic-bezier(.4,0,.2,1)' }} />
                  </div>
                </div>
              </div>

              {/* Discount strip */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--accent-soft)', border: '1px solid rgba(9,161,161,0.2)', borderRadius: 8 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <div style={{ fontSize: 11, color: 'var(--text-1)', lineHeight: 1.5 }}>
                  <strong>{activeDiscount} volume discount</strong> active on all {totalSlots} slots ({totalSlots >= 50 ? '50+' : totalSlots >= 20 ? '20–49' : totalSlots >= 10 ? '10–19' : '1–9'} slot tier). You're saving <strong style={{ color: 'var(--accent)' }}>${savings.toLocaleString()}/month</strong> vs standard rate.
                </div>
              </div>
            </div>

            {/* Location table */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: 'var(--card-shadow)', overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', background: 'var(--surface-2)' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>Slot usage by location</span>
                <span style={{ fontSize: 11, color: 'var(--text-2)', marginLeft: 4 }}>— {LOCS.length} locations · Click to manage</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Location', 'Market', 'Slots', 'Rate', 'Monthly cost'].map((h, i) => (
                      <th key={h} style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--text-3)', padding: '9px 16px', borderBottom: '1px solid var(--border)', textAlign: (i === 4 ? 'right' : 'left') as 'right' | 'left', fontWeight: 500, background: 'var(--surface-2)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {LOCS.map((l, i) => {
                    const cost = Math.round((l.track + l.block) * l.rate * DISCOUNT)
                    const bc = mktBadgeColor[l.mktClass]
                    return (
                      <tr key={i} onClick={() => showToast(`Managing ${l.name}…`)} style={{ borderBottom: '1px solid var(--border)', cursor: 'default' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-soft)')} onMouseLeave={e => (e.currentTarget.style.background = '')}>
                        <td style={{ padding: '11px 16px', fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{l.name}</td>
                        <td style={{ padding: '11px 16px' }}>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: bc.bg, color: bc.color }}>{l.market}</span>
                        </td>
                        <td style={{ padding: '11px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'rgba(9,161,161,0.1)', color: 'var(--accent)' }}>{l.track} track</span>
                            {l.block > 0 && <span style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'rgba(211,150,166,0.14)', color: 'var(--rose)' }}>{l.block} block</span>}
                          </div>
                        </td>
                        <td style={{ padding: '11px 16px', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)' }}>${l.rate}/slot</td>
                        <td style={{ padding: '11px 16px', textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, color: 'var(--text-1)' }}>${cost.toLocaleString()}</td>
                      </tr>
                    )
                  })}
                  <tr style={{ background: 'var(--surface-2)', borderTop: '2px solid var(--border-2)' }}>
                    <td colSpan={2} style={{ padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-2)' }}>Total · {locTotalSlots} slots · 15% discount applied</td>
                    <td colSpan={2} />
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>${locTotalCost.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Next invoice */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: 'var(--card-shadow)', overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>Next invoice · May 1</div>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)' }}>16 days away</span>
              </div>
              <div style={{ padding: '16px 18px' }}>
                {[
                  { label: `${trackSlots} track slots`, sub: 'Avg $148/slot after discount', amount: `$${Math.round(trackSlots * 148).toLocaleString()}`, teal: false },
                  { label: `${blockSlots} block slots`, sub: 'Avg $205/slot after discount', amount: `$${Math.round(blockSlots * 205).toLocaleString()}`, teal: false },
                  { label: 'Subtotal', sub: '', amount: `$${(Math.round(trackSlots * 148) + Math.round(blockSlots * 205)).toLocaleString()}`, teal: false },
                  { label: 'Volume discount (15%)', sub: '50+ slots tier', amount: `−$${savings.toLocaleString()}`, teal: true },
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-1)' }}>{row.label}</div>
                      {row.sub && <div style={{ fontSize: 10, color: 'var(--text-2)', marginTop: 1 }}>{row.sub}</div>}
                    </div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color: row.teal ? 'var(--accent)' : 'var(--text-1)', flexShrink: 0 }}>{row.amount}</div>
                  </div>
                ))}
                <div style={{ height: 1, background: 'var(--border-2)', margin: '8px 0' }} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>Total due</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 700, color: 'var(--accent)' }}>${mrr.toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Billing alert */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', background: 'var(--warm-soft)', border: '1px solid rgba(212,144,10,0.2)', borderRadius: 8 }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--warm)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-1)', lineHeight: 1.55 }}>
                You have <strong>2 active blocks auto-renewing May 1</strong> (STIIIZY WeHo, Off The Charts DTLA). Both slots continue automatically — cancel before Apr 30 if you want to stop either block. If a block lapses, the rival is added to the active prospect list within 24 hours.
              </div>
            </div>

            {/* Payment method */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: 'var(--card-shadow)', padding: '16px 18px' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: 'var(--text-3)', marginBottom: 10 }}>Payment method</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8 }}>
                <div style={{ width: 36, height: 24, background: 'linear-gradient(135deg,#1a1f71,#0047ab)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="22" height="14" viewBox="0 0 38 24" fill="none">
                    <circle cx="15" cy="12" r="10" fill="#EB001B" opacity="0.85"/>
                    <circle cx="23" cy="12" r="10" fill="#F79E1B" opacity="0.85"/>
                    <path d="M19 5.8A10 10 0 0 1 23 12a10 10 0 0 1-4 6.2A10 10 0 0 1 15 12a10 10 0 0 1 4-6.2z" fill="#FF5F00"/>
                  </svg>
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-1)', fontWeight: 500 }}>Mastercard ···· 4291</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', marginLeft: 'auto' }}>Exp 09/28</div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button onClick={() => showToast('Opening payment portal…')} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '7px 14px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid var(--border-2)', background: 'var(--surface-3)', color: 'var(--text-1)' }}>Update card</button>
                <button onClick={() => showToast('Invoice emailed')} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '7px 14px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid var(--border-2)', background: 'var(--surface-3)', color: 'var(--text-1)' }}>Email invoice</button>
              </div>
            </div>

            {/* Volume discount ladder */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: 'var(--card-shadow)', padding: '16px 18px' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: 'var(--text-3)', marginBottom: 10 }}>Volume discount tiers</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {discountTiers.map((t, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-2)', width: 90, flexShrink: 0 }}>{t.range}</div>
                    <div style={{ flex: 1, height: 6, background: 'var(--surface-3)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 3, background: 'var(--accent)', opacity: t.active ? 1 : 0.35, width: `${t.barW}%` }} />
                    </div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, color: t.active ? 'var(--accent)' : 'var(--text-3)', width: 32, textAlign: 'right' as const, flexShrink: 0 }}>{t.pct}</div>
                    {i === discountTiers.length - 1 && t.active
                      ? <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', fontWeight: 700, flexShrink: 0 }}>← You ({totalSlots})</div>
                      : <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)', flexShrink: 0 }}>{i === 0 ? 'Standard' : 'off'}</div>
                    }
                  </div>
                ))}
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
                Saving ${savings.toLocaleString()}/month at current slot count
              </div>
            </div>

            {/* Invoice history */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: 'var(--card-shadow)', overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>Invoice history</div>
                <span onClick={() => showToast('All invoices downloaded')} style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', cursor: 'pointer' }}>Download all</span>
              </div>
              <div style={{ padding: '8px 18px' }}>
                {INVOICES.map((inv, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: i < INVOICES.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-2)', width: 72, flexShrink: 0 }}>{inv.date}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-1)', flex: 1, minWidth: 0 }}>{inv.desc}</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600, color: 'var(--text-1)', flexShrink: 0 }}>{inv.amount}</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 8, fontWeight: 700, letterSpacing: '0.06em', padding: '2px 6px', borderRadius: 10, background: 'rgba(9,161,161,0.1)', color: 'var(--accent)', flexShrink: 0 }}>Paid</div>
                    <div onClick={() => showToast('Invoice downloaded')} style={{ fontFamily: 'var(--mono)', fontSize: 8, fontWeight: 700, letterSpacing: '0.06em', padding: '2px 6px', borderRadius: 10, background: 'var(--surface-3)', color: 'var(--text-2)', cursor: 'pointer', flexShrink: 0 }}>PDF</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Danger zone */}
        <div style={{ marginTop: 40, paddingTop: 28, borderTop: '1px solid var(--border)' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: 'var(--text-3)', marginBottom: 12 }}>Account</div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: 'var(--card-shadow)' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', marginBottom: 3 }}>Cancel subscription</div>
              <div style={{ fontSize: 11, color: 'var(--text-2)' }}>Ends monitoring, releases all active blocks, and stops billing from next cycle.</div>
            </div>
            <button onClick={() => navigate('/billing/cancel')} style={{ padding: '8px 18px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid rgba(224,90,106,0.35)', background: 'transparent', color: 'var(--danger)', flexShrink: 0, marginLeft: 20 }}>
              Cancel subscription
            </button>
          </div>
        </div>
      </div>

      {/* Toast */}
      <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: toastVisible ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(80px)', background: 'var(--text-1)', color: 'var(--surface)', padding: '9px 18px', borderRadius: 20, fontSize: 12, fontWeight: 600, fontFamily: 'var(--mono)', zIndex: 9000, transition: 'transform 0.3s cubic-bezier(.2,.8,.2,1),opacity 0.3s', opacity: toastVisible ? 1 : 0, pointerEvents: 'none' }}>{toast}</div>

      <style>{`@keyframes lpulse{0%,100%{opacity:1}50%{opacity:0.35}}`}</style>
    </div>
  )
}
