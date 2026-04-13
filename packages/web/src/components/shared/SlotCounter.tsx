interface SlotCounterProps {
  trackingSlots: number
  blockingSlots: number
  monthlyCost: number
}

export default function SlotCounter({ trackingSlots, blockingSlots, monthlyCost }: SlotCounterProps) {
  const totalSlots = trackingSlots + blockingSlots
  const nextTier = totalSlots < 10 ? 10 : totalSlots < 20 ? 20 : totalSlots < 50 ? 50 : null
  const slotsToNextTier = nextTier ? nextTier - totalSlots : null

  return (
    <div className="card" style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
      <div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Space Mono, monospace', marginBottom: 4 }}>
          TRACKING SLOTS
        </div>
        <div style={{ fontSize: 24, fontFamily: 'Space Mono, monospace', color: 'var(--accent-intel)' }}>
          {trackingSlots}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Space Mono, monospace', marginBottom: 4 }}>
          BLOCKING SLOTS
        </div>
        <div style={{ fontSize: 24, fontFamily: 'Space Mono, monospace', color: 'var(--accent-block)' }}>
          {blockingSlots}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Space Mono, monospace', marginBottom: 4 }}>
          MONTHLY COST
        </div>
        <div style={{ fontSize: 24, fontFamily: 'Space Mono, monospace', color: 'var(--text-primary)' }}>
          ${monthlyCost.toLocaleString()}
        </div>
      </div>
      {slotsToNextTier && (
        <div style={{ marginLeft: 'auto' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            {slotsToNextTier} more slot{slotsToNextTier !== 1 ? 's' : ''} for volume discount
          </div>
        </div>
      )}
    </div>
  )
}
