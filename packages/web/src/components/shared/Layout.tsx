import { Outlet, NavLink } from 'react-router-dom'
import { UserButton } from '@clerk/clerk-react'
import { useStore } from '../../store'

const navItems = [
  { label: 'Command Center', path: '/command-center', accent: 'intel' },
  { label: 'Alert Feed', path: '/alerts', accent: 'alert' },
  { label: 'Price Intelligence', path: '/prices', accent: 'intel' },
  { label: 'Promotions', path: '/promotions', accent: 'intel' },
  { label: 'Block Management', path: '/blocks', accent: 'block' },
  { label: 'Locations', path: '/locations', accent: 'intel' },
  { label: 'Billing', path: '/billing', accent: 'roi' },
  { label: 'Notifications', path: '/settings/notifications', accent: 'trust' },
]

export default function Layout() {
  const unreviewedAlertCount = useStore((s) => s.unreviewedAlertCount)

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-base)' }}>
      {/* Sidebar */}
      <aside style={{
        width: 240,
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{
          padding: '20px 16px',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <div style={{
            fontFamily: 'Space Mono, monospace',
            fontSize: 15,
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.5px',
          }}>
            CANNA<span style={{ color: 'var(--accent-intel)' }}>SPY</span>
          </div>
          <div style={{
            fontSize: 11,
            color: 'var(--text-muted)',
            fontFamily: 'Space Mono, monospace',
            marginTop: 2,
          }}>
            INTEL PLATFORM
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: 6,
                marginBottom: 2,
                fontSize: 13,
                fontWeight: 500,
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: isActive ? 'var(--bg-elevated)' : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.1s',
              })}
            >
              <span>{item.label}</span>
              {item.path === '/alerts' && unreviewedAlertCount > 0 && (
                <span style={{
                  background: 'var(--accent-alert)',
                  color: '#fff',
                  borderRadius: 10,
                  padding: '1px 7px',
                  fontSize: 11,
                  fontFamily: 'Space Mono, monospace',
                }}>
                  {unreviewedAlertCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <UserButton afterSignOutUrl="/sign-in" />
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Account</span>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: 'auto', padding: 32 }}>
        <Outlet />
      </main>
    </div>
  )
}
