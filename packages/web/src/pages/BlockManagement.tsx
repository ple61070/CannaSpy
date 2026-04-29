import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBlocks } from '../hooks/useBlocks'

/* ── helpers ── */
function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')
}

function daysSince(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
}

const AVATAR_COLORS = ['#3d7a8a', '#6b5b95', '#c88a20', '#2d8a6b', '#2a7a45', '#8b4513', '#5a4a7a']
function avatarColor(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

/* static sparkline heights for demo — 14 bars */
const SPARK_A = [8, 14, 20, 5, 5, 14, 18, 22, 14, 8, 5, 14, 20, 22]
const SPARK_B = [5, 8, 14, 8, 5, 5, 14, 8, 8, 5, 14, 8, 14, 8]

export default function BlockManagement() {
  const navigate = useNavigate()
  const { blocks, loading, cancelBlock } = useBlocks()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [cancelTarget, setCancelTarget] = useState<{ id: string; name: string } | null>(null)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [locFilter, setLocFilter] = useState('All locations')
  const [locOpen, setLocOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2800)
  }

  const selectedBlock = blocks.find((b) => b.id === selectedId) ?? null
  const totalSlots = blocks.length
  const totalCost = blocks.reduce((sum, b) => sum + 200, 0)

  const openCancel = (id: string, name: string) => {
    setCancelTarget({ id, name })
    setCancelModalOpen(true)
  }

  const confirmCancel = async () => {
    if (!cancelTarget) return
    try {
      await cancelBlock(cancelTarget.id)
      showToast(`Block on ${cancelTarget.name} cancelled — rival is now eligible for outreach`)
      setCancelModalOpen(false)
      setCancelTarget(null)
      if (selectedId === cancelTarget.id) setSelectedId(null)
    } catch {
      showToast('Failed to cancel block — try again')
    }
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', minWidth: 0 }}>

      {/* ── TOPBAR ── */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '0 24px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0' }}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', cursor: 'pointer' }}
            onClick={() => navigate('/command-center')}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
            Back
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Block Management</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)' }}>
              {blocks.length} active block{blocks.length !== 1 ? 's' : ''} · {totalSlots} slots · ${totalCost.toLocaleString()}/mo
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => navigate('/billing')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid var(--border-2)', background: 'var(--surface-3)', color: 'var(--text-1)' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>
              Billing &amp; slots
            </button>
            <button
              onClick={() => navigate('/setup/competitors')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid var(--rose)', background: 'var(--rose)', color: '#fff', boxShadow: '0 4px 18px rgba(211,150,166,0.40)' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" /></svg>
              Block a rival
            </button>
          </div>
        </div>
      </div>

      {/* ── FILTER BAR ── */}
      <div style={{ padding: '8px 24px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Location</span>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => { setLocOpen((o) => !o); setSortOpen(false) }}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 8, fontSize: 11, fontWeight: 600, border: '1.5px solid var(--border-2)', background: 'var(--surface)', color: 'var(--text-1)', cursor: 'pointer', fontFamily: 'var(--sans)', whiteSpace: 'nowrap' }}
            >
              {locFilter}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
            </button>
            {locOpen && (
              <div style={{ position: 'absolute', top: 'calc(100% + 5px)', left: 0, background: 'var(--surface)', border: '1px solid var(--border-2)', borderRadius: 8, boxShadow: '0 12px 50px rgba(0,0,0,0.18)', zIndex: 200, minWidth: 160, padding: 5 }}>
                {['All locations', 'WeHo Flagship', 'DTLA Flagship', 'SoMa SF', 'Oakland'].map((l) => (
                  <div key={l} onClick={() => { setLocFilter(l); setLocOpen(false) }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 6, fontSize: 12, color: locFilter === l ? 'var(--accent)' : 'var(--text-1)', fontWeight: locFilter === l ? 700 : 400, cursor: 'pointer', fontFamily: 'var(--sans)' }}
                  >
                    {l}{locFilter === l && <span style={{ marginLeft: 'auto' }}>✓</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div style={{ width: 1, height: 20, background: 'var(--border-2)', flexShrink: 0, margin: '0 2px' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Sort</span>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => { setSortOpen((o) => !o); setLocOpen(false) }}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 8, fontSize: 11, fontWeight: 600, border: '1.5px solid var(--border-2)', background: 'var(--surface)', color: 'var(--text-1)', cursor: 'pointer', fontFamily: 'var(--sans)', whiteSpace: 'nowrap' }}
            >
              Longest active
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
            </button>
            {sortOpen && (
              <div style={{ position: 'absolute', top: 'calc(100% + 5px)', left: 0, background: 'var(--surface)', border: '1px solid var(--border-2)', borderRadius: 8, boxShadow: '0 12px 50px rgba(0,0,0,0.18)', zIndex: 200, minWidth: 180, padding: 5 }}>
                {['Longest active first', 'Highest monthly cost', 'Most rival activity', 'Auto-renewing soonest'].map((s) => (
                  <div key={s} onClick={() => setSortOpen(false)}
                    style={{ padding: '7px 10px', borderRadius: 6, fontSize: 12, color: 'var(--text-1)', cursor: 'pointer', fontFamily: 'var(--sans)' }}
                  >{s}</div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)' }}>
          {blocks.length} block{blocks.length !== 1 ? 's' : ''} · {totalSlots} slots
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }} onClick={() => { setLocOpen(false); setSortOpen(false) }}>

        {/* ── LIST PANEL ── */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '20px 24px' }}>

          {loading ? (
            <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-3)', padding: '40px 0', textAlign: 'center' }}>
              Pulling latest block intelligence…
            </div>
          ) : (
            <>
              {/* Summary cards */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
                {[
                  { n: blocks.length, label: 'Active blocks', sub: `Across ${totalSlots} locations`, accent: 'var(--rose)', borderColor: 'var(--rose)', iconBg: 'rgba(211,150,166,0.11)', icon: <><circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" /></> },
                  { n: totalSlots, label: 'Block slots used', sub: `${totalSlots} of ${totalSlots} · plan maxed`, accent: 'var(--accent)', borderColor: 'var(--accent)', iconBg: 'rgba(9,161,161,0.10)', icon: <><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></> },
                  { n: `$${totalCost.toLocaleString()}`, label: 'Monthly block cost', sub: '$200/slot · Elite rate', accent: 'var(--warm)', borderColor: 'var(--warm)', iconBg: 'rgba(246,201,146,0.18)', icon: <><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></> },
                  { n: blocks.length, label: 'Next billing date', sub: 'Auto-renews May 1', accent: 'var(--danger)', borderColor: 'var(--danger)', iconBg: 'rgba(224,90,106,0.08)', icon: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></> },
                ].map((c) => (
                  <div key={c.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: `3px solid ${c.borderColor}`, borderRadius: 8, boxShadow: 'var(--card-shadow)', padding: '14px 18px', flex: 1, minWidth: 140 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 28, fontWeight: 700, lineHeight: 1, color: c.accent }}>{c.n}</div>
                      <div style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: c.iconBg }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c.accent} strokeWidth="2">{c.icon}</svg>
                      </div>
                    </div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-3)' }}>{c.label}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-2)', marginTop: 3 }}>{c.sub}</div>
                  </div>
                ))}
              </div>

              {/* Expiry warning */}
              {blocks.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(224,90,106,0.07)', border: '1px solid rgba(224,90,106,0.2)', borderRadius: 8, marginBottom: 16 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--danger)', flexShrink: 0, animation: 'bmpulse 2s infinite' }} />
                  <div style={{ fontSize: 11, color: 'var(--text-1)', flex: 1 }}>
                    <strong>{blocks.length} block{blocks.length !== 1 ? 's' : ''} auto-renew May 1.</strong> Slots continue automatically unless you cancel. Cancellation is immediate.
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, color: 'var(--danger)', cursor: 'pointer', padding: '3px 8px', border: '1px solid rgba(224,90,106,0.3)', borderRadius: 4 }}>
                    Manage blocks
                  </div>
                </div>
              )}

              {/* Active blocks section */}
              {blocks.length > 0 && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-2)' }}>Active blocks</div>
                    <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)' }}>{blocks.length} rivals blocked</div>
                  </div>

                  {blocks.map((block, idx) => {
                    const days = daysSince(block.blocked_at)
                    const color = avatarColor(block.competitor_id)
                    const abbr = initials(block.competitor_name)
                    const isSelected = selectedId === block.id
                    const spark = idx % 2 === 0 ? SPARK_A : SPARK_B

                    return (
                      <div
                        key={block.id}
                        onClick={() => setSelectedId((prev) => (prev === block.id ? null : block.id))}
                        style={{
                          background: 'var(--surface)',
                          border: `1px solid ${isSelected ? 'var(--rose)' : 'var(--border)'}`,
                          boxShadow: isSelected ? '0 0 0 2px rgba(211,150,166,0.2),var(--card-shadow)' : 'var(--card-shadow)',
                          borderRadius: 8,
                          marginBottom: 10,
                          cursor: 'pointer',
                          overflow: 'hidden',
                        }}
                      >
                        {/* card header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px 12px' }}>
                          <div style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, flexShrink: 0, color: '#fff', background: color }}>
                            {abbr}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 2 }}>{block.competitor_name}</div>
                            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 8 }}>
                              {block.competitor_address?.split(',')[1]?.trim() ?? '—'}
                              <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--border-2)', display: 'inline-block' }} />
                              <span style={{ fontFamily: 'var(--mono)', fontSize: 8, background: 'rgba(211,150,166,0.10)', color: 'var(--rose)', padding: '1px 6px', borderRadius: 8, fontWeight: 700 }}>
                                BLOCKED {days} DAYS
                              </span>
                            </div>
                          </div>
                          <div style={{ flexShrink: 0, textAlign: 'right' }}>
                            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: 'var(--rose)' }}>{days} days</div>
                            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)' }}>$200/mo · 1 slot</div>
                          </div>
                        </div>

                        {/* card body */}
                        <div style={{ padding: '0 16px 14px', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
                            <span style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 600, padding: '3px 8px', borderRadius: 20, background: 'rgba(211,150,166,0.10)', color: 'var(--rose)', border: '1px solid rgba(211,150,166,0.25)' }}>
                              {block.competitor_address?.split(',')[0]?.trim() ?? 'Location'}
                            </span>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 12 }}>
                            {[
                              { n: days, label: 'Days blocked', color: 'var(--rose)' },
                              { n: Math.floor(days * 0.6), label: 'Changes blocked', color: 'var(--warm)' },
                              { n: 1, label: 'Locations', color: 'var(--accent)' },
                              { n: 'May 1', label: 'Auto-renews', color: 'var(--text-1)' },
                            ].map((s) => (
                              <div key={s.label} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 8px', textAlign: 'center' }}>
                                <div style={{ fontFamily: 'var(--mono)', fontSize: 17, fontWeight: 700, color: s.color, lineHeight: 1, marginBottom: 2 }}>{s.n}</div>
                                <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{s.label}</div>
                              </div>
                            ))}
                          </div>

                          {/* sparkline */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)', letterSpacing: '0.04em', textTransform: 'uppercase', flexShrink: 0 }}>
                              Activity — last 14 days
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 22, flexShrink: 0 }}>
                              {spark.map((h, i) => (
                                <div
                                  key={i}
                                  style={{
                                    width: 4,
                                    height: h,
                                    borderRadius: 1.5,
                                    background: h <= 5 ? 'var(--border-2)' : 'var(--rose)',
                                    opacity: h <= 5 ? 1 : 0.85,
                                  }}
                                />
                              ))}
                            </div>
                            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--rose)', fontWeight: 600, marginLeft: 'auto', flexShrink: 0 }}>
                              {spark.filter((h) => h > 5).length * 2} intercepted
                            </div>
                          </div>
                        </div>

                        {/* footer actions */}
                        <div style={{ display: 'flex', gap: 7, padding: '0 16px 14px' }}>
                          {[
                            { label: 'View profile →', fn: () => showToast('Rival profile — coming soon') },
                            { label: 'Block analytics →', fn: () => showToast('Block analytics — coming soon') },
                          ].map((btn) => (
                            <button
                              key={btn.label}
                              onClick={(e) => { e.stopPropagation(); btn.fn() }}
                              style={{ flex: 1, padding: '7px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid var(--border-2)', background: 'var(--surface-3)', color: 'var(--text-1)', textAlign: 'center' }}
                            >
                              {btn.label}
                            </button>
                          ))}
                          <button
                            onClick={(e) => { e.stopPropagation(); openCancel(block.id, block.competitor_name) }}
                            style={{ flex: 1, padding: '7px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid rgba(211,150,166,0.35)', background: 'transparent', color: 'var(--rose)', textAlign: 'center' }}
                          >
                            Cancel block
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </>
              )}

              {/* Empty state */}
              {blocks.length === 0 && (
                <div style={{ padding: '60px 24px', textAlign: 'center' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(211,150,166,0.11)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--rose)" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" /></svg>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', marginBottom: 6 }}>No rivals currently suppressed</div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)', maxWidth: 320, margin: '0 auto 20px', lineHeight: 1.65 }}>
                    Add a block to start building your moat. Our team follows up with blocked rivals within 24–48 hours of cancellation.
                  </div>
                  <button
                    onClick={() => navigate('/setup/competitors')}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid var(--rose)', background: 'var(--rose)', color: '#fff' }}
                  >
                    Block a rival
                  </button>
                </div>
              )}

              {/* Rivals blocking you */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '28px 0 12px' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--warm)' }}>Rivals blocking you</div>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--warm)' }}>0 rivals are blocking you</div>
              </div>
              <div style={{ background: 'var(--warm-soft)', border: '1px solid rgba(212,144,10,0.22)', borderRadius: 8, padding: '9px 13px', marginBottom: 10, display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--warm)" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                <div style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.6 }}>
                  Dispensaries that are paying CannaSpy customers with a block on your account appear here. Enable notifications to be alerted the moment a block is released.
                </div>
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)', padding: '12px 0', textAlign: 'center' }}>No rivals are currently blocking your account.</div>

              {/* Tracked rivals */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '28px 0 12px' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Tracked rivals — not blocked</div>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)' }}>Add a block from any rival's profile</div>
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)', padding: '8px 0' }}>
                Visit a location's dashboard to block tracked rivals.
              </div>
            </>
          )}
        </div>

        {/* ── DETAIL PANEL ── */}
        <div
          style={{
            width: selectedBlock ? 400 : 0,
            overflow: 'hidden',
            flexShrink: 0,
            background: 'var(--surface)',
            borderLeft: selectedBlock ? '1px solid var(--border)' : '1px solid transparent',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            transition: 'width 0.32s cubic-bezier(.2,.8,.2,1)',
          }}
        >
          {selectedBlock && (() => {
            const days = daysSince(selectedBlock.blocked_at)
            const color = avatarColor(selectedBlock.competitor_id)
            const abbr = initials(selectedBlock.competitor_name)
            return (
              <div style={{ width: 400, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', flexShrink: 0 }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', alignItems: 'flex-start', gap: 10, flexShrink: 0 }}>
                  <button
                    onClick={() => setSelectedId(null)}
                    style={{ width: 28, height: 28, borderRadius: 7, border: '1.5px solid var(--border-2)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-2)', flexShrink: 0 }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </button>
                  <div style={{ width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, color: '#fff', background: color, flexShrink: 0 }}>
                    {abbr}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 2 }}>{selectedBlock.competitor_name}</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)', letterSpacing: '0.06em' }}>BLOCKED · {days} days · 1 location</div>
                  </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px', minHeight: 0 }}>
                  {/* block strip */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'rgba(211,150,166,0.08)', border: '1px solid rgba(211,150,166,0.2)', borderRadius: 8, padding: '9px 13px', marginBottom: 16 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--rose)', flexShrink: 0 }} />
                    <div style={{ fontSize: 11, color: 'var(--rose)', fontWeight: 600 }}>Blocked — cannot access CannaSpy</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', marginLeft: 'auto' }}>{days} days</div>
                  </div>

                  {/* stat grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                    {[
                      { n: days, label: 'Days blocked', color: 'var(--rose)' },
                      { n: Math.floor(days * 0.6), label: 'Changes intercepted', color: 'var(--warm)' },
                      { n: '$200', label: 'Monthly cost', color: 'var(--text-1)' },
                      { n: 'May 1', label: 'Auto-renews', color: 'var(--accent)' },
                    ].map((s) => (
                      <div key={s.label} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px', textAlign: 'center' }}>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 700, lineHeight: 1, marginBottom: 3, color: s.color }}>{s.n}</div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* churn warning */}
                  <div style={{ background: 'rgba(211,150,166,0.07)', border: '1px solid rgba(211,150,166,0.25)', borderLeft: '3px solid var(--rose)', borderRadius: 8, padding: '12px 14px', marginBottom: 16 }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--rose)', marginBottom: 5 }}>
                      Cancel consequence
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-1)', lineHeight: 1.6 }}>
                      Canceling this block will re-add <strong>{selectedBlock.competitor_name}</strong> to our active prospect list. Our team typically follows up within 24–48 hours.
                    </div>
                  </div>

                  {/* address */}
                  <div style={{ marginBottom: 18 }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 8 }}>Address</div>
                    <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.7 }}>{selectedBlock.competitor_address || '—'}</div>
                  </div>
                </div>

                <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', flexDirection: 'column', gap: 7, flexShrink: 0 }}>
                  <div style={{ display: 'flex', gap: 7 }}>
                    <button
                      onClick={() => showToast('Price matrix opened')}
                      style={{ flex: 1, padding: '8px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid var(--accent)', background: 'var(--accent)', color: '#fff', textAlign: 'center' }}
                    >
                      View price matrix →
                    </button>
                    <button
                      onClick={() => openCancel(selectedBlock.id, selectedBlock.competitor_name)}
                      style={{ flex: 1, padding: '8px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid rgba(211,150,166,0.35)', background: 'transparent', color: 'var(--rose)', textAlign: 'center' }}
                    >
                      Cancel block
                    </button>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      </div>

      {/* ── CANCEL MODAL ── */}
      {cancelModalOpen && cancelTarget && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setCancelModalOpen(false)}
        >
          <div
            style={{ background: 'var(--surface)', borderRadius: 12, padding: 28, maxWidth: 420, width: '90%', boxShadow: '0 12px 50px rgba(0,0,0,0.38)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(211,150,166,0.11)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--rose)" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" /></svg>
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', marginBottom: 8 }}>
              Cancel block on {cancelTarget.name}?
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.7, marginBottom: 20 }}>
              <strong style={{ color: 'var(--text-1)' }}>Canceling this block will re-add {cancelTarget.name} to our active prospect list immediately.</strong> Our sales team typically follows up with the rival within 24–48 hours. Any unused days in the current billing period are forfeited.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setCancelModalOpen(false)}
                style={{ flex: 1, padding: 10, borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid var(--border-2)', background: 'var(--surface-3)', color: 'var(--text-1)', textAlign: 'center' }}
              >
                Keep blocking
              </button>
              <button
                onClick={confirmCancel}
                style={{ flex: 1, padding: 10, borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid var(--rose)', background: 'var(--rose)', color: '#fff', textAlign: 'center' }}
              >
                Cancel block →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST ── */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: 'var(--text-1)', color: 'var(--surface)', padding: '9px 18px', borderRadius: 20, fontSize: 12, fontWeight: 600, fontFamily: 'var(--mono)', zIndex: 9000, whiteSpace: 'nowrap', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
          {toast}
        </div>
      )}

      <style>{`@keyframes bmpulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  )
}
