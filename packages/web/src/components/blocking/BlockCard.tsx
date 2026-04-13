import { useNavigate } from 'react-router-dom'

interface BlockCardProps {
  block: {
    id: string
    competitor_name: string
    competitor_address: string
    blocked_at: string
    notify_on_unblock: boolean
  }
}

export default function BlockCard({ block }: BlockCardProps) {
  const navigate = useNavigate()
  const blockedDate = new Date(block.blocked_at).toLocaleDateString()

  return (
    <div className="card card-block" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{
            fontSize: 11,
            fontFamily: 'Space Mono, monospace',
            color: 'var(--accent-block)',
            background: 'rgba(186, 117, 23, 0.1)',
            padding: '2px 6px',
            borderRadius: 4,
          }}>
            BLOCKED
          </span>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
            {block.competitor_name}
          </span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
          {block.competitor_address}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Space Mono, monospace' }}>
          Blocked {blockedDate} · This competitor cannot access CannaSpy while this block is active
        </div>
      </div>
      <button
        className="btn btn-ghost"
        style={{ fontSize: 12, padding: '6px 12px', whiteSpace: 'nowrap' }}
        onClick={() => navigate(`/blocks/${block.id}/cancel`)}
      >
        Cancel block
      </button>
    </div>
  )
}
