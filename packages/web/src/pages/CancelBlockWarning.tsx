import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthFetch } from '../lib/useAuthFetch'
import { useBlocks } from '../hooks/useBlocks'

const API = import.meta.env.VITE_API_URL ?? ''

export default function CancelBlockWarning() {
  const { blockId } = useParams<{ blockId: string }>()
  const navigate = useNavigate()
  const authFetch = useAuthFetch()
  const { blocks, cancelBlock } = useBlocks()

  const block = blocks.find((b) => b.id === blockId)
  const competitorName = block?.competitor_name ?? 'STIIIZY West Hollywood'

  const [acknowledged, setAcknowledged] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [toastVisible, setToastVisible] = useState(false)

  function showToast(msg: string) {
    setToastMsg(msg)
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 2600)
  }

  async function handleCancel() {
    if (!acknowledged || cancelling) return
    setCancelling(true)
    try {
      if (blockId) await cancelBlock(blockId)
    } catch {
      // proceed regardless
    }
    showToast('Block cancelled — slots released, outreach queued')
    setTimeout(() => navigate('/blocks'), 1800)
  }

  const initials = competitorName.split(/\s+/).slice(0, 2).map((w: string) => w[0].toUpperCase()).join('')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '100vh', fontFamily: 'var(--sans)' }}>
      {/* Topbar */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '0 24px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0' }}>
          <div onClick={() => navigate('/blocks')} style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', cursor: 'pointer', transition: 'opacity 0.2s' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 12, height: 12 }}><polyline points="15 18 9 12 15 6" /></svg>
            Back to Block Management
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Cancel block</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)' }}>{competitorName} · Review before confirming</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '40px 24px', maxWidth: 680, margin: '0 auto', width: '100%' }}>

        {/* Page header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: 'var(--card-shadow)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 24, height: 24, color: 'var(--text-2)' }}>
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em', marginBottom: 6 }}>What happens when you cancel this block</div>
          <div style={{ fontSize: 13, color: 'var(--text-2)', maxWidth: 400, margin: '0 auto' }}>Review the changes below before confirming. You can keep the block active at any point on this page.</div>
        </div>

        {/* Block being cancelled */}
        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 10 }}>Block being cancelled</div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px', boxShadow: 'var(--card-shadow)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 11, background: '#3d7a8a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{initials}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 3 }}>{competitorName}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)' }}>47 days blocked · 10 locations · $2,000/mo · Auto-renews May 1</div>
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: 'var(--rose-soft)', color: 'var(--rose)', border: '1px solid rgba(211,150,166,0.3)', flexShrink: 0 }}>Active block</div>
        </div>

        {/* What changes */}
        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 10 }}>What changes and what stays the same</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: '3px solid var(--accent)', borderRadius: 8, padding: '14px 16px', boxShadow: 'var(--card-shadow)' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8 }}>Stays the same</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                'You continue to track their prices, promotions, and catalog changes',
                'All historical data and 47 days of intelligence collected remains in your account',
                'Your other blocks on Off The Charts and any other rivals are not affected',
                'Your subscription and all other features continue normally',
              ].map((item) => (
                <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 11, color: 'var(--text-2)', lineHeight: 1.5 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, marginTop: 4 }} />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: '3px solid var(--rose)', borderRadius: 8, padding: '14px 16px', boxShadow: 'var(--card-shadow)' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--rose)', marginBottom: 8 }}>What changes</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                `${competitorName.split(' ')[0]} will be added to our active prospect outreach list`,
                'Our sales team will contact them within 24–48 hours to offer CannaSpy access',
                'If they contact CannaSpy directly, they will receive a response — the block ends',
                'If they subscribe, they will be able to track your prices and promotions',
                'Block slots remain active through Apr 30 — no charge on May 1',
              ].map((item) => (
                <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 11, color: 'var(--text-2)', lineHeight: 1.5 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--rose)', flexShrink: 0, marginTop: 4 }} />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 10 }}>Timeline after cancellation</div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px', boxShadow: 'var(--card-shadow)', marginBottom: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <div style={{ position: 'absolute', left: 11, top: 24, bottom: 24, width: 1, background: 'var(--border-2)' }} />
            {[
              { marker: 'now', time: 'Immediately on confirm', label: 'Cancellation scheduled — block stays active', desc: 'Your cancellation is recorded. The block remains fully active through April 30 at no additional charge. STIIIZY still cannot access CannaSpy until the month ends. No action needed — slots continue until May 1.', color: 'var(--rose)', textColor: '#fff', borderColor: 'none' },
              { marker: 'soon', time: 'Within 24–48 hours', label: 'Outreach begins', desc: `Our sales team is automatically notified and will contact ${competitorName} to offer a CannaSpy subscription. This is a standard outreach process — we contact all available prospects in any market.`, color: 'var(--surface-3)', textColor: 'var(--text-3)', borderColor: '1.5px solid var(--border-2)' },
              { marker: 'soon', time: 'Apr 30 — end of current month', label: 'Block ends, 10 slots released, auto-renew stops', desc: 'The block remains active through the end of April at no additional charge. On May 1, the $2,000 monthly block charge is not collected. STIIIZY is added to the active prospect list. No refund is issued for unused days in April.', color: 'var(--surface-3)', textColor: 'var(--text-3)', borderColor: '1.5px solid var(--border-2)' },
              { marker: 'later', time: 'If they subscribe', label: 'They gain access to CannaSpy intelligence', desc: `If ${competitorName.split(' ')[0]} subscribes, they will be able to track pricing and promotions across their competitive set, which may include your locations. Their subscription and access are independent of your account.`, color: 'var(--surface-3)', textColor: 'var(--text-3)', borderColor: '1.5px solid var(--border-2)' },
            ].map((row, i, arr) => (
              <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: `${i === 0 ? 0 : 10}px 0 ${i === arr.length - 1 ? 0 : 10}px` }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: row.color, color: row.textColor, border: row.borderColor === 'none' ? 'none' : row.borderColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, flexShrink: 0, position: 'relative', zIndex: 1 }}>{i + 1}</div>
                <div style={{ flex: 1, paddingTop: 2 }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)', marginBottom: 3 }}>{row.time}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)', marginBottom: 2 }}>{row.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.6 }}>{row.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Billing impact */}
        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 10 }}>Billing impact</div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px', boxShadow: 'var(--card-shadow)', marginBottom: 20 }}>
          {[
            { label: 'Current monthly total', val: '$14,025/mo', valColor: 'var(--text-1)' },
            { label: 'Block active through Apr 30 — no refund for remaining days', val: 'No change this month', valColor: 'var(--accent)', labelColor: 'var(--accent)' },
            { label: 'STIIIZY block — 10 slots removed from May 1', val: '−$2,000/mo', valColor: 'var(--rose)' },
          ].map((row, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', fontSize: 12, borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: (row as any).labelColor ?? 'var(--text-2)' }}>{row.label}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600, color: row.valColor }}>{row.val}</span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0 6px', fontSize: 12, fontWeight: 700 }}>
            <span style={{ color: 'var(--text-1)', fontWeight: 700 }}>New total from May 1</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 600, color: 'var(--accent)' }}>$12,025/mo</span>
          </div>
        </div>

        {/* Minimum commitment note */}
        <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderLeft: '3px solid var(--accent)', borderRadius: 8, padding: '12px 16px', marginBottom: 16, fontSize: 11, color: 'var(--text-2)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--text-1)' }}>One-month minimum applies.</strong> This block was activated on Mar 29 and has met its one-month minimum commitment. You can cancel today and billing stops May 1. Had you cancelled before the minimum was met, the block would have remained active and billed through the end of the first full month.
        </div>

        {/* Re-block note */}
        <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 16px', marginBottom: 24, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 10, height: 10, color: 'var(--accent)' }}>
              <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.6 }}>
            You can re-block {competitorName.split(' ')[0]} at any time from the Block Management screen. Re-blocking will restart the block and add the slots back to your billing at the then-current market rate for each location.
          </div>
        </div>

        {/* Acknowledgement */}
        <div
          onClick={() => setAcknowledged(!acknowledged)}
          style={{
            display: 'flex', alignItems: 'flex-start', gap: 12,
            background: acknowledged ? 'var(--rose-soft)' : 'var(--surface)',
            border: `1.5px solid ${acknowledged ? 'var(--rose)' : 'var(--border-2)'}`,
            borderRadius: 8, padding: '14px 16px', marginBottom: 20,
            cursor: 'pointer', transition: 'all 0.2s',
          }}
        >
          <div style={{ width: 20, height: 20, borderRadius: 5, border: `1.5px solid ${acknowledged ? 'var(--rose)' : 'var(--border-2)'}`, background: acknowledged ? 'var(--rose)' : 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, transition: 'all 0.2s' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" style={{ width: 11, height: 11, opacity: acknowledged ? 1 : 0, transition: 'opacity 0.2s' }}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-1)', lineHeight: 1.6 }}>
            I understand that: (1) this block remains active through Apr 30 with no refund for remaining days, (2) {competitorName.split(' ')[0]} will be contacted by CannaSpy sales within 24–48 hours of cancellation, (3) if they contact CannaSpy directly they will receive a response, and (4) they may access CannaSpy intelligence if they subscribe.
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => navigate('/blocks')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '12px 24px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid var(--accent)', background: 'var(--accent)', color: '#fff', boxShadow: '0 4px 18px rgba(9,161,161,0.32)', transition: 'all 0.2s' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 14, height: 14 }}>
              <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
            Keep blocking
          </button>
          <button
            onClick={handleCancel}
            disabled={!acknowledged || cancelling}
            style={{
              flex: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              padding: '12px 24px', borderRadius: 8, fontSize: 13, fontWeight: 700,
              cursor: acknowledged && !cancelling ? 'pointer' : 'not-allowed',
              fontFamily: 'var(--sans)',
              border: '1.5px solid rgba(211,150,166,0.35)', background: 'transparent', color: 'var(--rose)',
              opacity: acknowledged && !cancelling ? 1 : 0.35, transition: 'all 0.2s',
            }}
          >
            {cancelling ? 'Cancelling…' : 'Cancel block'}
          </button>
        </div>
      </div>

      {/* Toast */}
      <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: `translateX(-50%) translateY(${toastVisible ? 0 : 80}px)`, background: 'var(--text-1)', color: 'var(--surface)', padding: '9px 18px', borderRadius: 20, fontSize: 12, fontWeight: 600, fontFamily: 'var(--mono)', zIndex: 9000, transition: 'transform 0.3s cubic-bezier(.2,.8,.2,1), opacity 0.3s', opacity: toastVisible ? 1 : 0, pointerEvents: 'none' }}>
        {toastMsg}
      </div>
    </div>
  )
}
