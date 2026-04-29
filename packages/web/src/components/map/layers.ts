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
//  BLOCKED   → amber   (track_state === 'blocked')
//  ENRICHED  → tier-matched color (enriched === true)
//  PROSPECT  → dim grey (default — DCC record, no intel yet)
//
// Opacity also varies: enriched pins are solid, prospects are dim.
// This lets the user see the full universe of CA dispensaries while
// clearly identifying which ones have CannaSpy coverage.

export const dispensaryClusterLayer: LayerProps = {
  id: 'cs-dispensary-cluster',
  type: 'circle',
  source: SOURCE.DISPENSARIES,
  filter: ['has', 'point_count'],
  paint: {
    'circle-color': [
      'step',
      ['get', 'point_count'],
      PALETTE.accentTrust, 20,
      PALETTE.accentBlock, 100,
      PALETTE.accentAlert,
    ],
    'circle-radius': [
      'step',
      ['get', 'point_count'],
      12, 20,
      18, 100,
      24,
    ],
    'circle-stroke-color': PALETTE.bgBase,
    'circle-stroke-width': 1.5,
    'circle-opacity': 0.88,
  },
}

export const dispensaryClusterCountLayer: LayerProps = {
  id: 'cs-dispensary-cluster-count',
  type: 'symbol',
  source: SOURCE.DISPENSARIES,
  filter: ['has', 'point_count'],
  layout: {
    'text-field': ['get', 'point_count_abbreviated'],
    'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
    'text-size': 10,
  },
  paint: {
    'text-color': PALETTE.bgBase,
  },
}

export const dispensaryPointLayer: LayerProps = {
  id: 'cs-dispensary-point',
  type: 'circle',
  source: SOURCE.DISPENSARIES,
  filter: ['!', ['has', 'point_count']],
  paint: {
    'circle-color': [
      'case',
      // Blocked → amber, always highest priority
      ['==', ['get', 'track_state'], 'blocked'], '#d4900a',
      // Enriched → tier-matched color
      ['==', ['get', 'enriched'], true],
        ['match', ['get', 'market_tier'],
          'elite',       '#e05a6a',
          'hot',         '#d4900a',
          'competitive', '#09A1A1',
          'standard',    '#5484A4',
          /* default */  '#5484A4',
        ],
      // Prospect → dim grey
      'rgba(160,155,148,0.5)',
    ] as unknown as string,
    'circle-radius': [
      'interpolate', ['linear'], ['zoom'],
      9, 3,
      13, 6,
      16, 9,
    ],
    'circle-stroke-color': PALETTE.bgBase,
    'circle-stroke-width': 1,
    'circle-opacity': [
      'case',
      ['==', ['get', 'enriched'], true], 0.9,
      ['==', ['get', 'track_state'], 'blocked'], 0.95,
      0.4,
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
