import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

/* ── Static mock data ── */
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

const mktBadgeStyle = (mktClass: string): React.CSSProperties => {
  if (mktClass === 'elite') return { background: 'rgba(211,150,166,0.14)', color: 'var(--rose)' }
  if (mktClass === 'hot') return { background: 'rgba(212,144,10,0.12)', color: 'var(--warm)' }
  if (mktClass === 'comp') return { background: 'rgba(84,132,164,0.12)', color: 'var(--slate)' }
  return { background: 'var(--surface-3)', color: 'var(--text-2)' }
}

export default function BillingUsage() {
  const navigate = useNavigate()
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2400) }

  /* computed totals */
  const totalSlots = LOCS.reduce((s, l) => s + l.track + l.block, 0)
  const totalCost = LOCS.reduce((s, l) => s + Math.round((l.track + l.block) * l.rate * DISCOUNT), 0)
  const trackSlots = LOCS.reduce((s, l) => s + l.track, 0)
  const blockSlots = LOCS.reduce((s, l) => s + l.block, 0)

  /* ── styles ── */
  const topbar: React.CSSProperties = { padding: '0 28px', borderBottom: '1px solid var(--border)', flexShrink: 0, background: 'var(--surface)' }
  const tbInner: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0' }
  const backStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', cursor: 'pointer' }
  const tbTitle: React.CSSProperties = { fontSize: 17, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em' }
  const tbSub: React.CSSProperties = { fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)' }
  const tbActions: React.CSSProperties = { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }
  const btn: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid var(--border-2)', background: 'var(--surface-3)', color: 'var(--text-1)' }
  const btnPrimary: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid var(--accent)', background: 'var(--accent)', color: '#fff', boxShadow: '0 4px 18px rgba(9,161,161,0.32)' }

  const scroll: React.CSSProperties = { flex: 1, overflowY: 'auto', padding: '24px 28px', minHeight: 0 }
  const grid: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, maxWidth: 1100 }
  const colLeft: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 20 }
  const colRight: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 20 }

  const heroCard: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', boxShadow: 'var(--card-shadow)', padding: 24, position: 'relative', overflow: 'hidden' }
  const heroTop: React.CSSProperties = { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }
  const planBadge: React.CSSProperties = { fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: 20, background: 'rgba(9,161,161,0.12)', color: 'var(--accent)', border: '1px solid rgba(9,161,161,0.22)', display: 'inline-flex', alignItems: 'center', gap: 5, width: 'fit-content' }
  const planDot: React.CSSProperties = { width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)' }
  const planName: React.CSSProperties = { fontSize: 20, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em', marginTop: 4 }
  const planSub: React.CSSProperties = { fontSize: 12, color: 'var(--text-2)' }
  const mrrN: React.CSSProperties = { fontFamily: 'var(--mono)', fontSize: 36, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.03em', lineHeight: 1 }
  const mrrLabel: React.CSSProperties = { fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 3 }
  const mrrNext: React.CSSProperties = { fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-2)', marginTop: 2 }

  const slotRow: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }
  const slotCard = (accent: string): React.CSSProperties => ({ background: 'var(--surface-2)', border: '1px solid var(--border)', borderLeft: `3px solid ${accent}`, borderRadius: 'var(--r-sm)', padding: '14px 16px', position: 'relative', overflow: 'hidden' })
  const scTop: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }
  const scLabel = (color: string): React.CSSProperties => ({ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color })
  const scN = (color: string): React.CSSProperties => ({ fontFamily: 'var(--mono)', fontSize: 28, fontWeight: 700, lineHeight: 1, color })
  const scOf: React.CSSProperties = { fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }
  const scPrice: React.CSSProperties = { fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-2)', marginTop: 4 }
  const scBarWrap: React.CSSProperties = { marginTop: 10, height: 5, background: 'var(--surface-3)', borderRadius: 3, overflow: 'hidden' }
  const scBar = (color: string, pct: number): React.CSSProperties => ({ height: '100%', borderRadius: 3, background: color, width: `${pct}%` })

  const sectionCard: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', boxShadow: 'var(--card-shadow)', overflow: 'hidden' }
  const scHead: React.CSSProperties = { padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface-2)' }
  const scHeadTitle: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }
  const scHeadSub: React.CSSProperties = { fontSize: 11, color: 'var(--text-2)', marginLeft: 4 }

  const lbtTh: React.CSSProperties = { fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)', padding: '9px 16px', borderBottom: '1px solid var(--border)', textAlign: 'left', fontWeight: 500, background: 'var(--surface-2)' }
  const lbtThR: React.CSSProperties = { ...lbtTh, textAlign: 'right' }
  const lbtTd: React.CSSProperties = { padding: '11px 16px', verticalAlign: 'middle', fontSize: 13 }
  const lbtTdR: React.CSSProperties = { ...lbtTd, textAlign: 'right' }

  const mktBadgeBase: React.CSSProperties = { fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4 }
  const slotChip = (color: string, bg: string): React.CSSProperties => ({ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: bg, color })

  const invoiceCard: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', boxShadow: 'var(--card-shadow)', overflow: 'hidden' }
  const icHead: React.CSSProperties = { padding: '14px 18px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }
  const icTitle: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }
  const icBody: React.CSSProperties = { padding: '16px 18px' }
  const invoiceRow: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border)' }
  const invoiceRowLast: React.CSSProperties = { ...invoiceRow, borderBottom: 'none' }
  const irLabel: React.CSSProperties = { fontSize: 12, color: 'var(--text-1)' }
  const irSub: React.CSSProperties = { fontSize: 10, color: 'var(--text-2)', marginTop: 1 }
  const irAmount: React.CSSProperties = { fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color: 'var(--text-1)', flexShrink: 0 }
  const irAmountTeal: React.CSSProperties = { ...irAmount, color: 'var(--accent)' }
  const invoiceDivider: React.CSSProperties = { height: 1, background: 'var(--border-2)', margin: '8px 0' }
  const invoiceTotal: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0 0' }
  const itLabel: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }
  const itAmount: React.CSSProperties = { fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 700, color: 'var(--accent)' }

  const billingAlert: React.CSSProperties = { display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', background: 'rgba(212,144,10,0.18)', border: '1px solid rgba(212,144,10,0.2)', borderRadius: 'var(--r-sm)' }
  const baIcon: React.CSSProperties = { width: 18, height: 18, borderRadius: '50%', background: 'var(--warm)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }
  const baText: React.CSSProperties = { fontSize: 11, color: 'var(--text-1)', lineHeight: 1.55 }

  const paymentCard: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', boxShadow: 'var(--card-shadow)', padding: '16px 18px' }
  const paymentLabel: React.CSSProperties = { fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 10 }
  const ccDisplay: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)' }
  const ccIcon: React.CSSProperties = { width: 36, height: 24, background: 'linear-gradient(135deg,#1a1f71,#0047ab)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }
  const ccNum: React.CSSProperties = { fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-1)', fontWeight: 500 }
  const ccExp: React.CSSProperties = { fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', marginLeft: 'auto' }
  const paymentActions: React.CSSProperties = { display: 'flex', gap: 8, marginTop: 10 }

  const discountCard: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', boxShadow: 'var(--card-shadow)', padding: '16px 18px' }
  const discountLabel: React.CSSProperties = { fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 10 }
  const tierRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10 }
  const tierRange: React.CSSProperties = { fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-2)', width: 90, flexShrink: 0 }
  const tierBarWrap: React.CSSProperties = { flex: 1, height: 6, background: 'var(--surface-3)', borderRadius: 3, overflow: 'hidden' }
  const tierBar = (pct: number, active: boolean): React.CSSProperties => ({ height: '100%', borderRadius: 3, background: 'var(--accent)', opacity: active ? 1 : 0.35, width: `${pct}%` })
  const tierPct = (active: boolean): React.CSSProperties => ({ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, color: active ? 'var(--accent)' : 'var(--text-3)', width: 32, textAlign: 'right', flexShrink: 0 })
  const tierLbl = (active: boolean): React.CSSProperties => ({ fontFamily: 'var(--mono)', fontSize: 9, color: active ? 'var(--accent)' : 'var(--text-3)', flexShrink: 0, fontWeight: active ? 700 : 400 })

  const histRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--border)' }
  const histRowLast: React.CSSProperties = { ...histRow, borderBottom: 'none' }
  const histDate: React.CSSProperties = { fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-2)', width: 72, flexShrink: 0 }
  const histDesc: React.CSSProperties = { fontSize: 11, color: 'var(--text-1)', flex: 1, minWidth: 0 }
  const histAmount: React.CSSProperties = { fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600, color: 'var(--text-1)', flexShrink: 0 }
  const hbPaid: React.CSSProperties = { fontFamily: 'var(--mono)', fontSize: 8, fontWeight: 700, letterSpacing: '0.06em', padding: '2px 6px', borderRadius: 10, flexShrink: 0, background: 'rgba(9,161,161,0.1)', color: 'var(--accent)' }
  const hbPdf: React.CSSProperties = { fontFamily: 'var(--mono)', fontSize: 8, fontWeight: 700, letterSpacing: '0.06em', padding: '2px 6px', borderRadius: 10, flexShrink: 0, background: 'var(--surface-3)', color: 'var(--text-2)', cursor: 'pointer' }

  const dangerBtn: React.CSSProperties = { padding: '8px 18px', borderRadius: 'var(--r-sm)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid rgba(224,90,106,0.35)', background: 'transparent', color: 'var(--danger)', flexShrink: 0, marginLeft: 20 }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)', fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--text-1)' }}>
      {/* Topbar */}
      <div style={topbar}>
        <div style={tbInner}>
          <div style={backStyle} onClick={() => navigate(-1)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 12, height: 12 }}><polyline points="15 18 9 12 15 6" /></svg>
            Back
          </div>
          <div>
            <div style={tbTitle}>Billing & Slot Usage</div>
            <div style={tbSub}>Catalyst Group MSO · Next billing May 1</div>
          </div>
          <div style={tbActions}>
            <button style={btn} onClick={() => showToast('Invoice downloaded')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 12, height: 12 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
              Download invoice
            </button>
            <button style={btnPrimary} onClick={() => showToast('Opening Stripe billing portal…')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 12, height: 12 }}><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
              Manage payment
            </button>
          </div>
        </div>
      </div>

      {/* Scroll area */}
      <div style={scroll}>
        <div style={grid}>
          {/* ── LEFT COLUMN ── */}
          <div style={colLeft}>
            {/* Hero MRR card */}
            <div style={heroCard}>
              <div style={heroTop}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={planBadge}><div style={planDot} />Active subscription</div>
                  <div style={planName}>À La Carte Plan</div>
                  <div style={planSub}>$100–$250 per slot · 10 active locations · 15% volume discount applied</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={mrrN}>$14,025</div>
                  <div style={mrrLabel}>Monthly recurring</div>
                  <div style={mrrNext}>Next charge May 1, 2026</div>
                </div>
              </div>

              {/* Slot breakdown */}
              <div style={slotRow}>
                <div style={slotCard('var(--accent)')}>
                  <div style={scTop}>
                    <div style={scLabel('var(--accent)')}>Track slots</div>
                    <div style={scOf}>of 100 max</div>
                  </div>
                  <div style={scN('var(--accent)')}>{trackSlots}</div>
                  <div style={scPrice}>{trackSlots} slots × avg $148/slot = $9,324/mo</div>
                  <div style={scBarWrap}><div style={scBar('var(--accent)', trackSlots)} /></div>
                </div>
                <div style={slotCard('var(--rose)')}>
                  <div style={scTop}>
                    <div style={scLabel('var(--rose)')}>Block slots</div>
                    <div style={scOf}>of 40 max</div>
                  </div>
                  <div style={scN('var(--rose)')}>{blockSlots}</div>
                  <div style={scPrice}>{blockSlots} slots × avg $205/slot = $3,690/mo</div>
                  <div style={scBarWrap}><div style={scBar('var(--rose)', Math.round(blockSlots / 40 * 100))} /></div>
                </div>
              </div>

              {/* Discount callout */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--accent-soft)', border: '1px solid rgba(9,161,161,0.2)', borderRadius: 'var(--r-sm)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" style={{ width: 14, height: 14 }}><polyline points="20 6 9 17 4 12" /></svg>
                <div style={{ fontSize: 11, color: 'var(--text-1)', lineHeight: 1.5 }}>
                  <strong>15% volume discount</strong> active on all 81 slots (50+ slot tier). You're saving <strong style={{ color: 'var(--accent)' }}>$2,480/month</strong> vs standard rate.
                </div>
              </div>
            </div>

            {/* Location breakdown table */}
            <div style={sectionCard}>
              <div style={scHead}>
                <div><span style={scHeadTitle}>Slot usage by location</span><span style={scHeadSub}>— 10 locations · Click to manage</span></div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={lbtTh}>Location</th>
                    <th style={lbtTh}>Market</th>
                    <th style={lbtTh}>Slots</th>
                    <th style={lbtTh}>Rate</th>
                    <th style={lbtThR}>Monthly cost</th>
                  </tr>
                </thead>
                <tbody>
                  {LOCS.map((l, i) => {
                    const slots = l.track + l.block
                    const cost = Math.round(slots * l.rate * DISCOUNT)
                    return (
                      <tr key={i} style={{ borderBottom: i < LOCS.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'default' }} onClick={() => showToast(`Managing ${l.name}…`)}>
                        <td style={lbtTd}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{l.name}</div>
                        </td>
                        <td style={lbtTd}><span style={{ ...mktBadgeBase, ...mktBadgeStyle(l.mktClass) }}>{l.market}</span></td>
                        <td style={lbtTd}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span style={slotChip('var(--accent)', 'rgba(9,161,161,0.1)')}>{l.track} track</span>
                            {l.block > 0 && <span style={slotChip('var(--rose)', 'rgba(211,150,166,0.14)')}>{l.block} block</span>}
                          </div>
                        </td>
                        <td style={lbtTd}><div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)' }}>${l.rate}/slot</div></td>
                        <td style={lbtTdR}><div style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, color: 'var(--text-1)' }}>${cost.toLocaleString()}</div></td>
                      </tr>
                    )
                  })}
                  <tr style={{ background: 'var(--surface-2)', borderTop: '2px solid var(--border-2)' }}>
                    <td colSpan={2} style={{ padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-2)' }}>Total · {totalSlots} slots · 15% discount applied</td>
                    <td colSpan={2} style={{ padding: '12px 16px' }} />
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>${totalCost.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div style={colRight}>
            {/* Next invoice */}
            <div style={invoiceCard}>
              <div style={icHead}>
                <div style={icTitle}>Next invoice · May 1</div>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)' }}>16 days away</span>
              </div>
              <div style={icBody}>
                <div style={invoiceRow}>
                  <div><div style={irLabel}>63 track slots</div><div style={irSub}>Avg $148/slot after discount</div></div>
                  <div style={irAmount}>$9,324</div>
                </div>
                <div style={invoiceRow}>
                  <div><div style={irLabel}>18 block slots</div><div style={irSub}>Avg $205/slot after discount</div></div>
                  <div style={irAmount}>$3,690</div>
                </div>
                <div style={invoiceRow}>
                  <div><div style={irLabel}>Subtotal</div></div>
                  <div style={irAmount}>$13,014</div>
                </div>
                <div style={invoiceRowLast}>
                  <div><div style={irLabel}>Volume discount (15%)</div><div style={irSub}>50+ slots tier</div></div>
                  <div style={irAmountTeal}>−$2,480</div>
                </div>
                <div style={invoiceDivider} />
                <div style={invoiceTotal}>
                  <div style={itLabel}>Total due</div>
                  <div style={itAmount}>$14,025</div>
                </div>
              </div>
            </div>

            {/* Billing alert */}
            <div style={billingAlert}>
              <div style={baIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" style={{ width: 9, height: 9 }}><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              </div>
              <div style={baText}>You have <strong>2 active blocks auto-renewing May 1</strong> (STIIIZY WeHo, Off The Charts DTLA). Both slots continue automatically — cancel before Apr 30 if you want to stop either block. If a block lapses, the rival is added to the active prospect list within 24 hours.</div>
            </div>

            {/* Payment method */}
            <div style={paymentCard}>
              <div style={paymentLabel}>Payment method</div>
              <div style={ccDisplay}>
                <div style={ccIcon}>
                  <svg viewBox="0 0 38 24" fill="none" style={{ width: 22, height: 14 }}>
                    <circle cx="15" cy="12" r="10" fill="#EB001B" opacity="0.85" />
                    <circle cx="23" cy="12" r="10" fill="#F79E1B" opacity="0.85" />
                    <path d="M19 5.8A10 10 0 0 1 23 12a10 10 0 0 1-4 6.2A10 10 0 0 1 15 12a10 10 0 0 1 4-6.2z" fill="#FF5F00" />
                  </svg>
                </div>
                <div style={ccNum}>Mastercard ···· 4291</div>
                <div style={ccExp}>Exp 09/28</div>
              </div>
              <div style={paymentActions}>
                <button style={{ ...btn, flex: 1, justifyContent: 'center' }} onClick={() => showToast('Opening payment portal…')}>Update card</button>
                <button style={{ ...btn, flex: 1, justifyContent: 'center' }} onClick={() => showToast('Invoice emailed')}>Email invoice</button>
              </div>
            </div>

            {/* Volume discount tiers */}
            <div style={discountCard}>
              <div style={discountLabel}>Volume discount tiers</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={tierRow}>
                  <div style={tierRange}>1–9 slots</div>
                  <div style={tierBarWrap}><div style={tierBar(15, false)} /></div>
                  <div style={tierPct(false)}>0%</div>
                  <div style={tierLbl(false)}>Standard</div>
                </div>
                <div style={tierRow}>
                  <div style={tierRange}>10–19 slots</div>
                  <div style={tierBarWrap}><div style={tierBar(35, false)} /></div>
                  <div style={tierPct(false)}>5%</div>
                  <div style={tierLbl(false)}>off</div>
                </div>
                <div style={tierRow}>
                  <div style={tierRange}>20–49 slots</div>
                  <div style={tierBarWrap}><div style={tierBar(65, false)} /></div>
                  <div style={tierPct(false)}>10%</div>
                  <div style={tierLbl(false)}>off</div>
                </div>
                <div style={tierRow}>
                  <div style={tierRange}>50+ slots</div>
                  <div style={tierBarWrap}><div style={tierBar(100, true)} /></div>
                  <div style={tierPct(true)}>15%</div>
                  <div style={tierLbl(true)}>← You are here (81 slots)</div>
                </div>
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
                Saving $2,480/month at current slot count
              </div>
            </div>

            {/* Invoice history */}
            <div style={invoiceCard}>
              <div style={icHead}>
                <div style={icTitle}>Invoice history</div>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', cursor: 'pointer' }} onClick={() => showToast('All invoices downloaded')}>Download all</span>
              </div>
              <div style={{ padding: '8px 18px' }}>
                {INVOICES.map((inv, i) => (
                  <div key={i} style={i === INVOICES.length - 1 ? histRowLast : histRow}>
                    <div style={histDate}>{inv.date}</div>
                    <div style={histDesc}>{inv.desc}</div>
                    <div style={histAmount}>{inv.amount}</div>
                    <div style={hbPaid}>Paid</div>
                    <div style={hbPdf} onClick={() => showToast('Invoice downloaded')}>PDF</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Danger zone */}
        <div style={{ marginTop: 40, paddingTop: 28, borderTop: '1px solid var(--border)' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 12 }}>Account</div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: 'var(--card-shadow)' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', marginBottom: 3 }}>Cancel subscription</div>
              <div style={{ fontSize: 11, color: 'var(--text-2)' }}>Ends monitoring, releases all active blocks, and stops billing from next cycle.</div>
            </div>
            <button style={dangerBtn} onClick={() => navigate('/cancel')}>Cancel subscription</button>
          </div>
        </div>
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: 'var(--surface-3)', border: '1px solid var(--border-2)', borderRadius: 8, padding: '8px 16px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-1)', zIndex: 9999, boxShadow: '0 4px 16px rgba(0,0,0,0.5)' }}>{toast}</div>
      )}
    </div>
  )
}
