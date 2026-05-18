import { useState, useEffect } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { UserButton } from '@clerk/clerk-react'
import { useStore } from '../../store'
import cannaspyIcon from '../../assets/cannaspy-icon.png'

// ── SVG Icons (inline, matching HTML prototype) ──────────────────────────
const Icons = {
  home: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  bell: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  barChart: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  tag: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
  ),
  shield: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  mapPin: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  creditCard: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  ),
  settings: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  sun: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  ),
  moon: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  ),
}

// Extra icons needed for new nav items
const ExtraIcons = {
  map: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
    </svg>
  ),
  trendingUp: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  target: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
    </svg>
  ),
  package: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
  percent: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>
    </svg>
  ),
  shieldOff: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19.69 14a6.9 6.9 0 0 0 .31-2V5l-8-3-3.16 1.18"/><path d="M4.73 4.73L4 5v7c0 6 8 10 8 10a20.29 20.29 0 0 0 5.62-4.38"/><line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ),
  messageSquare: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  checkSquare: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
  ),
  lock: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  database: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
    </svg>
  ),
}

const navItems = [
  // Setup / Onboarding
  { label: 'Org Setup',       path: '/setup/org',               icon: ExtraIcons.checkSquare,  group: 'Setup' },
  { label: 'Add Locations',   path: '/setup/locations',         icon: Icons.mapPin,            group: 'Setup' },
  { label: 'Add Competitors', path: '/setup/competitors',       icon: ExtraIcons.target,       group: 'Setup' },

  // Intelligence
  { label: 'Command Center',  path: '/command-center',          icon: Icons.home,              group: 'Intelligence' },
  { label: 'Alert Feed',      path: '/alerts',                  icon: Icons.bell,              group: 'Intelligence' },
  { label: 'Price Intel',     path: '/prices',                  icon: Icons.barChart,          group: 'Intelligence' },
  { label: 'Price History',   path: '/prices/history',          icon: ExtraIcons.trendingUp,   group: 'Intelligence' },
  { label: 'Catalog Compare', path: '/prices/catalog',          icon: ExtraIcons.package,      group: 'Intelligence' },
  { label: 'Brand Coverage',  path: '/prices/brands',           icon: ExtraIcons.target,       group: 'Intelligence' },
  { label: 'Promotions',      path: '/promotions',              icon: Icons.tag,               group: 'Intelligence' },

  // Market
  { label: 'Heat Map',        path: '/market/heat-map',         icon: ExtraIcons.map,          group: 'Market' },
  { label: 'Rival Ranking',   path: '/market/ranking',          icon: ExtraIcons.trendingUp,   group: 'Market' },
  { label: 'My Benchmarks',   path: '/market/benchmarks',       icon: ExtraIcons.target,       group: 'Market' },
  { label: 'SKU Gaps',        path: '/market/sku-gaps',         icon: ExtraIcons.package,      group: 'Market' },
  { label: 'Deal Patterns',   path: '/market/deals',            icon: ExtraIcons.percent,      group: 'Market' },

  // Rivals
  { label: 'Block Management',path: '/blocks',                  icon: Icons.shield,            group: 'Rivals' },
  { label: 'Block Analytics', path: '/blocks/analytics',        icon: ExtraIcons.shieldOff,    group: 'Rivals' },

  // Team
  { label: 'Annotations',     path: '/team/annotations',        icon: ExtraIcons.messageSquare,group: 'Team' },
  { label: 'Action Queue',    path: '/actions',                 icon: ExtraIcons.checkSquare,  group: 'Team' },

  // Account
  { label: 'Locations',       path: '/locations',               icon: Icons.mapPin,            group: 'Account' },
  { label: 'Billing',         path: '/billing',                 icon: Icons.creditCard,        group: 'Account' },
  { label: 'Notifications',   path: '/settings/notifications',  icon: Icons.settings,          group: 'Account' },
  { label: 'Location Access', path: '/settings/location-access',icon: ExtraIcons.lock,         group: 'Account' },
  { label: 'Data Trust',      path: '/data-trust',              icon: ExtraIcons.database,     group: 'Account' },
]

