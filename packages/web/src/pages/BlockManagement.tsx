import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { OperatorTypeFilter, type OperatorType } from '../components/filters/OperatorTypeFilter'
import { useBlocks } from '../hooks/useBlocks'

type TimelineEntry = { type: 'down' | 'up' | 'new'; title: string; sub: string; time: string }

interface BlockData {
  id: string
  name: string
  initials: string
  color: string
  dist: string
  market: string
  days: number
  slots: number
  cost: number
  renews: string
  locs: string[]
  activity: number
  changes: number
  narrative: string
  timeline: TimelineEntry[]
  spark: number[]
}

const BLOCK_COLORS = ['#3d7a8a', '#6b5b95', '#2a7a45', '#8b4513', '#c88a20', '#5484a4']

function makeInitials(name: string): string {
  return name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')
}

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
}

const BLOCKED_BY = [
  { id: 'jb', initials: 'JB', color: '#2a7a45', name: 'Jungle Boys DTLA', meta: '0.4 mi · DTLA · Blocking you at 4 of your locations', days: 63, notify: true },
  { id: 'hs', initials: 'HS', color: '#5a4a7a', name: 'Harborside San Jose', meta: '12.1 mi · SJ market · Blocking you at 2 of your locations', days: 31, notify: false },
  { id: 'ck', initials: 'CK', color: '#8b4513', name: 'Cookies SF Haight', meta: '8.3 mi · SF market · Blocking you at 3 of your locations', days: 8, notify: true },
]

const TRACKABLE = [
  { id: 'mm', initials: 'MM', color: '#c88a20', name: 'MedMen West Hollywood', meta: '0.8 mi · WeHo · Tracking · 12 changes this week' },
  { id: 'ca', initials: 'CA', color: '#2d8a6b', name: 'Catalyst Cannabis Co. DTLA', meta: '1.9 mi · DTLA · Tracking · 8 changes this week' },
  { id: 'jb2', initials: 'JB', color: '#5a4a7a', name: 'Jungle Boys DTLA', meta: '2.4 mi · DTLA · Tracking · 5 changes this week' },
]

/* ── Timeline icons ── */
function TlIcon({ type }: { type: 'down' | 'up' | 'new' }) {
  if (type === 'down') return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 11, height: 11 }}>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
    </svg>
  )
  if (type === 'up') return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 11, height: 11 }}>
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" />
    </svg>
  )
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 11, height: 11 }}>
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function tlIconStyle(type: 'down' | 'up' | 'new'): React.CSSProperties {
  if (type === 'down') return { background: 'var(--danger-soft)', color: 'var(--danger)' }
  if (type === 'up') return { background: 'var(--accent-soft)', color: 'var(--accent)' }
  return { background: 'rgba(212,144,10,0.12)', color: 'var(--warm)' }
}

function locTier(l: string) {
  if (l.includes('WeHo') || l.includes('DTLA') || l.includes('SoMa') || l.includes('Oakland')) return 'Elite'
  if (l.includes('Long Beach') || l.includes('Koreatown')) return 'Competitive'
  return 'Standard'
}
function locRate(tier: string) {
  if (tier === 'Elite') return '$200'
  if (tier === 'Competitive') return '$150'
  return '$100'
}

