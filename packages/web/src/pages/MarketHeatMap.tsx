import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Map, { Source, Layer, Popup, NavigationControl, type MapRef, type MapLayerMouseEvent } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { MAPBOX_TOKEN, CANNASPY_STYLE_URL, isMapConfigured } from '../components/map/mapStyle'
import { CALIFORNIA_VIEWPORT } from '../components/map/types'

// ─── Types ──────────────────────────────────────────────────────────────────

type Tier = 'elite' | 'hot' | 'competitive' | 'standard'

interface Market {
  id: string
  name: string
  tier: Tier
  rate: string
  dispensaries: number
  yours: number
  rivals: number
  lng: number
  lat: number
}

// ─── Data ────────────────────────────────────────────────────────────────────

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
  elite: '#e05a6a',
  hot: '#d4900a',
  competitive: '#09A1A1',
  standard: '#5484A4',
}

const TIER_LABELS: Record<Tier, string> = {
  elite: 'Elite',
  hot: 'Hot',
  competitive: 'Competitive',
  standard: 'Standard',
}

const MARKET_TABS = [
  { label: 'Heat Map',        route: '/market/heat-map' },
  { label: 'Rival Ranking',   route: '/market/ranking' },
  { label: 'My Benchmarks',   route: '/market/benchmarks' },
  { label: 'SKU Gaps',        route: '/market/sku-gaps' },
  { label: 'Deal Patterns',   route: '/market/deals' },
]

// ─── GeoJSON ─────────────────────────────────────────────────────────────────

function buildGeoJSON(markets: Market[]) {
  return {
    type: 'FeatureCollection' as const,
    features: markets.map(m => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [m.lng, m.lat],
      },
      properties: {
        id: m.id,
        name: m.name,
        tier: m.tier,
        rate: m.rate,
        dispensaries: m.dispensaries,
        yours: m.yours,
        rivals: m.rivals,
        color: TIER_COLORS[m.tier],
      },
    })),
  }
}

const geojsonData = buildGeoJSON(MARKETS)

// ─── Layer specs ─────────────────────────────────────────────────────────────

const circleLayer = {
  id: 'markets-circle',
  type: 'circle' as const,
  paint: {
    'circle-radius': [
      'interpolate', ['linear'],
      ['get', 'dispensaries'],
      7, 18,
      45, 40,
    ] as unknown as number,
    'circle-color': [
      'match', ['get', 'tier'],
      'elite',       '#e05a6a',
      'hot',         '#d4900a',
      'competitive', '#09A1A1',
      /* default */  '#5484A4',
    ] as unknown as string,
    'circle-opacity': 0.75,
    'circle-stroke-width': 2,
    'circle-stroke-color': [
      'match', ['get', 'tier'],
      'elite',       '#e05a6a',
      'hot',         '#d4900a',
      'competitive', '#09A1A1',
      /* default */  '#5484A4',
    ] as unknown as string,
    'circle-stroke-opacity': 1,
  },
}

const labelLayer = {
  id: 'markets-label',
  type: 'symbol' as const,
  layout: {
    'text-field': ['get', 'dispensaries'] as unknown as string,
    'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
    'text-size': 11,
    'text-allow-overlap': true,
  },
  paint: {
    'text-color': '#ffffff',
  },
}

// ─── Popup state ─────────────────────────────────────────────────────────────

interface HoverPopup {
  lng: number
  lat: number
  market: Market
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
  const mapRef = useRef<MapRef | null>(null)

  const [selectedId, setSelectedId]     = useState<string | null>(null)
  const [hoverPopup, setHoverPopup]     = useState<HoverPopup | null>(null)
  const [cursor, setCursor]             = useState<string>('default')

  const sorted = [...MARKETS].sort((a, b) => {
    const order: Record<Tier, number> = { elite: 0, hot: 1, competitive: 2, standard: 3 }
    return order[a.tier] - order[b.tier] || b.dispensaries - a.dispensaries
  })

