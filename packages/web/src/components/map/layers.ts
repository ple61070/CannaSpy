// ============================================================
// CannaSpy Map — layer definitions
// ============================================================
// All Mapbox layer specs live here. The component composes them;
// it does not author them inline. Keeps paint/layout config in one
// auditable place.

import type { LayerProps } from 'react-map-gl'
import { PALETTE } from './mapStyle'
import { ZOOM } from './types'

// ------------------------------------------------------------
// Source IDs — referenced by layers and by data updates.
// ------------------------------------------------------------
export const SOURCE = {
  COMPETITORS: 'cs-competitors',
  DISPENSARIES: 'cs-dispensaries',
  ZIP_HEAT: 'cs-zip-heat',
  DELIVERY_ZONES: 'cs-delivery-zones',
} as const

// ------------------------------------------------------------
// Zip-code choropleth (market-heat at statewide / metro zoom)
// ------------------------------------------------------------
// Drives off `density` (0–1) on each zip feature. Fill gradient:
//   low density  → bg-surface (nearly invisible)
//   high density → coral (alert) with higher opacity
// Only visible at state/region/metro zooms — fades out before
// individual pins come in, so the map never looks busy.
export const zipHeatFillLayer: LayerProps = {
  id: 'cs-zip-heat-fill',
  type: 'fill',
  source: SOURCE.ZIP_HEAT,
  maxzoom: ZOOM.NEIGHBORHOOD,
  paint: {
    'fill-color': [
      'interpolate',
      ['linear'],
      ['coalesce', ['get', 'density'], 0],
      0, PALETTE.bgSurface,
      0.25, PALETTE.accentTrust,
      0.5, PALETTE.accentBlock,
      0.75, PALETTE.accentAlert,
      1.0, '#ff4470',
    ],
    'fill-opacity': [
      'interpolate',
      ['linear'],
      ['zoom'],
      ZOOM.STATE, 0.55,
      ZOOM.METRO, 0.40,
      ZOOM.NEIGHBORHOOD, 0.0, // fade out as pins appear
    ],
  },
}

export const zipHeatOutlineLayer: LayerProps = {
  id: 'cs-zip-heat-outline',
  type: 'line',
  source: SOURCE.ZIP_HEAT,
  maxzoom: ZOOM.NEIGHBORHOOD,
  paint: {
    'line-color': PALETTE.borderSubtle,
    'line-width': 0.5,
  },
}

// ------------------------------------------------------------
// Heatmap (competitor density as a smooth surface)
// ------------------------------------------------------------
// Good secondary view — complements the zip choropleth with a
// smoother, non-polygon density signal. Toggle via a UI control.
export const competitorHeatmapLayer: LayerProps = {
  id: 'cs-competitor-heatmap',
  type: 'heatmap',
  source: SOURCE.COMPETITORS,
  maxzoom: ZOOM.METRO + 1,
  paint: {
    'heatmap-weight': [
      'interpolate',
      ['linear'],
      ['coalesce', ['get', 'heat_score'], 0.5],
      0, 0.2,
      1, 1.0,
    ],
    'heatmap-intensity': [
      'interpolate',
      ['linear'],
      ['zoom'],
      ZOOM.STATE, 1,
      ZOOM.METRO, 3,
    ],
    'heatmap-color': [
      'interpolate',
      ['linear'],
      ['heatmap-density'],
      0, 'rgba(13,15,17,0)',
      0.2, 'rgba(59,139,212,0.35)', // trust-blue
      0.5, 'rgba(186,117,23,0.55)', // amber
      0.8, 'rgba(212,83,126,0.70)', // coral
      1.0, 'rgba(255,68,112,0.85)',
    ],
    'heatmap-radius': [
      'interpolate',
      ['linear'],
      ['zoom'],
      ZOOM.STATE, 10,
      ZOOM.METRO, 28,
    ],
    'heatmap-opacity': [
      'interpolate',
      ['linear'],
      ['zoom'],
      ZOOM.METRO, 0.85,
      ZOOM.METRO + 1, 0,
    ],
  },
}

// ------------------------------------------------------------
// Cluster bubbles (competitor counts, mid-zoom)
// ------------------------------------------------------------
export const clusterCircleLayer: LayerProps = {
  id: 'cs-clusters',
  type: 'circle',
  source: SOURCE.COMPETITORS,
  filter: ['has', 'point_count'],
  minzoom: ZOOM.REGION,
  paint: {
    'circle-color': [
      'step',
      ['get', 'point_count'],
      PALETTE.accentTrust, 10,
      PALETTE.accentBlock, 50,
      PALETTE.accentAlert,
    ],
    'circle-radius': [
      'step',
      ['get', 'point_count'],
      14, 10,
      20, 50,
      28,
    ],
    'circle-stroke-color': PALETTE.bgBase,
    'circle-stroke-width': 2,
    'circle-opacity': 0.92,
  },
}

export const clusterCountLayer: LayerProps = {
  id: 'cs-cluster-count',
  type: 'symbol',
  source: SOURCE.COMPETITORS,
  filter: ['has', 'point_count'],
  minzoom: ZOOM.REGION,
  layout: {
    'text-field': ['get', 'point_count_abbreviated'],
    'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
    'text-size': 11,
  },
  paint: {
    'text-color': PALETTE.bgBase,
  },
}

