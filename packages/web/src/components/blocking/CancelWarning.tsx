interface CancelWarningProps {
  competitorName: string
  onConfirm: () => void
  onKeep: () => void
  isLoading?: boolean
}

export default function CancelWarning({ competitorName, onConfirm, onKeep, isLoading }: CancelWarningProps) {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
    }}>
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-strong)',
        borderTop: '2px solid var(--accent-block)',
        borderRadius: 8,
        padding: 32,
        maxWidth: 480,
        width: '100%',
      }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>
          Cancel block on {competitorName}?
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 8 }}>
          Canceling this block will re-add <strong style={{ color: 'var(--text-primary)' }}>{competitorName}</strong> to our active prospect list. Our team typically follows up within 24–48 hours.
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 24 }}>
          This change takes effect immediately.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onKeep} disabled={isLoading}>
            Keep block active
          </button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? 'Canceling...' : 'Cancel this block'}
          </button>
        </div>
      </div>
    </div>
  )
}
