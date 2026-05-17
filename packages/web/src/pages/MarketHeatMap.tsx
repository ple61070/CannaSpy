import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Map, {
  Source,
  Layer,
  Popup,
  NavigationControl,
  type MapRef,
  type MapLayerMouseEvent,
} from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { MAPBOX_TOKEN, isMapConfigured } from '../components/map/mapStyle'
import { CALIFORNIA_VIEWPORT } from '../components/map/types'
import type { DispensaryFeatureProps } from '../components/map/types'
import { OperatorTypeFilter, type OperatorType } from '../components/filters/OperatorTypeFilter'
import { MarketSubNav } from '../components/shared/MarketSubNav'
import {
  dispensaryRingLayer,
  dispensaryClusterLayer,
  dispensaryClusterCountLayer,
  dispensaryPointLayer,
} from '../components/map/layers'
import { useDispensaryMap } from '../hooks/useDispensaryMap'

// ─── Types ──────────────────────────────────────────────────────────────────

type Tier = 'elite' | 'hot' | 'competitive' | 'standard'
type MapStyleId = 'streets' | 'satellite'
type AppTheme = 'light' | 'dark'

interface Market {
  id: string; name: string; tier: Tier; rate: string
  dispensaries: number; yours: number; rivals: number; lng: number; lat: number
}

interface GeoResult {
  id: string
  place_name: string
  center: [number, number]
  place_type: string[]
}

// ─── Static data ─────────────────────────────────────────────────────────────

const MARKETS: Market[] = [
  { id: 'weho',        name: 'West Hollywood', tier: 'elite',       rate: '$250', dispensaries: 38, yours: 1, rivals: 5, lng: -118.3611, lat: 34.0900 },
  { id: 'dtla',        name: 'Downtown LA',    tier: 'elite',       rate: '$250', dispensaries: 45, yours: 2, rivals: 4, lng: -118.2437, lat: 34.0522 },
  { id: 'sf',          name: 'San Francisco',  tier: 'elite',       rate: '$250', dispensaries: 42, yours: 1, rivals: 3, lng: -122.4194, lat: 37.7749 },
  { id: 'oakland',     name: 'Oakland',        tier: 'hot',         rate: '$200', dispensaries: 31, yours: 1, rivals: 3, lng: -122.2712, lat: 37.8044 },
  { id: 'sddowntown',  name: 'San Diego',      tier: 'hot',         rate: '$200', dispensaries: 28, yours: 1, rivals: 2, lng: -117.1611, lat: 32.7157 },
  { id: 'longbeach',   name: 'Long Beach',     tier: 'competitive', rate: '$150', dispensaries: 22, yours: 1, rivals: 3, lng: -118.1937, lat: 33.7701 },
  { id: 'sacramento',  name: 'Sacramento',     tier: 'competitive', rate: '$150', dispensaries: 19, yours: 1, rivals: 2, lng: -121.4944, lat: 38.5816 },
  { id: 'anaheim',     name: 'Anaheim',        tier: 'competitive', rate: '$150', dispensaries: 17, yours: 0, rivals: 2, lng: -117.9145, lat: 33.8366 },
  { id: 'riverside',   name: 'Riverside',      tier: 'standard',    rate: '$100', dispensaries: 12, yours: 1, rivals: 1, lng: -117.3755, lat: 33.9806 },
  { id: 'fresno',      name: 'Fresno',         tier: 'standard',    rate: '$100', dispensaries: 9,  yours: 0, rivals: 0, lng: -119.7871, lat: 36.7378 },
  { id: 'bakersfield', name: 'Bakersfield',    tier: 'standard',    rate: '$100', dispensaries: 7,  yours: 0, rivals: 0, lng: -119.0187, lat: 35.3733 },
  { id: 'stockton',    name: 'Stockton',       tier: 'standard',    rate: '$100', dispensaries: 8,  yours: 0, rivals: 0, lng: -121.2908, lat: 37.9577 },
]