  const selectedMarket = selectedId ? MARKETS.find(m => m.id === selectedId) ?? null : null

  const onMouseMove = useCallback((e: MapLayerMouseEvent) => {
    const features = e.features
    if (features && features.length > 0) {
      const f = features[0]
      const props = f.properties as { id: string; name: string; tier: Tier; rate: string; dispensaries: number; yours: number; rivals: number }
      const market = MARKETS.find(m => m.id === props.id)
      if (market) {
        setCursor('pointer')
        setHoverPopup({ lng: market.lng, lat: market.lat, market })
        return
      }
    }
    setCursor('default')
    setHoverPopup(null)
  }, [])

  const onMouseLeave = useCallback(() => {
    setCursor('default')
    setHoverPopup(null)
  }, [])

  const onClick = useCallback((e: MapLayerMouseEvent) => {
    const features = e.features
    if (features && features.length > 0) {
      const f = features[0]
      const props = f.properties as { id: string }
      setSelectedId(prev => prev === props.id ? null : props.id)
    }
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)', fontFamily: 'var(--sans)', color: 'var(--text-1)', fontSize: 14, overflow: 'hidden' }}>

      {/* TOPBAR */}
      <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, background: 'var(--surface)' }}>
        <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em' }}>Market Intelligence</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)' }}>CALIFORNIA — 12 MARKETS TRACKED · 81 TOTAL DISPENSARIES</span>
        <div style={{ marginLeft: 'auto' }}>
          <button
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid var(--border-2)', background: 'var(--surface-3)', color: 'var(--text-1)' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            Export
          </button>
        </div>
      </div>

      {/* SUB-NAV TABS */}
      <div style={{ display: 'flex', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', padding: '0 24px', flexShrink: 0, overflowX: 'auto' }}>
        {MARKET_TABS.map(tab => {
          const active = tab.route === '/market/heat-map'
          return (
            <div
              key={tab.route}
              onClick={() => navigate(tab.route)}
              style={{ padding: '10px 16px', fontSize: 12, fontWeight: 600, color: active ? 'var(--accent)' : 'var(--text-3)', cursor: 'pointer', borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent', whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              {tab.label}
            </div>
          )
        })}
      </div>

      {/* BODY */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

        {/* MAP PANEL */}
        <div style={{ flex: 1, position: 'relative', height: '100%' }}>
          {isMapConfigured() ? (
            <Map
              ref={mapRef}
              mapboxApiAccessToken={MAPBOX_TOKEN}
              mapStyle={CANNASPY_STYLE_URL}
              initialViewState={{
                longitude: CALIFORNIA_VIEWPORT.longitude,
                latitude: CALIFORNIA_VIEWPORT.latitude,
                zoom: CALIFORNIA_VIEWPORT.zoom,
              }}
              style={{ width: '100%', height: '100%' }}
              cursor={cursor}
              interactiveLayerIds={['markets-circle']}
              onMouseMove={onMouseMove}
              onMouseLeave={onMouseLeave}
              onClick={onClick}
            >
              <NavigationControl position="top-right" showCompass={false} showZoom={true} />

              <Source id="markets" type="geojson" data={geojsonData}>
                <Layer {...circleLayer} />
                <Layer {...labelLayer} />
              </Source>

              {hoverPopup && (
                <Popup
                  longitude={hoverPopup.lng}
                  latitude={hoverPopup.lat}
                  closeButton={false}
                  closeOnClick={false}
                  anchor="bottom"
                  offset={[0, -12] as [number, number]}
                >
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--border-2)', borderRadius: 6, padding: '10px 14px', minWidth: 180, pointerEvents: 'none', fontFamily: 'var(--sans)' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, color: 'var(--text-1)' }}>{hoverPopup.market.name}</div>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 3, display: 'inline-block', marginBottom: 6, ...tierBadgeStyle(hoverPopup.market.tier) }}>
                      {TIER_LABELS[hoverPopup.market.tier]} · {hoverPopup.market.rate}/slot
                    </span>
                    {([
                      ['Dispensaries',    hoverPopup.market.dispensaries],
                      ['Slot rate',       hoverPopup.market.rate + '/slot'],
                      ['Your locations',  hoverPopup.market.yours  || 'None'],
                      ['Rivals tracked',  hoverPopup.market.rivals],
                    ] as [string, string | number][]).map(([k, val]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-2)', marginBottom: 2 }}>
                        <span>{k}</span>
                        <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--text-1)', marginLeft: 12 }}>{String(val)}</span>
                      </div>
                    ))}
                  </div>
                </Popup>
              )}
            </Map>
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-2)', gap: 12 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Map unavailable</div>
              <div style={{ fontSize: 13, color: 'var(--text-2)', textAlign: 'center', maxWidth: 320, lineHeight: 1.6 }}>
                Set <code style={{ fontFamily: 'var(--mono)', fontSize: 11, background: 'var(--surface-3)', padding: '1px 5px', borderRadius: 3 }}>VITE_MAPBOX_TOKEN</code> in your environment to enable the interactive map.
              </div>
            </div>
          )}

          {/* LEGEND */}
          <div style={{ position: 'absolute', bottom: 16, left: 16, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.2)', zIndex: 10 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--text-3)', marginBottom: 7 }}>Market tier · slot rate</div>
            {([
              { color: '#e05a6a', label: 'Elite — $250/slot' },
              { color: '#d4900a', label: 'Hot — $200/slot' },
              { color: '#09A1A1', label: 'Competitive — $150/slot' },
              { color: '#5484A4', label: 'Standard — $100/slot' },
            ]).map((leg, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: i < 3 ? 4 : 0, fontSize: 11, color: 'var(--text-2)' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: leg.color, flexShrink: 0 }} />
                {leg.label}
              </div>
            ))}
          </div>
        </div>

        {/* SIDEBAR */}
        <div style={{ width: 280, flexShrink: 0, background: 'var(--surface)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>California Markets</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>Click a market to see details</div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
            {sorted.map(m => {
              const isSelected = m.id === selectedId
              const col = TIER_COLORS[m.tier]
              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedId(prev => prev === m.id ? null : m.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '9px 10px', marginBottom: 4, cursor: 'pointer', borderRadius: 5,
                    background: isSelected ? 'var(--surface-3)' : 'var(--surface-2)',
                    borderLeft: `3px solid ${isSelected ? col : 'transparent'}`,
                    border: `1px solid var(--border)`,
                    borderLeftWidth: 3,
                    borderLeftColor: isSelected ? col : 'transparent',
                  }}
                >
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: col, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>{m.rate}/slot</div>
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: 'var(--text-2)', flexShrink: 0 }}>{m.dispensaries}</div>
                </div>
              )
            })}
          </div>

          {/* DETAIL CARD */}
          {selectedMarket && (
            <div style={{ borderTop: '1px solid var(--border)', padding: 14, background: 'var(--surface-2)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{selectedMarket.name}</div>
                </div>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, padding: '3px 7px', borderRadius: 3, ...tierBadgeStyle(selectedMarket.tier) }}>
                  {TIER_LABELS[selectedMarket.tier]}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {([
                  { val: selectedMarket.rate,         label: 'Slot rate' },
                  { val: selectedMarket.dispensaries,  label: 'Dispensaries' },
                  { val: selectedMarket.yours || 0,    label: 'Your locations' },
                  { val: selectedMarket.rivals,        label: 'Rivals tracked' },
                ] as { val: string | number; label: string }[]).map(s => (
                  <div key={s.label} style={{ background: 'var(--surface)', borderRadius: 4, padding: '6px 8px' }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, color: 'var(--text-1)' }}>{String(s.val)}</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
