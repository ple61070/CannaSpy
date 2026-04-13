interface CompetitorRowProps {
  competitor: {
    competitor_id: string
    name: string
    address: string
    platform?: string
    last_scraped?: string
    slot_type: string
  }
  onClick?: () => void
}

export default function CompetitorRow({ competitor, onClick }: CompetitorRowProps) {
  const lastScraped = competitor.last_scraped
    ? new Date(competitor.last_scraped).toLocaleString()
    : 'Never scraped'

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '10px 0',
        borderBottom: '1px solid var(--border-subtle)',
        cursor: onClick ? 'pointer' : 'default',
        gap: 16,
      }}
      onClick={onClick}
    >
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
            {competitor.name}
          </span>
          {competitor.platform && competitor.platform !== 'unknown' && (
            <span style={{
              fontSize: 10,
              fontFamily: 'Space Mono, monospace',
              color: 'var(--accent-trust)',
              background: 'rgba(59, 139, 212, 0.1)',
              padding: '1px 5px',
              borderRadius: 3,
            }}>
              {competitor.platform.toUpperCase()}
            </span>
          )}
          {competitor.slot_type === 'block' && (
            <span style={{
              fontSize: 10,
              fontFamily: 'Space Mono, monospace',
              color: 'var(--accent-block)',
              background: 'rgba(186, 117, 23, 0.1)',
              padding: '1px 5px',
              borderRadius: 3,
            }}>
              BLOCKED
            </span>
          )}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{competitor.address}</div>
      </div>
      <div style={{
        fontFamily: 'Space Mono, monospace',
        fontSize: 11,
        color: 'var(--text-muted)',
        whiteSpace: 'nowrap',
      }}>
        {lastScraped}
      </div>
    </div>
  )
}
