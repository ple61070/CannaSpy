import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAlerts, type Alert } from '../hooks/useAlerts'
import { useAuthFetch } from '../lib/useAuthFetch'
import { useStore } from '../store'

const API = import.meta.env.VITE_API_URL ?? ''

// ── Helpers (same as CommandCenter) ───────────────────────────────────────

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

type Sev = 'critical' | 'high' | 'medium' | 'info'

function getSev(alert: Alert): Sev {
  if (alert.alert_type === 'price_drop') {
    if (alert.old_value && alert.new_value) {
      const pct = (parseFloat(alert.old_value) - parseFloat(alert.new_value)) / parseFloat(alert.old_value)
      if (pct >= 0.2) return 'critical'
      if (pct >= 0.1) return 'high'
    }
    return 'high'
  }
  if (alert.alert_type === 'new_promo') return 'high'
  if (alert.alert_type === 'new_sku') return 'medium'
  return 'info'
}

function getIconColor(sev: Sev, type: string) {
  if (type === 'block_cancelled') return 'var(--rose)'
  if (sev === 'critical') return 'var(--danger)'
  if (sev === 'high') return 'var(--warning)'
  if (sev === 'medium') return 'var(--accent)'
  return 'var(--slate)'
}

function getSevLabel(sev: Sev) {
  return { critical: 'CRITICAL', high: 'HIGH', medium: 'MEDIUM', info: 'INFO' }[sev]
}

