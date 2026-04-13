import { useEffect, useState } from 'react'
import { useAuthFetch } from '../lib/useAuthFetch'
import SlotCounter from '../components/shared/SlotCounter'

const API = import.meta.env.VITE_API_URL ?? ''

interface UsageData {
  tracking_slots: number
  blocking_slots: number
  total_slots: number
  monthly_cost: number
  next_tier_at: number | null
}

export default function BillingUsage() {
  const authFetch = useAuthFetch()
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  useEffect(() => {
    authFetch(`${API}/api/v1/billing/usage`)
      .then((r) => r.json())
      .then((data) => { setUsage(data.data || null); setLoading(false) })
  }, [])

  const handleCheckout = async () => {
    setCheckoutLoading(true)
    const res = await authFetch(`${API}/api/v1/billing/checkout`, { method: 'POST' })
    const data = await res.json()
    const url = data.url || data.data?.url
    if (url) window.location.href = url
    setCheckoutLoading(false)
  }

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 24 }}>
        Billing & Slot Usage
      </h1>

      {loading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading usage data...</div>
      ) : usage ? (
        <>
          <div style={{ marginBottom: 24 }}>
            <SlotCounter
              trackingSlots={usage.tracking_slots}
              blockingSlots={usage.blocking_slots}
              monthlyCost={usage.monthly_cost}
            />
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Space Mono, monospace', marginBottom: 12 }}>
              PRICING
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
              <div>1–9 slots: <span style={{ fontFamily: 'Space Mono, monospace', color: 'var(--text-primary)' }}>$100/slot</span></div>
              <div>10–19 slots: <span style={{ fontFamily: 'Space Mono, monospace', color: 'var(--text-primary)' }}>$95/slot (5% off)</span></div>
              <div>20–49 slots: <span style={{ fontFamily: 'Space Mono, monospace', color: 'var(--text-primary)' }}>$90/slot (10% off)</span></div>
              <div>50+ slots: <span style={{ fontFamily: 'Space Mono, monospace', color: 'var(--text-primary)' }}>$85/slot (15% off)</span></div>
            </div>
          </div>

          {usage.next_tier_at && (
            <div style={{
              background: 'rgba(29, 158, 117, 0.08)',
              border: '1px solid rgba(29, 158, 117, 0.2)',
              borderRadius: 6,
              padding: '10px 16px',
              marginBottom: 24,
              fontSize: 13,
              color: 'var(--accent-intel)',
            }}>
              Add {usage.next_tier_at - usage.total_slots} more slot{(usage.next_tier_at - usage.total_slots) !== 1 ? 's' : ''} to unlock the next volume discount tier.
            </div>
          )}

          <button className="btn btn-primary" onClick={handleCheckout} disabled={checkoutLoading}>
            {checkoutLoading ? 'Redirecting...' : 'Manage subscription'}
          </button>
        </>
      ) : null}
    </div>
  )
}
