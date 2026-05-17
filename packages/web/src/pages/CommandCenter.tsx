import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Map, { Marker, NavigationControl, type MapRef } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useAlerts, type Alert } from '../hooks/useAlerts'
import { useBlocks } from '../hooks/useBlocks'
import { useAuthFetch } from '../lib/useAuthFetch'
import { useStore } from '../store'
import { OperatorTypeFilter, type OperatorType } from '../components/filters/OperatorTypeFilter'

const API = import.meta.env.VITE_API_URL ?? ''
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN ?? ''

type MapStyleId = 'streets' | 'satellite'
type AppTheme = 'light' | 'dark'
const MAP_STYLES: Record<MapStyleId, Record<AppTheme, string>> = {
  streets:   { light: 'mapbox://styles/mapbox/streets-v12', dark: 'mapbox://styles/mapbox/dark-v11' },
  satellite: { light: 'mapbox://styles/mapbox/satellite-streets-v12', dark: 'mapbox://styles/mapbox/satellite-streets-v12' },
}
function useAppTheme(): AppTheme {
  const [theme, setTheme] = useState<AppTheme>(
    () => (localStorage.getItem('cs-theme') as AppTheme) || 'light'
  )
  useEffect(() => {
    const obs = new MutationObserver(() => {
      const t = document.documentElement.getAttribute('data-theme') as AppTheme | null
      if (t) setTheme(t)
    })
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => obs.disconnect()
  }, [])
  return theme
}

// Default to LA if no location coords
const LA_VIEWPORT = { longitude: -118.2437, latitude: 34.0522, zoom: 11 }

// ── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function getSeverity(alert: Alert): 'critical' | 'high' | 'medium' | 'info' {
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

function getIconColor(sev: 'critical' | 'high' | 'medium' | 'info', type: string) {
  if (type === 'block_cancelled' || type === 'competitor_blocked') return 'var(--rose)'
  if (sev === 'critical') return 'var(--danger)'
  if (sev === 'high') return 'var(--warning)'
  if (sev === 'medium') return 'var(--accent)'
  return 'var(--slate)'
}

function getSevLabel(sev: 'critical' | 'high' | 'medium' | 'info') {
  if (sev === 'critical') return 'CRITICAL'
  if (sev === 'high') return 'HIGH'
  if (sev === 'medium') return 'MEDIUM'
  return 'INFO'
}