function getSevStyle(sev: Sev): React.CSSProperties {
  if (sev === 'critical') return { background: 'rgba(196,59,78,0.15)', color: 'var(--danger)', border: '1px solid rgba(196,59,78,0.3)' }
  if (sev === 'high') return { background: 'var(--warning-soft)', color: 'var(--warning)', border: '1px solid rgba(152,80,0,0.25)' }
  if (sev === 'medium') return { background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid rgba(11,184,184,0.3)' }
  return { background: 'var(--surface-3)', color: 'var(--text-2)', border: '1px solid var(--border)' }
}

function getTitle(alert: Alert) {
  const name = alert.competitor_name
  if (alert.alert_type === 'price_drop') {
    if (alert.old_value && alert.new_value) {
      const pct = Math.round((parseFloat(alert.old_value) - parseFloat(alert.new_value)) / parseFloat(alert.old_value) * 100)
      return `${name} dropped pricing ${pct}%`
    }
    return `${name} dropped prices`
  }
  if (alert.alert_type === 'new_promo') return `${name} launched a new promotion`
  if (alert.alert_type === 'new_sku') return `${name} added new products`
  if (alert.alert_type === 'price_increase') return `${name} raised prices`
  return `${name} — ${alert.alert_type.replace(/_/g, ' ')}`
}

function getSub(alert: Alert) {
  if (alert.old_value && alert.new_value && alert.alert_type === 'price_drop')
    return `$${alert.old_value} → $${alert.new_value}`
  if (alert.alert_type === 'new_promo') return 'New deal detected on their menu'
  if (alert.alert_type === 'new_sku') return 'Menu update detected'
  return alert.alert_type.replace(/_/g, ' ')
}

function getChips(alert: Alert) {
  const chips: { label: string; color: string; bg: string }[] = []
  if (alert.location_name) chips.push({ label: alert.location_name, color: 'var(--text-2)', bg: 'var(--surface-3)' })
  if (alert.alert_type === 'price_drop' && alert.old_value && alert.new_value) {
    const delta = parseFloat(alert.new_value) - parseFloat(alert.old_value)
    chips.push({ label: `−$${Math.abs(delta).toFixed(0)}`, color: 'var(--danger)', bg: 'var(--danger-soft)' })
  }
  if (alert.alert_type === 'new_promo') chips.push({ label: 'NEW PROMO', color: 'var(--warning)', bg: 'var(--warning-soft)' })
  if (alert.alert_type === 'new_sku') chips.push({ label: 'CATALOG CHANGE', color: 'var(--accent)', bg: 'var(--accent-soft)' })
  return chips
}

function AlertIcon({ type }: { type: string }) {
  if (type === 'price_drop' || type === 'price_increase')
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
  if (type === 'new_promo')
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
  if (type === 'new_sku')
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
}

// ── Dropdown component ─────────────────────────────────────────────────────
function Dropdown({
  id, label, active, open, onToggle, options
}: {
  id: string
  label: string
  active: boolean
  open: boolean
  onToggle: () => void
  options: { value: string; label: string; dot?: string }[]
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{
        fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 600,
        letterSpacing: '0.14em', textTransform: 'uppercase' as const,
        color: 'var(--text-3)',
      }}>{id}</span>
      <div style={{ position: 'relative' }}>
        <button
          onClick={onToggle}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 10px', borderRadius: 8,
            background: active ? 'var(--accent-soft)' : 'var(--surface)',
            border: `1px solid ${active ? 'var(--accent)' : 'var(--border-2)'}`,
            color: active ? 'var(--accent)' : 'var(--text-2)',
            fontSize: 11.5, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'var(--sans)', whiteSpace: 'nowrap' as const,
          }}
        >
          {label}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="8" height="8"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        {open && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 200,
            background: 'var(--surface)', border: '1px solid var(--border-2)',
            borderRadius: 10, boxShadow: 'var(--card-shadow-lg)',
            minWidth: 160, padding: 4,
          }}>
            {options.map(opt => (
              <button
                key={opt.value}
                onClick={() => { /* handled by parent */ }}
                data-value={opt.value}
                style={{
                  display: 'flex', width: '100%', alignItems: 'center', gap: 7,
                  padding: '7px 10px', borderRadius: 7, border: 'none',
                  cursor: 'pointer', textAlign: 'left' as const,
                  background: 'transparent', color: 'var(--text-1)',
                  fontSize: 12, fontFamily: 'var(--sans)',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--accent-soft)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                {opt.dot && <span style={{ width: 7, height: 7, borderRadius: '50%', background: opt.dot, flexShrink: 0 }} />}
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────

type StatusFilter = 'unreviewed' | 'reviewed' | 'all'
type SortKey = 'newest' | 'severity' | 'rival' | 'location'

export default function AlertFeed() {
  const authFetch = useAuthFetch()
  const navigate = useNavigate()
  const setUnreviewed = useStore((s) => s.setUnreviewedAlertCount)

  const [typeFilter, setTypeFilter] = useState('all')
  const [locFilter, setLocFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('unreviewed')
  const [sortKey, setSortKey] = useState<SortKey>('newest')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<{ msg: string; color: string } | null>(null)

  // Dropdown open states
  const [typeDdOpen, setTypeDdOpen] = useState(false)
  const [locDdOpen, setLocDdOpen] = useState(false)
  const [statusDdOpen, setStatusDdOpen] = useState(false)
  const [sortDdOpen, setSortDdOpen] = useState(false)

  const [locations, setLocations] = useState<{ id: string; name: string }[]>([])

  const { alerts, loading, markReviewed, refetch } = useAlerts({ reviewed: statusFilter })

  useEffect(() => {
    authFetch(`${API}/api/v1/locations`)
      .then(r => r.json())
      .then(d => setLocations(d.data?.locations || []))
      .catch(() => {})
  }, [authFetch])

  useEffect(() => {
    setUnreviewed(alerts.filter(a => !a.reviewed).length)
  }, [alerts, setUnreviewed])

  const showToast = (msg: string, color: string) => {
    setToast({ msg, color })
    setTimeout(() => setToast(null), 2800)
  }

  const closeAllDds = () => {
    setTypeDdOpen(false)
    setLocDdOpen(false)
    setStatusDdOpen(false)
    setSortDdOpen(false)
  }

  // ── Computed ──────────────────────────────────────────────────────────────
  const unreviewedCount = alerts.filter(a => !a.reviewed).length

  let filtered = alerts.filter(a => {
    if (search) {
      const q = search.toLowerCase()
      if (!a.competitor_name.toLowerCase().includes(q) && !a.alert_type.includes(q)) return false
    }
    if (typeFilter !== 'all') {
      const typeMap: Record<string, string[]> = {
        price_drop: ['price_drop'],
        promo: ['new_promo'],
        sku: ['new_sku', 'sku_removed'],
        block: ['block_cancelled', 'competitor_blocked'],
      }
      const allowed = typeMap[typeFilter] || [typeFilter]
      if (!allowed.includes(a.alert_type)) return false
    }
    if (locFilter !== 'all' && a.location_name !== locFilter) return false
    return true
  })

  // Sort
  filtered = [...filtered].sort((a, b) => {
    if (sortKey === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    if (sortKey === 'severity') {
      const sevOrder = { critical: 0, high: 1, medium: 2, info: 3 }
      return sevOrder[getSev(a)] - sevOrder[getSev(b)]
    }
    if (sortKey === 'rival') return a.competitor_name.localeCompare(b.competitor_name)
    if (sortKey === 'location') return (a.location_name || '').localeCompare(b.location_name || '')
    return 0
  })

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleReview = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    await markReviewed(id)
    if (expandedId === id) setExpandedId(null)
    showToast('Alert marked as reviewed', 'var(--accent)')
  }

  const handleMarkAll = async () => {
    for (const a of filtered.filter(a => !a.reviewed)) {
      await markReviewed(a.id)
    }
    showToast(`${filtered.filter(a => !a.reviewed).length} alerts marked reviewed`, 'var(--accent)')
  }

  const toggleBulk = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setBulkSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    if (expandedId) setExpandedId(null)
  }

  const bulkMarkReviewed = async () => {
    const ids = Array.from(bulkSelected)
    for (const id of ids) await markReviewed(id)
    setBulkSelected(new Set())
    showToast(`${ids.length} alert${ids.length === 1 ? '' : 's'} marked reviewed`, 'var(--accent)')
  }

  const typeLabel = typeFilter === 'all' ? 'All types'
    : typeFilter === 'price_drop' ? 'Price drop'
    : typeFilter === 'promo' ? 'New promo'
    : typeFilter === 'sku' ? 'Catalog change'
    : typeFilter === 'block' ? 'Block activity'
    : typeFilter

  const locLabel = locFilter === 'all' ? 'All locations' : locFilter
  const statusLabel = statusFilter === 'unreviewed' ? 'Unreviewed' : statusFilter === 'reviewed' ? 'Reviewed' : 'All alerts'
  const sortLabel = sortKey === 'newest' ? 'Newest first' : sortKey === 'severity' ? 'Severity' : sortKey === 'rival' ? 'Rival name' : 'Location'

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}
      onClick={closeAllDds}
    >
      {/* ── Topbar ──────────────────────────────────────────────────────── */}
      <div style={{
        padding: '16px 28px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
        backdropFilter: 'blur(20px) saturate(1.4)',
        flexShrink: 0, zIndex: 30, position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            onClick={() => navigate('/command-center')}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 10px', borderRadius: 8,
              border: '1px solid var(--border-2)', background: 'var(--surface-2)',
              color: 'var(--text-2)', fontSize: 12, cursor: 'pointer',
              fontFamily: 'var(--sans)', fontWeight: 600,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLElement).style.color = 'var(--accent)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-2)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-2)' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12"><polyline points="15 18 9 12 15 6"/></svg>
            Back
          </button>
          <div>
            <div style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 400, color: 'var(--text-1)', letterSpacing: '-0.015em', lineHeight: 1 }}>
              Alert Feed
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 4 }}>
              {locFilter === 'all' ? 'All locations' : locFilter}
              {' · '}
              {loading ? 'Loading…' : `${unreviewedCount} unreviewed`}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={handleMarkAll}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 10,
              border: '1px solid var(--border-2)', background: 'var(--surface-2)',
              color: 'var(--text-2)', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'var(--sans)',
              transition: 'var(--transition)',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLElement).style.color = 'var(--accent)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-2)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-2)' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13"><polyline points="20 6 9 17 4 12"/></svg>
            Mark all reviewed
          </button>
          <button
            onClick={() => navigate('/prices')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 10,
              border: 'none', background: 'var(--accent)',
              color: 'var(--cta-fg-on-pos)', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'var(--sans)',
              boxShadow: 'var(--cta-shadow)',
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            Price matrix →
          </button>
        </div>
      </div>

      {/* ── Filter bar ──────────────────────────────────────────────────── */}
      <div style={{
        padding: '10px 28px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface-2)',
        flexShrink: 0, zIndex: 20,
        display: 'flex', alignItems: 'center', gap: 20,
        flexWrap: 'wrap',
      }}
        onClick={e => e.stopPropagation()}
      >
        {/* Type */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: 'var(--text-3)' }}>Type</span>
          <div style={{ position: 'relative' }}>
            <button onClick={() => { setTypeDdOpen(o => !o); setLocDdOpen(false); setStatusDdOpen(false); setSortDdOpen(false) }}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8, background: typeFilter !== 'all' ? 'var(--accent-soft)' : 'var(--surface)', border: `1px solid ${typeFilter !== 'all' ? 'var(--accent)' : 'var(--border-2)'}`, color: typeFilter !== 'all' ? 'var(--accent)' : 'var(--text-2)', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', whiteSpace: 'nowrap' as const }}>
              {typeLabel}<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="8" height="8"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            {typeDdOpen && <FilterPop options={[
              { value: 'all', label: 'All types' },
              { value: 'price_drop', label: 'Price drop', dot: 'var(--danger)' },
              { value: 'promo', label: 'New promo', dot: 'var(--warm)' },
              { value: 'sku', label: 'Catalog change', dot: 'var(--slate)' },
              { value: 'block', label: 'Block activity', dot: 'var(--rose)' },
            ]} current={typeFilter} onSelect={v => { setTypeFilter(v); setTypeDdOpen(false) }} />}
          </div>
        </div>

        <div style={{ width: 1, height: 20, background: 'var(--border-2)' }} />

        {/* Location */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: 'var(--text-3)' }}>Location</span>
          <div style={{ position: 'relative' }}>
            <button onClick={() => { setLocDdOpen(o => !o); setTypeDdOpen(false); setStatusDdOpen(false); setSortDdOpen(false) }}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8, background: locFilter !== 'all' ? 'var(--accent-soft)' : 'var(--surface)', border: `1px solid ${locFilter !== 'all' ? 'var(--accent)' : 'var(--border-2)'}`, color: locFilter !== 'all' ? 'var(--accent)' : 'var(--text-2)', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', whiteSpace: 'nowrap' as const }}>
              {locLabel}<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="8" height="8"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            {locDdOpen && <FilterPop options={[
              { value: 'all', label: 'All locations' },
              ...locations.map(l => ({ value: l.name, label: l.name })),
            ]} current={locFilter} onSelect={v => { setLocFilter(v); setLocDdOpen(false) }} />}
          </div>
        </div>

        <div style={{ width: 1, height: 20, background: 'var(--border-2)' }} />

        {/* Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: 'var(--text-3)' }}>Status</span>
          <div style={{ position: 'relative' }}>
            <button onClick={() => { setStatusDdOpen(o => !o); setTypeDdOpen(false); setLocDdOpen(false); setSortDdOpen(false) }}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8, background: statusFilter === 'unreviewed' ? 'rgba(196,59,78,0.12)' : 'var(--surface)', border: `1px solid ${statusFilter === 'unreviewed' ? 'rgba(196,59,78,0.3)' : 'var(--border-2)'}`, color: statusFilter === 'unreviewed' ? 'var(--danger)' : 'var(--text-2)', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', whiteSpace: 'nowrap' as const }}>
              {statusLabel}<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="8" height="8"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            {statusDdOpen && <FilterPop options={[
              { value: 'all', label: 'All alerts' },
              { value: 'unreviewed', label: 'Unreviewed', dot: 'var(--danger)' },
              { value: 'reviewed', label: 'Reviewed', dot: 'var(--text-3)' },
            ]} current={statusFilter} onSelect={v => { setStatusFilter(v as StatusFilter); setStatusDdOpen(false) }} />}
          </div>
        </div>

        <div style={{ width: 1, height: 20, background: 'var(--border-2)' }} />

        {/* Sort */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: 'var(--text-3)' }}>Sort</span>
          <div style={{ position: 'relative' }}>
            <button onClick={() => { setSortDdOpen(o => !o); setTypeDdOpen(false); setLocDdOpen(false); setStatusDdOpen(false) }}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8, background: sortKey !== 'newest' ? 'var(--accent-soft)' : 'var(--surface)', border: `1px solid ${sortKey !== 'newest' ? 'var(--accent)' : 'var(--border-2)'}`, color: sortKey !== 'newest' ? 'var(--accent)' : 'var(--text-2)', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', whiteSpace: 'nowrap' as const }}>
              {sortLabel}<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="8" height="8"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            {sortDdOpen && <FilterPop options={[
              { value: 'newest', label: 'Newest first' },
              { value: 'severity', label: 'Severity (critical first)' },
              { value: 'rival', label: 'Rival name' },
              { value: 'location', label: 'Location' },
            ]} current={sortKey} onSelect={v => { setSortKey(v as SortKey); setSortDdOpen(false) }} />}
          </div>
        </div>

        {/* Filter count */}
        {filtered.length > 0 && (
          <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)' }}>
            {filtered.length} alert{filtered.length === 1 ? '' : 's'}
          </span>
        )}
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
        {/* Greeting row */}
        <div style={{
          padding: '14px 28px 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--text-2)' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-1)' }}>{greeting}, Patrick</span>
            <span style={{ color: 'var(--text-3)' }}>·</span>
            {unreviewedCount > 0 ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--danger)', boxShadow: '0 0 0 3px rgba(196,59,78,0.15)', flexShrink: 0 }} />
                <span id="greetingCount">{unreviewedCount} unreviewed</span>
              </span>
            ) : (
              <span style={{ color: 'var(--positive)' }}>All caught up</span>
            )}
          </div>
          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--border-2)', padding: '6px 12px', width: 240 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12" style={{ color: 'var(--text-3)', flexShrink: 0 }}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.5-4.5"/></svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search rivals, SKUs…"
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 12, color: 'var(--text-1)', fontFamily: 'var(--sans)' }}
            />
            <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)', background: 'var(--surface-3)', padding: '1px 5px', borderRadius: 4, border: '1px solid var(--border)', flexShrink: 0 }}>⌘K</span>
          </div>
        </div>

        {/* Alert list */}
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '14px 28px 80px' }}>
          {loading ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-3)', fontSize: 12 }}>
              Loading intelligence feed…
            </div>
          ) : filtered.length === 0 ? (
            <EmptyStateCard
              statusFilter={statusFilter}
              hasFilters={typeFilter !== 'all' || locFilter !== 'all'}
              locationCount={locations.length}
              onReset={() => { setTypeFilter('all'); setLocFilter('all'); setStatusFilter('unreviewed'); setSortKey('newest') }}
            />
          ) : (
            filtered.map(alert => (
              <AlertRow
                key={alert.id}
                alert={alert}
                expanded={expandedId === alert.id}
                bulkSelected={bulkSelected.has(alert.id)}
                onExpand={() => setExpandedId(expandedId === alert.id ? null : alert.id)}
                onBulkToggle={e => toggleBulk(alert.id, e)}
                onReview={e => handleReview(alert.id, e)}
                onNavigatePrices={() => navigate('/prices')}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Bulk action bar ───────────────────────────────────────────────── */}
      {bulkSelected.size > 0 && (
        <div style={{
          position: 'fixed', bottom: 0, left: 64, right: 0,
          padding: '14px 28px',
          background: 'var(--surface-solid)',
          borderTop: '1px solid var(--border-2)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.12)',
          zIndex: 100,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              background: 'var(--accent)', color: 'var(--cta-fg-on-pos)',
              borderRadius: 20, padding: '2px 10px',
              fontSize: 12, fontWeight: 700, fontFamily: 'var(--mono)',
            }}>{bulkSelected.size}</span>
            <span style={{ fontSize: 12.5, color: 'var(--text-2)', fontWeight: 500 }}>
              alert{bulkSelected.size === 1 ? '' : 's'} selected
            </span>
          </div>
          <button
            onClick={bulkMarkReviewed}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 20, border: 'none', background: 'var(--accent)', color: 'var(--cta-fg-on-pos)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--sans)', boxShadow: 'var(--cta-shadow)' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13"><polyline points="20 6 9 17 4 12"/></svg>
            Mark all reviewed
          </button>
          <button
            onClick={() => setBulkSelected(new Set())}
            style={{ padding: '8px 14px', borderRadius: 20, border: '1px solid var(--border-2)', background: 'transparent', color: 'var(--text-2)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)' }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* ── Toast ──────────────────────────────────────────────────────── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999,
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--surface-solid)', border: '1px solid var(--border-2)',
          borderRadius: 20, padding: '10px 18px',
          boxShadow: 'var(--card-shadow-lg)',
          fontSize: 12.5, fontWeight: 600, color: 'var(--text-1)',
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: toast.color, flexShrink: 0 }} />
          {toast.msg}
        </div>
      )}
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────

