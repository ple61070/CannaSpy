// ============================================================
// CannaSpyMap — primary map surface
// ============================================================
// Composes react-map-gl with the CannaSpy dark style, layer stack,
// clustering, heatmap, and delivery coverage overlays.
//
// Data model:
//   - `competitors` : FeatureCollection<Point, CompetitorFeatureProps>
//                     Single GeoJSON source drives clusters, heatmap,
//                     and individual markers — clustering is handled
//                     by Mapbox natively via `cluster: true`.
//   - `zipHeat`     : FeatureCollection<Polygon, ZipHeatFeatureProps>
//                     Choropleth input — expected to come from a
//                     cached vector tileset in prod. Accepts raw
//                     GeoJSON for dev/testing.
//   - `deliveryZones`: optional FeatureCollection<Polygon>
//                      Only the *selected* delivery operator's zones
//                      — never the full set (see BRAND.md: war room,
//                      not wellness; readable, not busy).
//
// The component is intentionally data-agnostic. Fetching, auth, and
// aggregation happen in the parent page (pattern matches existing
// CompetitorDiscovery.tsx). The map's job is to render, cluster,
// and surface interactions.

import { useCallback, useMemo, useRef, useState } from 'react'
import Map, {
  Source,
  Layer,
  Popup,
  NavigationControl,
  ScaleControl,
  type MapRef,
  type MapMouseEvent,
} from 'react-map-gl'
import type { FeatureCollection, Point, Polygon } from 'geojson'
import 'mapbox-gl/dist/mapbox-gl.css'

import {
  CANNASPY_STYLE_URL,
  MAPBOX_TOKEN,
  BASE_PAINT_OVERRIDES,
  PALETTE,
  isMapConfigured,
} from './mapStyle'
import {
  SOURCE,
  zipHeatFillLayer,
  zipHeatOutlineLayer,
  competitorHeatmapLayer,
  clusterCircleLayer,
  clusterCountLayer,
  competitorPointLayer,
  deliveryCoverageFillLayer,
  deliveryCoverageOutlineLayer,
} from './layers'
import {
  CALIFORNIA_VIEWPORT,
  type CompetitorFeatureProps,
  type MapViewport,
  type ZipHeatFeatureProps,
} from './types'

// ------------------------------------------------------------
// Props
// ------------------------------------------------------------
export interface CannaSpyMapProps {
  competitors: FeatureCollection<Point, CompetitorFeatureProps>
  zipHeat?: FeatureCollection<Polygon, ZipHeatFeatureProps>
  deliveryZones?: FeatureCollection<Polygon>
  initialViewport?: MapViewport

  /** Visibility toggles — parent controls via sidebar checkboxes. */
  showHeatmap?: boolean
  showZipHeat?: boolean
  showClusters?: boolean
  showPoints?: boolean
  showDeliveryZones?: boolean

  /** Fired when a marker is clicked. */
  onCompetitorClick?: (c: CompetitorFeatureProps) => void

  /** Full-width by default; override for split-panel layouts. */
  className?: string
  style?: React.CSSProperties
}

