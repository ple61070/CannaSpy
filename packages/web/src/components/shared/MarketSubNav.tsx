/**
 * MarketSubNav — shared sub-navigation bar for all Market Intelligence pages.
 * Uses useLocation() so the active pill always reflects the actual current route.
 */

import { useNavigate, useLocation } from 'react-router-dom'

const MARKET_TABS = [
  { label: 'Heat Map',      route: '/market/heat-map' },
  { label: 'Rival Ranking', route: '/market/ranking' },
  { label: 'My Benchmarks', route: '/market/benchmarks' },
  { label: 'SKU Gaps',      route: '/market/sku-gaps' },
  { label: 'Deal Patterns', route: '/market/deals' },
]

export function MarketSubNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <div style={{
      display: 'flex',
      background: 'var(--surface-2)',
      borderBottom: '1px solid var(--border)',
      padding: '0 24px',
      flexShrink: 0,
      overflowX: 'auto',
    }}>
      {MARKET_TABS.map(tab => {
        const active = pathname === tab.route
        return (
          <div
            key={tab.route}
            onClick={() => navigate(tab.route)}
            style={{
              padding: '10px 16px',
              fontSize: 12,
              fontWeight: 600,
              color: active ? 'var(--accent)' : 'var(--text-3)',
              cursor: 'pointer',
              borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'color 0.15s, border-color 0.15s',
              userSelect: 'none',
            }}
            onMouseEnter={e => {
              if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--text-1)'
            }}
            onMouseLeave={e => {
              if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--text-3)'
            }}
          >
            {tab.label}
          </div>
        )
      })}
    </div>
  )
}
