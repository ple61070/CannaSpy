import { useNavigate } from 'react-router-dom'
import { useBlocks } from '../hooks/useBlocks'
import BlockCard from '../components/blocking/BlockCard'
import EmptyState from '../components/shared/EmptyState'

export default function BlockManagement() {
  const navigate = useNavigate()
  const { blocks, loading } = useBlocks()

  const totalBlockCost = blocks.length * 100

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
            Block Management
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Rivals suppressed from CannaSpy's prospect list for as long as your blocks are active.
          </p>
        </div>
        <button
          className="btn btn-block"
          onClick={() => navigate('/setup/competitors')}
        >
          Block this rival
        </button>
      </div>

      {blocks.length > 0 && (
        <div style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
          borderRadius: 6,
          padding: '10px 16px',
          marginBottom: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            {blocks.length} rival{blocks.length !== 1 ? 's' : ''} currently suppressed
          </span>
          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 12, color: 'var(--accent-block)' }}>
            ${totalBlockCost}/mo in blocking fees
          </span>
        </div>
      )}

      {loading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading blocks...</div>
      ) : blocks.length === 0 ? (
        <EmptyState screen="blocks" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {blocks.map((block) => (
            <BlockCard key={block.id} block={block} />
          ))}
        </div>
      )}
    </div>
  )
}
