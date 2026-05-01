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
      className={`inline-flex items-center rounded-md border border-white/10 bg-white/5 p-0.5 ${className}`}
      role="group"
      aria-label="Filter by operator type"
    >
      {OPTIONS.map((opt) => {
        const active = value === opt.value
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            style={
              active
                ? {
                    backgroundColor: 'var(--accent-intel)',
                    color: '#ffffff',
                    borderColor: 'transparent',
                  }
                : {
                    backgroundColor: 'transparent',
                    color: 'rgba(255,255,255,0.55)',
                    borderColor: 'transparent',
                  }
            }
            className="flex items-center gap-1.5 rounded px-3 py-1 text-xs font-medium transition-all duration-150 hover:text-white cursor-pointer border"
          >
            <span aria-hidden="true">{opt.icon}</span>
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
