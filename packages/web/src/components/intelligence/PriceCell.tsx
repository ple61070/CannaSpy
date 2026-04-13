interface PriceCellProps {
  price: number
  previousPrice?: number
  inStock: boolean
  onPromo?: boolean
}

export default function PriceCell({ price, previousPrice, inStock, onPromo }: PriceCellProps) {
  const delta = previousPrice ? ((price - previousPrice) / previousPrice) * 100 : null

  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{
        fontFamily: 'Space Mono, monospace',
        fontSize: 13,
        color: inStock ? 'var(--text-primary)' : 'var(--text-muted)',
        textDecoration: inStock ? 'none' : 'line-through',
      }}>
        {inStock ? `$${price.toFixed(2)}` : 'Out of stock'}
      </div>
      {delta !== null && (
        <div style={{
          fontFamily: 'Space Mono, monospace',
          fontSize: 11,
          color: delta < 0 ? 'var(--color-positive)' : 'var(--color-negative)',
        }}>
          {delta < 0 ? '' : '+'}{delta.toFixed(1)}%
        </div>
      )}
      {onPromo && (
        <div style={{
          fontSize: 10,
          color: 'var(--accent-block)',
          fontFamily: 'Space Mono, monospace',
        }}>
          PROMO
        </div>
      )}
    </div>
  )
}