function LogoIcon() {
  return (
    <img
      src={cannaspyIcon}
      alt="CannaSpy"
      style={{
        width: 54, height: 54,
        flexShrink: 0,
      }}
    />
  )
}

export default function Layout() {
  const unreviewedAlertCount = useStore((s) => s.unreviewedAlertCount)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('cs-theme') as 'light' | 'dark') || 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('cs-theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light')

  // Group nav items
  const groups = ['Setup', 'Intelligence', 'Market', 'Rivals', 'Team', 'Account']

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', position: 'relative', zIndex: 1 }}>

      {/* ── Nav Rail ── */}
      <aside
        className="nav-sidebar-root"
        style={{
          width: 'var(--rail-w)',
          background: 'var(--rail-bg)',
          borderRight: '1px solid var(--rail-divider)',
          color: 'var(--rail-fg)',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          transition: 'width 0.22s var(--ease-spring)',
          overflow: 'hidden',
          position: 'relative',
          zIndex: 40,
        }}
        onMouseEnter={e => {
          const el = e.currentTarget
          el.style.width = 'var(--rail-expanded-w)'
          el.style.boxShadow = '8px 0 40px -8px rgba(0,0,0,0.45)'
          el.style.zIndex = '50'
          el.querySelectorAll<HTMLElement>('.rail-label, .rail-group-label, .theme-text, .pill-toggle').forEach(l => {
            l.style.opacity = '1'
          })
        }}
        onMouseLeave={e => {
          const el = e.currentTarget
          el.style.width = 'var(--rail-w)'
          el.style.boxShadow = 'none'
          el.style.zIndex = '40'
          el.querySelectorAll<HTMLElement>('.rail-label, .rail-group-label, .theme-text, .pill-toggle').forEach(l => {
            l.style.opacity = '0'
          })
        }}
      >
        {/* Ambient teal glow */}
        <div style={{
          position: 'absolute', top: -40, left: -40, width: 200, height: 200,
          background: 'radial-gradient(circle, rgba(11,213,213,0.10), transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ padding: '18px 0', display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', zIndex: 1 }}>

          {/* Logo */}
          <div style={{ padding: '0 5px 14px', borderBottom: '1px solid var(--rail-divider)', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
              <LogoIcon />
              <div style={{ overflow: 'hidden' }}>
                <div className="rail-label" style={{
                  fontSize: 14, fontWeight: 700, color: '#ffffff',
                  letterSpacing: '0.08em', whiteSpace: 'nowrap',
                  opacity: 0, transition: 'opacity 0.2s 0.05s',
                  fontFamily: 'var(--sans)',
                }}>
                  CANNASPY
                </div>
                <div className="rail-label mono rail-group-label" style={{
                  fontSize: '7.5px', color: '#ffffff',
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  marginTop: 2, whiteSpace: 'nowrap',
                  opacity: 0, transition: 'opacity 0.2s 0.05s',
                }}>
                  AI-Powered Strategic Advantage
                </div>
              </div>
            </div>
          </div>

          {/* Nav scroll area */}
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '0 10px' }}>
            {groups.map(group => {
              const items = navItems.filter(n => n.group === group)
              if (!items.length) return null
              return (
                <div key={group} style={{ paddingBottom: 4 }}>
                  <div className="rail-group-label mono" style={{
                    fontSize: 9, fontWeight: 600, letterSpacing: '0.16em',
                    textTransform: 'uppercase', color: 'var(--rail-fg-dim)',
                    padding: '8px 8px 5px', whiteSpace: 'nowrap',
                    opacity: 0, transition: 'opacity 0.2s 0.05s',
                  }}>
                    {group}
                  </div>
                  {items.map(item => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      style={({ isActive }) => ({
                        display: 'flex',
                        alignItems: 'center',
                        padding: '8px 10px',
                        borderRadius: 8,
                        color: isActive ? 'var(--rail-fg)' : 'var(--rail-fg-mute)',
                        fontSize: 13,
                        fontWeight: isActive ? 600 : 400,
                        cursor: 'pointer',
                        transition: 'var(--transition)',
                        marginBottom: 1,
                        textDecoration: 'none',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        background: isActive ? 'var(--rail-accent-soft)' : 'transparent',
                        boxShadow: isActive ? 'inset 0 0 0 1px rgba(11,213,213,0.30)' : 'none',
                      })}
                    >
                      {({ isActive }) => (
                        <>
                          <span style={{
                            width: 15, height: 15, flexShrink: 0, marginRight: 9,
                            color: isActive ? 'var(--rail-accent)' : 'currentColor',
                            display: 'flex', alignItems: 'center',
                          }}>
                            {item.icon}
                          </span>
                          <span className="rail-label" style={{ opacity: 0, transition: 'opacity 0.2s 0.05s', flex: 1 }}>
                            {item.label}
                          </span>
                          {item.path === '/alerts' && unreviewedAlertCount > 0 && (
                            <span className="rail-label" style={{
                              opacity: 0, transition: 'opacity 0.2s 0.05s',
                              background: 'var(--danger)', color: '#fff',
                              borderRadius: 10, padding: '1px 6px',
                              fontSize: 10, fontFamily: 'var(--mono)',
                              marginLeft: 'auto',
                            }}>
                              {unreviewedAlertCount}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              )
            })}
          </div>

          {/* Footer — theme toggle + account */}
          <div style={{ padding: 14, borderTop: '1px solid var(--rail-divider)', marginTop: 'auto' }}>
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              style={{
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '8px 10px', borderRadius: 8,
                background: 'transparent', border: 'none',
                color: 'var(--rail-fg-mute)', fontSize: 12,
                cursor: 'pointer', width: '100%',
                fontFamily: 'var(--sans)',
                transition: 'var(--transition)',
                whiteSpace: 'nowrap', overflow: 'hidden',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLElement).style.color = 'var(--rail-fg)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--rail-fg-mute)' }}
            >
              <span style={{ flexShrink: 0 }}>{theme === 'light' ? Icons.moon : Icons.sun}</span>
              <span className="theme-text" style={{ flex: 1, textAlign: 'left', opacity: 0, transition: 'opacity 0.2s 0.05s' }}>
                {theme === 'light' ? 'Dark mode' : 'Light mode'}
              </span>
              {/* Pill toggle */}
              <span className="pill-toggle" style={{
                width: 30, height: 16, borderRadius: 8,
                background: theme === 'light' ? 'var(--rail-accent)' : 'rgba(255,255,255,0.18)',
                position: 'relative', flexShrink: 0,
                transition: 'var(--transition)',
                opacity: 0,
              }}>
                <span style={{
                  width: 12, height: 12, borderRadius: '50%', background: '#fff',
                  position: 'absolute', top: 2,
                  left: theme === 'dark' ? 2 : undefined,
                  right: theme === 'light' ? 2 : undefined,
                  transition: 'left 0.22s var(--ease-spring), right 0.22s var(--ease-spring)',
                }} />
              </span>
            </button>

            {/* User */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '10px 10px 0', overflow: 'hidden',
            }}>
              <div style={{ flexShrink: 0 }}>
                <UserButton afterSignOutUrl="/sign-in" />
              </div>
              <span className="rail-label" style={{
                fontSize: 12, color: 'var(--rail-fg-mute)',
                whiteSpace: 'nowrap', opacity: 0, transition: 'opacity 0.2s 0.05s',
              }}>
                Account
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main workspace ── */}
      <main style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        width: 0, minWidth: 0, overflow: 'hidden',
        position: 'relative', zIndex: 1,
      }}>
        <Outlet />
      </main>
    </div>
  )
}