// ------------------------------------------------------------
// Individual competitor markers
// ------------------------------------------------------------
// Color by track_state: teal=tracked, amber=blocked,
// trust-blue=delivery operator, textSecondary=untracked.
// Slightly smaller ring for delivery so retail storefronts read first.
export const competitorPointLayer: LayerProps = {
  id: 'cs-competitor-point',
  type: 'circle',
  source: SOURCE.COMPETITORS,
  filter: ['!', ['has', 'point_count']],
  minzoom: ZOOM.METRO,
  paint: {
    'circle-color': [
      'match',
      ['coalesce', ['get', 'track_state'], 'untracked'],
      'blocked', PALETTE.accentBlock,
      'tracked', PALETTE.accentIntel,
      /* default */ [
        'match',
        ['coalesce', ['get', 'license_type'], 'retail'],
        'delivery', PALETTE.accentTrust,
        /* default */ PALETTE.textSecondary,
      ],
    ],
    'circle-radius': [
      'interpolate',
      ['linear'],
      ['zoom'],
      ZOOM.METRO, 4,
      ZOOM.DETAIL, 7,
    ],
    'circle-stroke-color': PALETTE.bgBase,
    'circle-stroke-width': 1.5,
    'circle-opacity': 0.95,
  },
}

// ------------------------------------------------------------
// Live dispensary pins — three-state visual system
// ------------------------------------------------------------
// Driven by track_state + enriched from /api/v1/map/dispensaries.
//
//  BLOCKED   → amber  #ba7517  opacity 1.0   radius 6px  (power action)
//  ENRICHED  → teal   #1d9e75  opacity 1.0   radius 6px  (active intel)
//  PROSPECT  → teal   #1d9e75  opacity 0.65  radius 5px  (opportunity)
//
// Prospect uses the same teal family as enriched — the map looks alive
// on first load. Opacity + size distinguish the relationship hierarchy.
// Hover activates via feature-state (requires promoteId="id" on Source).

export const dispensaryClusterLayer: LayerProps = {
  id: 'cs-dispensary-cluster',
  type: 'circle',
  source: SOURCE.DISPENSARIES,
  filter: ['has', 'point_count'],
  paint: {
    'circle-color': PALETTE.accentIntel,
    'circle-radius': [
      'step',
      ['get', 'point_count'],
      24, 10,
      30, 50,
      36,
    ] as unknown as number,
    'circle-stroke-color': PALETTE.bgBase,
    'circle-stroke-width': 1.5,
    'circle-opacity': 1,
  },
}

export const dispensaryClusterCountLayer: LayerProps = {
  id: 'cs-dispensary-cluster-count',
  type: 'symbol',
  source: SOURCE.DISPENSARIES,
  filter: ['has', 'point_count'],
  layout: {
    'text-field': ['get', 'point_count_abbreviated'],
    // Space Mono is not a Mapbox glyph font — use closest available
    'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
    'text-size': 12,
  },
  paint: {
    'text-color': '#ffffff',
  },
}

export const dispensaryPointLayer: LayerProps = {
  id: 'cs-dispensary-point',
  type: 'circle',
  source: SOURCE.DISPENSARIES,
  filter: ['!', ['has', 'point_count']],
  paint: {
    // Blocked is amber; prospect + enriched share teal — opacity tells them apart.
    'circle-color': [
      'case',
      ['==', ['get', 'track_state'], 'blocked'], PALETTE.accentBlock,
      PALETTE.accentIntel,
    ] as unknown as string,
    // Base radius: 6px for blocked/enriched, 5px for prospect.
    // Adds 2px on hover via feature-state (activate by adding promoteId="id" to Source).
    'circle-radius': [
      '+',
      ['case',
        ['==', ['get', 'track_state'], 'blocked'],  6,
        ['boolean', ['get', 'enriched'], false],     6,
        5,
      ],
      ['case', ['boolean', ['feature-state', 'hover'], false], 2, 0],
    ] as unknown as number,
    'circle-stroke-color': PALETTE.bgBase,
    'circle-stroke-width': 1.5,
    // Prospect: 65% opacity — looks alive, not empty. Enriched/blocked: 100%. Hover: always 100%.
    'circle-opacity': [
      'case',
      ['boolean', ['feature-state', 'hover'], false],  1,
      ['==', ['get', 'track_state'], 'blocked'],        1,
      ['boolean', ['get', 'enriched'], false],           1,
      0.65,
    ] as unknown as number,
  },
}

// ------------------------------------------------------------
// Delivery service coverage polygons (opt-in overlay)
// ------------------------------------------------------------
// Rendered only when a specific delivery operator is selected from
// the sidebar. Keeps the map readable — we never draw all delivery
// zones at once (hundreds of overlapping polygons = visual chaos).
export const deliveryCoverageFillLayer: LayerProps = {
  id: 'cs-delivery-coverage-fill',
  type: 'fill',
  source: SOURCE.DELIVERY_ZONES,
  paint: {
    'fill-color': PALETTE.accentTrust,
    'fill-opacity': 0.18,
  },
}

export const deliveryCoverageOutlineLayer: LayerProps = {
  id: 'cs-delivery-coverage-outline',
  type: 'line',
  source: SOURCE.DELIVERY_ZONES,
  paint: {
    'line-color': PALETTE.accentTrust,
    'line-width': 1.5,
    'line-dasharray': [2, 2],
  },
}

// ------------------------------------------------------------
// Layer render order (bottom → top)
// ------------------------------------------------------------
// Export the canonical stack so the component can map over it.
export const LAYER_STACK: LayerProps[] = [
  zipHeatFillLayer,
  zipHeatOutlineLayer,
  deliveryCoverageFillLayer,
  deliveryCoverageOutlineLayer,
  competitorHeatmapLayer,
  clusterCircleLayer,
  clusterCountLayer,
  competitorPointLayer,
]
