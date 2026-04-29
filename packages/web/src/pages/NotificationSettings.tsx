import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthFetch } from '../lib/useAuthFetch'

const API = import.meta.env.VITE_API_URL ?? ''

type Panel = 'alerts' | 'delivery' | 'thresholds' | 'locations'
type Digest = 'realtime' | 'daily' | 'weekly'

function Toggle({ on, onChange, disabled }: { on: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <div onClick={disabled ? undefined : onChange} style={{ width: 40, height: 22, background: on ? 'var(--accent)' : 'var(--border-2)', borderRadius: 11, position: 'relative', cursor: disabled ? 'not-allowed' : 'pointer', transition: 'background 0.25s', flexShrink: 0, opacity: disabled ? 0.45 : 1 }}>
      <div style={{ position: 'absolute', top: 3, left: 3, width: 16, height: 16, background: '#fff', borderRadius: '50%', transition: 'transform 0.25s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transform: on ? 'translateX(18px)' : 'translateX(0)' }} />
    </div>
  )
}

function SegControl({ value, onChange }: { value: Digest; onChange: (v: Digest) => void }) {
  const opts: { label: string; value: Digest }[] = [{ label: 'Real-time', value: 'realtime' }, { label: 'Daily', value: 'daily' }, { label: 'Weekly', value: 'weekly' }]
  return (
    <div style={{ display: 'flex', background: 'var(--surface-3)', border: '1px solid var(--border-2)', borderRadius: 8, padding: 2, gap: 2 }}>
      {opts.map(o => (
        <div key={o.value} onClick={() => onChange(o.value)} style={{ padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', color: value === o.value ? '#fff' : 'var(--text-2)', background: value === o.value ? 'var(--accent)' : 'transparent', boxShadow: value === o.value ? '0 2px 6px rgba(9,161,161,0.25)' : 'none', fontFamily: 'var(--mono)', whiteSpace: 'nowrap' as const, userSelect: 'none' as const }}>
          {o.label}
        </div>
      ))}
    </div>
  )
}

type IconType = 'danger' | 'warm' | 'teal' | 'rose' | 'slate'

function AtIcon({ type, children }: { type: IconType; children: React.ReactNode }) {
  const cfg: Record<IconType, { bg: string; color: string }> = {
    danger: { bg: 'var(--danger-soft)', color: 'var(--danger)' },
    warm:   { bg: 'var(--warm-soft)',   color: 'var(--warm)' },
    teal:   { bg: 'var(--accent-soft)', color: 'var(--accent)' },
    rose:   { bg: 'var(--rose-soft)',   color: 'var(--rose)' },
    slate:  { bg: 'rgba(84,132,164,0.1)', color: 'var(--slate)' },
  }
  return <div style={{ width: 26, height: 26, borderRadius: 7, background: cfg[type].bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: cfg[type].color }}>{children}</div>
}

function SCard({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: 'var(--card-shadow)', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 2 }}>{title}</div>
        <div style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.5 }}>{sub}</div>
      </div>
      <div>{children}</div>
    </div>
  )
}

function SRow({ label, desc, right }: { label: React.ReactNode; desc?: string; right: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '14px 20px', borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')} onMouseLeave={e => (e.currentTarget.style.background = '')}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 7 }}>{label}</div>
        {desc && <div style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.5 }}>{desc}</div>}
      </div>
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>{right}</div>
    </div>
  )
}

