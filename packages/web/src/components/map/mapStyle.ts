// ============================================================
// CannaSpy Map — style configuration
// ============================================================
// Dark style tuned to the CannaSpy palette (BRAND.md).
// Two options: (a) point to a custom Mapbox Studio style URL, or
// (b) use Mapbox's `dark-v11` and layer our paint overrides on top.
//
// Option (b) is the default so the scaffold works with a fresh
// Mapbox account, zero Studio configuration required. Swap to a
// Studio URL once the design team builds one.

/** CannaSpy palette — single source of truth. Mirrors BRAND.md. */
export const PALETTE = {
  bgBase: '#0d0f11',
  bgSurface: '#141618',
  bgElevated: '#1a1d20',
  borderSubtle: 'rgba(255,255,255,0.07)',
  borderDefault: 'rgba(255,255,255,0.12)',
  textPrimary: '#e8e6e0',
  textSecondary: '#7a7870',
  textMuted: '#4a4845',
  accentIntel: '#1d9e75', // teal — tracked / monitoring / positive delta
  accentBlock: '#ba7517', // amber — suppressed / warning
  accentTrust: '#3b8bd4', // blue — data-trust / delivery operators
  accentAlert: '#d4537e', // coral — alerts / exposure
  accentRoi: '#8b5cf6', // purple — reserved
} as const

/**
 * Default Mapbox style. `dark-v11` renders roads/labels/water in grayscale,
 * which we'll paint-override to our palette via layer `paint` props.
 *
 * To use a custom CannaSpy Studio style: set VITE_MAPBOX_STYLE_URL.
 */
export const CANNASPY_STYLE_URL: string =
  import.meta.env.VITE_MAPBOX_STYLE_URL ?? 'mapbox://styles/mapbox/dark-v11'

/** Access token — browser-exposed, restrict by URL in Mapbox dashboard. */
export const MAPBOX_TOKEN: string = import.meta.env.VITE_MAPBOX_TOKEN ?? ''

/**
 * Paint overrides applied after the base style loads. Keeps the
 * scaffold working with `dark-v11` while matching CannaSpy colors.
 * Call from the `load` event: `map.setPaintProperty(...)`.
 */
export const BASE_PAINT_OVERRIDES: Array<{
  layer: string
  property: string
  value: string
}> = [
  { layer: 'background', property: 'background-color', value: PALETTE.bgBase },
  { layer: 'water', property: 'fill-color', value: '#09090b' },
  { layer: 'land', property: 'background-color', value: PALETTE.bgBase },
  // Road tweaks are style-version specific. If a layer is missing
  // on a given style, setPaintProperty no-ops — safe to attempt.
]

/** True iff a token is configured. Gate rendering on this. */
export function isMapConfigured(): boolean {
  return Boolean(MAPBOX_TOKEN)
}