const TIER_COLORS: Record<Tier, string> = {
  elite: '#e05a6a', hot: '#d4900a', competitive: '#09A1A1', standard: '#5484A4',
}
const TIER_LABELS: Record<Tier, string> = {
  elite: 'Elite', hot: 'Hot', competitive: 'Competitive', standard: 'Standard',
}

const MAP_STYLES: Record<MapStyleId, Record<AppTheme, string>> = {
  streets:   { light: 'mapbox://styles/mapbox/streets-v12', dark: 'mapbox://styles/mapbox/dark-v11' },
  satellite: { light: 'mapbox://styles/mapbox/satellite-streets-v12', dark: 'mapbox://styles/mapbox/satellite-streets-v12' },
}

// Reads app theme from localStorage (same key Layout.tsx writes)
function useAppTheme(): AppTheme {
  const [theme, setTheme] = useState<AppTheme>(
    () => (localStorage.getItem('cs-theme') as AppTheme) || 'light'
  )
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const t = document.documentElement.getAttribute('data-theme') as AppTheme | null
      if (t) setTheme(t)
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])
  return theme
}

const MARKET_TABS = [
  { label: 'Heat Map',      route: '/market/heat-map' },
  { label: 'Rival Ranking', route: '/market/ranking' },
  { label: 'My Benchmarks', route: '/market/benchmarks' },
  { label: 'SKU Gaps',      route: '/market/sku-gaps' },
  { label: 'Deal Patterns', route: '/market/deals' },
]

// ─── GeoJSON / layers ────────────────────────────────────────────────────────

function buildMarketGeoJSON(markets: Market[]) {
  return {
    type: 'FeatureCollection' as const,
    features: markets.map(m => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [m.lng, m.lat] },
      properties: { id: m.id, name: m.name, tier: m.tier, rate: m.rate, dispensaries: m.dispensaries, color: TIER_COLORS[m.tier] },
    })),
  }
}
const MARKET_GEOJSON = buildMarketGeoJSON(MARKETS)