const SHARED_ALERTS = [
  { type: 'danger' as IconType, label: 'Rival price drop on shared brand', desc: 'Rival drops price on a brand you both carry', badge: 'Priority' as const },
  { type: 'warm'   as IconType, label: 'Rival price increase on shared brand', desc: 'Opportunity to reprice or hold advantage', badge: undefined },
  { type: 'danger' as IconType, label: 'Rival flash sale on shared brand', desc: 'Time-limited sale on a brand you both carry', badge: 'Priority' as const },
  { type: 'rose'   as IconType, label: 'Rival adds a brand you carry', desc: 'A rival starts stocking a brand you already carry', badge: 'New' as const },
]
const GENERAL_ALERTS = [
  { type: 'teal'  as IconType, label: 'New rival competitor detected', desc: 'New dispensary opens in your market area', badge: undefined },
  { type: 'slate' as IconType, label: 'Rival new SKUs added', desc: 'Rivals expand their catalog with new products', badge: undefined },
  { type: 'slate' as IconType, label: 'Rival SKUs removed', desc: 'Products dropped from a rival\'s active menu', badge: undefined },
  { type: 'warm'  as IconType, label: 'Rival recurring deal changes', desc: 'Daily deals or happy hours added or changed', badge: undefined },
]

const LOC_ROWS = [
  { name: 'WeHo Flagship',      badge: 'Elite · WeHo',    bg: 'rgba(211,150,166,0.14)', color: 'var(--rose)', digest: 'Real-time', quiet: 'Global', threshold: 'Global' },
  { name: 'DTLA Flagship',      badge: 'Hot · DTLA',      bg: 'rgba(212,144,10,0.12)',  color: 'var(--warm)', digest: 'Daily',     quiet: 'Off',    threshold: 'Global' },
  { name: 'SoMa San Francisco', badge: 'Elite · SoMa SF', bg: 'rgba(224,90,106,0.1)',   color: 'var(--danger)', digest: 'Real-time', quiet: 'Custom', threshold: '3%' },
]

