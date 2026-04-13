interface EmptyStateProps {
  screen: 'alerts' | 'competitors' | 'blocks' | 'prices' | 'promotions' | 'locations'
  locationCount?: number
  lastChecked?: string
}

const messages: Record<EmptyStateProps['screen'], (props: EmptyStateProps) => { headline: string; sub: string }> = {
  alerts: ({ locationCount = 0, lastChecked }) => ({
    headline: `All clear across ${locationCount} market${locationCount !== 1 ? 's' : ''}.`,
    sub: `Last checked ${lastChecked || 'just now'}. No competitor changes detected.`,
  }),
  competitors: () => ({
    headline: 'Add your first rival to start monitoring.',
    sub: 'Use competitor discovery to find dispensaries near your location.',
  }),
  blocks: () => ({
    headline: 'No rivals currently suppressed.',
    sub: 'Add a block to start building your moat.',
  }),
  prices: () => ({
    headline: 'No price data yet.',
    sub: 'Prices will appear after the first scrape completes.',
  }),
  promotions: () => ({
    headline: 'No active promotions detected.',
    sub: 'Competitor promotions will appear here within hours of launch.',
  }),
  locations: () => ({
    headline: 'No locations configured.',
    sub: 'Add your first dispensary location to begin monitoring.',
  }),
}

export default function EmptyState({ screen, locationCount, lastChecked }: EmptyStateProps) {
  const { headline, sub } = messages[screen]({ screen, locationCount, lastChecked })

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '64px 32px',
      textAlign: 'center',
    }}>
      <div style={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-default)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        fontSize: 18,
      }}>
        {screen === 'alerts' ? '✓' : screen === 'blocks' ? '◎' : '—'}
      </div>
      <div style={{
        fontSize: 15,
        fontWeight: 500,
        color: 'var(--text-primary)',
        marginBottom: 8,
      }}>
        {headline}
      </div>
      <div style={{
        fontSize: 13,
        color: 'var(--text-secondary)',
        maxWidth: 360,
      }}>
        {sub}
      </div>
    </div>
  )
}
