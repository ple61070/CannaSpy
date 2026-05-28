import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Map, { Source, Layer, Marker, NavigationControl, Popup, type MapRef, type MapLayerMouseEvent } from 'react-map-gl'
import type { LayerProps } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useAuthFetch } from '../lib/useAuthFetch'
import { OperatorTypeFilter, type OperatorType } from '../components/filters/OperatorTypeFilter'
import { useDispensaryMap } from '../hooks/useDispensaryMap'
import type { DispensaryFeatureProps } from '../components/map/types'
import {
  dispensaryRingLayer,
  dispensaryClusterLayer,
  dispensaryClusterCountLayer,
  dispensaryPointLayer,
} from '../components/map/layers'

const API = import.meta.env.VITE_API_URL ?? ''
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN ?? ''

function StepBar({ active }: { active: number }) {
  const steps = [
    { n: '01', label: 'Org Setup', sub: 'Complete' },
    { n: '02', label: 'Add Locations', sub: 'Complete' },
    { n: '03', label: 'Find Rivals', sub: 'Track & block' },
  ]
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '14px 28px', display: 'flex', alignItems: 'center', boxShadow: 'var(--card-shadow)', flexShrink: 0 }}>
      {steps.map((s, i) => {
        const isDone = i < active
        const isActive = i === active
        return (
          <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, position: 'relative' }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 500, flexShrink: 0, background: isDone ? 'var(--accent)' : isActive ? 'var(--accent)' : 'var(--surface-3)', color: isDone || isActive ? '#fff' : 'var(--text-3)', boxShadow: isActive ? '0 0 0 4px rgba(9,161,161,0.15)' : isDone ? '0 0 0 3px rgba(9,161,161,0.10)' : 'none' }}>
              {isDone ? <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" style={{ width: 13, height: 13 }}><polyline points="20 6 9 17 4 12" /></svg> : s.n}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: isActive || isDone ? 'var(--text-1)' : 'var(--text-3)', whiteSpace: 'nowrap' as const }}>{s.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap' as const }}>{s.sub}</div>
            </div>
            {i < steps.length - 1 && <div style={{ position: 'absolute', left: 145, width: 'calc(100% - 150px)', height: 2, background: isDone ? 'var(--accent)' : 'var(--border-2)', top: '50%', transform: 'translateY(-50%)' }} />}
          </div>
        )
      })}
    </div>
  )
}

type SortMode = 'distance' | 'name' | 'status'
type MapStyleId = 'streets' | 'satellite'
type AppTheme = 'light' | 'dark'
const MAP_STYLES: Record<MapStyleId, Record<AppTheme, string>> = {
  streets:   { light: 'mapbox://styles/mapbox/streets-v12', dark: 'mapbox://styles/mapbox/dark-v11' },
  satellite: { light: 'mapbox://styles/mapbox/satellite-streets-v12', dark: 'mapbox://styles/mapbox/satellite-streets-v12' },
}
function useAppTheme(): AppTheme {
  const [theme, setTheme] = useState<AppTheme>(() => (localStorage.getItem('cs-theme') as AppTheme) || 'light')
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

// California initial view
const CA_VIEWPORT = { longitude: -119.4179, latitude: 36.7783, zoom: 5.5 }

// Stable empty FeatureCollection — passed as initial Source data so the Source
// component never re-renders when live data arrives (updates go via setData() instead)
const EMPTY_FC = { type: 'FeatureCollection' as const, features: [] as never[] }

interface Location {
  id: string
  name: string
  address?: string
  lat?: number | null
  lng?: number | null
}

interface Competitor {
  id?: string
  google_place_id: string
  name: string
  address: string
  distance_miles?: number
  platform?: string
  lat?: number | null
  lng?: number | null
}

interface Selection {
  competitor: Competitor
  track: boolean
  block: boolean
}

// Build a GeoJSON circle polygon (approximate) for the radius ring
function makeCircleGeoJSON(lat: number, lng: number, radiusMiles: number) {
  const radiusKm = radiusMiles * 1.60934
  const points = 64
  const coords: [number, number][] = []
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * 2 * Math.PI
    const dx = (radiusKm / 111.32) * Math.cos(angle)
    const dy = (radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180))) * Math.sin(angle)
    coords.push([lng + dy, lat + dx])
  }
  coords.push(coords[0])
  return {
    type: 'FeatureCollection' as const,
    features: [{
      type: 'Feature' as const,
      geometry: { type: 'Polygon' as const, coordinates: [coords] },
      properties: {},
    }],
  }
}

const radiusFillLayer: LayerProps = {
  id: 'radius-fill',
  type: 'fill',
  paint: { 'fill-color': '#1d9e75', 'fill-opacity': 0.05 },
}

