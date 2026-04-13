import { useState, useEffect } from 'react'
import EmptyState from '../components/shared/EmptyState'

interface Promotion {
  id: string
  promo_text: string
  promo_type?: string
  category?: string
  detected_at: string
  expired_at?: string
  active: boolean
  competitor_name: string
}

export default function PromotionsTracker() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch promotions from tracked competitors
    // TODO: aggregate from all tracked competitor promotions
    setLoading(false)
  }, [])

  const promoTypeColors: Record<string, string> = {
    bogo: 'var(--accent-intel)',
    pct_off: 'var(--accent-block)',
    bundle: 'var(--accent-trust)',
    daily_special: 'var(--accent-roi)',
    first_time: 'var(--accent-alert)',
  }

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 24 }}>
        Promotions Tracker
      </h1>

      {loading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading promotions...</div>
      ) : promotions.length === 0 ? (
        <EmptyState screen="promotions" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {promotions.map((promo) => (
            <div key={promo.id} className="card" style={{ borderLeft: `3px solid ${promoTypeColors[promo.promo_type || ''] || 'var(--border-default)'}` }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                      {promo.competitor_name}
                    </span>
                    {promo.promo_type && (
                      <span style={{
                        fontSize: 10,
                        fontFamily: 'Space Mono, monospace',
                        color: promoTypeColors[promo.promo_type] || 'var(--text-muted)',
                        background: 'var(--bg-elevated)',
                        padding: '1px 5px',
                        borderRadius: 3,
                      }}>
                        {promo.promo_type.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    {promo.promo_text}
                  </div>
                  <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: 'var(--text-muted)' }}>
                    Detected {new Date(promo.detected_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
