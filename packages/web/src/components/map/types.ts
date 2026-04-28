// ============================================================
// CannaSpy Map — shared types
// ============================================================
// Used by CannaSpyMap, layer builders, and data hooks.
// Keep this file the single source of truth for map-domain types.

export type LicenseType = 'retail' | 'delivery' | 'microbusiness'

export type MarketTier = 'standard' | 'competitive' | 'hot' | 'elite'

export type TrackState = 'untracked' | 'tracked' | 'blocked'

/** A single competitor point rendered on the map. */
export interface CompetitorFeatureProps {
  id: string
  name: string
  license_type: LicenseType
  address?: string
  dcc_license?: string
  /** Market-heat score 0–1 — drives choropleth and heatmap intensity. */
  heat_score?: number
  market_tier?: MarketTier
  /** Relationship to the currently selected org. */
  track_state?: TrackState
  /** Median price of a reference SKU in this zip (for hover detail). */
  median_price?: number | null
}

/** Zip-code polygon feature for the choropleth. */
export interface ZipHeatFeatureProps {
  zip: string
  /** Count of active delivery operators covering this zip. */
  delivery_operators: number
  /** Count of retail storefronts inside this zip. */
  storefronts: number
  /** Weighted density score 0–1. */
  density: number
  market_tier?: MarketTier
}

/** Viewport state — controlled from the parent. */
export interface MapViewport {
  longitude: number
  latitude: number
  zoom: number
  bearing?: number
  pitch?: number
}

/** Default viewport — centered on California, full-state view. */
export const CALIFORNIA_VIEWPORT: MapViewport = {
  longitude: -119.4179,
  latitude: 36.7783,
  zoom: 5.4,
  bearing: 0,
  pitch: 0,
}

/** Zoom breakpoints — keep layer visibility consistent across the app. */
export const ZOOM = {
  /** Statewide choropleth only. */
  STATE: 5,
  /** County/zip fills dominant, clusters start appearing. */
  REGION: 7,
  /** Clusters + zip fills. */
  METRO: 9,
  /** Individual markers revealed. */
  NEIGHBORHOOD: 11,
  /** Detail zoom — delivery polygon overlays, street-level pins. */
  DETAIL: 13,
} as const