const radiusOutlineLayer: LayerProps = {
  id: 'radius-outline',
  type: 'line',
  paint: { 'line-color': '#1d9e75', 'line-width': 1.5, 'line-opacity': 0.4, 'line-dasharray': [4, 3] },
}

export default function CompetitorDiscovery() {
  const authFetch = useAuthFetch()
  const navigate = useNavigate()
  const mapRef          = useRef<MapRef | null>(null)
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapReadyRef     = useRef(false)
  const pendingFlyRef   = useRef<[number, number] | null>(null)
  const appTheme        = useAppTheme()
  const [mapStyleId, setMapStyleId] = useState<MapStyleId>('streets')

  const [locations, setLocations] = useState<Location[]>([])
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [selections, setSelections] = useState<globalThis.Map<string, Selection>>(new globalThis.Map())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [scanned, setScanned] = useState(false)
  const [mapMoved, setMapMoved] = useState(false)
  const [operatorType, setOperatorType] = useState<OperatorType>('both')
  const [sortMode, setSortMode] = useState<SortMode>('distance')
  const [bbox, setBbox] = useState<string | null>(null)
  const [radius, setRadius] = useState(5)
  const [dispPopup, setDispPopup] = useState<{ lng: number; lat: number; props: DispensaryFeatureProps } | null>(null)

  const { data: dispensaries } = useDispensaryMap(bbox, {
    type: operatorType === 'both' ? undefined : operatorType,
  })

  // Keep a ref to latest dispensaries so handleMapLoad can seed after remount
  const dispensariesRef = useRef(dispensaries)
  useEffect(() => { dispensariesRef.current = dispensaries }, [dispensaries])

  // Imperative source update — bypasses React reconciliation, eliminates freeze
  useEffect(() => {
    const src = mapRef.current?.getMap()?.getSource('cs-dispensaries') as any
    if (src?.setData) src.setData(dispensaries)
  }, [dispensaries])

  useEffect(() => {
    authFetch(`${API}/api/v1/locations`)
      .then((r) => r.json())
      .then((data) => {
        setLocations(data.locations || [])
        if (data.locations?.length > 0) setSelectedLocation(data.locations[0])
      })
      .catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Keep Mapbox canvas in sync with container size (sidebar expand/collapse)
  useEffect(() => {
    const el = mapContainerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => { mapRef.current?.getMap()?.resize() })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // flyTo — defers if map not yet ready
  const flyToLocation = useCallback((loc: Location) => {
    if (!loc?.lat || !loc?.lng) return
    const center: [number, number] = [Number(loc.lng), Number(loc.lat)]
    if (mapReadyRef.current) {
      mapRef.current?.flyTo({ center, zoom: 12, duration: 1000 })
    } else {
      pendingFlyRef.current = center
    }
  }, [])

  useEffect(() => {
    if (selectedLocation) flyToLocation(selectedLocation)
  }, [selectedLocation, flyToLocation])

  const handleMapLoad = useCallback(() => {
    mapReadyRef.current = true
    const map = mapRef.current?.getMap()
    if (map) {
      const b = map.getBounds()
      if (b) setBbox(`${b.getWest()},${b.getSouth()},${b.getEast()},${b.getNorth()}`)
      // Re-seed source after mount/remount (style switch, theme change)
      const src = map.getSource('cs-dispensaries') as any
      if (src?.setData) src.setData(dispensariesRef.current)
    }
    if (pendingFlyRef.current) {
      mapRef.current?.flyTo({ center: pendingFlyRef.current, zoom: 12, duration: 800 })
      pendingFlyRef.current = null
    }
  }, [])

  const handleMoveEnd = useCallback(() => {
    const map = mapRef.current?.getMap()
    if (!map) return
    const b = map.getBounds()
    if (b) setBbox(`${b.getWest()},${b.getSouth()},${b.getEast()},${b.getNorth()}`)
    setMapMoved(true)
  }, [])

  const handleMapClick = useCallback((e: MapLayerMouseEvent) => {
    const f = e.features?.[0]
    if (!f) return
    const map = mapRef.current?.getMap()
    if (!map) return

    if (f.layer?.id === 'cs-dispensary-cluster') {
      const clusterId = (f.properties as { cluster_id: number }).cluster_id
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const source = map.getSource('cs-dispensaries') as any
      source.getClusterExpansionZoom(clusterId, (err: Error | null, zoom: number | null) => {
        if (err) return
        const coords = (f.geometry as { type: 'Point'; coordinates: [number, number] }).coordinates
        map.easeTo({ center: coords, zoom: zoom ?? 10, duration: 400 })
      })
      setDispPopup(null)
      return
    }

    if (f.layer?.id === 'cs-dispensary-point') {
      const coords = (f.geometry as { type: 'Point'; coordinates: [number, number] }).coordinates
      setDispPopup({ lng: coords[0], lat: coords[1], props: f.properties as DispensaryFeatureProps })
    }
  }, [])

  const handleDiscover = async () => {
    if (!selectedLocation?.id) return
    setLoading(true)
    setMapMoved(false)
    setSelections(new globalThis.Map())
    try {
      const res = await authFetch(`${API}/api/v1/locations/${selectedLocation.id}/discover?radius=${radius}`)
      const data = await res.json()
      setCompetitors(data.data?.competitors || [])
    } catch {
      setCompetitors([])
    } finally {
      setLoading(false)
      setScanned(true)
    }
  }

  const setSelection = useCallback((comp: Competitor, field: 'track' | 'block', value: boolean) => {
    const key = comp.id || comp.google_place_id
    setSelections((prev) => {
      const next = new globalThis.Map(prev)
      const existing = next.get(key)
      const updated: Selection = { competitor: comp, track: false, block: false, ...existing, [field]: value }
      if (!updated.track && !updated.block) next.delete(key)
      else next.set(key, updated)
      return next
    })
  }, [])

  // Track or Block a dispensary directly from its map popup
  const handlePopupSelect = useCallback((field: 'track' | 'block') => {
    if (!dispPopup) return
    const { props, lat, lng } = dispPopup
    const comp: Competitor = {
      google_place_id: props.dcc_license,
      name: props.name,
      address: `${props.city}${props.county ? `, ${props.county} Co.` : ''}, CA`,
      platform: 'dcc',
      lat,
      lng,
      ...(props.business_type ? { business_type: props.business_type } as Record<string, unknown> : {}),
      ...(props.dcc_license ? { dcc_license: props.dcc_license } as Record<string, unknown> : {}),
    }
    setCompetitors(prev =>
      prev.some(c => c.google_place_id === props.dcc_license) ? prev : [...prev, comp]
    )
    setSelections(prev => {
      const key = comp.google_place_id
      const next = new globalThis.Map(prev)
      const existing = next.get(key)
      const updated: Selection = { competitor: comp, track: false, block: false, ...existing, [field]: !(existing?.[field]) }
      if (!updated.track && !updated.block) next.delete(key)
      else next.set(key, updated)
      return next
    })
  }, [dispPopup])

  const handleLaunch = async () => {
    if (!selections.size) { navigate('/command-center'); return }
    setSaving(true)
    try {
      for (const [, sel] of selections) {
        let competitorId = sel.competitor.id
        if (!competitorId) {
          const compRes = await authFetch(`${API}/api/v1/competitors`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: sel.competitor.name,
              address: sel.competitor.address,
              google_place_id: sel.competitor.google_place_id,
              platform: sel.competitor.platform || 'unknown',
              lat: sel.competitor.lat ?? undefined,
              lng: sel.competitor.lng ?? undefined,
              dcc_license: (sel.competitor as any).dcc_license ?? undefined,
              business_type: (sel.competitor as any).business_type ?? undefined,
            }),
          })
          const compData = await compRes.json()
          competitorId = compData.data?.id || compData.id
        }
        if (!competitorId) continue
        if (sel.track) {
          await authFetch(`${API}/api/v1/locations/${selectedLocation!.id}/competitors`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ competitor_id: competitorId, slot_type: 'track' }),
          })
        }
        if (sel.block) {
          await authFetch(`${API}/api/v1/locations/${selectedLocation!.id}/competitors`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ competitor_id: competitorId, slot_type: 'block' }),
          })
        }
      }
      navigate('/command-center')
    } finally {
      setSaving(false)
    }
  }

  const trackCount = [...selections.values()].filter((s) => s.track).length
  const blockCount = [...selections.values()].filter((s) => s.block).length
  const estimatedCost = (trackCount + blockCount) * 100

  const centerLat = selectedLocation?.lat ? Number(selectedLocation.lat) : null
  const centerLng = selectedLocation?.lng ? Number(selectedLocation.lng) : null
  const radiusGeoJSON = centerLat && centerLng ? makeCircleGeoJSON(centerLat, centerLng, radius) : null

  // Filter competitor list by operator type; microbusiness operators do both storefront + delivery
  const filteredCompetitors = operatorType === 'both'
    ? competitors
    : competitors.filter(c => {
        const bt = (c as any).business_type
        if (!bt) return true
        if (operatorType === 'storefront') return bt === 'storefront' || bt === 'both'
        if (operatorType === 'delivery') return bt === 'delivery' || bt === 'both'
        return true
      })

  // Sidebar items derived from live DCC dispensary GeoJSON within radius — no scan required
  const sidebarItems = useMemo(() => {
    if (!dispensaries?.features?.length || !centerLat || !centerLng) return []
    const R = 6371
    return dispensaries.features
      .filter(f => {
        if (!f.geometry || (f.geometry as any).type !== 'Point') return false
        const [lng, lat] = (f.geometry as any).coordinates as [number, number]
        const dLat = (lat - centerLat) * Math.PI / 180
        const dLng = (lng - centerLng) * Math.PI / 180
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(centerLat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2
        const distMiles = (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))) / 1.60934
        return distMiles > 0.01 && distMiles <= radius
      })
      .filter(f => {
        const bt = (f.properties as any)?.business_type
        if (operatorType === 'storefront') return bt === 'storefront' || bt === 'both' || !bt
        if (operatorType === 'delivery') return bt === 'delivery' || bt === 'both'
        return true
      })
      .map(f => {
        const p = f.properties as DispensaryFeatureProps
        const [lng, lat] = (f.geometry as any).coordinates as [number, number]
        const dLat = (lat - centerLat) * Math.PI / 180
        const dLng = (lng - centerLng) * Math.PI / 180
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(centerLat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2
        const distMiles = (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))) / 1.60934
        return {
          google_place_id: p.dcc_license ?? `dcc-${p.name}-${lat.toFixed(4)}-${lng.toFixed(4)}`,
          name: p.name,
          address: `${p.city ?? ''}${p.county ? `, ${p.county} Co.` : ''}, CA`,
          distance_miles: Math.round(distMiles * 10) / 10,
          platform: 'dcc' as const,
          lat,
          lng,
          business_type: p.business_type,
          dcc_license: p.dcc_license,
        } as Competitor & { business_type?: string; dcc_license?: string }
      })
      .reduce((acc, item) => {
        const dedupKey = (item as any).dcc_license || item.name
        if (!acc.seen.has(dedupKey)) {
          acc.seen.add(dedupKey)
          acc.items.push(item)
        }
        return acc
      }, { seen: new Set<string>(), items: [] as (Competitor & { business_type?: string; dcc_license?: string })[] })
      .items
      .sort((a, b) => (a.distance_miles ?? 999) - (b.distance_miles ?? 999))
      .slice(0, 150)
  }, [dispensaries, centerLat, centerLng, radius, operatorType])

  // Selected items always float to top; within each group sort by sortMode
  const sortedSidebarItems = useMemo(() => {
    return [...sidebarItems].sort((a, b) => {
      const aKey = a.id || a.google_place_id
      const bKey = b.id || b.google_place_id
      const aSel = selections.get(aKey)
      const bSel = selections.get(bKey)
      const aActive = !!(aSel?.track || aSel?.block)
      const bActive = !!(bSel?.track || bSel?.block)
      if (aActive !== bActive) return aActive ? -1 : 1
      if (sortMode === 'name') return a.name.localeCompare(b.name)
      if (sortMode === 'status') {
        const aScore = aSel?.block ? 2 : aSel?.track ? 1 : 0
        const bScore = bSel?.block ? 2 : bSel?.track ? 1 : 0
        if (aScore !== bScore) return bScore - aScore
      }
      return (a.distance_miles ?? 999) - (b.distance_miles ?? 999)
    })
  }, [sidebarItems, selections, sortMode])

  // Popup live state — must match the key used in handlePopupSelect (props.dcc_license)
  const popupKey = dispPopup?.props.dcc_license ?? null
  const popupSel = popupKey ? selections.get(popupKey) : undefined
  const popupTracked = popupSel?.track ?? false
  const popupBlocked = popupSel?.block ?? false

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)', fontFamily: 'var(--sans)' }}>
      {/* Topbar */}
      <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, background: 'var(--surface)' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>Find your rivals</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.08em', marginTop: 2 }}>SCREEN 03 · RIVAL DISCOVERY · STEP 3 OF 3</div>
        </div>
      </div>

      {/* Step bar */}
      <div style={{ padding: '10px 20px 0', flexShrink: 0 }}>
        <StepBar active={2} />
      </div>

    <div style={{ display: 'flex', flex: 1, minHeight: 0, padding: '0 20px 16px' }}>

      {/* ── Map panel ── */}
      <div ref={mapContainerRef} style={{
        flex: '0 0 68%',
        position: 'relative',
        borderRadius: '8px 0 0 8px',
        overflow: 'hidden',
        border: '1px solid var(--border)',
        borderRight: 'none',
      }}>
        {MAPBOX_TOKEN && (
          <Map
            key={MAP_STYLES[mapStyleId][appTheme]}
            ref={mapRef}
            mapboxAccessToken={MAPBOX_TOKEN}
            initialViewState={CA_VIEWPORT}
            mapStyle={MAP_STYLES[mapStyleId][appTheme]}
            style={{ width: '100%', height: '100%' }}
            attributionControl={true}
            interactiveLayerIds={['cs-dispensary-cluster', 'cs-dispensary-point']}
            onLoad={handleMapLoad}
            onMoveEnd={handleMoveEnd}
            onClick={handleMapClick}
          >
            <NavigationControl position="top-right" showCompass={false} />

            {/* DCC dispensary pins — background context */}
            <Source
              id="cs-dispensaries"
              type="geojson"
              data={EMPTY_FC as unknown as Parameters<typeof Source>[0]['data']}
              promoteId="id"
              cluster clusterMaxZoom={13} clusterRadius={35}
            >
              <Layer {...dispensaryRingLayer} />
              <Layer {...dispensaryPointLayer} />
              <Layer {...dispensaryClusterLayer} />
              <Layer {...dispensaryClusterCountLayer} />
            </Source>

            {/* Redo search overlay — appears after map pan when a scan has been run */}
            {mapMoved && scanned && (
              <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
                <button
                  onClick={() => handleDiscover()}
                  style={{
                    padding: '7px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                    background: 'var(--surface)', border: '1.5px solid var(--border)',
                    color: 'var(--text-1)', cursor: 'pointer', fontFamily: 'var(--sans)',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.2)', whiteSpace: 'nowrap',
                  }}
                >
                  Redo search in this area
                </button>
              </div>
            )}

            {/* Radius ring around selected location */}
            {radiusGeoJSON && (
              <Source id="radius" type="geojson" data={radiusGeoJSON}>
                <Layer {...radiusFillLayer} />
                <Layer {...radiusOutlineLayer} />
              </Source>
            )}

            {/* Your location marker — 5-layer concentric rings with pulse */}
            {centerLat && centerLng && (
              <Marker longitude={centerLng} latitude={centerLat} anchor="center">
                <style>{`@keyframes cs-ping{0%{transform:scale(1);opacity:.7}100%{transform:scale(2.3);opacity:0}}`}</style>
                <div style={{ position: 'relative', width: 48, height: 48 }} title={selectedLocation?.name}>
                  {/* L1: Animated pulse ring */}
                  <div style={{
                    position: 'absolute', inset: 0, borderRadius: '50%',
                    border: '2px solid rgba(139,92,246,0.5)',
                    animation: 'cs-ping 2.5s ease-out infinite',
                  }} />
                  {/* L2: Static outer ring */}
                  <div style={{
                    position: 'absolute', inset: 4, borderRadius: '50%',
                    border: '1.5px solid rgba(139,92,246,0.35)',
                  }} />
                  {/* L3: Mid ring with subtle fill */}
                  <div style={{
                    position: 'absolute', inset: 10, borderRadius: '50%',
                    border: '1.5px solid rgba(139,92,246,0.55)',
                    background: 'rgba(139,92,246,0.08)',
                  }} />
                  {/* L4: Purple fill */}
                  <div style={{
                    position: 'absolute', inset: 16, borderRadius: '50%',
                    background: '#8b5cf6',
                    boxShadow: '0 0 12px rgba(139,92,246,0.7)',
                  }} />
                  {/* L5: White center dot */}
                  <div style={{
                    position: 'absolute',
                    top: '50%', left: '50%',
                    transform: 'translate(-50%,-50%)',
                    width: 8, height: 8,
                    borderRadius: '50%',
                    background: '#ffffff',
                  }} />
                </div>
              </Marker>
            )}

            {/* Competitor markers */}
            {competitors.map((comp) => {
              if (!comp.lat || !comp.lng) return null
              const key = comp.id || comp.google_place_id
              const sel = selections.get(key)
              const isDelivery = (comp as any).business_type === 'delivery' || (comp as any).business_type === 'both'
              const outerColor = isDelivery ? '#3b8bd4' : '#1d9e75'
              const innerColor = sel?.track && sel?.block ? '#fde047' : sel?.block ? '#67e8f9' : sel?.track ? '#fb923c' : null
              const isAnySelected = !!(sel?.track || sel?.block)
              const size = isAnySelected ? 20 : 12
              return (
                <Marker
                  key={key}
                  longitude={Number(comp.lng)}
                  latitude={Number(comp.lat)}
                  anchor="center"
                  onClick={() => setSelection(comp, 'track', !(sel?.track))}
                >
                  <div style={{ position: 'relative', width: size, height: size, cursor: 'pointer' }}>
                    {/* Outer circle */}
                    <div style={{
                      position: 'absolute', inset: 0,
                      borderRadius: '50%',
                      background: outerColor,
                      border: '1.5px solid #0d0f11',
                      opacity: isAnySelected ? 1 : 0.5,
                      transition: 'all 0.15s',
                      boxShadow: isAnySelected ? `0 0 8px ${outerColor}8c` : 'none',
                    }} />
                    {/* Inner dot — only when selected */}
                    {innerColor && (
                      <div style={{
                        position: 'absolute',
                        top: '50%', left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 10, height: 10,
                        borderRadius: '50%',
                        background: innerColor,
                        pointerEvents: 'none',
                      }} />
                    )}
                  </div>
                </Marker>
              )
            })}

            {/* Dispensary info popup on pin click */}
            {dispPopup && (
              <Popup
                longitude={dispPopup.lng}
                latitude={dispPopup.lat}
                closeButton
                closeOnClick={false}
                onClose={() => setDispPopup(null)}
                anchor="bottom"
                offset={[0, -10] as [number, number]}
              >
                <div style={{ minWidth: 210, fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--text-1)', background: 'var(--surface)', padding: '10px 12px' }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 3 }}>{dispPopup.props.name}</div>
                  <div style={{ color: 'var(--text-3)', fontSize: 11, marginBottom: 8 }}>{dispPopup.props.city}{dispPopup.props.county ? `, ${dispPopup.props.county} Co.` : ''}</div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' as const, marginBottom: 6 }}>
                    {dispPopup.props.business_type && (
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 3, background: 'var(--surface-3)', color: 'var(--text-2)', textTransform: 'uppercase' as const }}>{dispPopup.props.business_type}</span>
                    )}
                    {dispPopup.props.market_tier && (
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 3, background: 'rgba(29,158,117,0.12)', color: 'var(--accent)', textTransform: 'uppercase' as const }}>{dispPopup.props.market_tier}</span>
                    )}
                    {dispPopup.props.track_state !== 'untracked' && (
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 3, background: dispPopup.props.track_state === 'blocked' ? 'rgba(186,117,23,0.15)' : 'rgba(29,158,117,0.15)', color: dispPopup.props.track_state === 'blocked' ? '#ba7517' : '#1d9e75', textTransform: 'uppercase' as const }}>{dispPopup.props.track_state}</span>
                    )}
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)', letterSpacing: '0.04em', marginBottom: 10 }}>DCC {dispPopup.props.dcc_license}</div>
                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 6, borderTop: '1px solid var(--border)', paddingTop: 9 }}>
                    <button
                      onClick={() => handlePopupSelect('track')}
                      style={{
                        flex: 1, padding: '5px 0', borderRadius: 5, fontSize: 11, fontWeight: 600,
                        fontFamily: 'var(--sans)', cursor: 'pointer',
                        border: `1px solid ${popupTracked ? '#fb923c' : 'var(--border-2)'}`,
                        background: popupTracked ? '#fb923c' : 'transparent',
                        color: popupTracked ? '#fff' : 'var(--text-2)',
                      }}
                    >
                      Track
                    </button>
                    <button
                      onClick={() => handlePopupSelect('block')}
                      style={{
                        flex: 1, padding: '5px 0', borderRadius: 5, fontSize: 11, fontWeight: 600,
                        fontFamily: 'var(--sans)', cursor: 'pointer',
                        border: `1px solid ${popupBlocked ? '#67e8f9' : 'var(--border-2)'}`,
                        background: popupBlocked ? '#67e8f9' : 'transparent',
                        color: popupBlocked ? '#0d0f11' : 'var(--text-2)',
                      }}
                    >
                      Block
                    </button>
                  </div>
                  <button
                    onClick={() => setDispPopup(null)}
                    style={{
                      marginTop: 8, width: '100%', fontSize: 11, padding: '5px 0',
                      borderRadius: 4, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                      fontWeight: 500, border: '1px solid var(--border-2)',
                      background: 'transparent', color: 'var(--text-2)',
                    }}
                  >
                    Done
                  </button>
                </div>
              </Popup>
            )}
          </Map>
        )}
        {/* Streets / Satellite toggle */}
        <div style={{ position: 'absolute', bottom: 16, right: 16, zIndex: 10, display: 'flex', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
          {(['streets', 'satellite'] as MapStyleId[]).map((id) => (
            <button key={id} onClick={() => setMapStyleId(id)} style={{
              padding: '5px 11px', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)',
              border: 'none', borderRight: id === 'streets' ? '1px solid var(--border)' : 'none',
              background: mapStyleId === id ? 'var(--accent)' : 'transparent',
              color: mapStyleId === id ? '#fff' : 'var(--text-2)',
              transition: 'background 0.12s, color 0.12s',
            }}>
              {id === 'streets' ? '🗺 Streets' : '🛰 Satellite'}
            </button>
          ))}
        </div>
        {!MAPBOX_TOKEN && (
          <div style={{
            width: '100%', height: '100%', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            background: 'var(--surface)',
            fontFamily: 'Space Mono, monospace', fontSize: 11,
            color: 'var(--text-3)', textAlign: 'center', padding: 32,
          }}>
            MAP UNCONFIGURED — set VITE_MAPBOX_TOKEN in Railway
          </div>
        )}

        {/* Legend */}
        <div style={{
          position: 'absolute', bottom: 12, left: 12, pointerEvents: 'none',
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 6, padding: '8px 12px', boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          {/* Your location */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ position: 'relative', width: 14, height: 14, flexShrink: 0 }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1.5px solid rgba(139,92,246,0.4)', animation: 'cs-ping 2.5s ease-out infinite' }} />
              <div style={{ position: 'absolute', inset: 3, borderRadius: '50%', background: '#8b5cf6' }} />
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 4, height: 4, borderRadius: '50%', background: '#fff' }} />
            </div>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-2)', letterSpacing: '0.04em' }}>Your location</span>
          </div>
          {/* Storefront */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#1d9e75', opacity: 0.5, flexShrink: 0, display: 'inline-block' }} />
            <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-2)', letterSpacing: '0.04em' }}>Storefront dispensary</span>
          </div>
          {/* Delivery */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b8bd4', opacity: 0.5, flexShrink: 0, display: 'inline-block' }} />
            <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-2)', letterSpacing: '0.04em' }}>Delivery / microbusiness</span>
          </div>
          {/* Clusters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#d4537e', flexShrink: 0, display: 'inline-block' }} />
            <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-2)', letterSpacing: '0.04em' }}>Multiple nearby (cluster)</span>
          </div>
          {/* Tracking */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ position: 'relative', width: 10, height: 10, flexShrink: 0 }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#1d9e75' }} />
              <div style={{ position: 'absolute', inset: '50%', transform: 'translate(-50%,-50%)', width: 4, height: 4, borderRadius: '50%', background: '#fb923c' }} />
            </div>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-2)', letterSpacing: '0.04em' }}>Selected — tracking</span>
          </div>
          {/* Blocked */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ position: 'relative', width: 10, height: 10, flexShrink: 0 }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#1d9e75' }} />
              <div style={{ position: 'absolute', inset: '50%', transform: 'translate(-50%,-50%)', width: 4, height: 4, borderRadius: '50%', background: '#67e8f9' }} />
            </div>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-2)', letterSpacing: '0.04em' }}>Selected — blocked</span>
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div style={{
        flex: '0 0 32%', display: 'flex', flexDirection: 'column',
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '0 8px 8px 0', overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-1)', marginBottom: 6 }}>
            Identify your rivals
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.55 }}>
            Track monitors prices and promotions. Block suppresses a rival from the platform entirely.
          </div>

          <div style={{ marginTop: 12 }}>
            <OperatorTypeFilter value={operatorType} onChange={setOperatorType} />
          </div>

          {/* Radius slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>RADIUS</span>
            <input
              type="range"
              min={1} max={25} step={1}
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              style={{ flex: 1, accentColor: '#1d9e75', cursor: 'pointer' }}
            />
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-2)', minWidth: 36, textAlign: 'right' }}>
              {radius} mi
            </span>
          </div>

          {/* Sort controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 10 }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)', letterSpacing: '0.06em', marginRight: 2 }}>SORT</span>
            {(['distance', 'name', 'status'] as SortMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setSortMode(mode)}
                style={{
                  fontSize: 9, padding: '3px 8px', borderRadius: 4, cursor: 'pointer',
                  fontFamily: 'var(--mono)', fontWeight: 600, letterSpacing: '0.04em',
                  border: `1px solid ${sortMode === mode ? 'var(--accent)' : 'var(--border-2)'}`,
                  background: sortMode === mode ? 'rgba(29,158,117,0.12)' : 'transparent',
                  color: sortMode === mode ? 'var(--accent)' : 'var(--text-3)',
                  textTransform: 'uppercase' as const,
                  transition: 'all 0.12s',
                }}
              >
                {mode}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
            {locations.length >= 1 && (
              <select
                value={selectedLocation?.id || ''}
                onChange={(e) => {
                  const loc = locations.find((l) => l.id === e.target.value) || null
                  setSelectedLocation(loc)
                }}
                style={{
                  flex: 1, background: 'var(--surface-2)',
                  border: '1.5px solid var(--border-2)', borderRadius: 6,
                  padding: '7px 10px', color: 'var(--text-1)',
                  fontSize: 12, fontFamily: 'var(--sans)', outline: 'none', cursor: 'pointer',
                }}
              >
                {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            )}
            <button
              className="btn btn-ghost"
              style={{ fontSize: 12, padding: '7px 14px', whiteSpace: 'nowrap', flexShrink: 0 }}
              onClick={handleDiscover}
              disabled={loading || !selectedLocation?.id}
            >
              {loading ? 'Scanning...' : 'Scan market'}
            </button>
          </div>
        </div>

        {/* Competitor list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
          {sidebarItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px' }}>
              <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.65, maxWidth: 280, margin: '0 auto' }}>
                {loading
                  ? 'Loading dispensaries in your area...'
                  : !selectedLocation
                    ? 'Select a location above to see nearby rivals.'
                    : 'No dispensaries found within your radius. Try increasing it.'}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {sortedSidebarItems.map((comp) => {
                const key = comp.id || comp.google_place_id
                const sel = selections.get(key)
                const isTracked = sel?.track ?? false
                const isBlocked = sel?.block ?? false
                const bothSelected = isTracked && isBlocked
                const isDeliveryItem = (comp as any).business_type === 'delivery' || (comp as any).business_type === 'both'
                const rowBg = bothSelected ? 'rgba(253,224,71,0.07)' : isBlocked ? 'rgba(103,232,249,0.07)' : isTracked ? 'rgba(251,146,60,0.07)' : 'var(--surface-2)'
                const rowBorder = bothSelected ? 'rgba(253,224,71,0.3)' : isBlocked ? 'rgba(103,232,249,0.3)' : isTracked ? 'rgba(251,146,60,0.3)' : 'var(--border)'
                const dotColor = bothSelected ? '#fde047' : isBlocked ? '#67e8f9' : isTracked ? '#fb923c' : 'var(--text-3)'
                return (
                  <div key={key} style={{
                    background: rowBg,
                    border: `1px solid ${rowBorder}`,
                    borderRadius: 6, padding: '10px 12px',
                    display: 'flex', alignItems: 'center', gap: 10,
                    transition: 'border-color 0.1s, background 0.1s',
                  }}>
                    {(isTracked || isBlocked) ? (
                      <div style={{ position: 'relative', width: 10, height: 10, flexShrink: 0 }}>
                        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: isDeliveryItem ? '#3b8bd4' : '#1d9e75' }} />
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 5, height: 5, borderRadius: '50%', background: dotColor }} />
                      </div>
                    ) : (
                      <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: isDeliveryItem ? 'rgba(59,139,212,0.5)' : 'rgba(29,158,117,0.5)', display: 'inline-block' }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 13, fontWeight: 500, color: 'var(--text-1)', marginBottom: 2,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>{comp.name}</div>
                      <div style={{
                        fontSize: 10, color: 'var(--text-3)', fontFamily: 'Space Mono, monospace',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {comp.distance_miles != null ? `${Number(comp.distance_miles).toFixed(1)} mi` : ''}
                        {comp.distance_miles && comp.address ? '  ·  ' : ''}
                        {comp.address}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                      <button
                        style={{
                          fontSize: 11, padding: '4px 10px', borderRadius: 4, cursor: 'pointer',
                          fontFamily: 'DM Sans, sans-serif', fontWeight: 500,
                          border: `1px solid ${isTracked ? '#fb923c' : 'var(--border-2)'}`,
                          background: isTracked ? '#fb923c' : 'transparent',
                          color: isTracked ? '#fff' : 'var(--text-2)',
                        }}
                        onClick={() => setSelection(comp, 'track', !isTracked)}
                      >Track</button>
                      <button
                        style={{
                          fontSize: 11, padding: '4px 10px', borderRadius: 4, cursor: 'pointer',
                          fontFamily: 'DM Sans, sans-serif', fontWeight: 500,
                          border: `1px solid ${isBlocked ? '#67e8f9' : 'var(--border-2)'}`,
                          background: isBlocked ? '#67e8f9' : 'transparent',
                          color: isBlocked ? '#0d0f11' : 'var(--text-2)',
                        }}
                        onClick={() => setSelection(comp, 'block', !isBlocked)}
                      >Block</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 16px', borderTop: '1px solid var(--border)',
          background: 'var(--surface-2)', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, gap: 12,
        }}>
          <div style={{ fontSize: 12, minWidth: 0 }}>
            {selections.size > 0 ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                {trackCount > 0 && <span style={{ color: 'var(--accent)' }}>{trackCount} tracking</span>}
                {trackCount > 0 && blockCount > 0 && <span style={{ color: 'var(--text-3)' }}>·</span>}
                {blockCount > 0 && <span style={{ color: 'var(--warm)' }}>{blockCount} blocked</span>}
              </span>
            ) : (
              <span style={{ color: 'var(--text-3)', fontSize: 11, fontFamily: 'Space Mono, monospace' }}>
                No rivals selected
              </span>
            )}
          </div>
          <button
            className="btn btn-primary"
            style={{ fontSize: 12, padding: '7px 16px', flexShrink: 0 }}
            onClick={handleLaunch}
            disabled={saving}
          >
            {saving ? 'Launching...' : selections.size > 0 ? 'Confirm & launch monitoring' : 'Skip for now'}
          </button>
        </div>
      </div>
    </div>
    </div>
  )
}
