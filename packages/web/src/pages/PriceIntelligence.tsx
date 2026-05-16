import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { usePriceMatrix } from '../hooks/usePriceMatrix'
import { useAuthFetch } from '../lib/useAuthFetch'
import { OperatorTypeFilter, type OperatorType } from '../components/filters/OperatorTypeFilter'

const API = import.meta.env.VITE_API_URL ?? ''

interface Location { id: string; name: string }

type View = 'priority' | 'byrival' | 'matrix'
type GapFilter = 'all' | 'higher' | 'lower' | 'even'

interface CellData {
  price: number
  inStock: boolean
  onPromo: boolean
  lastUpdated: string
}

interface DrawerData {
  product: string
  competitor: string
  theirPrice: number
  allPrices: { name: string; price: number }[]
  onPromo: boolean
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function exportCSV(
  products: string[],
  competitors: string[],
  productMap: Map<string, Map<string, CellData>>
) {
  const header = ['Product', ...competitors].join(',')
  const rows = products.map((product) => {
    const cells = competitors.map((c) => {
      const d = productMap.get(product)?.get(c)
      return d ? `$${d.price.toFixed(2)}` : '—'
    })
    return [`"${product}"`, ...cells].join(',')
  })
  const csv = [header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `price-matrix-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
  if (diff < 1) return 'just now'
  if (diff < 60) return `${diff}m ago`
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`
  return `${Math.floor(diff / 1440)}d ago`
}

function getCellClass(price: number, minPrice: number, maxPrice: number): 'higher' | 'lower' | 'even' {
  if (maxPrice - minPrice < 0.01) return 'even'
  if (price >= maxPrice - 0.01) return 'higher'
  if (price <= minPrice + 0.01) return 'lower'
  return 'even'
}

const CELL_COLORS = {
  higher: 'rgba(196,59,78,0.12)',
  lower: 'rgba(11,184,184,0.10)',
  even: 'rgba(84,132,164,0.08)',
  missing: 'var(--surface-3)',
}
const CELL_GAP_COLORS = {
  higher: 'var(--danger)',
  lower: 'var(--accent)',
  even: 'var(--text-3)',
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ChevronDown() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

interface DropdownProps {
  label: string
  value: string
  options: { value: string; label: string; dot?: string }[]
  onChange: (v: string) => void
  active?: boolean
}

function Dropdown({ label, value, options, onChange, active }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })
  const wrapRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const selected = options.find(o => o.value === value)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleToggle() {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setMenuPos({ top: r.bottom + 5, left: r.left })
    }
    setOpen(o => !o)
  }

  const menu = open ? createPortal(
    <div style={{
      position: 'fixed', top: menuPos.top, left: menuPos.left,
      background: 'var(--surface)', border: '1px solid var(--border-2)',
      borderRadius: 'var(--r-sm)', boxShadow: '0 8px 32px rgba(30,60,80,0.14)',
      zIndex: 9999, minWidth: 160, padding: 5,
    }}>
      {options.map(opt => (
        <div
          key={opt.value}
          onClick={() => { onChange(opt.value); setOpen(false) }}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 10px', borderRadius: 6,
            fontSize: 12, color: opt.value === value ? 'var(--accent)' : 'var(--text-1)',
            fontWeight: opt.value === value ? 700 : 400,
            cursor: 'pointer', fontFamily: 'var(--sans)',
            background: 'transparent',
            transition: 'background 0.1s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-3)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          {opt.dot && (
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: opt.dot, flexShrink: 0 }} />
          )}
          {opt.label}
          {opt.value === value && <span style={{ marginLeft: 'auto', fontSize: 11 }}>✓</span>}
        </div>
      ))}
    </div>,
    document.body
  ) : null

  return (
    <div ref={wrapRef} style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
        {label}
      </span>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <button
          ref={btnRef}
          onClick={handleToggle}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 11px', borderRadius: 'var(--r-sm)',
            fontSize: 11, fontWeight: 600,
            border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border-2)'}`,
            background: active ? 'var(--accent)' : 'var(--surface)',
            color: active ? '#fff' : 'var(--text-1)',
            cursor: 'pointer', fontFamily: 'var(--sans)',
            transition: 'var(--transition)', whiteSpace: 'nowrap',
          }}
        >
          {selected?.dot && (
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: selected.dot, flexShrink: 0, display: 'inline-block' }} />
          )}
          {selected?.label || options[0].label}
          <ChevronDown />
        </button>
        {menu}
      </div>
    </div>
  )
}

