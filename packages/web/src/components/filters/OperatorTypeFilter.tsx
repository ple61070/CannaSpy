/**
 * OperatorTypeFilter — 3-way toggle: Storefronts / Delivery / Both
 *
 * Used on every screen that lists or maps competitors / dispensaries.
 * "Both" is the default — shows all operator types with no filter applied.
 *
 * Usage:
 *   const [operatorType, setOperatorType] = useState<OperatorType>('both')
 *   <OperatorTypeFilter value={operatorType} onChange={setOperatorType} />
 */

export type OperatorType = 'storefront' | 'delivery' | 'both'

interface OperatorTypeFilterProps {
  value: OperatorType
  onChange: (value: OperatorType) => void
  className?: string
}

const OPTIONS: { value: OperatorType; label: string; icon: string }[] = [
  { value: 'storefront', label: 'Storefronts', icon: '🏪' },
  { value: 'delivery',   label: 'Delivery',    icon: '🚗' },
  { value: 'both',       label: 'Both',         icon: '⊕'  },
]

export function OperatorTypeFilter({ value, onChange, className = '' }: OperatorTypeFilterProps) {
  return (
    <div
      role="group"
      aria-label="Filter by operator type"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 2,
        padding: 3,
        borderRadius: 8,
        border: '1px solid var(--border-2)',
        background: 'var(--surface-2)',
      }}
    >
      {OPTIONS.map((opt) => {
        const active = value === opt.value
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 10px',
              borderRadius: 6,
              border: 'none',
              fontSize: 11,
              fontWeight: 600,
              fontFamily: 'var(--sans)',
              cursor: 'pointer',
              transition: 'background 0.12s, color 0.12s',
              background: active ? '#1d9e75' : 'transparent',
              color: active ? '#ffffff' : 'var(--text-2)',
              whiteSpace: 'nowrap',
            }}
          >
            <span aria-hidden="true">{opt.icon}</span>
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
