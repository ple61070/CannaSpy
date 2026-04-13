import { useState, useEffect } from 'react'
import { usePriceMatrix } from '../hooks/usePriceMatrix'
import { useAuthFetch } from '../lib/useAuthFetch'
import PriceCell from '../components/intelligence/PriceCell'
import EmptyState from '../components/shared/EmptyState'

const API = import.meta.env.VITE_API_URL ?? ''

// Values match actual menu_items.category values from the data pipeline
const CATEGORIES = ['', 'Concentrate', 'Indica', 'Hybrid', 'Edible', 'Preroll', 'Gear', 'Wax', 'Drink', 'Tincture', 'Topicals']

interface Location { id: string; name: string }

function exportCSV(
  products: string[],
  competitors: string[],
  productMap: Map<string, Map<string, { price: number; inStock: boolean; onPromo: boolean }>>
) {
  const header = ['Product', ...competitors].join(',')
  const rows = products.map((product) => {
    const cells = competitors.map((c) => {
      const data = productMap.get(product)?.get(c)
      return data ? `$${data.price.toFixed(2)}` : '—'
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

export default function PriceIntelligence() {
  const authFetch = useAuthFetch()
  const [locations, setLocations] = useState<Location[]>([])
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
  const [category, setCategory] = useState('')
  const { matrix, loading, error } = usePriceMatrix(selectedLocation, category || undefined)

  useEffect(() => {
    authFetch(`${API}/api/v1/locations`)
      .then((r) => r.json())
      .then((d) => {
        const locs: Location[] = d.locations || []
        setLocations(locs)
        if (locs.length > 0 && !selectedLocation) setSelectedLocation(locs[0].id)
      })
  }, [authFetch])

  // Build product → competitor → price map
  const productMap = new Map<string, Map<string, { price: number; inStock: boolean; onPromo: boolean }>>()
  const competitorSet = new Set<string>()

  for (const row of matrix) {
    competitorSet.add(row.competitor_name)
    if (!productMap.has(row.raw_name)) productMap.set(row.raw_name, new Map())
    productMap.get(row.raw_name)!.set(row.competitor_name, {
      price: row.price,
      inStock: true,          // API doesn't return in_stock per item currently
      onPromo: row.on_sale,
    })
  }

  const competitors = [...competitorSet]
  const products = [...productMap.keys()]

  const selectStyle: React.CSSProperties = {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-default)',
    borderRadius: 6,
    padding: '6px 10px',
    color: 'var(--text-primary)',
    fontSize: 12,
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)' }}>
          Price Intelligence
        </h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {locations.length > 1 && (
            <select
              value={selectedLocation || ''}
              onChange={(e) => setSelectedLocation(e.target.value)}
              style={selectStyle}
            >
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          )}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={selectStyle}
          >
            <option value="">All categories</option>
            {CATEGORIES.slice(1).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {products.length > 0 && (
            <button
              className="btn btn-ghost"
              style={{ fontSize: 12 }}
              onClick={() => exportCSV(products, competitors, productMap)}
            >
              Export CSV
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          Pulling latest prices from {competitors.length > 0 ? competitors.length : 'multiple'} sources...
        </div>
      ) : error ? (
        <div style={{ color: 'var(--accent-alert)', fontSize: 13 }}>{error}</div>
      ) : !selectedLocation ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Add a location to view price data.</div>
      ) : products.length === 0 ? (
        <EmptyState screen="prices" />
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid var(--border-default)', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  Product
                </th>
                {competitors.map((c) => (
                  <th key={c} style={{ textAlign: 'right', padding: '8px 12px', borderBottom: '1px solid var(--border-default)', color: 'var(--text-secondary)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '10px 12px', color: 'var(--text-primary)' }}>
                    {product}
                  </td>
                  {competitors.map((c) => {
                    const data = productMap.get(product)?.get(c)
                    return (
                      <td key={c} style={{ padding: '10px 12px', textAlign: 'right' }}>
                        {data ? (
                          <PriceCell price={data.price} inStock={data.inStock} onPromo={data.onPromo} />
                        ) : (
                          <span className="mono" style={{ color: 'var(--text-muted)', fontSize: 11 }}>—</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