// ── Priority card ─────────────────────────────────────────────────────────────

interface PriorityCardProps {
  product: string
  prices: { name: string; price: number; onPromo: boolean }[]
  onClick: () => void
}

function PriorityCard({ product, prices, onClick }: PriorityCardProps) {
  if (prices.length === 0) return null
  const sorted = [...prices].sort((a, b) => a.price - b.price)
  const min = sorted[0].price
  const max = sorted[sorted.length - 1].price
  const gap = max - min
  const hasGap = gap > 0.5

  const sev = gap > 10 ? 'critical' : gap > 5 ? 'high' : gap > 1 ? 'low' : 'mid'
  const sevColor = sev === 'critical' ? 'var(--danger)' : sev === 'high' ? 'var(--warm)' : sev === 'low' ? 'var(--accent)' : 'var(--text-3)'
  const leftBorder = sev === 'critical' ? 'var(--danger)' : sev === 'high' ? 'var(--warm)' : sev === 'low' ? 'var(--accent)' : 'var(--text-3)'

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 12, boxShadow: 'var(--card-shadow)',
        cursor: 'pointer', overflow: 'hidden', position: 'relative',
        display: 'grid', gridTemplateColumns: '160px 1fr auto',
        gap: 18, alignItems: 'center',
        padding: '14px 20px 14px 26px', minHeight: 80,
        transition: 'transform .18s, box-shadow .18s, border-color .18s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-1px)'
        e.currentTarget.style.boxShadow = 'var(--card-shadow-lg)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = ''
        e.currentTarget.style.boxShadow = 'var(--card-shadow)'
      }}
    >
      {/* Severity left border */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: leftBorder }} />

      {/* Left: hero gap */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignSelf: 'center' }}>
        <div style={{
          fontFamily: 'var(--mono)', fontWeight: 700,
          fontSize: hasGap ? 32 : 20, lineHeight: 1,
          letterSpacing: '-0.025em', color: sevColor,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {hasGap ? `$${gap.toFixed(2)}` : '—'}
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600, lineHeight: 1.3 }}>
          {hasGap ? 'spread across rivals' : 'at parity'}
        </div>
      </div>

      {/* Middle: identity + chips */}
      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{
          fontSize: 16, fontWeight: 700, color: 'var(--text-1)',
          letterSpacing: '-0.01em', lineHeight: 1.2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {product}
        </div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{
            fontFamily: 'var(--mono)', fontSize: 9.5, fontWeight: 700,
            padding: '2.5px 7px', borderRadius: 4,
            background: 'var(--surface-2)', color: 'var(--text-2)',
            letterSpacing: '0.03em', border: '1px solid var(--border)',
          }}>
            {prices.length} rivals
          </span>
          {sorted.some(p => p.onPromo) && (
            <span style={{
              fontFamily: 'var(--mono)', fontSize: 9.5, fontWeight: 700,
              padding: '2.5px 7px', borderRadius: 4,
              background: 'var(--warm-soft)', color: 'var(--warm)',
            }}>
              promo active
            </span>
          )}
          {hasGap && (
            <span style={{
              fontFamily: 'var(--mono)', fontSize: 9.5, fontWeight: 700,
              padding: '2.5px 7px', borderRadius: 4,
              background: 'var(--danger-soft)', color: 'var(--danger)',
            }}>
              ${gap.toFixed(2)} gap
            </span>
          )}
        </div>
      </div>

      {/* Right: price range */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 8.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 600, marginBottom: 2 }}>
            Low
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 700, color: 'var(--accent)', letterSpacing: '-0.01em', lineHeight: 1 }}>
            ${min.toFixed(2)}
          </div>
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--text-3)', padding: '0 2px', alignSelf: 'flex-end', paddingBottom: 1 }}>→</div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 8.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--danger)', fontWeight: 600, marginBottom: 2 }}>
            High
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 700, color: 'var(--danger)', letterSpacing: '-0.01em', lineHeight: 1 }}>
            ${max.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── By-rival card ─────────────────────────────────────────────────────────────

interface ByRivalCardProps {
  competitor: string
  rows: { product: string; price: number; onPromo: boolean; minPrice: number; maxPrice: number }[]
  onRowClick: (product: string, competitor: string, price: number) => void
}

function ByRivalCard({ competitor, rows, onRowClick }: ByRivalCardProps) {
  const higher = rows.filter(r => r.price >= r.maxPrice - 0.01).length
  const lower = rows.filter(r => r.price <= r.minPrice + 0.01).length

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 16, boxShadow: 'var(--card-shadow)',
      overflow: 'hidden', flex: '1 1 380px', minWidth: 320, maxWidth: 480,
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: '1px solid var(--border)', background: 'var(--surface-2)',
      }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>{competitor}</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginTop: 2 }}>
            Tracking
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 0, padding: '12px 18px', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        {[
          { n: rows.length, label: 'SKUs', color: 'var(--text-1)' },
          { n: higher, label: 'Higher', color: 'var(--danger)' },
          { n: lower, label: 'Cheaper', color: 'var(--accent)' },
        ].map(s => (
          <div key={s.label} style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 700, color: s.color, lineHeight: 1, marginBottom: 2 }}>{s.n}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 8.5, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)' }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: 6, flex: 1 }}>
        {rows.slice(0, 8).map((row, i) => {
          const cls = getCellClass(row.price, row.minPrice, row.maxPrice)
          const gapColor = CELL_GAP_COLORS[cls]
          const gap = cls === 'higher' ? row.price - row.minPrice : cls === 'lower' ? row.price - row.maxPrice : 0
          return (
            <div
              key={i}
              onClick={() => onRowClick(row.product, competitor, row.price)}
              style={{
                display: 'grid', gridTemplateColumns: '1fr auto auto',
                gap: 12, alignItems: 'center',
                padding: '9px 12px', borderRadius: 8,
                cursor: 'pointer', transition: 'background .15s',
                borderTop: i > 0 ? '1px dashed var(--border)' : 'none',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {row.product}
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-1)', fontWeight: 700 }}>
                ${row.price.toFixed(2)}
              </div>
              <div style={{
                fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700,
                padding: '3px 8px', borderRadius: 4,
                background: cls === 'higher' ? 'var(--danger-soft)' : cls === 'lower' ? 'var(--accent-soft)' : 'var(--surface-3)',
                color: gapColor, whiteSpace: 'nowrap',
              }}>
                {cls === 'even' ? 'even' : `${gap > 0 ? '+' : ''}$${Math.abs(gap).toFixed(2)}`}
              </div>
            </div>
          )
        })}
        {rows.length > 8 && (
          <div style={{ padding: '8px 12px', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', textAlign: 'center' }}>
            +{rows.length - 8} more SKUs
          </div>
        )}
      </div>
    </div>
  )
}

// ── Detail Drawer ─────────────────────────────────────────────────────────────

function DetailDrawer({ data, open, onClose }: { data: DrawerData | null; open: boolean; onClose: () => void }) {
  if (!data) return null
  const minPrice = Math.min(...data.allPrices.map(p => p.price))
  const maxPrice = Math.max(...data.allPrices.map(p => p.price))
  const spread = maxPrice - minPrice

  return (
    <div style={{
      position: 'fixed', right: 0, top: 0, bottom: 0, width: 340,
      background: 'var(--surface-solid)', borderLeft: '1px solid var(--border-2)',
      boxShadow: '-12px 0 40px rgba(0,0,0,0.18), -2px 0 8px rgba(0,0,0,0.06)',
      zIndex: 50, display: 'flex', flexDirection: 'column',
      transform: open ? 'translateX(0)' : 'translateX(100%)',
      transition: 'transform 0.3s cubic-bezier(.2,.8,.2,1)',
    }}>
      <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <button
          onClick={onClose}
          style={{
            width: 28, height: 28, borderRadius: '50%', background: 'var(--surface-3)',
            border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-2)', flexShrink: 0,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            padding: '3px 8px', borderRadius: 4, display: 'inline-block', marginBottom: 5,
            background: 'var(--accent-soft)', color: 'var(--accent)',
          }}>
            Price detail
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-2)', letterSpacing: '0.04em', marginBottom: 4 }}>
            {data.competitor}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.01em', lineHeight: 1.3 }}>
            {data.product}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', minHeight: 0 }}>
        {/* Price comparison grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 7, marginBottom: 14 }}>
          {[
            { n: `$${minPrice.toFixed(2)}`, label: 'Cheapest', color: 'var(--accent)' },
            { n: `$${maxPrice.toFixed(2)}`, label: 'Most exp.', color: 'var(--danger)' },
            { n: `$${spread.toFixed(2)}`, label: 'Spread', color: spread > 5 ? 'var(--danger)' : 'var(--text-1)' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'var(--surface-3)', border: '1px solid var(--border)',
              borderRadius: 'var(--r-sm)', padding: '10px 12px', textAlign: 'center',
            }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 700, color: s.color, lineHeight: 1, marginBottom: 3, fontVariantNumeric: 'tabular-nums' }}>
                {s.n}
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* All rivals table */}
        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 8 }}>
          All rivals
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Rival', 'Price', 'vs range'].map(h => (
                <th key={h} style={{ fontFamily: 'var(--mono)', fontSize: 8.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)', padding: '5px 7px', borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.allPrices.map(p => {
              const cls = getCellClass(p.price, minPrice, maxPrice)
              const gap = cls === 'higher' ? p.price - minPrice : cls === 'lower' ? p.price - maxPrice : 0
              return (
                <tr key={p.name}>
                  <td style={{ padding: '8px 7px', borderBottom: '1px solid var(--border)', fontSize: 11, color: 'var(--text-1)' }}>
                    {p.name === data.competitor ? <strong>{p.name}</strong> : p.name}
                  </td>
                  <td style={{ padding: '8px 7px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: CELL_GAP_COLORS[cls] }}>
                    ${p.price.toFixed(2)}
                  </td>
                  <td style={{ padding: '8px 7px', borderBottom: '1px solid var(--border)' }}>
                    <span style={{
                      fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
                      background: cls === 'higher' ? 'var(--danger-soft)' : cls === 'lower' ? 'var(--accent-soft)' : 'var(--surface-3)',
                      color: CELL_GAP_COLORS[cls],
                    }}>
                      {cls === 'even' ? 'mid' : `${gap > 0 ? '+' : ''}$${Math.abs(gap).toFixed(2)}`}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 7, flexShrink: 0 }}>
        <button
          style={{
            flex: 1, padding: '9px 12px', borderRadius: 'var(--r-sm)',
            fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)',
            border: '1.5px solid var(--border-2)', background: 'var(--surface-3)', color: 'var(--text-1)',
          }}
          onClick={onClose}
        >
          Dismiss
        </button>
        <button
          style={{
            flex: 1, padding: '9px 12px', borderRadius: 'var(--r-sm)',
            fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)',
            background: 'var(--accent)', borderColor: 'var(--accent)', color: 'var(--cta-fg-on-pos)',
            border: '1.5px solid var(--accent)', boxShadow: 'var(--cta-shadow)',
          }}
        >
          Log response
        </button>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PriceIntelligence() {
  const authFetch = useAuthFetch()
  const navigate = useNavigate()

  const [locations, setLocations] = useState<Location[]>([])
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
  const [view, setView] = useState<View>('priority')
  const [category, setCategory] = useState('')
  const [gapFilter, setGapFilter] = useState<GapFilter>('all')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerData, setDrawerData] = useState<DrawerData | null>(null)
  const [operatorType, setOperatorType] = useState<OperatorType>('both')

  const { matrix, loading, error } = usePriceMatrix(selectedLocation, category || undefined, operatorType === 'both' ? undefined : operatorType)

  useEffect(() => {
    authFetch(`${API}/api/v1/locations`)
      .then(r => r.json())
      .then(d => {
        const locs: Location[] = d.locations || []
        setLocations(locs)
        if (locs.length > 0 && !selectedLocation) setSelectedLocation(locs[0].id)
      })
      .catch(() => {})
  }, [authFetch])

  // ── Build data structures ──────────────────────────────────────────────────
  const productMap = new Map<string, Map<string, CellData>>()
  const competitorSet = new Set<string>()

  for (const row of matrix) {
    competitorSet.add(row.competitor_name)
    if (!productMap.has(row.raw_name)) productMap.set(row.raw_name, new Map())
    productMap.get(row.raw_name)!.set(row.competitor_name, {
      price: row.price,
      inStock: true,
      onPromo: row.on_sale,
      lastUpdated: row.last_updated,
    })
  }

  const competitors = [...competitorSet]
  let products = [...productMap.keys()]

  // Per-product price stats
  const priceStats = new Map<string, { min: number; max: number; spread: number }>()
  for (const [product, compMap] of productMap) {
    const prices = [...compMap.values()].map(v => v.price)
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    priceStats.set(product, { min, max, spread: max - min })
  }

  // Apply gap filter
  if (gapFilter !== 'all') {
    products = products.filter(p => {
      const stats = priceStats.get(p)!
      if (gapFilter === 'higher') return stats.spread > 2
      if (gapFilter === 'lower') return stats.spread < 0.5
      return true
    })
  }

  // Summary KPIs
  const higherCount = [...priceStats.values()].filter(s => s.spread > 2).length
  const lowerCount = [...priceStats.values()].filter(s => s.spread < 0.5).length
  const evenCount = [...priceStats.values()].length - higherCount - lowerCount
  const locationName = locations.find(l => l.id === selectedLocation)?.name || 'Location'
  const lastUpdated = matrix.length > 0 ? timeAgo(matrix[0].last_updated) : '—'

  const openDrawer = useCallback((product: string, competitor: string, theirPrice: number) => {
    const compMap = productMap.get(product)
    const allPrices = compMap
      ? [...compMap.entries()].map(([name, d]) => ({ name, price: d.price }))
      : []
    setDrawerData({ product, competitor, theirPrice, allPrices, onPromo: compMap?.get(competitor)?.onPromo ?? false })
    setDrawerOpen(true)
  }, [productMap])

  const sep = <div style={{ width: 1, height: 20, background: 'var(--border-2)', flexShrink: 0, margin: '0 4px' }} />

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── TOPBAR ── */}
      <div style={{
        background: 'var(--surface)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)', padding: '0 24px', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0 10px' }}>
          {/* Back */}
          <button
            onClick={() => navigate('/locations')}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)',
              cursor: 'pointer', background: 'none', border: 'none',
              transition: 'var(--transition)', flexShrink: 0, padding: 0,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            {locationName}
          </button>

          {/* Title */}
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
              Price Intelligence
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', marginLeft: 2 }}>
              {locationName.toUpperCase()} · {competitors.length} RIVALS · {products.length} SKUS
            </div>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Operator type filter */}
            <OperatorTypeFilter value={operatorType} onChange={setOperatorType} />
            {sep}
            {/* Legend */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              {[
                { bg: 'rgba(196,59,78,0.25)', border: 'var(--danger)', label: "You're higher", color: 'var(--danger)' },
                { bg: 'rgba(11,184,184,0.22)', border: 'var(--accent)', label: "Cheapest", color: 'var(--accent)' },
                { bg: 'rgba(84,132,164,0.12)', border: 'var(--slate)', label: 'Even', color: 'var(--text-2)' },
                { bg: 'var(--surface-3)', border: 'var(--border-2)', label: 'Not tracked', color: 'var(--text-3)' },
              ].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 600, color: l.color }}>
                  <div style={{ width: 28, height: 14, borderRadius: 4, background: l.bg, border: `2px solid ${l.border}`, flexShrink: 0 }} />
                  {l.label}
                </div>
              ))}
            </div>
            {sep}
            <button
              className="btn"
              onClick={() => exportCSV(products, competitors, productMap)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', fontSize: 11 }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export CSV
            </button>
            {locations.length > 1 && (
              <select
                value={selectedLocation || ''}
                onChange={e => setSelectedLocation(e.target.value)}
                style={{
                  background: 'var(--surface-3)', border: '1.5px solid var(--border-2)',
                  borderRadius: 'var(--r-sm)', padding: '7px 13px',
                  color: 'var(--text-1)', fontSize: 11, fontFamily: 'var(--sans)',
                  cursor: 'pointer',
                }}
              >
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* ── FILTER BAR ── */}
      <div style={{
        padding: '8px 24px', borderBottom: '1px solid var(--border)',
        background: 'var(--surface-2)', display: 'flex', alignItems: 'center',
        gap: 6, flexShrink: 0, flexWrap: 'nowrap', overflowX: 'auto',
      }}>
        {/* View tabs */}
        <div style={{
          display: 'inline-flex', alignItems: 'stretch',
          background: 'var(--surface)', border: '1.5px solid var(--border-2)',
          borderRadius: 'var(--r-sm)', padding: 2, gap: 2, flexShrink: 0,
        }}>
          {([
            { v: 'priority' as View, icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>, label: 'Priority' },
            { v: 'byrival' as View, icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, label: 'By rival' },
            { v: 'matrix' as View, icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>, label: 'Matrix' },
          ] as const).map(tab => (
            <button
              key={tab.v}
              onClick={() => setView(tab.v)}
              style={{
                padding: '5px 13px', borderRadius: 'calc(var(--r-sm) - 2px)',
                fontSize: 11, fontWeight: 600, fontFamily: 'var(--sans)',
                cursor: 'pointer', whiteSpace: 'nowrap', border: 'none',
                display: 'flex', alignItems: 'center', gap: 6, lineHeight: 1.2,
                background: view === tab.v ? 'var(--accent)' : 'transparent',
                color: view === tab.v ? '#fff' : 'var(--text-2)',
                boxShadow: view === tab.v ? '0 1px 4px rgba(9,161,161,0.25)' : 'none',
                transition: 'var(--transition)',
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {sep}

        <Dropdown
          label="Gap"
          value={gapFilter}
          onChange={v => setGapFilter(v as GapFilter)}
          options={[
            { value: 'all', label: 'All gaps' },
            { value: 'higher', label: "You're higher", dot: 'var(--danger)' },
            { value: 'lower', label: "You're cheaper", dot: 'var(--accent)' },
            { value: 'even', label: 'Even', dot: 'var(--slate)' },
          ]}
          active={gapFilter !== 'all'}
        />

        {sep}

        <Dropdown
          label="Category"
          value={category}
          onChange={setCategory}
          options={[
            { value: '', label: 'All categories' },
            { value: 'Flower', label: 'Flower' },
            { value: 'Concentrate', label: 'Concentrates' },
            { value: 'Edible', label: 'Edibles' },
            { value: 'Preroll', label: 'Pre-rolls' },
            { value: 'Gear', label: 'Gear' },
            { value: 'Drink', label: 'Drinks' },
            { value: 'Wax', label: 'Wax' },
            { value: 'Tincture', label: 'Tinctures' },
            { value: 'Topicals', label: 'Topicals' },
          ]}
          active={!!category}
        />
      </div>

      {/* ── SUMMARY STRIP ── */}
      <div style={{
        padding: '8px 24px', borderBottom: '2px solid var(--border)',
        background: 'var(--surface)', display: 'flex', gap: 8,
        alignItems: 'center', flexShrink: 0, flexWrap: 'wrap',
      }}>
        {[
          { n: higherCount, label: 'Higher-priced SKUs', color: 'var(--danger)' },
          { n: lowerCount, label: 'Cheapest SKUs', color: 'var(--accent)' },
          { n: evenCount, label: 'At parity', color: 'var(--text-3)' },
        ].map(s => (
          <div key={s.label} style={{
            flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--surface-3)', border: '1px solid var(--border)',
            borderRadius: 'var(--r-sm)', padding: '6px 12px',
          }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 700, lineHeight: 1, fontVariantNumeric: 'tabular-nums', color: s.color }}>
              {s.n}
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {s.label}
            </div>
          </div>
        ))}
        <div style={{ width: 1, height: 28, background: 'var(--border-2)', flexShrink: 0, margin: '0 4px' }} />
        <div style={{
          flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--surface-3)', border: '1px solid var(--border)',
          borderRadius: 'var(--r-sm)', padding: '6px 12px',
        }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 700, lineHeight: 1, color: 'var(--warm)' }}>
            {products.length}
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            SKUs tracked
          </div>
        </div>
        <div style={{
          flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--surface-3)', border: '1px solid var(--border)',
          borderRadius: 'var(--r-sm)', padding: '6px 12px',
        }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 700, lineHeight: 1, color: 'var(--text-1)' }}>
            {competitors.length}
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Rivals compared
          </div>
        </div>
        <div style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', animation: 'cspyLivePulse 2s ease-in-out infinite', flexShrink: 0 }} />
          Updated {lastUpdated}
        </div>
      </div>

      {/* ── CONTENT AREA ── */}
      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontFamily: 'var(--mono)', fontSize: 13 }}>
          Pulling latest prices from {competitors.length > 0 ? competitors.length : 'multiple'} sources…
        </div>
      ) : error ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)', fontFamily: 'var(--mono)', fontSize: 13 }}>
          Couldn't load price data. We'll retry shortly.
        </div>
      ) : !selectedLocation ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontSize: 14 }}>
          Add a location to view price data.
        </div>
      ) : products.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--text-3)' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            No price data yet
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-3)', maxWidth: 280, textAlign: 'center' }}>
            Add rivals on this location and data will appear after the next collection window.
          </div>
        </div>
      ) : (
        <>
          {/* ── PRIORITY VIEW ── */}
          {view === 'priority' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '18px 28px 48px', display: 'flex', flexDirection: 'column', gap: 9 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600 }}>
                  Sorted by price spread
                </span>
                <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)' }}>
                  {products.length} SKUs
                </span>
              </div>
              {[...products]
                .sort((a, b) => (priceStats.get(b)?.spread ?? 0) - (priceStats.get(a)?.spread ?? 0))
                .map(product => {
                  const compMap = productMap.get(product)!
                  const prices = [...compMap.entries()].map(([name, d]) => ({ name, price: d.price, onPromo: d.onPromo }))
                  return (
                    <PriorityCard
                      key={product}
                      product={product}
                      prices={prices}
                      onClick={() => {
                        const first = prices[0]
                        if (first) openDrawer(product, first.name, first.price)
                      }}
                    />
                  )
                })}
            </div>
          )}

          {/* ── BY RIVAL VIEW ── */}
          {view === 'byrival' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '18px 24px', display: 'flex', gap: 14, flexWrap: 'wrap', alignContent: 'flex-start' }}>
              {competitors.map(competitor => {
                const rows = products
                  .filter(p => productMap.get(p)?.has(competitor))
                  .map(p => {
                    const d = productMap.get(p)!.get(competitor)!
                    const stats = priceStats.get(p)!
                    return { product: p, price: d.price, onPromo: d.onPromo, minPrice: stats.min, maxPrice: stats.max }
                  })
                  .sort((a, b) => (b.price - b.minPrice) - (a.price - a.minPrice))
                return (
                  <ByRivalCard
                    key={competitor}
                    competitor={competitor}
                    rows={rows}
                    onRowClick={openDrawer}
                  />
                )
              })}
            </div>
          )}

          {/* ── MATRIX VIEW ── */}
          {view === 'matrix' && (
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
              {/* Frozen left col */}
              <div style={{
                flexShrink: 0, width: 220,
                background: 'var(--surface)', borderRight: '2px solid var(--border-2)',
                display: 'flex', flexDirection: 'column', zIndex: 10,
                boxShadow: '4px 0 16px rgba(0,0,0,0.06)',
              }}>
                <div style={{
                  height: 64, borderBottom: '2px solid var(--border-2)',
                  display: 'flex', alignItems: 'flex-end', padding: '0 14px 10px',
                  flexShrink: 0, background: 'var(--surface-2)',
                }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
                    SKU / Range
                  </span>
                </div>
                <div style={{ flex: 1, overflowY: 'hidden' }}>
                  {products.map(product => {
                    const stats = priceStats.get(product)!
                    return (
                      <div
                        key={product}
                        style={{
                          padding: '0 14px', height: 52, display: 'flex', alignItems: 'center',
                          borderBottom: '1px solid var(--border)', cursor: 'pointer',
                          transition: 'background 0.12s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                        onMouseLeave={e => (e.currentTarget.style.background = '')}
                      >
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>
                            {product}
                          </div>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>
                            ${stats.min.toFixed(2)}–${stats.max.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Scrollable matrix */}
              <div style={{ flex: 1, overflow: 'auto', minWidth: 0, minHeight: 0 }}>
                <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                  <thead>
                    <tr style={{ height: 64, position: 'sticky', top: 0, zIndex: 5 }}>
                      {competitors.map(c => (
                        <th key={c} style={{
                          width: 130, minWidth: 130,
                          background: 'var(--surface-2)', borderBottom: '2px solid var(--border-2)',
                          borderRight: '1px solid var(--border)', padding: '8px 10px', verticalAlign: 'bottom',
                        }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 2 }}>{c}</div>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>Tracking</div>
                          <div style={{
                            fontFamily: 'var(--mono)', fontSize: 8, fontWeight: 700,
                            letterSpacing: '0.08em', textTransform: 'uppercase',
                            padding: '2px 6px', borderRadius: 4, display: 'inline-block', marginTop: 3,
                            background: 'var(--accent-soft)', color: 'var(--accent)',
                          }}>
                            tracking
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(product => {
                      const stats = priceStats.get(product)!
                      return (
                        <tr key={product}>
                          {competitors.map(c => {
                            const d = productMap.get(product)?.get(c)
                            if (!d) {
                              return (
                                <td key={c} style={{
                                  width: 130, minWidth: 130, height: 52,
                                  background: CELL_COLORS.missing,
                                  borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)',
                                  verticalAlign: 'middle', padding: '0 10px',
                                }}>
                                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)', letterSpacing: '0.04em' }}>—</div>
                                </td>
                              )
                            }
                            const cls = getCellClass(d.price, stats.min, stats.max)
                            const gap = cls === 'higher' ? d.price - stats.min : cls === 'lower' ? d.price - stats.max : 0
                            return (
                              <td
                                key={c}
                                onClick={() => openDrawer(product, c, d.price)}
                                style={{
                                  width: 130, minWidth: 130, height: 52,
                                  background: CELL_COLORS[cls],
                                  borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)',
                                  verticalAlign: 'middle', padding: '0 10px', cursor: 'pointer',
                                  transition: 'filter 0.12s',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(0.94)')}
                                onMouseLeave={e => (e.currentTarget.style.filter = '')}
                              >
                                <div style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, color: 'var(--text-1)', lineHeight: 1, marginBottom: 2 }}>
                                  ${d.price.toFixed(2)}
                                  {d.onPromo && <span style={{ marginLeft: 4, fontSize: 8, fontWeight: 700, padding: '1px 4px', borderRadius: 3, background: 'var(--warm-soft)', color: 'var(--warm)' }}>SALE</span>}
                                </div>
                                {cls !== 'even' && (
                                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, color: CELL_GAP_COLORS[cls] }}>
                                    {gap > 0 ? '+' : ''}${Math.abs(gap).toFixed(2)}
                                  </div>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── DETAIL DRAWER ── */}
      <DetailDrawer data={drawerData} open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* Drawer backdrop */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 45, background: 'rgba(0,0,0,0.15)' }}
        />
      )}
    </div>
  )
}