export default function BlockManagement() {
  const navigate = useNavigate()
  const { blocks: rawBlocks, loading: blocksLoading, cancelBlock: apiCancelBlock } = useBlocks()

  // Map API blocks to the display shape
  const BLOCKS: BlockData[] = rawBlocks.map((b, i) => {
    const days = daysSince(b.blocked_at)
    return {
      id: b.id,
      name: b.competitor_name,
      initials: makeInitials(b.competitor_name),
      color: BLOCK_COLORS[i % BLOCK_COLORS.length],
      dist: '—',
      market: b.competitor_address?.split(',')[1]?.trim() ?? '—',
      days,
      slots: 1,
      cost: 100,
      renews: '—',
      locs: [],
      activity: 0,
      changes: 0,
      narrative: `${b.competitor_name} has been blocked for ${days} day${days !== 1 ? 's' : ''}. Price change tracking is active — changes will appear here as the diff engine processes new snapshots.`,
      timeline: [],
      spark: Array(14).fill(0),
    }
  })

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [cancelTarget, setCancelTarget] = useState<{ id: string; name: string } | null>(null)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [blockModalOpen, setBlockModalOpen] = useState(false)
  const [blockModalName, setBlockModalName] = useState('')
  const [blockModalCost, setBlockModalCost] = useState('')
  const [blockModalIsNew, setBlockModalIsNew] = useState(false)
  const [notifyStates, setNotifyStates] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(BLOCKED_BY.map((b) => [b.id, b.notify]))
  )
  const [toast, setToast] = useState<string | null>(null)
  const [locOpen, setLocOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const [locLabel, setLocLabel] = useState('All locations')
  const [sortLabel, setSortLabel] = useState('Longest active')
  const [operatorType, setOperatorType] = useState<OperatorType>('both')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2600) }

  const selectedBlock = BLOCKS.find((b) => b.id === selectedId) ?? null

  const openCancelModal = (id: string, name: string) => {
    setCancelTarget({ id, name })
    setCancelModalOpen(true)
  }

  const openBlockRivalModal = (name: string, cost: string) => {
    setBlockModalName(name)
    setBlockModalCost(cost)
    setBlockModalIsNew(false)
    setBlockModalOpen(true)
  }

  const openNewBlockModal = () => {
    setBlockModalName('')
    setBlockModalIsNew(true)
    setBlockModalOpen(true)
  }

  const toggleNotify = (id: string) => {
    const next = !notifyStates[id]
    setNotifyStates((s) => ({ ...s, [id]: next }))
    showToast(next ? 'You will be notified when this block is released' : 'Notifications off for this rival')
  }

  /* ── styles ── */
  const s = {
    root: { display: 'flex', flexDirection: 'column' as const, height: '100%', background: 'var(--bg)', fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--text-1)' },
    topbar: { padding: '0 24px', borderBottom: '1px solid var(--border)', flexShrink: 0, background: 'var(--surface)' },
    tbInner: { display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0' },
    back: { display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', cursor: 'pointer', flexShrink: 0 },
    tbTitle: { fontSize: 17, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em' },
    tbSub: { fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)' },
    tbActions: { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 },
    btn: { display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid var(--border-2)', background: 'var(--surface-3)', color: 'var(--text-1)' },
    btnRose: { display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid var(--rose)', background: 'var(--rose)', color: '#fff', boxShadow: '0 4px 18px rgba(211,150,166,0.40)' },
    filterBar: { padding: '8px 24px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 },
    fbSep: { width: 1, height: 20, background: 'var(--border-2)', flexShrink: 0, margin: '0 2px' },
    dgLbl: { fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: 'var(--text-3)' },
    db: { display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, border: '1.5px solid var(--border-2)', background: 'var(--surface)', color: 'var(--text-1)', cursor: 'pointer', fontFamily: 'var(--sans)', whiteSpace: 'nowrap' as const },
    dp: (open: boolean): React.CSSProperties => ({ position: 'absolute', top: 'calc(100% + 5px)', left: 0, background: 'var(--surface)', border: '1px solid var(--border-2)', borderRadius: 'var(--r-sm)', boxShadow: '0 8px 40px rgba(30,60,80,0.13)', zIndex: 200, minWidth: 160, padding: 5, display: open ? 'block' : 'none' }),
    doItem: (sel: boolean): React.CSSProperties => ({ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 6, fontSize: 12, color: sel ? 'var(--accent)' : 'var(--text-1)', cursor: 'pointer', fontFamily: 'var(--sans)', fontWeight: sel ? 700 : 400, background: 'transparent' }),
    fbRight: { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 },
    fbCount: { fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)' },
    body: { flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 },
    listPanel: { flex: 1, overflowY: 'auto' as const, minHeight: 0, padding: '20px 24px' },
    summary: { display: 'flex', flexWrap: 'wrap' as const, gap: 10, marginBottom: 24 },
    sc: (accent: string): React.CSSProperties => ({ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', boxShadow: 'var(--card-shadow)', padding: '14px 18px', flex: 1, borderLeft: `3px solid ${accent}` }),
    scTop: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 },
    scN: (color: string): React.CSSProperties => ({ fontFamily: 'var(--mono)', fontSize: 28, fontWeight: 700, lineHeight: 1, color }),
    scIco: (bg: string, color: string): React.CSSProperties => ({ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: bg, color }),
    scLabel: { fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.07em', textTransform: 'uppercase' as const, color: 'var(--text-3)' },
    scSub: { fontSize: 10, color: 'var(--text-2)', marginTop: 3 },
    sectionHdr: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 },
    shLabel: { fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: 'var(--text-2)' },
    shLine: { flex: 1, height: 1, background: 'var(--border)' },
    shCount: { fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)' },
    expiryStrip: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(224,90,106,0.07)', border: '1px solid rgba(224,90,106,0.2)', borderRadius: 'var(--r-sm)', marginBottom: 10 },
    esDot: { width: 7, height: 7, borderRadius: '50%', background: 'var(--danger)', flexShrink: 0 },
    esText: { fontSize: 11, color: 'var(--text-1)', flex: 1 },
    esBtn: { fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, color: 'var(--danger)', cursor: 'pointer', flexShrink: 0, padding: '3px 8px', border: '1px solid rgba(224,90,106,0.3)', borderRadius: 4 },
    blockCard: (selected: boolean): React.CSSProperties => ({
      background: 'var(--surface)', border: selected ? '1px solid var(--rose)' : '1px solid var(--border)',
      borderRadius: 'var(--r-sm)', boxShadow: selected ? '0 0 0 2px rgba(211,150,166,0.2),var(--card-shadow)' : 'var(--card-shadow)',
      marginBottom: 10, cursor: 'pointer', overflow: 'hidden',
    }),
    bcHeader: { display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px 12px' },
    bcAvatar: (bg: string): React.CSSProperties => ({ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, flexShrink: 0, color: '#fff', background: bg }),
    bcMain: { flex: 1, minWidth: 0 },
    bcName: { fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 2 },
    bcMeta: { fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 8 },
    bcRight: { flexShrink: 0, textAlign: 'right' as const, display: 'flex', flexDirection: 'column' as const, alignItems: 'flex-end', gap: 4 },
    bcDuration: { fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: 'var(--rose)' },
    bcCost: { fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)' },
    bcBody: { padding: '0 16px 14px', borderTop: '1px solid var(--border)', paddingTop: 12 },
    bcLocs: { display: 'flex', gap: 5, flexWrap: 'wrap' as const, marginBottom: 10 },
    locPill: { fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 600, padding: '3px 8px', borderRadius: 20, background: 'rgba(211,150,166,0.1)', color: 'var(--rose)', border: '1px solid rgba(211,150,166,0.25)' },
    bcStats: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 12 },
    bs: { background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '9px 8px', textAlign: 'center' as const },
    bsN: (color: string): React.CSSProperties => ({ fontFamily: 'var(--mono)', fontSize: 17, fontWeight: 700, color, lineHeight: 1, marginBottom: 2 }),
    bsL: { fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase' as const },
    sparkRow: { display: 'flex', alignItems: 'center', gap: 12, paddingTop: 4 },
    sparkLabel: { fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)', letterSpacing: '0.04em', textTransform: 'uppercase' as const, flexShrink: 0 },
    spark: { display: 'flex', alignItems: 'flex-end', gap: 2, height: 22, flexShrink: 0 },
    sparkCount: { fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--rose)', fontWeight: 600, flexShrink: 0, marginLeft: 'auto' },
    bcFooter: { display: 'flex', gap: 7, padding: '0 16px 14px' },
    bcfBtn: { flex: 1, padding: '7px 12px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid var(--border-2)', background: 'var(--surface-3)', color: 'var(--text-1)', textAlign: 'center' as const },
    bcfBtnCancel: { flex: 1, padding: '7px 12px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid rgba(211,150,166,0.35)', background: 'transparent', color: 'var(--rose)', textAlign: 'center' as const },
    blockedByCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: 'var(--card-shadow)', position: 'relative' as const, overflow: 'hidden' },
    bbBadge: { fontFamily: 'var(--mono)', fontSize: 8, fontWeight: 700, padding: '2px 7px', borderRadius: 8, background: 'rgba(212,144,10,0.18)', color: 'var(--warm)', border: '1px solid rgba(212,144,10,0.25)', whiteSpace: 'nowrap' as const, flexShrink: 0 },
    bbDays: { fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', flexShrink: 0 },
    bbName: { fontSize: 13, fontWeight: 700, color: 'var(--text-1)', marginBottom: 2 },
    bbMeta: { fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)' },
    notifyToggle: (on: boolean): React.CSSProperties => ({ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', userSelect: 'none', padding: '5px 10px', borderRadius: 'var(--r-sm)', border: on ? '1.5px solid var(--accent)' : '1.5px solid var(--border-2)', background: on ? 'var(--accent-soft)' : 'var(--surface-3)', flexShrink: 0 }),
    notifyLabel: (on: boolean): React.CSSProperties => ({ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, color: on ? 'var(--accent)' : 'var(--text-3)' }),
    trackableRow: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: 'var(--card-shadow)' },
    detailPanel: (open: boolean): React.CSSProperties => ({ width: open ? 400 : 0, overflow: 'hidden', flexShrink: 0, background: 'var(--surface)', borderLeft: open ? '1px solid var(--border)' : '1px solid transparent', display: 'flex', flexDirection: 'column', height: '100%', transition: 'width 0.32s cubic-bezier(.2,.8,.2,1)' }),
    detailInner: { width: 400, display: 'flex', flexDirection: 'column' as const, height: '100%', overflow: 'hidden', flexShrink: 0 },
    dpHead: { padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', alignItems: 'flex-start', gap: 10, flexShrink: 0 },
    dpClose: { width: 28, height: 28, borderRadius: 7, border: '1.5px solid var(--border-2)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-2)', flexShrink: 0 },
    dpTitle: { fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 2 },
    dpSub: { fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)', letterSpacing: '0.06em' },
    dpScroll: { flex: 1, overflowY: 'auto' as const, padding: '18px 20px', minHeight: 0 },
    ds: { marginBottom: 18 },
    dsLbl: { fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: 'var(--text-3)', marginBottom: 8 },
    dsTxt: { fontSize: 12, color: 'var(--text-2)', lineHeight: 1.7 },
    stat4: { display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, marginBottom: 16 },
    stc: { background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '10px 10px', textAlign: 'center' as const },
    stn: (color: string): React.CSSProperties => ({ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 700, lineHeight: 1, marginBottom: 3, color }),
    stl: { fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase' as const },
    roiCard: { background: 'linear-gradient(135deg,var(--accent-soft),transparent 70%)', border: '1px solid var(--border)', borderLeft: '3px solid var(--accent)', borderRadius: 'var(--r-sm)', padding: '14px 14px 12px', marginBottom: 16 },
    roiHead: { fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.10em', textTransform: 'uppercase' as const, color: 'var(--accent)', fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 },
    roiRow: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 },
    roiStat: (last: boolean): React.CSSProperties => ({ textAlign: 'left', paddingRight: last ? 0 : 10, borderRight: last ? 'none' : '1px solid var(--border)' }),
    roiN: { fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 700, color: 'var(--text-1)', lineHeight: 1.1, marginBottom: 3 },
    roiL: { fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase' as const },
    roiLink: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 11, paddingTop: 9, borderTop: '1px dashed var(--border)', fontFamily: 'var(--sans)', fontSize: 11, color: 'var(--accent)', fontWeight: 600, cursor: 'pointer' },
    churnWarn: { background: 'rgba(211,150,166,0.07)', border: '1px solid rgba(211,150,166,0.25)', borderLeft: '3px solid var(--rose)', borderRadius: 'var(--r-sm)', padding: '12px 14px', marginBottom: 16 },
    cwHead: { fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--rose)', marginBottom: 5 },
    cwBody: { fontSize: 11, color: 'var(--text-1)', lineHeight: 1.6 },
    tlRow: { display: 'flex', gap: 12, alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid var(--border)' },
    tlIcon: (type: string): React.CSSProperties => ({ width: 24, height: 24, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, ...tlIconStyle(type as 'down' | 'up' | 'new') }),
    tlBody: { flex: 1, minWidth: 0 },
    tlTitle: { fontSize: 11, fontWeight: 600, color: 'var(--text-1)', marginBottom: 1 },
    tlSub: { fontSize: 10, color: 'var(--text-2)' },
    tlTime: { fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)', flexShrink: 0, marginTop: 2 },
    locTable: { width: '100%', borderCollapse: 'collapse' as const, fontSize: 11 },
    locTh: { fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'var(--text-3)', padding: '6px 8px', borderBottom: '1px solid var(--border)', textAlign: 'left' as const, fontWeight: 500 },
    locTd: { padding: '7px 8px', borderBottom: '1px solid var(--border)', color: 'var(--text-1)' },
    locTdR: { padding: '7px 8px', borderBottom: '1px solid var(--border)', color: 'var(--text-1)', textAlign: 'right' as const, fontFamily: 'var(--mono)', fontWeight: 600 },
    locTierTag: { fontFamily: 'var(--mono)', fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(84,132,164,0.1)', color: 'var(--slate)' },
    activityWrap: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 },
    actBar: { flex: 1, height: 4, borderRadius: 2, background: 'var(--surface-3)', overflow: 'hidden' },
    actFill: (pct: number): React.CSSProperties => ({ height: '100%', borderRadius: 2, background: 'var(--rose)', width: `${pct}%` }),
    dpFooter: { padding: '14px 20px', borderTop: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', flexDirection: 'column' as const, gap: 7, flexShrink: 0 },
    dfRow: { display: 'flex', gap: 7 },
    dfBtn: { flex: 1, padding: '8px 12px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid var(--border-2)', background: 'var(--surface-3)', color: 'var(--text-1)', textAlign: 'center' as const },
    dfBtnPrimary: { flex: 1, padding: '8px 12px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid var(--accent)', background: 'var(--accent)', color: '#fff', textAlign: 'center' as const },
    dfBtnCancel: { flex: 1, padding: '8px 12px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid rgba(211,150,166,0.35)', background: 'transparent', color: 'var(--rose)', textAlign: 'center' as const },
    modalOverlay: (open: boolean): React.CSSProperties => ({ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: open ? 1 : 0, pointerEvents: open ? 'all' : 'none', transition: 'opacity 0.2s' }),
    modal: { background: 'var(--surface)', borderRadius: 'var(--r)', padding: 28, maxWidth: 420, width: '90%', boxShadow: '0 12px 50px rgba(0,0,0,0.38)' },
    modalIcon: { width: 44, height: 44, borderRadius: 12, background: 'var(--rose-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
    modalTitle: { fontSize: 16, fontWeight: 700, color: 'var(--text-1)', marginBottom: 8 },
    modalBody: { fontSize: 12, color: 'var(--text-2)', lineHeight: 1.7, marginBottom: 20 },
    modalActions: { display: 'flex', gap: 8 },
    modalBtn: { flex: 1, padding: 10, borderRadius: 'var(--r-sm)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid var(--border-2)', background: 'var(--surface-3)', color: 'var(--text-1)', textAlign: 'center' as const },
    modalBtnConfirm: { flex: 1, padding: 10, borderRadius: 'var(--r-sm)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid var(--rose)', background: 'var(--rose)', color: '#fff', textAlign: 'center' as const },
    toastEl: { position: 'fixed' as const, bottom: 20, left: '50%', transform: 'translateX(-50%)', background: 'var(--surface-3)', border: '1px solid var(--border-2)', borderRadius: 8, padding: '8px 16px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-1)', zIndex: 9999, boxShadow: '0 4px 16px rgba(0,0,0,0.5)' },
  }

  return (
    <div style={s.root}>
      {/* Topbar */}
      <div style={s.topbar}>
        <div style={s.tbInner}>
          <div style={s.back} onClick={() => navigate(-1)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 12, height: 12 }}>
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </div>
          <div>
            <div style={s.tbTitle}>Block Management</div>
            <div style={s.tbSub}>{blocksLoading ? 'Loading…' : `${BLOCKS.length} active block${BLOCKS.length !== 1 ? 's' : ''} · ${BLOCKS.length} slot${BLOCKS.length !== 1 ? 's' : ''} · $${(BLOCKS.length * 100).toLocaleString()}/mo`}</div>
          </div>
          <div style={s.tbActions}>
            <button style={s.btn} onClick={() => navigate('/billing')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 12, height: 12 }}>
                <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
              </svg>
              Billing & slots
            </button>
            <button style={s.btnRose} onClick={openNewBlockModal}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 12, height: 12 }}>
                <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              </svg>
              Block a rival
            </button>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div style={s.filterBar} onClick={(e) => { if (!(e.target as HTMLElement).closest('[data-dd]')) { setLocOpen(false); setSortOpen(false) } }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
          <span style={s.dgLbl}>Location</span>
          <div style={{ position: 'relative', display: 'inline-block' }} data-dd="loc">
            <button style={s.db} onClick={(e) => { e.stopPropagation(); setLocOpen(!locOpen); setSortOpen(false) }}>
              {locLabel}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 10, height: 10, opacity: 0.55 }}><polyline points="6 9 12 15 18 9" /></svg>
            </button>
            <div style={s.dp(locOpen)}>
              {['All locations', 'WeHo Flagship', 'DTLA Flagship', 'SoMa SF', 'Oakland'].map((o) => (
                <div key={o} style={s.doItem(locLabel === o)} onClick={() => { setLocLabel(o); setLocOpen(false) }}>{o}{locLabel === o ? ' ✓' : ''}</div>
              ))}
            </div>
          </div>
        </div>
        <div style={s.fbSep} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
          <span style={s.dgLbl}>Sort</span>
          <div style={{ position: 'relative', display: 'inline-block' }} data-dd="sort">
            <button style={s.db} onClick={(e) => { e.stopPropagation(); setSortOpen(!sortOpen); setLocOpen(false) }}>
              {sortLabel}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 10, height: 10, opacity: 0.55 }}><polyline points="6 9 12 15 18 9" /></svg>
            </button>
            <div style={s.dp(sortOpen)}>
              {['Longest active', 'Highest cost', 'Most active', 'Auto-renewing soonest'].map((o) => (
                <div key={o} style={s.doItem(sortLabel === o)} onClick={() => { setSortLabel(o); setSortOpen(false) }}>{o}{sortLabel === o ? ' ✓' : ''}</div>
              ))}
            </div>
          </div>
        </div>
        <div style={s.fbRight}>
          <OperatorTypeFilter value={operatorType} onChange={setOperatorType} />
          <div style={s.fbCount}>{BLOCKS.length} block{BLOCKS.length !== 1 ? 's' : ''} · {BLOCKS.length} slot{BLOCKS.length !== 1 ? 's' : ''}</div>
        </div>
      </div>

      {/* Body */}
      <div style={s.body}>
        {/* List panel */}
        <div style={s.listPanel}>
          {/* Summary cards */}
          <div style={s.summary}>
            <div style={s.sc('var(--rose)')}>
              <div style={s.scTop}>
                <div style={s.scN('var(--rose)')}>{BLOCKS.length}</div>
                <div style={s.scIco('var(--rose-soft)', 'var(--rose)')}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}><circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" /></svg>
                </div>
              </div>
              <div style={s.scLabel}>Active blocks</div>
              <div style={s.scSub}>{BLOCKS.length} rival{BLOCKS.length !== 1 ? 's' : ''} suppressed</div>
            </div>
            <div style={s.sc('var(--accent)')}>
              <div style={s.scTop}>
                <div style={s.scN('var(--accent)')}>{BLOCKS.length}</div>
                <div style={s.scIco('var(--accent-soft)', 'var(--accent)')}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
                </div>
              </div>
              <div style={s.scLabel}>Block slots used</div>
              <div style={s.scSub}>{BLOCKS.length} slot{BLOCKS.length !== 1 ? 's' : ''} active</div>
            </div>
            <div style={s.sc('var(--warm)')}>
              <div style={s.scTop}>
                <div style={s.scN('var(--warm)')}>${(BLOCKS.length * 100).toLocaleString()}</div>
                <div style={s.scIco('rgba(212,144,10,0.12)', 'var(--warm)')}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                </div>
              </div>
              <div style={s.scLabel}>Monthly block cost</div>
              <div style={s.scSub}>$200/slot · Elite rate</div>
            </div>
            <div style={s.sc('var(--danger)')}>
              <div style={s.scTop}>
                <div style={s.scN('var(--danger)')}>2</div>
                <div style={s.scIco('var(--danger-soft)', 'var(--danger)')}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                </div>
              </div>
              <div style={s.scLabel}>Next billing date</div>
              <div style={s.scSub}>Auto-renews May 1</div>
            </div>
            <div style={s.sc('var(--warm)')}>
              <div style={s.scTop}>
                <div style={s.scN('var(--warm)')}>3</div>
                <div style={s.scIco('rgba(212,144,10,0.12)', 'var(--warm)')}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                </div>
              </div>
              <div style={{ ...s.scLabel, color: 'var(--warm)' }}>Blocking you</div>
              <div style={s.scSub}>3 rivals are blocking you</div>
            </div>
          </div>

          {/* Expiry warning strip */}
          <div style={s.expiryStrip}>
            <div style={s.esDot} />
            <div style={s.esText}>
              <strong>2 blocks auto-renew May 1.</strong> Slots continue automatically unless you cancel. Cancellation is immediate and any prorated remainder of the current billing period is forfeited.
            </div>
            <div style={s.esBtn} onClick={() => showToast('Block settings opened')}>Manage blocks</div>
          </div>

          {/* Active blocks section */}
          <div style={s.sectionHdr}>
            <div style={s.shLabel}>Active blocks</div>
            <div style={s.shLine} />
            <div style={s.shCount}>2 rivals blocked</div>
          </div>

          {blocksLoading ? (
            <div style={{ padding: '32px 0', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>Pulling active blocks…</div>
          ) : BLOCKS.length === 0 ? (
            <div style={{ padding: '32px 0', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>No rivals currently suppressed. Add a block to start building your moat.</div>
          ) : null}
          {BLOCKS.map((b) => (
            <div key={b.id} style={s.blockCard(selectedId === b.id)} onClick={() => setSelectedId(selectedId === b.id ? null : b.id)}>
              <div style={s.bcHeader}>
                <div style={s.bcAvatar(b.color)}>{b.initials}</div>
                <div style={s.bcMain}>
                  <div style={s.bcName}>{b.name}</div>
                  <div style={s.bcMeta}>
                    {b.dist}
                    <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--border-2)', display: 'inline-block' }} />
                    {b.market}
                    <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--border-2)', display: 'inline-block' }} />
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 8, background: 'var(--rose-soft)', color: 'var(--rose)', padding: '1px 6px', borderRadius: 8, fontWeight: 700 }}>BLOCKED {b.days} DAYS</span>
                  </div>
                </div>
                <div style={s.bcRight}>
                  <div style={s.bcDuration}>{b.days} days</div>
                  <div style={s.bcCost}>${b.cost.toLocaleString()}/mo · {b.slots} slots</div>
                </div>
              </div>
              <div style={s.bcBody}>
                <div style={s.bcLocs}>
                  {b.locs.slice(0, 3).map((l) => <span key={l} style={s.locPill}>{l}</span>)}
                  {b.locs.length > 3 && <span style={{ ...s.locPill, opacity: 0.55 }}>+{b.locs.length - 3} more locations</span>}
                </div>
                <div style={s.bcStats}>
                  <div style={s.bs}><div style={s.bsN('var(--rose)')}>{b.days}</div><div style={s.bsL}>Days blocked</div></div>
                  <div style={s.bs}><div style={s.bsN('var(--warm)')}>{b.changes}</div><div style={s.bsL}>Changes while blocked</div></div>
                  <div style={s.bs}><div style={s.bsN('var(--accent)')}>{b.slots}</div><div style={s.bsL}>Locations covered</div></div>
                  <div style={s.bs}><div style={s.bsN('var(--text-1)')}>{b.renews}</div><div style={s.bsL}>Auto-renews</div></div>
                </div>
                <div style={s.sparkRow}>
                  <div style={s.sparkLabel}>Activity — last 14 days</div>
                  <div style={s.spark}>
                    {b.spark.map((h, i) => (
                      <div key={i} style={{ width: 4, borderRadius: 1.5, background: h <= 5 ? 'var(--border-2)' : 'var(--rose)', opacity: 0.85, height: h, alignSelf: 'flex-end' }} />
                    ))}
                  </div>
                  <div style={s.sparkCount}>{b.changes} intercepted</div>
                </div>
              </div>
              <div style={s.bcFooter}>
                <div style={s.bcfBtn} onClick={(e) => { e.stopPropagation(); showToast('Opening rival profile…') }}>View profile →</div>
                <div style={s.bcfBtn} onClick={(e) => { e.stopPropagation(); showToast('Block analytics opened') }}>Block analytics →</div>
                <div style={s.bcfBtnCancel} onClick={(e) => { e.stopPropagation(); openCancelModal(b.id, b.name) }}>Cancel block</div>
              </div>
            </div>
          ))}

          {/* Rivals blocking you */}
          <div style={{ ...s.sectionHdr, marginTop: 28 }}>
            <div style={{ ...s.shLabel, color: 'var(--warm)' }}>Rivals blocking you</div>
            <div style={s.shLine} />
            <div style={{ ...s.shCount, color: 'var(--warm)' }}>3 rivals are blocking you</div>
          </div>
          <div style={{ background: 'var(--warm-soft)', border: '1px solid rgba(212,144,10,0.22)', borderRadius: 'var(--r-sm)', padding: '9px 13px', marginBottom: 10, display: 'flex', gap: 9, alignItems: 'flex-start' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--warm)" strokeWidth="2" style={{ width: 14, height: 14, flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            <div style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.6 }}>These dispensaries are paying CannaSpy customers who have placed a block on your account. You cannot access their data on this platform while the block is active. Enable notifications to be alerted the moment a block is released.</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {BLOCKED_BY.map((bb) => (
              <div key={bb.id} style={s.blockedByCard}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'var(--warm)' }} />
                <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, flexShrink: 0, color: '#fff', background: bb.color }}>{bb.initials}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={s.bbName}>{bb.name}</div>
                  <div style={s.bbMeta}>{bb.meta}</div>
                </div>
                <div style={s.bbDays}>{bb.days} days</div>
                <div style={s.bbBadge}>BLOCKING YOU</div>
                <div style={s.notifyToggle(notifyStates[bb.id])} onClick={() => toggleNotify(bb.id)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 11, height: 11, color: notifyStates[bb.id] ? 'var(--accent)' : 'var(--text-3)', flexShrink: 0 }}>
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  <span style={s.notifyLabel(notifyStates[bb.id])}>Notify on unblock</span>
                </div>
              </div>
            ))}
          </div>

          {/* Trackable rivals */}
          <div style={{ ...s.sectionHdr, marginTop: 28 }}>
            <div style={{ ...s.shLabel, color: 'var(--text-3)' }}>Tracked rivals — not blocked</div>
            <div style={s.shLine} />
            <div style={s.shCount}>3 rivals trackable</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {TRACKABLE.map((t) => (
              <div key={t.id} style={s.trackableRow}>
                <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, flexShrink: 0, color: '#fff', background: t.color }}>{t.initials}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', marginBottom: 2 }}>{t.name}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)' }}>{t.meta}</div>
                </div>
                <div style={{ textAlign: 'right', marginRight: 12 }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)' }}>$200/mo to block</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)' }}>1 slot per location</div>
                </div>
                <button style={{ ...s.btnRose, fontSize: 10, padding: '5px 12px' }} onClick={() => openBlockRivalModal(t.name, '$200/mo')}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 11, height: 11 }}><circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" /></svg>
                  Block
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        <div style={s.detailPanel(!!selectedBlock)}>
          {selectedBlock && (
            <div style={s.detailInner}>
              <div style={s.dpHead}>
                <button style={s.dpClose} onClick={() => setSelectedId(null)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 12, height: 12 }}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
                <div style={s.bcAvatar(selectedBlock.color)}>{selectedBlock.initials}</div>
                <div>
                  <div style={s.dpTitle}>{selectedBlock.name}</div>
                  <div style={s.dpSub}>BLOCKED · {selectedBlock.days} days · {selectedBlock.slots} locations</div>
                </div>
              </div>
              <div style={s.dpScroll}>
                {/* Stat grid */}
                <div style={s.stat4}>
                  <div style={s.stc}><div style={s.stn('var(--rose)')}>{selectedBlock.days}</div><div style={s.stl}>Days blocked</div></div>
                  <div style={s.stc}><div style={s.stn('var(--warm)')}>{selectedBlock.changes}</div><div style={s.stl}>Changes detected</div></div>
                  <div style={s.stc}><div style={s.stn('var(--accent)')}>{selectedBlock.slots}</div><div style={s.stl}>Locations</div></div>
                  <div style={s.stc}><div style={s.stn('var(--text-1)')}>${selectedBlock.cost.toLocaleString()}</div><div style={s.stl}>Monthly cost</div></div>
                </div>

                {/* ROI card */}
                {(() => {
                  const spentSoFar = Math.round((selectedBlock.cost / 30) * selectedBlock.days)
                  const costPerChange = selectedBlock.changes > 0 ? Math.round(spentSoFar / selectedBlock.changes) : 0
                  return (
                    <div style={s.roiCard}>
                      <div style={s.roiHead}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 11, height: 11 }}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                        Block ROI snapshot
                      </div>
                      <div style={s.roiRow}>
                        <div style={s.roiStat(false)}><div style={s.roiN}>${spentSoFar.toLocaleString()}</div><div style={s.roiL}>Spent so far</div></div>
                        <div style={s.roiStat(false)}><div style={s.roiN}>{selectedBlock.changes}</div><div style={s.roiL}>Intercepted</div></div>
                        <div style={s.roiStat(true)}><div style={s.roiN}>${costPerChange}</div><div style={s.roiL}>Per intercept</div></div>
                      </div>
                      <div style={s.roiLink} onClick={() => showToast('Block analytics opened')}>
                        <span>View full block analytics</span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 13, height: 13 }}><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                      </div>
                    </div>
                  )
                })()}

                {/* Churn warning */}
                <div style={s.churnWarn}>
                  <div style={s.cwHead}>⚠ Cancellation consequence</div>
                  <div style={s.cwBody}>If you cancel this block, <strong>{selectedBlock.name}</strong> will be added back to the active prospect list and contacted by our sales team within <strong>24–48 hours</strong>. They will immediately be able to access CannaSpy. This cannot be undone without re-purchasing the block.</div>
                </div>

                {/* Narrative */}
                <div style={s.ds}>
                  <div style={s.dsLbl}>Block summary</div>
                  <div style={s.dsTxt}>{selectedBlock.narrative}</div>
                </div>

                {/* Location table */}
                <div style={s.ds}>
                  <div style={s.dsLbl}>Locations covered</div>
                  <table style={s.locTable}>
                    <thead>
                      <tr>
                        <th style={s.locTh}>Location</th>
                        <th style={s.locTh}>Market tier</th>
                        <th style={{ ...s.locTh, textAlign: 'right' }}>Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedBlock.locs.map((l, i) => {
                        const tier = locTier(l)
                        return (
                          <tr key={i}>
                            <td style={{ ...s.locTd, borderBottom: i === selectedBlock.locs.length - 1 ? 'none' : '1px solid var(--border)' }}>{l}</td>
                            <td style={{ ...s.locTd, borderBottom: i === selectedBlock.locs.length - 1 ? 'none' : '1px solid var(--border)' }}><span style={s.locTierTag}>{tier}</span></td>
                            <td style={{ ...s.locTdR, borderBottom: i === selectedBlock.locs.length - 1 ? 'none' : '1px solid var(--border)' }}>{locRate(tier)}/mo</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Activity */}
                <div style={s.ds}>
                  <div style={s.dsLbl}>Activity while blocked (last 14 days)</div>
                  <div style={s.activityWrap}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)', flexShrink: 0 }}>Activity level</div>
                    <div style={s.actBar}><div style={s.actFill(selectedBlock.activity)} /></div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)', flexShrink: 0 }}>{selectedBlock.activity}%</div>
                  </div>
                  <div>
                    {selectedBlock.timeline.map((t, i) => (
                      <div key={i} style={{ ...s.tlRow, borderBottom: i === selectedBlock.timeline.length - 1 ? 'none' : '1px solid var(--border)' }}>
                        <div style={s.tlIcon(t.type)}><TlIcon type={t.type} /></div>
                        <div style={s.tlBody}>
                          <div style={s.tlTitle}>{t.title}</div>
                          <div style={s.tlSub}>{t.sub}</div>
                        </div>
                        <div style={s.tlTime}>{t.time}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div style={s.dpFooter}>
                <div style={s.dfRow}>
                  <button style={s.dfBtn} onClick={() => showToast('Opening rival profile…')}>View competitor profile →</button>
                  <button style={s.dfBtnPrimary} onClick={() => showToast('Block analytics opened')}>Block analytics →</button>
                </div>
                <div style={s.dfRow}>
                  <button style={s.dfBtnCancel} onClick={() => openCancelModal(selectedBlock.id, selectedBlock.name)}>Cancel block — consequences disclosed →</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cancel modal */}
      <div style={s.modalOverlay(cancelModalOpen)} onClick={(e) => { if (e.target === e.currentTarget) setCancelModalOpen(false) }}>
        <div style={s.modal}>
          <div style={s.modalIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20, color: 'var(--rose)' }}>
              <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
          </div>
          <div style={s.modalTitle}>Cancel block on {cancelTarget?.name}?</div>
          <div style={s.modalBody}>
            <strong>This is irreversible without re-purchasing the block slot.</strong><br /><br />
            The moment you confirm, the block on <strong>{cancelTarget?.name}</strong> lifts and they will be added back to our active prospect outreach queue. Our sales team will contact them <strong>within 24–48 hours</strong> to offer them CannaSpy access.<br /><br />
            They will be able to track your pricing, promotions, and catalog changes immediately upon subscribing.<br /><br />
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>Billing: cancellation is effective immediately. Any prorated remainder of the current billing period is forfeited — no refund or credit is issued.</span>
          </div>
          <div style={s.modalActions}>
            <button style={s.modalBtn} onClick={() => setCancelModalOpen(false)}>Keep blocking</button>
            <button style={s.modalBtnConfirm} onClick={async () => {
              if (!cancelTarget) return
              try {
                await apiCancelBlock(cancelTarget.id)
                setCancelModalOpen(false)
                setSelectedId(null)
                showToast('⚠ Block cancelled — rival being contacted by sales team')
              } catch {
                showToast('Failed to cancel block — please try again')
              }
            }}>Cancel block →</button>
          </div>
        </div>
      </div>

      {/* Block rival modal */}
      <div style={s.modalOverlay(blockModalOpen)} onClick={(e) => { if (e.target === e.currentTarget) setBlockModalOpen(false) }}>
        <div style={s.modal}>
          <div style={s.modalIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20, color: 'var(--rose)' }}>
              <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
          </div>
          <div style={s.modalTitle}>{blockModalIsNew ? 'Block a rival' : `Block ${blockModalName}?`}</div>
          <div style={s.modalBody}>
            {blockModalIsNew ? (
              <>Use the competitor discovery screen to add a rival to your block list. Blocking prevents them from ever accessing CannaSpy intelligence while your block is active.<br /><br />Cost: <strong>$200/slot/month</strong> (Elite market rate).<br />Effect: Immediate. They receive no outreach, no response, no access.</>
            ) : (
              <>Blocking <strong>{blockModalName}</strong> will add <strong>1 block slot</strong> at <strong>{blockModalCost}/location/month</strong> to your billing.<br /><br />Once confirmed, they will be removed from the active prospect list and will receive no response if they contact CannaSpy. The block activates immediately.</>
            )}
          </div>
          <div style={s.modalActions}>
            <button style={s.modalBtn} onClick={() => setBlockModalOpen(false)}>Cancel</button>
            <button style={s.modalBtnConfirm} onClick={() => { setBlockModalOpen(false); showToast('Block activated — rival contacted within 24 hours') }}>Confirm block →</button>
          </div>
        </div>
      </div>

      {toast && (
        <div style={s.toastEl}>{toast}</div>
      )}
    </div>
  )
}