const marketCircleLayer = {
  id: 'markets-circle', type: 'circle' as const, maxzoom: 10,
  paint: {
    'circle-radius': ['interpolate', ['linear'], ['get', 'dispensaries'], 7, 18, 45, 40] as unknown as number,
    'circle-color': ['match', ['get', 'tier'], 'elite', '#e05a6a', 'hot', '#d4900a', 'competitive', '#09A1A1', '#5484A4'] as unknown as string,
    'circle-opacity': 0.75,
    'circle-stroke-width': 2,
    'circle-stroke-color': ['match', ['get', 'tier'], 'elite', '#e05a6a', 'hot', '#d4900a', 'competitive', '#09A1A1', '#5484A4'] as unknown as string,
    'circle-stroke-opacity': 1,
  },
}
const marketLabelLayer = {
  id: 'markets-label', type: 'symbol' as const, maxzoom: 10,
  layout: { 'text-field': ['get', 'dispensaries'] as unknown as string, 'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'], 'text-size': 11, 'text-allow-overlap': true },
  paint: { 'text-color': '#ffffff' },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function tierBadgeStyle(tier: Tier): React.CSSProperties {
  if (tier === 'elite')       return { background: 'rgba(224,90,106,0.12)',  color: '#e05a6a' }
  if (tier === 'hot')         return { background: 'rgba(212,144,10,0.12)',  color: '#d4900a' }
  if (tier === 'competitive') return { background: 'rgba(9,161,161,0.12)',   color: '#09A1A1' }
  return                             { background: 'rgba(84,132,164,0.12)',  color: '#5484A4' }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function MarketHeatMap() {
  const navigate = useNavigate()
  const mapRef          = useRef<MapRef | null>(null)
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const appTheme = useAppTheme()

  const [mapStyleId, setMapStyleId]   = useState<MapStyleId>('streets')
  const [cursor, setCursor]           = useState<string>('default')
  const [bbox, setBbox]               = useState<string | null>(null)
  const [zoom, setZoom]               = useState<number>(CALIFORNIA_VIEWPORT.zoom)
  const [filter, setFilter]           = useState<'all' | 'enriched'>('all')
  const [operatorType, setOperatorType] = useState<OperatorType>('both')
  const [marketPopup, setMarketPopup] = useState<{ lng: number; lat: number; market: Market } | null>(null)
  const [dispPopup, setDispPopup]     = useState<{ lng: number; lat: number; props: DispensaryFeatureProps } | null>(null)

  // ─── Search ───────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery]     = useState('')
  const [searchResults, setSearchResults] = useState<GeoResult[]>([])
  const [searchOpen, setSearchOpen]       = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([])
      setSearchOpen(false)
      return
    }
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(async () => {
      try {
        const q = encodeURIComponent(searchQuery)
        // California bbox: west,south,east,north
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${q}.json?country=US&bbox=-124.48,32.53,-114.13,42.01&types=place,postcode,neighborhood,locality,address&limit=6&autocomplete=true&access_token=${MAPBOX_TOKEN}`
        const res = await fetch(url)
        const data = await res.json()
        setSearchResults(data.features ?? [])
        setSearchOpen(true)
      } catch { /* ignore */ }
    }, 220)
  }, [searchQuery])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelectResult = (r: GeoResult) => {
    setSearchQuery(r.place_name.split(',')[0])
    setSearchOpen(false)
    mapRef.current?.flyTo({ center: r.center, zoom: 12, duration: 900 })
  }

  // ─── Dispensary data ──────────────────────────────────────────────────────
  const { data: dispensaries, loading: dispensariesLoading, count: dispCount } = useDispensaryMap(bbox, {
    type: operatorType === 'both' ? undefined : operatorType,
  })

  // ─── Resize observer — keeps Mapbox canvas in sync with container ─────────
  useEffect(() => {
    const el = mapContainerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      mapRef.current?.getMap()?.resize()
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // ─── Bbox / zoom ──────────────────────────────────────────────────────────
  const updateBbox = useCallback(() => {
    const map = mapRef.current?.getMap()
    if (!map) return
    const b = map.getBounds()
    if (!b) return
    setBbox(`${b.getWest()},${b.getSouth()},${b.getEast()},${b.getNorth()}`)
    setZoom(map.getZoom())
  }, [])

  const onLoad    = useCallback(() => { updateBbox() }, [updateBbox])
  const onMoveEnd = useCallback(() => { updateBbox() }, [updateBbox])

  // ─── Interaction ──────────────────────────────────────────────────────────
  const interactiveLayers = zoom < 10
    ? ['markets-circle']
    : ['cs-dispensary-point', 'cs-dispensary-cluster']

  const onMouseMove = useCallback((e: MapLayerMouseEvent) => {
    const f = e.features?.[0]
    if (!f) { setCursor('default'); setMarketPopup(null); return }
    setCursor('pointer')
    if (f.layer?.id === 'markets-circle') {
      const props = f.properties as { id: string }
      const market = MARKETS.find(m => m.id === props.id)
      if (market) setMarketPopup({ lng: market.lng, lat: market.lat, market })
      setDispPopup(null)
    } else {
      setMarketPopup(null)
    }
  }, [])

  const onMouseLeave = useCallback(() => { setCursor('default'); setMarketPopup(null) }, [])

  const onClick = useCallback((e: MapLayerMouseEvent) => {
    const f = e.features?.[0]
    if (!f) { setDispPopup(null); return }

    if (f.layer?.id === 'markets-circle') {
      const props = f.properties as { id: string }
      const market = MARKETS.find(m => m.id === props.id)
      if (market) mapRef.current?.flyTo({ center: [market.lng, market.lat], zoom: Math.max(zoom, 11), duration: 700 })
      setDispPopup(null)
      return
    }
    if (f.layer?.id === 'cs-dispensary-cluster') {
      const map = mapRef.current?.getMap()
      if (!map) return
      const clusterId = (f.properties as { cluster_id: number }).cluster_id
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const source = map.getSource('cs-dispensaries') as any
      source.getClusterExpansionZoom(clusterId, (err: Error | null, z: number | null) => {
        if (err) return
        const coords = (f.geometry as { type: 'Point'; coordinates: [number, number] }).coordinates
        map.easeTo({ center: coords, zoom: z ?? (zoom + 2), duration: 400 })
      })
      return
    }
    if (f.layer?.id === 'cs-dispensary-point') {
      const props = f.properties as DispensaryFeatureProps
      const coords = (f.geometry as { type: 'Point'; coordinates: [number, number] }).coordinates
      setDispPopup({ lng: coords[0], lat: coords[1], props })
      return
    }
  }, [zoom])

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: 'var(--bg)', fontFamily: 'var(--sans)', color: 'var(--text-1)', fontSize: 14, overflow: 'hidden' }}>

      {/* TOPBAR */}
      <div style={{ padding: '8px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, background: 'var(--surface)' }}>
        <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em', flexShrink: 0 }}>Market Intelligence</span>

        {/* SEARCH BAR */}
        <div ref={searchRef} style={{ position: 'relative', flex: 1, maxWidth: 380 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--surface-3)', transition: 'border-color 0.15s' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2.5" style={{ flexShrink: 0 }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => searchResults.length > 0 && setSearchOpen(true)}
              onKeyDown={e => { if (e.key === 'Escape') { setSearchOpen(false); setSearchQuery('') } if (e.key === 'Enter' && searchResults[0]) handleSelectResult(searchResults[0]) }}
              placeholder="Search city, zip, or neighborhood..."
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 12, color: 'var(--text-1)', fontFamily: 'var(--sans)' }}
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setSearchResults([]); setSearchOpen(false) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', lineHeight: 1, padding: 0, fontSize: 14 }}>×</button>
            )}
          </div>

          {/* AUTOCOMPLETE DROPDOWN */}
          {searchOpen && searchResults.length > 0 && (
            <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 100, overflow: 'hidden' }}>
              {searchResults.map(r => (
                <div
                  key={r.id}
                  onMouseDown={() => handleSelectResult(r)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)', fontSize: 12, color: 'var(--text-1)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" style={{ flexShrink: 0 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.place_name}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)', textTransform: 'uppercase', flexShrink: 0 }}>
                    {r.place_type[0] === 'postcode' ? 'zip' : r.place_type[0]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT CONTROLS */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <OperatorTypeFilter value={operatorType} onChange={setOperatorType} />
          {(['all', 'enriched'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', border: `1.5px solid ${filter === f ? 'var(--accent)' : 'var(--border)'}`, background: filter === f ? 'rgba(9,161,161,0.12)' : 'var(--surface-3)', color: filter === f ? 'var(--accent)' : 'var(--text-2)' }}>
              {f === 'all' ? 'All Dispensaries' : 'Intel Available'}
            </button>
          ))}
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 11px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid var(--border)', background: 'var(--surface-3)', color: 'var(--text-1)' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export
          </button>
        </div>
      </div>

      {/* SUB-NAV */}
      <MarketSubNav />

      {/* MAP — full width */}
      <div ref={mapContainerRef} style={{ flex: 1, width: '100%', position: 'relative', overflow: 'hidden', minHeight: 0, transition: 'width 0.22s cubic-bezier(.2,.8,.2,1)' }}>
        {isMapConfigured() ? (
          <Map
            key={MAP_STYLES[mapStyleId][appTheme]}
            ref={mapRef}
            mapboxAccessToken={MAPBOX_TOKEN}
            mapStyle={MAP_STYLES[mapStyleId][appTheme]}
            initialViewState={{ longitude: CALIFORNIA_VIEWPORT.longitude, latitude: CALIFORNIA_VIEWPORT.latitude, zoom: CALIFORNIA_VIEWPORT.zoom }}
            style={{ width: '100%', height: '100%' }}
            cursor={cursor}
            interactiveLayerIds={interactiveLayers}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            onClick={onClick}
            onLoad={onLoad}
            onMoveEnd={onMoveEnd}
          >
            <NavigationControl position="top-right" showCompass={false} showZoom />

            {/* Market overview bubbles (zoom < 10) */}
            <Source id="markets" type="geojson" data={MARKET_GEOJSON}>
              <Layer {...marketCircleLayer} />
              <Layer {...marketLabelLayer} />
            </Source>

            {/* Live dispensary pins (zoom ≥ 9) */}
            <Source
              id="cs-dispensaries"
              type="geojson"
              data={dispensaries as unknown as Parameters<typeof Source>[0]['data']}
              cluster clusterMaxZoom={13} clusterRadius={35}
            >
              <Layer {...dispensaryRingLayer} minzoom={9} />
              <Layer
                {...dispensaryPointLayer}
                minzoom={9}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                paint={filter === 'enriched'
                  ? ({ ...dispensaryPointLayer.paint, 'circle-opacity': ['case', ['==', ['get', 'enriched'], true], 0.9, 0.06] } as any)
                  : dispensaryPointLayer.paint}
              />
              <Layer {...dispensaryClusterLayer} minzoom={9} />
              <Layer {...dispensaryClusterCountLayer} minzoom={9} />
            </Source>

            {/* Market hover popup */}
            {marketPopup && (
              <Popup longitude={marketPopup.lng} latitude={marketPopup.lat} closeButton={false} closeOnClick={false} anchor="bottom" offset={[0, -14] as [number, number]}>
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 14px', minWidth: 180, pointerEvents: 'none', fontFamily: 'var(--sans)' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{marketPopup.market.name}</div>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 3, display: 'inline-block', marginBottom: 6, ...tierBadgeStyle(marketPopup.market.tier) }}>
                    {TIER_LABELS[marketPopup.market.tier]} · {marketPopup.market.rate}/slot
                  </span>
                  {([['Dispensaries', marketPopup.market.dispensaries], ['Your locations', marketPopup.market.yours || 'None'], ['Rivals tracked', marketPopup.market.rivals]] as [string, string | number][]).map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-2)', marginBottom: 2 }}>
                      <span>{k}</span>
                      <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--text-1)', marginLeft: 12 }}>{String(v)}</span>
                    </div>
                  ))}
                </div>
              </Popup>
            )}

            {/* Dispensary pin popup */}
            {dispPopup && (
              <Popup longitude={dispPopup.lng} latitude={dispPopup.lat} closeButton closeOnClick={false} onClose={() => setDispPopup(null)} anchor="bottom" offset={[0, -10] as [number, number]}>
                <DispensaryPopup props={dispPopup.props} />
              </Popup>
            )}
          </Map>
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-2)', gap: 12 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Map unavailable</div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', textAlign: 'center', maxWidth: 320, lineHeight: 1.6 }}>
              Set <code style={{ fontFamily: 'var(--mono)', fontSize: 11, background: 'var(--surface-3)', padding: '1px 5px', borderRadius: 3 }}>VITE_MAPBOX_TOKEN</code> in your environment.
            </div>
          </div>
        )}

        {/* LEGEND */}
        <div style={{ position: 'absolute', bottom: 16, left: 16, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.2)', zIndex: 10 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--text-3)', marginBottom: 7 }}>
            {zoom < 9 ? 'Market tier · slot rate' : 'Pin status'}
          </div>
          {(zoom < 9
            ? [{ color: '#e05a6a', label: 'Elite — $250/slot' }, { color: '#d4900a', label: 'Hot — $200/slot' }, { color: '#09A1A1', label: 'Competitive — $150/slot' }, { color: '#5484A4', label: 'Standard — $100/slot' }]
            : [{ color: '#1d9e75', label: 'Rival — intel available' }, { color: '#ba7517', label: 'Blocked rival' }, { color: 'rgba(29,158,117,0.7)', label: 'Prospect — no intel yet' }]
          ).map((leg, i, arr) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: i < arr.length - 1 ? 4 : 0, fontSize: 11, color: 'var(--text-2)' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: leg.color, border: '1px solid rgba(128,128,128,0.2)', flexShrink: 0 }} />
              {leg.label}
            </div>
          ))}
        </div>

        {/* MAP STYLE TOGGLE */}
        <div style={{ position: 'absolute', bottom: 16, right: 16, zIndex: 10, display: 'flex', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
          {(['streets', 'satellite'] as MapStyleId[]).map((id) => (
            <button
              key={id}
              onClick={() => setMapStyleId(id)}
              style={{
                padding: '5px 11px', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)',
                border: 'none', borderRight: id === 'streets' ? '1px solid var(--border)' : 'none',
                background: mapStyleId === id ? 'var(--accent-intel)' : 'transparent',
                color: mapStyleId === id ? '#fff' : 'var(--text-2)',
                transition: 'background 0.12s, color 0.12s',
              }}
            >
              {id === 'streets' ? '🗺 Streets' : '🛰 Satellite'}
            </button>
          ))}
        </div>

        {/* Stat pill — top center */}
        <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '4px 14px', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
            {dispensariesLoading
              ? 'LOADING...'
              : dispCount > 0
                ? `${dispCount.toLocaleString()} DISPENSARIES IN VIEW`
                : 'CALIFORNIA · 12 MARKETS TRACKED'}
          </div>
        </div>

        {/* Loading indicator */}
        {dispensariesLoading && zoom >= 9 && (
          <div style={{ position: 'absolute', top: 36, left: '50%', transform: 'translateX(-50%)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '4px 14px', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', letterSpacing: '0.06em' }}>
            PULLING DISPENSARIES...
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Dispensary popup ─────────────────────────────────────────────────────────

function DispensaryPopup({ props: p }: { props: DispensaryFeatureProps }) {
  const tierColor = (t: string | null) => {
    if (t === 'elite') return '#e05a6a'
    if (t === 'hot') return '#d4900a'
    if (t === 'competitive') return '#09A1A1'
    return '#5484A4'
  }
  return (
    <div style={{ minWidth: 220, fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--text-1)', background: 'var(--surface)', padding: '10px 12px' }}>
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 3 }}>{p.name}</div>
      <div style={{ color: 'var(--text-3)', fontSize: 11, marginBottom: 8 }}>{p.city}{p.county ? `, ${p.county} Co.` : ''}</div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 3, background: 'var(--surface-3)', color: 'var(--text-2)', textTransform: 'uppercase' }}>{p.license_type}</span>
        {p.market_tier && (
          <span style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 3, background: `${tierColor(p.market_tier)}1a`, color: tierColor(p.market_tier), textTransform: 'uppercase' }}>{p.market_tier}</span>
        )}
        {p.track_state !== 'untracked' && (
          <span style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 3, background: p.track_state === 'blocked' ? 'rgba(212,144,10,0.15)' : 'rgba(9,161,161,0.15)', color: p.track_state === 'blocked' ? '#d4900a' : '#09A1A1', textTransform: 'uppercase' }}>{p.track_state}</span>
        )}
      </div>
      {p.enriched ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {p.threat_score != null && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-2)' }}>
              <span>Threat score</span>
              <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--text-1)' }}>{(p.threat_score * 100).toFixed(0)}</span>
            </div>
          )}
          {p.price_observations_count > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-2)' }}>
              <span>Price observations</span>
              <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--text-1)' }}>{p.price_observations_count.toLocaleString()}</span>
            </div>
          )}
        </div>
      ) : (
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.04em' }}>Intel not yet available for this location.</div>
      )}
      <div style={{ marginTop: 10, fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)', letterSpacing: '0.04em' }}>DCC {p.dcc_license}</div>
    </div>
  )
}