function getSevClass(sev: 'critical' | 'high' | 'medium' | 'info') {
  if (sev === 'critical') return { background: 'rgba(196,59,78,0.15)', color: 'var(--danger)', border: '1px solid rgba(196,59,78,0.3)' }
  if (sev === 'high') return { background: 'var(--warning-soft)', color: 'var(--warning)', border: '1px solid rgba(152,80,0,0.25)' }
  if (sev === 'medium') return { background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid rgba(11,184,184,0.3)' }
  return { background: 'var(--surface-3)', color: 'var(--text-2)', border: '1px solid var(--border)' }
}

function getAlertTitle(alert: Alert) {
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

function getAlertSub(alert: Alert) {
  if (alert.old_value && alert.new_value && alert.alert_type === 'price_drop') {
    return `$${alert.old_value} → $${alert.new_value}`
  }
  if (alert.alert_type === 'new_promo') return 'New deal detected'
  if (alert.alert_type === 'new_sku') return 'Menu update detected'
  return alert.alert_type.replace(/_/g, ' ')
}

function getAlertChips(alert: Alert): { label: string; color: string; bg: string }[] {
  const chips: { label: string; color: string; bg: string }[] = []
  if (alert.location_name) chips.push({ label: alert.location_name, color: 'var(--text-2)', bg: 'var(--surface-3)' })
  if (alert.alert_type === 'price_drop' && alert.old_value && alert.new_value) {
    const delta = parseFloat(alert.new_value) - parseFloat(alert.old_value)
    chips.push({ label: `−$${Math.abs(delta).toFixed(0)}`, color: 'var(--danger)', bg: 'var(--danger-soft)' })
  }
  if (alert.alert_type === 'new_promo') chips.push({ label: 'PROMO', color: 'var(--warning)', bg: 'var(--warning-soft)' })
  if (alert.alert_type === 'new_sku') chips.push({ label: 'NEW SKU', color: 'var(--accent)', bg: 'var(--accent-soft)' })
  return chips
}

// Alert icon SVGs
function AlertIcon({ type }: { type: string }) {
  if (type === 'price_drop')
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
  if (type === 'new_promo')
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
  if (type === 'new_sku')
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
  if (type === 'price_increase')
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
}

// Sparkline mini-chart (decorative)
function Sparkline({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 28" width="80" height="28" style={{ display: 'block' }}>
      <path
        d="M0,20 L10,18 L20,22 L30,14 L40,16 L50,8 L60,12 L70,4 L80,6"
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />
    </svg>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function CommandCenter() {
  const authFetch = useAuthFetch()
  const navigate = useNavigate()
  const setUnreviewed = useStore((s) => s.setUnreviewedAlertCount)

  // Filters
  const [locFilter, setLocFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'unreviewed' | 'all' | 'reviewed'>('unreviewed')
  const [search, setSearch] = useState('')

  // Dropdown open state
  const [locOpen, setLocOpen] = useState(false)
  const [typeOpen, setTypeOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)

  // Inline expanded alert
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Toast
  const [toast, setToast] = useState<{ msg: string; color: string } | null>(null)

  // Locations list
  const mapRef          = useRef<MapRef | null>(null)
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const appTheme        = useAppTheme()
  const [mapStyleId, setMapStyleId] = useState<MapStyleId>('streets')
  const [locations, setLocations] = useState<{ id: string; name: string; lat?: number | null; lng?: number | null }[]>([])
  const [locationName, setLocationName] = useState('All locations')

  const [operatorType, setOperatorType] = useState<OperatorType>('both')
  const [competitors, setCompetitors] = useState<{
    tracked_id: string; competitor_id: string; name: string
    lat: number | null; lng: number | null; slot_type: string; blocked_at: string | null
  }[]>([])

  const { alerts, loading, markReviewed } = useAlerts({
    reviewed: statusFilter,
    type: operatorType === 'both' ? undefined : operatorType,
  })
  const { blocks } = useBlocks()

  useEffect(() => {
    authFetch(`${API}/api/v1/locations`)
      .then((r) => r.json())
      .then((d) => setLocations(d.locations || d.data?.locations || []))
      .catch(() => {})
  }, [authFetch])

  // Fetch tracked competitors across ALL locations for map pins + search
  useEffect(() => {
    if (!locations.length) return
    Promise.all(
      locations.map(loc =>
        authFetch(`${API}/api/v1/locations/${loc.id}/competitors`)
          .then(r => r.json())
          .then(d => d.competitors || [])
          .catch(() => [] as typeof competitors)
      )
    ).then(results => {
      const seen = new Set<string>()
      const merged = results.flat().filter(c => {
        if (seen.has(c.competitor_id)) return false
        seen.add(c.competitor_id)
        return true
      })
      setCompetitors(merged)
    })
  }, [authFetch, locations])

  useEffect(() => {
    const count = alerts.filter((a) => !a.reviewed).length
    setUnreviewed(count)
  }, [alerts, setUnreviewed])

  // Keep Mapbox canvas in sync with container size (sidebar expand/collapse)
  useEffect(() => {
    const el = mapContainerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => { mapRef.current?.getMap()?.resize() })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // ── Computed ──────────────────────────────────────────────────────────────
  const unreviewedCount = alerts.filter((a) => !a.reviewed).length

  const filteredAlerts = alerts.filter((a) => {
    if (search) {
      const q = search.toLowerCase()
      if (!a.competitor_name.toLowerCase().includes(q) && !a.alert_type.includes(q)) return false
    }
    if (locFilter !== 'all' && a.location_name !== locFilter) return false
    if (typeFilter !== 'all' && a.alert_type !== typeFilter) return false
    return true
  })

  // Search across competitors even when no alerts exist
  const filteredCompetitors = search
    ? competitors.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : []

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleMarkReviewed = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    await markReviewed(id)
    showToast('Marked as reviewed', 'var(--accent)')
    if (expandedId === id) setExpandedId(null)
  }

  const showToast = (msg: string, color: string) => {
    setToast({ msg, color })
    setTimeout(() => setToast(null), 2800)
  }

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const lastScan = `Today ${String(2).padStart(2, '0')}:47 AM PT`
  const nextScan = 'Tomorrow 2:30 AM'

  const firstLocation = locations[0]
  const mapCenter = firstLocation?.lat && firstLocation?.lng
    ? { longitude: Number(firstLocation.lng), latitude: Number(firstLocation.lat), zoom: 12 }
    : LA_VIEWPORT

  // Fly to first location when it loads
  const handleMapLoad = useCallback(() => {
    if (!firstLocation?.lat || !firstLocation?.lng) return
    mapRef.current?.flyTo({
      center: [Number(firstLocation.lng), Number(firstLocation.lat)],
      zoom: 12,
      duration: 800,
    })
  }, [firstLocation])

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', position: 'relative', zIndex: 1 }}>

      {/* ── List Panel ──────────────────────────────────────────────────── */}
      <div style={{
        width: 'var(--list-w)',
        minWidth: 'var(--list-w)',
        maxWidth: 'var(--list-w)',
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        flexShrink: 0,
        position: 'relative',
        zIndex: 10,
      }}>

        {/* Greeting row */}
        <div style={{
          padding: '14px 18px 12px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          background: 'var(--surface)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--text-2)' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-1)' }}>{greeting}, Patrick</span>
            <span style={{ color: 'var(--text-3)' }}>·</span>
            {unreviewedCount > 0 ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--danger)', boxShadow: '0 0 0 3px rgba(196,59,78,0.15)', flexShrink: 0 }} />
                {unreviewedCount} unreviewed
              </span>
            ) : (
              <span style={{ color: 'var(--positive)' }}>All clear</span>
            )}
          </div>
          {/* Export button */}
          <button
            onClick={() => showToast('Export coming soon', 'var(--accent)')}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 10px', borderRadius: 8,
              background: 'var(--surface-2)', border: '1px solid var(--border-2)',
              color: 'var(--text-2)', fontSize: 11.5, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'var(--sans)',
              transition: 'var(--transition)',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLElement).style.color = 'var(--accent)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-2)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-2)' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            Export
          </button>
        </div>

        {/* Search bar */}
        <div style={{
          padding: '10px 14px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
          position: 'relative',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--surface-2)', borderRadius: 10,
            border: `1px solid ${search && filteredCompetitors.length > 0 ? 'var(--accent)' : 'var(--border-2)'}`,
            padding: '7px 12px',
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13" style={{ color: 'var(--text-3)', flexShrink: 0 }}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.5-4.5"/></svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Escape') setSearch('') }}
              placeholder="Search rivals, SKUs, alerts…"
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                fontSize: 12.5, color: 'var(--text-1)', fontFamily: 'var(--sans)',
              }}
            />
            {search
              ? <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 0, lineHeight: 1, fontSize: 14 }}>×</button>
              : <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--text-3)', background: 'var(--surface-3)', padding: '2px 5px', borderRadius: 4, border: '1px solid var(--border)', whiteSpace: 'nowrap' }}>⌘K</span>
            }
          </div>
          {/* Autocomplete dropdown — rivals matched */}
          {search && filteredCompetitors.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 14, right: 14, zIndex: 300,
              background: 'var(--surface)', border: '1px solid var(--accent)',
              borderTop: 'none', borderRadius: '0 0 10px 10px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              overflow: 'hidden',
            }}>
              <div style={{ padding: '5px 10px 3px', fontSize: 9, fontFamily: 'var(--mono)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
                Rivals matched
              </div>
              {filteredCompetitors.map(c => (
                <button
                  key={c.competitor_id}
                  onClick={() => {
                    setSearch('')
                    if (c.lat && c.lng) mapRef.current?.flyTo({ center: [Number(c.lng), Number(c.lat)], zoom: 14, duration: 700 })
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                    padding: '8px 12px', border: 'none', cursor: 'pointer',
                    background: 'transparent', textAlign: 'left',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                    background: c.slot_type === 'block' ? 'var(--accent-block)' : 'var(--accent-intel)',
                  }} />
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-1)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                  <span style={{ fontSize: 9.5, fontFamily: 'var(--mono)', color: 'var(--text-3)', flexShrink: 0 }}>
                    {c.slot_type === 'block' ? 'BLOCKED' : 'TRACKING'}{c.lat ? ' · fly to' : ''}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Operator type filter */}
        <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <OperatorTypeFilter value={operatorType} onChange={setOperatorType} />
        </div>

        {/* Filter bar — location + type + status */}
        <div style={{
          padding: '8px 14px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 8,
          flexShrink: 0,
          background: 'var(--surface-2)',
        }}>
          {/* Location dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => { setLocOpen(o => !o); setTypeOpen(false); setStatusOpen(false) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 9px', borderRadius: 8,
                background: locFilter !== 'all' ? 'var(--accent-soft)' : 'var(--surface)',
                border: `1px solid ${locFilter !== 'all' ? 'var(--accent)' : 'var(--border-2)'}`,
                color: locFilter !== 'all' ? 'var(--accent)' : 'var(--text-2)',
                fontSize: 11, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'var(--sans)', whiteSpace: 'nowrap',
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="10" height="10"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {locFilter === 'all' ? 'All locations' : locFilter}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="8" height="8"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            {locOpen && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 200,
                background: 'var(--surface)', border: '1px solid var(--border-2)',
                borderRadius: 10, boxShadow: 'var(--card-shadow-lg)', minWidth: 160,
                padding: 4, overflow: 'hidden',
              }}>
                {[{ id: 'all', name: 'All locations' }, ...locations].map(loc => (
                  <button
                    key={loc.id}
                    onClick={() => { setLocFilter(loc.id === 'all' ? 'all' : loc.name); setLocOpen(false) }}
                    style={{
                      display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between',
                      padding: '7px 10px', borderRadius: 7, border: 'none', cursor: 'pointer',
                      background: (locFilter === 'all' && loc.id === 'all') || locFilter === loc.name ? 'var(--accent-soft)' : 'transparent',
                      color: (locFilter === 'all' && loc.id === 'all') || locFilter === loc.name ? 'var(--accent)' : 'var(--text-1)',
                      fontSize: 12, fontFamily: 'var(--sans)', textAlign: 'left',
                    }}
                  >
                    {loc.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ width: 1, height: 18, background: 'var(--border-2)', flexShrink: 0 }} />

          {/* Type dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => { setTypeOpen(o => !o); setLocOpen(false); setStatusOpen(false) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 9px', borderRadius: 8,
                background: typeFilter !== 'all' ? 'var(--accent-soft)' : 'var(--surface)',
                border: `1px solid ${typeFilter !== 'all' ? 'var(--accent)' : 'var(--border-2)'}`,
                color: typeFilter !== 'all' ? 'var(--accent)' : 'var(--text-2)',
                fontSize: 11, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'var(--sans)', whiteSpace: 'nowrap',
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="10" height="10"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              {typeFilter === 'all' ? 'All alerts' : typeFilter.replace(/_/g, ' ')}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="8" height="8"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            {typeOpen && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 200,
                background: 'var(--surface)', border: '1px solid var(--border-2)',
                borderRadius: 10, boxShadow: 'var(--card-shadow-lg)', minWidth: 150,
                padding: 4,
              }}>
                {[
                  { id: 'all', label: 'All alerts', dot: undefined },
                  { id: 'price_drop', label: 'Price drops', dot: 'var(--danger)' },
                  { id: 'new_promo', label: 'New promos', dot: 'var(--warning)' },
                  { id: 'new_sku', label: 'New SKUs', dot: 'var(--accent)' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => { setTypeFilter(opt.id); setTypeOpen(false) }}
                    style={{
                      display: 'flex', width: '100%', alignItems: 'center', gap: 7,
                      padding: '7px 10px', borderRadius: 7, border: 'none', cursor: 'pointer',
                      background: typeFilter === opt.id ? 'var(--accent-soft)' : 'transparent',
                      color: typeFilter === opt.id ? 'var(--accent)' : 'var(--text-1)',
                      fontSize: 12, fontFamily: 'var(--sans)', textAlign: 'left',
                    }}
                  >
                    {opt.dot && <span style={{ width: 7, height: 7, borderRadius: '50%', background: opt.dot, flexShrink: 0 }} />}
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Status dropdown */}
          <div style={{ position: 'relative', marginLeft: 'auto' }}>
            <button
              onClick={() => { setStatusOpen(o => !o); setLocOpen(false); setTypeOpen(false) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 9px', borderRadius: 8,
                background: 'var(--surface)',
                border: '1px solid var(--border-2)',
                color: 'var(--text-2)',
                fontSize: 11, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'var(--sans)', whiteSpace: 'nowrap',
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: statusFilter === 'unreviewed' ? 'var(--accent)' : statusFilter === 'reviewed' ? 'var(--text-3)' : 'var(--border-2)', flexShrink: 0 }} />
              {statusFilter === 'unreviewed' ? 'Unreviewed' : statusFilter === 'reviewed' ? 'Reviewed' : 'All'}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="8" height="8"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            {statusOpen && (
              <div style={{
                position: 'absolute', top: '100%', right: 0, marginTop: 4, zIndex: 200,
                background: 'var(--surface)', border: '1px solid var(--border-2)',
                borderRadius: 10, boxShadow: 'var(--card-shadow-lg)', minWidth: 130,
                padding: 4,
              }}>
                {[
                  { id: 'unreviewed', label: 'Unreviewed', dot: 'var(--accent)' },
                  { id: 'reviewed', label: 'Reviewed', dot: 'var(--text-3)' },
                  { id: 'all', label: 'All', dot: 'var(--border-2)' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => { setStatusFilter(opt.id as any); setStatusOpen(false) }}
                    style={{
                      display: 'flex', width: '100%', alignItems: 'center', gap: 7,
                      padding: '7px 10px', borderRadius: 7, border: 'none', cursor: 'pointer',
                      background: statusFilter === opt.id ? 'var(--accent-soft)' : 'transparent',
                      color: statusFilter === opt.id ? 'var(--accent)' : 'var(--text-1)',
                      fontSize: 12, fontFamily: 'var(--sans)', textAlign: 'left',
                    }}
                  >
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: opt.dot, flexShrink: 0 }} />
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Alert list */}
        <div
          style={{ flex: 1, overflowY: 'auto', padding: '10px 10px 16px', minHeight: 0 }}
          onClick={() => { setLocOpen(false); setTypeOpen(false); setStatusOpen(false) }}
        >
          {loading ? (
            <div style={{ padding: '24px 8px', color: 'var(--text-3)', fontSize: 12, textAlign: 'center' }}>
              Pulling latest intelligence from {locations.length || 0} markets…
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--mono)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                {statusFilter === 'unreviewed' ? 'All clear' : 'No alerts found'}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-3)', lineHeight: 1.6 }}>
                {statusFilter === 'unreviewed'
                  ? `All clear across ${locations.length || 0} markets. Last checked ${lastScan}.`
                  : 'Try adjusting your filters.'}
              </div>
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const sev = getSeverity(alert)
              const iconColor = getIconColor(sev, alert.alert_type)
              const isExpanded = expandedId === alert.id
              const chips = getAlertChips(alert)

              return (
                <div
                  key={alert.id}
                  onClick={() => setExpandedId(isExpanded ? null : alert.id)}
                  data-sev={sev}
                  style={{
                    background: alert.reviewed ? 'transparent' : isExpanded ? 'var(--surface-2)' : 'var(--surface)',
                    border: `1px solid ${sev === 'critical' && !alert.reviewed ? 'rgba(196,59,78,0.25)' : 'var(--border)'}`,
                    borderRadius: 14,
                    padding: sev === 'critical' && !alert.reviewed ? '16px' : '12px 14px',
                    marginBottom: 8,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: sev === 'critical' && !alert.reviewed
                      ? '0 2px 8px rgba(196,59,78,0.08), 0 20px 48px -20px rgba(196,59,78,0.22)'
                      : 'none',
                    opacity: alert.reviewed ? 0.72 : 1,
                  }}
                >
                  {/* Alert row */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    {/* Icon */}
                    <div style={{
                      width: sev === 'critical' && !alert.reviewed ? 36 : 28,
                      height: sev === 'critical' && !alert.reviewed ? 36 : 28,
                      borderRadius: 8,
                      background: iconColor + '22',
                      border: `1px solid ${iconColor}44`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: iconColor, flexShrink: 0,
                      transition: 'all 0.2s',
                    }}>
                      <AlertIcon type={alert.alert_type} />
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Title row */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 3 }}>
                        <div style={{
                          fontSize: sev === 'critical' && !alert.reviewed ? 14 : 12.5,
                          fontWeight: alert.reviewed ? 500 : 700,
                          color: 'var(--text-1)',
                          lineHeight: 1.3,
                          letterSpacing: '-0.01em',
                        }}>
                          {getAlertTitle(alert)}
                        </div>
                        <span style={{
                          fontFamily: 'var(--mono)', fontSize: 9.5,
                          color: 'var(--text-3)', whiteSpace: 'nowrap', flexShrink: 0,
                        }}>
                          {timeAgo(alert.created_at)}
                        </span>
                      </div>

                      {/* Sub */}
                      <div style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 6, lineHeight: 1.4 }}>
                        {getAlertSub(alert)}
                      </div>

                      {/* Chips + sparkline */}
                      {sev !== 'info' && !alert.reviewed && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          {chips.map((chip, i) => (
                            <span key={i} style={{
                              fontSize: 9.5, fontWeight: 600, fontFamily: 'var(--mono)',
                              padding: '2px 7px', borderRadius: 5,
                              background: chip.bg, color: chip.color,
                              letterSpacing: '0.04em', whiteSpace: 'nowrap',
                            }}>
                              {chip.label}
                            </span>
                          ))}
                          <span style={{ marginLeft: 'auto' }}>
                            <Sparkline color={iconColor} />
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Inline expansion */}
                  {isExpanded && (
                    <div style={{
                      marginTop: 12, paddingTop: 12,
                      borderTop: '1px solid var(--border)',
                    }}>
                      {/* Severity badge */}
                      <span style={{
                        fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 600,
                        letterSpacing: '0.16em', textTransform: 'uppercase' as const,
                        padding: '3px 10px', borderRadius: 100, display: 'inline-block',
                        marginBottom: 10, ...getSevClass(sev),
                      }}>
                        {getSevLabel(sev)}
                      </span>

                      {/* Stats grid */}
                      <div style={{
                        display: 'grid', gridTemplateColumns: '1fr 1fr',
                        gap: 8, marginBottom: 12,
                      }}>
                        {alert.old_value && alert.new_value && (
                          <>
                            <div style={{ background: 'var(--stat-bg)', border: '1px solid var(--stat-border)', borderRadius: 12, padding: '12px 12px 10px' }}>
                              <div style={{ fontFamily: 'var(--display)', fontSize: 26, fontStyle: 'italic', color: 'var(--danger)', lineHeight: 1 }}>
                                −${(parseFloat(alert.old_value) - parseFloat(alert.new_value)).toFixed(0)}
                              </div>
                              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginTop: 4 }}>Price cut</div>
                            </div>
                            <div style={{ background: 'var(--stat-bg)', border: '1px solid var(--stat-border)', borderRadius: 12, padding: '12px 12px 10px' }}>
                              <div style={{ fontFamily: 'var(--display)', fontSize: 26, fontStyle: 'italic', color: 'var(--danger)', lineHeight: 1 }}>
                                −{Math.round((parseFloat(alert.old_value) - parseFloat(alert.new_value)) / parseFloat(alert.old_value) * 100)}%
                              </div>
                              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginTop: 4 }}>% change</div>
                            </div>
                          </>
                        )}
                        <div style={{ background: 'var(--stat-bg)', border: '1px solid var(--stat-border)', borderRadius: 12, padding: '12px 12px 10px' }}>
                          <div style={{ fontFamily: 'var(--display)', fontSize: 26, fontStyle: 'italic', color: 'var(--warm)', lineHeight: 1 }}>
                            {timeAgo(alert.created_at)}
                          </div>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginTop: 4 }}>Detected</div>
                        </div>
                        <div style={{ background: 'var(--stat-bg)', border: '1px solid var(--stat-border)', borderRadius: 12, padding: '12px 12px 10px' }}>
                          <div style={{ fontFamily: 'var(--display)', fontSize: 26, fontStyle: 'italic', color: 'var(--text-1)', lineHeight: 1 }}>
                            {alert.confidence === 'high' ? '↑↑' : '↑'}
                          </div>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginTop: 4 }}>Confidence</div>
                        </div>
                      </div>

                      {/* Recommendation */}
                      <div style={{
                        padding: '9px 12px 10px 13px',
                        background: 'var(--accent-soft)',
                        border: '1px solid rgba(11,184,184,0.20)',
                        borderLeft: '3px solid var(--accent)',
                        borderRadius: 8, marginBottom: 12,
                      }}>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: 'var(--accent)', marginBottom: 5 }}>Recommendation</div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-1)', lineHeight: 1.55 }}>
                          {alert.alert_type === 'price_drop'
                            ? `Review your pricing for the impacted products. A ${Math.round((parseFloat(alert.old_value || '0') - parseFloat(alert.new_value || '0')) / parseFloat(alert.old_value || '1') * 100)}% gap may affect your volume within 48 hours.`
                            : `Review ${alert.competitor_name}'s latest activity and decide if a response is needed.`}
                        </div>
                      </div>

                      {/* Footer actions */}
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                        <button
                          onClick={(e) => handleMarkReviewed(alert.id, e)}
                          style={{
                            flex: 1, padding: '8px 10px', borderRadius: 8,
                            border: '1px solid var(--border-2)',
                            background: 'var(--surface-3)', color: 'var(--text-2)',
                            fontSize: 11, fontWeight: 600, cursor: 'pointer',
                            fontFamily: 'var(--sans)',
                          }}
                        >
                          Mark reviewed
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate('/prices') }}
                          style={{
                            flex: 1, padding: '8px 10px', borderRadius: 8,
                            border: 'none',
                            background: 'var(--accent)', color: 'var(--cta-fg-on-pos)',
                            fontSize: 11, fontWeight: 600, cursor: 'pointer',
                            fontFamily: 'var(--sans)',
                            boxShadow: 'var(--cta-shadow)',
                          }}
                        >
                          View price matrix →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* ── Map Area ────────────────────────────────────────────────────── */}
      <div ref={mapContainerRef} style={{
        flex: 1, width: '100%', position: 'relative', overflow: 'hidden', minHeight: 0,
        background: 'var(--bg)',
      }}>
        {/* Real Mapbox map */}
        {MAPBOX_TOKEN && (
          <Map
            key={MAP_STYLES[mapStyleId][appTheme]}
            ref={mapRef}
            mapboxAccessToken={MAPBOX_TOKEN}
            initialViewState={mapCenter}
            mapStyle={MAP_STYLES[mapStyleId][appTheme]}
            style={{ width: '100%', height: '100%' }}
            attributionControl={false}
            onLoad={handleMapLoad}
          >
            <NavigationControl position="top-right" showCompass={false} />
            {/* Competitor pins */}
            {competitors.filter(c => c.lat && c.lng).map(c => (
              <Marker key={c.competitor_id} longitude={Number(c.lng)} latitude={Number(c.lat)} anchor="center">
                <div style={{
                  width: 12, height: 12, borderRadius: '50%',
                  background: c.slot_type === 'block' ? 'var(--accent-block)' : 'var(--accent-intel)',
                  border: '2px solid rgba(255,255,255,0.85)',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.45)',
                  cursor: 'pointer',
                }} title={c.name} />
              </Marker>
            ))}
            {/* Your location marker */}
            {firstLocation?.lat && firstLocation?.lng && (
              <Marker
                longitude={Number(firstLocation.lng)}
                latitude={Number(firstLocation.lat)}
                anchor="bottom"
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{
                    width: 14, height: 14, borderRadius: '50%',
                    background: 'var(--accent)',
                    boxShadow: '0 0 0 4px rgba(29,158,117,0.3), 0 0 0 8px rgba(29,158,117,0.15)',
                  }} />
                  <div style={{
                    fontFamily: 'var(--mono)', fontSize: 8, fontWeight: 700,
                    color: 'var(--accent)', letterSpacing: '0.12em',
                    whiteSpace: 'nowrap',
                    background: 'rgba(13,15,17,0.85)', backdropFilter: 'blur(8px)',
                    padding: '2px 6px', borderRadius: 4,
                    border: '1px solid rgba(29,158,117,0.4)',
                  }}>YOUR LOCATION</div>
                </div>
              </Marker>
            )}
          </Map>
        )}

        {/* Streets / Satellite toggle */}
        <div style={{ position: 'absolute', bottom: 16, right: 16, zIndex: 10, display: 'flex', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
          {(['streets', 'satellite'] as MapStyleId[]).map((id) => (
            <button key={id} onClick={() => setMapStyleId(id)} style={{
              padding: '5px 11px', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)',
              border: 'none', borderRight: id === 'streets' ? '1px solid var(--border)' : 'none',
              background: mapStyleId === id ? 'var(--accent-intel)' : 'transparent',
              color: mapStyleId === id ? '#fff' : 'var(--text-2)',
              transition: 'background 0.12s, color 0.12s',
            }}>
              {id === 'streets' ? '🗺 Streets' : '🛰 Satellite'}
            </button>
          ))}
        </div>

        {/* Map topbar */}
        <div style={{
          position: 'absolute', top: 14, left: 14, zIndex: 20,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          {/* Location pill */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: 'var(--surface)', backdropFilter: 'blur(20px)',
            border: '1px solid var(--border-2)', borderRadius: 20,
            padding: '7px 13px',
            boxShadow: 'var(--card-shadow)',
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--positive)', flexShrink: 0, boxShadow: '0 0 0 3px rgba(7,117,117,0.2)' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)', whiteSpace: 'nowrap' }}>
              {locations.length > 0 ? locations[0].name : 'West Hollywood Flagship'}
            </span>
          </div>
          {/* Stat pills */}
          {[
            { dot: 'var(--danger)', label: `${unreviewedCount} alerts` },
            { dot: 'var(--accent)', label: `${alerts.length} tracked` },
            { dot: 'var(--rose)', label: `${blocks.length} blocked` },
          ].map((s, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'var(--surface)', backdropFilter: 'blur(20px)',
              border: '1px solid var(--border)', borderRadius: 20,
              padding: '5px 11px',
              boxShadow: 'var(--card-shadow)',
              fontSize: 11, fontWeight: 600, color: 'var(--text-2)',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
              {s.label}
            </div>
          ))}
        </div>

        {/* Freshness pill */}
        <div style={{
          position: 'absolute', top: 14, right: 14, zIndex: 20,
          display: 'flex', alignItems: 'center', gap: 7,
          background: 'var(--surface)', backdropFilter: 'blur(20px)',
          border: '1px solid var(--border-2)', borderRadius: 20,
          padding: '6px 12px',
          boxShadow: 'var(--card-shadow)',
          fontSize: 10.5, color: 'var(--text-3)',
          fontFamily: 'var(--mono)',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--positive)', flexShrink: 0 }} />
          <span style={{ color: 'var(--text-3)' }}>Last scan</span>
          <span style={{ color: 'var(--text-1)', fontWeight: 600 }}>{lastScan}</span>
          <span style={{ color: 'var(--border-2)' }}>·</span>
          <span style={{ color: 'var(--text-3)' }}>Next</span>
          <span style={{ color: 'var(--text-1)', fontWeight: 600 }}>{nextScan}</span>
        </div>

        {/* Map legend */}
        <div style={{
          position: 'absolute', bottom: 24, left: 14, zIndex: 20,
          background: 'var(--surface)', backdropFilter: 'blur(16px)',
          border: '1px solid var(--border)', borderRadius: 12,
          padding: '10px 14px',
          boxShadow: 'var(--card-shadow)',
          display: 'flex', flexDirection: 'column', gap: 5,
        }}>
          {[
            { color: 'var(--danger)', label: 'Critical alert' },
            { color: 'var(--warning)', label: 'High alert' },
            { color: 'var(--accent)', label: 'Tracking / active' },
            { color: 'var(--rose)', label: 'Blocked' },
            { color: 'var(--warm)', label: 'Blocking you' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 10.5, color: 'var(--text-2)', whiteSpace: 'nowrap' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
              {item.label}
            </div>
          ))}
        </div>

        {/* Navigate to full price intelligence */}
        <button
          onClick={() => navigate('/prices')}
          style={{
            position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
            zIndex: 20,
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '10px 18px', borderRadius: 20,
            background: 'var(--accent)', color: 'var(--cta-fg-on-pos)',
            border: 'none', fontSize: 12, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'var(--sans)',
            boxShadow: 'var(--cta-shadow)',
            letterSpacing: '-0.01em',
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          Open Price Intelligence
        </button>
      </div>

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
          animation: 'none',
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: toast.color, flexShrink: 0 }} />
          {toast.msg}
        </div>
      )}
    </div>
  )
}