function FilterPop({ options, current, onSelect }: {
  options: { value: string; label: string; dot?: string }[]
  current: string
  onSelect: (v: string) => void
}) {
  return (
    <div style={{
      position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 300,
      background: 'var(--surface)', border: '1px solid var(--border-2)',
      borderRadius: 10, boxShadow: 'var(--card-shadow-lg)', minWidth: 170, padding: 4,
    }}
      onClick={e => e.stopPropagation()}
    >
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onSelect(opt.value)}
          style={{
            display: 'flex', width: '100%', alignItems: 'center', gap: 7,
            padding: '7px 10px', borderRadius: 7, border: 'none', cursor: 'pointer',
            background: current === opt.value ? 'var(--accent-soft)' : 'transparent',
            color: current === opt.value ? 'var(--accent)' : 'var(--text-1)',
            fontSize: 12, fontFamily: 'var(--sans)', textAlign: 'left' as const,
          }}
        >
          {opt.dot && <span style={{ width: 7, height: 7, borderRadius: '50%', background: opt.dot, flexShrink: 0 }} />}
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function AlertRow({ alert, expanded, bulkSelected, onExpand, onBulkToggle, onReview, onNavigatePrices }: {
  alert: Alert
  expanded: boolean
  bulkSelected: boolean
  onExpand: () => void
  onBulkToggle: (e: React.MouseEvent) => void
  onReview: (e: React.MouseEvent) => void
  onNavigatePrices: () => void
}) {
  const sev = getSev(alert)
  const iconColor = getIconColor(sev, alert.alert_type)
  const chips = getChips(alert)

  return (
    <div
      onClick={onExpand}
      style={{
        background: bulkSelected ? 'var(--accent-soft)' : alert.reviewed ? 'transparent' : 'var(--surface)',
        border: `1px solid ${
          bulkSelected ? 'var(--accent)'
          : sev === 'critical' && !alert.reviewed ? 'rgba(196,59,78,0.25)'
          : 'var(--border)'
        }`,
        borderRadius: 16,
        marginBottom: 8,
        cursor: 'pointer',
        transition: 'all 0.2s',
        boxShadow: sev === 'critical' && !alert.reviewed && !bulkSelected
          ? '0 2px 8px rgba(196,59,78,0.08), 0 20px 48px -20px rgba(196,59,78,0.22)'
          : 'none',
        opacity: alert.reviewed ? 0.72 : 1,
      }}
    >
      {/* Main row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: sev === 'critical' && !alert.reviewed ? '16px 18px' : '12px 16px' }}>
        {/* Bulk checkbox */}
        <div
          onClick={onBulkToggle}
          style={{
            width: 18, height: 18, borderRadius: 5, flexShrink: 0, marginTop: 1,
            border: `2px solid ${bulkSelected ? 'var(--accent)' : 'var(--border-2)'}`,
            background: bulkSelected ? 'var(--accent)' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'var(--transition)',
          }}
        >
          {bulkSelected && <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" width="10" height="10"><polyline points="20 6 9 17 4 12"/></svg>}
        </div>

        {/* Icon */}
        <div style={{
          width: sev === 'critical' && !alert.reviewed ? 36 : 30,
          height: sev === 'critical' && !alert.reviewed ? 36 : 30,
          borderRadius: 9, flexShrink: 0,
          background: iconColor + '20',
          border: `1px solid ${iconColor}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: iconColor, transition: 'all 0.2s',
        }}>
          <AlertIcon type={alert.alert_type} />
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 3 }}>
            <div style={{
              fontSize: sev === 'critical' && !alert.reviewed ? 14.5 : 13,
              fontWeight: alert.reviewed ? 500 : 700,
              color: 'var(--text-1)',
              lineHeight: 1.3, letterSpacing: '-0.01em',
            }}>
              {getTitle(alert)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                {timeAgo(alert.created_at)}
              </span>
              {/* Severity pill */}
              <span style={{
                fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 600,
                letterSpacing: '0.12em', textTransform: 'uppercase' as const,
                padding: '2px 8px', borderRadius: 100,
                ...getSevStyle(sev),
              }}>
                {getSevLabel(sev)}
              </span>
            </div>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-2)', marginBottom: chips.length > 0 ? 8 : 0, lineHeight: 1.4 }}>
            {getSub(alert)}
          </div>
          {chips.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' as const }}>
              {chips.map((chip, i) => (
                <span key={i} style={{
                  fontSize: 9.5, fontWeight: 600, fontFamily: 'var(--mono)',
                  padding: '2px 8px', borderRadius: 5,
                  background: chip.bg, color: chip.color,
                  letterSpacing: '0.04em', whiteSpace: 'nowrap' as const,
                }}>
                  {chip.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Inline expansion */}
      {expanded && (
        <div style={{ padding: '0 18px 16px', borderTop: '1px solid var(--border)', marginTop: 0, paddingTop: 14 }}>
          {/* Stats */}
          {alert.old_value && alert.new_value && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 14 }}>
              {[
                { label: 'Price cut', val: `−$${(parseFloat(alert.old_value) - parseFloat(alert.new_value)).toFixed(0)}`, color: 'var(--danger)' },
                { label: '% change', val: `−${Math.round((parseFloat(alert.old_value) - parseFloat(alert.new_value)) / parseFloat(alert.old_value) * 100)}%`, color: 'var(--danger)' },
                { label: 'Detected', val: timeAgo(alert.created_at), color: 'var(--warm)' },
                { label: 'Confidence', val: alert.confidence, color: 'var(--text-1)' },
              ].map((s, i) => (
                <div key={i} style={{ background: 'var(--stat-bg)', border: '1px solid var(--stat-border)', borderRadius: 12, padding: '12px 14px 10px' }}>
                  <div style={{ fontFamily: 'var(--display)', fontSize: 22, fontStyle: 'italic', color: s.color, lineHeight: 1 }}>{s.val}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Recommendation */}
          <div style={{ padding: '9px 12px 10px 13px', background: 'var(--accent-soft)', border: '1px solid rgba(11,184,184,0.20)', borderLeft: '3px solid var(--accent)', borderRadius: 8, marginBottom: 12 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: 'var(--accent)', marginBottom: 5 }}>Recommendation</div>
            <div style={{ fontSize: 12, color: 'var(--text-1)', lineHeight: 1.55 }}>
              {alert.alert_type === 'price_drop' && alert.old_value && alert.new_value
                ? `Review pricing on this product. A ${Math.round((parseFloat(alert.old_value) - parseFloat(alert.new_value)) / parseFloat(alert.old_value) * 100)}% price gap on a competitor SKU may shift volume within 48 hours.`
                : `Review ${alert.competitor_name}'s latest activity and decide if a response is needed.`
              }
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
            <button
              onClick={onReview}
              style={{ flex: 1, minWidth: 120, padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border-2)', background: 'var(--surface-2)', color: 'var(--text-2)', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)' }}
            >
              Mark reviewed
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onNavigatePrices() }}
              style={{ flex: 2, minWidth: 160, padding: '8px 12px', borderRadius: 10, border: 'none', background: 'var(--accent)', color: 'var(--cta-fg-on-pos)', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', boxShadow: 'var(--cta-shadow)' }}
            >
              View price matrix →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function EmptyStateCard({ statusFilter, hasFilters, locationCount, onReset }: {
  statusFilter: StatusFilter
  hasFilters: boolean
  locationCount: number
  onReset: () => void
}) {
  if (statusFilter !== 'unreviewed' || hasFilters) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 24px' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--text-3)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.5-4.5"/></svg>
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', marginBottom: 8 }}>No alerts match</div>
        <div style={{ fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.6, marginBottom: 20 }}>Your filters returned no results. Try adjusting type, location, or status.</div>
        <button onClick={onReset} style={{ padding: '9px 18px', borderRadius: 20, border: 'none', background: 'var(--accent)', color: 'var(--cta-fg-on-pos)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--sans)', boxShadow: 'var(--cta-shadow)' }}>Clear all filters</button>
      </div>
    )
  }
  return (
    <div style={{ textAlign: 'center', padding: '60px 24px' }}>
      <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--accent-soft)', border: '1px solid rgba(11,184,184,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--accent)' }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="22" height="22"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-1)', marginBottom: 8, letterSpacing: '-0.02em' }}>You're all caught up</div>
      <div style={{ fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.6, maxWidth: 360, margin: '0 auto 6px' }}>
        Every alert in your feed has been reviewed. We'll notify you when new intelligence arrives.
      </div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 24 }}>
        Next sweep · within the hour
      </div>
    </div>
  )
}
