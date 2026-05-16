import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Map, { Source, Layer, Marker, NavigationControl, type MapRef } from 'react-map-gl'
import type { LayerProps } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useAuthFetch } from '../lib/useAuthFetch'
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
  action: 'track' | 'block'
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
  const appTheme        = useAppTheme()
  const [mapStyleId, setMapStyleId] = useState<MapStyleId>('streets')

  const [locations, setLocations] = useState<Location[]>([])
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [selections, setSelections] = useState<globalThis.Map<string, Selection>>(new globalThis.Map())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [scanned, setScanned] = useState(false)
  const [operatorType, setOperatorType] = useState<OperatorType>('both')

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

  // Fly to selected location when it changes
  useEffect(() => {
    if (!selectedLocation?.lat || !selectedLocation?.lng) return
    mapRef.current?.flyTo({
      center: [Number(selectedLocation.lng), Number(selectedLocation.lat)],
      zoom: 12,
      duration: 1000,
    })
  }, [selectedLocation])

  // Also fly on map load in case selectedLocation was set before map was ready
  const handleMapLoad = useCallback(() => {
    if (!selectedLocation?.lat || !selectedLocation?.lng) return
    mapRef.current?.flyTo({
      center: [Number(selectedLocation.lng), Number(selectedLocation.lat)],
      zoom: 12,
      duration: 800,
    })
  }, [selectedLocation])

  const handleDiscover = async () => {
    if (!selectedLocation?.id) return
    setLoading(true)
    setSelections(new globalThis.Map())
    try {
      const res = await authFetch(`${API}/api/v1/locations/${selectedLocation.id}/discover`)
      const data = await res.json()
      setCompetitors(data.data?.competitors || [])
    } catch {
      setCompetitors([])
    } finally {
      setLoading(false)
      setScanned(true)
    }
  }

  const setSelection = useCallback((comp: Competitor, action: 'track' | 'block' | null) => {
    const key = comp.id || comp.google_place_id
    setSelections((prev) => {
      const next = new globalThis.Map(prev)
      if (action === null) next.delete(key)
      else next.set(key, { competitor: comp, action })
      return next
    })
  }, [])

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
            }),
          })
          const compData = await compRes.json()
          competitorId = compData.data?.id || compData.id
        }
        if (!competitorId) continue
        await authFetch(`${API}/api/v1/locations/${selectedLocation!.id}/competitors`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ competitor_id: competitorId, slot_type: sel.action }),
        })
      }
      navigate('/command-center')
    } finally {
      setSaving(false)
    }
  }

  const trackCount = [...selections.values()].filter((s) => s.action === 'track').length
  const blockCount = [...selections.values()].filter((s) => s.action === 'block').length
  const estimatedCost = (trackCount + blockCount) * 100

  const centerLat = selectedLocation?.lat ? Number(selectedLocation.lat) : null
  const centerLng = selectedLocation?.lng ? Number(selectedLocation.lng) : null
  const radiusGeoJSON = centerLat && centerLng ? makeCircleGeoJSON(centerLat, centerLng, 5) : null

  // Filter competitors by operator type — fall back to showing all if business_type not set
  const filteredCompetitors = operatorType === 'both'
    ? competitors
    : competitors.filter(c => {
        const bt = (c as any).business_type
        return !bt || bt === operatorType
      })

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 128px)', minHeight: 560, maxHeight: 780 }}>

      {/* ── Map panel ── */}
      <div ref={mapContainerRef} style={{
        flex: '0 0 58%',
        position: 'relative',
        borderRadius: '8px 0 0 8px',
        overflow: 'hidden',
        border: '1px solid var(--border-subtle)',
        borderRight: 'none',
      }}>
        {MAPBOX_TOKEN && (
          <Map
            ref={mapRef}
            mapboxAccessToken={MAPBOX_TOKEN}
            initialViewState={CA_VIEWPORT}
            mapStyle={MAP_STYLES[mapStyleId][appTheme]}
            style={{ width: '100%', height: '100%' }}
            attributionControl={true}
            onLoad={handleMapLoad}
          >
            <NavigationControl position="top-right" showCompass={false} />

            {/* 5-mile radius ring around selected location */}
            {radiusGeoJSON && (
              <Source id="radius" type="geojson" data={radiusGeoJSON}>
                <Layer {...radiusFillLayer} />
                <Layer {...radiusOutlineLayer} />
              </Source>
            )}

            {/* Your location marker */}
            {centerLat && centerLng && (
              <Marker longitude={centerLng} latitude={centerLat} anchor="center">
                <div style={{
                  width: 14, height: 14, borderRadius: '50%',
                  background: '#1d9e75', border: '2px solid #e8e6e0',
                  boxShadow: '0 0 8px rgba(29,158,117,0.6)',
                }} title={selectedLocation?.name} />
              </Marker>
            )}

            {/* Competitor markers */}
            {competitors.map((comp) => {
              if (!comp.lat || !comp.lng) return null
              const key = comp.id || comp.google_place_id
              const sel = selections.get(key)
              const color = sel?.action === 'block' ? '#ba7517' : sel?.action === 'track' ? '#1d9e75' : '#4a4845'
              return (
                <Marker
                  key={key}
                  longitude={Number(comp.lng)}
                  latitude={Number(comp.lat)}
                  anchor="center"
                  onClick={() => setSelection(comp, sel ? null : 'track')}
                >
                  <div style={{
                    width: sel ? 11 : 8, height: sel ? 11 : 8,
                    borderRadius: '50%',
                    background: color,
                    border: '1.5px solid #0d0f11',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    boxShadow: sel ? `0 0 6px ${color}88` : 'none',
                  }} title={comp.name} />
                </Marker>
              )
            })}
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
        {!MAPBOX_TOKEN && (
          <div style={{
            width: '100%', height: '100%', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            background: 'var(--bg-surface)',
            fontFamily: 'Space Mono, monospace', fontSize: 11,
            color: 'var(--text-muted)', textAlign: 'center', padding: 32,
          }}>
            MAP UNCONFIGURED — set VITE_MAPBOX_TOKEN in Railway
          </div>
        )}

        {/* Radius label */}
        <div style={{
          position: 'absolute', top: 12, left: 12, pointerEvents: 'none',
          background: 'rgba(13,15,17,0.85)', border: '1px solid var(--border-default)',
          borderRadius: 4, padding: '4px 10px', backdropFilter: 'blur(6px)',
          fontFamily: 'Space Mono, monospace', fontSize: 10,
          color: 'var(--text-muted)', letterSpacing: '0.08em',
        }}>
          5-MILE RADIUS · CALIFORNIA
        </div>

        {/* Legend */}
        <div style={{
          position: 'absolute', bottom: 12, left: 12, pointerEvents: 'none',
          background: 'rgba(13,15,17,0.85)', border: '1px solid var(--border-default)',
          borderRadius: 4, padding: '8px 12px', backdropFilter: 'blur(6px)',
          display: 'flex', flexDirection: 'column', gap: 5,
        }}>
          {[
            { color: '#1d9e75', label: 'Your location' },
            { color: '#4a4845', label: 'Detected rivals' },
            { color: '#1d9e75', label: 'Selected — tracking' },
            { color: '#ba7517', label: 'Selected — blocked' },
          ].map((item) => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: item.color, flexShrink: 0,
                border: '1px solid rgba(255,255,255,0.15)',
              }} />
              <span style={{
                fontFamily: 'Space Mono, monospace', fontSize: 9,
                color: 'var(--text-muted)', letterSpacing: '0.04em',
              }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel ── */}
      <div style={{
        flex: '0 0 42%', display: 'flex', flexDirection: 'column',
        background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
        borderRadius: '0 8px 8px 0', overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
          <div style={{
            fontFamily: 'Space Mono, monospace', fontSize: 10,
            color: 'var(--accent-intel)', letterSpacing: '0.12em',
            textTransform: 'uppercase', marginBottom: 6,
          }}>
            Setup · Step 2 of 2
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
            Identify your rivals
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
            Track monitors prices and promotions. Block suppresses a rival from the platform entirely.
          </div>

          <div style={{ marginTop: 12 }}>
            <OperatorTypeFilter value={operatorType} onChange={setOperatorType} />
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 14, alignItems: 'center' }}>
            {locations.length > 1 && (
              <select
                value={selectedLocation?.id || ''}
                onChange={(e) => {
                  const loc = locations.find((l) => l.id === e.target.value) || null
                  setSelectedLocation(loc)
                }}
                style={{
                  flex: 1, background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)', borderRadius: 6,
                  padding: '7px 10px', color: 'var(--text-primary)',
                  fontSize: 12, fontFamily: 'DM Sans, sans-serif', outline: 'none', cursor: 'pointer',
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
          {competitors.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px' }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.65, maxWidth: 280, margin: '0 auto' }}>
                {loading
                  ? 'Scanning your market for rival dispensaries...'
                  : scanned
                    ? 'No rivals found in your area. You can add competitors manually from your dashboard.'
                    : 'Click "Scan market" to discover rivals within your 5-mile radius.'}
              </div>
              {!loading && !scanned && (
                <button className="btn btn-primary" style={{ marginTop: 20, fontSize: 12 }} onClick={handleDiscover}>
                  Scan nearby dispensaries
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {filteredCompetitors.map((comp) => {
                const key = comp.id || comp.google_place_id
                const sel = selections.get(key)
                const isBlocked = sel?.action === 'block'
                const isTracked = sel?.action === 'track'
                return (
                  <div key={key} style={{
                    background: isBlocked ? 'rgba(186,117,23,0.07)' : isTracked ? 'rgba(29,158,117,0.07)' : 'var(--bg-elevated)',
                    border: `1px solid ${isBlocked ? 'rgba(186,117,23,0.28)' : isTracked ? 'rgba(29,158,117,0.28)' : 'var(--border-subtle)'}`,
                    borderRadius: 6, padding: '10px 12px',
                    display: 'flex', alignItems: 'center', gap: 10,
                    transition: 'border-color 0.1s, background 0.1s',
                  }}>
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                      background: isBlocked ? 'var(--accent-block)' : isTracked ? 'var(--accent-intel)' : 'var(--text-muted)',
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>{comp.name}</div>
                      <div style={{
                        fontSize: 10, color: 'var(--text-muted)', fontFamily: 'Space Mono, monospace',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {comp.distance_miles ? `${comp.distance_miles.toFixed(1)} mi` : ''}
                        {comp.distance_miles && comp.address ? '  ·  ' : ''}
                        {comp.address}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                      <button
                        style={{
                          fontSize: 11, padding: '4px 10px', borderRadius: 4, cursor: 'pointer',
                          fontFamily: 'DM Sans, sans-serif', fontWeight: 500,
                          border: `1px solid ${isTracked ? 'var(--accent-intel)' : 'var(--border-default)'}`,
                          background: isTracked ? 'var(--accent-intel)' : 'transparent',
                          color: isTracked ? '#fff' : 'var(--text-secondary)',
                        }}
                        onClick={() => setSelection(comp, isTracked ? null : 'track')}
                      >Track</button>
                      <button
                        style={{
                          fontSize: 11, padding: '4px 10px', borderRadius: 4, cursor: 'pointer',
                          fontFamily: 'DM Sans, sans-serif', fontWeight: 500,
                          border: `1px solid ${isBlocked ? 'var(--accent-block)' : 'var(--border-default)'}`,
                          background: isBlocked ? 'var(--accent-block)' : 'transparent',
                          color: isBlocked ? '#fff' : 'var(--text-secondary)',
                        }}
                        onClick={() => setSelection(comp, isBlocked ? null : 'block')}
                      >Block this rival</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 16px', borderTop: '1px solid var(--border-subtle)',
          background: 'var(--bg-elevated)', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, gap: 12,
        }}>
          <div style={{ fontSize: 12, minWidth: 0 }}>
            {selections.size > 0 ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                {trackCount > 0 && <span style={{ color: 'var(--accent-intel)' }}>{trackCount} tracking</span>}
                {trackCount > 0 && blockCount > 0 && <span style={{ color: 'var(--text-muted)' }}>·</span>}
                {blockCount > 0 && <span style={{ color: 'var(--accent-block)' }}>{blockCount} blocked</span>}
                <span style={{ color: 'var(--text-secondary)', fontFamily: 'Space Mono, monospace', fontSize: 11 }}>
                  ${estimatedCost}/mo
                </span>
              </span>
            ) : (
              <span style={{ color: 'var(--text-muted)', fontSize: 11, fontFamily: 'Space Mono, monospace' }}>
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
  )
}
