interface AlertCardProps {
  alert: {
    id: string
    alert_type: string
    competitor_name: string
    location_name?: string
    old_value: string | null
    new_value: string | null
    confidence: string
    reviewed: boolean
    created_at: string
  }
  onReview?: (id: string) => void
}

function formatAlertMessage(alertType: string, competitorName: string, oldValue: string | null, newValue: string | null): string {
  const priceDelta = oldValue && newValue
    ? (((parseFloat(newValue) - parseFloat(oldValue)) / parseFloat(oldValue)) * 100).toFixed(1)
    : null

  switch (alertType) {
    case 'price_drop':
      return `${competitorName} dropped a price from $${oldValue} to $${newValue}${priceDelta ? ` (${priceDelta}%)` : ''}`
    case 'price_increase':
      return `${competitorName} raised a price from $${oldValue} to $${newValue}${priceDelta ? ` (+${priceDelta}%)` : ''}`
    case 'new_promo':
      return `${competitorName} launched a new promotion`
    case 'promo_ended':
      return `${competitorName} ended a promotion`
    case 'new_sku':
      return `${competitorName} added a new product at $${newValue}`
    case 'sku_removed':
      return `${competitorName} removed a product`
    case 'new_competitor':
      return `New competitor detected: ${competitorName}`
    default:
      return `${competitorName}: ${alertType}`
  }
}

const alertAccents: Record<string, string> = {
  price_drop: 'var(--accent-intel)',
  price_increase: 'var(--accent-alert)',
  new_promo: 'var(--accent-block)',
  promo_ended: 'var(--text-muted)',
  new_sku: 'var(--accent-trust)',
  sku_removed: 'var(--text-secondary)',
  new_competitor: 'var(--accent-alert)',
}

export default function AlertCard({ alert, onReview }: AlertCardProps) {
  const accent = alertAccents[alert.alert_type] || 'var(--text-secondary)'
  const ts = new Date(alert.created_at).toLocaleString()

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: `1px solid ${alert.reviewed ? 'var(--border-subtle)' : 'var(--border-default)'}`,
      borderLeft: `3px solid ${accent}`,
      borderRadius: 8,
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 16,
      opacity: alert.reviewed ? 0.6 : 1,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 4 }}>
          {formatAlertMessage(alert.alert_type, alert.competitor_name, alert.old_value, alert.new_value)}
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {alert.location_name && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{alert.location_name}</span>
          )}
          <span style={{
            fontFamily: 'Space Mono, monospace',
            fontSize: 11,
            color: 'var(--text-muted)',
          }}>
            {ts}
          </span>
          {alert.confidence !== 'high' && (
            <span style={{ fontSize: 11, color: 'var(--color-warning)' }}>
              {alert.confidence} confidence
            </span>
          )}
        </div>
      </div>
      {!alert.reviewed && onReview && (
        <button
          className="btn btn-ghost"
          style={{ padding: '4px 10px', fontSize: 12, whiteSpace: 'nowrap' }}
          onClick={() => onReview(alert.id)}
        >
          Mark as reviewed
        </button>
      )}
    </div>
  )
}