export default function NotificationSettings() {
  const authFetch = useAuthFetch()
  const [activePanel, setActivePanel] = useState<Panel>('alerts')
  const [saveLabel, setSaveLabel] = useState<'saved' | 'unsaved'>('saved')

  const [sharedOn, setSharedOn] = useState([true, true, true, true])
  const [generalOn, setGeneralOn] = useState([true, false, false, true])
  const toggleShared = (i: number) => { setSharedOn(p => { const n = [...p]; n[i] = !n[i]; return n }); mark() }
  const toggleGeneral = (i: number) => { setGeneralOn(p => { const n = [...p]; n[i] = !n[i]; return n }); mark() }

  const [emailOn, setEmailOn] = useState(true)
  const [pushOn, setPushOn] = useState(true)
  const [smsOn, setSmsOn] = useState(true)
  const [smsTypes, setSmsTypes] = useState(['Price drops'])
  const [sharedDigest, setSharedDigest] = useState<Digest>('realtime')
  const [generalDigest, setGeneralDigest] = useState<Digest>('daily')
  const [quietOn, setQuietOn] = useState(true)
  const [quietWeekend, setQuietWeekend] = useState(false)
  const [pricePct, setPricePct] = useState(5)
  const [priceDollar, setPriceDollar] = useState(2)
  const [maxPerDay, setMaxPerDay] = useState(25)
  const [cooldown, setCooldown] = useState('1 hour')
  const [locToggles, setLocToggles] = useState([[true, true, true], [true, false, false], [true, true, true]])
  const toggleLoc = (loc: number, ch: number) => { setLocToggles(p => { const n = p.map(r => [...r]); n[loc][ch] = !n[loc][ch]; return n }); mark() }

  const SMS_OPTS = ['Price drops', 'Price increases', 'New promos', 'Block released', 'New rival']

  const mark = () => setSaveLabel('unsaved')

  useEffect(() => {
    authFetch(`${API}/api/v1/settings/notifications`)
      .then(r => r.json())
      .then(d => {
        const s = d.data || {}
        if (s.email_enabled !== undefined) setEmailOn(s.email_enabled)
        if (s.push_enabled !== undefined) setPushOn(s.push_enabled)
        if (s.price_threshold_pct !== undefined) setPricePct(s.price_threshold_pct)
        if (s.digest_frequency) setSharedDigest(s.digest_frequency)
      }).catch(() => {})
  }, [])

  const handleSave = async () => {
    try {
      await authFetch(`${API}/api/v1/settings/notifications`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email_enabled: emailOn, push_enabled: pushOn, price_threshold_pct: pricePct, digest_frequency: sharedDigest }),
      })
    } catch {}
    setSaveLabel('saved')
  }

  const handleReset = () => {
    setSharedOn([true, true, true, true]); setGeneralOn([true, false, false, true])
    setEmailOn(true); setPushOn(true); setSmsOn(true); setSmsTypes(['Price drops'])
    setSharedDigest('realtime'); setGeneralDigest('daily')
    setQuietOn(true); setQuietWeekend(false)
    setPricePct(5); setPriceDollar(2); setMaxPerDay(25); setCooldown('1 hour')
    setSaveLabel('saved')
  }

  const navItems: { id: Panel; label: string }[] = [
    { id: 'alerts', label: 'Alert types' },
    { id: 'delivery', label: 'Delivery & digest' },
    { id: 'thresholds', label: 'Thresholds' },
    { id: 'locations', label: 'Per-location overrides' },
  ]
  const navIcons: React.ReactNode[] = [
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15, flexShrink: 0 }}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15, flexShrink: 0 }}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15, flexShrink: 0 }}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15, flexShrink: 0 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  ]

  const Badge = ({ type }: { type: 'Priority' | 'New' }) => (
    <span style={{ fontFamily: 'var(--mono)', fontSize: 8, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, padding: '2px 7px', borderRadius: 10, ...(type === 'Priority' ? { background: 'rgba(224,90,106,0.1)', color: 'var(--danger)', border: '1px solid rgba(224,90,106,0.2)' } : { background: 'rgba(9,161,161,0.13)', color: 'var(--accent)', border: '1px solid rgba(9,161,161,0.22)' }) }}>{type}</span>
  )

  const btnBase: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid var(--border-2)', background: 'var(--surface-3)', color: 'var(--text-1)' }
  const btnPrimary: React.CSSProperties = { ...btnBase, background: 'var(--accent)', borderColor: 'var(--accent)', color: '#fff', boxShadow: 'var(--btn-shadow)' }
  const selStyle: React.CSSProperties = { padding: '5px 8px', borderRadius: 8, border: '1.5px solid var(--border-2)', background: 'var(--surface)', color: 'var(--text-1)', fontFamily: 'var(--sans)', fontSize: 11, cursor: 'pointer' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', minWidth: 0 }}>

      {/* TOPBAR */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '0 28px', flexShrink: 0, backdropFilter: 'blur(12px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', textDecoration: 'none', flexShrink: 0 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            Back
          </Link>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Notification Settings</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', marginLeft: 2 }}>WeHo Flagship · All Locations</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={handleReset} style={btnBase}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/></svg>
              Reset to defaults
            </button>
            <button onClick={handleSave} style={btnPrimary}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Save changes
            </button>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 28, minHeight: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24, maxWidth: 1000 }}>

          {/* Left nav */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, position: 'sticky', top: 0 }}>
            {navItems.map((item, i) => {
              const active = activePanel === item.id
              return (
                <div key={item.id} onClick={() => setActivePanel(item.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, fontSize: 13, fontWeight: active ? 600 : 500, color: active ? 'var(--accent)' : 'var(--text-2)', cursor: 'pointer', background: active ? 'var(--surface)' : 'transparent', border: active ? '1px solid var(--border)' : '1px solid transparent', boxShadow: active ? 'var(--card-shadow)' : 'none', transition: 'all 0.2s', userSelect: 'none' as const }}>
                  <span style={{ color: active ? 'var(--accent)' : 'inherit' }}>{navIcons[i]}</span>
                  {item.label}
                </div>
              )
            })}
            <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', fontSize: 12, color: 'var(--text-3)', cursor: 'default' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Changes apply to all locations unless overridden
            </div>
          </div>

          {/* Panels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* ALERTS */}
            {activePanel === 'alerts' && <>
              <SCard title="Shared brand alerts" sub="Alerts for price moves on brands you and a rival both carry. Highest priority — always recommended on.">
                {SHARED_ALERTS.map((a, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '13px 20px', borderBottom: i < SHARED_ALERTS.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.15s' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')} onMouseLeave={e => (e.currentTarget.style.background = '')}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>
                        <AtIcon type={a.type}><div /></AtIcon>
                        {a.label}
                        {a.badge && <Badge type={a.badge} />}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-2)', marginTop: 4, paddingLeft: 34 }}>{a.desc}</div>
                    </div>
                    <Toggle on={sharedOn[i]} onChange={() => toggleShared(i)} />
                  </div>
                ))}
              </SCard>

              <SCard title="General alerts" sub="Broader market activity alerts. Lower priority than shared brand alerts.">
                {GENERAL_ALERTS.map((a, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '13px 20px', borderBottom: i < GENERAL_ALERTS.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.15s' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')} onMouseLeave={e => (e.currentTarget.style.background = '')}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>
                        <AtIcon type={a.type}><div /></AtIcon>
                        {a.label}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-2)', marginTop: 4, paddingLeft: 34 }}>{a.desc}</div>
                    </div>
                    <Toggle on={generalOn[i]} onChange={() => toggleGeneral(i)} />
                  </div>
                ))}
              </SCard>
            </>}

            {/* DELIVERY */}
            {activePanel === 'delivery' && <>
              <SCard title="Delivery channels" sub="Where you receive alerts. Email required for digest mode.">
                <SRow label={<><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>Email alerts</>} desc="patrick@cannaspy.com · Sends to your account email" right={<Toggle on={emailOn} onChange={() => { setEmailOn(e => !e); mark() }} />} />
                <SRow label={<><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>Push notifications</>} desc="Browser and mobile push alerts for real-time delivery" right={<Toggle on={pushOn} onChange={() => { setPushOn(e => !e); mark() }} />} />
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, padding: '14px 20px', borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')} onMouseLeave={e => (e.currentTarget.style.background = '')}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 7 }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                      SMS / text alerts
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.5 }}>Text message alerts for urgent price changes. US numbers only.</div>
                    {smsOn && <>
                      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input defaultValue="+1 (310) 555-0188" style={{ padding: '6px 10px', border: '1.5px solid var(--border-2)', borderRadius: 8, background: 'var(--surface-2)', color: 'var(--text-1)', fontFamily: 'var(--mono)', fontSize: 12, width: 160, outline: 'none' }} />
                        <button style={{ padding: '5px 11px', borderRadius: 8, fontSize: 11, fontWeight: 600, border: '1.5px solid var(--border-2)', background: 'var(--surface-3)', color: 'var(--text-2)', cursor: 'pointer', fontFamily: 'var(--sans)' }}>Verify number</button>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)' }}>✓ Verified</span>
                      </div>
                      <div style={{ marginTop: 7 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-1)', marginBottom: 4 }}>SMS alert types</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                          {SMS_OPTS.map(t => {
                            const active = smsTypes.includes(t)
                            return <span key={t} onClick={() => { setSmsTypes(p => active ? p.filter(x => x !== t) : [...p, t]); mark() }} style={{ fontSize: 10, padding: '3px 9px', borderRadius: 5, border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border-2)'}`, cursor: 'pointer', userSelect: 'none' as const, background: active ? 'var(--accent)' : 'var(--surface-3)', color: active ? '#fff' : 'var(--text-2)', fontFamily: 'var(--mono)', fontWeight: 600 }}>{t}</span>
                          })}
                        </div>
                      </div>
                    </>}
                  </div>
                  <div style={{ flexShrink: 0, paddingTop: 2 }}><Toggle on={smsOn} onChange={() => { setSmsOn(s => !s); mark() }} /></div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '14px 20px', transition: 'background 0.15s' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')} onMouseLeave={e => (e.currentTarget.style.background = '')}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 7 }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                      Slack notifications
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 8, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, padding: '2px 7px', borderRadius: 10, background: 'rgba(9,161,161,0.13)', color: 'var(--accent)', border: '1px solid rgba(9,161,161,0.22)' }}>Soon</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-2)' }}>Post alerts to a Slack channel — coming soon</div>
                  </div>
                  <Toggle on={false} onChange={() => {}} disabled />
                </div>
              </SCard>

              <SCard title="Digest frequency" sub="How often alerts are batched and sent. Real-time fires immediately — recommended for shared brand alerts.">
                <SRow label="Shared brand alerts" desc="Price moves and flash sales on brands you both carry — act fast" right={<SegControl value={sharedDigest} onChange={v => { setSharedDigest(v); mark() }} />} />
                <SRow label="General alerts" desc="SKU changes, new rivals, recurring deal updates" right={<SegControl value={generalDigest} onChange={v => { setGeneralDigest(v); mark() }} />} />
              </SCard>

              <SCard title="Quiet hours" sub="No alerts sent during this window. Monitoring still runs — alerts queue and deliver when quiet hours end.">
                <SRow label="Enable quiet hours" desc="Silence alerts overnight and on weekends" right={<Toggle on={quietOn} onChange={() => { setQuietOn(q => !q); mark() }} />} />
                {quietOn && <>
                  <SRow
                    label="Quiet window"
                    desc="Local time · Alerts queued and released at end of window"
                    right={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <select onChange={() => mark()} style={selStyle}><option>10:00 PM</option><option>9:00 PM</option><option>8:00 PM</option><option>11:00 PM</option></select>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>to</span>
                      <select onChange={() => mark()} style={selStyle}><option>7:00 AM</option><option>6:00 AM</option><option>8:00 AM</option><option>9:00 AM</option></select>
                    </div>}
                  />
                  <SRow label="Include weekends" desc="Extend quiet hours to Saturday and Sunday" right={<Toggle on={quietWeekend} onChange={() => { setQuietWeekend(q => !q); mark() }} />} />
                </>}
              </SCard>
            </>}

            {/* THRESHOLDS */}
            {activePanel === 'thresholds' && <>
              <SCard title="Price change threshold" sub="Only alert when a price changes by at least this percentage. Filters out penny-rounding noise.">
                <SRow
                  label="Minimum price change"
                  desc="Applies to all price-related alerts. Shared brand alerts ignore this — they always fire."
                  right={<><input type="number" value={pricePct} min={1} max={50} onChange={e => { setPricePct(+e.target.value); mark() }} style={{ padding: '6px 10px', borderRadius: 8, border: '1.5px solid var(--border-2)', background: 'var(--surface)', color: 'var(--text-1)', fontFamily: 'var(--mono)', fontSize: 12, width: 70, textAlign: 'center' as const }} /><span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>% change</span></>}
                />
                <SRow
                  label="Minimum dollar change"
                  desc="Also require at least this dollar amount — prevents alerts on $0.50 moves"
                  right={<><span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>$</span><input type="number" value={priceDollar} min={0} max={20} onChange={e => { setPriceDollar(+e.target.value); mark() }} style={{ padding: '6px 10px', borderRadius: 8, border: '1.5px solid var(--border-2)', background: 'var(--surface)', color: 'var(--text-1)', fontFamily: 'var(--mono)', fontSize: 12, width: 70, textAlign: 'center' as const }} /></>}
                />
              </SCard>

              <SCard title="Alert volume control" sub="Prevents alert fatigue when monitoring detects widespread market movement.">
                <SRow
                  label="Max alerts per day"
                  desc="Cap total daily alerts across all locations. Prioritizes shared brand alerts first."
                  right={<><input type="number" value={maxPerDay} min={5} max={200} onChange={e => { setMaxPerDay(+e.target.value); mark() }} style={{ padding: '6px 10px', borderRadius: 8, border: '1.5px solid var(--border-2)', background: 'var(--surface)', color: 'var(--text-1)', fontFamily: 'var(--mono)', fontSize: 12, width: 70, textAlign: 'center' as const }} /><span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>alerts/day</span></>}
                />
                <SRow
                  label="Cooldown between same-rival alerts"
                  desc="Don't fire another alert on the same rival within this window"
                  right={<select value={cooldown} onChange={e => { setCooldown(e.target.value); mark() }} style={selStyle}><option>No cooldown</option><option>1 hour</option><option>4 hours</option><option>24 hours</option></select>}
                />
              </SCard>
            </>}

            {/* LOCATIONS */}
            {activePanel === 'locations' && (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: 'var(--card-shadow)', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 2 }}>Per-location overrides</div>
                    <div style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.5 }}>These settings override global defaults for specific locations. Leave off to inherit global setting.</div>
                  </div>
                  <button onClick={() => mark()} style={{ ...btnBase, flexShrink: 0 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                    Add override
                  </button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Location', 'Email', 'SMS', 'Push', 'Digest', 'Quiet hours', 'Threshold'].map((h, i) => (
                        <th key={h} style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--text-3)', padding: '10px 20px', borderBottom: '1px solid var(--border)', textAlign: i === 0 ? 'left' as const : 'center' as const, fontWeight: 500 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {LOC_ROWS.map((loc, li) => (
                      <tr key={li} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')} onMouseLeave={e => (e.currentTarget.style.background = '')}>
                        <td style={{ padding: '12px 20px' }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{loc.name}</div>
                          <div style={{ marginTop: 2 }}><span style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', padding: '2px 7px', borderRadius: 4, background: loc.bg, color: loc.color }}>{loc.badge}</span></div>
                        </td>
                        {[0, 1, 2].map(ch => (
                          <td key={ch} style={{ padding: '12px 20px', textAlign: 'center' as const }}>
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                              <Toggle on={locToggles[li][ch]} onChange={() => toggleLoc(li, ch)} />
                            </div>
                          </td>
                        ))}
                        <td style={{ padding: '12px 20px', textAlign: 'center' as const }}>
                          <select onChange={() => mark()} defaultValue={loc.digest} style={{ ...selStyle, width: 88 }}>
                            <option>Real-time</option><option>Daily</option><option>Weekly</option>
                          </select>
                        </td>
                        <td style={{ padding: '12px 20px', textAlign: 'center' as const }}>
                          <select onChange={() => mark()} defaultValue={loc.quiet} style={{ ...selStyle, width: 78 }}>
                            <option>Global</option><option>Off</option><option>Custom</option>
                          </select>
                        </td>
                        <td style={{ padding: '12px 20px', textAlign: 'center' as const }}>
                          <select onChange={() => mark()} defaultValue={loc.threshold} style={{ ...selStyle, width: 78 }}>
                            <option>Global</option><option>3%</option><option>10%</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                    <tr style={{ opacity: 0.5 }}>
                      <td style={{ padding: '12px 20px' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>+ 7 more locations</div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>Using global defaults</div>
                      </td>
                      <td colSpan={6} style={{ padding: '12px 20px', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)' }}>Inheriting all global settings · Click to expand</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* SAVE BAR */}
      <div style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', padding: '12px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, backdropFilter: 'blur(12px)' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: saveLabel === 'saved' ? 'var(--accent)' : 'var(--warm)', flexShrink: 0 }} />
          {saveLabel === 'saved' ? 'All changes saved' : 'Unsaved changes'}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleReset} style={btnBase}>Discard changes</button>
          <button onClick={handleSave} style={btnPrimary}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Save changes
          </button>
        </div>
      </div>

    </div>
  )
}