// ------------------------------------------------------------
// Component
// ------------------------------------------------------------
export default function CannaSpyMap({
  competitors,
  zipHeat,
  deliveryZones,
  initialViewport = CALIFORNIA_VIEWPORT,
  showHeatmap = true,
  showZipHeat = true,
  showClusters = true,
  showPoints = true,
  showDeliveryZones = true,
  onCompetitorClick,
  className,
  style,
}: CannaSpyMapProps) {
  const mapRef = useRef<MapRef | null>(null)
  const [popup, setPopup] = useState<{
    lng: number
    lat: number
    props: CompetitorFeatureProps
  } | null>(null)

  // --- No-token placeholder (mirrors CompetitorDiscovery's pattern) ---
  if (!isMapConfigured()) {
    return (
      <div
        className={className}
        style={{
          background: PALETTE.bgSurface,
          border: `1px solid ${PALETTE.borderSubtle}`,
          borderRadius: 8,
          padding: 32,
          color: PALETTE.textSecondary,
          fontFamily: 'Space Mono, monospace',
          fontSize: 12,
          lineHeight: 1.6,
          ...style,
        }}
      >
        MAP UNCONFIGURED — set <code>VITE_MAPBOX_TOKEN</code> in the environment
        to enable the intelligence map.
      </div>
    )
  }

  // --- Apply CannaSpy paint overrides once the base style loads ---
  const handleLoad = useCallback(() => {
    const map = mapRef.current?.getMap()
    if (!map) return
    for (const { layer, property, value } of BASE_PAINT_OVERRIDES) {
      try {
        map.setPaintProperty(layer, property, value)
      } catch {
        // Layer may not exist in the chosen base style — safe to skip.
      }
    }
  }, [])

  // --- Cluster click: expand to the cluster's leaves ---
  const handleClick = useCallback(
    (e: MapMouseEvent) => {
      const map = mapRef.current?.getMap()
      if (!map) return
      const features = map.queryRenderedFeatures(e.point, {
        layers: [clusterCircleLayer.id!, competitorPointLayer.id!],
      })
      if (!features.length) {
        setPopup(null)
        return
      }
      const feature = features[0] as any
      const isCluster = feature.properties?.cluster === true
      if (isCluster) {
        const clusterId = feature.properties.cluster_id
        const source = map.getSource(SOURCE.COMPETITORS) as any
        source.getClusterExpansionZoom(
          clusterId,
          (err: Error | null, zoom: number) => {
            if (err) return
            map.easeTo({
              center: feature.geometry.coordinates,
              zoom,
              duration: 400,
            })
          },
        )
        return
      }
      // Individual competitor — show popup + notify parent.
      const props = feature.properties as CompetitorFeatureProps
      const [lng, lat] = feature.geometry.coordinates
      setPopup({ lng, lat, props })
      onCompetitorClick?.(props)
    },
    [onCompetitorClick],
  )

  // --- Cursor hint: pointer over interactive layers ---
  const interactiveLayerIds = useMemo(
    () => [clusterCircleLayer.id!, competitorPointLayer.id!],
    [],
  )

  // --- Layer visibility via `layout.visibility` ---
  // Cheap way to toggle layers without tearing them down.
  const vis = (show: boolean) =>
    ({ visibility: show ? 'visible' : 'none' }) as const

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: PALETTE.bgBase,
        ...style,
      }}
    >
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={initialViewport}
        mapStyle={CANNASPY_STYLE_URL}
        style={{ width: '100%', height: '100%' }}
        onLoad={handleLoad}
        onClick={handleClick}
        interactiveLayerIds={interactiveLayerIds}
        attributionControl={{ compact: true }}
        cursor="default"
      >
        <NavigationControl
          position="top-right"
          showCompass={false}
          visualizePitch={false}
        />
        <ScaleControl position="bottom-left" unit="imperial" />

        {/* Zip choropleth — bottom of stack */}
        {zipHeat && (
          <Source id={SOURCE.ZIP_HEAT} type="geojson" data={zipHeat}>
            <Layer {...zipHeatFillLayer} layout={vis(showZipHeat)} />
            <Layer {...zipHeatOutlineLayer} layout={vis(showZipHeat)} />
          </Source>
        )}

        {/* Selected delivery operator's coverage polygons */}
        {deliveryZones && (
          <Source
            id={SOURCE.DELIVERY_ZONES}
            type="geojson"
            data={deliveryZones}
          >
            <Layer
              {...deliveryCoverageFillLayer}
              layout={vis(showDeliveryZones)}
            />
            <Layer
              {...deliveryCoverageOutlineLayer}
              layout={vis(showDeliveryZones)}
            />
          </Source>
        )}

        {/* Competitor points — clustered GeoJSON source powers three layers */}
        <Source
          id={SOURCE.COMPETITORS}
          type="geojson"
          data={competitors}
          cluster
          clusterMaxZoom={10}
          clusterRadius={45}
        >
          <Layer {...competitorHeatmapLayer} layout={vis(showHeatmap)} />
          <Layer {...clusterCircleLayer} layout={vis(showClusters)} />
          <Layer {...clusterCountLayer} layout={vis(showClusters)} />
          <Layer {...competitorPointLayer} layout={vis(showPoints)} />
        </Source>

        {/* Hover/click popup */}
        {popup && (
          <Popup
            longitude={popup.lng}
            latitude={popup.lat}
            anchor="bottom"
            closeOnClick={false}
            onClose={() => setPopup(null)}
            offset={12}
          >
            <CompetitorPopupBody props={popup.props} />
          </Popup>
        )}
      </Map>

      {/* Legend — bottom-right, matches BRAND.md typography */}
      <div
        style={{
          position: 'absolute',
          right: 12,
          bottom: 12,
          background: PALETTE.bgSurface,
          border: `1px solid ${PALETTE.borderSubtle}`,
          borderRadius: 6,
          padding: '8px 10px',
          fontFamily: 'Space Mono, monospace',
          fontSize: 10,
          color: PALETTE.textSecondary,
          lineHeight: 1.8,
          letterSpacing: '0.03em',
        }}
      >
        <LegendDot color={PALETTE.accentIntel} label="TRACKED" />
        <LegendDot color={PALETTE.accentBlock} label="BLOCKED" />
        <LegendDot color={PALETTE.accentTrust} label="DELIVERY" />
        <LegendDot color={PALETTE.textSecondary} label="PROSPECT" />
      </div>
    </div>
  )
}

// ------------------------------------------------------------
// Popup body — BRAND.md voice: factual, monospace numbers
// ------------------------------------------------------------
function CompetitorPopupBody({ props }: { props: CompetitorFeatureProps }) {
  return (
    <div
      style={{
        minWidth: 220,
        fontFamily: 'DM Sans, sans-serif',
        fontSize: 12,
        color: PALETTE.textPrimary,
        background: PALETTE.bgSurface,
        padding: 10,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{props.name}</div>
      {props.address && (
        <div
          style={{
            color: PALETTE.textSecondary,
            fontSize: 11,
            marginBottom: 6,
          }}
        >
          {props.address}
        </div>
      )}
      <div
        style={{
          display: 'flex',
          gap: 12,
          fontFamily: 'Space Mono, monospace',
          fontSize: 10,
          color: PALETTE.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        <span>{props.license_type}</span>
        {props.market_tier && <span>{props.market_tier}</span>}
        {props.track_state && props.track_state !== 'untracked' && (
          <span
            style={{
              color:
                props.track_state === 'blocked'
                  ? PALETTE.accentBlock
                  : PALETTE.accentIntel,
            }}
          >
            {props.track_state.toUpperCase()}
          </span>
        )}
      </div>
      {props.median_price != null && (
        <div
          style={{
            marginTop: 6,
            fontFamily: 'Space Mono, monospace',
            fontSize: 11,
          }}
        >
          median 1g: ${props.median_price.toFixed(2)}
        </div>
      )}
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: color,
          display: 'inline-block',
        }}
      />
      {label}
    </div>
  )
}
